import supabaseLib from './lib/supabase.js';
import specialtiesLib from './lib/specialties.js';

const { createRecord, countRecentByIpSince } = supabaseLib;
const { SPECIALTIES_SET } = specialtiesLib;

const NAME_MAX_LENGTH = 120;
const FIRM_MAX_LENGTH = 120;
const EMAIL_MAX_LENGTH = 254;
const SCHEDULING_LINK_MAX_LENGTH = 300;
const STATE_CODE_RE = /^[A-Z]{2}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const IP_RATE_LIMIT_WINDOW_SECONDS = 60;
const IP_RATE_LIMIT_MAX_REQUESTS = 5;

function json(statusCode, body) {
  return new Response(JSON.stringify(body), {
    status: statusCode,
    headers: { 'Content-Type': 'application/json' },
  });
}

function getClientIp(request, context) {
  if (context && typeof context.ip === 'string' && context.ip) return context.ip;
  const headerIp = request.headers.get('x-nf-client-connection-ip');
  if (headerIp) return headerIp;
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) return forwardedFor.split(',')[0].trim();
  return 'unknown';
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

// Public, no token — advisor-onboarding.html is now a single reusable
// registration page (replaces the per-advisor invite-link system).
// Anyone submitting valid, real-looking fields lands directly on the
// roster. Ethan reviews/prunes the roster from the admin page rather
// than gating who can submit in the first place, same tradeoff the
// advisor-review-request intake already makes on the user side. IP
// cooldown is the real protection here (same pattern and reasoning as
// submit-diagnostic.mjs / request-advisor-review.mjs — Netlify's
// platform-native rate limiting isn't available on the current plan
// tier, confirmed in those files already).
export default async (request, context) => {
  if (request.method !== 'POST') {
    return json(405, { ok: false, error: 'method_not_allowed' });
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
  const accepting = payload.accepting !== false;

  if (!name || !contactEmail || !EMAIL_RE.test(contactEmail) || contactEmail.length > EMAIL_MAX_LENGTH) {
    return json(400, { ok: false, error: 'invalid_request' });
  }

  const clientIp = getClientIp(request, context);

  try {
    // Best-effort: if request_ip isn't live yet (migration 0007 not yet
    // applied), skip the cooldown check rather than fail the whole
    // submission — same "existing/new path must not break on an
    // unapplied migration" reasoning as submit-diagnostic.mjs's
    // pending_source fallback.
    if (clientIp !== 'unknown') {
      try {
        const recentCount = await countRecentByIpSince(
          'advisors',
          clientIp,
          IP_RATE_LIMIT_WINDOW_SECONDS,
          'created_at'
        );
        if (recentCount >= IP_RATE_LIMIT_MAX_REQUESTS) {
          return json(429, { ok: false, error: 'rate_limited' });
        }
      } catch (rateLimitErr) {
        if (!/request_ip/.test(rateLimitErr.message)) throw rateLimitErr;
      }
    }

    const advisorFields = {
      name,
      firm: firm || null,
      contact_email: contactEmail,
      scheduling_link: schedulingLink || null,
      licensed_states: licensedStates,
      specialty_tags: specialtyTags,
      accepting,
      request_ip: clientIp,
    };
    let advisor;
    try {
      advisor = await createRecord('advisors', advisorFields);
    } catch (insertErr) {
      if (!/request_ip/.test(insertErr.message)) throw insertErr;
      const { request_ip, ...fieldsWithoutIp } = advisorFields;
      advisor = await createRecord('advisors', fieldsWithoutIp);
    }

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
