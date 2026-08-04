function json(statusCode, body) {
  return { statusCode, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) };
}

exports.handler = async (event) => {
  return json(200, {
    ok: true,
    method: event.httpMethod,
    isBase64Encoded: event.isBase64Encoded,
    bodyLength: event.body ? event.body.length : 0,
    bodyFirst80: event.body ? event.body.slice(0, 80) : null,
    bodyLast40: event.body ? event.body.slice(-40) : null,
    contentType: (event.headers && (event.headers['content-type'] || event.headers['Content-Type'])) || null,
    hasStripeSignature: !!(event.headers && (event.headers['stripe-signature'] || event.headers['Stripe-Signature'])),
  });
};
