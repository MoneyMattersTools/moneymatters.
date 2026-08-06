import supabaseLib from './lib/supabase.js';

const { findByEmail, updateRecord } = supabaseLib;

function json(statusCode, body) {
  return new Response(JSON.stringify(body), {
    status: statusCode,
    headers: { 'Content-Type': 'application/json' },
  });
}

// Temp — finishes the QA account is_test backfill now that migration
// 0008 is confirmed applied. Delete after use.
export default async (request) => {
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
