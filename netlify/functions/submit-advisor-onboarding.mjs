import supabaseLib from './lib/supabase.js';
import specialtiesLib from './lib/specialties.js';
import advisorAccessLib from './lib/advisor-access.js';

const { createRecord, updateRecordIf, countRecentByIpSince, encodeEq } = supabaseLib;
const { SPECIALTIES_SET } = specialtiesLib;
const { hasValidGrant, getGrantCode } = advisorAccessLib;

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

// Single reusable registration page, gated by a per-advisor single-use
// invite code (SITE_STRATEGY.md item 4, locked 2026-08-07; codes made
// unique/single-use in the round-35 ask — see advisor_invite_codes and
// verify-advisor-access-code.mjs) — advisor-onboarding.html hides the
// form client-side without a valid grant, but that's UX only, so this
// checks the same signed cookie server-side before accepting a
// submission (someone could otherwise skip the gate page and POST here
// directly). IP cooldown below is the anti-spam layer for advisors who
// do have a code (same pattern and reasoning as submit-diagnostic.mjs /
// request-advisor-review.mjs — Netlify's platform-native rate limiting
// isn't available on the current plan tier, confirmed in those files
// already).
export default async (request, context) => {
  if (request.method !== 'POST') {
    return json(405, { ok: false, error: 'method_not_allowed' });
  }

  if (!hasValidGrant(request)) {
    return json(403, { ok: false, error: 'access_required' });
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
    // pending_source fallback. Caught broadly (not message-matched like
    // the other fallbacks in this codebase) because this specific check
    // is a HEAD request — HTTP forbids a response body on HEAD, so
    // PostgREST's error detail never reaches this catch to match against
    // in the first place. Safe to be broad here: this check is a
    // courtesy rate limit, not the actual write, so skipping it on any
    // failure just means one submission wasn't cooldown-checked, not a
    // silently wrong write.
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
        console.error('submit-advisor-onboarding rate-limit check skipped:', rateLimitErr.message);
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

    // Best-effort traceability: link the invite code to who actually used
    // it, so the admin page's invite-codes list shows more than just
    // "used." Never fails the submission — the advisor is already on the
    // roster at this point, and this is bookkeeping, not the write that
    // matters.
    const grantCode = getGrantCode(request);
    if (grantCode) {
      try {
        await updateRecordIf(
          'advisor_invite_codes',
          [`code=${encodeEq(grantCode)}`],
          { used_by_email: contactEmail }
        );
      } catch (linkErr) {
        console.error('submit-advisor-onboarding invite-code linkage skipped:', linkErr.message);
      }
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
