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

module.exports = {
  findOneByFormula,
  findByEmail,
  findByToken,
  findActiveTokenByEmail,
  createRecord,
  updateRecord,
};
