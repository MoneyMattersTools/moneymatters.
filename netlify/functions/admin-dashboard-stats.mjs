import supabaseLib from './lib/supabase.js';
import adminAuthLib from './lib/admin-auth.js';
import scoringLib from './lib/scoring.js';

const { listAll } = supabaseLib;
const { checkAdminPassword } = adminAuthLib;
const { BANDS } = scoringLib;

const PLUS_PRICE_USD = 5;
const FREE_PLUS_SPOTS_TOTAL = 500; // SITE_STRATEGY.md "MVP build order" — first 500 users, updated from 100

function json(statusCode, body) {
  return new Response(JSON.stringify(body), {
    status: statusCode,
    headers: { 'Content-Type': 'application/json' },
  });
}

// Phase 1 admin dashboard (SITE_STRATEGY.md "Internal Admin Dashboard",
// drafted 2026-08-04). Everything here is computed in JS from full-table
// reads rather than PostgREST aggregate queries — lib/supabase.js has no
// COUNT/GROUP BY helper, and every table involved is small (dozens/
// hundreds of rows), so a full read + in-memory aggregation is the
// simplest thing that works, same tradeoff listAll() already documents.
export default async (request) => {
  if (request.method !== 'GET') {
    return json(405, { ok: false, error: 'method_not_allowed' });
  }
  if (!checkAdminPassword(request)) {
    return json(401, { ok: false, error: 'unauthorized' });
  }

  try {
    const [users, verificationTokens, advisorRequests, leadDeliveries] = await Promise.all([
      listAll('users'),
      listAll('verification_tokens'),
      listAll('advisor_review_requests'),
      listAll('advisor_lead_deliveries'),
    ]);

    // --- Signup/verification funnel ---
    // "Started diagnostic" (pre-email) is genuinely not captured anywhere —
    // submit-diagnostic.mjs only writes a row once the quiz AND email are
    // both submitted together (see that file). So the real funnel this
    // data model can show starts one step later than the spec's "started
    // diagnostic" stage; that gap is called out in the dashboard UI itself
    // rather than papered over with a fabricated number.
    const diagnosticEmails = new Set(
      verificationTokens.filter((t) => t.purpose === 'signup_verification').map((t) => t.email)
    );
    const verifiedUsers = users.filter((u) => u.verified);
    const funnel = {
      diagnosticSubmitted: diagnosticEmails.size,
      verifiedAndCompleted: verifiedUsers.length,
      conversionRate: diagnosticEmails.size ? verifiedUsers.length / diagnosticEmails.size : null,
    };

    // --- Financial Health Score distribution ---
    const bandKeys = new Set(BANDS.map((b) => b.key));
    const bandCounts = {};
    for (const band of BANDS) bandCounts[band.key] = 0;
    for (const u of verifiedUsers) {
      if (u.health_score_band && bandKeys.has(u.health_score_band)) {
        bandCounts[u.health_score_band]++;
      }
    }
    const scoreDistribution = BANDS.map((b) => ({
      band: b.key,
      count: bandCounts[b.key],
      pct: verifiedUsers.length ? bandCounts[b.key] / verifiedUsers.length : 0,
    }));

    // --- Plus subscribers / MRR / churn ---
    // plan_source is only ever 'stripe' (a real paid checkout) or null
    // (every pre-Stripe row and every manual free-Plus grant) — see
    // migration 0004's comment and stripe-webhook.js. Downgrades leave
    // plan_source/stripe_subscription_id in place and only flip plan back
    // to 'free', which is what makes a lifetime-churned count possible
    // without a separate events table.
    const payingActive = users.filter((u) => u.plan === 'plus' && u.plan_source === 'stripe');
    const churnedPaid = users.filter((u) => u.plan_source === 'stripe' && u.plan !== 'plus');
    const freeGrantPlus = users.filter((u) => u.plan === 'plus' && !u.plan_source);
    const plus = {
      payingSubscribers: payingActive.length,
      mrrUsd: payingActive.length * PLUS_PRICE_USD,
      churnedLifetime: churnedPaid.length,
      freePlusGrants: freeGrantPlus.length,
    };

    // --- Free-Plus incentive counter (first 500) ---
    const freePlusIncentive = {
      claimed: freeGrantPlus.length,
      total: FREE_PLUS_SPOTS_TOTAL,
      remaining: Math.max(0, FREE_PLUS_SPOTS_TOTAL - freeGrantPlus.length),
    };

    // --- Advisor pipeline health ---
    const now = Date.now();
    const pipeline = {
      submitted: advisorRequests.length,
      matched: advisorRequests.filter((r) => r.status === 'Matched').length,
      meetingTaken: advisorRequests.filter((r) => r.status === 'Meeting Taken').length,
      accepted: leadDeliveries.filter((d) => d.status === 'accepted').length,
      pending: leadDeliveries.filter((d) => d.status === 'pending' && new Date(d.expires_at).getTime() >= now).length,
      timedOut: leadDeliveries.filter((d) => d.status === 'pending' && new Date(d.expires_at).getTime() < now).length,
    };

    return json(200, { ok: true, funnel, scoreDistribution, plus, freePlusIncentive, pipeline });
  } catch (err) {
    console.error('admin-dashboard-stats error:', err);
    return json(500, { ok: false, error: 'server_error' });
  }
};

export const config = {
  rateLimit: {
    windowLimit: 20,
    windowSize: 60,
    aggregateBy: ['ip', 'domain'],
  },
};
