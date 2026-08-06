import advisorAccessLib from './lib/advisor-access.js';

const { checkAccessCode, buildSetCookie } = advisorAccessLib;

function json(statusCode, body, extraHeaders) {
  return new Response(JSON.stringify(body), {
    status: statusCode,
    headers: { 'Content-Type': 'application/json', ...(extraHeaders || {}) },
  });
}

// SITE_STRATEGY.md item 4 (locked 2026-08-07): gates entry to
// advisor-onboarding.html behind a single shared code Ethan hands out
// during outreach. Netlify's built-in rateLimit config (below) is the
// brute-force guard — no DB table needed for a single-code check.
export default async (request) => {
  if (request.method !== 'POST') {
    return json(405, { ok: false, error: 'method_not_allowed' });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json(400, { ok: false, error: 'invalid_body' });
  }

  const code = typeof body.code === 'string' ? body.code.trim() : '';
  if (!code) {
    return json(400, { ok: false, error: 'missing_code' });
  }

  if (!checkAccessCode(code)) {
    return json(401, { ok: false, error: 'invalid_code' });
  }

  return json(200, { ok: true }, { 'Set-Cookie': buildSetCookie() });
};

export const config = {
  rateLimit: {
    windowLimit: 10,
    windowSize: 60,
    aggregateBy: ['ip'],
  },
};
