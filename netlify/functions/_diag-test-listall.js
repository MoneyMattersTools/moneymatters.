const supabaseLib = require('./lib/supabase.js');
exports.handler = async () => {
  try {
    const rows = await supabaseLib.listAll('advisor_review_requests', 'requested_at.desc');
    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ count: rows.length, sample: rows.slice(0, 1) }) };
  } catch (err) {
    return { statusCode: 500, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: String(err) }) };
  }
};
