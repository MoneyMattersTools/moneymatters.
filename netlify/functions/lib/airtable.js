const API_BASE = 'https://api.airtable.com/v0';

function airtableConfig() {
  const apiKey = process.env.AIRTABLE_API_KEY;
  const baseId = process.env.AIRTABLE_BASE_ID;
  if (!apiKey || !baseId) {
    throw new Error('Airtable is not configured (AIRTABLE_API_KEY / AIRTABLE_BASE_ID missing)');
  }
  return { apiKey, baseId };
}

async function airtableFetch(table, path, options = {}) {
  const { apiKey, baseId } = airtableConfig();
  const url = `${API_BASE}/${baseId}/${encodeURIComponent(table)}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Airtable ${options.method || 'GET'} ${table} failed: ${res.status} ${body}`);
  }
  return res.json();
}

function escapeFormulaValue(value) {
  return String(value).replace(/'/g, "\\'");
}

async function findOneByFormula(table, formula) {
  const data = await airtableFetch(
    table,
    `?maxRecords=1&filterByFormula=${encodeURIComponent(formula)}`
  );
  return data.records && data.records[0] ? data.records[0] : null;
}

async function findByEmail(table, email) {
  return findOneByFormula(table, `LOWER({Email}) = '${escapeFormulaValue(email.toLowerCase())}'`);
}

// Like findOneByFormula, but sorted so "most recent" queries (e.g. a
// user's latest Advisor Review Requests record) get the right record when
// more than one matches.
async function findLatestByFormula(table, formula, sortField) {
  const data = await airtableFetch(
    table,
    `?maxRecords=1&filterByFormula=${encodeURIComponent(formula)}&sort[0][field]=${encodeURIComponent(sortField)}&sort[0][direction]=desc`
  );
  return data.records && data.records[0] ? data.records[0] : null;
}

async function findByToken(table, token) {
  return findOneByFormula(table, `{Token} = '${escapeFormulaValue(token)}'`);
}

async function findActiveTokenByEmail(table, email) {
  const formula = `AND(LOWER({Email}) = '${escapeFormulaValue(
    email.toLowerCase()
  )}', {Used At} = BLANK(), IS_AFTER({Expires At}, NOW()))`;
  return findOneByFormula(table, formula);
}

// Counts records tagged with `ip` in the "Request IP" field whose inferred
// creation time (Expires At - tokenTtlSeconds, since there's no Created At
// field) falls within the last windowSeconds. Used for application-level
// IP rate limiting, mirroring the per-email cooldown pattern.
async function countRecentRequestsByIp(table, ip, windowSeconds, tokenTtlSeconds) {
  const formula = `AND({Request IP} = '${escapeFormulaValue(ip)}', IS_AFTER(DATEADD({Expires At}, -${tokenTtlSeconds}, 'seconds'), DATEADD(NOW(), -${windowSeconds}, 'seconds')))`;
  const data = await airtableFetch(
    table,
    `?maxRecords=50&filterByFormula=${encodeURIComponent(formula)}`
  );
  return data.records ? data.records.length : 0;
}

// Counts records tagged with `ip` in the "Request IP" field whose own
// timestampField falls within the last windowSeconds. Simpler sibling of
// countRecentRequestsByIp for tables that have a real creation-time field
// (no need to infer it from an unrelated Expires At field).
async function countRecentByIpSince(table, ip, windowSeconds, timestampField) {
  const formula = `AND({Request IP} = '${escapeFormulaValue(ip)}', IS_AFTER({${timestampField}}, DATEADD(NOW(), -${windowSeconds}, 'seconds')))`;
  const data = await airtableFetch(
    table,
    `?maxRecords=50&filterByFormula=${encodeURIComponent(formula)}`
  );
  return data.records ? data.records.length : 0;
}

async function createRecord(table, fields) {
  // typecast lets Airtable auto-register a new option on a single-select
  // field (e.g. a Purpose value used for the first time) instead of 422ing.
  // Without it, any code path writing a select value that predates the
  // field's known options fails outright — this bit resend-login.mjs when
  // 'returning_login' wasn't yet a registered Purpose option.
  return airtableFetch(table, '', {
    method: 'POST',
    body: JSON.stringify({ fields, typecast: true }),
  });
}

async function updateRecord(table, recordId, fields) {
  return airtableFetch(table, `/${recordId}`, {
    method: 'PATCH',
    body: JSON.stringify({ fields, typecast: true }),
  });
}

async function deleteRecord(table, recordId) {
  return airtableFetch(table, `/${recordId}`, {
    method: 'DELETE',
  });
}

async function findAllByFormula(table, formula) {
  const data = await airtableFetch(
    table,
    `?filterByFormula=${encodeURIComponent(formula)}`
  );
  return data.records || [];
}

// §29.7: paginated total record count for the first-account-created
// popup's community counter. Airtable's list endpoint has no dedicated
// count operation, so this pages through with only the Email field
// requested (keeps payload small) and a safety cap so a malformed
// response can't loop forever.
const COUNT_ALL_MAX_PAGES = 50;

async function countAll(table) {
  let total = 0;
  let offset;
  let pages = 0;
  do {
    const qs = new URLSearchParams({ pageSize: '100' });
    qs.append('fields[]', 'Email');
    if (offset) qs.set('offset', offset);
    const data = await airtableFetch(table, `?${qs.toString()}`);
    total += data.records ? data.records.length : 0;
    offset = data.offset;
    pages += 1;
  } while (offset && pages < COUNT_ALL_MAX_PAGES);
  return total;
}

// §34: countAll() pages through the *entire* table — verify-token.js was
// calling it on every single new signup just to show a "join N other
// members" popup number, so the cost of that full-table scan grew with
// both the user base AND the signup rate at once (the exact two things
// you want to be cheap, not expensive, as the site grows). A module-level
// cache with a TTL means at most one full scan per interval, shared across
// however many signups land in that window, rather than one scan per
// signup. Node keeps module state across warm invocations of the same
// Lambda container, so this works "for free" with zero new infrastructure —
// it just isn't guaranteed consistent across cold starts or concurrent
// container instances, which is fine for a display-only vanity count, not
// data that needs to be exact.
const countAllCache = new Map();
const COUNT_ALL_CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

async function countAllCached(table, ttlMs = COUNT_ALL_CACHE_TTL_MS) {
  const cached = countAllCache.get(table);
  const now = Date.now();
  if (cached && now - cached.at < ttlMs) {
    return cached.count;
  }
  const count = await countAll(table);
  countAllCache.set(table, { count, at: now });
  return count;
}

module.exports = {
  findOneByFormula,
  findLatestByFormula,
  findAllByFormula,
  countAll,
  countAllCached,
  findByEmail,
  findByToken,
  findActiveTokenByEmail,
  countRecentRequestsByIp,
  countRecentByIpSince,
  createRecord,
  updateRecord,
  deleteRecord,
  escapeFormulaValue,
};
