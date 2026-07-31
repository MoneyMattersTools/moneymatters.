exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'method_not_allowed' }) };
  }
  const url = process.env.SUPABASE_URL.replace(/\/$/, '').replace(/\/rest\/v1$/, '');
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const headers = { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', Prefer: 'return=representation' };
  const res = await fetch(`${url}/rest/v1/users?email=eq.mm-qa-persistent@web-library.net`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ plan: 'plus' }),
  });
  const data = await res.json().catch(() => null);
  return { statusCode: res.status, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: res.status, data }) };
};
