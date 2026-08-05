const { stripeRequest } = require('./lib/stripe');

function json(statusCode, body) {
  return { statusCode, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) };
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return json(405, { ok: false, error: 'method_not_allowed' });
  }
  try {
    const account = await stripeRequest('GET', '/account');
    return json(200, {
      ok: true,
      id: account.id,
      settings: account.settings ? { branding: account.settings.branding } : null,
    });
  } catch (err) {
    return json(500, { ok: false, error: err.message, stripeError: err.stripeError || null });
  }
};
