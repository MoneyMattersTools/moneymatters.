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
  return airtableFetch(table, '', {
    method: 'POST',
    body: JSON.stringify({ fields }),
  });
}

async function updateRecord(table, recordId, fields) {
  return airtableFetch(table, `/${recordId}`, {
    method: 'PATCH',
    body: JSON.stringify({ fields }),
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

module.exports = {
  findOneByFormula,
  findAllByFormula,
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
