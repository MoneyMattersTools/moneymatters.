import supabaseLib from './lib/supabase.js';

const { listAll } = supabaseLib;

function json(statusCode, body) {
  return new Response(JSON.stringify(body), {
    status: statusCode,
    headers: { 'Content-Type': 'application/json' },
  });
}

// Temp — checks migration 0007 status. Delete after use.
export default async () => {
  const result = {};
  try {
    const rows = await listAll('advisors');
    result.advisors_is_test = rows.length ? 'is_test' in rows[0] : 'unknown (no rows)';
    result.advisors_request_ip = rows.length ? 'request_ip' in rows[0] : 'unknown (no rows)';
  } catch (err) {
    result.advisors_error = err.message.slice(0, 150);
  }
  try {
    const rows = await listAll('users');
    result.users_adv_budget_result = rows.length ? 'adv_budget_result' in rows[0] : 'unknown (no rows)';
  } catch (err) {
    result.users_error = err.message.slice(0, 150);
  }
  return json(200, result);
};
