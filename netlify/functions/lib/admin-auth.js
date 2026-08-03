const crypto = require('node:crypto');

// Internal-only admin gate — deliberately separate from the public
// user-auth system (session.js's signed cookie flow). A single shared
// password from an env var, checked timing-safe against the header the
// admin page sends on every request. No accounts, no sessions, no
// per-user anything — this protects one internal ops page from being
// publicly readable, not customer-facing auth.
function checkAdminPassword(request) {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false; // fail closed if the env var isn't set
  const provided = request.headers.get('x-admin-password') || '';
  const providedBuf = Buffer.from(provided);
  const expectedBuf = Buffer.from(expected);
  if (providedBuf.length !== expectedBuf.length) return false;
  return crypto.timingSafeEqual(providedBuf, expectedBuf);
}

module.exports = { checkAdminPassword };
