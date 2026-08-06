import supabaseLib from './lib/supabase.js';

const { findByEmail, updateRecord, listAll } = supabaseLib;

function json(statusCode, body) {
  return new Response(JSON.stringify(body), {
    status: statusCode,
    headers: { 'Content-Type': 'application/json' },
  });
}

// Temp — finishes the QA account is_test backfill now that migration
// 0008 is confirmed applied. Delete after use.
export default async (request) => {
  if (request.method === 'GET') {
    // Mirrors admin-dashboard-stats.mjs's exact exclusion filter — proves
    // the QA account is actually excluded from the KPI computation, not
    // just flagged in isolation.
    const allUsers = await listAll('users');
    const qaUser = allUsers.find((u) => u.email === 'mm-qa-persistent@web-library.net');
    const kpiUsers = allUsers.filter((u) => !u.is_test);
    const qaIncludedInKpiUsers = kpiUsers.some((u) => u.email === 'mm-qa-persistent@web-library.net');
    return json(200, {
      ok: true,
      qaIsTest: qaUser ? qaUser.is_test : 'not found',
      totalUsers: allUsers.length,
      kpiUserCount: kpiUsers.length,
      qaIncludedInKpiUsers,
    });
  }
  if (request.method !== 'POST') {
    return json(405, { ok: false, error: 'method_not_allowed' });
  }
  const payload = await request.json();
  const user = await findByEmail('users', payload.email);
  if (!user) {
    return json(404, { ok: false, error: 'user_not_found' });
  }
  const updated = await updateRecord('users', user.id, { is_test: true });
  return json(200, { ok: true, id: updated.id, is_test: updated.is_test });
};
