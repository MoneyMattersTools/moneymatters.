const { buildClearCookie } = require('./lib/session');

// §29.3: paired with the nav now showing the signed-in email instead of a
// generic "Sign In" link — that only makes sense if there's a way back out.
// POST-only (not GET) for the same reason verify-token.js is POST-only: no
// side-effecting action should fire from a mere page load or link prefetch.
function json(statusCode, body, extraHeaders = {}) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json', ...extraHeaders },
    body: JSON.stringify(body),
  };
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return json(405, { ok: false, error: 'method_not_allowed' });
  }
  return json(200, { ok: true }, { 'Set-Cookie': buildClearCookie() });
};
