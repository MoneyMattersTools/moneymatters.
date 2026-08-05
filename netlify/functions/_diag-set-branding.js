// TEMP diagnostic — tests whether Stripe Checkout branding (icon upload +
// primary/secondary color) is settable via the API for this account, or
// whether it's genuinely Dashboard-only as DESIGN_SPEC §47.2 assumes.
function json(statusCode, body) {
  return { statusCode, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) };
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return json(405, { ok: false, error: 'method_not_allowed' });
  }
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return json(500, { ok: false, error: 'no key' });

  try {
    // 1. fetch the live favicon image and upload it to Stripe's Files API
    // (a different host than api.stripe.com, and multipart/form-data, not
    // the form-urlencoded body every other call in lib/stripe.js uses).
    const imgRes = await fetch('https://www.money-matters.site/images/favicon.png');
    if (!imgRes.ok) return json(500, { ok: false, error: 'could not fetch source image', status: imgRes.status });
    const imgBlob = await imgRes.blob();

    const form = new FormData();
    form.append('purpose', 'business_icon');
    form.append('file', imgBlob, 'favicon.png');

    const uploadRes = await fetch('https://files.stripe.com/v1/files', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}` },
      body: form,
    });
    const uploadJson = await uploadRes.json();
    if (!uploadRes.ok) {
      return json(200, { ok: false, step: 'file_upload', status: uploadRes.status, error: uploadJson.error });
    }

    // 2. try applying it + colors to the account's branding settings.
    const params = new URLSearchParams();
    params.set('settings[branding][icon]', uploadJson.id);
    params.set('settings[branding][primary_color]', '#0F1B15');
    params.set('settings[branding][secondary_color]', '#C49A47');

    const acctRes = await fetch('https://api.stripe.com/v1/account', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });
    const acctJson = await acctRes.json();
    if (!acctRes.ok) {
      return json(200, { ok: false, step: 'account_update', status: acctRes.status, error: acctJson.error, uploadedFileId: uploadJson.id });
    }

    return json(200, { ok: true, fileId: uploadJson.id, branding: acctJson.settings.branding });
  } catch (err) {
    return json(500, { ok: false, error: err.message, stack: err.stack });
  }
};
