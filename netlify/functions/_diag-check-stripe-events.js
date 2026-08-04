const { stripeRequest } = require('./lib/stripe');

function json(statusCode, body) {
  return { statusCode, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) };
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return json(405, { ok: false, error: 'method_not_allowed' });
  }
  try {
    const events = await stripeRequest('GET', '/events', { limit: 10 });
    const webhooks = await stripeRequest('GET', '/webhook_endpoints', { limit: 10 });
    return json(200, {
      ok: true,
      events: events.data.map((e) => ({ id: e.id, type: e.type, created: e.created })),
      webhookEndpoints: webhooks.data.map((w) => ({ id: w.id, url: w.url, status: w.status, enabled_events: w.enabled_events })),
    });
  } catch (err) {
    return json(500, { ok: false, error: err.message });
  }
};
