const { findByToken, findByEmail, createRecord, updateRecord } = require('./lib/airtable');
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
    const tokenRecord = await findByToken('Verification Tokens', token);
    if (!tokenRecord) {
      return json(404, { ok: false, error: 'invalid' });
    }

    const fields = tokenRecord.fields || {};
    if (fields['Used At']) {
      return json(410, { ok: false, error: 'already_used' });
    }
    if (!fields['Expires At'] || new Date(fields['Expires At']).getTime() < Date.now()) {
      return json(410, { ok: false, error: 'expired' });
    }

    // Mark the token used immediately after the validity checks pass, before
    // the (slower) Users upsert — shrinks the window in which two concurrent
    // requests for the same token could both pass the "not used" check above.
    // Airtable's REST API has no compare-and-swap primitive, so this reduces
    // rather than eliminates the race; a genuinely atomic guarantee would
    // need a datastore that supports conditional writes.
    await updateRecord('Verification Tokens', tokenRecord.id, { 'Used At': new Date().toISOString() });

    const email = fields.Email;
    let answers = {};
    try {
      answers = JSON.parse(fields['Pending Answers'] || '{}');
    } catch {
      answers = {};
    }
    const { score, breakdown } = computeScore(answers);
    const band = determineBand(score);
    const nowIso = new Date().toISOString();

    const existingUser = await findByEmail('Users', email);
    if (existingUser) {
      await updateRecord('Users', existingUser.id, {
        Verified: true,
        'Health Score': score,
        'Health Score Band': band,
        'Health Score Answers': JSON.stringify(answers),
        'Health Score Completed At': nowIso,
        'Last Verified At': nowIso,
      });
    } else {
      await createRecord('Users', {
        Email: email,
        Verified: true,
        'Health Score': score,
        'Health Score Band': band,
        'Health Score Answers': JSON.stringify(answers),
        'Health Score Completed At': nowIso,
        Source: 'Health Score Diagnostic',
        'Last Verified At': nowIso,
      });
    }

    const cookieValue = signSession({ email, healthScore: score, healthBand: band });

    return json(
      200,
      { ok: true, score, band, breakdown },
      { 'Set-Cookie': buildSetCookie(cookieValue) }
    );
  } catch (err) {
    console.error('verify-token error:', err);
    return json(500, { ok: false, error: 'server_error' });
  }
};
