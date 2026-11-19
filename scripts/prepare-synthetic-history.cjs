// Offline, exact-target package for the authorised fictional test service only.
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const root = path.resolve(__dirname, "..");
const projectRef = "vyxvemtevkxlwqzelghj";
const sourceFile = "supabase/history/001_retained_history.sql";
const sourceSha256 =
  "3cdad342ebfecff2c28c32299573cbaa679c06d86b099e1a54a988a2f916f185";
const hash = (s) => crypto.createHash("sha256").update(s).digest("hex");
function prepare(read = (f) => fs.readFileSync(path.join(root, f), "utf8")) {
  const source = read(sourceFile);
  if (hash(source) !== sourceSha256)
    throw new Error("Reviewed history source changed; review before packaging");
  if (
    (source.match(/^BEGIN;$/gm) || []).length !== 1 ||
    (source.match(/^COMMIT;$/gm) || []).length !== 1
  )
    throw new Error("Review history transaction boundaries");
  const body = source.replace(/^BEGIN;$/m, "").replace(/^COMMIT;$/m, "");
  const sql = `-- AUTHORISED SYNTHETIC TEST PROJECT ONLY: ${projectRef}.
-- Additive history installation remains DISABLED. No users, PINs, progress or wallets are changed.
-- Run this WHOLE file once in the new test project's postgres SQL-editor session.
BEGIN;
SET LOCAL search_path='';
SET LOCAL lock_timeout='3s';
SET LOCAL statement_timeout='30s';
SELECT pg_advisory_xact_lock(hashtextextended('esa-synthetic-history-install',0));
DO $target$
DECLARE identity jsonb;
BEGIN
 IF current_user<>'postgres' THEN RAISE EXCEPTION 'Test history requires the postgres SQL-editor role'; END IF;
 identity:=public.v3_identity();
 IF identity->>'projectRef' IS DISTINCT FROM '${projectRef}'
 OR identity->>'syntheticOnly' IS DISTINCT FROM 'true'
 OR identity->>'environmentKind' IS DISTINCT FROM 'synthetic-test'
 OR identity->>'syntheticContractVersion' IS DISTINCT FROM '1'
 THEN RAISE EXCEPTION 'Exact synthetic test identity required; never run on live'; END IF;
 IF to_regclass('public.v3_history_settings') IS NOT NULL THEN RAISE EXCEPTION 'History already installed; inspect instead of rerunning'; END IF;
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
SET LOCAL app.history_storage_reviewed='yes';
SET LOCAL app.history_expected_project_ref='${projectRef}';
${body}
DO $preserve$
DECLARE saved record; value text;
BEGIN
 FOR saved IN SELECT * FROM pg_temp.esa_history_before LOOP
 EXECUTE format('SELECT encode(extensions.digest(convert_to(coalesce(jsonb_agg(to_jsonb(t) ORDER BY to_jsonb(t)::text),''[]''::jsonb)::text,''UTF8''),''sha256''),''hex'') FROM public.%I t',saved.table_name) INTO value;
 IF value IS DISTINCT FROM saved.fingerprint THEN RAISE EXCEPTION 'Application rows changed during test history installation; rolling back'; END IF;
 END LOOP;
 IF NOT EXISTS(SELECT 1 FROM public.v3_history_settings WHERE singleton AND NOT enabled AND NOT write_enabled AND client_release IS NULL)
 OR EXISTS(SELECT 1 FROM public.v3_history_nodes) OR EXISTS(SELECT 1 FROM public.v3_history_roots)
 THEN RAISE EXCEPTION 'Expected disabled empty history installation'; END IF;
 IF public.v3_identity()->>'syntheticOnly' IS DISTINCT FROM 'true'
 OR public.v3_identity()->>'projectRef' IS DISTINCT FROM '${projectRef}'
 OR public.v3_identity()->>'progressStorageVersion' IS DISTINCT FROM '1'
 THEN RAISE EXCEPTION 'Test identity/capability preservation failed'; END IF;
END $preserve$;
COMMIT;
SELECT jsonb_build_object('projectRef',public.v3_identity()->>'projectRef','syntheticOnly',true,
 'historyInstalled',true,'historyEnabled',(SELECT enabled FROM public.v3_history_settings WHERE singleton),
 'historyWritesEnabled',(SELECT write_enabled FROM public.v3_history_settings WHERE singleton),
 'originalRowsPreservedDuringInstall',true,'progressStorageVersion',public.v3_identity()->'progressStorageVersion') AS test_history_install;
`;
  return {
    sql,
    manifest: {
      projectRef,
      sourceFile,
      sourceSha256,
      sqlSha256: hash(sql),
      activationIncluded: false,
      accountChangesIncluded: false,
      existingRowsComparedInsideTransaction: true,
    },
  };
}
if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.length !== 2 || args[0] !== "--out")
    throw new Error(
      "Usage: node scripts/prepare-synthetic-history.cjs --out NEW_DIRECTORY",
    );
  const result = prepare();
  const out = path.resolve(args[1]);
  if (fs.existsSync(out))
    throw new Error("Never overwrite an existing review package");
  fs.mkdirSync(out, { recursive: true });
  fs.writeFileSync(path.join(out, "INSTALL-TEST-HISTORY.sql"), result.sql, {
    flag: "wx",
  });
  fs.writeFileSync(
    path.join(out, "MANIFEST.json"),
    JSON.stringify(result.manifest, null, 2) + "\n",
    { flag: "wx" },
  );
  console.log(JSON.stringify(result.manifest, null, 2));
}
module.exports = { prepare, sourceFile, sourceSha256, hash };
