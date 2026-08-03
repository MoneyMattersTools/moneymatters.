-- Stripe subscription integration (MoneyMatters+, $5/month, test mode).
-- Not yet applied — run this in Supabase's SQL Editor, same as 0001-0003.
-- Safe to re-run (IF NOT EXISTS everywhere).
--
-- plan_source distinguishes how a user got plan='plus':
--   - 'stripe'  — an actual paid subscription; only these rows are ever
--                 auto-downgraded back to 'free' by the Stripe webhook.
--   - null      — every existing row today, and every future manual grant
--                 via the Section 42 free-Plus-incentive flag (Table
--                 Editor). Defaulting to null (not 'manual') means the
--                 webhook's safety check — only touch rows where
--                 plan_source = 'stripe' — protects every current and
--                 future manually-flagged user automatically, with no
--                 extra step required at grant time.
--
-- stripe_customer_id is how the webhook finds the right user row per
-- event; stripe_subscription_id records which specific subscription is
-- the reason a 'stripe' row currently has plan='plus', so a downgrade
-- event only ever un-grants a user if it's for the subscription actually
-- responsible for their access.

alter table users add column if not exists stripe_customer_id text;
alter table users add column if not exists stripe_subscription_id text;
alter table users add column if not exists plan_source text;
create index if not exists users_stripe_customer_id_idx on users (stripe_customer_id);
