// Temporary — lists all users to identify disposable test accounts for
// cleanup. Not part of the permanent function set; delete after use.
exports.handler = async () => {
  const url = process.env.SUPABASE_URL.replace(/\/$/, '').replace(/\/rest\/v1$/, '');
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const headers = { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' };

  const res = await fetch(`${url}/rest/v1/users?select=id,email,verified,plan,created_at&order=created_at.asc`, { headers });
  const body = await res.text();
  return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body };
};
