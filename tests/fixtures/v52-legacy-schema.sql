-- Fictional-data rehearsal fixture reconstructed from supplied public schema metadata.
-- No user rows/identities/credentials. The production partial-index predicate is NOT assumed.
create table public.learning_progress (user_id uuid not null,
game_state jsonb default '{}'::jsonb not null,
updated_at timestamp with time zone default now() not null);
create table public.maths_families (id uuid default gen_random_uuid() not null,
parent_user_id uuid not null,
child_user_id uuid not null,
created_at timestamp with time zone default now() not null);
create table public.maths_learning (child_user_id uuid not null,
progress jsonb default '{}'::jsonb not null,
updated_at timestamp with time zone default now() not null);
create table public.maths_reward_events (id bigint generated always as identity not null,
child_user_id uuid not null,
parent_user_id uuid not null,
kind text not null,
amount integer not null,
created_at timestamp with time zone default now() not null,
request_id uuid);
create table public.maths_rewards (child_user_id uuid not null,
bonus_coins integer default 0 not null,
redeemed_minutes integer default 0 not null,
updated_at timestamp with time zone default now() not null);
alter table public.maths_families add constraint distinct_parent_child CHECK ((parent_user_id <> child_user_id));
alter table public.learning_progress add constraint learning_progress_pkey PRIMARY KEY (user_id);
alter table public.learning_progress add constraint learning_progress_state_object CHECK ((jsonb_typeof(game_state) = 'object'::text));
alter table public.learning_progress add constraint learning_progress_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
alter table public.maths_families add constraint maths_families_child_user_id_fkey FOREIGN KEY (child_user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
alter table public.maths_families add constraint maths_families_child_user_id_key UNIQUE (child_user_id);
alter table public.maths_families add constraint maths_families_parent_user_id_fkey FOREIGN KEY (parent_user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
alter table public.maths_families add constraint maths_families_parent_user_id_key UNIQUE (parent_user_id);
alter table public.maths_families add constraint maths_families_pkey PRIMARY KEY (id);
alter table public.maths_learning add constraint maths_learning_child_user_id_fkey FOREIGN KEY (child_user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
alter table public.maths_learning add constraint maths_learning_pkey PRIMARY KEY (child_user_id);
alter table public.maths_reward_events add constraint maths_reward_events_amount_check CHECK (((amount > 0) AND (amount <= 60)));
alter table public.maths_reward_events add constraint maths_reward_events_child_user_id_fkey FOREIGN KEY (child_user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
alter table public.maths_reward_events add constraint maths_reward_events_kind_check CHECK ((kind = ANY (ARRAY['bonus_coins'::text, 'redeem_minutes'::text])));
alter table public.maths_reward_events add constraint maths_reward_events_parent_user_id_fkey FOREIGN KEY (parent_user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
alter table public.maths_reward_events add constraint maths_reward_events_pkey PRIMARY KEY (id);
alter table public.maths_rewards add constraint maths_rewards_bonus_coins_check CHECK ((bonus_coins >= 0));
alter table public.maths_rewards add constraint maths_rewards_child_user_id_fkey FOREIGN KEY (child_user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
alter table public.maths_rewards add constraint maths_rewards_pkey PRIMARY KEY (child_user_id);
alter table public.maths_rewards add constraint maths_rewards_redeemed_minutes_check CHECK ((redeemed_minutes >= 0));
alter table public.maths_learning add constraint progress_is_object CHECK ((jsonb_typeof(progress) = 'object'::text));
alter table public.learning_progress enable row level security;
alter table public.maths_families enable row level security;
alter table public.maths_learning enable row level security;
alter table public.maths_reward_events enable row level security;
alter table public.maths_rewards enable row level security;
create policy "insert own progress" on public.learning_progress for INSERT to authenticated with check ((( SELECT auth.uid() AS uid) = user_id));
create policy "read own progress" on public.learning_progress for SELECT to authenticated using ((( SELECT auth.uid() AS uid) = user_id));
create policy "update own progress" on public.learning_progress for UPDATE to authenticated using ((( SELECT auth.uid() AS uid) = user_id)) with check ((( SELECT auth.uid() AS uid) = user_id));
create policy "family users can read family" on public.maths_families for SELECT to authenticated using (((( SELECT auth.uid() AS uid) = parent_user_id) OR (( SELECT auth.uid() AS uid) = child_user_id)));
create policy "child updates learning" on public.maths_learning for UPDATE to authenticated using ((child_user_id = ( SELECT auth.uid() AS uid))) with check ((child_user_id = ( SELECT auth.uid() AS uid)));
create policy "child writes learning" on public.maths_learning for INSERT to authenticated with check ((child_user_id = ( SELECT auth.uid() AS uid)));
create policy "family can see learning" on public.maths_learning for SELECT to authenticated using (((child_user_id = ( SELECT auth.uid() AS uid)) OR (EXISTS ( SELECT 1
   FROM maths_families f
  WHERE ((f.child_user_id = maths_learning.child_user_id) AND (f.parent_user_id = ( SELECT auth.uid() AS uid)))))));
create policy "parent reads reward events" on public.maths_reward_events for SELECT to authenticated using ((EXISTS ( SELECT 1
   FROM maths_families f
  WHERE ((f.child_user_id = maths_reward_events.child_user_id) AND (f.parent_user_id = ( SELECT auth.uid() AS uid))))));
create policy "family reads rewards" on public.maths_rewards for SELECT to authenticated using (((child_user_id = ( SELECT auth.uid() AS uid)) OR (EXISTS ( SELECT 1
   FROM maths_families f
  WHERE ((f.child_user_id = maths_rewards.child_user_id) AND (f.parent_user_id = ( SELECT auth.uid() AS uid)))))));
CREATE OR REPLACE FUNCTION public.parent_award_maths(p_child uuid, p_kind text, p_amount integer)
 RETURNS maths_rewards
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
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
end $function$
;
CREATE OR REPLACE FUNCTION public.parent_award_maths_once(p_child uuid, p_kind text, p_amount integer, p_request_id uuid)
 RETURNS maths_rewards
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_parent uuid:=auth.uid(); v_row public.maths_rewards; v_existing public.maths_reward_events;
begin
  if v_parent is null or p_request_id is null or p_amount is null
    or p_amount<=0 or p_amount>60 or p_kind not in ('bonus_coins','redeem_minutes')
  then raise exception 'Invalid reward request'; end if;
  if not exists(select 1 from public.maths_families
    where parent_user_id=v_parent and child_user_id=p_child)
  then raise exception 'Parent permission required'; end if;
  -- Serialize parent requests by parent ID, so concurrent retries cannot award twice.
  perform pg_advisory_xact_lock(hashtextextended(v_parent::text||p_request_id::text,0));
  select * into v_existing from public.maths_reward_events
    where parent_user_id=v_parent and request_id=p_request_id;
  if found then
    if v_existing.child_user_id<>p_child or v_existing.kind<>p_kind or v_existing.amount<>p_amount
    then raise exception 'Request ID already used for different reward'; end if;
    select * into v_row from public.maths_rewards where child_user_id=p_child;
    return v_row;
  end if;
  insert into public.maths_rewards(child_user_id)
    values(p_child) on conflict(child_user_id) do nothing;
  if p_kind='bonus_coins' then
    update public.maths_rewards set bonus_coins=bonus_coins+p_amount,updated_at=now()
      where child_user_id=p_child returning * into v_row;
  else
    update public.maths_rewards set redeemed_minutes=redeemed_minutes+p_amount,updated_at=now()
      where child_user_id=p_child returning * into v_row;
  end if;
  insert into public.maths_reward_events(child_user_id,parent_user_id,kind,amount,request_id)
    values(p_child,v_parent,p_kind,p_amount,p_request_id);
  return v_row;
end $function$
;
grant REFERENCES on public.learning_progress to authenticated;
grant INSERT on public.learning_progress to authenticated;
grant SELECT on public.learning_progress to authenticated;
grant UPDATE on public.learning_progress to authenticated;
grant DELETE on public.learning_progress to authenticated;
grant TRUNCATE on public.learning_progress to authenticated;
grant TRIGGER on public.learning_progress to authenticated;
grant SELECT on public.maths_families to authenticated;
grant INSERT on public.maths_learning to authenticated;
grant UPDATE on public.maths_learning to authenticated;
grant SELECT on public.maths_learning to authenticated;
grant SELECT on public.maths_reward_events to authenticated;
grant SELECT on public.maths_rewards to authenticated;
grant TRIGGER on public.learning_progress to postgres;
grant INSERT on public.learning_progress to postgres;
grant SELECT on public.learning_progress to postgres;
grant UPDATE on public.learning_progress to postgres;
grant TRUNCATE on public.learning_progress to postgres;
grant DELETE on public.learning_progress to postgres;
grant REFERENCES on public.learning_progress to postgres;
grant REFERENCES on public.maths_families to postgres;
grant INSERT on public.maths_families to postgres;
grant SELECT on public.maths_families to postgres;
grant UPDATE on public.maths_families to postgres;
grant DELETE on public.maths_families to postgres;
grant TRUNCATE on public.maths_families to postgres;
grant TRIGGER on public.maths_families to postgres;
grant TRIGGER on public.maths_learning to postgres;
grant TRUNCATE on public.maths_learning to postgres;
grant DELETE on public.maths_learning to postgres;
grant UPDATE on public.maths_learning to postgres;
grant SELECT on public.maths_learning to postgres;
grant INSERT on public.maths_learning to postgres;
grant REFERENCES on public.maths_learning to postgres;
grant SELECT on public.maths_reward_events to postgres;
grant INSERT on public.maths_reward_events to postgres;
grant UPDATE on public.maths_reward_events to postgres;
grant DELETE on public.maths_reward_events to postgres;
grant TRUNCATE on public.maths_reward_events to postgres;
grant REFERENCES on public.maths_reward_events to postgres;
grant TRIGGER on public.maths_reward_events to postgres;
grant SELECT on public.maths_rewards to postgres;
grant TRIGGER on public.maths_rewards to postgres;
grant REFERENCES on public.maths_rewards to postgres;
grant TRUNCATE on public.maths_rewards to postgres;
grant DELETE on public.maths_rewards to postgres;
grant INSERT on public.maths_rewards to postgres;
grant UPDATE on public.maths_rewards to postgres;
grant TRUNCATE on public.learning_progress to service_role;
grant TRIGGER on public.learning_progress to service_role;
grant INSERT on public.learning_progress to service_role;
grant SELECT on public.learning_progress to service_role;
grant UPDATE on public.learning_progress to service_role;
grant DELETE on public.learning_progress to service_role;
grant REFERENCES on public.learning_progress to service_role;
grant SELECT on public.maths_families to service_role;
grant TRIGGER on public.maths_families to service_role;
grant REFERENCES on public.maths_families to service_role;
grant TRUNCATE on public.maths_families to service_role;
grant DELETE on public.maths_families to service_role;
grant UPDATE on public.maths_families to service_role;
grant INSERT on public.maths_families to service_role;
grant SELECT on public.maths_learning to service_role;
grant REFERENCES on public.maths_learning to service_role;
grant TRUNCATE on public.maths_learning to service_role;
grant DELETE on public.maths_learning to service_role;
grant UPDATE on public.maths_learning to service_role;
grant INSERT on public.maths_learning to service_role;
grant TRIGGER on public.maths_learning to service_role;
grant INSERT on public.maths_reward_events to service_role;
grant UPDATE on public.maths_reward_events to service_role;
grant DELETE on public.maths_reward_events to service_role;
grant TRUNCATE on public.maths_reward_events to service_role;
grant REFERENCES on public.maths_reward_events to service_role;
grant TRIGGER on public.maths_reward_events to service_role;
grant SELECT on public.maths_reward_events to service_role;
grant SELECT on public.maths_rewards to service_role;
grant DELETE on public.maths_rewards to service_role;
grant TRUNCATE on public.maths_rewards to service_role;
grant REFERENCES on public.maths_rewards to service_role;
grant TRIGGER on public.maths_rewards to service_role;
grant INSERT on public.maths_rewards to service_role;
grant UPDATE on public.maths_rewards to service_role;
revoke all on function public.parent_award_maths(uuid,text,integer) from public,anon,authenticated,service_role;
revoke all on function public.parent_award_maths_once(uuid,text,integer,uuid) from public,anon,authenticated,service_role;
grant EXECUTE on function public.parent_award_maths(uuid, text, integer) to postgres;
grant EXECUTE on function public.parent_award_maths(uuid, text, integer) to service_role;
grant EXECUTE on function public.parent_award_maths_once(uuid, text, integer, uuid) to authenticated;
grant EXECUTE on function public.parent_award_maths_once(uuid, text, integer, uuid) to postgres;
grant EXECUTE on function public.parent_award_maths_once(uuid, text, integer, uuid) to service_role;
-- Synthetic partial predicate only; production index is retained without depending on its omitted predicate.
create unique index fictional_parent_request_idx on public.maths_reward_events(parent_user_id,request_id) where request_id is not null;
alter default privileges in schema public grant all on tables to anon,authenticated,service_role;
alter default privileges in schema public grant execute on functions to anon,authenticated,service_role;
