const crypto = require('crypto');
const { stripeRequest } = require('./lib/stripe');

function json(statusCode, body) {
  return { statusCode, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) };
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return json(405, { ok: false, error: 'method_not_allowed' });
  }
  try {
    const eventId = (JSON.parse(event.body || '{}')).eventId;
    const stripeEvent = await stripeRequest('GET', `/events/${eventId}`);
    const rawBody = JSON.stringify(stripeEvent);
    const timestamp = Math.floor(Date.now() / 1000);
    const signedPayload = `${timestamp}.${rawBody}`;
    const signature = crypto.createHmac('sha256', process.env.STRIPE_WEBHOOK_SECRET).update(signedPayload, 'utf8').digest('hex');
    const stripeSignatureHeader = `t=${timestamp},v1=${signature}`;

    const res = await fetch('https://www.money-matters.site/api/stripe-webhook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'stripe-signature': stripeSignatureHeader },
      body: rawBody,
    });
    const resBody = await res.text();
    return json(200, { ok: true, testedStatus: res.status, testedBody: resBody });
  } catch (err) {
    return json(500, { ok: false, error: err.message });
  }
};
