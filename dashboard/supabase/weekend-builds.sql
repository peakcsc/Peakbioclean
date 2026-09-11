-- Peak Bio-Clean — Weekend Builds schema
-- Run this ONCE in the Supabase SQL editor for project zzjcimwqttlqrcjiuffm.
-- Adds three tables that power the Morning Briefing, Second Brain, Job History
-- and Review Agent tabs in /dashboard. Safe to re-run (uses IF NOT EXISTS).
--
-- Access model matches the rest of this dashboard: no auth gate, RLS open to
-- the anon/publishable key. If you later add real sign-in, tighten these
-- policies to auth.uid() checks instead.

create extension if not exists pg_trgm;

-- ---------- Second Brain ----------
create table if not exists brain_docs (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null default 'Other',
  content text not null,
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists brain_docs_search_idx
  on brain_docs using gin ((title || ' ' || content) gin_trgm_ops);

alter table brain_docs enable row level security;
drop policy if exists brain_docs_anon_all on brain_docs;
create policy brain_docs_anon_all on brain_docs
  for all to anon using (true) with check (true);

-- ---------- Content log (brand kit cadence + briefing) ----------
create table if not exists content_log (
  id uuid primary key default gen_random_uuid(),
  platform text not null default 'Instagram',
  post_url text,
  caption text,
  hashtags text[] not null default '{}',
  status text not null default 'posted',
  likes integer,
  comments integer,
  posted_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

alter table content_log enable row level security;
drop policy if exists content_log_anon_all on content_log;
create policy content_log_anon_all on content_log
  for all to anon using (true) with check (true);

-- ---------- Nightly review agent output ----------
create table if not exists daily_review_log (
  id uuid primary key default gen_random_uuid(),
  review_date date not null default current_date,
  summary text,
  shipped jsonb not null default '[]',
  slipped jsonb not null default '[]',
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

alter table daily_review_log enable row level security;
drop policy if exists daily_review_log_anon_all on daily_review_log;
create policy daily_review_log_anon_all on daily_review_log
  for all to anon using (true) with check (true);

create unique index if not exists daily_review_log_one_per_day
  on daily_review_log (review_date);

-- ---------- 30-day plan progress ----------
-- One row per task, created the first time you touch it. A task with no row is
-- simply open on its natural plan date. due_day is what moves when you push a
-- task to tomorrow; anything open whose due_day has arrived or passed shows up
-- on today's list and in the 7am email, so nothing silently disappears.
create table if not exists plan_progress (
  id uuid primary key default gen_random_uuid(),
  plan_day integer not null,
  task_index integer not null,
  title text,
  status text not null default 'open',
  due_day date not null,
  completed_at timestamptz,
  updated_at timestamptz not null default now()
);

create unique index if not exists plan_progress_task
  on plan_progress (plan_day, task_index);

alter table plan_progress enable row level security;
drop policy if exists plan_progress_anon_all on plan_progress;
create policy plan_progress_anon_all on plan_progress
  for all to anon using (true) with check (true);
