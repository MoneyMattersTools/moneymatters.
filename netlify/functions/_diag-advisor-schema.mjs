import supabaseLib from './lib/supabase.js';

const { listAll } = supabaseLib;

function json(statusCode, body) {
  return new Response(JSON.stringify(body), {
    status: statusCode,
    headers: { 'Content-Type': 'application/json' },
  });
}

// Temp diagnostic — checks whether migration 0005 has been applied yet.
// Read-only, no admin auth needed since it touches nothing sensitive.
// Delete after use.
export default async () => {
  const result = {};
  try {
    await listAll('advisors', 'created_at.desc');
    result.advisors_table = 'exists';
  } catch (err) {
    result.advisors_table = 'missing: ' + err.message;
  }
  try {
    await listAll('advisor_lead_deliveries', 'assigned_at.desc');
    result.advisor_lead_deliveries_table = 'exists';
  } catch (err) {
    result.advisor_lead_deliveries_table = 'missing: ' + err.message;
  }
  try {
    await listAll('advisor_consent_log', 'shared_at.desc');
    result.advisor_consent_log_table = 'exists';
  } catch (err) {
    result.advisor_consent_log_table = 'missing: ' + err.message;
  }
  try {
    const rows = await listAll('advisor_review_requests', 'requested_at.desc');
    result.urgency_column = rows.length && 'urgency' in rows[0] ? 'exists' : 'unknown (no rows or column absent)';
  } catch (err) {
    result.urgency_column = 'error: ' + err.message;
  }
  return json(200, result);
};
