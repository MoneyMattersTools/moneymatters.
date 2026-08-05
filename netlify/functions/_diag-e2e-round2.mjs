import crypto from 'node:crypto';
import supabaseLib from './lib/supabase.js';
import resendLib from './lib/resend.js';

const { createRecord, findOneByFilters, encodeEq, deleteRecord, listAll } = supabaseLib;
const { sendEmail } = resendLib;

const DELIVERY_TTL_HOURS = 60;
const INVITE_TTL_DAYS = 30;

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
  if (reviewRequest.location) lines.push('Location: ' + reviewRequest.location + '.');
  return lines.length ? lines.join(' ') : 'No additional details provided.';
}

// Temp E2E helper for Round 2 verification. Delete after use.
export default async (request) => {
  const url = new URL(request.url);
  const action = url.searchParams.get('action');

  if (request.method === 'POST' && action === 'create-invite') {
    const token = crypto.randomBytes(32).toString('base64url');
    const expiresAt = new Date(Date.now() + INVITE_TTL_DAYS * 24 * 60 * 60 * 1000).toISOString();
    const invite = await createRecord('advisor_invites', { token, expires_at: expiresAt });
    return json(200, { ok: true, token, inviteId: invite.id });
  }

  if (request.method === 'POST' && action === 'create-advisor') {
    const payload = await request.json();
    const advisor = await createRecord('advisors', {
      name: 'MM Test Advisor Round2',
      firm: 'Test Firm LLC',
      contact_email: payload.advisorEmail,
      scheduling_link: 'https://calendly.com/mm-test-advisor-round2',
      licensed_states: ['PA'],
      specialty_tags: ['Saving for retirement'],
      accepting: true,
    });
    return json(200, { ok: true, advisorId: advisor.id });
  }

  if (request.method === 'POST' && action === 'create-lead') {
    const payload = await request.json();
    const advisorRow = await findOneByFilters('advisors', [`contact_email=${encodeEq(payload.advisorEmail)}`]);
    if (!advisorRow) return json(404, { ok: false, error: 'advisor_not_found' });

    const reviewRequest = await createRecord('advisor_review_requests', {
      email: payload.userEmail,
      situational_details: ['Saving for retirement'],
      details: 'Round 2 E2E test — safe to ignore, will be deleted after verification.',
      location: 'Bucks County, PA',
      urgency: 'now',
      requested_at: new Date().toISOString(),
      request_ip: 'diag-e2e-round2',
      status: 'Requested',
    });

    const snapshot = buildSnapshot(reviewRequest);
    const acceptToken = crypto.randomBytes(32).toString('base64url');
    const now = new Date();
    const expiresAt = new Date(now.getTime() + DELIVERY_TTL_HOURS * 60 * 60 * 1000).toISOString();
    const delivery = await createRecord('advisor_lead_deliveries', {
      advisor_review_request_id: reviewRequest.id,
      advisor_id: advisorRow.id,
      accept_token: acceptToken,
      snapshot_text: snapshot,
      status: 'pending',
      assigned_at: now.toISOString(),
      expires_at: expiresAt,
    });
    await createRecord('advisor_consent_log', {
      advisor_review_request_id: reviewRequest.id,
      advisor_id: advisorRow.id,
      shared_snapshot: { text: snapshot },
      consent_state: { consent: false },
    });

    const siteUrl = (process.env.SITE_URL || '').replace(/\/$/, '');
    const acceptLink = `${siteUrl}/accept-advisor-lead.html?token=${acceptToken}`;
    await sendEmail({
      to: advisorRow.contact_email,
      subject: 'New MoneyMatters lead available (Round 2 E2E test)',
      text: `Test lead:\n\n${snapshot}\n\nAccept here: ${acceptLink}`,
      html: `<p>Test lead:</p><p>${snapshot}</p><p><a href="${acceptLink}">I'll take this lead</a></p>`,
    });

    return json(200, {
      ok: true,
      reviewRequestId: reviewRequest.id,
      deliveryId: delivery.id,
      acceptToken,
    });
  }

  if (request.method === 'GET' && action === 'verify') {
    const reviewRequestId = url.searchParams.get('reviewRequestId');
    const reviewRequest = await findOneByFilters('advisor_review_requests', [`id=${encodeEq(reviewRequestId)}`]);
    return json(200, {
      ok: true,
      status: reviewRequest ? reviewRequest.status : null,
      statusChangedAt: reviewRequest ? reviewRequest.status_changed_at || null : null,
    });
  }

  if (request.method === 'DELETE' && action === 'cleanup') {
    const payload = await request.json();
    if (payload.inviteToken) {
      const invite = await findOneByFilters('advisor_invites', [`token=${encodeEq(payload.inviteToken)}`]);
      if (invite) await deleteRecord('advisor_invites', invite.id);
    }
    if (payload.reviewRequestId) {
      const consentLog = await findOneByFilters('advisor_consent_log', [`advisor_review_request_id=${encodeEq(payload.reviewRequestId)}`]);
      if (consentLog) await deleteRecord('advisor_consent_log', consentLog.id);
    }
    if (payload.deliveryId) await deleteRecord('advisor_lead_deliveries', payload.deliveryId);
    if (payload.reviewRequestId) await deleteRecord('advisor_review_requests', payload.reviewRequestId);
    if (payload.advisorId) await deleteRecord('advisors', payload.advisorId);
    if (payload.advisorEmailToPurge) {
      const allAdvisors = await listAll('advisors');
      const matches = allAdvisors.filter((a) => a.contact_email === payload.advisorEmailToPurge);
      for (const m of matches) await deleteRecord('advisors', m.id);
    }
    if (payload.tokenEmail) {
      const tokenRow = await findOneByFilters('verification_tokens', [`email=${encodeEq(payload.tokenEmail)}`]);
      if (tokenRow) await deleteRecord('verification_tokens', tokenRow.id);
    }
    return json(200, { ok: true, cleaned: true });
  }

  return json(400, { ok: false, error: 'unknown_action' });
};
