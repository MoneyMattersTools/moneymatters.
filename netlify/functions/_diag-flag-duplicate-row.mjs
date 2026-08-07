import supabaseLib from './lib/supabase.js';

const { updateRecord, listAll } = supabaseLib;

export default async () => {
  const updated = await updateRecord('advisors', '27f2daaa-1b04-4d09-908b-94c9b6d476a5', { is_test: true });
  const advisors = await listAll('advisors', 'created_at.desc');
  return new Response(JSON.stringify({
    flagged: { id: updated.id, is_test: updated.is_test },
    remainingRealAdvisors: advisors.filter((a) => !a.is_test).map((a) => ({ id: a.id, name: a.name })),
  }, null, 2), { headers: { 'Content-Type': 'application/json' } });
};
