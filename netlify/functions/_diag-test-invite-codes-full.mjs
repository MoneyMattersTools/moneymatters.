import supabaseLib from './lib/supabase.js';

const { createRecord, listAll, updateRecord } = supabaseLib;

// Full E2E test of the invite-code system now that migration 0010 should
// be applied: table existence, generation, real single-use consumption
// via the actual public API, rejection of a second attempt, and the
// used_by_email linkage once a real advisor submission uses the code.
export default async () => {
  const results = {};

  try {
    const existing = await listAll('advisor_invite_codes', 'created_at.desc');
    results.tableExists = true;
    results.existingCount = existing.length;
  } catch (err) {
    results.tableExists = false;
    results.tableError = err.message;
    return new Response(JSON.stringify(results, null, 2), { headers: { 'Content-Type': 'application/json' } });
  }

  const testCode = 'E2ETEST9';
  const created = await createRecord('advisor_invite_codes', { code: testCode, label: 'E2E full test', is_test: true });
  results.created = { id: created.id, code: created.code, used_at: created.used_at, is_test: created.is_test };

  const base = 'https://money-matters.site';

  // Consume via the real public endpoint.
  const firstRes = await fetch(`${base}/api/verify-advisor-access-code`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code: testCode }),
  });
  const firstBody = await firstRes.json();
  const cookieHeader = firstRes.headers.get('set-cookie');
  results.firstAttempt = { status: firstRes.status, ok: firstBody.ok, hasCookie: !!cookieHeader };

  // Second attempt with the same code must fail (single-use).
  const secondRes = await fetch(`${base}/api/verify-advisor-access-code`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code: testCode }),
  });
  const secondBody = await secondRes.json();
  results.secondAttempt = { status: secondRes.status, ok: secondBody.ok, error: secondBody.error };

  // Use the granted cookie to actually submit an advisor onboarding, then
  // confirm the invite code's used_by_email got linked.
  if (cookieHeader) {
    const cookieValue = cookieHeader.split(';')[0];
    const email = `mm-test-invite-e2e-${Date.now()}@web-library.net`;
    const submitRes = await fetch(`${base}/api/submit-advisor-onboarding`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieValue },
      body: JSON.stringify({
        name: 'Test Invite Code Advisor',
        firm: 'Test Invite Firm LLC',
        contactEmail: email,
        licensedStates: ['TX'],
        specialtyTags: ['New to investing'],
        accepting: true,
      }),
    });
    const submitBody = await submitRes.json();
    results.submitViaCode = { status: submitRes.status, ok: submitBody.ok, testEmail: email };

    if (submitBody.ok && submitBody.advisor) {
      await updateRecord('advisors', submitBody.advisor.id, { is_test: true });
      results.advisorFlaggedTest = true;
    }
  }

  // Confirm the code row shows the linkage.
  const finalCodes = await listAll('advisor_invite_codes', 'created_at.desc');
  const finalTestCode = finalCodes.find((c) => c.code === testCode);
  results.finalCodeState = finalTestCode
    ? { used_at: finalTestCode.used_at, used_by_email: finalTestCode.used_by_email }
    : null;

  return new Response(JSON.stringify(results, null, 2), { headers: { 'Content-Type': 'application/json' } });
};
