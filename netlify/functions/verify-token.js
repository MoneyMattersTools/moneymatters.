const { findByToken, findByEmail, createRecord, updateRecord, countByFilter } = require('./lib/supabase');
const { computeScore, determineBand } = require('./lib/scoring');
const { signSession, buildSetCookie } = require('./lib/session');
const { FREE_PLUS_SPOTS_TOTAL } = require('./lib/incentives');
const { alertOnError } = require('./lib/error-alert');

const TOKEN_RE = /^[A-Za-z0-9_-]{16,128}$/;

function json(statusCode, body, extraHeaders = {}) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json', ...extraHeaders },
    body: JSON.stringify(body),
  };
}

exports.handler = async (event) => {
  // POST (not GET) so this action never fires from a mere page load or an
  // automated email-security-scanner prefetching the magic-link URL — it only
  // runs when the frontend makes an explicit fetch after the user confirms.
  if (event.httpMethod !== 'POST') {
    return json(405, { ok: false, error: 'method_not_allowed' });
  }

  let payload;
  try {
    payload = JSON.parse(event.body || '{}');
  } catch {
    return json(400, { ok: false, error: 'invalid' });
  }

  const token = typeof payload.token === 'string' ? payload.token : '';
  if (!token || !TOKEN_RE.test(token)) {
    return json(400, { ok: false, error: 'invalid' });
  }

  try {
    const tokenRecord = await findByToken('verification_tokens', token);
    if (!tokenRecord) {
      return json(404, { ok: false, error: 'invalid' });
    }

    if (tokenRecord.used_at) {
      return json(410, { ok: false, error: 'already_used' });
    }
    if (!tokenRecord.expires_at || new Date(tokenRecord.expires_at).getTime() < Date.now()) {
      return json(410, { ok: false, error: 'expired' });
    }

    // Mark the token used immediately after the validity checks pass, before
    // the (slower) Users upsert — shrinks the window in which two concurrent
    // requests for the same token could both pass the "not used" check above.
    // PostgREST's REST API has no compare-and-swap primitive, so this reduces
    // rather than eliminates the race; a genuinely atomic guarantee would
    // need a single UPDATE ... WHERE used_at IS NULL RETURNING *, which isn't
    // expressible through the REST layer this file uses (plain fetch, no
    // SDK — see lib/supabase.js).
    await updateRecord('verification_tokens', tokenRecord.id, { used_at: new Date().toISOString() });

    const email = tokenRecord.email;
    const nowIso = new Date().toISOString();
    let score, band, breakdown;
    let isNewAccount = false;
    let qualifiesForFirst500 = false;

    if (tokenRecord.purpose === 'returning_login') {
      // A returning-user token never carries Pending Answers — there's
      // nothing new to score. Pull the visitor's existing result straight
      // from their Users record instead of recomputing anything.
      const existingUser = await findByEmail('users', email);
      if (!existingUser || !existingUser.verified) {
        return json(404, { ok: false, error: 'invalid' });
      }
      score = existingUser.health_score;
      band = existingUser.health_score_band;
      breakdown = null;
      await updateRecord('users', existingUser.id, { last_verified_at: nowIso });
    } else {
      // pending_answers is a real jsonb column (see lib/supabase.js /
      // submit-diagnostic.mjs) — PostgREST already returns it parsed, no
      // JSON.parse needed here.
      const answers = tokenRecord.pending_answers || {};
      const computed = computeScore(answers);
      score = computed.score;
      breakdown = computed.breakdown;
      band = determineBand(score);

      // Promoted from the token's pending_source, same stage-then-promote
      // pattern as pending_health_score/pending_answers above — real
      // traffic-source attribution (SITE_STRATEGY.md "Round 2 additions"),
      // replacing the hardcoded literal this column used to carry on
      // every single row, which had no actual signal in it.
      const source = tokenRecord.pending_source || 'direct';

      const existingUser = await findByEmail('users', email);
      if (existingUser) {
        await updateRecord('users', existingUser.id, {
          verified: true,
          health_score: score,
          health_score_band: band,
          health_score_answers: answers,
          health_score_completed_at: nowIso,
          last_verified_at: nowIso,
        });
      } else {
        await createRecord('users', {
          email: email,
          verified: true,
          health_score: score,
          health_score_band: band,
          health_score_answers: answers,
          health_score_completed_at: nowIso,
          source: source,
          last_verified_at: nowIso,
        });
        isNewAccount = true;
        // SITE_STRATEGY.md item 5 (locked 2026-08-07): the welcome popup no
        // longer shows a raw live signup count (flagged as a trust risk by
        // the independent QA review) — it shows a one-time first-500
        // milestone message instead, tied to the same threshold as the
        // admin dashboard's free-Plus incentive counter (lib/incentives.js).
        // Deliberately NOT cached (unlike the old countAllCached read) and
        // excludes is_test rows — this gates a real, if manually-actioned,
        // promise to the user, so it needs to be accurate at the moment of
        // signup rather than up to 6 hours stale. Best-effort: a count
        // failure shouldn't fail the whole verification, just falls back to
        // the generic (non-milestone) popup copy.
        try {
          const realUserCount = await countByFilter('users', ['is_test=eq.false']);
          qualifiesForFirst500 = realUserCount <= FREE_PLUS_SPOTS_TOTAL;
        } catch (countErr) {
          console.error('verify-token first-500 count error:', countErr);
        }
      }
    }

    const cookieValue = signSession({ email, healthScore: score, healthBand: band });

    return json(
      200,
      { ok: true, score, band, breakdown, isNewAccount, qualifiesForFirst500 },
      { 'Set-Cookie': buildSetCookie(cookieValue) }
    );
  } catch (err) {
    console.error('verify-token error:', err);
    await alertOnError("verify-token", err);
    return json(500, { ok: false, error: 'server_error' });
  }
};
