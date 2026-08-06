-- Round 3 additions: single reusable advisor-onboarding page (replaces
-- the per-advisor invite-link system from migration 0006 — advisor_invites
-- is no longer written to by the app; left in place rather than dropped,
-- harmless unused table) plus an is_test flag so QA/dev rows can be
-- excluded from dashboard KPIs and ranked-shortlist matching. Not yet
-- applied — run this in Supabase's SQL Editor, same as 0001-0006. Safe
-- to re-run (IF NOT EXISTS everywhere).
--
-- advisors.is_test mirrors the same flag migration 0002 already put on
-- users/verification_tokens/advisor_review_requests/deletion_requests —
-- advisors just didn't exist as a table yet when that migration ran
-- (it was added in 0005). advisor_review_requests.is_test is restated
-- here too (IF NOT EXISTS, no-op if 0002 already added it) purely so
-- this file is self-contained evidence of what "leads" excludes.
--
-- advisors.request_ip supports the same IP-cooldown pattern every other
-- public-write endpoint already uses (submit-diagnostic.mjs,
-- request-advisor-review.mjs) — submit-advisor-onboarding.mjs is now a
-- fully public, unauthenticated write now that the invite-token gate is
-- gone, so it needs the same real protection those already have.

alter table advisors add column if not exists is_test boolean not null default false;
alter table advisors add column if not exists request_ip text;
create index if not exists advisors_is_test_idx on advisors (is_test);

alter table advisor_review_requests add column if not exists is_test boolean not null default false;

-- Advanced (MoneyMatters+) Budget and Investment tools never got the
-- same save-to-dashboard treatment the 4 basic tools have had since
-- §28.2 — same shape as those columns (net_worth_result / _submitted_at
-- etc. in 0001_init.sql), just prefixed adv_ since "budget_result" is
-- already taken by the basic tool.
alter table users add column if not exists adv_budget_result jsonb;
alter table users add column if not exists adv_budget_submitted_at timestamptz;
alter table users add column if not exists adv_investment_result jsonb;
alter table users add column if not exists adv_investment_submitted_at timestamptz;
