// Temporary — final verification of the bulk data migration: table counts
// + a spot-check of one known real account. Not part of the permanent
// function set; delete after use.
const { countAll, findByEmail } = require('./lib/supabase');

exports.handler = async () => {
  const counts = {};
  for (const table of ['users', 'verification_tokens', 'advisor_review_requests', 'deletion_requests']) {
    counts[table] = await countAll(table);
  }
  const qaUser = await findByEmail('users', 'mm-qa-persistent@web-library.net');
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ counts, qaUserSpotCheck: qaUser }, null, 2),
  };
};
