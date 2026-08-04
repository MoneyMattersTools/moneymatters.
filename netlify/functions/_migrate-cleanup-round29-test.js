exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ok: false, error: 'method_not_allowed' }) };
  }
  const emails = [
    'mm-test-stripe-dth4q57f@web-library.net',
    'mm-test-feedbackbug-ds1mxp4y@web-library.net',
  ];
  const url = process.env.SUPABASE_URL.replace(/\/$/, '').replace(/\/rest\/v1$/, '');
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const headers = { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' };
  const results = [];
  for (const email of emails) {
    const res = await fetch(`${url}/rest/v1/users?email=eq.${encodeURIComponent(email)}`, { method: 'DELETE', headers });
    results.push({ email, status: res.status });
  }
  return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ok: true, results }) };
};
