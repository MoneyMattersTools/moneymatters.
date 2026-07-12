const { readSessionFromEvent } = require('./lib/session');

exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: false, error: 'method_not_allowed' }),
    };
  }

  const session = readSessionFromEvent(event);

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(
      session
        ? { loggedIn: true, email: session.email, healthScore: session.healthScore, healthBand: session.healthBand }
        : { loggedIn: false }
    ),
  };
};
