import supabaseLib from './lib/supabase.js';
import resendLib from './lib/resend.js';

const { findOneByFilters, encodeEq, updateRecord } = supabaseLib;
const { sendEmail } = resendLib;

const TOKEN_RE = /^[A-Za-z0-9_-]{16,128}$/;

function json(statusCode, body) {
  return new Response(JSON.stringify(body), {
    status: statusCode,
    headers: { 'Content-Type': 'application/json' },
  });
}

// POST-only, same reasoning as verify-token.js: the actual accept
// (mutating, sends the user a real email) only ever fires from an
// explicit button click on accept-advisor-lead.html, never from a mere
// page load or an email-security-scanner prefetching the link in the
// advisor's inbox.
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

  const token = typeof payload.token === 'string' ? payload.token : '';
  if (!token || !TOKEN_RE.test(token)) {
    return json(400, { ok: false, error: 'invalid' });
  }

  try {
    const delivery = await findOneByFilters('advisor_lead_deliveries', [`accept_token=${encodeEq(token)}`]);
    if (!delivery) {
      return json(404, { ok: false, error: 'invalid' });
    }
    if (delivery.status === 'accepted') {
      return json(410, { ok: false, error: 'already_accepted' });
    }
    if (new Date(delivery.expires_at).getTime() < Date.now()) {
      return json(410, { ok: false, error: 'expired' });
    }

    const reviewRequest = await findOneByFilters('advisor_review_requests', [
      `id=${encodeEq(delivery.advisor_review_request_id)}`,
    ]);
    const advisor = await findOneByFilters('advisors', [`id=${encodeEq(delivery.advisor_id)}`]);
    if (!reviewRequest || !advisor) {
      return json(404, { ok: false, error: 'not_found' });
    }

    await updateRecord('advisor_lead_deliveries', delivery.id, {
      status: 'accepted',
      accepted_at: new Date().toISOString(),
    });
    await updateRecord('advisor_review_requests', reviewRequest.id, {
      status: 'Matched',
      status_changed_at: new Date().toISOString(),
    });

    // This is the moment the site's own copy already promises ("the
    // advisor shares their background first, you decide") — nothing
    // automated this before. The advisor never receives the user's
    // contact info in this flow at all; the user reaches out via the
    // advisor's own scheduling link, keeping the "user holds the
    // leverage" design intent intact.
    const advisorFirm = advisor.firm ? ` at ${advisor.firm}` : '';
    const schedulingLine = advisor.scheduling_link
      ? `<p>Book time directly here: <a href="${advisor.scheduling_link}">${advisor.scheduling_link}</a></p>`
      : '<p>Our team will follow up shortly with scheduling details.</p>';
    const schedulingText = advisor.scheduling_link
      ? `Book time directly here: ${advisor.scheduling_link}`
      : 'Our team will follow up shortly with scheduling details.';

    await sendEmail({
      to: reviewRequest.email,
      subject: "You've been matched with an advisor",
      text:
        `Good news — ${advisor.name}${advisorFirm} has reviewed your situation and is ready to talk.\n\n` +
        `${schedulingText}\n\n` +
        `No pressure, no obligation — take a look at their background and reach out whenever works for you.`,
      html:
        `<p>Good news — <strong>${advisor.name}</strong>${advisorFirm} has reviewed your situation and is ready to talk.</p>` +
        schedulingLine +
        `<p>No pressure, no obligation — take a look at their background and reach out whenever works for you.</p>`,
    });

    return json(200, { ok: true });
  } catch (err) {
    console.error('accept-advisor-lead error:', err);
    return json(500, { ok: false, error: 'server_error' });
  }
};

export const config = {
  rateLimit: {
    windowLimit: 10,
    windowSize: 60,
    aggregateBy: ['ip', 'domain'],
  },
};
