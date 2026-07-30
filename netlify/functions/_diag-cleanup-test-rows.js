// Temporary — removes verification_tokens test rows created while
// live-verifying submit-diagnostic.mjs's Supabase migration.
// Not part of the permanent function set; delete after use.
exports.handler = async (event) => {
  const url = process.env.SUPABASE_URL.replace(/\/$/, '').replace(/\/rest\/v1$/, '');
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const headers = { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' };

  if (event.queryStringParameters && event.queryStringParameters.list) {
    const res = await fetch(`${url}/rest/v1/verification_tokens?select=id,email,purpose,created_at`, { headers });
    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: await res.text() };
  }

  const res = await fetch(`${url}/rest/v1/verification_tokens?email=like.*web-library.net`, {
    method: 'DELETE',
    headers: { ...headers, Prefer: 'return=representation' },
  });
  const body = await res.text();
  return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: res.status, body }) };
};
