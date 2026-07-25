import airtableLib from './lib/airtable.js';
import sessionLib from './lib/session.js';

const { createRecord, countRecentByIpSince, findOneByFormula, escapeFormulaValue } = airtableLib;
const { readSessionFromRequest } = sessionLib;

const LOCATION_MAX_LENGTH = 120;
const DETAILS_MAX_LENGTH = 600;
const MAX_SITUATIONAL_ITEMS = 10;
const SITUATIONAL_ITEM_MAX_LENGTH = 80;

// Must match the checkbox values in index.html's advisor-intake-checklist
// exactly — keeps "Situational Details" a controlled checklist rather than
// unrestricted free text, per DESIGN_SPEC.md's advisor-snapshot format.
// Broadened per §18.9 — the original 5 covered only niche windfall
// scenarios, not the majority of real reasons people seek an advisor.
const ALLOWED_SITUATIONAL = new Set([
  'Saving for retirement',
  'Paying off debt',
  'Buying a home',
  'Growing my investments',
  "Saving for a child's education",
  'Inheritance or major windfall',
  'Selling a business or equity compensation',
  'New to investing',
  'Not sure — just want general guidance',
]);

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

  const clientIp = getClientIp(request, context);

  try {
    if (clientIp !== 'unknown') {
      const recentCount = await countRecentByIpSince(
        'Advisor Review Requests',
        clientIp,
        IP_RATE_LIMIT_WINDOW_SECONDS,
        'Requested At'
      );
      if (recentCount >= IP_RATE_LIMIT_MAX_REQUESTS) {
        return json(429, { ok: false, error: 'rate_limited' });
      }
    }

    // Per-email cooldown — the IP gate alone isn't enough here, since auth
    // is a long-lived session cookie rather than a fresh email confirmation
    // (mirrors the per-email cooldown pattern already used in
    // submit-diagnostic.mjs / resend-login.mjs for the same reason).
    const recentByEmail = await findOneByFormula(
      'Advisor Review Requests',
      `AND(LOWER({Email}) = '${escapeFormulaValue(session.email.toLowerCase())}', IS_AFTER({Requested At}, DATEADD(NOW(), -${EMAIL_COOLDOWN_SECONDS}, 'seconds')))`
    );
    if (recentByEmail) {
      return json(429, { ok: false, error: 'cooldown_active' });
    }

    await createRecord('Advisor Review Requests', {
      Email: session.email,
      'Situational Details': JSON.stringify(situational),
      Details: details,
      Location: location,
      'Requested At': new Date().toISOString(),
      'Request IP': clientIp,
    });

    return json(200, { ok: true });
  } catch (err) {
    console.error('request-advisor-review error:', err);
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
