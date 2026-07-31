-- DESIGN_SPEC.md §38.9 — post-quiz/tool review pop-up (1-5 stars + optional
-- comment, shown once per tool per visitor after they complete it). Not yet
-- applied — run this in Supabase's SQL Editor, same as 0001/0002. Safe to
-- re-run (IF NOT EXISTS everywhere). The feature's frontend/backend code is
-- already shipped and will simply 500 on submit until this table exists.
--
-- Anonymous by design: rating a tool doesn't require an account the way
-- saving a result does (§28.2) — email is nullable, filled in only when a
-- session cookie happens to be present at submit time.

create table if not exists tool_feedback (
  id uuid primary key default gen_random_uuid(),
  tool text not null, -- 'diagnostic' | 'networth' | 'budget' | 'retirement' | 'investment'
  rating integer not null check (rating between 1 and 5),
  comment text,
  email text,
  submitted_at timestamptz not null default now(),
  request_ip text
);
create index if not exists tool_feedback_tool_idx on tool_feedback (tool);
create index if not exists tool_feedback_ip_submitted_idx on tool_feedback (request_ip, submitted_at);
alter table tool_feedback enable row level security;
