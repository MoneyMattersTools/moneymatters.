import crypto from 'node:crypto';
import supabaseLib from './lib/supabase.js';
import adminAuthLib from './lib/admin-auth.js';

const { createRecord } = supabaseLib;
const { checkAdminPassword } = adminAuthLib;

const INVITE_TTL_DAYS = 30; // outreach, not a transactional flow — advisors need real time to get to this

function json(statusCode, body) {
  return new Response(JSON.stringify(body), {
    status: statusCode,
    headers: { 'Content-Type': 'application/json' },
  });
}

// Round 2 addition (SITE_STRATEGY.md, locked 2026-08-05): replaces manual
// roster entry. Ethan sends this link himself through his own outreach —
// this endpoint only generates it, nothing here emails the advisor.
export default async (request) => {
  if (request.method !== 'POST') {
    return json(405, { ok: false, error: 'method_not_allowed' });
  }
  if (!checkAdminPassword(request)) {
    return json(401, { ok: false, error: 'unauthorized' });
  }

  try {
    const token = crypto.randomBytes(32).toString('base64url');
    const expiresAt = new Date(Date.now() + INVITE_TTL_DAYS * 24 * 60 * 60 * 1000).toISOString();

    await createRecord('advisor_invites', { token, expires_at: expiresAt });

    const siteUrl = (process.env.SITE_URL || '').replace(/\/$/, '');
    const inviteLink = `${siteUrl}/advisor-onboarding.html?token=${token}`;

    return json(200, { ok: true, inviteLink, expiresAt });
  } catch (err) {
    console.error('admin-create-advisor-invite error:', err);
    return json(500, { ok: false, error: 'server_error' });
  }
};

export const config = {
  rateLimit: {
    windowLimit: 20,
    windowSize: 60,
    aggregateBy: ['ip', 'domain'],
  },
};
