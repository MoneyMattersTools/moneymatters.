// ONE-TIME bulk data migration: Airtable -> Supabase. Not part of the
// permanent function set — remove after a single confirmed-successful run.
//
// Decisions made here (documented for the milestone report, not just left
// implicit):
//   - Users, Advisor Review Requests, and Deletion Requests: every record
//     migrated (real account/business/compliance data).
//   - Verification Tokens: only ACTIVE ones (not used, not expired) are
//     migrated. Expired/already-used tokens are single-use security
//     artifacts with zero remaining function — carrying them over serves
//     no purpose and just retains stale secrets unnecessarily.
//   - created_at (Users, Verification Tokens — columns the old Airtable
//     schema had no equivalent field for) is backfilled from Airtable's
//     own record.createdTime metadata, which every Airtable record carries
//     regardless of its fields — more accurate than defaulting to "now"
//     for all of them.
//   - Idempotent by design (safe to re-run if it fails partway): Users are
//     skipped if a Supabase row with that email already exists; tokens are
//     skipped if that exact token already exists. Advisor Review Requests
//     and Deletion Requests are plain inserts (low volume, run once).
const { createRecord: createSupabaseRecord, findByEmail: findSupabaseUserByEmail, findByToken: findSupabaseTokenByToken } = require('./lib/supabase');

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;

async function fetchAllAirtableRecords(table) {
  const records = [];
  let offset;
  do {
    const qs = new URLSearchParams({ pageSize: '100' });
    if (offset) qs.set('offset', offset);
    const res = await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(table)}?${qs.toString()}`, {
      headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` },
    });
    if (!res.ok) throw new Error(`Airtable fetch ${table} failed: ${res.status} ${await res.text().catch(() => '')}`);
    const data = await res.json();
    records.push(...(data.records || []));
    offset = data.offset;
  } while (offset);
  return records;
}

function safeJsonParse(value) {
  if (!value) return null;
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'method_not_allowed' }) };
  }

  const report = {};

  try {
    // --- Users ---
    const airtableUsers = await fetchAllAirtableRecords('Users');
    let created = 0, skippedExisting = 0, errored = 0;
    const errors = [];
    for (const rec of airtableUsers) {
      const f = rec.fields || {};
      const email = (f.Email || '').trim().toLowerCase();
      if (!email) {
        errored++;
        errors.push({ recordId: rec.id, error: 'missing email' });
        continue;
      }
      try {
        const existing = await findSupabaseUserByEmail('users', email);
        if (existing) {
          skippedExisting++;
          continue;
        }
        await createSupabaseRecord('users', {
          email,
          verified: !!f.Verified,
          health_score: typeof f['Health Score'] === 'number' ? f['Health Score'] : null,
          health_score_band: f['Health Score Band'] || null,
          health_score_answers: safeJsonParse(f['Health Score Answers']),
          health_score_completed_at: f['Health Score Completed At'] || null,
          last_verified_at: f['Last Verified At'] || null,
          source: f.Source || null,
          plan: f.Plan === 'Plus' ? 'plus' : 'free',
          net_worth_result: safeJsonParse(f['Net Worth Result']),
          net_worth_submitted_at: f['Net Worth Submitted At'] || null,
          budget_result: safeJsonParse(f['Budget Result']),
          budget_submitted_at: f['Budget Submitted At'] || null,
          retirement_result: safeJsonParse(f['Retirement Result']),
          retirement_submitted_at: f['Retirement Submitted At'] || null,
          investment_result: safeJsonParse(f['Investment Result']),
          investment_submitted_at: f['Investment Submitted At'] || null,
          created_at: rec.createdTime,
        });
        created++;
      } catch (err) {
        errored++;
        errors.push({ recordId: rec.id, email, error: String(err.message || err) });
      }
    }
    report.users = { foundInAirtable: airtableUsers.length, created, skippedExisting, errored, errors };

    // --- Verification Tokens (active only) ---
    const airtableTokens = await fetchAllAirtableRecords('Verification Tokens');
    const nowMs = Date.now();
    const activeTokens = airtableTokens.filter((rec) => {
      const f = rec.fields || {};
      if (f['Used At']) return false;
      if (!f['Expires At']) return false;
      return new Date(f['Expires At']).getTime() > nowMs;
    });
    created = 0; skippedExisting = 0; errored = 0;
    const tokenErrors = [];
    for (const rec of activeTokens) {
      const f = rec.fields || {};
      const token = f.Token;
      if (!token) {
        errored++;
        tokenErrors.push({ recordId: rec.id, error: 'missing token' });
        continue;
      }
      try {
        const existing = await findSupabaseTokenByToken('verification_tokens', token);
        if (existing) {
          skippedExisting++;
          continue;
        }
        await createSupabaseRecord('verification_tokens', {
          token,
          email: (f.Email || '').trim().toLowerCase(),
          purpose: f.Purpose || 'signup_verification',
          expires_at: f['Expires At'],
          used_at: null,
          request_ip: f['Request IP'] || null,
          pending_health_score: typeof f['Pending Health Score'] === 'number' ? f['Pending Health Score'] : null,
          pending_answers: safeJsonParse(f['Pending Answers']),
          created_at: rec.createdTime,
        });
        created++;
      } catch (err) {
        errored++;
        tokenErrors.push({ recordId: rec.id, error: String(err.message || err) });
      }
    }
    report.verificationTokens = {
      foundInAirtable: airtableTokens.length,
      activeCandidates: activeTokens.length,
      notMigratedExpiredOrUsed: airtableTokens.length - activeTokens.length,
      created,
      skippedExisting,
      errored,
      errors: tokenErrors,
    };

    // --- Advisor Review Requests ---
    const airtableAdvisor = await fetchAllAirtableRecords('Advisor Review Requests');
    created = 0; errored = 0;
    const advisorErrors = [];
    for (const rec of airtableAdvisor) {
      const f = rec.fields || {};
      try {
        await createSupabaseRecord('advisor_review_requests', {
          email: (f.Email || '').trim().toLowerCase(),
          situational_details: safeJsonParse(f['Situational Details']),
          details: f.Details || null,
          location: f.Location || null,
          requested_at: f['Requested At'] || null,
          request_ip: f['Request IP'] || null,
          status: f.Status || 'Requested',
          shared_scores: safeJsonParse(f['Shared Scores']),
        });
        created++;
      } catch (err) {
        errored++;
        advisorErrors.push({ recordId: rec.id, error: String(err.message || err) });
      }
    }
    report.advisorReviewRequests = { foundInAirtable: airtableAdvisor.length, created, errored, errors: advisorErrors };

    // --- Deletion Requests ---
    const airtableDeletion = await fetchAllAirtableRecords('Deletion Requests');
    created = 0; errored = 0;
    const deletionErrors = [];
    for (const rec of airtableDeletion) {
      const f = rec.fields || {};
      try {
        await createSupabaseRecord('deletion_requests', {
          email: (f.Email || '').trim().toLowerCase(),
          requested_at: f['Requested At'] || null,
          status: f.Status || 'Pending',
          request_ip: f['Request IP'] || null,
        });
        created++;
      } catch (err) {
        errored++;
        deletionErrors.push({ recordId: rec.id, error: String(err.message || err) });
      }
    }
    report.deletionRequests = { foundInAirtable: airtableDeletion.length, created, errored, errors: deletionErrors };

    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(report, null, 2) };
  } catch (err) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: String(err.message || err), partialReport: report }, null, 2),
    };
  }
};
