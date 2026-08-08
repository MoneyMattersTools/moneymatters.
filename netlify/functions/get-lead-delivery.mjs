import supabaseLib from './lib/supabase.js';
import errorAlertLib from './lib/error-alert.js';
const { alertOnError } = errorAlertLib;

const { findOneByFilters, encodeEq } = supabaseLib;

function json(statusCode, body) {
  return new Response(JSON.stringify(body), {
    status: statusCode,
    headers: { 'Content-Type': 'application/json' },
  });
}

const TOKEN_RE = /^[A-Za-z0-9_-]{16,128}$/;

// Public, no admin auth — possession of the (unguessable, single-use)
// token is the authorization, same trust model as the magic-link
// verification flow. Read-only: the advisor's confirm page uses this to
// show what they're being asked to accept, before the actual accept POST.
export default async (request) => {
  if (request.method !== 'GET') {
    return json(405, { ok: false, error: 'method_not_allowed' });
  }

  const url = new URL(request.url);
  const token = url.searchParams.get('token') || '';
  if (!token || !TOKEN_RE.test(token)) {
    return json(400, { ok: false, error: 'invalid' });
  }

  try {
    const delivery = await findOneByFilters('advisor_lead_deliveries', [`accept_token=${encodeEq(token)}`]);
    if (!delivery) {
      return json(404, { ok: false, error: 'invalid' });
    }
    if (delivery.status === 'accepted') {
      return json(410, { ok: false, error: 'already_accepted' });
    }
    if (new Date(delivery.expires_at).getTime() < Date.now()) {
      return json(410, { ok: false, error: 'expired' });
    }
    return json(200, { ok: true, snapshot: delivery.snapshot_text });
  } catch (err) {
    console.error('get-lead-delivery error:', err);
    await alertOnError("get-lead-delivery", err);
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
