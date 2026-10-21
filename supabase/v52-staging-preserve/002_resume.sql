-- PREPARED ONLY. Owner approval required. Staging sfogrvedypgtxfvecmbx only.
-- Never executed by builder/CI. Each phase is a complete error-stopping transaction.
begin;
set local search_path='';
select v52_staging_private.assert_target();
do $resume$ declare g jsonb; s text; v integer; begin

 select state into s from v52_staging_private.control for update;
 select (to_jsonb(e)->>'staging_upgrade_version')::integer into v from public.v3_environment e;
 if s not in ('installed_closed','paused','rolled_back','frozen') then raise exception 'Closed upgrade required'; end if;
 if v=2 then
 if v52_staging_private.routine_state() is distinct from (select installed_routines from v52_staging_private.control) then raise exception 'Installed routine drift'; end if;
 if s='installed_closed' and v52_staging_private.data_digest() is distinct from (select before_digest from v52_staging_private.control) then raise exception 'Data changed before first resume'; end if;
 else
 if current_setting('app.v52.legacy_resume_risks_reviewed',true) is distinct from 'yes' then raise exception 'Explicit review of legacy validation risks required'; end if;
 if exists(select 1 from pg_proc p where p.oid in ('public.v3_identity()'::regprocedure,'public.v3_role()'::regprocedure,'public.v3_set_pin(text)'::regprocedure,'public.v3_unlock(text)'::regprocedure,'public.v3_request(text,text,jsonb)'::regprocedure ) and pg_get_functiondef(p.oid) is distinct from ((select previous from v52_staging_private.control)->(p.oid::regprocedure::text)->>'definition')) then raise exception 'Legacy routine drift'; end if;
 end if;
 for g in select value from v52_staging_private.control c cross join lateral jsonb_array_elements(c.grants) loop
 if g->>'role' not in ('anon','authenticated','service_role') then raise exception 'Unexpected captured role'; end if;
 execute format('grant execute on function %s to %I',g->>'sig',g->>'role');
 end loop;
 if exists(select 1 from (values('anon'),('authenticated'),('service_role')) r(role) where has_function_privilege(r.role,'public.v3_admin_import(uuid,jsonb)','EXECUTE')) then raise exception 'Importer denial required'; end if;
 update v52_staging_private.control set state=case when v=2 then 'open' else 'legacy_open' end;
end $resume$;
select state from v52_staging_private.control;
commit;
