import supabaseLib from './lib/supabase.js';

const { updateRecord, findOneByFilters, encodeEq } = supabaseLib;

const TEST_ROW_ID = 'c147cc97-ad03-42f4-9f26-985eeccd0bb8';

export default async () => {
  const before = await findOneByFilters('advisors', [`id=${encodeEq(TEST_ROW_ID)}`]);
  const updated = await updateRecord('advisors', TEST_ROW_ID, { approved: true });
  return new Response(JSON.stringify({
    before: { approved: before.approved, accepting: before.accepting, is_test: before.is_test },
    after: { approved: updated.approved, accepting: updated.accepting, is_test: updated.is_test },
  }, null, 2), { headers: { 'Content-Type': 'application/json' } });
};
