-- DRAFT DEFINITIONS ONLY: does not activate or import anything by itself.
-- The owner must review a private opening-state manifest and backup before admin activation.
begin;
do $$ begin
 if current_user<>'postgres' or current_setting('app.v51.migration_authorized',true) is distinct from 'yes'
 or not exists(select 1 from public.v3_environment where name='jaxon-maths-production' and project_ref='mbdelspbjusarbwlltol' and contract_version=1 and not ready)
 then raise exception 'Reviewed inactive production backend required'; end if;
end $$;
create table public.v3_activation (
 singleton boolean primary key default true check(singleton), review jsonb not null,
 legacy_acl jsonb not null, activated_at timestamptz not null default now()
);
alter table public.v3_activation enable row level security;
revoke all on public.v3_activation from public,anon,authenticated;

create function public.v3_legacy_write_guard() returns trigger
language plpgsql security definer set search_path='' as $$
begin
 if exists(select 1 from public.v3_environment where ready) then
 raise exception 'Legacy writes retired; use the activated adventure backend'; end if;
 return null;
end $$;
revoke all on function public.v3_legacy_write_guard() from public,anon,authenticated;

create function public.v3_admin_activate(p_review jsonb) returns jsonb
language plpgsql set search_path='' as $$
declare x jsonb; old public.maths_rewards; c uuid; bonus numeric; remaining numeric; redeemed numeric;
 t text; f text; acl jsonb; previous jsonb; count_families integer;
begin
 if current_user<>'postgres' or current_setting('app.v51.cutover_authorized',true) is distinct from 'yes'
 then raise exception 'Reviewed administrator cutover required'; end if;
 if (select count(*) from public.v3_catalog)<>40 then raise exception 'Complete reviewed catalogue required'; end if;
 if jsonb_typeof(p_review) is distinct from 'object' or p_review->'pinTransitionApproved' is distinct from 'true'::jsonb
 or jsonb_typeof(p_review->'families') is distinct from 'array' or p_review->>'migrationId' is null
 then raise exception 'Complete PIN/accounting review manifest required'; end if;
 perform (p_review->>'migrationId')::uuid;
 lock table public.v3_environment, public.v3_activation in exclusive mode;
 select review into previous from public.v3_activation;
 if found then
 if previous=p_review and exists(select 1 from public.v3_environment where ready) then return '{"alreadyActivated":true}'; end if;
 raise exception 'Existing activation; no overwrite or automatic replay after rollback'; end if;
 lock table public.maths_families in share mode;
 lock table public.learning_progress,public.maths_learning,public.maths_rewards,public.maths_reward_events in access exclusive mode;
 if exists(select 1 from public.maths_families a join public.maths_families b on a.child_user_id=b.parent_user_id)
 then raise exception 'Ambiguous family roles'; end if;
 if exists(select 1 from pg_attribute where attrelid in ('public.learning_progress'::regclass,'public.maths_learning'::regclass,'public.maths_families'::regclass,'public.maths_rewards'::regclass,'public.maths_reward_events'::regclass) and attacl is not null)
 then raise exception 'Unexpected column ACLs; review cutover'; end if;
 select count(*) into count_families from public.maths_families;
 if jsonb_array_length(p_review->'families')<>count_families or
 (select count(distinct e->>'child') from jsonb_array_elements(p_review->'families') e)<>count_families
 then raise exception 'Exactly one reviewed opening per existing family required'; end if;
 select jsonb_agg(v) into acl from (
 select jsonb_build_object('kind','table','name',format('%I.%I',n.nspname,k.relname),
 'grantee',case when a.grantee=0 then 'PUBLIC' else pg_get_userbyid(a.grantee) end,
 'privilege',a.privilege_type,'grantable',a.is_grantable) v
 from pg_class k join pg_namespace n on n.oid=k.relnamespace
 cross join lateral aclexplode(coalesce(k.relacl,acldefault('r',k.relowner))) a
 where n.nspname='public' and k.relname in ('learning_progress','maths_learning','maths_families','maths_rewards','maths_reward_events')
 and a.grantee in (0,'anon'::regrole::oid,'authenticated'::regrole::oid)
 union all
 select jsonb_build_object('kind','function','name',p.oid::regprocedure::text,
 'grantee',case when a.grantee=0 then 'PUBLIC' else pg_get_userbyid(a.grantee) end,
 'privilege',a.privilege_type,'grantable',a.is_grantable)
 from pg_proc p cross join lateral aclexplode(coalesce(p.proacl,acldefault('f',p.proowner))) a
 where p.oid in ('public.parent_award_maths(uuid,text,integer)'::regprocedure,'public.parent_award_maths_once(uuid,text,integer,uuid)'::regprocedure)
 and a.grantee in (0,'anon'::regrole::oid,'authenticated'::regrole::oid)) q;
 for x in select value from jsonb_array_elements(p_review->'families') loop
 c:=(x->>'child')::uuid;
 if not exists(select 1 from public.maths_families where child_user_id=c) then raise exception 'Unknown reviewed family'; end if;
 bonus:=(x->>'bonus')::numeric; remaining:=(x->>'remaining_minutes')::numeric; redeemed:=(x->>'legacy_redeemed')::numeric;
 if bonus is null or remaining is null or redeemed is null or bonus::text in ('NaN','Infinity','-Infinity')
 or remaining::text in ('NaN','Infinity','-Infinity') or redeemed::text in ('NaN','Infinity','-Infinity')
 or bonus<0 or remaining<0 or redeemed<0 or jsonb_typeof(x->'owned') is distinct from 'array'
 then raise exception 'Invalid reviewed opening'; end if;
 select * into old from public.maths_rewards where child_user_id=c;
 if bonus<>coalesce(old.bonus_coins,0) or redeemed<>coalesce(old.redeemed_minutes,0)
 then raise exception 'Legacy rewards changed or review mismatch'; end if;
 if exists(select 1 from jsonb_array_elements(x->'owned') e where jsonb_typeof(e)<>'string' or
 not exists(select 1 from public.v3_catalog where item_id=e#>>'{}')) or
 (select count(distinct e) from jsonb_array_elements(x->'owned') e)<>jsonb_array_length(x->'owned')
 then raise exception 'Review ownership catalogue IDs'; end if;
 -- No client learning JSON is trusted as coins, minutes, ownership or reward authority.
 insert into public.v3_progress(child_user_id,progress) values(c,'{}');
 insert into public.v3_wallet(child_user_id,bonus,opening_seconds,legacy_redeemed,owned)
 values(c,bonus,remaining*60,redeemed,x->'owned');
 end loop;
 foreach t in array array['learning_progress','maths_learning','maths_families','maths_rewards','maths_reward_events'] loop
 execute format('revoke all on public.%I from public,anon,authenticated',t);
 if t<>'maths_families' then
 execute format('create trigger v51_retired_writer before insert or update or delete or truncate on public.%I for each statement execute function public.v3_legacy_write_guard()',t);
 end if;
 end loop;
 revoke all on function public.parent_award_maths(uuid,text,integer),public.parent_award_maths_once(uuid,text,integer,uuid) from public,anon,authenticated;
 -- The trigger also blocks a legacy RPC that entered before privilege revocation.
 if has_table_privilege('authenticated','public.learning_progress','TRUNCATE') then raise exception 'Inherited unsafe grants remain'; end if;
 if exists(select 1 from pg_class k cross join (values('anon'),('authenticated')) r(name)
 cross join (values('SELECT'),('INSERT'),('UPDATE'),('DELETE'),('TRUNCATE')) v(priv)
 where k.oid in ('public.learning_progress'::regclass,'public.maths_learning'::regclass,'public.maths_rewards'::regclass,'public.maths_reward_events'::regclass)
 and has_table_privilege(r.name,k.oid,v.priv)) then raise exception 'Legacy client authority remains'; end if;
 insert into public.v3_activation(review,legacy_acl) values(p_review,coalesce(acl,'[]'));
 update public.v3_environment set pin_transition_approved=true,ready=true;
 return jsonb_build_object('activated',true,'families',count_families);
end $$;
revoke all on function public.v3_admin_activate(jsonb) from public,anon,authenticated,service_role;

create function public.v3_admin_freeze() returns void language plpgsql set search_path='' as $$
begin
 if current_user<>'postgres' or current_setting('app.v51.rollback_authorized',true) is distinct from 'yes'
 then raise exception 'Reviewed administrator freeze required'; end if;
 lock table public.v3_environment in exclusive mode;
 lock table public.v3_wallet,public.v3_progress in access exclusive mode;
 update public.v3_environment set ready=false;
 delete from public.v3_unlocks;
 -- Legacy client access remains revoked. Reconcile privately before restoring it.
end $$;
revoke all on function public.v3_admin_freeze() from public,anon,authenticated,service_role;

create function public.v3_admin_rollback() returns void language plpgsql set search_path='' as $$
declare x jsonb; t text; grant_target text;
begin
 if current_user<>'postgres' or current_setting('app.v51.rollback_authorized',true) is distinct from 'yes'
 then raise exception 'Reviewed administrator rollback required'; end if;
 if exists(select 1 from public.v3_environment where ready) then raise exception 'Freeze the backend first'; end if;
 if exists(select 1 from public.v3_transactions) and current_setting('app.v51.rollback_reconciled',true) is distinct from 'yes'
 then raise exception 'Reconcile post-cutover ledger before restoring legacy access'; end if;
 lock table public.v3_environment in exclusive mode;
 lock table public.v3_wallet,public.v3_progress in access exclusive mode;
 update public.v3_environment set ready=false;
 delete from public.v3_unlocks;
 if not exists(select 1 from public.v3_activation) then raise exception 'No activation snapshot'; end if;
 for x in select value from public.v3_activation a cross join lateral jsonb_array_elements(a.legacy_acl) loop
 -- Restore original application access, never the known unnecessary destructive privileges.
 if x->>'kind'='table' and x->>'privilege' not in ('SELECT','INSERT','UPDATE') then continue; end if;
 grant_target:=case when x->>'grantee'='PUBLIC' then 'PUBLIC' else format('%I',x->>'grantee') end;
 execute format('grant %s on %s %s to %s%s',x->>'privilege',x->>'kind',x->>'name',grant_target,
 case when (x->>'grantable')::boolean then ' with grant option' else '' end);
 end loop;
 -- The guard permits legacy writes while ready=false. Preserve all V3 changes for reconciliation.
end $$;
revoke all on function public.v3_admin_rollback() from public,anon,authenticated,service_role;
commit;
