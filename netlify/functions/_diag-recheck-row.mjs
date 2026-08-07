import supabaseLib from './lib/supabase.js';

const { findOneByFilters, encodeEq } = supabaseLib;

export default async () => {
  const row = await findOneByFilters('advisors', [`id=${encodeEq('c147cc97-ad03-42f4-9f26-985eeccd0bb8')}`]);
  return new Response(JSON.stringify(row, null, 2), { headers: { 'Content-Type': 'application/json' } });
};
