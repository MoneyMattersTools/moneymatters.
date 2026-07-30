const { findByToken, findByEmail, createRecord, updateRecord, countAllCached } = require('./lib/supabase');
const { computeScore, determineBand } = require('./lib/scoring');
const { signSession, buildSetCookie } = require('./lib/session');

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
    let communityCount = null;

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
          source: 'Health Score Diagnostic',
          last_verified_at: nowIso,
        });
        isNewAccount = true;
        // Best-effort — the community counter is a nice-to-have popup, not
        // something that should fail the whole verification if it errors.
        try {
          communityCount = await countAllCached('users');
        } catch (countErr) {
          console.error('verify-token community count error:', countErr);
        }
      }
    }

    const cookieValue = signSession({ email, healthScore: score, healthBand: band });

    return json(
      200,
      { ok: true, score, band, breakdown, isNewAccount, communityCount },
      { 'Set-Cookie': buildSetCookie(cookieValue) }
    );
  } catch (err) {
    console.error('verify-token error:', err);
    return json(500, { ok: false, error: 'server_error' });
  }
};
