import supabaseLib from './lib/supabase.js';

const { listAll } = supabaseLib;

function json(statusCode, body) {
  return new Response(JSON.stringify(body), {
    status: statusCode,
    headers: { 'Content-Type': 'application/json' },
  });
}

// Temp — full-site audit: checks migration 0006 status. Delete after use.
export default async () => {
  const result = {};
  try {
    await listAll('advisor_invites');
    result.advisor_invites_table = 'exists';
  } catch (err) {
    result.advisor_invites_table = 'missing: ' + err.message.slice(0, 150);
  }
  return json(200, result);
};
