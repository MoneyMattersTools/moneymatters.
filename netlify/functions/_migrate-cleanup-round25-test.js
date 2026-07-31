exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'method_not_allowed' }) };
  }
  const url = process.env.SUPABASE_URL.replace(/\/$/, '').replace(/\/rest\/v1$/, '');
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const headers = { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', Prefer: 'return=representation' };
  const filter = 'email=like.mm-test-*@web-library.net';
  const results = {};
  for (const table of ['users', 'verification_tokens', 'advisor_review_requests', 'deletion_requests']) {
    const res = await fetch(`${url}/rest/v1/${table}?${filter}`, { method: 'DELETE', headers });
    results[table] = { status: res.status, data: await res.json().catch(() => null) };
  }
  return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(results) };
};
