import supabaseLib from './lib/supabase.js';
import adminAuthLib from './lib/admin-auth.js';
import errorAlertLib from './lib/error-alert.js';
const { alertOnError } = errorAlertLib;

const { updateRecord } = supabaseLib;
const { checkAdminPassword } = adminAuthLib;

// SITE_STRATEGY.md item 6 (locked 2026-08-08): moves an advisor row out of
// the admin dashboard's Pending Applications section and into the live,
// matchable roster.
export default async (request) => {
  if (request.method !== 'POST') {
    return json(405, { ok: false, error: 'method_not_allowed' });
  }
  if (!checkAdminPassword(request)) {
    return json(401, { ok: false, error: 'unauthorized' });
  }

  let payload;
  try {
    payload = await request.json();
  } catch {
    return json(400, { ok: false, error: 'invalid_json' });
  }

  const id = typeof payload.id === 'string' ? payload.id : '';
  if (!id) {
    return json(400, { ok: false, error: 'invalid_request' });
  }

  try {
    const updated = await updateRecord('advisors', id, { approved: true });
    if (!updated) {
      return json(404, { ok: false, error: 'not_found' });
    }
    return json(200, { ok: true, advisor: updated });
  } catch (err) {
    console.error('admin-approve-advisor error:', err);
    await alertOnError("admin-approve-advisor", err);
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
