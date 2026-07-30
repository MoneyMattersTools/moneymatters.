// Temporary — reports real record counts per Airtable table before writing
// the bulk data-migration script. Not part of the permanent function set;
// delete after use.
const { countAll } = require('./lib/airtable');

const TABLES = ['Users', 'Verification Tokens', 'Advisor Review Requests', 'Deletion Requests'];

exports.handler = async () => {
  const results = {};
  for (const table of TABLES) {
    try {
      results[table] = await countAll(table);
    } catch (err) {
      results[table] = 'error: ' + String(err.message || err);
    }
  }
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(results, null, 2),
  };
};
