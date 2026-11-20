// Offline preparation only. Never connects to or executes against a database.
const fs = require("node:fs");
const path = require("node:path");
const {
  contractExpression,
  hash,
} = require("../tests/helpers/main-history-contract.cjs");
const root = path.resolve(__dirname, "..");
const projectRef = "sfogrvedypgtxfvecmbx";
const sourceFile = "supabase/history/001_retained_history.sql";
const sourceSha256 =
  "3cdad342ebfecff2c28c32299573cbaa679c06d86b099e1a54a988a2f916f185";
const baselineFile = "supabase/history/main-review/SOURCE-BASELINE.json";
const baselineSha256 =
  "9094588694cbd6e16f95dea326c72fada3adf61f3140c66e3adc511a4296e7c8";
const lit = (s) => "'" + String(s).replaceAll("'", "''") + "'";
const tables = [
  "maths_families",
  "v3_environment",
  "v3_pins",
  "v3_unlocks",
  "v3_progress",
  "v3_wallet",
  "v3_catalog",
  "v3_transactions",
  "v3_game_resets",
  "v3_game_requests",
];
function contractGuard(expected, label) {
  return `DO $contracts$
DECLARE expected jsonb; signature text; actual jsonb;
BEGIN
 FOR signature,expected IN SELECT key,value FROM jsonb_each(${lit(JSON.stringify(expected))}::jsonb) LOOP
  SELECT ${contractExpression} INTO actual FROM pg_proc p JOIN pg_language l ON l.oid=p.prolang WHERE p.oid=to_regprocedure(signature);
  IF actual IS NULL OR (actual-'bodyHash') IS DISTINCT FROM expected->'metadata'
   OR NOT (expected->'bodyHashes' ? (actual->>'bodyHash'))
  THEN RAISE EXCEPTION '${label} routine contract mismatch; stop for review'; END IF;
 END LOOP;
END $contracts$;`;
}
const targetGuard = `DO $target$
DECLARE name text; role_name text; relation oid;
BEGIN
 IF current_user<>'postgres' OR current_setting('session_replication_role')<>'origin'
 OR (SELECT count(*) FROM public.v3_environment)<>1
 OR (SELECT project_ref FROM public.v3_environment) IS DISTINCT FROM '${projectRef}'
 THEN RAISE EXCEPTION 'Exact Main project and postgres operator required'; END IF;
 IF to_regclass('public.v3_history_settings') IS NOT NULL
 OR to_regclass('public.v3_history_nodes') IS NOT NULL OR to_regclass('public.v3_history_roots') IS NOT NULL
 OR to_regprocedure('public.v3_request_before_history(text,text,jsonb)') IS NOT NULL
 OR to_regprocedure('public.v3_identity_before_history()') IS NOT NULL
 THEN RAISE EXCEPTION 'Fresh absent-history state required; inspect instead of rerunning'; END IF;
 FOREACH name IN ARRAY ARRAY[${tables.map(lit).join(",")}] LOOP
  relation:=to_regclass('public.'||name);
  IF relation IS NULL OR NOT (SELECT relrowsecurity FROM pg_class WHERE oid=relation)
  THEN RAISE EXCEPTION 'Required isolated application table missing'; END IF;
  FOREACH role_name IN ARRAY ARRAY['anon','authenticated','service_role'] LOOP
   IF has_table_privilege(role_name,relation,'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER')
   OR has_any_column_privilege(role_name,relation,'SELECT,INSERT,UPDATE,REFERENCES')
   THEN RAISE EXCEPTION 'Unexpected application table or column grant; review permissions'; END IF;
  END LOOP;
 END LOOP;
 IF to_regclass('auth.users') IS NULL OR to_regclass('auth.identities') IS NULL
 THEN RAISE EXCEPTION 'Expected Auth preservation scope missing'; END IF;
END $target$;`;
const activityGuard = `DO $activity$
BEGIN
 IF (SELECT max(updated_at) FROM public.v3_progress) IS DISTINCT FROM '2026-11-15T20:24:51.624774Z'::timestamptz
 OR (SELECT max(created_at) FROM public.v3_transactions) IS DISTINCT FROM '2026-11-15T20:24:51.624774Z'::timestamptz
 OR (SELECT max(last_active) FROM public.v3_wallet) IS DISTINCT FROM '2026-10-28T11:39:25.933273Z'::timestamptz
 OR (SELECT max(created_at) FROM public.v3_game_resets) IS NOT NULL
 THEN RAISE EXCEPTION 'Main activity differs from the owner-reviewed checkpoint; preserve work and review'; END IF;
END $activity$;`;
// Hash each row first, then a sorted multiset of hashes. Unknown columns and duplicate rows participate.
const fingerprintSql =
  "SELECT encode(extensions.digest(convert_to(coalesce(string_agg(row_hash,',' ORDER BY row_hash),''),'UTF8'),'sha256'),'hex') FROM (SELECT encode(extensions.digest(convert_to(to_jsonb(t)::text,'UTF8'),'sha256'),'hex') AS row_hash FROM %I.%I t) rows";
const capture = `CREATE TEMP TABLE esa_main_history_before(schema_name text,table_name text,fingerprint text NOT NULL,PRIMARY KEY(schema_name,table_name)) ON COMMIT DROP;
DO $capture$
DECLARE item record; value text;
BEGIN
 FOR item IN SELECT n.nspname,c.relname FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
 WHERE c.relkind IN ('r','p') AND (n.nspname IN ('public','v52_staging_private') OR (n.nspname='auth' AND c.relname IN ('users','identities')))
 ORDER BY n.nspname,c.relname LOOP
  EXECUTE format('LOCK TABLE %I.%I IN SHARE MODE',item.nspname,item.relname);
  EXECUTE format(${lit(fingerprintSql)},item.nspname,item.relname) INTO value;
  INSERT INTO pg_temp.esa_main_history_before VALUES(item.nspname,item.relname,value);
 END LOOP;
END $capture$;`;
const preserve = `DO $preserve$
DECLARE saved record; value text;
BEGIN
 FOR saved IN SELECT * FROM pg_temp.esa_main_history_before LOOP
  EXECUTE format(${lit(fingerprintSql)},saved.schema_name,saved.table_name) INTO value;
  IF value IS DISTINCT FROM saved.fingerprint THEN RAISE EXCEPTION 'Original rows changed; rolling back the entire installation'; END IF;
 END LOOP;
 IF (SELECT count(*) FROM public.v3_history_settings)<>1
 OR NOT EXISTS(SELECT 1 FROM public.v3_history_settings WHERE singleton AND NOT enabled AND NOT write_enabled AND client_release IS NULL)
 OR EXISTS(SELECT 1 FROM public.v3_history_nodes) OR EXISTS(SELECT 1 FROM public.v3_history_roots)
 THEN RAISE EXCEPTION 'Disabled empty history required before commit'; END IF;
 IF public.v3_identity()->>'projectRef' IS DISTINCT FROM '${projectRef}'
 OR public.v3_identity()->>'progressStorageVersion' IS DISTINCT FROM '1'
 THEN RAISE EXCEPTION 'Existing identity and V1 capability must be preserved'; END IF;
END $preserve$;`;
function prepare(read = (f) => fs.readFileSync(path.join(root, f), "utf8")) {
  const source = read(sourceFile);
  if (hash(read(baselineFile)) !== baselineSha256)
    throw new Error("Reviewed baseline contracts changed");
  const baseline = JSON.parse(read(baselineFile));
  if (hash(source) !== sourceSha256)
    throw new Error("Reviewed history source changed");
  for (const [file, digest] of Object.entries(baseline.sourceHashes)) {
    if (hash(read(file)) !== digest)
      throw new Error("Reviewed baseline source changed: " + file);
  }
  if (
    baseline.projectRef !== projectRef ||
    (source.match(/^BEGIN;$/gm) || []).length !== 1 ||
    (source.match(/^COMMIT;$/gm) || []).length !== 1
  )
    throw new Error("Review Main identity and transaction boundaries");
  const settings = `SET LOCAL search_path='';
SET LOCAL lock_timeout='3s';
SET LOCAL statement_timeout='30s';
SET LOCAL timezone='UTC';
SET LOCAL datestyle='ISO,YMD';
SET LOCAL intervalstyle='postgres';
SET LOCAL extra_float_digits=3;`;
  const before = contractGuard(baseline.before, "Existing");
  const precheckSql = `-- MAIN READ ONLY catalogue/aggregate review. No learner records or routine bodies returned.
BEGIN READ ONLY;
${settings}
${targetGuard}
${before}
${activityGuard}
SELECT jsonb_build_object('projectRef','${projectRef}','sourceContractsMatch',true,'tableAndColumnGrantsDenied',true,'activityMatchesReviewedCheckpoint',true,'historyAbsent',true) AS main_preservation_precheck;
COMMIT;
`;
  const sql = `-- REVIEW PACKAGE ONLY. Owner approval for this exact file is required before use on MAIN.
-- INSTALLS DISABLED ONLY. Does not activate history or migrate learner rows.
-- Do not run unless the scoped backup and operational review are accepted and devices are saved/closed.
-- In this SAME session, separately set app.main_history_install_approved='yes' only after specific approval.
BEGIN;
${settings}
DO $approval$ BEGIN
 IF current_setting('app.main_history_install_approved',true) IS DISTINCT FROM 'yes'
 THEN RAISE EXCEPTION 'Specific Main disabled-installation approval required'; END IF;
END $approval$;
SELECT pg_advisory_xact_lock(hashtextextended('esa-main-history-maintenance',0));
${targetGuard}
${capture}
-- Repeat identity/grant/contract/activity review under the preservation locks.
${targetGuard}
${before}
${activityGuard}
SET LOCAL app.history_storage_reviewed='yes';
SET LOCAL app.history_expected_project_ref='${projectRef}';
${source.replace(/^BEGIN;$/m, "").replace(/^COMMIT;$/m, "")}
${preserve}
${contractGuard(baseline.installed, "Installed")}
DO $newtables$ DECLARE name text; role_name text; relation oid; BEGIN
 FOREACH name IN ARRAY ARRAY[${[...tables, "v3_history_settings", "v3_history_nodes", "v3_history_roots"].map(lit).join(",")}] LOOP
  relation:=to_regclass('public.'||name);
  IF relation IS NULL OR NOT (SELECT relrowsecurity FROM pg_class WHERE oid=relation) THEN RAISE EXCEPTION 'New history RLS required'; END IF;
  FOREACH role_name IN ARRAY ARRAY['anon','authenticated','service_role'] LOOP
   IF has_table_privilege(role_name,relation,'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER')
   OR has_any_column_privilege(role_name,relation,'SELECT,INSERT,UPDATE,REFERENCES')
   THEN RAISE EXCEPTION 'Game and history tables must remain private'; END IF;
  END LOOP;
 END LOOP;
END $newtables$;
SELECT jsonb_build_object('projectRef','${projectRef}','transactionChecksPassed',true,'originalRowsPreserved',true,'historyEnabled',false,'historyWritesEnabled',false,'progressStorageVersion',1) AS main_history_install_checks;
-- Accept only if the complete transaction, including this COMMIT, succeeds without errors.
COMMIT;
`;
  return {
    sql,
    precheckSql,
    manifest: {
      projectRef,
      sourceFile,
      sourceSha256,
      baselineSha256: hash(read(baselineFile)),
      sqlSha256: hash(sql),
      precheckSqlSha256: hash(precheckSql),
      activationIncluded: false,
      ownerApprovalRequired: true,
      preservationScope:
        "All pre-existing public/v52_staging_private ordinary/partitioned tables plus auth.users and auth.identities; row contents checked inside transaction",
      baselineSourceOnly: true,
    },
  };
}
function writePackage(out) {
  const p = prepare();
  if (fs.existsSync(out))
    throw new Error("Never overwrite a reviewed Main package");
  fs.mkdirSync(out, { recursive: true });
  for (const [file, text] of Object.entries({
    "INSTALL-MAIN-HISTORY.sql": p.sql,
    "READ-ONLY-MAIN-SAFEGUARDS.sql": p.precheckSql,
    "MANIFEST.json": JSON.stringify(p.manifest, null, 2) + "\n",
  }))
    fs.writeFileSync(path.join(out, file), text, { flag: "wx" });
  return p;
}
if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.length !== 2 || args[0] !== "--out")
    throw new Error(
      "Usage: node scripts/prepare-main-history-preservation.cjs --out NEW_DIRECTORY",
    );
  console.log(
    JSON.stringify(writePackage(path.resolve(args[1])).manifest, null, 2),
  );
}
module.exports = {
  prepare,
  writePackage,
  sourceFile,
  sourceSha256,
  baselineFile,
};
