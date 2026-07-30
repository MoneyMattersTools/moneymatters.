// Temporary, one-off diagnostic — confirms the 4 Supabase tables exist and
// are reachable via the configured env vars before Milestone 2 (function
// rewrites) begins. Not part of the permanent function set; delete after use.
const { countAll } = require('./lib/supabase');

const TABLES = ['users', 'verification_tokens', 'advisor_review_requests', 'deletion_requests'];

exports.handler = async () => {
  const results = {};
  for (const table of TABLES) {
    try {
      results[table] = { ok: true, count: await countAll(table) };
    } catch (err) {
      results[table] = { ok: false, error: String(err.message || err) };
    }
  }
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(results, null, 2),
  };
};
