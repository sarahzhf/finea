-- Add adaptive/ML fields for online ability estimation
-- Date: 2025-12-30

alter table public.quiz_sessions
  add column if not exists theta_overall double precision not null default 0,
  add column if not exists theme_theta jsonb not null default '{}'::jsonb;

-- Optional index to speed theme-filtered selection of active questions
create index if not exists quiz_questions_theme_active_idx
  on public.quiz_questions (theme)
  where active = true;
