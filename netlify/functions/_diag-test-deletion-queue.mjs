import supabaseLib from './lib/supabase.js';

const { listAll } = supabaseLib;

export default async () => {
  const rows = await listAll('deletion_requests', 'requested_at.desc');
  return new Response(JSON.stringify({
    count: rows.length,
    rows: rows.map((r) => ({ id: r.id, email: r.email, status: r.status, requested_at: r.requested_at, is_test: r.is_test })),
  }, null, 2), { headers: { 'Content-Type': 'application/json' } });
};
