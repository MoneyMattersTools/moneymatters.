import supabaseLib from './lib/supabase.js';

const { findOneByFilters, encodeEq, deleteRecord } = supabaseLib;

function json(statusCode, body) {
  return new Response(JSON.stringify(body), {
    status: statusCode,
    headers: { 'Content-Type': 'application/json' },
  });
}

// Temp — deletes the test advisor row created while verifying
// submit-advisor-onboarding's live fix. Delete after use.
export default async (request) => {
  if (request.method !== 'DELETE') {
    return json(405, { ok: false, error: 'method_not_allowed' });
  }
  const advisor = await findOneByFilters('advisors', [`contact_email=${encodeEq('mm-test-onboard-check@web-library.net')}`]);
  if (advisor) await deleteRecord('advisors', advisor.id);
  return json(200, { ok: true, deleted: !!advisor });
};
