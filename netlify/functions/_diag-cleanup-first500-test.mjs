import supabaseLib from './lib/supabase.js';

const { findByEmail, updateRecord } = supabaseLib;

export default async () => {
  const email = 'mm-test-first500-1786013159341@web-library.net';
  const user = await findByEmail('users', email);
  if (!user) {
    return new Response(JSON.stringify({ found: false }), { headers: { 'Content-Type': 'application/json' } });
  }
  const updated = await updateRecord('users', user.id, { is_test: true });
  return new Response(JSON.stringify({ found: true, id: updated.id, email: updated.email, is_test: updated.is_test }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
