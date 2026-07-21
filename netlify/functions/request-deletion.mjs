import airtableLib from './lib/airtable.js';
import resendLib from './lib/resend.js';

const { createRecord, findOneByFormula, countRecentByIpSince, escapeFormulaValue } = airtableLib;
const { sendEmail } = resendLib;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const EMAIL_MAX_LENGTH = 254;

// Same application-level IP rate limiting pattern used by submit-diagnostic —
// Netlify's platform-native rate limiting isn't available on this plan tier.
const IP_RATE_LIMIT_WINDOW_SECONDS = 60;
const IP_RATE_LIMIT_MAX_REQUESTS = 5;

function getClientIp(request, context) {
  if (context && typeof context.ip === 'string' && context.ip) return context.ip;
  const headerIp = request.headers.get('x-nf-client-connection-ip');
  if (headerIp) return headerIp;
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) return forwardedFor.split(',')[0].trim();
  return 'unknown';
}

function json(statusCode, body) {
  return new Response(JSON.stringify(body), {
    status: statusCode,
    headers: { 'Content-Type': 'application/json' },
  });
}

export default async (request, context) => {
  if (request.method !== 'POST') {
    return json(405, { ok: false, error: 'method_not_allowed' });
  }

  let payload;
  try {
    payload = await request.json();
  } catch {
    return json(400, { ok: false, error: 'invalid_json' });
  }

  const email = typeof payload.email === 'string' ? payload.email.trim().toLowerCase() : '';
  if (!email || email.length > EMAIL_MAX_LENGTH || !EMAIL_RE.test(email)) {
    return json(400, { ok: false, error: 'invalid_email' });
  }

  const clientIp = getClientIp(request, context);

  try {
    if (clientIp !== 'unknown') {
      const recentCount = await countRecentByIpSince(
        'Deletion Requests',
        clientIp,
        IP_RATE_LIMIT_WINDOW_SECONDS,
        'Requested At'
      );
      if (recentCount >= IP_RATE_LIMIT_MAX_REQUESTS) {
        return json(429, { ok: false, error: 'rate_limited' });
      }
    }

    // Per-email cooldown: don't create a duplicate while a request is still pending.
    const existingPending = await findOneByFormula(
      'Deletion Requests',
      `AND(LOWER({Email}) = '${escapeFormulaValue(email)}', {Status} = 'Pending')`
    );
    if (existingPending) {
      return json(200, { ok: true, alreadyPending: true });
    }

    await createRecord('Deletion Requests', {
      Email: email,
      'Requested At': new Date().toISOString(),
      Status: 'Pending',
      'Request IP': clientIp,
    });

    await sendEmail({
      to: email,
      subject: 'We received your MoneyMatters data deletion request',
      text: `We received a request to delete the MoneyMatters data associated with this email address.\n\nOur team reviews and processes deletion requests within 14 days. Once complete, your account record and any diagnostic answers on file will be permanently removed.\n\nDidn't request this? Contact us and let us know.`,
      html: `<p>We received a request to delete the MoneyMatters data associated with this email address.</p><p>Our team reviews and processes deletion requests within 14 days. Once complete, your account record and any diagnostic answers on file will be permanently removed.</p><p>Didn't request this? Contact us and let us know.</p>`,
    });

    return json(200, { ok: true });
  } catch (err) {
    console.error('request-deletion error:', err);
    return json(500, { ok: false, error: 'server_error' });
  }
};

export const config = {
  rateLimit: {
    windowLimit: 5,
    windowSize: 60,
    aggregateBy: ['ip', 'domain'],
  },
};
