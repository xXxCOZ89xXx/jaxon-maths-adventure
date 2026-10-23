-- V5.2 Part 2: ONE read-only catalog SELECT; run manually in Supabase SQL Editor.
-- Select the production project, paste the WHOLE script, Run, then Export/Download CSV
-- from the single result grid. Retain columns section, object_identity, metadata.
-- Keep the CSV private/outside Git. No Auth/application rows or secret settings are read.
-- Bodies, default expressions, index predicates, trigger arguments and comments are
-- deliberately omitted: their text can embed secrets or personal constants.
-- This inventories metadata only; it does not call application functions or prove login.
WITH RECURSIVE
app_schemas AS (
  SELECT oid, nspname, nspowner, nspacl FROM pg_catalog.pg_namespace
  WHERE nspname NOT IN ('pg_catalog', 'information_schema', 'auth', 'storage',
    'realtime', 'vault', 'supabase_functions', 'graphql', 'graphql_public')
    AND nspname NOT LIKE 'pg\_%' ESCAPE '\'
),
tables AS (
  SELECT c.*, n.nspname FROM pg_catalog.pg_class c
  JOIN app_schemas n ON n.oid = c.relnamespace
  WHERE c.relkind IN ('r','p','v','m','f') AND
    (c.relname = 'learning_progress' OR c.relname LIKE 'maths\_%' ESCAPE '\'
      OR c.relname LIKE 'v3\_%' ESCAPE '\' OR c.relname LIKE 'v51\_%' ESCAPE '\')
),
triggers AS (
  SELECT t.* FROM pg_catalog.pg_trigger t JOIN tables c ON c.oid = t.tgrelid
  WHERE NOT t.tgisinternal
),
functions AS (
  SELECT p.*, n.nspname FROM pg_catalog.pg_proc p
  JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
  WHERE p.prokind IN ('f','p') AND (
    p.oid IN (SELECT tgfoid FROM triggers) OR
    (n.oid IN (SELECT oid FROM app_schemas) AND NOT EXISTS (
      SELECT 1 FROM pg_catalog.pg_depend d WHERE d.classid = 'pg_proc'::regclass
        AND d.objid = p.oid AND d.deptype = 'e')))
),
sequences AS (
  SELECT DISTINCT s.*, n.nspname FROM pg_catalog.pg_class s
  JOIN pg_catalog.pg_namespace n ON n.oid = s.relnamespace
  JOIN pg_catalog.pg_depend d ON d.classid = 'pg_class'::regclass AND d.objid = s.oid
  JOIN tables t ON d.refclassid = 'pg_class'::regclass AND d.refobjid = t.oid
  WHERE s.relkind = 'S' AND d.deptype IN ('a','i')
),
client_roles AS (
  SELECT oid, rolname FROM pg_catalog.pg_roles
  WHERE rolname IN ('anon','authenticated','service_role','authenticator','postgres')
),
role_roots AS (
  SELECT oid FROM client_roles UNION SELECT relowner FROM tables
  UNION SELECT proowner FROM functions UNION SELECT nspowner FROM app_schemas
),
role_tree(oid) AS (
  SELECT oid FROM role_roots UNION
  SELECT m.roleid FROM pg_catalog.pg_auth_members m JOIN role_tree r ON m.member = r.oid
),
objects AS (
  SELECT 'pg_class'::regclass AS classid, oid FROM tables
  UNION SELECT 'pg_proc'::regclass, oid FROM functions
),
report AS (
  SELECT '00_scope'::text AS section, 'catalog-only-v51-part2'::text AS object_identity,
    jsonb_build_object('server_version', current_setting('server_version'),
      'table_filter', 'learning_progress / maths_* / v3_* / v51_* in application schemas',
      'function_filter', 'non-extension application routines plus selected table trigger functions',
      'expressions_and_bodies', 'omitted; request only individually reviewed sanitized definitions if flagged',
      'dependency_limit', 'pg_depend cannot discover all PL/pgSQL/dynamic SQL references',
      'runtime_api_settings', 'SQL role settings do not prove active PostgREST configuration') AS metadata
  UNION ALL
  SELECT '01_schema', nspname, jsonb_build_object('owner', pg_get_userbyid(nspowner)) FROM app_schemas
  UNION ALL
  SELECT '01_relation_inventory', format('%I.%I', n.nspname, c.relname), jsonb_build_object(
    'kind', c.relkind, 'owner', pg_get_userbyid(c.relowner),
    'detailed_app_scope', c.oid IN (SELECT oid FROM tables))
  FROM pg_catalog.pg_class c JOIN app_schemas n ON n.oid = c.relnamespace
  WHERE c.relkind IN ('r','p','v','m','f') AND NOT EXISTS (
    SELECT 1 FROM pg_catalog.pg_depend d WHERE d.classid = 'pg_class'::regclass
      AND d.objid = c.oid AND d.deptype = 'e')
  UNION ALL
  SELECT '02_schema_acl', n.nspname, jsonb_build_object(
    'grantee', CASE WHEN a.grantee = 0 THEN 'PUBLIC' ELSE pg_get_userbyid(a.grantee) END,
    'privilege', a.privilege_type, 'grantable', a.is_grantable)
  FROM app_schemas n CROSS JOIN LATERAL aclexplode(coalesce(n.nspacl, acldefault('n', n.nspowner))) a
  UNION ALL
  SELECT '03_table', format('%I.%I', nspname, relname), jsonb_build_object(
    'kind', relkind, 'owner', pg_get_userbyid(relowner),
    'rls_enabled', relrowsecurity, 'rls_forced', relforcerowsecurity)
  FROM tables
  UNION ALL
  SELECT '04_column_structure', format('%I.%I.%I', c.nspname, c.relname, a.attname), jsonb_build_object(
    'type', format_type(a.atttypid, a.atttypmod), 'not_null', a.attnotnull,
    'identity', a.attidentity, 'generated', a.attgenerated, 'has_default', a.atthasdef,
    'position', a.attnum)
  FROM tables c JOIN pg_catalog.pg_attribute a ON a.attrelid = c.oid
  WHERE a.attnum > 0 AND NOT a.attisdropped
  UNION ALL
  SELECT '05_relation_acl', format('%I.%I', c.nspname, c.relname), jsonb_build_object(
    'grantee', CASE WHEN a.grantee = 0 THEN 'PUBLIC' ELSE pg_get_userbyid(a.grantee) END,
    'privilege', a.privilege_type, 'grantable', a.is_grantable)
  FROM (SELECT oid, nspname, relname, relowner, relacl FROM tables UNION ALL
        SELECT oid, nspname, relname, relowner, relacl FROM sequences) c
  CROSS JOIN LATERAL aclexplode(coalesce(c.relacl, acldefault(
    CASE WHEN c.oid IN (SELECT oid FROM sequences) THEN 's'::"char" ELSE 'r'::"char" END, c.relowner))) a
  UNION ALL
  SELECT '06_effective_table_privilege', format('%I.%I', c.nspname, c.relname), jsonb_build_object(
    'role', r.rolname, 'privilege', v.privilege,
    'allowed', has_table_privilege(r.oid, c.oid, v.privilege))
  FROM tables c CROSS JOIN client_roles r
  CROSS JOIN (VALUES ('SELECT'),('INSERT'),('UPDATE'),('DELETE'),('TRUNCATE'),('REFERENCES'),('TRIGGER')) v(privilege)
  UNION ALL
  SELECT '07_column_acl', format('%I.%I.%I', c.nspname, c.relname, col.attname), jsonb_build_object(
    'grantee', CASE WHEN a.grantee = 0 THEN 'PUBLIC' ELSE pg_get_userbyid(a.grantee) END,
    'privilege', a.privilege_type, 'grantable', a.is_grantable)
  FROM tables c JOIN pg_catalog.pg_attribute col ON col.attrelid = c.oid
  CROSS JOIN LATERAL aclexplode(col.attacl) a WHERE col.attnum > 0 AND NOT col.attisdropped
  UNION ALL
  SELECT '08_function', format('%I.%I(%s)', p.nspname, p.proname, oidvectortypes(p.proargtypes)), jsonb_build_object(
    'owner', pg_get_userbyid(p.proowner), 'security_definer', p.prosecdef,
    'language', l.lanname, 'kind', p.prokind, 'returns', format_type(p.prorettype, NULL),
    'search_path', (SELECT s FROM unnest(p.proconfig) s WHERE s LIKE 'search_path=%' LIMIT 1),
    'argument_defaults_count', p.pronargdefaults, 'body_exported', false)
  FROM functions p JOIN pg_catalog.pg_language l ON l.oid = p.prolang
  UNION ALL
  SELECT '09_function_acl', format('%I.%I(%s)', p.nspname, p.proname, oidvectortypes(p.proargtypes)), jsonb_build_object(
    'grantee', CASE WHEN a.grantee = 0 THEN 'PUBLIC' ELSE pg_get_userbyid(a.grantee) END,
    'privilege', a.privilege_type, 'grantable', a.is_grantable)
  FROM functions p CROSS JOIN LATERAL aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) a
  UNION ALL
  SELECT '10_effective_execute', format('%I.%I(%s)', p.nspname, p.proname, oidvectortypes(p.proargtypes)),
    jsonb_build_object('role', r.rolname, 'allowed', has_function_privilege(r.oid, p.oid, 'EXECUTE'))
  FROM functions p CROSS JOIN client_roles r
  UNION ALL
  SELECT '11_index', format('%I.%I', c.nspname, idx.relname), jsonb_build_object(
    'table', format('%I.%I', c.nspname, c.relname), 'unique', i.indisunique,
    'primary', i.indisprimary, 'valid', i.indisvalid, 'ready', i.indisready,
    'method', am.amname, 'key_attribute_numbers', i.indkey::text,
    'key_attribute_count', i.indnkeyatts, 'has_predicate', i.indpred IS NOT NULL,
    'has_expressions', i.indexprs IS NOT NULL)
  FROM tables c JOIN pg_catalog.pg_index i ON i.indrelid = c.oid
  JOIN pg_catalog.pg_class idx ON idx.oid = i.indexrelid
  JOIN pg_catalog.pg_am am ON am.oid = idx.relam
  UNION ALL
  SELECT '12_trigger', format('%I.%I.%I', c.nspname, c.relname, t.tgname), jsonb_build_object(
    'enabled', t.tgenabled, 'type_mask', t.tgtype,
    'function', format('%I.%I(%s)', n.nspname, p.proname, oidvectortypes(p.proargtypes)),
    'argument_count', t.tgnargs, 'has_when', t.tgqual IS NOT NULL,
    'constraint_trigger', t.tgconstraint <> 0)
  FROM triggers t JOIN tables c ON c.oid = t.tgrelid
  JOIN pg_catalog.pg_proc p ON p.oid = t.tgfoid JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
  UNION ALL
  SELECT '13_sequence', format('%I.%I', s.nspname, s.relname), jsonb_build_object(
    'owner', pg_get_userbyid(s.relowner), 'type', format_type(q.seqtypid, NULL),
    'increment', q.seqincrement, 'cycle', q.seqcycle)
  FROM sequences s JOIN pg_catalog.pg_sequence q ON q.seqrelid = s.oid
  UNION ALL
  SELECT '14_constraint_structure', format('%I.%I.%I', c.nspname, c.relname, k.conname), jsonb_build_object(
    'type', k.contype, 'validated', k.convalidated, 'deferrable', k.condeferrable,
    'initially_deferred', k.condeferred, 'columns', k.conkey,
    'referenced_relation', CASE WHEN rc.oid IS NULL THEN NULL ELSE format('%I.%I', rn.nspname, rc.relname) END,
    'referenced_columns', k.confkey, 'on_delete_code', k.confdeltype, 'on_update_code', k.confupdtype)
  FROM tables c JOIN pg_catalog.pg_constraint k ON k.conrelid = c.oid
  LEFT JOIN pg_catalog.pg_class rc ON rc.oid = k.confrelid
  LEFT JOIN pg_catalog.pg_namespace rn ON rn.oid = rc.relnamespace
  UNION ALL
  SELECT '15_policy_structure', format('%I.%I.%I', c.nspname, c.relname, p.polname), jsonb_build_object(
    'command', p.polcmd, 'permissive', p.polpermissive,
    'roles', (SELECT jsonb_agg(CASE WHEN r = 0 THEN 'PUBLIC' ELSE pg_get_userbyid(r) END) FROM unnest(p.polroles) r),
    'has_using', p.polqual IS NOT NULL, 'has_check', p.polwithcheck IS NOT NULL)
  FROM tables c JOIN pg_catalog.pg_policy p ON p.polrelid = c.oid
  UNION ALL
  SELECT '16_extension', e.extname, jsonb_build_object('version', e.extversion,
    'schema', n.nspname, 'owner', pg_get_userbyid(e.extowner), 'relocatable', e.extrelocatable)
  FROM pg_catalog.pg_extension e JOIN pg_catalog.pg_namespace n ON n.oid = e.extnamespace
  UNION ALL
  SELECT '17_crypto_availability', name, jsonb_build_object('default_version', default_version,
    'installed_version', installed_version) FROM pg_catalog.pg_available_extensions WHERE name = 'pgcrypto'
  UNION ALL
  SELECT '18_dependency', pg_describe_object(d.classid, d.objid, d.objsubid), jsonb_build_object(
    'depends_on', pg_describe_object(d.refclassid, d.refobjid, d.refobjsubid), 'type', d.deptype)
  FROM pg_catalog.pg_depend d WHERE
    EXISTS (SELECT 1 FROM objects o WHERE (d.classid = o.classid AND d.objid = o.oid)
      OR (d.refclassid = o.classid AND d.refobjid = o.oid))
  UNION ALL
  SELECT '19_role', r.rolname, jsonb_build_object('superuser', r.rolsuper,
    'inherit', r.rolinherit, 'bypass_rls', r.rolbypassrls, 'can_login', r.rolcanlogin)
  FROM pg_catalog.pg_roles r JOIN role_tree t ON t.oid = r.oid
  UNION ALL
  SELECT '20_role_membership', pg_get_userbyid(m.member), jsonb_build_object(
    'granted_role', pg_get_userbyid(m.roleid), 'admin_option', m.admin_option,
    'inherit_option', to_jsonb(m)->'inherit_option', 'set_option', to_jsonb(m)->'set_option')
  FROM pg_catalog.pg_auth_members m WHERE m.member IN (SELECT oid FROM role_tree)
  UNION ALL
  SELECT '21_default_acl', pg_get_userbyid(d.defaclrole), jsonb_build_object(
    'schema', CASE WHEN d.defaclnamespace = 0 THEN '<global>' ELSE n.nspname END,
    'object_type', d.defaclobjtype,
    'grantee', CASE WHEN a.grantee = 0 THEN 'PUBLIC' ELSE pg_get_userbyid(a.grantee) END,
    'privilege', a.privilege_type, 'grantable', a.is_grantable)
  FROM pg_catalog.pg_default_acl d LEFT JOIN pg_catalog.pg_namespace n ON n.oid = d.defaclnamespace
  CROSS JOIN LATERAL aclexplode(d.defaclacl) a
  WHERE d.defaclnamespace IN (SELECT oid FROM app_schemas) OR
    (d.defaclnamespace = 0 AND d.defaclrole IN (SELECT oid FROM role_roots))
  UNION ALL
  SELECT '22_api_schema_setting', CASE WHEN s.setrole = 0 THEN '<all roles>' ELSE pg_get_userbyid(s.setrole) END,
    jsonb_build_object('database_scope', CASE WHEN s.setdatabase = 0 THEN '<all databases>' ELSE '<current database>' END,
      'setting', entry)
  FROM pg_catalog.pg_db_role_setting s CROSS JOIN LATERAL unnest(s.setconfig) entry
  WHERE (s.setdatabase = 0 OR s.setdatabase = (SELECT oid FROM pg_catalog.pg_database WHERE datname = current_database()))
    AND entry LIKE 'pgrst.db_schemas=%'
)
SELECT section, object_identity, metadata FROM report
ORDER BY section, object_identity, metadata::text;
