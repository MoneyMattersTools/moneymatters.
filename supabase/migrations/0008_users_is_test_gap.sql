-- Gap found while backfilling is_test on the QA account (Round 4,
-- 2026-08-06): migration 0002_add_is_test_flag.sql was written to add
-- is_test to users/verification_tokens/advisor_review_requests/
-- deletion_requests, but a live PostgREST check just now confirmed
-- users.is_test genuinely doesn't exist — that migration was never
-- actually run against this database, or ran partially (0007 already
-- separately confirmed advisor_review_requests.is_test DOES exist, so
-- it wasn't a clean total skip). Restating all four of 0002's columns
-- here (IF NOT EXISTS, harmless no-ops for whichever already landed)
-- rather than assuming the other two are fine just because they're
-- currently unused — cheaper to confirm now than get surprised by this
-- same gap again later. Not yet applied — run this in Supabase's SQL
-- Editor, same as every migration before it.

alter table users add column if not exists is_test boolean not null default false;
alter table verification_tokens add column if not exists is_test boolean not null default false;
alter table advisor_review_requests add column if not exists is_test boolean not null default false;
alter table deletion_requests add column if not exists is_test boolean not null default false;
create index if not exists users_is_test_idx on users (is_test);
