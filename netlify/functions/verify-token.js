const { findByToken, findByEmail, createRecord, updateRecord } = require('./lib/airtable');
const { computeScore, determineBand } = require('./lib/scoring');
const { signSession, buildSetCookie } = require('./lib/session');

function json(statusCode, body, extraHeaders = {}) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json', ...extraHeaders },
    body: JSON.stringify(body),
  };
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return json(405, { ok: false, error: 'method_not_allowed' });
  }

  const token = (event.queryStringParameters || {}).token;
  if (!token) {
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

    await updateRecord('Verification Tokens', tokenRecord.id, { 'Used At': nowIso });

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
