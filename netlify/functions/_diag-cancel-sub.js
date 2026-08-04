const { stripeRequest } = require('./lib/stripe');

function json(statusCode, body) {
  return { statusCode, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) };
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return json(405, { ok: false, error: 'method_not_allowed' });
  }
  try {
    const subId = (JSON.parse(event.body || '{}')).subscriptionId;
    const result = await stripeRequest('DELETE', `/subscriptions/${subId}`);
    return json(200, { ok: true, status: result.status });
  } catch (err) {
    return json(500, { ok: false, error: err.message });
  }
};
