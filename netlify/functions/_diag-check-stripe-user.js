const { findByEmail } = require('./lib/supabase');

function json(statusCode, body) {
  return { statusCode, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) };
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return json(405, { ok: false, error: 'method_not_allowed' });
  }
  const email = (event.queryStringParameters && event.queryStringParameters.email) || '';
  if (!email) return json(400, { ok: false, error: 'email required' });
  const user = await findByEmail('users', email.toLowerCase());
  if (!user) return json(404, { ok: false, error: 'not_found' });
  return json(200, {
    ok: true,
    email: user.email,
    plan: user.plan,
    plan_source: user.plan_source,
    stripe_customer_id: user.stripe_customer_id,
    stripe_subscription_id: user.stripe_subscription_id,
  });
};
