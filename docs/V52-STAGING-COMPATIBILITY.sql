-- Owner-run documentation check ONLY: staging sfogrvedypgtxfvecmbx.
-- First verify the project ref in the Supabase dashboard URL; SQL markers alone
-- cannot prove the physical project. Run the WHOLE file in a new SQL Editor query.
-- No application RPCs, DDL, DML, account/PIN changes or learning-record reads.
-- query_to_xml below runs only fixed SELECT aggregates, guarded against absent
-- tables/columns and views. No supplied SQL or row contents are interpolated.
-- Source contract: codex/v3-adventure-build @ f0b2d50.
BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY;
SET LOCAL statement_timeout = '15s';
SET LOCAL lock_timeout = '3s';
WITH
required(rel, col, typ) AS (VALUES
 ('auth.users','id','uuid'),
 ('auth.users','email_confirmed_at','timestamptz'),
 ('public.maths_families','child_user_id','uuid'),
 ('public.maths_families','parent_user_id','uuid'),
 ('public.v3_environment','name','text'),
 ('public.v3_environment','project_ref','text'),
 ('public.v3_pins','user_id','uuid'),
 ('public.v3_pins','hash','text'),
 ('public.v3_pins','attempts','int4'),
 ('public.v3_pins','blocked_until','timestamptz'),
 ('public.v3_pins','generation','int4'),
 ('public.v3_unlocks','token_hash','bytea'),
 ('public.v3_unlocks','user_id','uuid'),
 ('public.v3_unlocks','generation','int4'),
 ('public.v3_unlocks','expires_at','timestamptz'),
 ('public.v3_progress','child_user_id','uuid'),
 ('public.v3_progress','revision','int8'),
 ('public.v3_progress','progress','jsonb'),
 ('public.v3_progress','updated_at','timestamptz'),
 ('public.v3_wallet','child_user_id','uuid'),
 ('public.v3_wallet','coins','numeric'),
 ('public.v3_wallet','bonus','numeric'),
 ('public.v3_wallet','active_seconds','numeric'),
 ('public.v3_wallet','redeemed','numeric'),
 ('public.v3_wallet','last_active','timestamptz'),
 ('public.v3_wallet','owned','jsonb'),
 ('public.v3_catalog','item_id','text'),
 ('public.v3_catalog','cost','int4'),
 ('public.v3_transactions','child_user_id','uuid'),
 ('public.v3_transactions','request_id','uuid'),
 ('public.v3_transactions','operation','text'),
 ('public.v3_transactions','payload','jsonb'),
 ('public.v3_transactions','result','jsonb'),
 ('public.v3_transactions','created_at','timestamptz')
),
shape AS (
 SELECT count(*) FILTER (WHERE a.attnum IS NULL OR a.atttypid <> to_regtype(r.typ)) AS missing,
        bool_and(c.relkind = 'r') AS ordinary_tables
 FROM required r
 LEFT JOIN pg_class c ON c.oid = to_regclass(r.rel)
 LEFT JOIN pg_attribute a ON a.attrelid = c.oid AND a.attname = r.col
                         AND a.attnum > 0 AND NOT a.attisdropped
),
gate AS (
 SELECT missing = 0 AND coalesce(ordinary_tables,false)
        AND current_user = 'postgres'
        AND EXISTS (SELECT 1 FROM pg_roles WHERE rolname=current_user AND (rolsuper OR rolbypassrls)) AS ok
 FROM shape
),
expected_routines(sig, body_md5, definer, lang) AS (VALUES
 ('public.v3_identity()','0ca4580d09f789ee98aeb962609a3bc5',true,'sql'),
 ('public.v3_role()','7061cb7b561a2bf16d8fbef7a6f30d7b',true,'plpgsql'),
 ('public.v3_set_pin(text)','b1659952c515a28628c1cb75d6bd9dbd',true,'plpgsql'),
 ('public.v3_unlock(text)','892ecea7a4b5ac8d14852b7d59dc44ed',true,'plpgsql'),
 ('public.v3_request(text,text,jsonb)','964363b36b05b93dab310d6ae4c9e25c',true,'plpgsql'),
 ('public.v3_admin_import(uuid,jsonb)','a1d3a5958ad9c360d0fd9b2f6eab6159',false,'plpgsql')
),
routines AS (
 SELECT count(*) FILTER (WHERE p.oid IS NULL) AS absent,
        count(*) FILTER (WHERE p.oid IS NOT NULL AND
          (md5(p.prosrc) <> e.body_md5 OR p.prosecdef <> e.definer
           OR l.lanname <> e.lang OR p.prorettype <> to_regtype(
             CASE WHEN e.sig='public.v3_admin_import(uuid,jsonb)' THEN 'void' ELSE 'jsonb' END)
           OR NOT coalesce(p.proconfig @> ARRAY['search_path=""'],false))) AS changed
 FROM expected_routines e LEFT JOIN pg_proc p ON p.oid=to_regprocedure(e.sig)
 LEFT JOIN pg_language l ON l.oid=p.prolang
),
samples(key, doc) AS (
 SELECT 'accounts', CASE WHEN ok THEN query_to_xml(
  'SELECT count(*) AS n, coalesce(bool_and(email_confirmed_at IS NOT NULL),false) AS ok FROM auth.users',
  false,false,'') END FROM gate
 UNION ALL SELECT 'families', CASE WHEN ok THEN query_to_xml(
  'SELECT count(*) AS n,
    count(DISTINCT f.child_user_id)=2 AND count(DISTINCT f.parent_user_id)=2
    AND count(DISTINCT u.id)=2 AND count(DISTINCT p.id)=2
    AND coalesce(bool_and(f.child_user_id<>f.parent_user_id),false)
    AND NOT EXISTS (SELECT 1 FROM public.maths_families a JOIN public.maths_families b
                    ON a.child_user_id=b.parent_user_id) AS ok
   FROM public.maths_families f LEFT JOIN auth.users u ON u.id=f.child_user_id
   LEFT JOIN auth.users p ON p.id=f.parent_user_id',
  false,false,'') END FROM gate
 UNION ALL SELECT 'pins', CASE WHEN ok THEN query_to_xml(
  'SELECT count(*) AS n, count(DISTINCT p.user_id)=4 AND coalesce(bool_and(EXISTS
    (SELECT 1 FROM public.maths_families f WHERE f.child_user_id=p.user_id OR f.parent_user_id=p.user_id)),false) AS ok
   FROM public.v3_pins p',
  false,false,'') END FROM gate
 UNION ALL SELECT 'environment', CASE WHEN ok THEN query_to_xml(
  'SELECT count(*) AS n, coalesce(bool_and(name=''jaxon-maths-v3-staging''
   AND project_ref=''sfogrvedypgtxfvecmbx''),false) AS ok FROM public.v3_environment',
  false,false,'') END FROM gate
 UNION ALL SELECT 'catalog', CASE WHEN ok THEN query_to_xml(
  $catalog$WITH expected(item_id,cost) AS (VALUES ('helmet',100),
('cap',45),
('crown',450),
('wizardhat',240),
('hardhat',110),
('headphones',160),
('tophat',180),
('jacket',150),
('hoodie',90),
('armour',420),
('suit',220),
('cape',300),
('spacesuit',520),
('ninja',330),
('wings',250),
('jetpack',550),
('rucksack',100),
('shield',230),
('parachute',210),
('dragon',650),
('glasses',70),
('medal',120),
('watch',100),
('scarf',85),
('gloves',75),
('sword',190),
('wand',210),
('fox',320),
('dog',280),
('cat',230),
('frog',180),
('robot',450),
('axolotl',380),
('bee',160),
('forestbg',140),
('desertbg',160),
('spacebg',310),
('castlebg',230),
('mountainbg',240),
('neonbg',350))
   SELECT (SELECT count(*) FROM public.v3_catalog) AS n,
   NOT EXISTS (SELECT 1 FROM expected e FULL JOIN public.v3_catalog c USING(item_id)
               WHERE e.item_id IS NULL OR c.item_id IS NULL OR e.cost IS DISTINCT FROM c.cost) AS ok$catalog$,
  false,false,'') END FROM gate
 UNION ALL SELECT 'sql_history', CASE WHEN
  current_user='postgres' AND EXISTS (SELECT 1 FROM pg_class
    WHERE oid=to_regclass('supabase_migrations.schema_migrations') AND relkind='r')
  THEN query_to_xml('SELECT count(*) AS n, true AS ok FROM supabase_migrations.schema_migrations',
                    false,false,'') END
 UNION ALL SELECT 'auth_history', CASE WHEN
  current_user='postgres' AND EXISTS (SELECT 1 FROM pg_class
    WHERE oid=to_regclass('auth.schema_migrations') AND relkind='r')
  THEN query_to_xml('SELECT count(*) AS n, true AS ok FROM auth.schema_migrations',
                    false,false,'') END
),
stats AS (
 SELECT s.key, x.n, x.ok FROM samples s
 LEFT JOIN LATERAL XMLTABLE('/table/row' PASSING s.doc
   COLUMNS n bigint PATH 'n', ok boolean PATH 'ok') x ON true
),
family_constraints AS (
 SELECT
  EXISTS (SELECT 1 FROM pg_constraint k JOIN pg_attribute a
          ON a.attrelid=k.conrelid AND k.conkey=ARRAY[a.attnum]
          WHERE k.conrelid=to_regclass('public.maths_families') AND k.contype='p'
            AND a.attname='child_user_id') AS child_pk,
  (SELECT count(*) FROM pg_constraint k
   JOIN pg_attribute a ON a.attrelid=k.conrelid AND k.conkey=ARRAY[a.attnum]
   JOIN pg_attribute b ON b.attrelid=k.confrelid AND k.confkey=ARRAY[b.attnum]
   WHERE k.conrelid=to_regclass('public.maths_families') AND k.contype='f' AND k.convalidated
     AND k.confrelid=to_regclass('auth.users') AND b.attname='id'
     AND a.attname IN ('child_user_id','parent_user_id'))=2 AS auth_fks,
  EXISTS (SELECT 1 FROM pg_attribute WHERE attrelid=to_regclass('public.maths_families')
          AND attname='parent_user_id' AND attnotnull AND NOT attisdropped) AS parent_required
),
findings(ord, check_name, status, detail) AS (
 SELECT 1, 'Read-only inspection', CASE WHEN ok THEN 'PASS' ELSE 'FAIL' END,
  'Read-only snapshot; aggregate reads require postgres with RLS bypass and the expected base-table columns.' FROM gate
 UNION ALL SELECT 2, 'Staging marker (owner must verify dashboard ref)',
  CASE WHEN n IS NULL THEN 'REVIEW' WHEN n=1 AND ok THEN 'PASS' ELSE 'FAIL' END,
  'Expected exactly one jaxon-maths-v3-staging marker for sfogrvedypgtxfvecmbx; a marker is not independent project identity.'
 FROM stats WHERE key='environment'
 UNION ALL SELECT 3, 'Installed staging table contract',
  CASE WHEN missing=0 AND coalesce(ordinary_tables,false) THEN 'PASS' ELSE 'FAIL' END,
  'Missing or mistyped required columns: '||missing||'. Existing data and additional columns are not altered.' FROM shape
 UNION ALL SELECT 4, 'Migration footprints 001 / 003',
  CASE WHEN absent=0 AND changed=0 THEN 'PASS' ELSE 'REVIEW' END,
  'Missing signatures: '||absent||'; changed routine bodies/attributes: '||changed||
  '. Fingerprints compare repository source, not execution; whitespace drift also needs review.' FROM routines
 UNION ALL SELECT 5, 'Migration history',
  'REVIEW', 'SQL history rows: '||coalesce((SELECT n::text FROM stats WHERE key='sql_history'),'unavailable')||
  '; Auth history rows: '||coalesce((SELECT n::text FROM stats WHERE key='auth_history'),'unavailable')||
  '. SQL Editor installs may be untracked; history counts alone do not establish migration versions.'
 UNION ALL SELECT 6, 'Four existing Auth accounts',
  CASE WHEN n IS NULL THEN 'REVIEW' WHEN n=4 AND ok THEN 'PASS' ELSE 'FAIL' END,
  'Accounts: '||coalesce(n::text,'not inspected')||'. PASS requires four email-confirmed accounts; no account fields are returned.'
 FROM stats WHERE key='accounts'
 UNION ALL SELECT 7, 'Two independent linked families',
  CASE WHEN n IS NULL THEN 'REVIEW' WHEN n=2 AND ok THEN 'PASS' ELSE 'FAIL' END,
  'Families: '||coalesce(n::text,'not inspected')||'. PASS requires distinct parents/learners, valid Auth links and no mixed roles.'
 FROM stats WHERE key='families'
 UNION ALL SELECT 8, 'Family-table preservation shape',
  CASE WHEN child_pk AND auth_fks AND parent_required THEN 'PASS' ELSE 'REVIEW' END,
  'Expected staging child UUID primary key, required parent UUID and two validated Auth foreign keys. No production-style family id is required.'
 FROM family_constraints
 UNION ALL SELECT 9, 'Existing server PIN coverage',
  CASE WHEN n IS NULL THEN 'REVIEW' WHEN n=4 AND ok THEN 'PASS' ELSE 'REVIEW' END,
  'PIN rows: '||coalesce(n::text,'not inspected')||'. Only row count/link coverage read; no hashes, PIN validation, enrollment or reset.'
 FROM stats WHERE key='pins'
 UNION ALL SELECT 10, 'Catalogue / migration 002 footprint',
  CASE WHEN n IS NULL THEN 'REVIEW' WHEN n=40 AND ok THEN 'PASS' ELSE 'REVIEW' END,
  'Catalogue rows: '||coalesce(n::text,'not inspected')||'. PASS requires all 40 exact repository item/price pairs; no wallet or learning rows read.'
 FROM stats WHERE key='catalog'
 UNION ALL SELECT 11, 'Auth service and API configuration metadata', 'REVIEW',
  'Auth schema presence/history is observable; SQL cannot certify live signup policy, email provider, redirects, password AMR/JWT or active API exposure. Do not change settings.'
 UNION ALL SELECT 12, 'Existing V5.2 installation overlap',
  CASE WHEN to_regclass('public.v3_activation') IS NULL AND to_regnamespace('v51_private') IS NULL THEN 'PASS' ELSE 'REVIEW' END,
  'Any activation/private-archive objects require a specific drift review. Their contents are not read and no activation function is called.'
 UNION ALL SELECT 13, 'Unmodified V5.2 production installer on staging', 'FAIL',
  'Not compatible as-is: production ref/legacy tables/family shape and CREATE collisions. Never run it, spoof production identity, or drop/recreate staging.'
 UNION ALL SELECT 14, 'Preservation-only staging upgrade feasibility', 'REVIEW',
  'Feasible in principle through a new reviewed staging-specific upgrade; no such upgrade is supplied. Requires preservation/rollback design for PINs, progress, revisions, wallet and retry history plus staging-only identity/build handling.'
)
SELECT check_name AS "Check", status AS "Result", detail AS "Details"
FROM findings ORDER BY ord;
ROLLBACK;
