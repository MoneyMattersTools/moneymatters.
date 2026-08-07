import supabaseLib from './lib/supabase.js';

const { updateRecord } = supabaseLib;

export default async () => {
  const updated = await updateRecord('advisors', 'c147cc97-ad03-42f4-9f26-985eeccd0bb8', { is_test: true });
  return new Response(JSON.stringify({ id: updated.id, is_test: updated.is_test }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
