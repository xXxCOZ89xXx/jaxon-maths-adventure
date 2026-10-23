-- PREPARED ONLY. Owner approval required. Staging sfogrvedypgtxfvecmbx only.
-- Never executed by builder/CI. Each phase is a complete error-stopping transaction.
begin;
set local search_path='';
select v52_staging_private.assert_target();
do $incident$ begin if current_setting('app.v52.rollback_authorized',true) is distinct from 'yes' then raise exception 'Incident scope required'; end if; end $incident$;
revoke execute on function public.v3_identity() from public,anon,authenticated,service_role restrict;
revoke execute on function public.v3_role() from public,anon,authenticated,service_role restrict;
revoke execute on function public.v3_set_pin(text) from public,anon,authenticated,service_role restrict;
revoke execute on function public.v3_unlock(text) from public,anon,authenticated,service_role restrict;
revoke execute on function public.v3_request(text,text,jsonb) from public,anon,authenticated,service_role restrict;
do $closed$ begin if exists(select 1 from (values('public.v3_identity()'),('public.v3_role()'),('public.v3_set_pin(text)'),('public.v3_unlock(text)'),('public.v3_request(text,text,jsonb)') ) f(sig)
 cross join (values('anon'),('authenticated'),('service_role')) r(role) where has_function_privilege(r.role,f.sig,'EXECUTE'))
 then raise exception 'Inherited RPC access remains; no broad role changes allowed'; end if; end $closed$;
update v52_staging_private.control set state='frozen' where state in ('open','legacy_open','installed_closed');
commit;
