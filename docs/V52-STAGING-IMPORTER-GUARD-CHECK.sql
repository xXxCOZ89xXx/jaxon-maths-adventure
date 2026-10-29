-- Read-only guard isolation ONLY; not a permission correction.
-- Owner: verify staging <NEW_STAGING_REF> in the dashboard.
-- Use a NEW SQL Editor query as postgres. Share only the one result row.
-- No function calls to application code, definitions, user data or permission changes.
BEGIN TRANSACTION READ ONLY;
DO $staging_target$ BEGIN
 IF coalesce(current_setting('app.v3.staging_ref',true),'') !~ '^[a-z]{20}$'
 OR current_setting('app.v3.staging_ref',true) IN ('sfogrvedypgtxfvecmbx','mbdelspbjusarbwlltol')
 THEN RAISE EXCEPTION 'New isolated staging target required; Main and deleted project forbidden'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.v3_environment WHERE name='jaxon-maths-v3-staging' AND project_ref=current_setting('app.v3.staging_ref',true))
 THEN RAISE EXCEPTION 'Staging marker mismatch; verify dashboard identity independently'; END IF;
END $staging_target$;

SET LOCAL statement_timeout = '10s';
WITH expected AS (
 SELECT 'a1d3a5958ad9c360d0fd9b2f6eab6159'::text AS body_md5
),
checks AS (
 SELECT p.oid IS NOT NULL AS routine_exists,
        coalesce(p.proowner='postgres'::regrole,false) AS owner_is_postgres,
        coalesce(NOT p.prosecdef,false) AS security_invoker,
        md5(p.prosrc) AS stored_body_md5,
        e.body_md5 AS expected_body_md5,
        coalesce(md5(p.prosrc)=e.body_md5,false) AS body_hash_matches
 FROM expected e LEFT JOIN pg_proc p
 ON p.oid=to_regprocedure('public.v3_admin_import(uuid,jsonb)')
)
SELECT routine_exists, owner_is_postgres, security_invoker,
       body_hash_matches, stored_body_md5, expected_body_md5,
       routine_exists AND owner_is_postgres AND security_invoker AND body_hash_matches
         AS combined_guard_would_pass
FROM checks;
ROLLBACK;
