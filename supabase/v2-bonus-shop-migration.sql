-- Jaxon's Maths Adventure V2: OPTIONAL bonus-coin avatar store migration.
-- NOT EXECUTED. Requires public.maths_families and public.maths_rewards
-- from the previously installed V2 family schema.
-- This covers PARENT-AWARDED coins only. It does not validate client-measured
-- learner activity coins or enable their secure spending.
-- Review in Supabase SQL Editor before execution. No learner progress is reset.
begin;

alter table public.maths_rewards
  add column if not exists bonus_spent integer not null default 0;

do $constraint$
begin
  if not exists (
    select 1 from pg_constraint
    where conname='maths_rewards_valid_bonus_spend'
      and conrelid='public.maths_rewards'::regclass
  ) then
    alter table public.maths_rewards
      add constraint maths_rewards_valid_bonus_spend
      check (bonus_spent>=0 and bonus_spent<=bonus_coins);
  end if;
end
$constraint$;

create table if not exists public.maths_avatar_catalog (
  item_id text primary key,
  cost integer not null check(cost>0),
  active boolean not null default true
);
insert into public.maths_avatar_catalog(item_id,cost) values
  ('helmet',100),
  ('cap',45),
  ('crown',450),
  ('wizardhat',240),
  ('hardhat',110),
  ('headphones',160),
  ('tophat',180),
  ('jacket',150),
  ('hoodie',90),
  ('armour',420),
  ('suit',220),
  ('cape',300),
  ('spacesuit',520),
  ('ninja',330),
  ('wings',250),
  ('jetpack',550),
  ('rucksack',100),
  ('shield',230),
  ('parachute',210),
  ('dragon',650),
  ('glasses',70),
  ('medal',120),
  ('watch',100),
  ('scarf',85),
  ('gloves',75),
  ('sword',190),
  ('wand',210),
  ('fox',320),
  ('dog',280),
  ('cat',230),
  ('frog',180),
  ('robot',450),
  ('axolotl',380),
  ('bee',160),
  ('forestbg',140),
  ('desertbg',160),
  ('spacebg',310),
  ('castlebg',230),
  ('mountainbg',240),
  ('neonbg',350)
on conflict (item_id) do update
  set cost=excluded.cost,active=true;

create table if not exists public.maths_avatar_purchases (
  id bigint generated always as identity primary key,
  child_user_id uuid not null references auth.users(id) on delete cascade,
  item_id text not null references public.maths_avatar_catalog(item_id),
  cost integer not null check(cost>0),
  request_id uuid not null unique,
  purchased_at timestamptz not null default now(),
  constraint maths_avatar_one_purchase_per_item unique(child_user_id,item_id)
);

alter table public.maths_avatar_catalog enable row level security;
alter table public.maths_avatar_purchases enable row level security;
revoke all on public.maths_avatar_catalog,public.maths_avatar_purchases
  from public,anon,authenticated;
grant select on public.maths_avatar_catalog,public.maths_avatar_purchases
  to authenticated;

drop policy if exists "authenticated can view avatar prices"
  on public.maths_avatar_catalog;
create policy "authenticated can view avatar prices"
  on public.maths_avatar_catalog for select to authenticated
  using (true);

drop policy if exists "family can view avatar purchases"
  on public.maths_avatar_purchases;
create policy "family can view avatar purchases"
  on public.maths_avatar_purchases for select to authenticated
  using (
    child_user_id=(select auth.uid()) or exists(
      select 1 from public.maths_families f
      where f.child_user_id=maths_avatar_purchases.child_user_id
        and f.parent_user_id=(select auth.uid())
    )
  );

-- Ledger is write-only through this learner-specific SECURITY DEFINER RPC.
-- It serializes purchases by locking the child's maths_rewards row,
-- verifies prices server-side, and makes request IDs retry-safe.
create or replace function public.learner_buy_maths_avatar_bonus(
  p_item_id text, p_request_id uuid
) returns public.maths_rewards
language plpgsql security definer set search_path=''
as $purchase$
declare
  v_child uuid:=auth.uid();
  v_price integer;
  v_reward public.maths_rewards;
  v_old public.maths_avatar_purchases;
begin
  if v_child is null or p_request_id is null or p_item_id is null
    or length(p_item_id)>100 or btrim(p_item_id)=''
  then raise exception 'Invalid avatar purchase request'; end if;
  if not exists(select 1 from public.maths_families
                where child_user_id=v_child)
  then raise exception 'Linked learner account required'; end if;
  select cost into v_price from public.maths_avatar_catalog
    where item_id=p_item_id and active=true;
  if v_price is null then raise exception 'Item unavailable'; end if;

  insert into public.maths_rewards(child_user_id) values (v_child)
    on conflict(child_user_id) do nothing;
  select * into v_reward from public.maths_rewards
    where child_user_id=v_child for update;

  select * into v_old from public.maths_avatar_purchases
    where request_id=p_request_id;
  if found then
    if v_old.child_user_id<>v_child or v_old.item_id<>p_item_id
    then raise exception 'Request ID already used for another item'; end if;
    return v_reward;
  end if;
  if exists(select 1 from public.maths_avatar_purchases
            where child_user_id=v_child and item_id=p_item_id)
  then raise exception 'Item already owned'; end if;
  if v_reward.bonus_coins-v_reward.bonus_spent<v_price
  then raise exception 'Not enough parent-awarded bonus coins'; end if;

  update public.maths_rewards
    set bonus_spent=bonus_spent+v_price,updated_at=now()
    where child_user_id=v_child returning * into v_reward;
  insert into public.maths_avatar_purchases(
    child_user_id,item_id,cost,request_id
  ) values(v_child,p_item_id,v_price,p_request_id);
  return v_reward;
end
$purchase$;

revoke execute on function public.learner_buy_maths_avatar_bonus(text,uuid)
  from public,anon;
grant execute on function public.learner_buy_maths_avatar_bonus(text,uuid)
  to authenticated;
commit;
