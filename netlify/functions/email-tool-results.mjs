import resendLib from './lib/resend.js';
import errorAlertLib from './lib/error-alert.js';
const { alertOnError } = errorAlertLib;

const { sendEmail } = resendLib;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const EMAIL_MAX_LENGTH = 254;
const TOOL_NAME_MAX_LENGTH = 60;
const MAX_SUMMARY_ROWS = 15;
const SUMMARY_LABEL_MAX_LENGTH = 80;
const SUMMARY_VALUE_MAX_LENGTH = 120;

// §26.8: a simple one-time "email me these results" for the native tools.
// No persistence — the tool is stateless/anonymous by design, this just
// relays whatever the browser already computed and rendered into an email.
function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function cleanSummary(value) {
  if (!Array.isArray(value)) return [];
  return value
    .filter((row) => row && typeof row.label === 'string' && typeof row.value === 'string')
    .slice(0, MAX_SUMMARY_ROWS)
    .map((row) => ({
      label: row.label.trim().slice(0, SUMMARY_LABEL_MAX_LENGTH),
      value: row.value.trim().slice(0, SUMMARY_VALUE_MAX_LENGTH),
    }))
    .filter((row) => row.label && row.value);
}

function json(statusCode, body) {
  return new Response(JSON.stringify(body), {
    status: statusCode,
    headers: { 'Content-Type': 'application/json' },
  });
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
  if (!email || email.length > EMAIL_MAX_LENGTH || !EMAIL_RE.test(email)) {
    return json(400, { ok: false, error: 'invalid_email' });
  }

  const toolName =
    typeof payload.toolName === 'string' && payload.toolName.trim()
      ? payload.toolName.trim().slice(0, TOOL_NAME_MAX_LENGTH)
      : 'MoneyMatters Tool';

  const summary = cleanSummary(payload.summary);
  if (!summary.length) {
    return json(400, { ok: false, error: 'invalid_summary' });
  }

  const rowsText = summary.map((row) => `${row.label}: ${row.value}`).join('\n');
  const rowsHtml = summary
    .map((row) => `<tr><td style="padding:6px 12px 6px 0;color:#4A5568;">${escapeHtml(row.label)}</td><td style="padding:6px 0;font-weight:600;">${escapeHtml(row.value)}</td></tr>`)
    .join('');

  try {
    await sendEmail({
      to: email,
      subject: `Your ${toolName} results`,
      text: `Here are your ${toolName} results from MoneyMatters.\n\n${rowsText}\n\nThese numbers are based on what you entered and are not personalized financial advice.`,
      html: `<p>Here are your ${escapeHtml(toolName)} results from MoneyMatters.</p><table cellpadding="0" cellspacing="0">${rowsHtml}</table><p style="color:#6B7280;font-size:13px;">These numbers are based on what you entered and are not personalized financial advice.</p>`,
    });
    return json(200, { ok: true });
  } catch (err) {
    console.error('email-tool-results error:', err);
    await alertOnError("email-tool-results", err);
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
