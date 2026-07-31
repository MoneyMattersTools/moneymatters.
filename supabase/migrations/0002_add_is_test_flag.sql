-- Optional, not yet applied — run this in Supabase's SQL Editor whenever
-- you want a real, queryable test-data flag instead of relying on the
-- naming convention alone (see DESIGN_SPEC.md §37 item 4 / memory:
-- test_data_convention.md). Safe to re-run (IF NOT EXISTS everywhere).
--
-- Once applied, any future cleanup round becomes a trivial query instead
-- of manually reading every row's email pattern:
--   DELETE FROM users WHERE is_test = true AND email <> 'mm-qa-persistent@web-library.net';
-- (and the same WHERE clause against advisor_review_requests /
-- deletion_requests / verification_tokens).

alter table users add column if not exists is_test boolean not null default false;
alter table verification_tokens add column if not exists is_test boolean not null default false;
alter table advisor_review_requests add column if not exists is_test boolean not null default false;
alter table deletion_requests add column if not exists is_test boolean not null default false;

create index if not exists users_is_test_idx on users (is_test);
