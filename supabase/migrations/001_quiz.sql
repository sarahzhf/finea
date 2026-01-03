-- Supabase / Postgres schema for Quiz (MVP)
-- Run in Supabase SQL editor (or as a migration).
-- Notes:
-- - Uses gen_random_uuid() (pgcrypto). Enable if needed: create extension if not exists "pgcrypto";

create extension if not exists "pgcrypto";

-- Questions (seeded from Quizz.xlsx)
create table if not exists public.quiz_questions (
  id uuid primary key default gen_random_uuid(),
  source_id text unique,                         -- e.g. "Q1" from your Excel "id" column
  theme text not null,
  difficulty_level int not null check (difficulty_level between 1 and 5),
  question_text text not null,
  explanation text,
  tags text[] default '{}'::text[],
  active boolean not null default true,

  answer_a text not null,
  answer_b text not null,
  answer_c text not null,
  answer_d text not null,
  correct_answer char(1) not null check (correct_answer in ('A','B','C','D')),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists quiz_questions_theme_idx on public.quiz_questions(theme);
create index if not exists quiz_questions_active_idx on public.quiz_questions(active);

-- A quiz "run"/session (anonymous-friendly)
create table if not exists public.quiz_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid null,                             -- if you later add auth
  client_id text null,                           -- anonymous identifier stored in cookie/localStorage
  mode text not null default 'standard',          -- 'standard' | 'adaptive' etc (placeholder)
  theme_filter text null,                         -- optional: restrict a theme
  total_questions int not null default 10,
  current_index int not null default 0,
  score int not null default 0,
  finished boolean not null default false,
  started_at timestamptz not null default now(),
  finished_at timestamptz null
);

create index if not exists quiz_sessions_user_idx on public.quiz_sessions(user_id);
create index if not exists quiz_sessions_client_idx on public.quiz_sessions(client_id);

-- Ordered list of questions inside a session
create table if not exists public.quiz_session_questions (
  session_id uuid references public.quiz_sessions(id) on delete cascade,
  question_id uuid references public.quiz_questions(id) on delete restrict,
  position int not null,
  primary key (session_id, position)
);

create index if not exists quiz_session_questions_session_idx on public.quiz_session_questions(session_id);

-- Answers given by the user
create table if not exists public.quiz_answers (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.quiz_sessions(id) on delete cascade,
  question_id uuid not null references public.quiz_questions(id) on delete restrict,
  position int not null,
  selected_answer char(1) not null check (selected_answer in ('A','B','C','D')),
  is_correct boolean not null,
  answered_at timestamptz not null default now()
);

create index if not exists quiz_answers_session_idx on public.quiz_answers(session_id);

-- Convenience view: session summary
create or replace view public.quiz_session_summary as
select
  s.*,
  (select count(*) from public.quiz_answers a where a.session_id = s.id) as answers_count
from public.quiz_sessions s;

-- RLS: for MVP you can disable RLS or use anon+client_id checks.
-- This is a minimal "client_id can read/write its sessions" policy.
alter table public.quiz_sessions enable row level security;
alter table public.quiz_session_questions enable row level security;
alter table public.quiz_answers enable row level security;
alter table public.quiz_questions enable row level security;

-- Questions: readable by everyone, writable only by service role (via API)
drop policy if exists "quiz_questions_read_all" on public.quiz_questions;
create policy "quiz_questions_read_all"
on public.quiz_questions for select
to anon, authenticated
using (active = true);

-- Sessions: owner by client_id (anonymous) OR user_id (authenticated)
drop policy if exists "quiz_sessions_owner_select" on public.quiz_sessions;
create policy "quiz_sessions_owner_select"
on public.quiz_sessions for select
to anon, authenticated
using (
  (auth.uid() is not null and user_id = auth.uid())
  OR
  (auth.uid() is null and client_id = current_setting('request.jwt.claims', true)::json->>'client_id')
);

drop policy if exists "quiz_sessions_owner_insert" on public.quiz_sessions;
create policy "quiz_sessions_owner_insert"
on public.quiz_sessions for insert
to anon, authenticated
with check (true);

drop policy if exists "quiz_sessions_owner_update" on public.quiz_sessions;
create policy "quiz_sessions_owner_update"
on public.quiz_sessions for update
to anon, authenticated
using (true)
with check (true);

-- Session questions / answers: same idea (kept permissive for MVP; tighten later)
drop policy if exists "quiz_session_questions_owner_all" on public.quiz_session_questions;
create policy "quiz_session_questions_owner_all"
on public.quiz_session_questions for all
to anon, authenticated
using (true)
with check (true);

drop policy if exists "quiz_answers_owner_all" on public.quiz_answers;
create policy "quiz_answers_owner_all"
on public.quiz_answers for all
to anon, authenticated
using (true)
with check (true);
