-- Optional targeted read-only release supplement; run manually in SQL Editor.
-- No application/Auth rows, function bodies, index expression text or secret settings.
-- The partial index is RETAINED unchanged; its withheld predicate is not guessed by migrations.
SELECT 'legacy_request_index' AS item, jsonb_build_object(
 'exists',exists(select 1 from pg_class where oid=to_regclass('public.maths_reward_event_once')),
 'predicate_matches_request_not_null',(
 select pg_get_expr(i.indpred,i.indrelid)='(request_id IS NOT NULL)'
 from pg_index i where i.indexrelid=to_regclass('public.maths_reward_event_once')),
 'note','A false/null predicate match requires audit documentation, not an automatic index rewrite') AS metadata
UNION ALL
SELECT 'crypto_dependencies',jsonb_build_object('routine',p.oid::regprocedure::text,
 'owner',pg_get_userbyid(p.proowner),'postgres_can_execute',has_function_privilege('postgres',p.oid,'EXECUTE'))
FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
WHERE n.nspname='extensions' AND p.proname IN ('crypt','gen_salt','gen_random_bytes','digest')
UNION ALL
SELECT 'platform_event_trigger',jsonb_build_object('name',e.evtname,'enabled',e.evtenabled,
 'owner',pg_get_userbyid(e.evtowner),'routine',e.evtfoid::regprocedure::text)
FROM pg_event_trigger e
UNION ALL
SELECT 'runtime_api_schemas',jsonb_build_object('sql_session_setting',current_setting('pgrst.db_schemas',true),
 'note','NULL does not establish active API settings; confirm public RPC exposure in the Supabase dashboard')
UNION ALL
SELECT 'migration_owner_capabilities',jsonb_build_object(
 'public_create',has_schema_privilege('postgres','public','CREATE'),
 'extensions_usage',has_schema_privilege('postgres','extensions','USAGE'),
 'auth_user_reference',has_table_privilege('postgres','auth.users','REFERENCES'));
