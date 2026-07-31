import supabaseLib from './lib/supabase.js';
import sessionLib from './lib/session.js';

const { createRecord, countRecentByIpSince } = supabaseLib;
const { readSessionFromRequest } = sessionLib;

// §38.9: post-quiz/tool review widget — 1-5 stars plus an optional
// comment, specific to whichever tool the visitor just finished. No
// account required (unlike saving a result to the dashboard, §28.2):
// rating a tool is a much lower-stakes ask than saving your figures, so
// this stays open to anonymous visitors too. email is filled in only
// when a session cookie happens to already be present, never required.
const VALID_TOOLS = ['diagnostic', 'networth', 'budget', 'retirement', 'investment'];
const COMMENT_MAX_LENGTH = 600;

const IP_RATE_LIMIT_WINDOW_SECONDS = 60;
const IP_RATE_LIMIT_MAX_REQUESTS = 10;

function getClientIp(request, context) {
  if (context && typeof context.ip === 'string' && context.ip) return context.ip;
  const headerIp = request.headers.get('x-nf-client-connection-ip');
  if (headerIp) return headerIp;
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) return forwardedFor.split(',')[0].trim();
  return 'unknown';
}

function json(statusCode, body) {
  return new Response(JSON.stringify(body), {
    status: statusCode,
    headers: { 'Content-Type': 'application/json' },
  });
}

export default async (request, context) => {
  if (request.method !== 'POST') {
    return json(405, { ok: false, error: 'method_not_allowed' });
  }

  let payload;
  try {
    payload = await request.json();
  } catch {
    return json(400, { ok: false, error: 'invalid_json' });
  }

  const tool = typeof payload.tool === 'string' ? payload.tool : '';
  if (!VALID_TOOLS.includes(tool)) {
    return json(400, { ok: false, error: 'invalid_tool' });
  }

  const rating = Number(payload.rating);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return json(400, { ok: false, error: 'invalid_rating' });
  }

  const comment = typeof payload.comment === 'string'
    ? payload.comment.trim().slice(0, COMMENT_MAX_LENGTH)
    : '';

  const clientIp = getClientIp(request, context);

  try {
    if (clientIp !== 'unknown') {
      const recentCount = await countRecentByIpSince(
        'tool_feedback',
        clientIp,
        IP_RATE_LIMIT_WINDOW_SECONDS,
        'submitted_at'
      );
      if (recentCount >= IP_RATE_LIMIT_MAX_REQUESTS) {
        return json(429, { ok: false, error: 'rate_limited' });
      }
    }

    const session = readSessionFromRequest(request);

    await createRecord('tool_feedback', {
      tool,
      rating,
      comment: comment || null,
      email: (session && session.email) || null,
      submitted_at: new Date().toISOString(),
      request_ip: clientIp,
    });

    return json(200, { ok: true });
  } catch (err) {
    console.error('submit-feedback error:', err);
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
