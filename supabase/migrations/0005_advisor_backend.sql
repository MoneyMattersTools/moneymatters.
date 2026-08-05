-- Advisor Connect backend MVP (SITE_STRATEGY.md "MVP build order", locked
-- 2026-08-04). Not yet applied - run this in Supabase's SQL Editor, same
-- as 0001-0004. Safe to re-run (IF NOT EXISTS everywhere).
--
-- Four pieces:
--   1. advisors - the roster, manually entered by Ethan via the admin page.
--   2. advisor_review_requests.urgency - the one new intake field the
--      lead-value design calls for (see SITE_STRATEGY.md "What makes a
--      lead valuable to an advisor", signal #2).
--   3. advisor_lead_deliveries - one row per "this lead was offered to
--      this advisor". Carries its own accept_token (same crypto.randomBytes
--      pattern as verification_tokens, not the same table - this is a
--      structurally different single-use token: no email/pending_answers
--      shape, just an assignment + expiry + accept state) and expires_at,
--      which is what the 48-72hr timeout is computed against - on read,
--      not via a background job, per the "just functional, not full spec"
--      MVP sequencing note.
--   4. advisor_consent_log - the audit trail. Written at the moment a lead
--      is actually delivered to an advisor (that's the real "share" event),
--      not at intake - captures exactly what was in the snapshot and what
--      the user had consented to at that moment.

create table if not exists advisors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  firm text,
  licensed_states jsonb not null default '[]'::jsonb, -- array of state codes, e.g. ["PA","NJ"]
  specialty_tags jsonb not null default '[]'::jsonb, -- values from the same taxonomy as
    -- advisor_review_requests.situational_details (see netlify/functions/lib/specialties.js) -
    -- one shared list both sides map to, not free text on one side and
    -- structured tags on the other.
  contact_email text not null,
  accepting boolean not null default true, -- the "capacity flag" from the spec
  scheduling_link text, -- advisor's own Calendly-equivalent; no in-house scheduling for MVP
  created_at timestamptz not null default now()
);
create index if not exists advisors_accepting_idx on advisors (accepting);
alter table advisors enable row level security;

alter table advisor_review_requests add column if not exists urgency text;
-- 'now' | 'next_few_months' | 'just_exploring' - see netlify/functions/lib/specialties.js

create table if not exists advisor_lead_deliveries (
  id uuid primary key default gen_random_uuid(),
  advisor_review_request_id uuid not null,
  advisor_id uuid not null,
  accept_token text not null,
  snapshot_text text not null, -- a frozen copy of what was shared, so the public
    -- accept-confirm page (looked up by token alone, no admin auth) is a
    -- single-table read instead of joining back through review_requests
  status text not null default 'pending', -- 'pending' | 'accepted'
  assigned_at timestamptz not null default now(),
  accepted_at timestamptz,
  expires_at timestamptz not null -- assigned_at + 60h; a delivery past this with
    -- status still 'pending' reads as "timed out" in the admin queue - no
    -- separate mutation needed, the timestamp itself is the source of truth
);
create unique index if not exists advisor_lead_deliveries_token_key on advisor_lead_deliveries (accept_token);
create index if not exists advisor_lead_deliveries_request_idx on advisor_lead_deliveries (advisor_review_request_id);
create index if not exists advisor_lead_deliveries_status_idx on advisor_lead_deliveries (status);
alter table advisor_lead_deliveries enable row level security;

create table if not exists advisor_consent_log (
  id uuid primary key default gen_random_uuid(),
  advisor_review_request_id uuid not null,
  advisor_id uuid not null,
  shared_snapshot jsonb not null, -- the actual narrative line + fields sent to the advisor
  consent_state jsonb not null, -- shareScores/netWorthRange/situational as they stood at share time
  shared_at timestamptz not null default now()
);
create index if not exists advisor_consent_log_request_idx on advisor_consent_log (advisor_review_request_id);
alter table advisor_consent_log enable row level security;
