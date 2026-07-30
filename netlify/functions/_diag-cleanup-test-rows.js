// Temporary — inspects + removes advisor_review_requests test rows.
// Not part of the permanent function set; delete after use.
exports.handler = async (event) => {
  const url = process.env.SUPABASE_URL.replace(/\/$/, '').replace(/\/rest\/v1$/, '');
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const headers = { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' };

  if (event.queryStringParameters && event.queryStringParameters.list) {
    const res = await fetch(`${url}/rest/v1/advisor_review_requests?select=id,email,situational_details,details`, { headers });
    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: await res.text() };
  }

  const res = await fetch(`${url}/rest/v1/advisor_review_requests?email=eq.mm-qa-persistent%40web-library.net`, {
    method: 'DELETE',
    headers: { ...headers, Prefer: 'return=representation' },
  });
  const body = await res.text();
  return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: res.status, body }) };
};
