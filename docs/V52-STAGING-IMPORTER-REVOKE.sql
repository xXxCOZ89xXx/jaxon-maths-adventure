-- PROPOSAL ONLY. DO NOT RUN until separately approved by the owner.
-- Staging sfogrvedypgtxfvecmbx ONLY; verify the dashboard project ref first.
-- Run the WHOLE file in a new SQL Editor query as postgres after approval.
-- Exactly one persistent change: revoke one function's EXECUTE from service_role.
-- No application function calls, data writes, role/default-privilege changes or CASCADE.
BEGIN;
SET LOCAL lock_timeout = '3s';
SET LOCAL statement_timeout = '15s';

DO $guard$
BEGIN
 IF current_user <> 'postgres' THEN
  RAISE EXCEPTION 'Use the reviewed postgres owner role';
 END IF;
 IF NOT (SELECT count(*)=1 AND coalesce(bool_and(
     name='jaxon-maths-v3-staging' AND project_ref='sfogrvedypgtxfvecmbx'),false)
     FROM public.v3_environment) THEN
  RAISE EXCEPTION 'Expected staging marker missing; stop without changes';
 END IF;
 IF NOT EXISTS (
  SELECT 1 FROM pg_proc p
  WHERE p.oid=to_regprocedure('public.v3_admin_import(uuid,jsonb)')
   AND p.proowner='postgres'::regrole AND NOT p.prosecdef
   AND md5(p.prosrc)='a1d3a5958ad9c360d0fd9b2f6eab6159'
 ) THEN
  RAISE EXCEPTION 'Importer differs from reviewed owner-invoker definition';
 END IF;
 IF EXISTS (
  SELECT 1 FROM pg_proc p
  CROSS JOIN LATERAL aclexplode(coalesce(p.proacl,acldefault('f',p.proowner))) a
  WHERE p.oid='public.v3_admin_import(uuid,jsonb)'::regprocedure
    AND a.grantee=0 AND a.privilege_type='EXECUTE'
 ) OR has_function_privilege('anon','public.v3_admin_import(uuid,jsonb)','EXECUTE')
   OR has_function_privilege('authenticated','public.v3_admin_import(uuid,jsonb)','EXECUTE') THEN
  RAISE EXCEPTION 'Unexpected ordinary-client access; this correction covers service_role only';
 END IF;
END
$guard$;

SELECT 'before' AS phase,
 has_function_privilege('service_role','public.v3_admin_import(uuid,jsonb)','EXECUTE') AS service_role_execute,
 has_function_privilege('anon','public.v3_admin_import(uuid,jsonb)','EXECUTE') AS anon_execute,
 has_function_privilege('authenticated','public.v3_admin_import(uuid,jsonb)','EXECUTE') AS authenticated_execute,
 has_function_privilege('postgres','public.v3_admin_import(uuid,jsonb)','EXECUTE') AS owner_execute;

REVOKE EXECUTE ON FUNCTION public.v3_admin_import(uuid,jsonb) FROM service_role RESTRICT;

DO $verify$
BEGIN
 IF has_function_privilege('service_role','public.v3_admin_import(uuid,jsonb)','EXECUTE')
  OR NOT has_function_privilege('postgres','public.v3_admin_import(uuid,jsonb)','EXECUTE') THEN
  RAISE EXCEPTION 'Effective access mismatch; rollback, do not broaden this correction';
 END IF;
END
$verify$;

SELECT 'after' AS phase,
 has_function_privilege('service_role','public.v3_admin_import(uuid,jsonb)','EXECUTE') AS service_role_execute,
 has_function_privilege('anon','public.v3_admin_import(uuid,jsonb)','EXECUTE') AS anon_execute,
 has_function_privilege('authenticated','public.v3_admin_import(uuid,jsonb)','EXECUTE') AS authenticated_execute,
 has_function_privilege('postgres','public.v3_admin_import(uuid,jsonb)','EXECUTE') AS owner_execute;
COMMIT;
