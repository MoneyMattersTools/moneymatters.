import crypto from 'node:crypto';
import airtableLib from './lib/airtable.js';
import resendLib from './lib/resend.js';

const { findByEmail, findActiveTokenByEmail, createRecord, countRecentRequestsByIp } = airtableLib;
const { sendEmail } = resendLib;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const EMAIL_MAX_LENGTH = 254;
const TOKEN_TTL_SECONDS = 30 * 60;
const TOKEN_TTL_MS = TOKEN_TTL_SECONDS * 1000;

const IP_RATE_LIMIT_WINDOW_SECONDS = 60;
const IP_RATE_LIMIT_MAX_REQUESTS = 8;

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
      const recentCount = await countRecentRequestsByIp(
        'Verification Tokens',
        clientIp,
        IP_RATE_LIMIT_WINDOW_SECONDS,
        TOKEN_TTL_SECONDS
      );
      if (recentCount >= IP_RATE_LIMIT_MAX_REQUESTS) {
        return json(429, { ok: false, error: 'rate_limited' });
      }
    }

    const existingActive = await findActiveTokenByEmail('Verification Tokens', email);
    if (existingActive) {
      // Same generic response as the "no account" case below — an active
      // cooldown shouldn't leak whether the address has an account either.
      return json(200, { ok: true });
    }

    // Always return the same { ok: true } response whether or not this
    // email has a verified account — this endpoint must not be usable to
    // enumerate registered addresses. The email only actually sends when
    // a matching, verified Users record exists.
    const user = await findByEmail('Users', email);
    if (user && user.fields && user.fields.Verified) {
      const token = crypto.randomBytes(32).toString('base64url');
      const expiresAt = new Date(Date.now() + TOKEN_TTL_MS).toISOString();

      await createRecord('Verification Tokens', {
        Token: token,
        Email: email,
        Purpose: 'returning_login',
        'Expires At': expiresAt,
        'Request IP': clientIp,
      });

      const siteUrl = (process.env.SITE_URL || '').replace(/\/$/, '');
      const link = `${siteUrl}/?verify=${token}`;

      await sendEmail({
        to: email,
        subject: 'Your MoneyMatters login link',
        text: `Click below to log back in and see your Financial Health Score.\n\n${link}\n\nThis link expires in 30 minutes and works once. Didn't request this? Ignore this email.`,
        html: `<p>Click below to log back in and see your Financial Health Score.</p><p><a href="${link}">Log In</a></p><p>This link expires in 30 minutes and works once. Didn't request this? Ignore this email.</p>`,
      });
    }

    return json(200, { ok: true });
  } catch (err) {
    console.error('resend-login error:', err);
    return json(500, { ok: false, error: 'server_error' });
  }
};

export const config = {
  rateLimit: {
    windowLimit: 8,
    windowSize: 60,
    aggregateBy: ['ip', 'domain'],
  },
};
