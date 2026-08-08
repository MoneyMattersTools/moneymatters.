import supabaseLib from './lib/supabase.js';

const { listAll, deleteRecord } = supabaseLib;

// One-time wipe per Ethan's explicit confirmation that everything
// currently in advisor_review_requests and advisors is test data.
// Inventoried first (separate diag) — 4 review requests, 12 advisors,
// zero advisor_lead_deliveries/advisor_consent_log rows referencing
// either, so no dependent cleanup needed.
export default async () => {
  const requests = await listAll('advisor_review_requests', 'requested_at.desc');
  const advisors = await listAll('advisors', 'created_at.desc');

  const deletedRequests = [];
  for (const r of requests) {
    await deleteRecord('advisor_review_requests', r.id);
    deletedRequests.push({ id: r.id, email: r.email });
  }

  const deletedAdvisors = [];
  for (const a of advisors) {
    await deleteRecord('advisors', a.id);
    deletedAdvisors.push({ id: a.id, name: a.name });
  }

  return new Response(JSON.stringify({
    deletedRequests,
    deletedAdvisors,
    requestsRemaining: (await listAll('advisor_review_requests', 'requested_at.desc')).length,
    advisorsRemaining: (await listAll('advisors', 'created_at.desc')).length,
  }, null, 2), { headers: { 'Content-Type': 'application/json' } });
};
