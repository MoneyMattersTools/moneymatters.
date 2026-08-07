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

export default async (request) => {
  if (request.method !== 'GET') {
    return json(405, { ok: false, error: 'method_not_allowed' });
  }
  if (!checkAdminPassword(request)) {
    return json(401, { ok: false, error: 'unauthorized' });
  }

  try {
    const rows = await listAll('advisor_invite_codes', 'created_at.desc');
    return json(200, { ok: true, codes: rows });
  } catch (err) {
    console.error('admin-list-invite-codes error:', err);
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
