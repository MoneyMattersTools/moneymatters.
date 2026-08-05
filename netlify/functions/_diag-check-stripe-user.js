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
    health_score: user.health_score,
    health_score_band: user.health_score_band,
    health_score_completed_at: user.health_score_completed_at,
    net_worth_result: user.net_worth_result,
    net_worth_submitted_at: user.net_worth_submitted_at,
    budget_result: user.budget_result,
    budget_submitted_at: user.budget_submitted_at,
    retirement_result: user.retirement_result,
    retirement_submitted_at: user.retirement_submitted_at,
    investment_result: user.investment_result,
    investment_submitted_at: user.investment_submitted_at,
  });
};
