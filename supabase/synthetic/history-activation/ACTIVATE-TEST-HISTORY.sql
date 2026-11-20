-- AUTHORISED SYNTHETIC TEST PROJECT ONLY: vyxvemtevkxlwqzelghj.
-- Separate TEST history activation. Original application rows are fingerprinted/preserved.
-- Reviewed running client: cbee972f7e176471611e1749c8f48cac2aec0d44. Test automatic builds are held pending this step.
-- Run this WHOLE file once in the new test project's postgres SQL-editor session.
BEGIN;
SET LOCAL search_path='';
SET LOCAL lock_timeout='3s';
SET LOCAL statement_timeout='30s';
SELECT pg_advisory_xact_lock(hashtextextended('esa-synthetic-history-activate',0));
DO $target$
DECLARE identity jsonb;
BEGIN
 IF current_user<>'postgres' THEN RAISE EXCEPTION 'Test history requires the postgres SQL-editor role'; END IF;
 identity:=public.v3_identity();
 IF identity->>'projectRef' IS DISTINCT FROM 'vyxvemtevkxlwqzelghj'
 OR identity->>'syntheticOnly' IS DISTINCT FROM 'true'
 OR identity->>'environmentKind' IS DISTINCT FROM 'synthetic-test'
 OR identity->>'syntheticContractVersion' IS DISTINCT FROM '1'
 THEN RAISE EXCEPTION 'Exact synthetic test identity required; never run on live'; END IF;
 IF to_regclass('public.v3_history_settings') IS NULL THEN RAISE EXCEPTION 'Reviewed disabled history installation required'; END IF;
 IF (SELECT count(*) FROM public.v3_history_settings)<>1 OR NOT EXISTS(SELECT 1 FROM public.v3_history_settings WHERE singleton AND NOT enabled AND NOT write_enabled AND client_release IS NULL)
 THEN RAISE EXCEPTION 'Fresh disabled history required; inspect instead of rerunning activation'; END IF;
 LOCK TABLE auth.users IN SHARE MODE;
 IF (SELECT count(*) FROM auth.users)<>4
 OR (SELECT count(DISTINCT lower(email)) FROM auth.users)<>4
 OR EXISTS(SELECT 1 FROM auth.users
 WHERE email_confirmed_at IS NULL OR lower(email) NOT IN ('parent-a@esa-test.invalid','learner-a@esa-test.invalid','parent-b@esa-test.invalid','learner-b@esa-test.invalid'))
 THEN RAISE EXCEPTION 'Only the four reserved fictional accounts may be present'; END IF;
END $target$;
-- Fingerprints stay inside this transaction; no records or account IDs are returned.
CREATE TEMP TABLE esa_history_before(table_name text PRIMARY KEY, fingerprint text NOT NULL) ON COMMIT DROP;
DO $snapshot$
DECLARE name text; value text;
BEGIN
 FOREACH name IN ARRAY ARRAY['v3_pins','v3_wallet','v3_progress','v3_transactions','v3_game_requests','v3_game_resets','maths_families','v3_unlocks','v3_environment','v3_catalog'] LOOP
 EXECUTE format('LOCK TABLE public.%I IN SHARE MODE',name);
 EXECUTE format('SELECT encode(extensions.digest(convert_to(coalesce(jsonb_agg(to_jsonb(t) ORDER BY to_jsonb(t)::text),''[]''::jsonb)::text,''UTF8''),''sha256''),''hex'') FROM public.%I t',name) INTO value;
 INSERT INTO pg_temp.esa_history_before VALUES(name,value);
 END LOOP;
END $snapshot$;
SET LOCAL app.history_cutover_reviewed='yes';
SET LOCAL app.history_expected_project_ref='vyxvemtevkxlwqzelghj';
SET LOCAL app.history_client_release='cbee972f7e176471611e1749c8f48cac2aec0d44';
-- Separate cutover review, AFTER the compatible client is deployed and backup verified.

DO $$ BEGIN
 IF current_user<>'postgres' OR current_setting('app.history_cutover_reviewed',true) IS DISTINCT FROM 'yes'
  OR current_setting('app.history_expected_project_ref',true) IS DISTINCT FROM (SELECT project_ref FROM public.v3_environment)
  OR coalesce(current_setting('app.history_client_release',true),'')!~'^[0-9a-f]{40}$'
 THEN RAISE EXCEPTION 'Reviewed project, deployed client commit and encrypted backup required'; END IF;
 IF (public.v3_identity()->>'saveReceiptVersion') IS DISTINCT FROM '1' OR to_regprocedure('public.v3_request_before_game_reset(text,text,jsonb)') IS NULL
 THEN RAISE EXCEPTION 'Saving and reset compatibility must be verified first'; END IF;
END $$;
UPDATE public.v3_history_settings SET enabled=true,write_enabled=true,client_release=current_setting('app.history_client_release') WHERE singleton;


DO $preserve$
DECLARE saved record; value text;
BEGIN
 FOR saved IN SELECT * FROM pg_temp.esa_history_before LOOP
 EXECUTE format('SELECT encode(extensions.digest(convert_to(coalesce(jsonb_agg(to_jsonb(t) ORDER BY to_jsonb(t)::text),''[]''::jsonb)::text,''UTF8''),''sha256''),''hex'') FROM public.%I t',saved.table_name) INTO value;
 IF value IS DISTINCT FROM saved.fingerprint THEN RAISE EXCEPTION 'Application rows changed during test history activation; rolling back'; END IF;
 END LOOP;
 IF NOT EXISTS(SELECT 1 FROM public.v3_history_settings WHERE singleton AND enabled AND write_enabled AND client_release='cbee972f7e176471611e1749c8f48cac2aec0d44')
 OR EXISTS(SELECT 1 FROM public.v3_history_nodes) OR EXISTS(SELECT 1 FROM public.v3_history_roots)
 THEN RAISE EXCEPTION 'Expected enabled empty history for the reviewed test client'; END IF;
 IF public.v3_identity()->>'syntheticOnly' IS DISTINCT FROM 'true'
 OR public.v3_identity()->>'projectRef' IS DISTINCT FROM 'vyxvemtevkxlwqzelghj'
 OR public.v3_identity()->>'progressStorageVersion' IS DISTINCT FROM '2'
 THEN RAISE EXCEPTION 'Test identity/capability preservation failed'; END IF;
END $preserve$;
COMMIT;
SELECT jsonb_build_object('projectRef',public.v3_identity()->>'projectRef','syntheticOnly',true,
 'historyInstalled',true,'historyEnabled',(SELECT enabled FROM public.v3_history_settings WHERE singleton),
 'historyWritesEnabled',(SELECT write_enabled FROM public.v3_history_settings WHERE singleton),
 'originalRowsPreservedDuringActivation',true,'clientRelease',(SELECT client_release FROM public.v3_history_settings WHERE singleton),'progressStorageVersion',public.v3_identity()->'progressStorageVersion') AS test_history_activation;
