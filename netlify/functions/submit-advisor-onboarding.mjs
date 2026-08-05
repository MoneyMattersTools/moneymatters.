import supabaseLib from './lib/supabase.js';
import specialtiesLib from './lib/specialties.js';

const { createRecord, updateRecord, findOneByFilters, encodeEq } = supabaseLib;
const { SPECIALTIES_SET } = specialtiesLib;

const TOKEN_RE = /^[A-Za-z0-9_-]{16,128}$/;
const NAME_MAX_LENGTH = 120;
const FIRM_MAX_LENGTH = 120;
const EMAIL_MAX_LENGTH = 254;
const SCHEDULING_LINK_MAX_LENGTH = 300;
const STATE_CODE_RE = /^[A-Z]{2}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function json(statusCode, body) {
  return new Response(JSON.stringify(body), {
    status: statusCode,
    headers: { 'Content-Type': 'application/json' },
  });
}

function cleanStates(value) {
  if (!Array.isArray(value)) return [];
  return value
    .map((s) => (typeof s === 'string' ? s.trim().toUpperCase() : ''))
    .filter((s) => STATE_CODE_RE.test(s));
}

function cleanSpecialties(value) {
  if (!Array.isArray(value)) return [];
  return value.filter((s) => typeof s === 'string' && SPECIALTIES_SET.has(s));
}

// Public, token-gated — the advisor-facing half of Round 2's self-onboarding
// (SITE_STRATEGY.md, locked 2026-08-05). Same field validation as
// admin-create-advisor.mjs; the only difference is the auth model (a
// single-use invite token instead of ADMIN_PASSWORD) and that the token
// gets marked used on success so the link can't be reused.
export default async (request) => {
  if (request.method !== 'POST') {
    return json(405, { ok: false, error: 'method_not_allowed' });
  }

  let payload;
  try {
    payload = await request.json();
  } catch {
    return json(400, { ok: false, error: 'invalid_json' });
  }

  const token = typeof payload.token === 'string' ? payload.token : '';
  if (!token || !TOKEN_RE.test(token)) {
    return json(400, { ok: false, error: 'invalid' });
  }

  const name = typeof payload.name === 'string' ? payload.name.trim().slice(0, NAME_MAX_LENGTH) : '';
  const firm = typeof payload.firm === 'string' ? payload.firm.trim().slice(0, FIRM_MAX_LENGTH) : '';
  const contactEmail = typeof payload.contactEmail === 'string' ? payload.contactEmail.trim().toLowerCase() : '';
  const schedulingLink =
    typeof payload.schedulingLink === 'string' ? payload.schedulingLink.trim().slice(0, SCHEDULING_LINK_MAX_LENGTH) : '';
  const licensedStates = cleanStates(payload.licensedStates);
  const specialtyTags = cleanSpecialties(payload.specialtyTags);
  const accepting = payload.accepting !== false;

  if (!name || !contactEmail || !EMAIL_RE.test(contactEmail) || contactEmail.length > EMAIL_MAX_LENGTH) {
    return json(400, { ok: false, error: 'invalid_request' });
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

    const advisor = await createRecord('advisors', {
      name,
      firm: firm || null,
      contact_email: contactEmail,
      scheduling_link: schedulingLink || null,
      licensed_states: licensedStates,
      specialty_tags: specialtyTags,
      accepting,
    });

    await updateRecord('advisor_invites', invite.id, { used_at: new Date().toISOString() });

    return json(200, { ok: true, advisor });
  } catch (err) {
    console.error('submit-advisor-onboarding error:', err);
    return json(500, { ok: false, error: 'server_error' });
  }
};

export const config = {
  rateLimit: {
    windowLimit: 10,
    windowSize: 60,
    aggregateBy: ['ip', 'domain'],
  },
};
