import supabaseLib from './lib/supabase.js';
import adminAuthLib from './lib/admin-auth.js';
import errorAlertLib from './lib/error-alert.js';
const { alertOnError } = errorAlertLib;

const { listAll } = supabaseLib;
const { checkAdminPassword } = adminAuthLib;

function json(statusCode, body) {
  return new Response(JSON.stringify(body), {
    status: statusCode,
    headers: { 'Content-Type': 'application/json' },
  });
}

// Advisor roster — SITE_STRATEGY.md's Advisor Connect Backend MVP build
// order, item 1. Same admin-only auth pattern as the existing advisor
// review requests page, no new admin infrastructure.
export default async (request) => {
  if (request.method !== 'GET') {
    return json(405, { ok: false, error: 'method_not_allowed' });
  }
  if (!checkAdminPassword(request)) {
    return json(401, { ok: false, error: 'unauthorized' });
  }

  try {
    const rows = await listAll('advisors', 'created_at.desc');
    return json(200, { ok: true, advisors: rows });
  } catch (err) {
    console.error('admin-list-advisors error:', err);
    await alertOnError("admin-list-advisors", err);
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
