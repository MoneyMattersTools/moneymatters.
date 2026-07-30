const { readSessionFromEvent } = require('./lib/session');
const { findByEmail, findLatestByFilters, encodeEq } = require('./lib/supabase');

const TOOL_COLUMNS = [
  { key: 'networth', resultColumn: 'net_worth_result', submittedColumn: 'net_worth_submitted_at' },
  { key: 'budget', resultColumn: 'budget_result', submittedColumn: 'budget_submitted_at' },
  { key: 'retirement', resultColumn: 'retirement_result', submittedColumn: 'retirement_submitted_at' },
  { key: 'investment', resultColumn: 'investment_result', submittedColumn: 'investment_submitted_at' },
];

// Tool result columns are jsonb — PostgREST already returns them parsed
// (or null if never set), so this just validates shape, no JSON.parse.
function safeResult(value) {
  return value && value.headline ? value : null;
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
// separate call, so it only runs when a caller explicitly asks for it via
// ?advisor=1 (see scripts/session-client.js's includeAdvisorStatus flag) —
// every other caller gets advisorStatus: null for free, at half the cost.
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
    const user = await findByEmail('users', session.email);

    const tools = {};
    TOOL_COLUMNS.forEach(({ key, resultColumn, submittedColumn }) => {
      const result = user ? safeResult(user[resultColumn]) : null;
      tools[key] = result ? { ...result, submittedAt: (user && user[submittedColumn]) || null } : null;
    });

    let advisorStatus = null;
    const wantsAdvisorStatus = !!(event.queryStringParameters && event.queryStringParameters.advisor);
    if (wantsAdvisorStatus) {
      try {
        const latestRequest = await findLatestByFilters(
          'advisor_review_requests',
          [`email=${encodeEq(session.email.toLowerCase())}`],
          'requested_at'
        );
        advisorStatus = latestRequest ? latestRequest.status || 'Requested' : null;
      } catch (advisorErr) {
        // Best-effort — a lookup error shouldn't break the whole session response.
        console.error('session advisor status lookup error:', advisorErr);
      }
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        loggedIn: true,
        email: session.email,
        healthScore: user && typeof user.health_score === 'number' ? user.health_score : session.healthScore,
        healthBand: (user && user.health_score_band) || session.healthBand,
        // Plan is a manual, team-set flag (Section 28) — set it as lowercase
        // 'plus' directly on the users row in Supabase's Table Editor, not
        // the old Airtable-era capitalized 'Plus'.
        plan: user && user.plan === 'plus' ? 'plus' : 'free',
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
