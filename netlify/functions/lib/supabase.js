// Plain fetch against Supabase's auto-generated REST API (PostgREST) —
// deliberately not the @supabase/supabase-js SDK. This codebase has zero
// npm dependencies today (see lib/airtable.js, the file this replaces —
// same shape, same fetch-only approach); adding the official SDK would
// introduce this repo's first-ever package.json/node_modules/build step
// for functions. PostgREST gives the same REST-call ergonomics Airtable's
// API already had, so this file is a close structural match to
// lib/airtable.js on purpose — reviewers already familiar with that file
// should recognize this one immediately.
//
// Uses the service_role key exclusively: every caller here is a
// server-side Netlify Function, never the browser, so this deliberately
// bypasses Row Level Security (RLS is still enabled on every table with
// zero policies, as defense-in-depth — see supabase/migrations/0001_init.sql
// — but is irrelevant to how this file authenticates).

const REST_PATH = '/rest/v1';

function supabaseConfig() {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error('Supabase is not configured (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY missing)');
  }
  // SUPABASE_URL is meant to be the bare project origin
  // (https://<ref>.supabase.co), but Supabase's own dashboard shows REST
  // code snippets with /rest/v1 already appended to the URL — easy to
  // copy by mistake. Strip it if present so a URL set either way doesn't
  // silently double up into /rest/v1/rest/v1/... (confirmed live: this
  // produces a real PostgREST PGRST125 "Invalid path" error, not a
  // config problem — every table looked unreachable for exactly this
  // reason before this fix).
  const normalizedUrl = url.replace(/\/$/, '').replace(/\/rest\/v1$/, '');
  return { url: normalizedUrl, serviceRoleKey };
}

async function supabaseFetch(table, queryString, options = {}) {
  const { url, serviceRoleKey } = supabaseConfig();
  const fullUrl = `${url}${REST_PATH}/${table}${queryString || ''}`;
  const res = await fetch(fullUrl, {
    ...options,
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Supabase ${options.method || 'GET'} ${table} failed: ${res.status} ${body}`);
  }
  return res;
}

// PostgREST returns the total row count in the Content-Range response
// header (e.g. "0-0/5" or "*/0") when a request carries
// `Prefer: count=exact` — the number after the slash is the total.
function parseCountFromContentRange(contentRange) {
  if (!contentRange) return 0;
  const match = contentRange.match(/\/(\d+)$/);
  return match ? parseInt(match[1], 10) : 0;
}

function encodeEq(value) {
  return `eq.${encodeURIComponent(value)}`;
}

async function findByEmail(table, email) {
  const res = await supabaseFetch(table, `?email=${encodeEq(email.toLowerCase())}&limit=1`);
  const rows = await res.json();
  return rows[0] || null;
}

async function findByToken(table, token) {
  const res = await supabaseFetch(table, `?token=${encodeEq(token)}&limit=1`);
  const rows = await res.json();
  return rows[0] || null;
}

async function findActiveTokenByEmail(table, email) {
  const nowIso = new Date().toISOString();
  const qs = `?email=${encodeEq(email.toLowerCase())}&used_at=is.null&expires_at=gt.${encodeURIComponent(nowIso)}&limit=1`;
  const res = await supabaseFetch(table, qs);
  const rows = await res.json();
  return rows[0] || null;
}

// Replaces both of Airtable's countRecentRequestsByIp / countRecentByIpSince —
// those were two near-duplicate helpers only because Verification Tokens
// had no real creation-time field in Airtable, so its rate-limit count had
// to infer "created" from Expires At minus the token TTL. Every table here
// has a real timestamp column (created_at or requested_at), so one helper
// covers both cases now.
async function countRecentByIpSince(table, ip, windowSeconds, timestampColumn) {
  const sinceIso = new Date(Date.now() - windowSeconds * 1000).toISOString();
  const qs = `?request_ip=${encodeEq(ip)}&${timestampColumn}=gt.${encodeURIComponent(sinceIso)}&select=id`;
  const res = await supabaseFetch(table, qs, { method: 'HEAD', headers: { Prefer: 'count=exact' } });
  return parseCountFromContentRange(res.headers.get('content-range'));
}

// filters: array of already-encoded "column=eq.value" (or other PostgREST
// operator) strings, ANDed together — e.g. ['status=eq.Pending', 'email=eq.a@b.com']
async function findOneByFilters(table, filters) {
  const qs = `?${filters.join('&')}&limit=1`;
  const res = await supabaseFetch(table, qs);
  const rows = await res.json();
  return rows[0] || null;
}

async function findLatestByFilters(table, filters, orderColumn) {
  const qs = `?${filters.join('&')}&order=${orderColumn}.desc&limit=1`;
  const res = await supabaseFetch(table, qs);
  const rows = await res.json();
  return rows[0] || null;
}

// orderBy: a PostgREST order expression, e.g. "requested_at.desc". No
// filters/pagination — every current caller is a small internal ops
// table (dozens/hundreds of rows, not the customer-facing users table),
// so a full unfiltered read is the right tradeoff for staying simple.
async function listAll(table, orderBy) {
  const qs = orderBy ? `?order=${orderBy}` : '';
  const res = await supabaseFetch(table, qs);
  return res.json();
}

async function createRecord(table, fields) {
  const res = await supabaseFetch(table, '', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify(fields),
  });
  const rows = await res.json();
  return rows[0];
}

async function updateRecord(table, id, fields) {
  const res = await supabaseFetch(table, `?id=${encodeEq(id)}`, {
    method: 'PATCH',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify(fields),
  });
  const rows = await res.json();
  return rows[0];
}

async function deleteRecord(table, id) {
  await supabaseFetch(table, `?id=${encodeEq(id)}`, { method: 'DELETE' });
}

// A single HEAD request with an exact count — Airtable's countAll had to
// page through the whole table (100 records/page, no native aggregate
// endpoint); Postgres just counts.
async function countAll(table) {
  const res = await supabaseFetch(table, '?select=id', { method: 'HEAD', headers: { Prefer: 'count=exact' } });
  return parseCountFromContentRange(res.headers.get('content-range'));
}

// Kept even though countAll() is now cheap (a single HEAD request, not a
// paginated scan) — still one fewer network round-trip on the signup
// critical path for negligible added complexity. See lib/airtable.js's
// original countAllCached for the fuller rationale; same shape here.
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
  findByEmail,
  findByToken,
  findActiveTokenByEmail,
  countRecentByIpSince,
  findOneByFilters,
  findLatestByFilters,
  listAll,
  createRecord,
  updateRecord,
  deleteRecord,
  countAll,
  countAllCached,
  encodeEq,
};
