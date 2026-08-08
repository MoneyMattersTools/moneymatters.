import supabaseLib from './lib/supabase.js';
import adminAuthLib from './lib/admin-auth.js';
import errorAlertLib from './lib/error-alert.js';
const { alertOnError } = errorAlertLib;

const { listAll } = supabaseLib;
const { checkAdminPassword } = adminAuthLib;

// Round-35 ask: deletion requests (request-deletion.mjs) had no admin
// visibility at all before this — Ethan could only see them via Supabase's
// own Table Editor.
export default async (request) => {
  if (request.method !== 'GET') {
    return json(405, { ok: false, error: 'method_not_allowed' });
  }
  if (!checkAdminPassword(request)) {
    return json(401, { ok: false, error: 'unauthorized' });
  }

  try {
    const rows = await listAll('deletion_requests', 'requested_at.desc');
    return json(200, { ok: true, requests: rows });
  } catch (err) {
    console.error('admin-list-deletion-requests error:', err);
    await alertOnError("admin-list-deletion-requests", err);
    return json(500, { ok: false, error: 'server_error' });
  }
};

function json(statusCode, body) {
  return new Response(JSON.stringify(body), {
    status: statusCode,
    headers: { 'Content-Type': 'application/json' },
  });
}

export const config = {
  rateLimit: {
    windowLimit: 30,
    windowSize: 60,
    aggregateBy: ['ip', 'domain'],
  },
};
