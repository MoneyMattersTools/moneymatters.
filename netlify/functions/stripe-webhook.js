// Stripe subscription integration (test mode) — the other half of
// create-checkout-session.js. Grants Plan=plus when a subscription is
// actually paid for, and revokes it when that same subscription is
// canceled or its payment fails.
//
// Manual-flag safety (DESIGN_SPEC.md §42 free-Plus-incentive users): a
// user's plan_source is only ever set to 'stripe' by this file, at the
// moment they actually complete a paid Checkout. Every existing user and
// every future manual grant (Table Editor) has plan_source left null, and
// the downgrade paths below only ever act on rows where
// plan_source === 'stripe' AND stripe_subscription_id matches the event's
// subscription — so a webhook for anyone's subscription can never affect
// a manually-flagged user, structurally, not by convention.
const { verifyWebhookSignature } = require('./lib/stripe');
const { findOneByFilters, updateRecord, encodeEq } = require('./lib/supabase');
const { alertOnError } = require('./lib/error-alert');

function json(statusCode, body) {
  return { statusCode, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) };
}

async function findUserByCustomerId(customerId) {
  return findOneByFilters('users', [`stripe_customer_id=${encodeEq(customerId)}`]);
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return json(405, { ok: false, error: 'method_not_allowed' });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('stripe-webhook: STRIPE_WEBHOOK_SECRET missing');
    await alertOnError("stripe-webhook", new Error("stripe-webhook: STRIPE_WEBHOOK_SECRET missing"));
    return json(500, { ok: false, error: 'server_error' });
  }

  const rawBody = event.isBase64Encoded ? Buffer.from(event.body, 'base64').toString('utf8') : event.body;
  const signatureHeader =
    (event.headers && (event.headers['stripe-signature'] || event.headers['Stripe-Signature'])) || '';

  let stripeEvent;
  try {
    verifyWebhookSignature(rawBody, signatureHeader, webhookSecret);
    stripeEvent = JSON.parse(rawBody);
  } catch (err) {
    console.error('stripe-webhook signature verification failed:', err.message);
    return json(400, { ok: false, error: 'invalid_signature' });
  }

  try {
    const obj = stripeEvent.data && stripeEvent.data.object;

    switch (stripeEvent.type) {
      case 'checkout.session.completed': {
        if (obj.mode !== 'subscription') break;
        const user = await findUserByCustomerId(obj.customer);
        if (user) {
          await updateRecord('users', user.id, {
            plan: 'plus',
            plan_source: 'stripe',
            stripe_subscription_id: obj.subscription,
          });
        }
        break;
      }

      case 'customer.subscription.updated': {
        const user = await findUserByCustomerId(obj.customer);
        if (!user) break;
        if (obj.status === 'active' || obj.status === 'trialing') {
          // Safe unconditionally — only a real Stripe customer (one this
          // user's own checkout created) can ever match here.
          await updateRecord('users', user.id, {
            plan: 'plus',
            plan_source: 'stripe',
            stripe_subscription_id: obj.id,
          });
        } else if (user.plan_source === 'stripe' && user.stripe_subscription_id === obj.id) {
          // canceled / unpaid / past_due / incomplete_expired, etc. —
          // only downgrade if this exact subscription is on record as
          // the reason the user currently has Plus.
          await updateRecord('users', user.id, { plan: 'free' });
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const user = await findUserByCustomerId(obj.customer);
        if (user && user.plan_source === 'stripe' && user.stripe_subscription_id === obj.id) {
          await updateRecord('users', user.id, { plan: 'free' });
        }
        break;
      }

      case 'invoice.payment_failed': {
        if (!obj.subscription) break;
        const user = await findUserByCustomerId(obj.customer);
        if (user && user.plan_source === 'stripe' && user.stripe_subscription_id === obj.subscription) {
          await updateRecord('users', user.id, { plan: 'free' });
        }
        break;
      }

      default:
        break;
    }

    return json(200, { ok: true });
  } catch (err) {
    // Not a signature problem (already handled above) — a genuine
    // processing error. Non-2xx so Stripe retries; every handler above is
    // idempotent (re-applying the same plan/plan_source/subscription_id
    // is harmless), so a retry is always safe.
    console.error('stripe-webhook handling error:', err);
    await alertOnError("stripe-webhook", err);
    return json(500, { ok: false, error: 'server_error' });
  }
};
