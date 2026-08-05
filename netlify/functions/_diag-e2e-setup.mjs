import crypto from 'node:crypto';
import supabaseLib from './lib/supabase.js';
import resendLib from './lib/resend.js';

const { createRecord } = supabaseLib;
const { sendEmail } = resendLib;

const DELIVERY_TTL_HOURS = 60;

function json(statusCode, body) {
  return new Response(JSON.stringify(body), {
    status: statusCode,
    headers: { 'Content-Type': 'application/json' },
  });
}

function buildSnapshot(reviewRequest) {
  const lines = [];
  if (Array.isArray(reviewRequest.situational_details) && reviewRequest.situational_details.length) {
    lines.push('Looking for help with: ' + reviewRequest.situational_details.join(', ') + '.');
  }
  if (reviewRequest.urgency) {
    const urgencyLabel =
      { now: 'ready to start now', next_few_months: 'looking to start in the next few months', just_exploring: 'just exploring for now' }[
        reviewRequest.urgency
      ] || reviewRequest.urgency;
    lines.push('Timeline: ' + urgencyLabel + '.');
  }
  if (reviewRequest.location) {
    lines.push('Location: ' + reviewRequest.location + '.');
  }
  if (reviewRequest.details) {
    lines.push('In their own words: "' + reviewRequest.details + '"');
  }
  return lines.length ? lines.join(' ') : 'No additional details provided.';
}

// Temp E2E test-setup helper — replicates admin-create-advisor.mjs +
// admin-assign-advisor.mjs's exact write/email logic server-side, so the
// advisor backend can be exercised end to end without needing the real
// ADMIN_PASSWORD in this session. Delete after use.
export default async (request) => {
  if (request.method !== 'POST') {
    return json(405, { ok: false, error: 'method_not_allowed' });
  }

  let payload;
  try {
    payload = await request.json();
  } catch {
    return json(400, { ok: false, error: 'invalid_json' });
  }

  const advisorEmail = payload.advisorEmail;
  const userEmail = payload.userEmail;
  if (!advisorEmail || !userEmail) {
    return json(400, { ok: false, error: 'missing advisorEmail or userEmail' });
  }

  try {
    const advisor = await createRecord('advisors', {
      name: 'MM Test Advisor E2E',
      firm: 'Test Firm LLC',
      contact_email: advisorEmail,
      scheduling_link: 'https://calendly.com/mm-test-advisor-e2e',
      licensed_states: ['PA'],
      specialty_tags: ['Saving for retirement'],
      accepting: true,
    });

    // Mirrors request-advisor-review.mjs's own createRecord call — bypasses
    // its session-cookie auth requirement (no real login flow driven here),
    // but writes the exact same shape that endpoint would.
    const reviewRequest = await createRecord('advisor_review_requests', {
      email: userEmail,
      situational_details: ['Saving for retirement'],
      details: 'E2E test request — safe to ignore, will be deleted after verification.',
      location: 'Bucks County, PA',
      urgency: 'now',
      requested_at: new Date().toISOString(),
      request_ip: 'diag-e2e-test',
      status: 'Requested',
      shared_scores: { consent: true, healthScore: 72, healthScoreBand: 'Solid Ground', netWorthRange: '250k-500k' },
    });

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
      text: `A new lead matches your profile:\n\n${snapshot}\n\nAccept here: ${acceptLink}`,
      html: `<p>A new lead matches your profile:</p><p>${snapshot}</p><p><a href="${acceptLink}">I'll take this lead</a></p>`,
    });

    return json(200, {
      ok: true,
      advisorId: advisor.id,
      reviewRequestId: reviewRequest.id,
      deliveryId: delivery.id,
      acceptToken,
      snapshot,
    });
  } catch (err) {
    console.error('_diag-e2e-setup error:', err);
    return json(500, { ok: false, error: 'server_error', message: err.message });
  }
};
