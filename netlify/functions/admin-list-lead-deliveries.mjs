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

// One row per "this lead was offered to this advisor" — the matching
// queue view joins this client-side against requests + advisors (all
// small, admin-only datasets; no need for a server-side join at this
// scale). Timeout state is derived from expires_at here, not stored —
// see admin-advisor-requests.html's rendering logic.
export default async (request) => {
  if (request.method !== 'GET') {
    return json(405, { ok: false, error: 'method_not_allowed' });
  }
  if (!checkAdminPassword(request)) {
    return json(401, { ok: false, error: 'unauthorized' });
  }

  try {
    const rows = await listAll('advisor_lead_deliveries', 'assigned_at.desc');
    return json(200, { ok: true, deliveries: rows });
  } catch (err) {
    console.error('admin-list-lead-deliveries error:', err);
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
