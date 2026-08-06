import supabaseLib from './lib/supabase.js';
import adminAuthLib from './lib/admin-auth.js';
import scoringLib from './lib/scoring.js';

const { listAll } = supabaseLib;
const { checkAdminPassword } = adminAuthLib;
const { BANDS } = scoringLib;

const PLUS_PRICE_USD = 5;
const FREE_PLUS_SPOTS_TOTAL = 500; // SITE_STRATEGY.md "MVP build order" — first 500 users, updated from 100
const WEEKLY_TREND_WEEKS = 8;
const RETENTION_DAY_WINDOWS = { day7: 7, day30: 30 };
const TOOL_COLUMNS = ['net_worth_submitted_at', 'budget_submitted_at', 'retirement_submitted_at', 'investment_submitted_at'];
const ATTRIBUTION_TOP_N = 10;

function json(statusCode, body) {
  return new Response(JSON.stringify(body), {
    status: statusCode,
    headers: { 'Content-Type': 'application/json' },
  });
}

// Monday 00:00 UTC of the week containing `date`, as a YYYY-MM-DD string —
// used to bucket the weekly-signup trend without pulling in a date library.
function isoWeekStart(date) {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = d.getUTCDay() || 7; // Sunday -> 7, so Monday is always day 1
  if (day !== 1) d.setUTCDate(d.getUTCDate() - (day - 1));
  return d.toISOString().slice(0, 10);
}

function anyToolActivityAfter(user, thresholdIso) {
  return TOOL_COLUMNS.some((col) => user[col] && user[col] > thresholdIso);
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
    const [usersRaw, verificationTokens, advisorRequestsRaw, leadDeliveriesRaw] = await Promise.all([
      listAll('users'),
      listAll('verification_tokens'),
      listAll('advisor_review_requests'),
      listAll('advisor_lead_deliveries'),
    ]);

    // Test rows (QA/dev accounts and leads, flagged via is_test — see
    // migration 0007) are excluded from every KPI below. Filtered once,
    // immediately after fetch, so every computation downstream is
    // automatically clean rather than needing its own exclusion. Deliveries
    // don't carry their own is_test flag — excluded by cross-referencing
    // their parent lead instead.
    const users = usersRaw.filter((u) => !u.is_test);
    const advisorRequests = advisorRequestsRaw.filter((r) => !r.is_test);
    const testRequestIds = new Set(advisorRequestsRaw.filter((r) => r.is_test).map((r) => r.id));
    const leadDeliveries = leadDeliveriesRaw.filter((d) => !testRequestIds.has(d.advisor_review_request_id));

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

    // --- Weekly new-verified-user trend (Round 2 KPI) ---
    const weekCounts = new Map();
    for (const u of verifiedUsers) {
      if (!u.health_score_completed_at) continue;
      const weekStart = isoWeekStart(new Date(u.health_score_completed_at));
      weekCounts.set(weekStart, (weekCounts.get(weekStart) || 0) + 1);
    }
    const weeklyVerifiedTrend = [];
    const thisWeekStart = new Date(isoWeekStart(new Date()) + 'T00:00:00Z');
    for (let i = WEEKLY_TREND_WEEKS - 1; i >= 0; i--) {
      const weekDate = new Date(thisWeekStart);
      weekDate.setUTCDate(weekDate.getUTCDate() - i * 7);
      const key = weekDate.toISOString().slice(0, 10);
      weeklyVerifiedTrend.push({ weekStart: key, count: weekCounts.get(key) || 0 });
    }

    // --- 7/30-day retention (Round 2 KPI) ---
    // "Returned" = any real activity signal after the window: a fresh
    // magic-link verification (last_verified_at) or a saved tool result.
    // Necessarily incomplete — the 30-day session cookie means someone can
    // browse without either happening — but it's the only real signal
    // Supabase has; there's no page-view/session-activity table to check
    // against instead.
    function computeRetention(windowDays) {
      const nowMs = Date.now();
      const eligible = verifiedUsers.filter((u) => {
        if (!u.health_score_completed_at) return false;
        const ageMs = nowMs - new Date(u.health_score_completed_at).getTime();
        return ageMs >= windowDays * 24 * 60 * 60 * 1000;
      });
      if (!eligible.length) return { eligible: 0, returned: 0, rate: null };
      const returned = eligible.filter((u) => {
        const thresholdIso = new Date(
          new Date(u.health_score_completed_at).getTime() + windowDays * 24 * 60 * 60 * 1000
        ).toISOString();
        if (u.last_verified_at && u.last_verified_at > thresholdIso) return true;
        return anyToolActivityAfter(u, thresholdIso);
      });
      return { eligible: eligible.length, returned: returned.length, rate: returned.length / eligible.length };
    }
    const retention7 = computeRetention(RETENTION_DAY_WINDOWS.day7);
    const retention30 = computeRetention(RETENTION_DAY_WINDOWS.day30);
    const retention = {
      day7Eligible: retention7.eligible,
      day7Rate: retention7.rate,
      day30Eligible: retention30.eligible,
      day30Rate: retention30.rate,
    };

    // --- Completion rate: Health Score vs. Net Worth (Round 2 KPI) ---
    // Not symmetric, and the dashboard says so: Health Score has a real
    // "started" signal (a verification_tokens row, same as the funnel
    // above), so its rate is a genuine start-to-finish completion rate.
    // Net Worth is usable anonymously (submit-tool-result.mjs) — nothing
    // is written server-side until a save, so there's no "started" event
    // to measure against. This instead shows adoption among verified
    // users, a different (still useful, just not equivalent) number.
    const netWorthAdopters = verifiedUsers.filter((u) => u.net_worth_submitted_at).length;
    const completionRates = {
      healthScore: funnel.conversionRate,
      netWorth: verifiedUsers.length ? netWorthAdopters / verifiedUsers.length : null,
    };

    // --- Traffic-source -> verified-signup attribution (Round 2 KPI) ---
    // users.source now carries real attribution (utm:.../referrer:.../
    // direct), captured client-side at diagnostic-submit and promoted at
    // verification — see diagnostic.js/submit-diagnostic.mjs/verify-token.js.
    // Rows verified before this shipped still carry the old hardcoded
    // literal ('Health Score Diagnostic'); shown as-is rather than
    // silently dropped, since hiding old rows would understate totals.
    const attributionCounts = new Map();
    for (const u of verifiedUsers) {
      const src = u.source || 'unknown';
      attributionCounts.set(src, (attributionCounts.get(src) || 0) + 1);
    }
    const attribution = Array.from(attributionCounts.entries())
      .map(([source, count]) => ({ source, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, ATTRIBUTION_TOP_N);

    // --- Average lead-to-accept time (Round 2 KPI) ---
    const acceptedDeliveries = leadDeliveries.filter((d) => d.status === 'accepted' && d.accepted_at);
    const avgLeadToAcceptHours = acceptedDeliveries.length
      ? acceptedDeliveries.reduce((sum, d) => {
          return sum + (new Date(d.accepted_at).getTime() - new Date(d.assigned_at).getTime()) / 3600000;
        }, 0) / acceptedDeliveries.length
      : null;

    // --- Post-diagnostic tool-engagement rate (Round 2 KPI) ---
    const engagedUsers = verifiedUsers.filter((u) => TOOL_COLUMNS.some((col) => u[col])).length;
    const toolEngagementRate = verifiedUsers.length ? engagedUsers / verifiedUsers.length : null;

    return json(200, {
      ok: true,
      funnel,
      scoreDistribution,
      plus,
      freePlusIncentive,
      pipeline,
      weeklyVerifiedTrend,
      retention,
      completionRates,
      attribution,
      avgLeadToAcceptHours,
      toolEngagementRate,
    });
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
