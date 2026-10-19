-- Jaxon's Maths Adventure: private cloud progress storage, v1
-- Run once in Supabase SQL Editor.
-- Progress is readable and writable only by the signed-in account that owns it.
create table if not exists public.learning_progress (
  user_id uuid primary key references auth.users(id) on delete cascade,
  game_state jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  constraint learning_progress_state_object check (jsonb_typeof(game_state) = 'object')
);
alter table public.learning_progress enable row level security;
revoke all on public.learning_progress from anon;
grant select, insert, update on public.learning_progress to authenticated;
drop policy if exists "read own progress" on public.learning_progress;
create policy "read own progress" on public.learning_progress
for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "insert own progress" on public.learning_progress;
create policy "insert own progress" on public.learning_progress
for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "update own progress" on public.learning_progress;
create policy "update own progress" on public.learning_progress
for update to authenticated using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
