import supabaseLib from './lib/supabase.js';

const { listAll } = supabaseLib;

export default async () => {
  const requests = await listAll('advisor_review_requests', 'requested_at.desc');
  const advisors = await listAll('advisors', 'created_at.desc');
  const deliveries = await listAll('advisor_lead_deliveries', 'assigned_at.desc').catch((e) => ({ error: e.message }));
  const consentLog = await listAll('advisor_consent_log', 'shared_at.desc').catch((e) => ({ error: e.message }));

  return new Response(JSON.stringify({
    advisorReviewRequests: {
      count: requests.length,
      rows: requests.map((r) => ({ id: r.id, email: r.email, status: r.status, is_test: r.is_test, requested_at: r.requested_at })),
    },
    advisors: {
      count: advisors.length,
      rows: advisors.map((a) => ({ id: a.id, name: a.name, contact_email: a.contact_email, is_test: a.is_test, approved: a.approved, created_at: a.created_at })),
    },
    advisorLeadDeliveries: Array.isArray(deliveries)
      ? { count: deliveries.length, rows: deliveries.map((d) => ({ id: d.id, advisor_id: d.advisor_id, advisor_review_request_id: d.advisor_review_request_id, status: d.status })) }
      : deliveries,
    advisorConsentLog: Array.isArray(consentLog)
      ? { count: consentLog.length, rows: consentLog.map((c) => ({ id: c.id, advisor_id: c.advisor_id, advisor_review_request_id: c.advisor_review_request_id })) }
      : consentLog,
  }, null, 2), { headers: { 'Content-Type': 'application/json' } });
};
