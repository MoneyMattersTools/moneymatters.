import supabaseLib from './lib/supabase.js';
import sessionLib from './lib/session.js';
import resendLib from './lib/resend.js';

const { findByEmail, updateRecord } = supabaseLib;
const { readSessionFromRequest } = sessionLib;
const { sendEmail } = resendLib;

const MAX_SUMMARY_ROWS = 15;
const LABEL_MAX_LENGTH = 80;
const VALUE_MAX_LENGTH = 120;

// §28.2: gives Budget/Retirement/Investment/Net Worth the same "Submit"
// treatment the Financial Health Score already has via the diagnostic
// flow — saves a compact result snapshot onto the user's Users record
// (so the homepage dashboard can show it) and emails a confirmation.
// Requires a session: these tools stay reachable anonymously, but saving
// to "your dashboard" needs an identified account, same as the rest of
// the site's access model (SITE_STRATEGY.md §3 — saved results require a
// verified email).
const TOOLS = {
  networth: { resultColumn: 'net_worth_result', submittedColumn: 'net_worth_submitted_at', label: 'Net Worth Calculator' },
  budget: { resultColumn: 'budget_result', submittedColumn: 'budget_submitted_at', label: 'Budget Tool' },
  retirement: { resultColumn: 'retirement_result', submittedColumn: 'retirement_submitted_at', label: 'Retirement Tool' },
  investment: { resultColumn: 'investment_result', submittedColumn: 'investment_submitted_at', label: 'Investment Tool' },
};

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function cleanRow(row) {
  if (!row || typeof row.label !== 'string' || typeof row.value !== 'string') return null;
  const label = row.label.trim().slice(0, LABEL_MAX_LENGTH);
  const value = row.value.trim().slice(0, VALUE_MAX_LENGTH);
  return label && value ? { label, value } : null;
}

function cleanSummary(value) {
  if (!Array.isArray(value)) return [];
  return value.map(cleanRow).filter(Boolean).slice(0, MAX_SUMMARY_ROWS);
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

  const session = readSessionFromRequest(request);
  if (!session || !session.email) {
    return json(401, { ok: false, error: 'not_authenticated' });
  }

  let payload;
  try {
    payload = await request.json();
  } catch {
    return json(400, { ok: false, error: 'invalid_json' });
  }

  const tool = TOOLS[payload.tool];
  if (!tool) {
    return json(400, { ok: false, error: 'invalid_tool' });
  }

  const headline = cleanRow(payload.headline);
  const summary = cleanSummary(payload.summary);
  if (!headline || !summary.length) {
    return json(400, { ok: false, error: 'invalid_result' });
  }

  try {
    const user = await findByEmail('users', session.email);
    if (!user) {
      return json(404, { ok: false, error: 'no_account' });
    }

    const nowIso = new Date().toISOString();
    await updateRecord('users', user.id, {
      [tool.resultColumn]: { headline, summary },
      [tool.submittedColumn]: nowIso,
    });

    const rowsText = summary.map((row) => `${row.label}: ${row.value}`).join('\n');
    const rowsHtml = summary
      .map((row) => `<tr><td style="padding:6px 12px 6px 0;color:#4A5568;">${escapeHtml(row.label)}</td><td style="padding:6px 0;font-weight:600;">${escapeHtml(row.value)}</td></tr>`)
      .join('');

    try {
      await sendEmail({
        to: session.email,
        subject: `Your ${tool.label} results are saved`,
        text: `Your ${tool.label} results are saved to your MoneyMatters dashboard.\n\n${headline.label}: ${headline.value}\n\n${rowsText}\n\nThese numbers are based on what you entered and are not personalized financial advice.`,
        html: `<p>Your ${escapeHtml(tool.label)} results are saved to your MoneyMatters dashboard.</p><p style="font-size:20px;font-weight:700;">${escapeHtml(headline.label)}: ${escapeHtml(headline.value)}</p><table cellpadding="0" cellspacing="0">${rowsHtml}</table><p style="color:#6B7280;font-size:13px;">These numbers are based on what you entered and are not personalized financial advice.</p>`,
      });
    } catch (emailErr) {
      console.error('submit-tool-result confirmation email error:', emailErr);
    }

    return json(200, { ok: true });
  } catch (err) {
    console.error('submit-tool-result error:', err);
    return json(500, { ok: false, error: 'server_error' });
  }
};

export const config = {
  rateLimit: {
    windowLimit: 10,
    windowSize: 60,
    aggregateBy: ['ip', 'domain'],
  },
};
