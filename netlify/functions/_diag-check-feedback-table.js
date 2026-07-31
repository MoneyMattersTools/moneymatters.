exports.handler = async () => {
  const url = process.env.SUPABASE_URL.replace(/\/$/, '').replace(/\/rest\/v1$/, '');
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const headers = { apikey: key, Authorization: `Bearer ${key}` };
  const res = await fetch(`${url}/rest/v1/tool_feedback?select=id&limit=1`, { headers });
  const text = await res.text();
  return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: res.status, body: text }) };
};
