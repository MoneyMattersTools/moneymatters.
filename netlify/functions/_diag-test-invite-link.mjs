import supabaseLib from './lib/supabase.js';

const { createRecord, findOneByFilters, encodeEq } = supabaseLib;

// Timestamp-suffixed code so repeat polling can't collide on a unique
// constraint (unlike the earlier hardcoded-code diag) — safe to invoke
// more than once.
export default async () => {
  const testCode = 'E2ELINK' + Date.now().toString().slice(-6);
  const created = await createRecord('advisor_invite_codes', { code: testCode, label: 'E2E link test', is_test: true });

  const base = 'https://money-matters.site';
  const verifyRes = await fetch(`${base}/api/verify-advisor-access-code`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code: testCode }),
  });
  const verifyBody = await verifyRes.json();
  const cookieHeader = verifyRes.headers.get('set-cookie');

  if (!cookieHeader) {
    return new Response(JSON.stringify({ step: 'verify', status: verifyRes.status, verifyBody, cookieHeader }, null, 2), {
      headers: { 'Content-Type': 'application/json' },
    });
  }
  const cookieValue = cookieHeader.split(';')[0];

  const email = `mm-test-invite-link-${Date.now()}@web-library.net`;
  const submitRes = await fetch(`${base}/api/submit-advisor-onboarding`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookieValue },
    body: JSON.stringify({
      name: 'Test Invite Link Advisor',
      contactEmail: email,
      licensedStates: ['TX'],
      specialtyTags: ['New to investing'],
      accepting: true,
    }),
  });
  const submitBody = await submitRes.json();

  // Give the best-effort linkage write inside submit-advisor-onboarding a
  // moment, then read the code row directly.
  await new Promise((r) => setTimeout(r, 500));
  const codeAfter = await findOneByFilters('advisor_invite_codes', [`code=${encodeEq(testCode)}`]);

  return new Response(JSON.stringify({
    testCode,
    cookieValuePrefix: cookieValue.slice(0, 20),
    submitStatus: submitRes.status,
    submitBody,
    codeAfter: codeAfter ? { used_at: codeAfter.used_at, used_by_email: codeAfter.used_by_email } : null,
  }, null, 2), { headers: { 'Content-Type': 'application/json' } });
};
