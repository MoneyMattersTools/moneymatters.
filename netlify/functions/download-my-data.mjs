import supabaseLib from './lib/supabase.js';
import sessionLib from './lib/session.js';
import errorAlertLib from './lib/error-alert.js';
const { alertOnError } = errorAlertLib;

const { findByEmail, findAllByFilters, encodeEq } = supabaseLib;
const { readSessionFromRequest } = sessionLib;

function json(statusCode, body, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status: statusCode,
    headers: { 'Content-Type': 'application/json', ...extraHeaders },
  });
}

// The real self-service data-access feature (SITE_STRATEGY.md's Security &
// Compliance Checklist flagged this as missing — only a manual, team-run
// deletion flow existed before this). One JSON file per user, covering
// everything the site has on them: account info, Financial Health Score
// history, every tool result, and any advisor-matching requests including
// the score/net-worth-sharing consent recorded on each. Requires a real
// session (not a client-supplied email) — unlike request-deletion.mjs,
// this reads data back, so an unauthenticated version would let anyone
// download anyone else's financial details just by knowing their email.
export default async (request) => {
  if (request.method !== 'GET') {
    return json(405, { ok: false, error: 'method_not_allowed' });
  }

  const session = readSessionFromRequest(request);
  if (!session || !session.email) {
    return json(401, { ok: false, error: 'not_authenticated' });
  }

  try {
    const user = await findByEmail('users', session.email);
    if (!user) {
      return json(404, { ok: false, error: 'not_found' });
    }

    const advisorRequests = await findAllByFilters('advisor_review_requests', [
      `email=${encodeEq(session.email.toLowerCase())}`,
    ]);

    const exportBody = {
      exportedAt: new Date().toISOString(),
      account: {
        email: user.email,
        verified: user.verified,
        plan: user.plan,
        planSource: user.plan_source || null,
        accountCreatedAt: user.created_at,
        lastSignInAt: user.last_verified_at,
      },
      financialHealthScore: {
        score: user.health_score,
        band: user.health_score_band,
        answers: user.health_score_answers,
        completedAt: user.health_score_completed_at,
      },
      toolSubmissions: {
        netWorth: user.net_worth_result ? { ...user.net_worth_result, submittedAt: user.net_worth_submitted_at } : null,
        budget: user.budget_result ? { ...user.budget_result, submittedAt: user.budget_submitted_at } : null,
        retirement: user.retirement_result ? { ...user.retirement_result, submittedAt: user.retirement_submitted_at } : null,
        investment: user.investment_result ? { ...user.investment_result, submittedAt: user.investment_submitted_at } : null,
        advancedBudget: user.adv_budget_result ? { ...user.adv_budget_result, submittedAt: user.adv_budget_submitted_at } : null,
        advancedInvestment: user.adv_investment_result ? { ...user.adv_investment_result, submittedAt: user.adv_investment_submitted_at } : null,
      },
      // Each entry is one advisor-matching request you submitted.
      // advisorSharingConsent is null unless you explicitly opted in (the
      // separate "share my score" checkbox) to including your Financial
      // Health Score / Net Worth range in what the matched advisor sees.
      advisorMatchingRequests: advisorRequests.map((r) => ({
        requestedAt: r.requested_at,
        status: r.status,
        situationalDetails: r.situational_details,
        details: r.details,
        location: r.location,
        urgency: r.urgency,
        advisorSharingConsent: r.shared_scores || null,
      })),
    };

    const filename = `moneymatters-data-export-${new Date().toISOString().slice(0, 10)}.json`;
    return json(200, exportBody, { 'Content-Disposition': `attachment; filename="${filename}"` });
  } catch (err) {
    console.error('download-my-data error:', err);
    await alertOnError('download-my-data', err);
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
