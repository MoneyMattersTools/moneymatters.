// Temporary — checks for any related test data in other tables tied to
// web-library.net test emails, before the users-table cleanup.
// Not part of the permanent function set; delete after use.
exports.handler = async () => {
  const url = process.env.SUPABASE_URL.replace(/\/$/, '').replace(/\/rest\/v1$/, '');
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const headers = { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' };

  const advisorRes = await fetch(`${url}/rest/v1/advisor_review_requests?email=like.*web-library.net&select=id,email,requested_at`, { headers });
  const deletionRes = await fetch(`${url}/rest/v1/deletion_requests?email=like.*web-library.net&select=id,email,requested_at`, { headers });
  const tokensRes = await fetch(`${url}/rest/v1/verification_tokens?email=like.*web-library.net&select=id,email,created_at`, { headers });

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      advisor_review_requests: await advisorRes.json(),
      deletion_requests: await deletionRes.json(),
      verification_tokens: await tokensRes.json(),
    }, null, 2),
  };
};
