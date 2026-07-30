import supabaseLib from './lib/supabase.js';

const { countAll } = supabaseLib;

// Supabase free-tier projects auto-pause after 7 days with no API activity.
// This is a scheduled Netlify Function (see `config.schedule` below) that
// makes one cheap, real request against the database on a fixed interval
// well under that 7-day threshold, so the project never goes quiet long
// enough to trigger it. A daily schedule gives a wide safety margin without
// adding any meaningful load — this reuses countAll's single HEAD request,
// the cheapest real read available, on the smallest table.
export default async () => {
  try {
    const count = await countAll('deletion_requests');
    console.log(`ping-supabase: ok, deletion_requests count=${count}`);
    return new Response('ok');
  } catch (err) {
    // Logged, not rethrown — a failed ping shouldn't page anyone by
    // itself (Netlify already surfaces function errors in its logs), and
    // there's a week of runway before a single missed ping would matter.
    console.error('ping-supabase error:', err);
    return new Response('error', { status: 500 });
  }
};

export const config = {
  schedule: '@daily',
};
