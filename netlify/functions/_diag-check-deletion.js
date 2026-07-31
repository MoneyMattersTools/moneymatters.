exports.handler = async () => {
  const url = process.env.SUPABASE_URL.replace(/\/$/, '').replace(/\/rest\/v1$/, '');
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const headers = { apikey: key, Authorization: `Bearer ${key}` };
  const res = await fetch(`${url}/rest/v1/deletion_requests?email=eq.mm-test-deletion-c2s5hflf@web-library.net`, { headers });
  const data = await res.json();
  return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) };
};
