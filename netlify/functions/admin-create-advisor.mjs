import supabaseLib from './lib/supabase.js';
import adminAuthLib from './lib/admin-auth.js';
import specialtiesLib from './lib/specialties.js';
import errorAlertLib from './lib/error-alert.js';
const { alertOnError } = errorAlertLib;

const { createRecord } = supabaseLib;
const { checkAdminPassword } = adminAuthLib;
const { SPECIALTIES_SET } = specialtiesLib;

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

// Advisor roster entry — manually entered by Ethan for MVP (no advisor
// self-serve signup, per SITE_STRATEGY.md's explicit MVP discipline).
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

  const name = typeof payload.name === 'string' ? payload.name.trim().slice(0, NAME_MAX_LENGTH) : '';
  const firm = typeof payload.firm === 'string' ? payload.firm.trim().slice(0, FIRM_MAX_LENGTH) : '';
  const contactEmail = typeof payload.contactEmail === 'string' ? payload.contactEmail.trim().toLowerCase() : '';
  const schedulingLink =
    typeof payload.schedulingLink === 'string' ? payload.schedulingLink.trim().slice(0, SCHEDULING_LINK_MAX_LENGTH) : '';
  const licensedStates = cleanStates(payload.licensedStates);
  const specialtyTags = cleanSpecialties(payload.specialtyTags);
  const accepting = payload.accepting !== false; // defaults to true

  if (!name || !contactEmail || !EMAIL_RE.test(contactEmail) || contactEmail.length > EMAIL_MAX_LENGTH) {
    return json(400, { ok: false, error: 'invalid_request' });
  }

  try {
    const advisor = await createRecord('advisors', {
      name,
      firm: firm || null,
      contact_email: contactEmail,
      scheduling_link: schedulingLink || null,
      licensed_states: licensedStates,
      specialty_tags: specialtyTags,
      accepting,
    });
    return json(200, { ok: true, advisor });
  } catch (err) {
    console.error('admin-create-advisor error:', err);
    await alertOnError("admin-create-advisor", err);
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
