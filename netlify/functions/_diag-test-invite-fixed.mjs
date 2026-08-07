import supabaseLib from './lib/supabase.js';

const { createRecord, findOneByFilters, encodeEq } = supabaseLib;

export default async () => {
  const testCode = 'FIXED' + Date.now().toString().slice(-6);
  const base = 'https://money-matters.site';

  await createRecord('advisor_invite_codes', { code: testCode, label: 'fixed test', is_test: true });

  const verifyRes = await fetch(`${base}/api/verify-advisor-access-code`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code: testCode }),
  });
  const verifyBody = await verifyRes.json();
  // The correct, non-lossy way to read Set-Cookie in Node's fetch — .get()
  // can merge multiple Set-Cookie headers with commas, corrupting the
  // value; getSetCookie() returns each one intact.
  const setCookies = typeof verifyRes.headers.getSetCookie === 'function' ? verifyRes.headers.getSetCookie() : [verifyRes.headers.get('set-cookie')];
  const cookieValue = setCookies[0] ? setCookies[0].split(';')[0] : null;

  const email = `mm-test-invite-fixed-${Date.now()}@web-library.net`;
  const submitRes = await fetch(`${base}/api/submit-advisor-onboarding`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookieValue },
    body: JSON.stringify({
      name: 'Test Invite Fixed Advisor',
      contactEmail: email,
      licensedStates: ['TX'],
      specialtyTags: ['New to investing'],
      accepting: true,
    }),
  });
  const submitBody = await submitRes.json();

  await new Promise((r) => setTimeout(r, 500));
  const codeAfter = await findOneByFilters('advisor_invite_codes', [`code=${encodeEq(testCode)}`]);

  return new Response(JSON.stringify({
    testCode,
    allSetCookies: setCookies,
    cookieValue,
    submitStatus: submitRes.status,
    submitBody,
    codeAfter: codeAfter ? { used_at: codeAfter.used_at, used_by_email: codeAfter.used_by_email } : null,
  }, null, 2), { headers: { 'Content-Type': 'application/json' } });
};
