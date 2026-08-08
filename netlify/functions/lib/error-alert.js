const { sendEmail } = require('./resend');

// Lightweight production error alerting (2026-08-08 ask) — no new
// dependency, no new third-party account, reuses the existing Resend
// integration every other transactional email in this codebase already
// goes through. Not a full APM (no stack-trace UI, no issue grouping,
// no dashboard) — just "something broke, here's what and where" landing
// in an inbox instead of only ever being visible via Netlify's own
// function logs, which nobody checks unless they already suspect
// something's wrong.
//
// Per-warm-instance throttle only (a module-level Map, not a durable
// store) — genuinely reduces repeat-alert spam for the common case of
// the same warm instance hitting the same error repeatedly, but a
// concurrent cold start elsewhere could still send its own copy in the
// same window. A fully cross-instance-consistent dedup would need a
// database table or external store; out of scope for "lightweight."
const THROTTLE_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const lastSentAt = new Map();

// Fire-and-forget by design: every caller is already inside its own
// catch block, about to return a 500 to the user — this must never
// throw, never slow down that response, and never mask the original
// error with an alerting failure.
async function alertOnError(functionName, err) {
  try {
    const alertEmail = process.env.ERROR_ALERT_EMAIL;
    if (!alertEmail) return; // not configured — fail open

    const message = (err && err.message) || String(err);
    const key = functionName + ':' + message.slice(0, 120);
    const now = Date.now();
    const last = lastSentAt.get(key);
    if (last && now - last < THROTTLE_WINDOW_MS) return;
    lastSentAt.set(key, now);

    await sendEmail({
      to: alertEmail,
      subject: `[MoneyMatters] Error in ${functionName}`,
      text: `A server error occurred in ${functionName}.\n\nMessage: ${message}\n\nStack:\n${(err && err.stack) || 'n/a'}\n\nTime: ${new Date().toISOString()}`,
      html: `<p>A server error occurred in <strong>${functionName}</strong>.</p><p><strong>Message:</strong> ${message}</p><pre>${(err && err.stack) || 'n/a'}</pre><p>Time: ${new Date().toISOString()}</p>`,
    });
  } catch (alertErr) {
    console.error('error-alert: failed to send alert email:', alertErr.message);
  }
}

module.exports = { alertOnError };
