import supabaseLib from './lib/supabase.js';

const { listAll } = supabaseLib;

export default async () => {
  const advisors = await listAll('advisors', 'created_at.desc');
  const users = await listAll('users', 'created_at.desc');
  const requests = await listAll('advisor_review_requests', 'requested_at.desc');
  return new Response(JSON.stringify({
    realAdvisorCount: advisors.filter((a) => !a.is_test).length,
    realUserCount: users.filter((u) => !u.is_test).length,
    realAdvisorRequestCount: requests.filter((r) => !r.is_test).length,
  }, null, 2), { headers: { 'Content-Type': 'application/json' } });
};
