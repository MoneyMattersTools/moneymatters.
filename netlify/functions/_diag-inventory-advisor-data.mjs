import supabaseLib from './lib/supabase.js';

const { listAll } = supabaseLib;

export default async () => {
  const requests = await listAll('advisor_review_requests', 'requested_at.desc');
  const advisors = await listAll('advisors', 'created_at.desc');
  const deliveries = await listAll('lead_deliveries', 'created_at.desc').catch((e) => ({ error: e.message }));

  return new Response(JSON.stringify({
    advisorReviewRequests: {
      count: requests.length,
      rows: requests.map((r) => ({ id: r.id, email: r.email, status: r.status, is_test: r.is_test, requested_at: r.requested_at })),
    },
    advisors: {
      count: advisors.length,
      rows: advisors.map((a) => ({ id: a.id, name: a.name, contact_email: a.contact_email, is_test: a.is_test, approved: a.approved, created_at: a.created_at })),
    },
    leadDeliveries: Array.isArray(deliveries)
      ? { count: deliveries.length, rows: deliveries.map((d) => ({ id: d.id, advisor_id: d.advisor_id, advisor_review_request_id: d.advisor_review_request_id, status: d.status })) }
      : deliveries,
  }, null, 2), { headers: { 'Content-Type': 'application/json' } });
};
