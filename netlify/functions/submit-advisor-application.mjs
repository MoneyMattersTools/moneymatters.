import supabaseLib from './lib/supabase.js';
import specialtiesLib from './lib/specialties.js';
import errorAlertLib from './lib/error-alert.js';
const { alertOnError } = errorAlertLib;

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

// SITE_STRATEGY.md item 6 (locked 2026-08-08): the no-code path for
// advisors who land on for-advisors.html without an invitation. Public,
// no access-code check (that's the whole point — this is the door for
// people the gate would otherwise turn away), but the resulting row is
// marked approved: false so it's excluded from matching (see
// admin-advisor-requests.html's acceptingAdvisors filter) until Ethan
// reviews it from the admin dashboard's Pending Applications section.
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
    // Same courtesy rate-limit pattern as submit-advisor-onboarding.mjs —
    // caught broadly (not message-matched) because countRecentByIpSince
    // issues a HEAD request, which HTTP forbids a response body on, so
    // there's nothing for a message-match to inspect.
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
        console.error('submit-advisor-application rate-limit check skipped:', rateLimitErr.message);
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
      approved: false,
    };
    let advisor;
    try {
      advisor = await createRecord('advisors', advisorFields);
    } catch (insertErr) {
      // Same "existing path must not break on an unapplied migration"
      // reasoning as submit-advisor-onboarding.mjs's request_ip fallback —
      // strip whichever of request_ip/approved PostgREST rejected and
      // retry, since both are additive columns from later migrations.
      let fields = advisorFields;
      let err = insertErr;
      if (/request_ip/.test(err.message)) {
        const { request_ip, ...rest } = fields;
        fields = rest;
        try {
          advisor = await createRecord('advisors', fields);
        } catch (retryErr) {
          err = retryErr;
        }
      }
      if (!advisor && /approved/.test(err.message)) {
        const { approved, ...rest } = fields;
        advisor = await createRecord('advisors', rest);
      } else if (!advisor) {
        throw err;
      }
    }

    return json(200, { ok: true, advisor });
  } catch (err) {
    console.error('submit-advisor-application error:', err);
    await alertOnError("submit-advisor-application", err);
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
