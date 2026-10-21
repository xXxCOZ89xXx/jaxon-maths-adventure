-- READ ONLY: owner-run private backup fingerprint query. No rows, passwords or PIN hashes returned.
-- Reads the five legacy application tables internally; outputs only hashes and row counts.
-- Run in the same repeatable-read/locked session as the exported pg_dump snapshot (see backup guide).
-- Keep results private; this does NOT establish that an external backup was taken or restored.
with legacy as (select jsonb_build_object(
'maths_families', (select coalesce(jsonb_agg(to_jsonb(t)||jsonb_build_object('created_at',to_char(t.created_at at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"')) order by t.id),'[]') from public.maths_families t),
'learning_progress', (select coalesce(jsonb_agg(to_jsonb(t)||jsonb_build_object('updated_at',to_char(t.updated_at at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"')) order by t.user_id),'[]') from public.learning_progress t),
'maths_learning', (select coalesce(jsonb_agg(to_jsonb(t)||jsonb_build_object('updated_at',to_char(t.updated_at at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"')) order by t.child_user_id),'[]') from public.maths_learning t),
'maths_rewards', (select coalesce(jsonb_agg(to_jsonb(t)||jsonb_build_object('updated_at',to_char(t.updated_at at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"')) order by t.child_user_id),'[]') from public.maths_rewards t),
'maths_reward_events', (select coalesce(jsonb_agg(to_jsonb(t)||jsonb_build_object('created_at',to_char(t.created_at at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"')) order by t.id),'[]') from public.maths_reward_events t)
)), permissions as (select jsonb_build_object('tables',(select jsonb_agg(jsonb_build_object(
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
))
select encode(extensions.digest((select * from legacy)::text,'sha256'),'hex') as legacy_fingerprint,
 encode(extensions.digest((select * from permissions)::text,'sha256'),'hex') as permission_fingerprint,
 jsonb_build_object('maths_families',(select count(*) from public.maths_families),'learning_progress',(select count(*) from public.learning_progress),'maths_learning',(select count(*) from public.maths_learning),'maths_rewards',(select count(*) from public.maths_rewards),'maths_reward_events',(select count(*) from public.maths_reward_events)) as row_counts;
