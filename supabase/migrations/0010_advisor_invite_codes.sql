-- Replaces the single shared ADVISOR_ACCESS_CODE env var with unique,
-- single-use, admin-generated codes (round-35 ask). label is optional
-- free text so Ethan can note who a code was meant for; used_by_email is
-- populated by the advisor's own onboarding submission once the code is
-- consumed, giving a direct trace from code to the resulting roster row
-- without a foreign key (advisors rows aren't created until submission,
-- after the code is already consumed).
create table if not exists advisor_invite_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  label text,
  created_at timestamptz not null default now(),
  used_at timestamptz,
  used_by_email text,
  is_test boolean not null default false
);
create index if not exists advisor_invite_codes_code_idx on advisor_invite_codes (code);
alter table advisor_invite_codes enable row level security;
