const crypto = require('crypto');
const { createRecord } = require('./lib/airtable');
const { sendEmail } = require('./lib/resend');
const { validateAnswers, computeScore } = require('./lib/scoring');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TOKEN_TTL_MS = 30 * 60 * 1000;

function json(statusCode, body) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  };
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return json(405, { ok: false, error: 'method_not_allowed' });
  }

  let payload;
  try {
    payload = JSON.parse(event.body || '{}');
  } catch {
    return json(400, { ok: false, error: 'invalid_json' });
  }

  const email = typeof payload.email === 'string' ? payload.email.trim().toLowerCase() : '';
  const answers = payload.answers;

  if (!EMAIL_RE.test(email)) {
    return json(400, { ok: false, error: 'invalid_email' });
  }
  if (!validateAnswers(answers)) {
    return json(400, { ok: false, error: 'invalid_answers' });
  }

  try {
    const { score } = computeScore(answers);
    const token = crypto.randomBytes(32).toString('base64url');
    const expiresAt = new Date(Date.now() + TOKEN_TTL_MS).toISOString();

    await createRecord('Verification Tokens', {
      Token: token,
      Email: email,
      Purpose: 'signup_verification',
      'Pending Health Score': score,
      'Pending Answers': JSON.stringify(answers),
      'Expires At': expiresAt,
    });

    const siteUrl = (process.env.SITE_URL || '').replace(/\/$/, '');
    const link = `${siteUrl}/?verify=${token}`;

    await sendEmail({
      to: email,
      subject: 'Your MoneyMatters Financial Health Score is ready',
      text: `Click below to verify your email and see your Financial Health Score.\n\n${link}\n\nThis link expires in 30 minutes and works once. Didn't request this? Ignore this email.`,
      html: `<p>Click below to verify your email and see your Financial Health Score.</p><p><a href="${link}">View My Results</a></p><p>This link expires in 30 minutes and works once. Didn't request this? Ignore this email.</p>`,
    });

    return json(200, { ok: true });
  } catch (err) {
    console.error('submit-diagnostic error:', err);
    // Still return a generic ok:true-shaped failure without leaking internals,
    // but use 500 so the frontend can show a "something went wrong, try again" state.
    return json(500, { ok: false, error: 'server_error' });
  }
};
