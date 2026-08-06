import supabaseLib from './lib/supabase.js';

const { listAll, updateRecord, findByEmail, deleteRecord } = supabaseLib;

function json(statusCode, body) {
  return new Response(JSON.stringify(body), {
    status: statusCode,
    headers: { 'Content-Type': 'application/json' },
  });
}

// Temp — checks migration 0007 status, lists advisor rows so stray test
// entries can be identified, and backfills is_test on known test rows.
// Delete after use.
export default async (request) => {
  const url = new URL(request.url);
  const action = url.searchParams.get('action');

  if (request.method === 'POST' && action === 'backfill') {
    const payload = await request.json();
    const results = [];
    for (const id of payload.advisorIds || []) {
      await updateRecord('advisors', id, { is_test: true });
      results.push({ advisor: id, flagged: true });
    }
    if (payload.qaEmail) {
      const qaUser = await findByEmail('users', payload.qaEmail);
      if (qaUser) {
        await updateRecord('users', qaUser.id, { is_test: true });
        results.push({ user: qaUser.id, flagged: true });
      } else {
        results.push({ user: payload.qaEmail, flagged: false, reason: 'not found' });
      }
    }
    return json(200, { ok: true, results });
  }

  if (request.method === 'DELETE' && action === 'purge') {
    const payload = await request.json();
    for (const id of payload.advisorIds || []) await deleteRecord('advisors', id);
    return json(200, { ok: true, purged: payload.advisorIds || [] });
  }

  const result = {};
  try {
    const rows = await listAll('advisors');
    result.advisors_is_test_exists = rows.length ? 'is_test' in rows[0] : 'unknown (no rows)';
    result.advisors = rows.map((a) => ({ id: a.id, name: a.name, email: a.contact_email, is_test: a.is_test }));
  } catch (err) {
    result.advisors_error = err.message.slice(0, 200);
  }
  try {
    const rows = await listAll('users');
    result.users_adv_budget_result_exists = rows.length ? 'adv_budget_result' in rows[0] : 'unknown (no rows)';
  } catch (err) {
    result.users_error = err.message.slice(0, 200);
  }
  return json(200, result);
};
