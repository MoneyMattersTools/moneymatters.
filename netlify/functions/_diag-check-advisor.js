const { findLatestByFilters, encodeEq } = require('./lib/supabase');

function json(statusCode, body) {
  return { statusCode, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) };
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return json(405, { ok: false, error: 'method_not_allowed' });
  }
  const email = (event.queryStringParameters && event.queryStringParameters.email) || '';
  if (!email) return json(400, { ok: false, error: 'email required' });
  const row = await findLatestByFilters('advisor_review_requests', [`email=${encodeEq(email.toLowerCase())}`], 'requested_at');
  return json(200, { ok: true, row });
};
