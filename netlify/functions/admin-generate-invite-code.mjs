import crypto from 'node:crypto';
import supabaseLib from './lib/supabase.js';
import adminAuthLib from './lib/admin-auth.js';
import errorAlertLib from './lib/error-alert.js';
const { alertOnError } = errorAlertLib;

const { createRecord } = supabaseLib;
const { checkAdminPassword } = adminAuthLib;

const LABEL_MAX_LENGTH = 120;
// Excludes visually ambiguous characters (0/O, 1/I/L) since these are
// meant to be read off a screen and typed by hand, not copy-pasted.
const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const CODE_LENGTH = 8;

function json(statusCode, body) {
  return new Response(JSON.stringify(body), {
    status: statusCode,
    headers: { 'Content-Type': 'application/json' },
  });
}

function generateCode() {
  const bytes = crypto.randomBytes(CODE_LENGTH);
  let code = '';
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length];
  }
  return code;
}

// Round-35 ask: per-advisor invite codes, generated from the admin page,
// replacing the single shared ADVISOR_ACCESS_CODE.
export default async (request) => {
  if (request.method !== 'POST') {
    return json(405, { ok: false, error: 'method_not_allowed' });
  }
  if (!checkAdminPassword(request)) {
    return json(401, { ok: false, error: 'unauthorized' });
  }

  let payload;
  try {
    payload = await request.json();
  } catch {
    payload = {};
  }
  const label = typeof payload.label === 'string' ? payload.label.trim().slice(0, LABEL_MAX_LENGTH) : '';

  try {
    // Collisions are astronomically unlikely at this volume (32^8
    // possibilities), but retry once rather than surface a 500 for a
    // one-in-a-billion unique-constraint hit.
    let invite;
    for (let attempt = 0; attempt < 2 && !invite; attempt++) {
      try {
        invite = await createRecord('advisor_invite_codes', { code: generateCode(), label: label || null });
      } catch (err) {
        if (attempt === 1 || !/duplicate key|unique/i.test(err.message)) throw err;
      }
    }
    return json(200, { ok: true, invite });
  } catch (err) {
    console.error('admin-generate-invite-code error:', err);
    await alertOnError("admin-generate-invite-code", err);
    return json(500, { ok: false, error: 'server_error' });
  }
};

export const config = {
  rateLimit: {
    windowLimit: 30,
    windowSize: 60,
    aggregateBy: ['ip', 'domain'],
  },
};
