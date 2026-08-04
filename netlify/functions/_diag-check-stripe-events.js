const { stripeRequest } = require('./lib/stripe');

function json(statusCode, body) {
  return { statusCode, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) };
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return json(405, { ok: false, error: 'method_not_allowed' });
  }
  try {
    const eventId = (event.queryStringParameters && event.queryStringParameters.id) || '';
    if (eventId) {
      const detail = await stripeRequest('GET', `/events/${eventId}`);
      return json(200, { ok: true, event: detail });
    }
    const events = await stripeRequest('GET', '/events', { limit: 10 });
    return json(200, {
      ok: true,
      events: events.data.map((e) => ({ id: e.id, type: e.type, created: e.created, pending_webhooks: e.pending_webhooks })),
    });
  } catch (err) {
    return json(500, { ok: false, error: err.message });
  }
};
