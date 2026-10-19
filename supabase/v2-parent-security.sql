-- V2.1 parent/learner separation - DEVELOPMENT MIGRATION, NOT YET LIVE
-- Do not execute until two distinct Supabase Auth accounts exist.
-- Designed to preserve the original public.learning_progress table unchanged.
begin;
create table if not exists public.maths_families (
  id uuid primary key default gen_random_uuid(),
  parent_user_id uuid not null unique references auth.users(id) on delete cascade,
  child_user_id uuid not null unique references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint distinct_parent_child check (parent_user_id <> child_user_id)
);
create table if not exists public.maths_learning (
  child_user_id uuid primary key references auth.users(id) on delete cascade,
  progress jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  constraint progress_is_object check (jsonb_typeof(progress)='object')
);
create table if not exists public.maths_rewards (
  child_user_id uuid primary key references auth.users(id) on delete cascade,
  bonus_coins integer not null default 0 check (bonus_coins >= 0),
  redeemed_minutes integer not null default 0 check (redeemed_minutes >= 0),
  updated_at timestamptz not null default now()
);
create table if not exists public.maths_reward_events (
  id bigint generated always as identity primary key,
  child_user_id uuid not null references auth.users(id) on delete cascade,
  parent_user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check(kind in ('bonus_coins','redeem_minutes')),
  amount integer not null check(amount > 0 and amount <= 60),
  created_at timestamptz not null default now()
);
alter table public.maths_families enable row level security;
alter table public.maths_learning enable row level security;
alter table public.maths_rewards enable row level security;
alter table public.maths_reward_events enable row level security;
revoke all on public.maths_families,public.maths_learning,public.maths_rewards,public.maths_reward_events from anon,authenticated;
grant select on public.maths_families to authenticated;
grant select,insert,update on public.maths_learning to authenticated;
grant select on public.maths_rewards,public.maths_reward_events to authenticated;
drop policy if exists "family users can read family" on public.maths_families;
create policy "family users can read family" on public.maths_families for select to authenticated using ((select auth.uid()) in (parent_user_id,child_user_id));
drop policy if exists "family can see learning" on public.maths_learning;
create policy "family can see learning" on public.maths_learning for select to authenticated
using (child_user_id=(select auth.uid()) or exists(select 1 from public.maths_families f where f.child_user_id=maths_learning.child_user_id and f.parent_user_id=(select auth.uid())));
drop policy if exists "child writes learning" on public.maths_learning;
create policy "child writes learning" on public.maths_learning for insert to authenticated with check (child_user_id=(select auth.uid()));
drop policy if exists "child updates learning" on public.maths_learning;
create policy "child updates learning" on public.maths_learning for update to authenticated
using (child_user_id=(select auth.uid())) with check (child_user_id=(select auth.uid()));
drop policy if exists "family reads rewards" on public.maths_rewards;
create policy "family reads rewards" on public.maths_rewards for select to authenticated
using(child_user_id=(select auth.uid()) or exists(select 1 from public.maths_families f where f.child_user_id=maths_rewards.child_user_id and f.parent_user_id=(select auth.uid())));
drop policy if exists "parent reads reward events" on public.maths_reward_events;
create policy "parent reads reward events" on public.maths_reward_events for select to authenticated
using(exists(select 1 from public.maths_families f where f.child_user_id=maths_reward_events.child_user_id and f.parent_user_id=(select auth.uid())));
-- Parent-only RPC: direct writes to rewards and event ledger are denied.
create or replace function public.parent_award_maths(p_child uuid,p_kind text,p_amount integer)
returns public.maths_rewards
language plpgsql security definer set search_path = ''
as $$
declare v_parent uuid:=auth.uid(); v_row public.maths_rewards;
begin
  if v_parent is null or p_amount is null or p_amount <= 0 or p_amount > 60 or p_kind not in ('bonus_coins','redeem_minutes') then
    raise exception 'Invalid reward request';
  end if;
  if not exists(select 1 from public.maths_families where parent_user_id=v_parent and child_user_id=p_child) then
    raise exception 'Parent permission required';
  end if;
  insert into public.maths_rewards(child_user_id) values (p_child) on conflict (child_user_id) do nothing;
  if p_kind='bonus_coins' then
    update public.maths_rewards set bonus_coins=bonus_coins+p_amount,updated_at=now() where child_user_id=p_child returning * into v_row;
  else
    update public.maths_rewards set redeemed_minutes=redeemed_minutes+p_amount,updated_at=now() where child_user_id=p_child returning * into v_row;
  end if;
  insert into public.maths_reward_events(child_user_id,parent_user_id,kind,amount) values (p_child,v_parent,p_kind,p_amount);
  return v_row;
end $$;
revoke execute on function public.parent_award_maths(uuid,text,integer) from public,anon;
grant execute on function public.parent_award_maths(uuid,text,integer) to authenticated;
commit;
