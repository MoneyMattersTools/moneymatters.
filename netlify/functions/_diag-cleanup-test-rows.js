// Temporary — removes the browser-verification agent's test data.
// Not part of the permanent function set; delete after use.
exports.handler = async () => {
  const url = process.env.SUPABASE_URL.replace(/\/$/, '').replace(/\/rest\/v1$/, '');
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const headers = { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', Prefer: 'return=representation' };

  const usersRes = await fetch(`${url}/rest/v1/users?email=like.*web-library.net`, { method: 'DELETE', headers });
  const tokensRes = await fetch(`${url}/rest/v1/verification_tokens?email=like.*web-library.net`, { method: 'DELETE', headers });
  const advisorRes = await fetch(`${url}/rest/v1/advisor_review_requests?email=like.*web-library.net`, { method: 'DELETE', headers });
  const deletionRes = await fetch(`${url}/rest/v1/deletion_requests?email=like.*web-library.net`, { method: 'DELETE', headers });
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      users: await usersRes.text(),
      tokens: await tokensRes.text(),
      advisor: await advisorRes.text(),
      deletion: await deletionRes.text(),
    }),
  };
};
