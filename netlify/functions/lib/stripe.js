// Plain fetch against Stripe's REST API — deliberately not the official
// `stripe` npm package, for the same reason lib/supabase.js avoids the
// Supabase SDK (see that file's header comment): this repo has zero npm
// dependencies today, and adding one package would mean adding this
// project's first-ever package.json/node_modules/build step for
// functions. Stripe's API is a normal form-encoded REST API and its
// webhook signature scheme is a documented, stable HMAC-SHA256 algorithm
// — nothing here actually needs the SDK's extra ergonomics.

const crypto = require('crypto');

const STRIPE_API = 'https://api.stripe.com/v1';

function stripeSecretKey() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('Stripe is not configured (STRIPE_SECRET_KEY missing)');
  return key;
}

// Stripe's API takes application/x-www-form-urlencoded bodies, including
// nested params via bracket notation (line_items[0][price]=...,
// metadata[mm_user_id]=...). This flattens a plain JS object/array into
// that form recursively.
function toFormPairs(params, prefix, pairs) {
  Object.keys(params).forEach((key) => {
    const value = params[key];
    if (value === undefined || value === null) return;
    const fullKey = prefix ? `${prefix}[${key}]` : key;
    if (Array.isArray(value)) {
      value.forEach((item, i) => {
        const indexedKey = `${fullKey}[${i}]`;
        if (item !== null && typeof item === 'object') {
          toFormPairs(item, indexedKey, pairs);
        } else {
          pairs.push(`${encodeURIComponent(indexedKey)}=${encodeURIComponent(item)}`);
        }
      });
    } else if (typeof value === 'object') {
      toFormPairs(value, fullKey, pairs);
    } else {
      pairs.push(`${encodeURIComponent(fullKey)}=${encodeURIComponent(value)}`);
    }
  });
  return pairs;
}

function toFormBody(params) {
  return toFormPairs(params || {}, '', []).join('&');
}

async function stripeRequest(method, path, params) {
  const key = stripeSecretKey();
  const opts = {
    method,
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  };
  let url = `${STRIPE_API}${path}`;
  if (method === 'GET') {
    const qs = toFormBody(params);
    if (qs) url += `?${qs}`;
  } else if (params) {
    opts.body = toFormBody(params);
  }
  const res = await fetch(url, opts);
  const json = await res.json();
  if (!res.ok) {
    const message = (json.error && json.error.message) || `Stripe ${method} ${path} failed: ${res.status}`;
    const err = new Error(message);
    err.stripeError = json.error;
    throw err;
  }
  return json;
}

// Stripe's documented webhook signing scheme: the `Stripe-Signature`
// header is `t=<unix timestamp>,v1=<hex hmac>`. The signed payload is
// `${timestamp}.${rawBody}`, HMAC-SHA256'd with the endpoint's signing
// secret. Verified here byte-for-byte against Stripe's own published
// algorithm (https://stripe.com/docs/webhooks/signatures#verify-manually)
// rather than the SDK's constructEvent, for the no-new-dependency reason
// above.
function verifyWebhookSignature(rawBody, signatureHeader, webhookSecret, toleranceSeconds) {
  if (!signatureHeader) throw new Error('missing stripe-signature header');

  const parts = {};
  signatureHeader.split(',').forEach((part) => {
    const idx = part.indexOf('=');
    if (idx === -1) return;
    parts[part.slice(0, idx)] = part.slice(idx + 1);
  });
  const timestamp = parts.t;
  const signature = parts.v1;
  if (!timestamp || !signature) throw new Error('malformed stripe-signature header');

  const signedPayload = `${timestamp}.${rawBody}`;
  const expectedSignature = crypto.createHmac('sha256', webhookSecret).update(signedPayload, 'utf8').digest('hex');

  const sigBuf = Buffer.from(signature, 'utf8');
  const expectedBuf = Buffer.from(expectedSignature, 'utf8');
  if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
    throw new Error('signature mismatch');
  }

  const tolerance = toleranceSeconds || 300; // Stripe's own default tolerance.
  const ageSeconds = Math.abs(Date.now() / 1000 - Number(timestamp));
  if (ageSeconds > tolerance) {
    throw new Error('timestamp outside tolerance');
  }

  return true;
}

module.exports = { stripeRequest, verifyWebhookSignature };
