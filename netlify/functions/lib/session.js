const crypto = require('crypto');

const COOKIE_NAME = 'mm_session';
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

function getSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error('SESSION_SECRET is not configured');
  return secret;
}

function sign(payloadB64) {
  return crypto.createHmac('sha256', getSecret()).update(payloadB64).digest('base64url');
}

function signSession(payload) {
  const body = { ...payload, iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + MAX_AGE_SECONDS };
  const payloadB64 = Buffer.from(JSON.stringify(body)).toString('base64url');
  const sig = sign(payloadB64);
  return `${payloadB64}.${sig}`;
}

function verifySessionValue(value) {
  if (!value || typeof value !== 'string' || !value.includes('.')) return null;
  const [payloadB64, sig] = value.split('.');
  const expectedSig = sign(payloadB64);
  const sigBuf = Buffer.from(sig || '');
  const expectedBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
    return null;
  }
  let payload;
  try {
    payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
  } catch {
    return null;
  }
  if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) return null;
  return payload;
}

function parseCookies(cookieHeader) {
  const out = {};
  if (!cookieHeader) return out;
  cookieHeader.split(';').forEach((pair) => {
    const idx = pair.indexOf('=');
    if (idx === -1) return;
    const key = pair.slice(0, idx).trim();
    const val = pair.slice(idx + 1).trim();
    out[key] = decodeURIComponent(val);
  });
  return out;
}

function buildSetCookie(value) {
  return `${COOKIE_NAME}=${encodeURIComponent(value)}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${MAX_AGE_SECONDS}`;
}

function readSessionFromEvent(event) {
  const cookieHeader = (event.headers && (event.headers.cookie || event.headers.Cookie)) || '';
  const cookies = parseCookies(cookieHeader);
  const raw = cookies[COOKIE_NAME];
  return raw ? verifySessionValue(raw) : null;
}

module.exports = {
  COOKIE_NAME,
  signSession,
  verifySessionValue,
  buildSetCookie,
  readSessionFromEvent,
};
