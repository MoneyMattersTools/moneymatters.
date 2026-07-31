// ONE-TIME cleanup: removes disposable mail.tm test accounts (and their
// related test data) from Supabase, keeping mm-qa-persistent@web-library.net.
// Not part of the permanent function set — remove after a single
// confirmed-successful run. POST-only, same safety pattern as the earlier
// bulk data-migration script.
exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'method_not_allowed' }) };
  }

  const url = process.env.SUPABASE_URL.replace(/\/$/, '').replace(/\/rest\/v1$/, '');
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const headers = { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', Prefer: 'return=representation' };

  // Every disposable test account used the same mail.tm domain
  // (web-library.net) across every prior round of this project — the one
  // real account on that domain, mm-qa-persistent, is explicitly excluded.
  const testFilter = 'email=like.*web-library.net&email=neq.mm-qa-persistent@web-library.net';

  const usersRes = await fetch(`${url}/rest/v1/users?${testFilter}`, { method: 'DELETE', headers });
  const advisorRes = await fetch(`${url}/rest/v1/advisor_review_requests?${testFilter}`, { method: 'DELETE', headers });
  const deletionRes = await fetch(`${url}/rest/v1/deletion_requests?${testFilter}`, { method: 'DELETE', headers });
  const tokensRes = await fetch(`${url}/rest/v1/verification_tokens?${testFilter}`, { method: 'DELETE', headers });

  const usersDeleted = await usersRes.json();
  const advisorDeleted = await advisorRes.json();
  const deletionDeleted = await deletionRes.json();
  const tokensDeleted = await tokensRes.json();

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      users: { count: usersDeleted.length, emails: usersDeleted.map((r) => r.email) },
      advisor_review_requests: { count: advisorDeleted.length, emails: advisorDeleted.map((r) => r.email) },
      deletion_requests: { count: deletionDeleted.length, emails: deletionDeleted.map((r) => r.email) },
      verification_tokens: { count: tokensDeleted.length },
    }, null, 2),
  };
};
