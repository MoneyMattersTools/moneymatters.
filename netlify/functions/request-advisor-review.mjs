import supabaseLib from './lib/supabase.js';
import sessionLib from './lib/session.js';
import resendLib from './lib/resend.js';
import specialtiesLib from './lib/specialties.js';
import errorAlertLib from './lib/error-alert.js';
const { alertOnError } = errorAlertLib;

const { createRecord, countRecentByIpSince, findOneByFilters, findByEmail, encodeEq } = supabaseLib;
const { readSessionFromRequest } = sessionLib;
const { sendEmail } = resendLib;
const { SPECIALTIES_SET, URGENCY_VALUES } = specialtiesLib;

const LOCATION_MAX_LENGTH = 120;
const DETAILS_MAX_LENGTH = 600;
const MAX_SITUATIONAL_ITEMS = 10;
const SITUATIONAL_ITEM_MAX_LENGTH = 80;

// §26.7: a range bucket, not an exact figure — users are unlikely to be
// comfortable sharing a specific net worth number even when opted in.
// Must match the <select> options in index.html's advisor-intake-networth.
// Credit score and household income (Round 3) follow the same pattern —
// same opt-in gate, same range-not-figure reasoning.
const ALLOWED_NET_WORTH_RANGES = new Set(['0-250k', '250k-500k', '500k-1mm', '1mm-5mm', '5mm+']);
const ALLOWED_CREDIT_SCORE_RANGES = new Set(['below-580', '580-669', '670-739', '740-799', '800+']);
const ALLOWED_HOUSEHOLD_INCOME_RANGES = new Set(['0-75k', '75k-150k', '150k-250k', '250k-500k', '500k+']);

// Must match the checkbox values in index.html's advisor-intake-checklist
// exactly — keeps "Situational Details" a controlled checklist rather than
// unrestricted free text, per DESIGN_SPEC.md's advisor-snapshot format.
// §47 (SITE_STRATEGY.md Advisor Connect Backend): now the same shared
// taxonomy advisor specialty_tags map to — see lib/specialties.js.
const ALLOWED_SITUATIONAL = SPECIALTIES_SET;

const IP_RATE_LIMIT_WINDOW_SECONDS = 60;
const IP_RATE_LIMIT_MAX_REQUESTS = 5;
const EMAIL_COOLDOWN_SECONDS = 5 * 60;

// Airtable stores these as plain text — if this table is ever exported to
// CSV and opened in a spreadsheet app, a value starting with =/+/-/@ could
// execute as a formula there (CWE-1236). Neutralize before storage.
function neutralizeFormulaPrefix(value) {
  return /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
}

function getClientIp(request, context) {
  if (context && typeof context.ip === 'string' && context.ip) return context.ip;
  const headerIp = request.headers.get('x-nf-client-connection-ip');
  if (headerIp) return headerIp;
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) return forwardedFor.split(',')[0].trim();
  return 'unknown';
}

function json(statusCode, body) {
  return new Response(JSON.stringify(body), {
    status: statusCode,
    headers: { 'Content-Type': 'application/json' },
  });
}

// Opt-in only — the visitor picks what to surface, nothing is inferred.
// Mirrors DESIGN_SPEC.md's advisor-snapshot situational-details format.
function cleanSituational(value) {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item) => typeof item === 'string' && ALLOWED_SITUATIONAL.has(item.trim().slice(0, SITUATIONAL_ITEM_MAX_LENGTH)))
    .map((item) => item.trim().slice(0, SITUATIONAL_ITEM_MAX_LENGTH))
    .slice(0, MAX_SITUATIONAL_ITEMS);
}

export default async (request, context) => {
  if (request.method !== 'POST') {
    return json(405, { ok: false, error: 'method_not_allowed' });
  }

  // This CTA only ever appears on the results screen, which already
  // requires a verified session — so the request is authenticated via the
  // existing session cookie, not a re-entered email address.
  const session = readSessionFromRequest(request);
  if (!session || !session.email) {
    return json(401, { ok: false, error: 'not_authenticated' });
  }

  let payload;
  try {
    payload = await request.json();
  } catch {
    return json(400, { ok: false, error: 'invalid_json' });
  }

  const situational = cleanSituational(payload.situational);
  const rawLocation = typeof payload.location === 'string' ? payload.location.trim().slice(0, LOCATION_MAX_LENGTH) : '';
  const location = neutralizeFormulaPrefix(rawLocation);
  const rawDetails = typeof payload.details === 'string' ? payload.details.trim().slice(0, DETAILS_MAX_LENGTH) : '';
  const details = neutralizeFormulaPrefix(rawDetails);

  // §21.2: separate, off-by-default consent for sharing the Financial
  // Health Score + Net Worth range with the matched advisor, distinct
  // from the situational checklist above, which is about goals, not figures.
  const shareScores = payload.shareScores === true;
  const netWorthRange =
    typeof payload.netWorthRange === 'string' && ALLOWED_NET_WORTH_RANGES.has(payload.netWorthRange)
      ? payload.netWorthRange
      : null;
  const creditScoreRange =
    typeof payload.creditScoreRange === 'string' && ALLOWED_CREDIT_SCORE_RANGES.has(payload.creditScoreRange)
      ? payload.creditScoreRange
      : null;
  const householdIncomeRange =
    typeof payload.householdIncomeRange === 'string' && ALLOWED_HOUSEHOLD_INCOME_RANGES.has(payload.householdIncomeRange)
      ? payload.householdIncomeRange
      : null;

  // SITE_STRATEGY.md's lead-value ranking, signal #2: timeline is the one
  // opportunity/urgency signal intake didn't capture before. Optional —
  // an old client or a slow rollout of this field shouldn't ever block a
  // submission.
  const urgency =
    typeof payload.urgency === 'string' && URGENCY_VALUES.has(payload.urgency) ? payload.urgency : null;

  const clientIp = getClientIp(request, context);

  try {
    if (clientIp !== 'unknown') {
      const recentCount = await countRecentByIpSince(
        'advisor_review_requests',
        clientIp,
        IP_RATE_LIMIT_WINDOW_SECONDS,
        'requested_at'
      );
      if (recentCount >= IP_RATE_LIMIT_MAX_REQUESTS) {
        return json(429, { ok: false, error: 'rate_limited' });
      }
    }

    // Per-email cooldown — the IP gate alone isn't enough here, since auth
    // is a long-lived session cookie rather than a fresh email confirmation
    // (mirrors the per-email cooldown pattern already used in
    // submit-diagnostic.mjs / resend-login.mjs for the same reason).
    const cooldownSinceIso = new Date(Date.now() - EMAIL_COOLDOWN_SECONDS * 1000).toISOString();
    const recentByEmail = await findOneByFilters('advisor_review_requests', [
      `email=${encodeEq(session.email.toLowerCase())}`,
      `requested_at=gt.${encodeURIComponent(cooldownSinceIso)}`,
    ]);
    if (recentByEmail) {
      return json(429, { ok: false, error: 'cooldown_active' });
    }

    const fields = {
      email: session.email,
      situational_details: situational,
      details: details,
      location: location,
      urgency: urgency,
      requested_at: new Date().toISOString(),
      request_ip: clientIp,
      // §22.4: manual data-tracking only, no site-facing UI. The team
      // advances this by hand as a request moves through Matched /
      // Meeting Taken — this just seeds the starting state.
      status: 'Requested',
    };

    if (shareScores) {
      const user = await findByEmail('users', session.email);
      fields.shared_scores = {
        consent: true,
        healthScore: user ? user.health_score : null,
        healthScoreBand: user ? user.health_score_band : null,
        netWorthRange: netWorthRange,
        creditScoreRange: creditScoreRange,
        householdIncomeRange: householdIncomeRange,
      };
    }

    await createRecord('advisor_review_requests', fields);

    // §21 addendum: confirm receipt by email — this previously only wrote
    // to Airtable with no user-facing confirmation beyond the on-page
    // message. Best-effort: a delivery failure here shouldn't fail the
    // request, since the record is already saved.
    try {
      await sendEmail({
        to: session.email,
        subject: 'We got your advisor review request',
        text: "Thanks. We've received your request to be reviewed for a free advisor match.\n\nOur team will look it over and follow up by email once we've matched you with a fee-only, fiduciary advisor. There's no cost and no obligation.\n\nDidn't request this? You can ignore this email.",
        html: "<p>Thanks. We've received your request to be reviewed for a free advisor match.</p><p>Our team will look it over and follow up by email once we've matched you with a fee-only, fiduciary advisor. There's no cost and no obligation.</p><p>Didn't request this? You can ignore this email.</p>",
      });
    } catch (emailErr) {
      console.error('request-advisor-review confirmation email error:', emailErr);
    }

    return json(200, { ok: true });
  } catch (err) {
    console.error('request-advisor-review error:', err);
    await alertOnError("request-advisor-review", err);
    return json(500, { ok: false, error: 'server_error' });
  }
};

export const config = {
  rateLimit: {
    windowLimit: 5,
    windowSize: 60,
    aggregateBy: ['ip', 'domain'],
  },
};
