// Offline package builder only. No database/network client or credentials.
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const root = path.resolve(__dirname, "..");
const reviewedRef = "vyxvemtevkxlwqzelghj";
const liveRefs = ["sfogrvedypgtxfvecmbx", "mbdelspbjusarbwlltol"];
const sources = {
  "supabase/v3-staging/001_secure_core.sql":
    "80ff825e0888d7e4a7aa44aaf0c96f09922eb88cba622184d64ce5f7c456f054",
  "supabase/v3-staging/002_catalog.sql":
    "26c1fe9447f67e1f775ac2bf726f6dee617fd66ec9bb856a276662fa3895116a",
  "supabase/v3-staging/004_compact_save_receipts.sql":
    "085f3d619bf4194e6c05fdf01dbd31e56a6b1a33cfde7110413a6933e901d905",
  "supabase/base-camp/001_parent_game_reset.sql":
    "97619e3fbc141de1f9a68b0ac3ee9e069f13676f6160a231923c066761ecb131",
  "supabase/synthetic/001_environment_marker.sql":
    "746c646cd176604c220fd418f78384d39676abdb8ad796e7c4e7cc7e5f7f0f6c",
};
const hash = (s) => crypto.createHash("sha256").update(s).digest("hex");
function body(file, read = (f) => fs.readFileSync(path.join(root, f), "utf8")) {
  const s = read(file);
  if (hash(s) !== sources[file])
    throw new Error("Reviewed SQL source changed: " + file);
  const begins = s.match(/^begin;$/gim) || [];
  const commits = s.match(/^commit;$/gim) || [];
  if (begins.length !== 1 || commits.length !== 1)
    throw new Error("Review SQL transaction boundaries: " + file);
  return s.replace(/^begin;$/im, "").replace(/^commit;$/im, "");
}
function prepare(projectRef = reviewedRef, read) {
  if (liveRefs.includes(projectRef) || projectRef !== reviewedRef)
    throw new Error(
      "Only the owner-confirmed separate synthetic project is reviewed",
    );
  const files = Object.keys(sources);
  const parts = files.map((f) => body(f, read));
  if ((parts[2].match(/sfogrvedypgtxfvecmbx/g) || []).length !== 2)
    throw new Error("Review compact migration target binding");
  // Only the generated empty-project copy is rebound; source migrations stay immutable.
  parts[2] = parts[2].replaceAll("sfogrvedypgtxfvecmbx", projectRef);
  const sql = `-- REVIEW BEFORE OWNER-RUN INSTALLATION. Target: ${projectRef} ONLY.
-- Not a live migration. No users, family links, credentials or progress are created.
-- SQL-editor project selection must be verified by the owner; a session flag does not prove physical hosting identity.
BEGIN;
SET LOCAL search_path='';
SET LOCAL lock_timeout='3s';
SET LOCAL statement_timeout='60s';
SELECT pg_advisory_xact_lock(hashtextextended('esa-synthetic-fresh-baseline',0));
DO $fresh$
DECLARE unexpected boolean; occupied boolean; storage_table text;
BEGIN
 IF current_user<>'postgres'
 OR current_setting('app.synthetic_fresh_install_reviewed',true) IS DISTINCT FROM 'yes'
 OR current_setting('app.synthetic_dashboard_ref',true) IS DISTINCT FROM '${projectRef}'
 THEN RAISE EXCEPTION 'Owner review and exact separate dashboard target required'; END IF;
 IF to_regnamespace('esa_test_private') IS NOT NULL THEN RAISE EXCEPTION 'Already installed: inspect, never rerun'; END IF;
 IF to_regclass('auth.users') IS NULL OR to_regclass('auth.identities') IS NULL
 OR to_regprocedure('auth.uid()') IS NULL OR to_regprocedure('auth.jwt()') IS NULL
 OR NOT EXISTS(SELECT 1 FROM pg_roles WHERE rolname='anon')
 OR NOT EXISTS(SELECT 1 FROM pg_roles WHERE rolname='authenticated')
 OR NOT EXISTS(SELECT 1 FROM pg_roles WHERE rolname='service_role')
 THEN RAISE EXCEPTION 'Managed Auth baseline missing; do not create substitute Auth objects'; END IF;
 LOCK TABLE auth.users,auth.identities IN SHARE MODE;
 IF EXISTS(SELECT 1 FROM auth.users) OR EXISTS(SELECT 1 FROM auth.identities)
 THEN RAISE EXCEPTION 'Empty project required; existing Auth records preserved'; END IF;
 -- Storage is not cloned or certified by this installer. Refuse existing buckets/uploads.
 FOREACH storage_table IN ARRAY ARRAY['storage.buckets','storage.objects'] LOOP
 IF to_regclass(storage_table) IS NOT NULL THEN
 EXECUTE format('LOCK TABLE %s IN SHARE MODE',storage_table);
 EXECUTE format('SELECT EXISTS(SELECT 1 FROM %s LIMIT 1)',storage_table) INTO occupied;
 IF occupied THEN RAISE EXCEPTION 'Empty project required; existing Storage records preserved'; END IF;
 END IF;
 END LOOP;
 -- Refuse even empty application relations/functions/types, not just known V3 names.
 SELECT EXISTS(SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
 WHERE n.nspname='public' AND NOT EXISTS(SELECT 1 FROM pg_depend d
 WHERE d.classid='pg_class'::regclass AND d.objid=c.oid AND d.refclassid='pg_extension'::regclass AND d.deptype='e'))
 OR EXISTS(SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
 WHERE n.nspname='public' AND NOT EXISTS(SELECT 1 FROM pg_depend d
 WHERE d.classid='pg_proc'::regclass AND d.objid=p.oid AND d.refclassid='pg_extension'::regclass AND d.deptype='e'))
 OR EXISTS(SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid=t.typnamespace
 WHERE n.nspname='public' AND NOT EXISTS(SELECT 1 FROM pg_depend d
 WHERE d.classid='pg_type'::regclass AND d.objid=t.oid AND d.refclassid='pg_extension'::regclass AND d.deptype='e'))
 INTO unexpected;
 IF unexpected THEN RAISE EXCEPTION 'Empty application schema required; all existing objects preserved'; END IF;
 IF EXISTS(SELECT 1 FROM pg_extension e JOIN pg_namespace n ON n.oid=e.extnamespace
 WHERE e.extname='pgcrypto' AND n.nspname<>'extensions')
 THEN RAISE EXCEPTION 'Review pgcrypto schema; do not move existing extensions'; END IF;
END $fresh$;
REVOKE CREATE ON SCHEMA public FROM PUBLIC,anon,authenticated,service_role;
SELECT set_config('app.v3.staging_authorized','yes',true),
 set_config('app.v3.staging_ref','${projectRef}',true);
${parts[0]}
${parts[1]}
${parts[2]}
SELECT set_config('app.base_camp_reset_reviewed','yes',true);
${parts[3]}
-- Fresh definitions above are source-hash-pinned and installed in this transaction.
-- Fingerprints here bind the marker to those exact newly created functions, not unknown pre-existing RPCs.
SELECT set_config('app.synthetic_setup_reviewed','yes',true),
 set_config('app.synthetic_expected_project_ref','${projectRef}',true),
 set_config('app.synthetic_identity_sha256',encode(extensions.digest(convert_to(pg_get_functiondef('public.v3_identity()'::regprocedure),'UTF8'),'sha256'),'hex'),true),
 set_config('app.synthetic_request_sha256',encode(extensions.digest(convert_to(pg_get_functiondef('public.v3_request(text,text,jsonb)'::regprocedure),'UTF8'),'sha256'),'hex'),true);
${parts[4]}
-- Supabase may grant browser/service roles via default privileges. Close every created object explicitly.
DO $grants$
DECLARE obj record;
BEGIN
 FOR obj IN SELECT c.relname FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
 WHERE n.nspname='public' AND c.relkind IN ('r','p') AND NOT EXISTS(SELECT 1 FROM pg_depend d WHERE d.classid='pg_class'::regclass AND d.objid=c.oid AND d.refclassid='pg_extension'::regclass AND d.deptype='e') LOOP
 EXECUTE format('REVOKE ALL ON TABLE public.%I FROM PUBLIC,anon,authenticated,service_role',obj.relname);
 END LOOP;
 FOR obj IN SELECT p.oid::regprocedure AS sig FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
 WHERE n.nspname='public' AND p.proname LIKE 'v3_%' AND NOT EXISTS(SELECT 1 FROM pg_depend d WHERE d.classid='pg_proc'::regclass AND d.objid=p.oid AND d.refclassid='pg_extension'::regclass AND d.deptype='e') LOOP
 EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC,anon,authenticated,service_role',obj.sig);
 END LOOP;
END $grants$;
GRANT EXECUTE ON FUNCTION public.v3_identity() TO anon,authenticated;
GRANT EXECUTE ON FUNCTION public.v3_role(),public.v3_set_pin(text),public.v3_unlock(text),public.v3_request(text,text,jsonb) TO authenticated;
DO $verify$
BEGIN
 IF public.v3_identity()->>'projectRef' IS DISTINCT FROM '${projectRef}'
 OR public.v3_identity()->>'environmentKind' IS DISTINCT FROM 'synthetic-test'
 OR public.v3_identity()->>'saveReceiptVersion' IS DISTINCT FROM '1'
 OR public.v3_identity()->>'syntheticOnly' IS DISTINCT FROM 'true'
 OR (SELECT count(*) FROM public.v3_catalog)<>40
 THEN RAISE EXCEPTION 'Fresh synthetic baseline postcondition failed'; END IF;
END $verify$;
COMMIT;
-- Aggregate public metadata only. Provider Auth/API acceptance is a separate step.
SELECT public.v3_identity() AS synthetic_identity;
`;
  return {
    sql,
    manifest: {
      target: projectRef,
      packageVersion: 1,
      purpose: "empty synthetic project only",
      sourceSha256: sources,
      sqlSha256: hash(sql),
      createsUsers: false,
      executesSql: false,
      requiresOwnerDashboardVerification: true,
    },
  };
}
function writePackage(out, projectRef = reviewedRef) {
  const result = prepare(projectRef);
  const destination = path.resolve(out);
  if (fs.existsSync(destination))
    throw new Error(
      "Output must be a new directory; never overwrite a reviewed package",
    );
  fs.mkdirSync(destination, { recursive: true });
  fs.writeFileSync(path.join(destination, "INSTALL-REVIEW.sql"), result.sql, {
    flag: "wx",
  });
  fs.writeFileSync(
    path.join(destination, "MANIFEST.json"),
    JSON.stringify(result.manifest, null, 2) + "\n",
    { flag: "wx" },
  );
  return result.manifest;
}
if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.length !== 2 || args[0] !== "--out")
    throw new Error(
      "Usage: node scripts/prepare-synthetic-baseline.cjs --out NEW_DIRECTORY",
    );
  console.log(JSON.stringify(writePackage(args[1]), null, 2));
}
module.exports = { prepare, writePackage, reviewedRef, sources, hash };
