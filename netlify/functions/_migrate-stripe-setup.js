// TEMP — one-time Stripe test-mode setup for the MoneyMatters+ $5/month
// subscription. Checks for an existing Product/Price/webhook endpoint
// before creating anything (safe to re-run). Deploy, POST once, capture
// the returned price_id and webhook signing secret, then delete this
// file — same pattern as every other _migrate-*/_diag-* temp function in
// this repo.
const { stripeRequest } = require('./lib/stripe');

const WEBHOOK_URL = 'https://www.money-matters.site/api/stripe-webhook';
const ENABLED_EVENTS = [
  'checkout.session.completed',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'invoice.payment_failed',
];

function json(statusCode, body) {
  return { statusCode, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) };
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return json(405, { ok: false, error: 'method_not_allowed' });
  }

  try {
    // 1. Product + recurring $5/month Price — reuse if one already exists.
    const existingProducts = await stripeRequest('GET', '/products', { limit: 100 });
    let product = existingProducts.data.find((p) => p.name === 'MoneyMatters+');

    if (!product) {
      product = await stripeRequest('POST', '/products', {
        name: 'MoneyMatters+',
        description: 'MoneyMatters+ membership — advanced tools, webinars, and advisor Q&A.',
      });
    }

    const existingPrices = await stripeRequest('GET', '/prices', { product: product.id, limit: 100 });
    let price = existingPrices.data.find(
      (p) => p.active && p.unit_amount === 500 && p.currency === 'usd' && p.recurring && p.recurring.interval === 'month'
    );

    if (!price) {
      price = await stripeRequest('POST', '/prices', {
        product: product.id,
        unit_amount: 500,
        currency: 'usd',
        recurring: { interval: 'month' },
      });
    }

    // 2. Webhook endpoint — reuse if one already points at our URL, since
    // Stripe only returns the signing secret once, at creation time.
    const existingWebhooks = await stripeRequest('GET', '/webhook_endpoints', { limit: 100 });
    const existingWebhook = existingWebhooks.data.find((w) => w.url === WEBHOOK_URL);

    let webhookSecret = null;
    let webhookStatus;
    if (existingWebhook) {
      webhookStatus = 'already_exists_secret_not_retrievable_again';
    } else {
      const webhook = await stripeRequest('POST', '/webhook_endpoints', {
        url: WEBHOOK_URL,
        enabled_events: ENABLED_EVENTS,
      });
      webhookSecret = webhook.secret;
      webhookStatus = 'created';
    }

    return json(200, {
      ok: true,
      productId: product.id,
      priceId: price.id,
      webhookStatus,
      webhookSecret, // null if a webhook endpoint already existed
      existingWebhookId: existingWebhook ? existingWebhook.id : null,
    });
  } catch (err) {
    console.error('_migrate-stripe-setup error:', err);
    return json(500, { ok: false, error: err.message, stripeError: err.stripeError || null });
  }
};
