import supabaseLib from './lib/supabase.js';

const { listAll } = supabaseLib;

export default async () => {
  const advisors = await listAll('advisors', 'created_at.desc');
  const realAdvisors = advisors.filter((a) => !a.is_test);
  const users = await listAll('users', 'created_at.desc');
  const realUsers = users.filter((u) => !u.is_test);
  const requests = await listAll('advisor_review_requests', 'requested_at.desc');
  const realRequests = requests.filter((r) => !r.is_test);

  return new Response(JSON.stringify({
    realAdvisorCount: realAdvisors.length,
    realAdvisors: realAdvisors.map((a) => ({ name: a.name, approved: a.approved, accepting: a.accepting })),
    realUserCount: realUsers.length,
    realAdvisorRequestCount: realRequests.length,
  }, null, 2), { headers: { 'Content-Type': 'application/json' } });
};
