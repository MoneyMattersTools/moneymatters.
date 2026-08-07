import supabaseLib from './lib/supabase.js';

const { listAll } = supabaseLib;

export default async () => {
  const codes = await listAll('advisor_invite_codes', 'created_at.desc');
  const testCode = codes.find((c) => c.code === 'E2ETEST9');
  const advisors = await listAll('advisors', 'created_at.desc');
  const relatedAdvisors = advisors.filter((a) => (a.name || '').includes('Test Invite Code Advisor'));
  return new Response(JSON.stringify({
    testCode,
    relatedAdvisors: relatedAdvisors.map((a) => ({ id: a.id, name: a.name, contact_email: a.contact_email, is_test: a.is_test, approved: a.approved })),
  }, null, 2), { headers: { 'Content-Type': 'application/json' } });
};
