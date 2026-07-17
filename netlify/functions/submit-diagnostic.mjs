import crypto from 'node:crypto';
import airtableLib from './lib/airtable.js';
import resendLib from './lib/resend.js';
import scoringLib from './lib/scoring.js';

const { createRecord, findActiveTokenByEmail } = airtableLib;
const { sendEmail } = resendLib;
const { validateAnswers, computeScore, QUESTIONS } = scoringLib;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const EMAIL_MAX_LENGTH = 254; // RFC 5321 max mailbox length
const TOKEN_TTL_MS = 30 * 60 * 1000;

function json(statusCode, body) {
  return new Response(JSON.stringify(body), {
    status: statusCode,
    headers: { 'Content-Type': 'application/json' },
  });
}

// Only the validated question answers are persisted — never the raw client payload.
function extractCleanAnswers(answers) {
  const clean = {};
  for (const q of QUESTIONS) {
    clean[q.id] = answers[q.id];
  }
  return clean;
}

export default async (request) => {
  if (request.method !== 'POST') {
    return json(405, { ok: false, error: 'method_not_allowed' });
  }

  let payload;
  try {
    payload = await request.json();
  } catch {
    return json(400, { ok: false, error: 'invalid_json' });
  }

  const email = typeof payload.email === 'string' ? payload.email.trim().toLowerCase() : '';
  const answers = payload.answers;

  if (!email || email.length > EMAIL_MAX_LENGTH || !EMAIL_RE.test(email)) {
    return json(400, { ok: false, error: 'invalid_email' });
  }
  if (!validateAnswers(answers)) {
    return json(400, { ok: false, error: 'invalid_answers' });
  }

  try {
    // Per-email cooldown: if an unused, unexpired token already exists for this
    // address, don't create another or send another email. Caps abuse of this
    // endpoint as an email-spam relay at one outstanding link per address per
    // TOKEN_TTL_MS, on top of the IP-based rate limit in this function's config.
    const existingActive = await findActiveTokenByEmail('Verification Tokens', email);
    if (existingActive) {
      return json(429, { ok: false, error: 'cooldown_active' });
    }

    const cleanAnswers = extractCleanAnswers(answers);
    const { score } = computeScore(cleanAnswers);
    const token = crypto.randomBytes(32).toString('base64url');
    const expiresAt = new Date(Date.now() + TOKEN_TTL_MS).toISOString();

    await createRecord('Verification Tokens', {
      Token: token,
      Email: email,
      Purpose: 'signup_verification',
      'Pending Health Score': score,
      'Pending Answers': JSON.stringify(cleanAnswers),
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
    return json(500, { ok: false, error: 'server_error' });
  }
};

export const config = {
  path: '/api/submit-diagnostic',
  rateLimit: {
    windowLimit: 8,
    windowSize: 60,
    aggregateBy: ['ip'],
  },
};
