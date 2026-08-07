-- SITE_STRATEGY.md item 6 (locked 2026-08-08): a separate "Advisor
-- Application Form" path for advisors without an access code. Submissions
-- through that path land as pending-review, not auto-added to the
-- live/matchable roster, until Ethan approves via the admin dashboard.
-- Defaults to true so every existing row (manually entered, or submitted
-- through the access-code-gated onboarding form, both already vetted via
-- outreach) stays matchable with no behavior change.
alter table advisors add column if not exists approved boolean not null default true;
create index if not exists advisors_approved_idx on advisors (approved);
