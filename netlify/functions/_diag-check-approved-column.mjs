import supabaseLib from './lib/supabase.js';

const { findOneByFilters, encodeEq } = supabaseLib;

export default async () => {
  const row = await findOneByFilters('advisors', [`id=${encodeEq('7242268b-8abd-493b-bfb2-bfc53803e698')}`]);
  return new Response(JSON.stringify({ row, hasApprovedField: row ? Object.prototype.hasOwnProperty.call(row, 'approved') : null }, null, 2), {
    headers: { 'Content-Type': 'application/json' },
  });
};
