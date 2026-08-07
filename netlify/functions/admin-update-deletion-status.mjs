import supabaseLib from './lib/supabase.js';
import adminAuthLib from './lib/admin-auth.js';

const { updateRecord } = supabaseLib;
const { checkAdminPassword } = adminAuthLib;

const VALID_STATUSES = ['Pending', 'Completed'];

function json(statusCode, body) {
  return new Response(JSON.stringify(body), {
    status: statusCode,
    headers: { 'Content-Type': 'application/json' },
  });
}

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
  const status = typeof payload.status === 'string' ? payload.status : '';
  if (!id || !VALID_STATUSES.includes(status)) {
    return json(400, { ok: false, error: 'invalid_request' });
  }

  try {
    const updated = await updateRecord('deletion_requests', id, { status });
    if (!updated) {
      return json(404, { ok: false, error: 'not_found' });
    }
    return json(200, { ok: true });
  } catch (err) {
    console.error('admin-update-deletion-status error:', err);
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
