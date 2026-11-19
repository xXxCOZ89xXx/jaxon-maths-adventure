-- Separate cutover review, AFTER the compatible client is deployed and backup verified.
BEGIN;
DO $$ BEGIN
 IF current_user<>'postgres' OR current_setting('app.history_cutover_reviewed',true) IS DISTINCT FROM 'yes'
  OR current_setting('app.history_expected_project_ref',true) IS DISTINCT FROM (SELECT project_ref FROM public.v3_environment)
  OR coalesce(current_setting('app.history_client_release',true),'')!~'^[0-9a-f]{40}$'
 THEN RAISE EXCEPTION 'Reviewed project, deployed client commit and encrypted backup required'; END IF;
 IF (public.v3_identity()->>'saveReceiptVersion') IS DISTINCT FROM '1' OR to_regprocedure('public.v3_request_before_game_reset(text,text,jsonb)') IS NULL
 THEN RAISE EXCEPTION 'Saving and reset compatibility must be verified first'; END IF;
END $$;
UPDATE public.v3_history_settings SET enabled=true,write_enabled=true,client_release=current_setting('app.history_client_release') WHERE singleton;
COMMIT;
