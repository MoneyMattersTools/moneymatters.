import supabaseLib from './lib/supabase.js';

const { listAll } = supabaseLib;

export default async () => {
  const advisors = await listAll('advisors', 'created_at.desc');
  const codes = await listAll('advisor_invite_codes', 'created_at.desc');
  return new Response(JSON.stringify({
    realAdvisors: advisors.filter((a) => !a.is_test).map((a) => ({ id: a.id, name: a.name })),
    realCodes: codes.filter((c) => !c.is_test).map((c) => ({ id: c.id, code: c.code })),
    totalAdvisors: advisors.length,
    totalCodes: codes.length,
  }, null, 2), { headers: { 'Content-Type': 'application/json' } });
};
