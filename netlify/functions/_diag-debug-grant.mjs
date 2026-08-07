import supabaseLib from './lib/supabase.js';
import advisorAccessLib from './lib/advisor-access.js';

const { createRecord, updateRecordIf, encodeEq } = supabaseLib;
const { buildSetCookie, hasValidGrant, getGrantCode } = advisorAccessLib;

export default async (request) => {
  const testCode = 'DEBUG' + Date.now().toString().slice(-6);
  await createRecord('advisor_invite_codes', { code: testCode, label: 'debug', is_test: true });
  const consumed = await updateRecordIf('advisor_invite_codes', [`code=${encodeEq(testCode)}`, 'used_at=is.null'], { used_at: new Date().toISOString() });

  const setCookieHeader = buildSetCookie(testCode);
  const cookieNameValue = setCookieHeader.split(';')[0];

  // Build a fake Request with that cookie attached, exactly like a real
  // browser would send it back, and test hasValidGrant/getGrantCode
  // directly against our own logic — no network round-trip, no fetch
  // Set-Cookie quirks to worry about.
  const fakeRequest = new Request('https://money-matters.site/api/submit-advisor-onboarding', {
    method: 'POST',
    headers: { Cookie: cookieNameValue },
  });

  return new Response(JSON.stringify({
    testCode,
    consumedRow: consumed ? { id: consumed.id, used_at: consumed.used_at } : null,
    setCookieHeader,
    cookieNameValue,
    hasValidGrantResult: hasValidGrant(fakeRequest),
    getGrantCodeResult: getGrantCode(fakeRequest),
  }, null, 2), { headers: { 'Content-Type': 'application/json' } });
};
