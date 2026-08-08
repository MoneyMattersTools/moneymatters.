import supabaseLib from './lib/supabase.js';
import advisorAccessLib from './lib/advisor-access.js';
import errorAlertLib from './lib/error-alert.js';
const { alertOnError } = errorAlertLib;

const { updateRecordIf, encodeEq } = supabaseLib;
const { buildSetCookie } = advisorAccessLib;

function json(statusCode, body, extraHeaders) {
  return new Response(JSON.stringify(body), {
    status: statusCode,
    headers: { 'Content-Type': 'application/json', ...(extraHeaders || {}) },
  });
}

// Round-35 ask: replaces the single shared ADVISOR_ACCESS_CODE with
// unique, single-use, admin-generated codes (advisor_invite_codes,
// migration 0010). Consuming a code is one atomic PATCH filtered on
// used_at=is.null (lib/supabase.js's updateRecordIf) — if two requests
// race on the same code, only the first's filter still matches, so the
// second correctly sees it as already-used rather than both succeeding.
// Netlify's built-in rateLimit config below is the brute-force guard, same
// as the shared-code version had.
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

  const code = typeof body.code === 'string' ? body.code.trim().toUpperCase() : '';
  if (!code) {
    return json(400, { ok: false, error: 'missing_code' });
  }

  try {
    const consumed = await updateRecordIf(
      'advisor_invite_codes',
      [`code=${encodeEq(code)}`, 'used_at=is.null'],
      { used_at: new Date().toISOString() }
    );
    if (!consumed) {
      return json(401, { ok: false, error: 'invalid_code' });
    }
    return json(200, { ok: true }, { 'Set-Cookie': buildSetCookie(code) });
  } catch (err) {
    console.error('verify-advisor-access-code error:', err);
    await alertOnError("verify-advisor-access-code", err);
    return json(500, { ok: false, error: 'server_error' });
  }
};

export const config = {
  rateLimit: {
    windowLimit: 10,
    windowSize: 60,
    aggregateBy: ['ip'],
  },
};
