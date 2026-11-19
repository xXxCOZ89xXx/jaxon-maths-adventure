// Offline package only; current test client is held at the reviewed deployed version.
const fs = require("node:fs");
const path = require("node:path");
const installer = require("./prepare-synthetic-history.cjs");
const root = path.resolve(__dirname, "..");
const projectRef = "vyxvemtevkxlwqzelghj";
const deployedClient = "cbee972f7e176471611e1749c8f48cac2aec0d44";
const sourceFile = "supabase/history/002_enable_retained_history.sql";
const sourceSha256 =
  "2d476e63b98e0290d1a0ee1051f3e5a9576fdaaeb009a731a7dcbfacc90f0b2d";
const installedPackageSha256 =
  "b51a27fa5299af28dbe3bcbf968abe46e0f20f79b46b026c1148db6909ed385e";
function once(s, before, after) {
  if (s.split(before).length !== 2)
    throw new Error("Review activation envelope transformation");
  return s.replace(before, () => after);
}
function prepare(
  client = deployedClient,
  read = (f) => fs.readFileSync(path.join(root, f), "utf8"),
) {
  if (client !== deployedClient)
    throw new Error("Review actual deployed test client before activation");
  const source = read(sourceFile);
  if (installer.hash(source) !== sourceSha256)
    throw new Error("Reviewed activation source changed");
  if (
    (source.match(/^BEGIN;$/gm) || []).length !== 1 ||
    (source.match(/^COMMIT;$/gm) || []).length !== 1
  )
    throw new Error("Review activation transaction boundaries");
  const original = installer.prepare(read);
  if (original.manifest.sqlSha256 !== installedPackageSha256)
    throw new Error("Reviewed preservation envelope changed");
  const installBody = read(installer.sourceFile)
    .replace(/^BEGIN;$/m, "")
    .replace(/^COMMIT;$/m, "");
  const activateBody = source
    .replace(/^BEGIN;$/m, "")
    .replace(/^COMMIT;$/m, "");
  let sql = original.sql;
  sql = once(
    sql,
    "-- Additive history installation remains DISABLED. No users, PINs, progress or wallets are changed.",
    "-- Separate TEST history activation. Original application rows are fingerprinted/preserved.\n-- Reviewed running client: " +
      client +
      ". Test automatic builds are held pending this step.",
  );
  sql = once(
    sql,
    "esa-synthetic-history-install",
    "esa-synthetic-history-activate",
  );
  sql = once(
    sql,
    "IF to_regclass('public.v3_history_settings') IS NOT NULL THEN RAISE EXCEPTION 'History already installed; inspect instead of rerunning'; END IF;",
    `IF to_regclass('public.v3_history_settings') IS NULL THEN RAISE EXCEPTION 'Reviewed disabled history installation required'; END IF;
 IF (SELECT count(*) FROM public.v3_history_settings)<>1 OR NOT EXISTS(SELECT 1 FROM public.v3_history_settings WHERE singleton AND NOT enabled AND NOT write_enabled AND client_release IS NULL)
 THEN RAISE EXCEPTION 'Fresh disabled history required; inspect instead of rerunning activation'; END IF;`,
  );
  sql = once(
    sql,
    `SET LOCAL app.history_storage_reviewed='yes';\nSET LOCAL app.history_expected_project_ref='${projectRef}';\n${installBody}`,
    `SET LOCAL app.history_cutover_reviewed='yes';\nSET LOCAL app.history_expected_project_ref='${projectRef}';\nSET LOCAL app.history_client_release='${client}';\n${activateBody}`,
  );
  sql = once(
    sql,
    "IF NOT EXISTS(SELECT 1 FROM public.v3_history_settings WHERE singleton AND NOT enabled AND NOT write_enabled AND client_release IS NULL)",
    "IF NOT EXISTS(SELECT 1 FROM public.v3_history_settings WHERE singleton AND enabled AND write_enabled AND client_release='" +
      client +
      "')",
  );
  sql = once(
    sql,
    "Application rows changed during test history installation; rolling back",
    "Application rows changed during test history activation; rolling back",
  );
  sql = once(
    sql,
    "Expected disabled empty history installation",
    "Expected enabled empty history for the reviewed test client",
  );
  sql = once(
    sql,
    "OR public.v3_identity()->>'progressStorageVersion' IS DISTINCT FROM '1'",
    "OR public.v3_identity()->>'progressStorageVersion' IS DISTINCT FROM '2'",
  );
  sql = once(
    sql,
    "'originalRowsPreservedDuringInstall',true",
    "'originalRowsPreservedDuringActivation',true,'clientRelease',(SELECT client_release FROM public.v3_history_settings WHERE singleton)",
  );
  sql = once(sql, "AS test_history_install;", "AS test_history_activation;");
  return {
    sql,
    manifest: {
      projectRef,
      deployedClient: client,
      sourceFile,
      sourceSha256,
      installedPackageSha256,
      sqlSha256: installer.hash(sql),
      existingApplicationRowsCompared: true,
      accountChangesIncluded: false,
      liveProjectAllowed: false,
    },
  };
}
if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.length !== 2 || args[0] !== "--out")
    throw new Error(
      "Usage: node scripts/prepare-synthetic-history-activation.cjs --out NEW_DIRECTORY",
    );
  const p = prepare(),
    out = path.resolve(args[1]);
  if (fs.existsSync(out))
    throw new Error("Never overwrite a reviewed activation package");
  fs.mkdirSync(out, { recursive: true });
  fs.writeFileSync(path.join(out, "ACTIVATE-TEST-HISTORY.sql"), p.sql, {
    flag: "wx",
  });
  fs.writeFileSync(
    path.join(out, "MANIFEST.json"),
    JSON.stringify(p.manifest, null, 2) + "\n",
    { flag: "wx" },
  );
  console.log(JSON.stringify(p.manifest, null, 2));
}
module.exports = { prepare, deployedClient, sourceFile, sourceSha256 };
