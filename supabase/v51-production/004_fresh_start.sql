-- DRAFT. Add explicit fresh-start activation; no activation occurs when installed.
begin;
do $$ begin
 if current_user<>'postgres' or current_setting('app.v51.migration_authorized',true) is distinct from 'yes'
 or not exists(select 1 from public.v3_environment where name='jaxon-maths-production' and project_ref='mbdelspbjusarbwlltol' and not ready)
 then raise exception 'Reviewed inactive production backend required'; end if;
end $$;
create schema v51_private authorization postgres;
revoke all on schema v51_private from public,anon,authenticated,service_role;
create table v51_private.fresh_start_archive (
 singleton boolean primary key default true check(singleton), migration_id uuid not null unique,
 legacy_fingerprint text not null, permission_fingerprint text not null,
 backup_receipt jsonb not null, legacy_records jsonb not null,
 archived_at timestamptz not null default now()
);
alter table v51_private.fresh_start_archive enable row level security;
revoke all on v51_private.fresh_start_archive from public,anon,authenticated,service_role;
create function v51_private.legacy_state() returns jsonb language sql set search_path='' as $state$
select jsonb_build_object(
'maths_families', (select coalesce(jsonb_agg(to_jsonb(t)||jsonb_build_object('created_at',to_char(t.created_at at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"')) order by t.id),'[]') from public.maths_families t),
'learning_progress', (select coalesce(jsonb_agg(to_jsonb(t)||jsonb_build_object('updated_at',to_char(t.updated_at at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"')) order by t.user_id),'[]') from public.learning_progress t),
'maths_learning', (select coalesce(jsonb_agg(to_jsonb(t)||jsonb_build_object('updated_at',to_char(t.updated_at at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"')) order by t.child_user_id),'[]') from public.maths_learning t),
'maths_rewards', (select coalesce(jsonb_agg(to_jsonb(t)||jsonb_build_object('updated_at',to_char(t.updated_at at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"')) order by t.child_user_id),'[]') from public.maths_rewards t),
'maths_reward_events', (select coalesce(jsonb_agg(to_jsonb(t)||jsonb_build_object('created_at',to_char(t.created_at at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"')) order by t.id),'[]') from public.maths_reward_events t)
);
$state$;
create function v51_private.legacy_permissions() returns jsonb language sql set search_path='' as $permissions$
select jsonb_build_object('tables',(select jsonb_agg(jsonb_build_object(
 'name',c.relname,'owner',pg_get_userbyid(c.relowner),'rls',c.relrowsecurity,'force',c.relforcerowsecurity,
 'acl',(select coalesce(jsonb_agg(a::text order by a::text),'[]') from unnest(c.relacl) a),
 'policies',(select coalesce(jsonb_agg(jsonb_build_object('name',p.polname,'command',p.polcmd,
 'permissive',p.polpermissive,'roles',p.polroles::text,'qual',p.polqual::text,'check',p.polwithcheck::text) order by p.polname),'[]')
 from pg_policy p where p.polrelid=c.oid),
 'column_acl',(select coalesce(jsonb_agg(jsonb_build_object('name',a.attname,'acl',a.attacl::text) order by a.attnum),'[]')
 from pg_attribute a where a.attrelid=c.oid and a.attacl is not null)) order by c.relname)
 from pg_class c join pg_namespace n on n.oid=c.relnamespace
 where n.nspname='public' and c.relname in ('maths_families','learning_progress','maths_learning','maths_rewards','maths_reward_events')),
 'routines',(select jsonb_agg(jsonb_build_object('name',p.proname,'args',oidvectortypes(p.proargtypes),
 'owner',pg_get_userbyid(p.proowner),'definer',p.prosecdef,
 'definition_hash',encode(extensions.digest(jsonb_build_object('source',p.prosrc,'sqlbody',p.prosqlbody::text,'binary',p.probin,
 'config',p.proconfig,'language',p.prolang,'returns',p.prorettype,'strict',p.proisstrict,'volatility',p.provolatile)::text,'sha256'),'hex'),
 'acl',(select coalesce(jsonb_agg(a::text order by a::text),'[]') from unnest(p.proacl) a)) order by p.proname)
 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public'
 and p.proname in ('parent_award_maths','parent_award_maths_once'))
);
$permissions$;
revoke all on function v51_private.legacy_state(),v51_private.legacy_permissions() from public,anon,authenticated,service_role;
create function v51_private.archive_fresh_start(p_review jsonb) returns void language plpgsql set search_path='' as $$
declare snapshot jsonb; permissions jsonb; fingerprint text; permission_hash text; receipt jsonb:=p_review->'backupReceipt';
begin
 if current_user<>'postgres' or current_setting('app.v51.fresh_start_authorized',true) is distinct from 'yes'
 then raise exception 'Explicit administrator fresh-start approval required'; end if;
 if p_review->>'mode' is distinct from 'fresh-start' or p_review->'gameplayResetApproved' is distinct from 'true'::jsonb
 then raise exception 'Explicit fresh-start reset manifest required'; end if;
 if jsonb_typeof(receipt) is distinct from 'object' or receipt->'restoreVerified' is distinct from 'true'::jsonb
 or coalesce(receipt->>'backupSha256','') !~ '^[0-9a-f]{64}$'
 or coalesce(receipt->>'restoreReceiptSha256','') !~ '^[0-9a-f]{64}$'
 or receipt->>'archiveId' is null then raise exception 'Verified private backup and restoration receipt required'; end if;
 -- Verification is explicitly scoped. A PARTIAL application restore never claims managed Auth recovery.
 if receipt->>'recoveryScope' is null or receipt->>'recoveryScope' not in ('application-data-only','full-supabase')
 then raise exception 'Explicit restoration receipt scope required'; end if;
 if receipt->>'recoveryScope'='application-data-only' and
 (receipt->'managedAuthRecoveryVerified' is distinct from 'false'::jsonb
 or receipt->'managedServiceSafeguardsApproved' is distinct from 'true'::jsonb)
 then raise exception 'Partial restoration receipt needs explicit managed-service safeguards approval'; end if;
 if receipt->>'recoveryScope'='full-supabase' and receipt->'managedAuthRecoveryVerified' is distinct from 'true'::jsonb
 then raise exception 'Full restoration receipt needs explicit managed Auth recovery verification'; end if;
 perform (receipt->>'archiveId')::uuid;
 if exists(select 1 from public.v3_wallet) or exists(select 1 from public.v3_progress)
 or exists(select 1 from public.v3_transactions) or exists(select 1 from public.v3_pins) or exists(select 1 from public.v3_unlocks)
 then raise exception 'Unexpected new-backend records; never clear or overwrite them'; end if;
 snapshot:=v51_private.legacy_state(); permissions:=v51_private.legacy_permissions();
 fingerprint:=encode(extensions.digest(snapshot::text,'sha256'),'hex');
 permission_hash:=encode(extensions.digest(permissions::text,'sha256'),'hex');
 if p_review->>'legacyFingerprint' is distinct from fingerprint then raise exception 'Legacy records or balances changed since verified backup'; end if;
 if p_review->>'permissionFingerprint' is distinct from permission_hash then raise exception 'Legacy permissions changed since review'; end if;
 insert into v51_private.fresh_start_archive(migration_id,legacy_fingerprint,permission_fingerprint,backup_receipt,legacy_records)
 values((p_review->>'migrationId')::uuid,fingerprint,permission_hash,receipt,snapshot);
end $$;
revoke all on function v51_private.archive_fresh_start(jsonb) from public,anon,authenticated,service_role;

create function public.v3_admin_activate_fresh_start(p_review jsonb) returns jsonb language plpgsql set search_path='' as $$
begin
 if current_user<>'postgres' or current_setting('app.v51.fresh_start_authorized',true) is distinct from 'yes'
 then raise exception 'Explicit administrator fresh-start approval required'; end if;
 return public.v3_admin_apply_activation(p_review,'fresh-start');
end $$;
revoke all on function public.v3_admin_activate_fresh_start(jsonb) from public,anon,authenticated,service_role;

-- Public release epoch is nonsecret; it isolates browser queues from every earlier opening.
create or replace function public.v3_identity() returns jsonb language sql security definer set search_path='' as $$
 select jsonb_build_object('name',e.name,'projectRef',e.project_ref,'contractVersion',e.contract_version,'ready',e.ready,
 'activationId',(select review->>'migrationId' from public.v3_activation),
 'activationMode',(select mode from public.v3_activation)) from public.v3_environment e;
$$;
revoke all on function public.v3_identity() from public,anon,authenticated;
grant execute on function public.v3_identity() to anon,authenticated;
commit;
