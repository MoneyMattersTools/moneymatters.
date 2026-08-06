import { findByEmail, listAll } from './lib/supabase.js';

export default async () => {
  const email = '75stacee@web-library.net';
  const user = await findByEmail('users', email);

  const allReviewRequests = await listAll('advisor_review_requests', 'requested_at.desc');
  const matchingReviewRequests = allReviewRequests.filter(
    (r) => (r.email || '').toLowerCase() === email
  );

  const allAdvisors = await listAll('advisors', 'created_at.desc');
  const testAdvisors = allAdvisors.filter((a) => /test/i.test(a.name || '') || /test/i.test(a.firm || ''));

  return new Response(JSON.stringify({
    user: user ? { id: user.id, email: user.email, is_test: user.is_test, plan: user.plan } : null,
    matchingReviewRequests: matchingReviewRequests.map((r) => ({
      id: r.id, user_email: r.user_email, email: r.email, is_test: r.is_test, created_at: r.created_at,
    })),
    testAdvisors: testAdvisors.map((a) => ({
      id: a.id, name: a.name, firm: a.firm, contact_email: a.contact_email, is_test: a.is_test, created_at: a.created_at,
    })),
    totalReviewRequests: allReviewRequests.length,
    totalAdvisors: allAdvisors.length,
  }, null, 2), { headers: { 'Content-Type': 'application/json' } });
};
