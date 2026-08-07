import supabaseLib from './lib/supabase.js';

const { updateRecord, findOneByFilters, encodeEq } = supabaseLib;

export default async () => {
  const email = `mm-test-deletion-e2e-${Date.now()}@web-library.net`;
  const submitRes = await fetch('https://money-matters.site/api/request-deletion', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  const submitBody = await submitRes.json();

  const row = await findOneByFilters('deletion_requests', [`email=${encodeEq(email)}`]);
  if (!row) {
    return new Response(JSON.stringify({ submitStatus: submitRes.status, submitBody, found: false }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const flagged = await updateRecord('deletion_requests', row.id, { is_test: true });
  const completed = await updateRecord('deletion_requests', row.id, { status: 'Completed' });

  return new Response(JSON.stringify({
    submitStatus: submitRes.status,
    submitBody,
    rowAfterSubmit: { status: row.status, requested_at: row.requested_at },
    afterMarkCompleted: { status: completed.status },
    is_test: flagged.is_test,
  }, null, 2), { headers: { 'Content-Type': 'application/json' } });
};
