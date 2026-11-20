-- READ ONLY aggregate activity times for MAIN sfogrvedypgtxfvecmbx. No learner records.
BEGIN READ ONLY;
SET LOCAL statement_timeout='10s';
DO $$BEGIN
 IF current_user<>'postgres' OR (SELECT count(*) FROM public.v3_environment)<>1
 OR (SELECT project_ref FROM public.v3_environment) IS DISTINCT FROM 'sfogrvedypgtxfvecmbx'
 THEN RAISE EXCEPTION 'Read-only activity review requires the verified Main project and operator'; END IF;
END$$;
SELECT jsonb_build_object('projectRef',(SELECT project_ref FROM public.v3_environment),
 'latestProgressWriteUtc',to_char((SELECT max(updated_at) FROM public.v3_progress) AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),
 'latestTransactionUtc',to_char((SELECT max(created_at) FROM public.v3_transactions) AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),
 'latestWalletActivityUtc',to_char((SELECT max(last_active) FROM public.v3_wallet) AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),
 'latestResetUtc',to_char((SELECT max(created_at) FROM public.v3_game_resets) AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"')) AS main_activity_summary;
COMMIT;
