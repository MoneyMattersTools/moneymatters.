import supabaseLib from './lib/supabase.js';

const { findOneByFilters, encodeEq } = supabaseLib;

const TOKEN_RE = /^[A-Za-z0-9_-]{16,128}$/;

function json(statusCode, body) {
  return new Response(JSON.stringify(body), {
    status: statusCode,
    headers: { 'Content-Type': 'application/json' },
  });
}

// Public, no admin auth — possession of the token is the authorization,
// same trust model as get-lead-delivery.mjs. Read-only: the onboarding
// page uses this to confirm the invite is still valid before rendering
// the form, rather than letting the advisor fill it all out first.
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
    const invite = await findOneByFilters('advisor_invites', [`token=${encodeEq(token)}`]);
    if (!invite) {
      return json(404, { ok: false, error: 'invalid' });
    }
    if (invite.used_at) {
      return json(410, { ok: false, error: 'already_used' });
    }
    if (new Date(invite.expires_at).getTime() < Date.now()) {
      return json(410, { ok: false, error: 'expired' });
    }
    return json(200, { ok: true });
  } catch (err) {
    console.error('get-advisor-invite error:', err);
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
