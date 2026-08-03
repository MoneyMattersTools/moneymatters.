import supabaseLib from './lib/supabase.js';
import adminAuthLib from './lib/admin-auth.js';

const { listAll } = supabaseLib;
const { checkAdminPassword } = adminAuthLib;

function json(statusCode, body) {
  return new Response(JSON.stringify(body), {
    status: statusCode,
    headers: { 'Content-Type': 'application/json' },
  });
}

// Internal ops view (not customer-facing) — see DESIGN_SPEC.md's
// Advisor Review Requests admin page ask. Auth is the shared
// ADMIN_PASSWORD header, not the public session system (lib/admin-auth.js).
export default async (request) => {
  if (request.method !== 'GET') {
    return json(405, { ok: false, error: 'method_not_allowed' });
  }
  if (!checkAdminPassword(request)) {
    return json(401, { ok: false, error: 'unauthorized' });
  }

  try {
    const rows = await listAll('advisor_review_requests', 'requested_at.desc');
    return json(200, { ok: true, requests: rows });
  } catch (err) {
    console.error('admin-list-advisor-requests error:', err);
    return json(500, { ok: false, error: 'server_error' });
  }
};

export const config = {
  rateLimit: {
    windowLimit: 30,
    windowSize: 60,
    aggregateBy: ['ip', 'domain'],
  },
};
