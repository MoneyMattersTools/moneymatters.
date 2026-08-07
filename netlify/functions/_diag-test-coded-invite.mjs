// One-shot E2E test of the real gate -> submit flow, using the real
// ADVISOR_ACCESS_CODE server-side so it's never exposed in any response
// or log. Exercises the actual public endpoints exactly as a real
// advisor's browser would.
export default async () => {
  const code = process.env.ADVISOR_ACCESS_CODE;
  if (!code) {
    return new Response(JSON.stringify({ ok: false, error: 'ADVISOR_ACCESS_CODE not set' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const base = 'https://money-matters.site';

  const verifyRes = await fetch(`${base}/api/verify-advisor-access-code`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code }),
  });
  const verifyBody = await verifyRes.json();
  const setCookie = verifyRes.headers.get('set-cookie');
  if (!setCookie) {
    return new Response(JSON.stringify({ ok: false, step: 'verify', status: verifyRes.status, body: verifyBody }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  const cookieValue = setCookie.split(';')[0];

  const email = `mm-test-coded-invite-${Date.now()}@web-library.net`;
  const submitRes = await fetch(`${base}/api/submit-advisor-onboarding`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookieValue },
    body: JSON.stringify({
      name: 'Test Coded Invite Advisor',
      firm: 'Test Coded Invite Firm LLC',
      contactEmail: email,
      schedulingLink: 'https://calendly.com/test-coded-invite',
      licensedStates: ['NY'],
      specialtyTags: ['New to investing'],
      accepting: true,
    }),
  });
  const submitBody = await submitRes.json();

  return new Response(JSON.stringify({
    verifyStatus: verifyRes.status,
    verifyOk: verifyBody.ok,
    submitStatus: submitRes.status,
    submitBody,
    testEmail: email,
  }, null, 2), { headers: { 'Content-Type': 'application/json' } });
};
