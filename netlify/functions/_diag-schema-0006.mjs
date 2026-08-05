import supabaseLib from './lib/supabase.js';

const { listAll } = supabaseLib;

function json(statusCode, body) {
  return new Response(JSON.stringify(body), {
    status: statusCode,
    headers: { 'Content-Type': 'application/json' },
  });
}

// Temp — checks whether migration 0006 has been applied. Delete after use.
export default async () => {
  const result = {};
  try {
    await listAll('advisor_invites');
    result.advisor_invites_table = 'exists';
  } catch (err) {
    result.advisor_invites_table = 'missing: ' + err.message;
  }
  try {
    const rows = await listAll('advisor_review_requests', 'requested_at.desc');
    result.status_changed_at_column = rows.length && 'status_changed_at' in rows[0] ? 'exists' : 'unknown (no rows)';
  } catch (err) {
    result.status_changed_at_column = 'error: ' + err.message;
  }
  try {
    const rows = await listAll('verification_tokens', 'created_at.desc');
    result.pending_source_column = rows.length && 'pending_source' in rows[0] ? 'exists' : 'unknown (no rows)';
  } catch (err) {
    result.pending_source_column = 'error: ' + err.message;
  }
  return json(200, result);
};
