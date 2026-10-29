-- PREPARED ONLY. Owner approval required. New independently verified staging only; Main and deleted project forbidden.
-- Never executed by builder/CI. Each phase is a complete error-stopping transaction.
begin;
set local search_path='';
set local lock_timeout='3s';
select v52_staging_private.assert_target();
do $rollback$ declare f jsonb; before_state jsonb; begin

 if current_setting('app.v52.rollback_authorized',true) is distinct from 'yes'
 or current_setting('app.v52.legacy_resume_risks_reviewed',true) is distinct from 'yes' then raise exception 'Explicit rollback and legacy validation review required'; end if;
 if (select state from v52_staging_private.control) is distinct from 'frozen' then raise exception 'Freeze before rollback'; end if;
 if exists(select 1 from pg_stat_activity where datname=current_database() and pid<>pg_backend_pid() and backend_type='client backend' and state is distinct from 'idle') then raise exception 'Drain requests before rollback'; end if;
if exists(select 1 from (values('public.v3_identity()'),('public.v3_role()'),('public.v3_set_pin(text)'),('public.v3_unlock(text)'),('public.v3_request(text,text,jsonb)') ) f(sig)
 cross join (values('anon'),('authenticated'),('service_role')) r(role) where has_function_privilege(r.role,f.sig,'EXECUTE'))
 then raise exception 'Inherited RPC access remains; no broad role changes allowed'; end if;
 lock table auth.users in share mode;
 lock table public.maths_families,public.v3_environment,public.v3_pins,public.v3_unlocks,public.v3_progress,public.v3_wallet,public.v3_catalog,public.v3_transactions in access exclusive mode;
 if exists(select 1 from public.v3_wallet where opening_seconds<>0 or legacy_redeemed<>0) then raise exception 'New field use needs a compatible rollback, never discard values'; end if;
 before_state:=v52_staging_private.data_digest();
 for f in select value from v52_staging_private.control c cross join lateral jsonb_each(c.previous) loop
 execute f->>'definition';
 end loop;
 if v52_staging_private.data_digest() is distinct from before_state then raise exception 'Rollback changed original data'; end if;
 update public.v3_environment set staging_upgrade_version=1;
 update v52_staging_private.control set state='rolled_back';
end $rollback$;
select 'rolled_back_closed' as state;
commit;
