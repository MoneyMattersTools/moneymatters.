const crypto = require('node:crypto');

// SITE_STRATEGY.md item 4 (locked 2026-08-07): a single shared access code
// gates entry to the advisor onboarding form, so registration stays
// limited to advisors Ethan has actually invited. Deliberately reuses
// SESSION_SECRET for signing rather than adding a second secret env var —
// this is a low-stakes anti-spam gate, not user auth, so a separate
// signing key buys nothing. Same signed-cookie shape as lib/session.js.
const COOKIE_NAME = 'mm_advisor_access';
const MAX_AGE_SECONDS = 60 * 60 * 24; // 24 hours — re-enter the code on a later visit

function getSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error('SESSION_SECRET is not configured');
  return secret;
}

function sign(payloadB64) {
  return crypto.createHmac('sha256', getSecret()).update(payloadB64).digest('base64url');
}

function signGrant() {
  const body = { granted: true, exp: Math.floor(Date.now() / 1000) + MAX_AGE_SECONDS };
  const payloadB64 = Buffer.from(JSON.stringify(body)).toString('base64url');
  return `${payloadB64}.${sign(payloadB64)}`;
}

function verifyGrantValue(value) {
  if (!value || typeof value !== 'string' || !value.includes('.')) return false;
  const [payloadB64, sig] = value.split('.');
  const sigBuf = Buffer.from(sig || '');
  const expectedBuf = Buffer.from(sign(payloadB64));
  if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
    return false;
  }
  try {
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
    return !!payload.granted && payload.exp > Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
}

function checkAccessCode(code) {
  const expected = process.env.ADVISOR_ACCESS_CODE;
  if (!expected) return false; // fail closed if the env var isn't set
  const providedBuf = Buffer.from(String(code || ''));
  const expectedBuf = Buffer.from(expected);
  if (providedBuf.length !== expectedBuf.length) return false;
  return crypto.timingSafeEqual(providedBuf, expectedBuf);
}

function buildSetCookie() {
  return `${COOKIE_NAME}=${encodeURIComponent(signGrant())}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${MAX_AGE_SECONDS}`;
}

function parseCookies(cookieHeader) {
  const out = {};
  if (!cookieHeader) return out;
  cookieHeader.split(';').forEach((pair) => {
    const idx = pair.indexOf('=');
    if (idx === -1) return;
    out[pair.slice(0, idx).trim()] = decodeURIComponent(pair.slice(idx + 1).trim());
  });
  return out;
}

// Every advisor-onboarding function is the newer ESM style (Web-standard
// Request), unlike the classic-event functions lib/session.js also serves.
function hasValidGrant(request) {
  const cookies = parseCookies(request.headers.get('cookie') || '');
  return verifyGrantValue(cookies[COOKIE_NAME]);
}

module.exports = { checkAccessCode, buildSetCookie, hasValidGrant };
