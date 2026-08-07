import supabaseLib from './lib/supabase.js';

const { createRecord, listAll } = supabaseLib;

// Tests the invite_codes table + the real public verify endpoint,
// bypassing admin auth (this is my own temp deploy, same established
// pattern used throughout this project). Confirms: generation, real
// single-use consumption via the actual public API, and that a second
// attempt with the same code is correctly rejected.
export default async () => {
  const results = {};

  // 1. Does the table exist yet? (migration 0010)
  try {
    const existing = await listAll('advisor_invite_codes', 'created_at.desc');
    results.tableExists = true;
    results.existingCount = existing.length;
  } catch (err) {
    results.tableExists = false;
    results.tableError = err.message;
    return new Response(JSON.stringify(results, null, 2), { headers: { 'Content-Type': 'application/json' } });
  }

  // 2. Create a test code directly (simulating admin-generate-invite-code).
  const testCode = 'TESTCODE1';
  let created;
  try {
    created = await createRecord('advisor_invite_codes', { code: testCode, label: 'E2E test code', is_test: true });
    results.created = { id: created.id, code: created.code, used_at: created.used_at };
  } catch (err) {
    results.createError = err.message;
    return new Response(JSON.stringify(results, null, 2), { headers: { 'Content-Type': 'application/json' } });
  }

  // 3. Consume it via the REAL public endpoint.
  const base = 'https://money-matters.site';
  const firstRes = await fetch(`${base}/api/verify-advisor-access-code`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code: testCode }),
  });
  results.firstAttempt = { status: firstRes.status, body: await firstRes.json(), hasCookie: !!firstRes.headers.get('set-cookie') };

  // 4. Try to consume it AGAIN — should fail (single-use).
  const secondRes = await fetch(`${base}/api/verify-advisor-access-code`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code: testCode }),
  });
  results.secondAttempt = { status: secondRes.status, body: await secondRes.json() };

  return new Response(JSON.stringify(results, null, 2), { headers: { 'Content-Type': 'application/json' } });
};
