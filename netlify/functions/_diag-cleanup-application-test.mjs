import supabaseLib from './lib/supabase.js';

const { updateRecord } = supabaseLib;

export default async () => {
  const updated = await updateRecord('advisors', '7242268b-8abd-493b-bfb2-bfc53803e698', { is_test: true });
  return new Response(JSON.stringify({ id: updated.id, is_test: updated.is_test }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
