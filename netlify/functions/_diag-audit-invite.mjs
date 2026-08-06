import crypto from 'node:crypto';
import supabaseLib from './lib/supabase.js';

const { createRecord, deleteRecord, findOneByFilters, encodeEq, listAll } = supabaseLib;

function json(statusCode, body) {
  return new Response(JSON.stringify(body), {
    status: statusCode,
    headers: { 'Content-Type': 'application/json' },
  });
}

// Temp — full-site audit. Mirrors admin-create-advisor-invite.mjs's write
// (the only admin-gated part of the self-onboarding flow being tested;
// the actual submission goes through the real public endpoint). Also
// supports a purge action for cleanup. Delete after use.
export default async (request) => {
  const url = new URL(request.url);
  const action = url.searchParams.get('action');

  if (request.method === 'POST' && action === 'create') {
    const token = crypto.randomBytes(32).toString('base64url');
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    await createRecord('advisor_invites', { token, expires_at: expiresAt });
    return json(200, { ok: true, token });
  }

  if (request.method === 'DELETE' && action === 'purge') {
    const payload = await request.json();
    if (payload.inviteToken) {
      const invite = await findOneByFilters('advisor_invites', [`token=${encodeEq(payload.inviteToken)}`]);
      if (invite) await deleteRecord('advisor_invites', invite.id);
    }
    if (payload.advisorEmail) {
      const all = await listAll('advisors');
      const matches = all.filter((a) => a.contact_email === payload.advisorEmail);
      for (const m of matches) await deleteRecord('advisors', m.id);
    }
    return json(200, { ok: true, cleaned: true });
  }

  if (request.method === 'DELETE' && action === 'purge-user') {
    const payload = await request.json();
    const email = payload.email;
    if (!email) return json(400, { ok: false, error: 'missing email' });

    const user = await findOneByFilters('users', [`email=${encodeEq(email)}`]);
    if (user) await deleteRecord('users', user.id);

    const tokens = await listAll('verification_tokens');
    for (const t of tokens.filter((t) => t.email === email)) await deleteRecord('verification_tokens', t.id);

    const requests = await listAll('advisor_review_requests');
    for (const r of requests.filter((r) => r.email === email)) await deleteRecord('advisor_review_requests', r.id);

    return json(200, { ok: true, cleaned: true });
  }

  return json(400, { ok: false, error: 'unknown_action' });
};
