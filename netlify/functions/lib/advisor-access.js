const crypto = require('node:crypto');

// SITE_STRATEGY.md item 4 (locked 2026-08-07), codes replaced with unique
// per-advisor single-use ones in the round-35 ask: an access code gates
// entry to the advisor onboarding form, so registration stays limited to
// advisors Ethan has actually invited. The code itself is validated
// against the advisor_invite_codes table (see verify-advisor-access-code.mjs)
// — this file only handles the resulting signed grant cookie, deliberately
// reusing SESSION_SECRET for signing rather than adding a second secret env
// var, since this is a low-stakes anti-spam gate, not user auth. Same
// signed-cookie shape as lib/session.js.
//
// The grant carries the consumed code itself (not just a granted:true
// flag) so submit-advisor-onboarding.mjs can, once the advisor's contact
// email is known, link the invite code back to who actually used it
// (advisor_invite_codes.used_by_email) — purely a traceability nicety for
// the admin page, not part of the security boundary.
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

function signGrant(code) {
  const body = { granted: true, code: code || null, exp: Math.floor(Date.now() / 1000) + MAX_AGE_SECONDS };
  const payloadB64 = Buffer.from(JSON.stringify(body)).toString('base64url');
  return `${payloadB64}.${sign(payloadB64)}`;
}

function verifyGrant(value) {
  if (!value || typeof value !== 'string' || !value.includes('.')) return null;
  const [payloadB64, sig] = value.split('.');
  const sigBuf = Buffer.from(sig || '');
  const expectedBuf = Buffer.from(sign(payloadB64));
  if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
    return null;
  }
  try {
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
    if (!payload.granted || payload.exp <= Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

function buildSetCookie(code) {
  return `${COOKIE_NAME}=${encodeURIComponent(signGrant(code))}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${MAX_AGE_SECONDS}`;
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
  return !!verifyGrant(cookies[COOKIE_NAME]);
}

function getGrantCode(request) {
  const cookies = parseCookies(request.headers.get('cookie') || '');
  const payload = verifyGrant(cookies[COOKIE_NAME]);
  return payload ? payload.code : null;
}

module.exports = { buildSetCookie, hasValidGrant, getGrantCode };
