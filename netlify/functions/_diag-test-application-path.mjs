export default async () => {
  const base = 'https://money-matters.site';
  const email = `mm-test-application-e2e-${Date.now()}@web-library.net`;
  const res = await fetch(`${base}/api/submit-advisor-application`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Test E2E Application Advisor',
      firm: 'Test E2E Application Firm LLC',
      contactEmail: email,
      schedulingLink: 'https://calendly.com/test-e2e-application',
      licensedStates: ['CA'],
      specialtyTags: ['Buying a home'],
      accepting: true,
    }),
  });
  const body = await res.json();
  return new Response(JSON.stringify({ status: res.status, body, testEmail: email }, null, 2), {
    headers: { 'Content-Type': 'application/json' },
  });
};
