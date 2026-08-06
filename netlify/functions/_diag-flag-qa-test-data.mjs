import { updateRecord } from './lib/supabase.js';

export default async () => {
  const results = {};

  results.user = await updateRecord('users', 'cd8bed3d-7ac2-4f8b-9dfd-2314ae7d6414', { is_test: true });
  results.reviewRequest = await updateRecord('advisor_review_requests', 'bb0c88fd-eefc-4aa8-8c22-378efda56394', { is_test: true });
  results.advisor = await updateRecord('advisors', 'c70f310e-cdfc-4348-8dfb-ed69c5ed6610', { is_test: true });

  return new Response(JSON.stringify({
    user: results.user ? { id: results.user.id, email: results.user.email, is_test: results.user.is_test } : null,
    reviewRequest: results.reviewRequest ? { id: results.reviewRequest.id, email: results.reviewRequest.email, is_test: results.reviewRequest.is_test } : null,
    advisor: results.advisor ? { id: results.advisor.id, name: results.advisor.name, is_test: results.advisor.is_test } : null,
  }, null, 2), { headers: { 'Content-Type': 'application/json' } });
};
