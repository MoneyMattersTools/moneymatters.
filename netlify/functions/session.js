const { readSessionFromEvent } = require('./lib/session');
const { findByEmail, findLatestByFormula, escapeFormulaValue } = require('./lib/airtable');

const TOOL_FIELD_PREFIXES = ['Net Worth', 'Budget', 'Retirement', 'Investment'];

function safeParseResult(raw) {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return parsed && parsed.headline ? parsed : null;
  } catch {
    return null;
  }
}

// §28.1/28.3: the homepage dashboard needs fresh data (results submitted
// after the session cookie was issued, current Plan, current advisor
// status) — the cookie itself only carries what was true at sign-in, so
// this does a live Users lookup rather than only decoding the cookie.
//
// §34: this endpoint is called on nearly every page load (nav sign-in
// state, the onboarding gate, tool/advanced-tool gates) but almost none of
// those callers ever read advisorStatus — only the homepage dashboard and
// the MoneyMatters+ member view do. The advisor lookup is a second,
// separate Airtable call, so it only runs when a caller explicitly asks for
// it via ?advisor=1 (see scripts/session-client.js's includeAdvisorStatus
// flag) — every other caller gets advisorStatus: null for free, at half
// the Airtable cost.
exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: false, error: 'method_not_allowed' }),
    };
  }

  const session = readSessionFromEvent(event);
  if (!session) {
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ loggedIn: false }),
    };
  }

  try {
    const user = await findByEmail('Users', session.email);
    const fields = (user && user.fields) || {};

    const tools = {};
    TOOL_FIELD_PREFIXES.forEach((prefix) => {
      const key = prefix.toLowerCase().replace(/\s+/g, '');
      const result = safeParseResult(fields[`${prefix} Result`]);
      tools[key] = result ? { ...result, submittedAt: fields[`${prefix} Submitted At`] || null } : null;
    });

    let advisorStatus = null;
    const wantsAdvisorStatus = !!(event.queryStringParameters && event.queryStringParameters.advisor);
    if (wantsAdvisorStatus) {
      try {
        const latestRequest = await findLatestByFormula(
          'Advisor Review Requests',
          `LOWER({Email}) = '${escapeFormulaValue(session.email.toLowerCase())}'`,
          'Requested At'
        );
        advisorStatus = latestRequest && latestRequest.fields ? latestRequest.fields.Status || 'Requested' : null;
      } catch (advisorErr) {
        // Best-effort — a missing/renamed Status field shouldn't break the
        // whole session response.
        console.error('session advisor status lookup error:', advisorErr);
      }
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        loggedIn: true,
        email: session.email,
        healthScore: typeof fields['Health Score'] === 'number' ? fields['Health Score'] : session.healthScore,
        healthBand: fields['Health Score Band'] || session.healthBand,
        plan: fields.Plan === 'Plus' ? 'plus' : 'free',
        tools: tools,
        advisorStatus: advisorStatus,
      }),
    };
  } catch (err) {
    console.error('session error:', err);
    // Fall back to the cookie-only response rather than 500ing the whole
    // page — a stale score is better than the homepage breaking outright.
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        loggedIn: true,
        email: session.email,
        healthScore: session.healthScore,
        healthBand: session.healthBand,
        plan: 'free',
        tools: {},
        advisorStatus: null,
      }),
    };
  }
};
