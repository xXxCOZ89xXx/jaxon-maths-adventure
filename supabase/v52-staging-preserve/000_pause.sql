-- PREPARED ONLY. Owner approval required. Staging sfogrvedypgtxfvecmbx only.
-- Never executed by builder/CI. Each phase is a complete error-stopping transaction.
begin;
set local search_path='';
set local lock_timeout='3s';
set local statement_timeout='30s';
do $guard$ begin
if current_user<>'postgres' or current_setting('app.v52.staging_upgrade_authorized',true) is distinct from 'yes'
 or current_setting('app.v52.staging_ref',true) is distinct from 'sfogrvedypgtxfvecmbx'
 then raise exception 'Reviewed staging-only owner execution required'; end if;
 if not (select count(*)=1 and coalesce(bool_and(name='jaxon-maths-v3-staging' and project_ref='sfogrvedypgtxfvecmbx'),false) from public.v3_environment)
 then raise exception 'Staging identity mismatch'; end if;
 if current_setting('app.v52.staging_backup_verified',true) is distinct from 'yes' then raise exception 'Private current staging recovery coverage required'; end if;
 if to_regnamespace('v52_staging_private') is not null or to_regclass('public.v3_activation') is not null or to_regnamespace('v51_private') is not null
 then raise exception 'Existing upgrade/production overlap; never rerun or reset'; end if;
 if exists(select 1 from pg_attribute where attrelid='public.v3_environment'::regclass and attname='staging_upgrade_version' and not attisdropped)
 or exists(select 1 from pg_attribute where attrelid='public.v3_wallet'::regclass and attname in ('opening_seconds','legacy_redeemed') and not attisdropped)
 then raise exception 'Unexpected additive fields; review drift'; end if;
 if exists(select 1 from (values
('public.v3_identity()','45442f5fae7afe907fe02162963a84b60846acc4f181c2c241fb7b63e5312d25','6ee8ab035ddbb4440cec8b4961a14b34c8dce476b670492eed18ad5ac5b41b56',true),
('public.v3_role()','29ca307a30a2ca49992eadcf74cb63b4d42812a578ec90d52437c3b39cc77ba9','602d5563e1ac536b4a5526ea7e29e1715c9b8b976995bf5512e2945d9741dfe8',true),
('public.v3_set_pin(text)','511a9ac2a7d5285ac7ca3fe70cd2de2d23d76a933be775f84ce6ef9b4e56a4af','ae41aacc513fe8423cc841087408ec1a85b5368046f4415a6d4eaf57149d7e8b',true),
('public.v3_unlock(text)','468d0cb21ffa73454b68d5d47a54776d0728ea9c64af6ea80b327dbf884f6df0','6443cb3162af5867d5afb5e363abab1c7fbfc1d33c1642fcbb3bbae8cbc436ce',true),
('public.v3_request(text,text,jsonb)','8d33d57a858472359f5c765b4adb23230edee5faaaa344cdc0995503ace9ae09','192389df5e496a136fd0f110dbfeba7b53fb15efea7f646ae524fedd0204031a',true),
('public.v3_admin_import(uuid,jsonb)','872f848436e16972771fa07d0690077da7e187af89351e47d4f34baee36d7bf8','406cd4b0797de348355e5fddf2e90fe6da7ce43be34f24b948440ca0a016d928',false)
 ) e(sig,lf,crlf,definer) left join pg_proc p on p.oid=to_regprocedure(e.sig)
 where p.oid is null or p.proowner<>'postgres'::regrole or p.prosecdef is distinct from e.definer
 or p.prokind<>'f' or p.proretset or p.proisstrict or p.proleakproof
 or p.prorettype<>to_regtype(case when e.sig='public.v3_admin_import(uuid,jsonb)' then 'void' else 'jsonb' end)
 or (select lanname from pg_language where oid=p.prolang)<>case when e.sig='public.v3_identity()' then 'sql' else 'plpgsql' end
 or encode(sha256(convert_to(p.prosrc,'UTF8')),'hex') not in (e.lf,e.crlf)
 or not (coalesce(p.proconfig,'{}') @> array['search_path=""'] or coalesce(p.proconfig,'{}') @> array['search_path=']))
 then raise exception 'Reviewed routine baseline mismatch'; end if;
 if exists(select 1 from (values('anon'),('authenticated'),('service_role')) q(role)
 where has_function_privilege(q.role,'public.v3_admin_import(uuid,jsonb)','EXECUTE'))
 then raise exception 'Completed importer correction must remain in force'; end if;
 if exists(select 1 from pg_proc p cross join lateral aclexplode(coalesce(p.proacl,acldefault('f',p.proowner))) a
 where p.oid in ('public.v3_identity()'::regprocedure,'public.v3_role()'::regprocedure,'public.v3_set_pin(text)'::regprocedure,'public.v3_unlock(text)'::regprocedure,'public.v3_request(text,text,jsonb)'::regprocedure ) and
 (a.grantee not in ('postgres'::regrole,'anon'::regrole,'authenticated'::regrole,'service_role'::regrole)
 or a.grantor<>'postgres'::regrole or a.is_grantable)) then raise exception 'Unexpected RPC grant context'; end if;
end $guard$;
create schema v52_staging_private authorization postgres;
revoke all on schema v52_staging_private from public,anon,authenticated,service_role;
create table v52_staging_private.control (
 singleton boolean primary key default true check(singleton), state text not null,
 previous jsonb not null, grants jsonb not null, before_digest jsonb, installed_routines jsonb,
 check(state in ('paused','installed_closed','open','frozen','rolled_back','legacy_open'))
);
alter table v52_staging_private.control enable row level security;
revoke all on v52_staging_private.control from public,anon,authenticated,service_role;
create function v52_staging_private.assert_target() returns void language plpgsql set search_path='' as $fn$ begin
if current_user<>'postgres' or current_setting('app.v52.staging_upgrade_authorized',true) is distinct from 'yes'
 or current_setting('app.v52.staging_ref',true) is distinct from 'sfogrvedypgtxfvecmbx'
 then raise exception 'Reviewed staging-only owner execution required'; end if;
 if not (select count(*)=1 and coalesce(bool_and(name='jaxon-maths-v3-staging' and project_ref='sfogrvedypgtxfvecmbx'),false) from public.v3_environment)
 then raise exception 'Staging identity mismatch'; end if;
end $fn$;
create function v52_staging_private.routine_state() returns jsonb language sql set search_path='' as $fn$
 select jsonb_object_agg(p.oid::regprocedure::text,jsonb_build_object('definition',pg_get_functiondef(p.oid),'owner',p.proowner,'acl',p.proacl::text))
 from pg_proc p where p.oid in ('public.v3_identity()'::regprocedure,'public.v3_role()'::regprocedure,'public.v3_set_pin(text)'::regprocedure,'public.v3_unlock(text)'::regprocedure,'public.v3_request(text,text,jsonb)'::regprocedure );
$fn$;
create function v52_staging_private.data_digest() returns jsonb language sql set search_path='' set timezone='UTC' as $fn$
 select jsonb_object_agg(q.name,encode(sha256(convert_to(q.data::text,'UTF8')),'hex')) from (
 select 'auth.users' name,coalesce(jsonb_agg(to_jsonb(t) order by id),'[]'::jsonb) data from auth.users t
 union all
 select 'public.maths_families' name,coalesce(jsonb_agg(to_jsonb(t) order by child_user_id),'[]'::jsonb) data from public.maths_families t
 union all
 select 'public.v3_environment' name,coalesce(jsonb_agg(to_jsonb(t)-'staging_upgrade_version' order by name),'[]'::jsonb) data from public.v3_environment t
 union all
 select 'public.v3_pins' name,coalesce(jsonb_agg(to_jsonb(t) order by user_id),'[]'::jsonb) data from public.v3_pins t
 union all
 select 'public.v3_unlocks' name,coalesce(jsonb_agg(to_jsonb(t) order by token_hash),'[]'::jsonb) data from public.v3_unlocks t
 union all
 select 'public.v3_progress' name,coalesce(jsonb_agg(to_jsonb(t) order by child_user_id),'[]'::jsonb) data from public.v3_progress t
 union all
 select 'public.v3_wallet' name,coalesce(jsonb_agg(to_jsonb(t)-array['opening_seconds','legacy_redeemed'] order by child_user_id),'[]'::jsonb) data from public.v3_wallet t
 union all
 select 'public.v3_catalog' name,coalesce(jsonb_agg(to_jsonb(t) order by item_id),'[]'::jsonb) data from public.v3_catalog t
 union all
 select 'public.v3_transactions' name,coalesce(jsonb_agg(to_jsonb(t) order by child_user_id,request_id),'[]'::jsonb) data from public.v3_transactions t
 ) q;
$fn$;
revoke all on function v52_staging_private.assert_target(),v52_staging_private.routine_state(),v52_staging_private.data_digest() from public,anon,authenticated,service_role;
insert into v52_staging_private.control(state,previous,grants)
 select 'paused',v52_staging_private.routine_state(),coalesce(jsonb_agg(g),'[]'::jsonb) from (
 select jsonb_build_object('sig',p.oid::regprocedure::text,'role',pg_get_userbyid(a.grantee)) g
 from pg_proc p cross join lateral aclexplode(coalesce(p.proacl,acldefault('f',p.proowner))) a
 where p.oid in ('public.v3_identity()'::regprocedure,'public.v3_role()'::regprocedure,'public.v3_set_pin(text)'::regprocedure,'public.v3_unlock(text)'::regprocedure,'public.v3_request(text,text,jsonb)'::regprocedure )
 and a.grantee in ('anon'::regrole,'authenticated'::regrole,'service_role'::regrole) and a.privilege_type='EXECUTE') q;
revoke execute on function public.v3_identity() from public,anon,authenticated,service_role restrict;
revoke execute on function public.v3_role() from public,anon,authenticated,service_role restrict;
revoke execute on function public.v3_set_pin(text) from public,anon,authenticated,service_role restrict;
revoke execute on function public.v3_unlock(text) from public,anon,authenticated,service_role restrict;
revoke execute on function public.v3_request(text,text,jsonb) from public,anon,authenticated,service_role restrict;
do $closed$ begin if exists(select 1 from (values('public.v3_identity()'),('public.v3_role()'),('public.v3_set_pin(text)'),('public.v3_unlock(text)'),('public.v3_request(text,text,jsonb)') ) f(sig)
 cross join (values('anon'),('authenticated'),('service_role')) r(role) where has_function_privilege(r.role,f.sig,'EXECUTE'))
 then raise exception 'Inherited RPC access remains; no broad role changes allowed'; end if; end $closed$;
select 'paused' as state;
commit;
