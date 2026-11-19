-- READ-ONLY REVIEW PACKAGE. Owner runs only after the backup checkpoint is accepted.
-- Set app.history_expected_project_ref to the reviewed reference in the same session.
-- Outputs catalogue/contract booleans and definition hashes; no learner rows or definitions.
BEGIN READ ONLY;
SET LOCAL statement_timeout='10s';
SET LOCAL lock_timeout='3s';
DO $$ BEGIN
 IF current_user<>'postgres' OR coalesce(current_setting('app.history_expected_project_ref',true),'')!~'^[a-z]{20}$'
  OR (SELECT count(*) FROM public.v3_environment)<>1
  OR current_setting('app.history_expected_project_ref',true) IS DISTINCT FROM (SELECT project_ref FROM public.v3_environment)
 THEN RAISE EXCEPTION 'Read-only history review requires the verified project and operator'; END IF;
END $$;
WITH required(signature) AS (VALUES
 ('public.v3_request(text,text,jsonb)'),('public.v3_request_before_game_reset(text,text,jsonb)'),
 ('public.v3_identity()'),('public.v3_role()'),('public.v3_set_pin(text)'),('public.v3_unlock(text)')),
 routines AS (
 SELECT signature,p.oid,p.prosecdef,p.proowner,p.proconfig
 FROM required LEFT JOIN pg_proc p ON p.oid=to_regprocedure(signature)
), required_tables(name) AS (VALUES
 ('public.maths_families'),('public.v3_environment'),('public.v3_pins'),('public.v3_unlocks'),
 ('public.v3_progress'),('public.v3_wallet'),('public.v3_catalog'),('public.v3_transactions'),
 ('public.v3_game_resets'),('public.v3_game_requests')),
 tables AS (SELECT name,c.oid,c.relrowsecurity,c.relforcerowsecurity FROM required_tables
 LEFT JOIN pg_class c ON c.oid=to_regclass(name))
SELECT jsonb_build_object(
 'scope','installed-contract metadata only; not backup, data recovery or hosted API verification',
 'tables', (SELECT jsonb_object_agg(name,jsonb_build_object('present',oid IS NOT NULL,'rls',coalesce(relrowsecurity,false),
   'forceRls',coalesce(relforcerowsecurity,false),
   'noClientTableAccess',CASE WHEN oid IS NULL THEN false ELSE
    NOT has_table_privilege('anon',oid,'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER') AND
    NOT has_table_privilege('authenticated',oid,'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER') END)) FROM tables),
 'routines',(SELECT jsonb_object_agg(signature,jsonb_build_object('present',oid IS NOT NULL,
   'secureDefiner',coalesce(prosecdef AND proowner='postgres'::regrole AND proconfig=ARRAY['search_path=""'],false),
   'definitionSha256',CASE WHEN oid IS NULL THEN NULL ELSE encode(extensions.digest(convert_to(pg_get_functiondef(oid),'UTF8'),'sha256'),'hex') END)) FROM routines),
 'historyAlreadyInstalled',to_regprocedure('public.v3_request_before_history(text,text,jsonb)') IS NOT NULL,
 'authenticatedRequestAllowed',CASE WHEN to_regprocedure('public.v3_request(text,text,jsonb)') IS NULL THEN false
   ELSE has_function_privilege('authenticated','public.v3_request(text,text,jsonb)','EXECUTE') END,
 'anonymousRequestDenied',CASE WHEN to_regprocedure('public.v3_request(text,text,jsonb)') IS NULL THEN false
   ELSE NOT has_function_privilege('anon','public.v3_request(text,text,jsonb)','EXECUTE') END,
 'baseResetDelegatePrivate',CASE WHEN to_regprocedure('public.v3_request_before_game_reset(text,text,jsonb)') IS NULL THEN false
   ELSE NOT has_function_privilege('anon','public.v3_request_before_game_reset(text,text,jsonb)','EXECUTE')
     AND NOT has_function_privilege('authenticated','public.v3_request_before_game_reset(text,text,jsonb)','EXECUTE')
     AND NOT has_function_privilege('service_role','public.v3_request_before_game_reset(text,text,jsonb)','EXECUTE') END
);
COMMIT;
