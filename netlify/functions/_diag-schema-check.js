// Temporary, one-off diagnostic — raw, fully-logged request against one
// table to see the ACTUAL PostgREST response body, not just a status code.
// Bypasses lib/supabase.js on purpose: that lib's countAll() uses HEAD
// requests, and HEAD responses conventionally carry no body even on
// error — meaning every previous check against this endpoint could only
// ever have seen an empty error string, never PostgREST's real message.
// Not part of the permanent function set; delete after use.
const TABLE = 'users';

exports.handler = async () => {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    return json(200, { ok: false, error: 'env vars missing', hasUrl: !!url, hasKey: !!key });
  }

  const fullUrl = `${url.replace(/\/$/, '')}/rest/v1/${TABLE}?select=id&limit=1`;

  const headers = {
    apikey: key,
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
  };

  let res, bodyText;
  try {
    res = await fetch(fullUrl, { method: 'GET', headers });
    bodyText = await res.text();
  } catch (err) {
    return json(200, { ok: false, error: 'fetch threw: ' + String(err.message || err), fullUrl });
  }

  return json(200, {
    requestedUrl: fullUrl,
    requestHeaderNames: Object.keys(headers),
    apikeyPrefix: key.slice(0, 12) + '…',
    apikeyLength: key.length,
    authHeaderPrefix: headers.Authorization.slice(0, 19) + '…',
    responseStatus: res.status,
    responseStatusText: res.statusText,
    responseBody: bodyText,
    responseContentType: res.headers.get('content-type'),
  });
};

function json(statusCode, body) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body, null, 2),
  };
}
