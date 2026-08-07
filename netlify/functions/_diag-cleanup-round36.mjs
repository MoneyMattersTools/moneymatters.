import supabaseLib from './lib/supabase.js';

const { listAll, updateRecord } = supabaseLib;

export default async () => {
  const advisors = await listAll('advisors', 'created_at.desc');
  const testish = advisors.filter((a) => !a.is_test && /Test Invite|Test E2E|Test Applicant|Test Coded Invite/i.test(a.name || ''));
  const flagged = [];
  for (const a of testish) {
    const updated = await updateRecord('advisors', a.id, { is_test: true });
    flagged.push({ id: updated.id, name: updated.name, is_test: updated.is_test });
  }

  const codes = await listAll('advisor_invite_codes', 'created_at.desc');
  const unflaggedCodes = codes.filter((c) => !c.is_test);
  const flaggedCodes = [];
  for (const c of unflaggedCodes) {
    const updated = await updateRecord('advisor_invite_codes', c.id, { is_test: true });
    flaggedCodes.push({ id: updated.id, code: updated.code });
  }

  return new Response(JSON.stringify({ flaggedAdvisors: flagged, flaggedCodes }, null, 2), {
    headers: { 'Content-Type': 'application/json' },
  });
};
