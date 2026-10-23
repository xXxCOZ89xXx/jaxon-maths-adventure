-- READ ONLY. Owner runs AFTER inactive installation, then immediately AFTER activation.
-- Aggregates/metadata only. Not a substitute for hosted Auth/PIN/API verification.
-- Before activation: ready=false, no openings/audit. After fresh activation, BEFORE canary activity:
-- ready=true, mode=fresh-start, counts match families, nonzero/nonnull-progress counts zero.
select 'environment' as check_name,jsonb_build_object(
 'identity',public.v3_identity(),
 'families',(select count(*) from public.maths_families),
 'progress_rows',(select count(*) from public.v3_progress),
 'wallet_rows',(select count(*) from public.v3_wallet),
 'nonempty_progress',(select count(*) from public.v3_progress where progress<>'{}'::jsonb or revision<>0),
 'nonzero_openings',(select count(*) from public.v3_wallet where coins<>0 or bonus<>0 or active_seconds<>0
  or opening_seconds<>0 or redeemed<>0 or legacy_redeemed<>0 or owned<>'[]'::jsonb),
 'activation_mode',(select mode from public.v3_activation),
 'legacy_restored',(select legacy_restored from public.v3_activation),
 'private_archive_rows',(select count(*) from v51_private.fresh_start_archive)) as result
union all
select 'protected_table_access',jsonb_build_object('role',r.name,'table',t.name,
 'rls',(select relrowsecurity from pg_class where oid=to_regclass(t.name)),
 'direct_access',has_table_privilege(r.name,t.name,'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER'))
from (values('anon'),('authenticated'))r(name)
cross join (values('public.v3_environment'),('public.v3_pins'),('public.v3_unlocks'),('public.v3_progress'),
 ('public.v3_wallet'),('public.v3_catalog'),('public.v3_transactions'),('public.v3_activation'),('v51_private.fresh_start_archive'))t(name)
union all
select 'legacy_access',jsonb_build_object('role',r.name,'table',t.name,
 'any_direct_access',has_table_privilege(r.name,t.name,'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER'))
from (values('anon'),('authenticated'))r(name)
cross join (values('public.maths_families'),('public.learning_progress'),('public.maths_learning'),
 ('public.maths_rewards'),('public.maths_reward_events'))t(name);
-- Protected direct_access must always be false, RLS true. Legacy access may retain its
-- previous state while inactive; every legacy_access must be false after activation.
-- Zero openings are checked before fictional acceptance creates legitimate new transactions.

-- RPC execute grants: identity public; protected game RPCs authenticated only; admins never clients.
select 'rpc_access' as check_name,jsonb_build_object('role',r.name,'routine',p.signature,
 'execute',has_function_privilege(r.name,p.signature,'EXECUTE'),
 'expected',case when r.name='anon' then p.anon_allowed else p.auth_allowed end) as result
from (values('anon'),('authenticated'))r(name)
cross join (values('public.v3_identity()',true,true),('public.v3_role()',false,true),
 ('public.v3_set_pin(text)',false,true),('public.v3_unlock(text)',false,true),
 ('public.v3_request(text,text,jsonb)',false,true),('public.v3_admin_activate(jsonb)',false,false),
 ('public.v3_admin_activate_fresh_start(jsonb)',false,false),('public.v3_admin_apply_activation(jsonb,text)',false,false),
 ('public.v3_admin_freeze()',false,false),('public.v3_admin_rollback()',false,false))p(signature,anon_allowed,auth_allowed);

select 'private_archive_service_access' as check_name,jsonb_build_object(
 'schema_usage',has_schema_privilege('service_role','v51_private','USAGE'),
 'table_access',has_table_privilege('service_role','v51_private.fresh_start_archive','SELECT,INSERT,UPDATE,DELETE,TRUNCATE')) as result;
-- Both service-access values must be false. No service key is used to perform these metadata checks.
