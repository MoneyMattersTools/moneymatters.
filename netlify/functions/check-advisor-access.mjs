import advisorAccessLib from './lib/advisor-access.js';

const { hasValidGrant } = advisorAccessLib;

function json(statusCode, body) {
  return new Response(JSON.stringify(body), {
    status: statusCode,
    headers: { 'Content-Type': 'application/json' },
  });
}

// Lets advisor-onboarding.html decide client-side whether to show the form
// or an "access code required" message. Not the real enforcement layer —
// submit-advisor-onboarding.mjs checks the same signed cookie server-side
// before accepting a submission, so this is UX only.
export default async (request) => {
  if (request.method !== 'GET') {
    return json(405, { ok: false, error: 'method_not_allowed' });
  }
  return json(200, { granted: hasValidGrant(request) });
};
