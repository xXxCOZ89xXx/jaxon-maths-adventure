-- V2.1: Idempotent parent reward requests.
-- Apply AFTER v2-parent-security.sql. Retains earlier ledger and rewards.
begin;
alter table public.maths_reward_events
  add column if not exists request_id uuid;
create unique index if not exists maths_reward_event_once
  on public.maths_reward_events(parent_user_id,request_id)
  where request_id is not null;
create or replace function public.parent_award_maths_once(
  p_child uuid,p_kind text,p_amount integer,p_request_id uuid
) returns public.maths_rewards
language plpgsql security definer set search_path=''
as $$
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
end $$;
revoke execute on function public.parent_award_maths_once(uuid,text,integer,uuid) from public,anon;
grant execute on function public.parent_award_maths_once(uuid,text,integer,uuid) to authenticated;
-- IMPORTANT: Retire insecure legacy RPC so client code must use idempotent endpoint.
revoke execute on function public.parent_award_maths(uuid,text,integer) from public,anon,authenticated;
commit;
