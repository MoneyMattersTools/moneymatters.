-- MoneyMatters — initial schema, migrated from Airtable (4 tables).
-- Run this once in the Supabase project's SQL Editor before any function
-- code is cut over. Safe to re-run: every statement is idempotent
-- (IF NOT EXISTS / OR REPLACE), so re-running after a partial failure
-- won't error on objects that already exist.
--
-- Design notes (see also netlify/functions/lib/supabase.js):
--   - Server-side only: every table is accessed exclusively via the
--     service_role key from Netlify Functions, never from the browser.
--     RLS is enabled with zero policies as defense-in-depth (service_role
--     bypasses RLS entirely by design; anon/authenticated get zero access
--     since no policy grants any), not because client-side access is
--     expected.
--   - email columns are always written lowercased by the application layer
--     (every function already lowercases before use) — a plain btree
--     index is enough, no functional lower(email) index or citext needed.
--   - status/purpose columns are plain text, not native Postgres enums —
--     adding a new value later (e.g. an advisor-status the team starts
--     using) is then just a normal INSERT, not a schema migration.
--     Airtable bit this project once already on rigid-schema surprises
--     (typecast-on-write for new select values); enums have the same
--     failure mode.

create extension if not exists pgcrypto; -- for gen_random_uuid()

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  verified boolean not null default false,
  health_score integer,
  health_score_band text,
  health_score_answers jsonb,
  health_score_completed_at timestamptz,
  last_verified_at timestamptz,
  source text,
  plan text not null default 'free',
  net_worth_result jsonb,
  net_worth_submitted_at timestamptz,
  budget_result jsonb,
  budget_submitted_at timestamptz,
  retirement_result jsonb,
  retirement_submitted_at timestamptz,
  investment_result jsonb,
  investment_submitted_at timestamptz,
  created_at timestamptz not null default now()
);
create unique index if not exists users_email_key on users (email);
alter table users enable row level security;

create table if not exists verification_tokens (
  id uuid primary key default gen_random_uuid(),
  token text not null,
  email text not null,
  purpose text not null, -- 'signup_verification' | 'returning_login'
  expires_at timestamptz not null,
  used_at timestamptz,
  request_ip text,
  pending_health_score integer,
  pending_answers jsonb,
  created_at timestamptz not null default now()
);
create unique index if not exists verification_tokens_token_key on verification_tokens (token);
create index if not exists verification_tokens_email_idx on verification_tokens (email);
create index if not exists verification_tokens_ip_created_idx on verification_tokens (request_ip, created_at);
alter table verification_tokens enable row level security;

create table if not exists advisor_review_requests (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  situational_details jsonb,
  details text,
  location text,
  requested_at timestamptz not null default now(),
  request_ip text,
  status text not null default 'Requested', -- kept Title Case: matches the
    -- values the team already reads/edits by hand (Requested / Matched /
    -- Meeting Taken) — no reason to make them relearn a vocabulary change.
  shared_scores jsonb
);
create index if not exists advisor_review_requests_email_idx on advisor_review_requests (email);
create index if not exists advisor_review_requests_ip_requested_idx on advisor_review_requests (request_ip, requested_at);
alter table advisor_review_requests enable row level security;

create table if not exists deletion_requests (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  requested_at timestamptz not null default now(),
  status text not null default 'Pending',
  request_ip text
);
create index if not exists deletion_requests_email_idx on deletion_requests (email);
create index if not exists deletion_requests_ip_requested_idx on deletion_requests (request_ip, requested_at);
alter table deletion_requests enable row level security;
