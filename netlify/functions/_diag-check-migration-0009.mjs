import supabaseLib from './lib/supabase.js';

const { listAll } = supabaseLib;

export default async () => {
  const rows = await listAll('advisors', 'created_at.desc');
  const sample = rows[0] || null;
  return new Response(JSON.stringify({
    hasApprovedField: sample ? Object.prototype.hasOwnProperty.call(sample, 'approved') : null,
    totalAdvisors: rows.length,
    sample: sample ? { id: sample.id, name: sample.name, approved: sample.approved } : null,
  }, null, 2), { headers: { 'Content-Type': 'application/json' } });
};
