// Stripe subscription integration (test mode) — creates a Checkout
// Session for the $5/month MoneyMatters+ price and returns its hosted
// URL for the frontend to redirect to. See stripe-webhook.js for the
// other half (granting/revoking Plan=plus based on what actually happens
// to the subscription).
const { readSessionFromEvent } = require('./lib/session');
const { findByEmail, updateRecord } = require('./lib/supabase');
const { stripeRequest } = require('./lib/stripe');

const SITE_URL = 'https://www.money-matters.site';

function json(statusCode, body, extraHeaders = {}) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json', ...extraHeaders },
    body: JSON.stringify(body),
  };
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return json(405, { ok: false, error: 'method_not_allowed' });
  }

  const session = readSessionFromEvent(event);
  if (!session || !session.email) {
    return json(401, { ok: false, error: 'not_signed_in' });
  }

  const priceId = process.env.STRIPE_PLUS_PRICE_ID;
  if (!priceId) {
    console.error('create-checkout-session: STRIPE_PLUS_PRICE_ID missing');
    return json(500, { ok: false, error: 'server_error' });
  }

  try {
    const user = await findByEmail('users', session.email);
    if (!user) {
      return json(404, { ok: false, error: 'not_found' });
    }

    // Reuse an existing Stripe customer for this user instead of creating
    // a new one on every checkout attempt (e.g. a retry after cancelling
    // out of Checkout the first time).
    let customerId = user.stripe_customer_id;
    if (!customerId) {
      const customer = await stripeRequest('POST', '/customers', {
        email: user.email,
        metadata: { mm_user_id: user.id },
      });
      customerId = customer.id;
      await updateRecord('users', user.id, { stripe_customer_id: customerId });
    }

    const checkoutSession = await stripeRequest('POST', '/checkout/sessions', {
      mode: 'subscription',
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${SITE_URL}/moneymatters-plus.html?checkout=success`,
      cancel_url: `${SITE_URL}/moneymatters-plus.html?checkout=cancelled`,
      client_reference_id: user.id,
      subscription_data: { metadata: { mm_user_id: user.id, mm_email: user.email } },
    });

    return json(200, { ok: true, url: checkoutSession.url });
  } catch (err) {
    console.error('create-checkout-session error:', err);
    return json(500, { ok: false, error: 'server_error' });
  }
};
