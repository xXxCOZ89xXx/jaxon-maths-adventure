-- Read-only owner verification. Aggregate outputs only; no application RPC calls.
BEGIN READ ONLY;
DO $staging_target$ BEGIN
 IF coalesce(current_setting('app.v3.staging_ref',true),'') !~ '^[a-z]{20}$'
 OR current_setting('app.v3.staging_ref',true) IN ('sfogrvedypgtxfvecmbx','mbdelspbjusarbwlltol')
 THEN RAISE EXCEPTION 'New isolated staging target required; Main and deleted project forbidden'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.v3_environment WHERE name='jaxon-maths-v3-staging' AND project_ref=current_setting('app.v3.staging_ref',true))
 THEN RAISE EXCEPTION 'Staging marker mismatch; verify dashboard identity independently'; END IF;
END $staging_target$;

SET LOCAL statement_timeout='15s';
SELECT project_ref=current_setting('app.v3.staging_ref',true) AS correct_project FROM public.v3_environment;
SELECT EXISTS(SELECT 1 FROM pg_attribute WHERE attrelid='public.v3_transactions'::regclass AND attname='request_fingerprint' AND NOT attisdropped) AS receipt_column_present,
 (SELECT prosecdef AND proowner='postgres'::regrole AND proconfig=ARRAY['search_path=""'] FROM pg_proc WHERE oid='public.v3_request(text,text,jsonb)'::regprocedure) AS request_security_retained,
 NOT has_function_privilege('anon','public.v3_request(text,text,jsonb)','EXECUTE') AS anonymous_request_denied,
 NOT has_function_privilege('authenticated','public.v3_receipt_normalize(jsonb)','EXECUTE') AS helper_private,
 EXISTS(SELECT 1 FROM pg_trigger WHERE tgrelid='public.v3_transactions'::regclass AND tgname='v3_compact_receipts_insert' AND tgenabled='O' AND NOT tgisinternal) AS insert_guard_enabled;
SELECT operation,count(*) AS rows,
 count(*) FILTER(WHERE request_fingerprint IS NOT NULL) AS compact_receipts,
 count(*) FILTER(WHERE request_fingerprint IS NOT NULL AND payload ? 'progress') AS unexpected_new_snapshots,
 count(*) FILTER(WHERE request_fingerprint IS NULL AND payload ? 'progress') AS preserved_legacy_snapshots
FROM public.v3_transactions GROUP BY operation ORDER BY operation;
ROLLBACK;
