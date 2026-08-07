const crypto = await import('node:crypto');

// Accepts a real Cookie header (forwarded exactly as received) and
// replicates lib/advisor-access.js's verifyGrant logic step by step,
// reporting each stage — to find exactly where a REAL cross-request
// cookie diverges from the in-process test that worked.
export default async (request) => {
  const cookieHeader = request.headers.get('cookie') || '';
  const parsed = {};
  cookieHeader.split(';').forEach((pair) => {
    const idx = pair.indexOf('=');
    if (idx === -1) return;
    parsed[pair.slice(0, idx).trim()] = pair.slice(idx + 1).trim();
  });

  const raw = parsed['mm_advisor_access'];
  let decoded = null;
  let decodeError = null;
  try {
    decoded = decodeURIComponent(raw || '');
  } catch (e) {
    decodeError = e.message;
  }

  let payloadDecoded = null;
  let sigMatch = null;
  if (decoded && decoded.includes('.')) {
    const [payloadB64, sig] = decoded.split('.');
    const secret = process.env.SESSION_SECRET;
    const expectedSig = crypto.createHmac('sha256', secret).update(payloadB64).digest('base64url');
    sigMatch = sig === expectedSig;
    try {
      payloadDecoded = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
    } catch (e) {
      payloadDecoded = 'parse error: ' + e.message;
    }
  }

  return new Response(JSON.stringify({
    rawCookieHeader: cookieHeader,
    parsedCookieNames: Object.keys(parsed),
    rawValue: raw,
    decodeError,
    decodedEqualsRaw: decoded === raw,
    payloadDecoded,
    sigMatch,
  }, null, 2), { headers: { 'Content-Type': 'application/json' } });
};
