// Temporary — inspects the 3 Advisor Review Requests records that failed
// migration, to see their full raw Airtable field content. Not part of
// the permanent function set; delete after use.
const RECORD_IDS = ['rec9Q9BnVoFv4Xjz3', 'recVQAEvUZj8AA4X1', 'recZUBSXiIpWbVvGP'];

exports.handler = async () => {
  const apiKey = process.env.AIRTABLE_API_KEY;
  const baseId = process.env.AIRTABLE_BASE_ID;
  const results = {};
  for (const id of RECORD_IDS) {
    const res = await fetch(`https://api.airtable.com/v0/${baseId}/${encodeURIComponent('Advisor Review Requests')}/${id}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    results[id] = res.ok ? await res.json() : { error: res.status, body: await res.text() };
  }
  return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(results, null, 2) };
};
