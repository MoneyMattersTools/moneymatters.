-- Round 2 additions (SITE_STRATEGY.md, locked 2026-08-05): advisor
-- self-onboarding + recommended matching + per-lead timeline, plus the
-- admin-dashboard KPI additions from the same round. Not yet applied —
-- run this in Supabase's SQL Editor, same as 0001-0005. Safe to re-run
-- (IF NOT EXISTS everywhere).
--
-- Three pieces:
--   1. advisor_invites — single-use signed tokens Ethan generates from the
--      admin page and sends himself (his own outreach channel, not an
--      automated email from this app) to one of the 46 researched firms.
--      Same crypto.randomBytes/expiry/DB-lookup technique as every other
--      token in this codebase, its own table for the same reason
--      advisor_lead_deliveries didn't reuse verification_tokens: the
--      shape doesn't fit (no email/pending_answers here either).
--   2. advisor_review_requests.status_changed_at — the one timestamp
--      missing for the per-lead activity timeline. "Matched" already has
--      a real timestamp via advisor_lead_deliveries.accepted_at; the gap
--      was "Meeting Taken," which only ever happens through Ethan
--      manually flipping the Status dropdown with no timestamp captured.
--      This column is updated on every status change, so it also ends up
--      covering Matched (set redundantly alongside accepted_at, harmless)
--      and any manual correction.
--   3. verification_tokens.pending_source — stages the traffic-source
--      attribution string (utm:source/medium, referrer:host, or direct)
--      captured client-side at diagnostic-submit time, the same
--      stage-then-promote pattern pending_health_score/pending_answers
--      already use. Promoted into users.source at verification, replacing
--      that column's previous hardcoded literal ('Health Score
--      Diagnostic' on every row, which carried no real signal — confirmed
--      no other code path reads it before repurposing).

create table if not exists advisor_invites (
  id uuid primary key default gen_random_uuid(),
  token text not null,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);
create unique index if not exists advisor_invites_token_key on advisor_invites (token);
alter table advisor_invites enable row level security;

alter table advisor_review_requests add column if not exists status_changed_at timestamptz not null default now();

alter table verification_tokens add column if not exists pending_source text;
