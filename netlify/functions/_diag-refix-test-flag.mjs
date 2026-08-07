import supabaseLib from './lib/supabase.js';

const { findOneByFilters, updateRecord, encodeEq } = supabaseLib;

export default async () => {
  const id = 'c147cc97-ad03-42f4-9f26-985eeccd0bb8';
  const before = await findOneByFilters('advisors', [`id=${encodeEq(id)}`]);
  const updated = await updateRecord('advisors', id, { is_test: true });
  const after = await findOneByFilters('advisors', [`id=${encodeEq(id)}`]);
  return new Response(JSON.stringify({
    beforeIsTest: before ? before.is_test : null,
    updateResponseIsTest: updated ? updated.is_test : null,
    afterFreshReadIsTest: after ? after.is_test : null,
  }, null, 2), { headers: { 'Content-Type': 'application/json' } });
};
