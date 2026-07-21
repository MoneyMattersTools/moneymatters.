// Manual data-deletion ops script (MVP — run by a human, not self-service).
//
// Usage:
//   AIRTABLE_API_KEY=... AIRTABLE_BASE_ID=... node scripts/ops/delete-user-data.mjs someone@example.com
//
// Deletes the Users record and any Verification Tokens records (which can
// hold pending diagnostic answers pre-verification) for the given email,
// then marks the matching pending Deletion Requests record as Completed.

import airtableLib from '../../netlify/functions/lib/airtable.js';

const { findByEmail, findAllByFormula, findOneByFormula, deleteRecord, updateRecord, escapeFormulaValue } = airtableLib;

const email = (process.argv[2] || '').trim().toLowerCase();
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

if (!email || !EMAIL_RE.test(email)) {
  console.error('Usage: node scripts/ops/delete-user-data.mjs <email>');
  process.exit(1);
}

async function run() {
  console.log(`Deleting data for: ${email}`);
  const summary = { usersDeleted: 0, tokensDeleted: 0, requestMarkedComplete: false };

  const userRecord = await findByEmail('Users', email);
  if (userRecord) {
    await deleteRecord('Users', userRecord.id);
    summary.usersDeleted = 1;
    console.log(`  - Deleted Users record ${userRecord.id}`);
  } else {
    console.log('  - No Users record found');
  }

  const tokenRecords = await findAllByFormula(
    'Verification Tokens',
    `LOWER({Email}) = '${escapeFormulaValue(email)}'`
  );
  for (const record of tokenRecords) {
    await deleteRecord('Verification Tokens', record.id);
    summary.tokensDeleted += 1;
    console.log(`  - Deleted Verification Tokens record ${record.id}`);
  }
  if (tokenRecords.length === 0) {
    console.log('  - No Verification Tokens records found');
  }

  const pendingRequest = await findOneByFormula(
    'Deletion Requests',
    `AND(LOWER({Email}) = '${escapeFormulaValue(email)}', {Status} = 'Pending')`
  );
  if (pendingRequest) {
    await updateRecord('Deletion Requests', pendingRequest.id, {
      Status: 'Completed',
      'Completed At': new Date().toISOString(),
    });
    summary.requestMarkedComplete = true;
    console.log(`  - Marked Deletion Requests record ${pendingRequest.id} as Completed`);
  } else {
    console.log('  - No pending Deletion Requests record found for this email');
  }

  console.log('\nDone:', JSON.stringify(summary));
}

run().catch((err) => {
  console.error('delete-user-data failed:', err);
  process.exit(1);
});
