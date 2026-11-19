-- REVIEW PACKAGE ONLY. Never install on the family/legacy live project.
-- Requires a separate EMPTY synthetic project and a separately reviewed installed baseline.
-- No accounts/records are copied or created. No environment rename is performed.
BEGIN;
SET LOCAL search_path='';
SET LOCAL lock_timeout='3s';
SET LOCAL statement_timeout='15s';
DO $guard$
DECLARE expected text := current_setting('app.synthetic_expected_project_ref',true); app_table record; has_rows boolean;
BEGIN
 IF current_user<>'postgres' OR current_setting('app.synthetic_setup_reviewed',true) IS DISTINCT FROM 'yes'
 OR coalesce(expected,'')!~'^[a-z]{20}$' OR expected IN ('sfogrvedypgtxfvecmbx','mbdelspbjusarbwlltol')
 THEN RAISE EXCEPTION 'Reviewed separate synthetic project required'; END IF;
 IF (SELECT count(*) FROM public.v3_environment)<>1 OR NOT EXISTS
 (SELECT 1 FROM public.v3_environment WHERE project_ref=expected AND name='jaxon-maths-v3-staging')
 THEN RAISE EXCEPTION 'Synthetic project identity mismatch'; END IF;
 IF to_regnamespace('esa_test_private') IS NOT NULL OR to_regprocedure('public.v3_identity_before_synthetic()') IS NOT NULL
 THEN RAISE EXCEPTION 'Synthetic marker already exists; never rerun'; END IF;
 LOCK TABLE auth.users,auth.identities,public.maths_families,public.v3_pins,public.v3_unlocks,
 public.v3_progress,public.v3_wallet,public.v3_transactions,public.v3_game_resets,public.v3_game_requests IN SHARE MODE;
 -- Refuse any data-bearing or live-like environment, even if an operator supplies wrong flags.
 IF EXISTS(SELECT 1 FROM auth.users) OR EXISTS(SELECT 1 FROM auth.identities)
 OR EXISTS(SELECT 1 FROM public.maths_families) OR EXISTS(SELECT 1 FROM public.v3_pins)
 OR EXISTS(SELECT 1 FROM public.v3_unlocks) OR EXISTS(SELECT 1 FROM public.v3_progress)
 OR EXISTS(SELECT 1 FROM public.v3_wallet) OR EXISTS(SELECT 1 FROM public.v3_transactions)
 OR EXISTS(SELECT 1 FROM public.v3_game_resets) OR EXISTS(SELECT 1 FROM public.v3_game_requests)
 THEN RAISE EXCEPTION 'Empty synthetic environment required; existing records are preserved'; END IF;
 -- Also reject unrelated/legacy public records; do not rely only on known V3 names.
 FOR app_table IN SELECT c.relname FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
 WHERE n.nspname='public' AND c.relkind IN ('r','p') AND c.relname NOT IN ('v3_environment','v3_catalog')
 AND NOT EXISTS(SELECT 1 FROM pg_depend d WHERE d.classid='pg_class'::regclass AND d.objid=c.oid
 AND d.refclassid='pg_extension'::regclass AND d.deptype='e') LOOP
   EXECUTE format('LOCK TABLE public.%I IN SHARE MODE',app_table.relname);
   EXECUTE format('SELECT EXISTS(SELECT 1 FROM public.%I LIMIT 1)',app_table.relname) INTO has_rows;
   IF has_rows THEN RAISE EXCEPTION 'Empty synthetic environment required; unrelated records are preserved'; END IF;
 END LOOP;
 IF to_regprocedure('public.v3_request_before_game_reset(text,text,jsonb)') IS NULL
 OR NOT EXISTS(SELECT 1 FROM pg_attribute WHERE attrelid='public.v3_progress'::regclass AND attname='game_epoch' AND NOT attisdropped)
 THEN RAISE EXCEPTION 'Reviewed reset baseline required'; END IF;
 IF EXISTS(SELECT 1 FROM (VALUES
 ('public.v3_identity()',current_setting('app.synthetic_identity_sha256',true)),
 ('public.v3_request(text,text,jsonb)',current_setting('app.synthetic_request_sha256',true))) e(sig,expected_hash)
 LEFT JOIN pg_proc p ON p.oid=to_regprocedure(e.sig)
 WHERE p.oid IS NULL OR coalesce(e.expected_hash,'')!~'^[a-f0-9]{64}$'
 OR NOT p.prosecdef OR p.proowner<>'postgres'::regrole OR p.proconfig IS DISTINCT FROM ARRAY['search_path=""']
 OR encode(extensions.digest(convert_to(pg_get_functiondef(p.oid),'UTF8'),'sha256'),'hex')<>e.expected_hash)
 THEN RAISE EXCEPTION 'Review exact synthetic baseline definitions before installing marker'; END IF;
 IF has_function_privilege('anon','public.v3_request(text,text,jsonb)','EXECUTE') OR
 EXISTS(SELECT 1 FROM (VALUES('anon'),('authenticated'),('service_role')) r(role)
 WHERE has_function_privilege(r.role,'public.v3_request_before_game_reset(text,text,jsonb)','EXECUTE'))
 THEN RAISE EXCEPTION 'Reviewed private RPC delegate grants required'; END IF;
 IF EXISTS(SELECT 1 FROM (VALUES('maths_families'),('v3_environment'),('v3_pins'),('v3_unlocks'),
 ('v3_progress'),('v3_wallet'),('v3_catalog'),('v3_transactions'),('v3_game_resets'),('v3_game_requests')) t(name)
 JOIN pg_class c ON c.oid=to_regclass('public.'||t.name) CROSS JOIN (VALUES('anon'),('authenticated')) r(role)
 WHERE NOT c.relrowsecurity OR has_table_privilege(r.role,c.oid,'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER'))
 THEN RAISE EXCEPTION 'Reviewed table isolation required'; END IF;
 IF public.v3_identity()->>'saveReceiptVersion' IS DISTINCT FROM '1'
 THEN RAISE EXCEPTION 'Reviewed compact receipt baseline required'; END IF;
END $guard$;
CREATE SCHEMA esa_test_private AUTHORIZATION postgres;
REVOKE ALL ON SCHEMA esa_test_private FROM PUBLIC,anon,authenticated,service_role;
CREATE TABLE esa_test_private.environment(singleton boolean PRIMARY KEY CHECK(singleton),
 project_ref text NOT NULL CHECK(project_ref ~ '^[a-z]{20}$' AND project_ref NOT IN ('sfogrvedypgtxfvecmbx','mbdelspbjusarbwlltol')));
ALTER TABLE esa_test_private.environment ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON esa_test_private.environment FROM PUBLIC,anon,authenticated,service_role;
INSERT INTO esa_test_private.environment VALUES(true,current_setting('app.synthetic_expected_project_ref'));
ALTER FUNCTION public.v3_identity() RENAME TO v3_identity_before_synthetic;
REVOKE ALL ON FUNCTION public.v3_identity_before_synthetic() FROM PUBLIC,anon,authenticated,service_role;
CREATE FUNCTION public.v3_identity() RETURNS jsonb LANGUAGE sql SECURITY DEFINER SET search_path='' AS $$
 SELECT public.v3_identity_before_synthetic() || jsonb_build_object(
 'environmentKind','synthetic-test','syntheticOnly',true,'syntheticContractVersion',1)
 FROM esa_test_private.environment WHERE singleton;
$$;
REVOKE ALL ON FUNCTION public.v3_identity() FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.v3_identity() TO anon,authenticated;
COMMIT;
