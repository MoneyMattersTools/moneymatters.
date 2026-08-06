import crypto from 'node:crypto';
import supabaseLib from './lib/supabase.js';
import adminAuthLib from './lib/admin-auth.js';
import resendLib from './lib/resend.js';

const { findOneByFilters, encodeEq, createRecord } = supabaseLib;
const { checkAdminPassword } = adminAuthLib;
const { sendEmail } = resendLib;

const DELIVERY_TTL_HOURS = 60; // "48-72 hours" per SITE_STRATEGY.md; 60h is the midpoint

function json(statusCode, body) {
  return new Response(JSON.stringify(body), {
    status: statusCode,
    headers: { 'Content-Type': 'application/json' },
  });
}

// Builds the advisor-facing snapshot from what the site actually collects
// today. SITE_STRATEGY.md's locked narrative format ("Sarah, early 40s, 2
// children, Bucks County PA, $500k investible assets, expecting
// inheritance") assumes a first name, age bracket, and family composition
// - none of which any intake flow on this site collects yet, and adding
// them isn't in this build's scope (not listed in the MVP build order).
// Rather than fabricate placeholder values, this uses only real fields:
// situational details, free-text notes, location, urgency, and financial
// signals only when the user actually opted in to share them. No name or
// contact info at all — stricter than the locked spec's "first name
// only", not looser: the advisor accepts blind, on the snapshot alone,
// and only the *user* is notified afterward (with the advisor's info) —
// matching "the user holds the leverage" design intent even more
// conservatively than originally spec'd, since a first name was never
// collected to begin with.
function buildSnapshot(reviewRequest) {
  const lines = [];
  if (Array.isArray(reviewRequest.situational_details) && reviewRequest.situational_details.length) {
    lines.push('Looking for help with: ' + reviewRequest.situational_details.join(', ') + '.');
  }
  if (reviewRequest.urgency) {
    const urgencyLabel =
      { now: "ready to start now", next_few_months: 'looking to start in the next few months', just_exploring: 'just exploring for now' }[
        reviewRequest.urgency
      ] || reviewRequest.urgency;
    lines.push('Timeline: ' + urgencyLabel + '.');
  }
  if (reviewRequest.location) {
    lines.push('Location: ' + reviewRequest.location + '.');
  }
  if (reviewRequest.shared_scores && reviewRequest.shared_scores.consent) {
    if (reviewRequest.shared_scores.netWorthRange) {
      lines.push('Net worth range: ' + reviewRequest.shared_scores.netWorthRange + '.');
    }
    if (reviewRequest.shared_scores.healthScoreBand) {
      lines.push('Financial Health Score band: ' + reviewRequest.shared_scores.healthScoreBand + '.');
    }
    if (reviewRequest.shared_scores.creditScoreRange) {
      lines.push('Credit score range: ' + reviewRequest.shared_scores.creditScoreRange + '.');
    }
    if (reviewRequest.shared_scores.householdIncomeRange) {
      lines.push('Household income range: ' + reviewRequest.shared_scores.householdIncomeRange + '.');
    }
  }
  if (reviewRequest.details) {
    lines.push('In their own words: "' + reviewRequest.details + '"');
  }
  return lines.length ? lines.join(' ') : 'No additional details provided.';
}

export default async (request) => {
  if (request.method !== 'POST') {
    return json(405, { ok: false, error: 'method_not_allowed' });
  }
  if (!checkAdminPassword(request)) {
    return json(401, { ok: false, error: 'unauthorized' });
  }

  let payload;
  try {
    payload = await request.json();
  } catch {
    return json(400, { ok: false, error: 'invalid_json' });
  }

  const requestId = typeof payload.requestId === 'string' ? payload.requestId : '';
  const advisorId = typeof payload.advisorId === 'string' ? payload.advisorId : '';
  if (!requestId || !advisorId) {
    return json(400, { ok: false, error: 'invalid_request' });
  }

  try {
    const reviewRequest = await findOneByFilters('advisor_review_requests', [`id=${encodeEq(requestId)}`]);
    const advisor = await findOneByFilters('advisors', [`id=${encodeEq(advisorId)}`]);
    if (!reviewRequest || !advisor) {
      return json(404, { ok: false, error: 'not_found' });
    }

    const snapshot = buildSnapshot(reviewRequest);
    const acceptToken = crypto.randomBytes(32).toString('base64url');
    const now = new Date();
    const expiresAt = new Date(now.getTime() + DELIVERY_TTL_HOURS * 60 * 60 * 1000).toISOString();

    const delivery = await createRecord('advisor_lead_deliveries', {
      advisor_review_request_id: reviewRequest.id,
      advisor_id: advisor.id,
      accept_token: acceptToken,
      snapshot_text: snapshot,
      status: 'pending',
      assigned_at: now.toISOString(),
      expires_at: expiresAt,
    });

    // Audit trail — written at the moment of actual delivery (the real
    // "share" event), capturing exactly what went out and the user's
    // consent state as it stood then. Per Ethan's fairness/transparency
    // instruction: built in now, not bolted on later.
    await createRecord('advisor_consent_log', {
      advisor_review_request_id: reviewRequest.id,
      advisor_id: advisor.id,
      shared_snapshot: { text: snapshot },
      consent_state: reviewRequest.shared_scores || { consent: false },
    });

    const siteUrl = (process.env.SITE_URL || '').replace(/\/$/, '');
    const acceptLink = `${siteUrl}/accept-advisor-lead.html?token=${acceptToken}`;

    await sendEmail({
      to: advisor.contact_email,
      subject: 'New MoneyMatters lead available',
      text:
        `A new lead matches your profile:\n\n${snapshot}\n\n` +
        `If you'd like to take this lead, accept here: ${acceptLink}\n\n` +
        `This link expires in ${DELIVERY_TTL_HOURS} hours and works once. If you're not able to take it, no action is needed and it will be offered to another advisor.`,
      html:
        `<p>A new lead matches your profile:</p><p>${snapshot}</p>` +
        `<p><a href="${acceptLink}">I'll take this lead</a></p>` +
        `<p>This link expires in ${DELIVERY_TTL_HOURS} hours and works once. If you're not able to take it, no action is needed and it will be offered to another advisor.</p>`,
    });

    return json(200, { ok: true, delivery });
  } catch (err) {
    console.error('admin-assign-advisor error:', err);
    return json(500, { ok: false, error: 'server_error' });
  }
};

export const config = {
  rateLimit: {
    windowLimit: 20,
    windowSize: 60,
    aggregateBy: ['ip', 'domain'],
  },
};
