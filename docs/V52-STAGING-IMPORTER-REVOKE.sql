-- PROPOSAL ONLY. DO NOT RUN until separately approved by the owner.
-- Staging <NEW_STAGING_REF> ONLY; verify the dashboard project ref first.
-- Run the WHOLE file in a new SQL Editor query as postgres after approval.
-- Exactly one persistent change: revoke one function's EXECUTE from service_role.
-- No application function calls, data writes, role/default-privilege changes or CASCADE.
BEGIN;
DO $staging_target$ BEGIN
 IF coalesce(current_setting('app.v3.staging_ref',true),'') !~ '^[a-z]{20}$'
 OR current_setting('app.v3.staging_ref',true) IN ('sfogrvedypgtxfvecmbx','mbdelspbjusarbwlltol')
 THEN RAISE EXCEPTION 'New isolated staging target required; Main and deleted project forbidden'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.v3_environment WHERE name='jaxon-maths-v3-staging' AND project_ref=current_setting('app.v3.staging_ref',true))
 THEN RAISE EXCEPTION 'Staging marker mismatch; verify dashboard identity independently'; END IF;
END $staging_target$;

SET LOCAL lock_timeout = '3s';
SET LOCAL statement_timeout = '15s';

DO $guard$
BEGIN
 IF current_user <> 'postgres' THEN
  RAISE EXCEPTION 'Use the reviewed postgres owner role';
 END IF;
 IF NOT (SELECT count(*)=1 AND coalesce(bool_and(
     name='jaxon-maths-v3-staging' AND project_ref=current_setting('app.v3.staging_ref',true)),false)
     FROM public.v3_environment) THEN
  RAISE EXCEPTION 'Expected staging marker missing; stop without changes';
 END IF;
 IF NOT EXISTS (
  SELECT 1 FROM pg_proc p
  WHERE p.oid=to_regprocedure('public.v3_admin_import(uuid,jsonb)')
   AND p.proowner='postgres'::regrole AND NOT p.prosecdef
   -- Independently derived SHA-256s of the reviewed body: LF, then CRLF.
   -- Only these two byte variants are allowed; no whitespace/token normalization.
   AND pg_catalog.encode(
        pg_catalog.sha256(pg_catalog.convert_to(p.prosrc,'UTF8')),'hex') IN (
    '872f848436e16972771fa07d0690077da7e187af89351e47d4f34baee36d7bf8',
    '406cd4b0797de348355e5fddf2e90fe6da7ce43be34f24b948440ca0a016d928'
   )
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
