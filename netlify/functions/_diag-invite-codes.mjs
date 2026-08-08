import supabaseLib from './lib/supabase.js';
const { listAll, deleteRecord } = supabaseLib;

function json(statusCode, body) {
  return new Response(JSON.stringify(body), { status: statusCode, headers: { 'Content-Type': 'application/json' } });
}

const TEST_PREFIX_RE = /^(FIXED|DEBUG|E2E)/i;

export default async (request) => {
  const url = new URL(request.url);
  const doDelete = url.searchParams.get('delete') === '1';

  const rows = await listAll('advisor_invite_codes', 'created_at.desc');
  const testRows = rows.filter((r) => TEST_PREFIX_RE.test(r.code) || (r.label && TEST_PREFIX_RE.test(r.label)));

  if (!doDelete) {
    return json(200, { ok: true, totalCodes: rows.length, testRowsFound: testRows.length, testRows: testRows.map((r) => ({ id: r.id, code: r.code, label: r.label, used_at: r.used_at })) });
  }

  let deleted = 0;
  for (const r of testRows) {
    await deleteRecord('advisor_invite_codes', r.id);
    deleted++;
  }
  return json(200, { ok: true, deleted });
};
