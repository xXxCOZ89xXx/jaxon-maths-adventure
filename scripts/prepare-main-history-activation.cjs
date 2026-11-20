// Offline only. Live activation requires separate owner approval and current deployment proof.
const fs = require("node:fs");
const path = require("node:path");
const installer = require("./prepare-main-history-preservation.cjs");
const { hash } = require("../tests/helpers/main-history-contract.cjs");
const root = path.resolve(__dirname, "..");
const deployedClient = "f7be74159137bc3bad289b53df615f9afdf9ad68";
const installedPackageSha256 =
  "7cbb3c603e8ff08b7f9d1f34b182a8b11dc06c2d44b72bce17de84ece9509668";
const sourceFile = "supabase/history/002_enable_retained_history.sql";
const sourceSha256 =
  "2d476e63b98e0290d1a0ee1051f3e5a9576fdaaeb009a731a7dcbfacc90f0b2d";
function replace(s, before, after, count = 1) {
  if (s.split(before).length !== count + 1)
    throw new Error("Review activation envelope transformation");
  return s.split(before).join(after);
}
function prepare(
  client = deployedClient,
  read = (f) => fs.readFileSync(path.join(root, f), "utf8"),
) {
  if (client !== deployedClient)
    throw new Error("Review actual deployed Main client before activation");
  const original = installer.prepare(read);
  if (original.manifest.sqlSha256 !== installedPackageSha256)
    throw new Error("Reviewed Main installation envelope changed");
  const source = read(sourceFile);
  if (hash(source) !== sourceSha256)
    throw new Error("Reviewed activation source changed");
  if (
    (source.match(/^BEGIN;$/gm) || []).length !== 1 ||
    (source.match(/^COMMIT;$/gm) || []).length !== 1
  )
    throw new Error("Review activation boundaries");
  const oldGuardStart = original.sql.indexOf(
    " IF to_regclass('public.v3_history_settings') IS NOT NULL",
  );
  const oldGuardEnd = original.sql.indexOf(
    " FOREACH name IN ARRAY",
    oldGuardStart,
  );
  if (oldGuardStart < 0 || oldGuardEnd < 0)
    throw new Error("Missing absent-history guard");
  const oldGuard = original.sql.slice(oldGuardStart, oldGuardEnd);
  const installedGuard = ` IF to_regclass('public.v3_history_settings') IS NULL
 OR to_regclass('public.v3_history_nodes') IS NULL OR to_regclass('public.v3_history_roots') IS NULL
 THEN RAISE EXCEPTION 'Reviewed disabled Main installation required'; END IF;
 IF (SELECT count(*) FROM public.v3_history_settings)<>1
 OR NOT EXISTS(SELECT 1 FROM public.v3_history_settings WHERE singleton AND NOT enabled AND NOT write_enabled AND client_release IS NULL)
 OR EXISTS(SELECT 1 FROM public.v3_history_nodes) OR EXISTS(SELECT 1 FROM public.v3_history_roots)
 THEN RAISE EXCEPTION 'Fresh disabled empty history required; inspect instead of rerunning activation'; END IF;
`;
  const contractStart = original.sql.indexOf("DO $contracts$");
  const contractEnd =
    original.sql.indexOf("END $contracts$;", contractStart) +
    "END $contracts$;".length;
  const installedStart = original.sql.lastIndexOf("DO $contracts$");
  const installedEnd =
    original.sql.indexOf("END $contracts$;", installedStart) +
    "END $contracts$;".length;
  if (contractStart < 0 || installedStart <= contractStart)
    throw new Error("Missing reviewed routine guards");
  let sql = replace(original.sql, oldGuard, installedGuard, 2);
  sql = replace(
    sql,
    original.sql.slice(contractStart, contractEnd),
    original.sql.slice(installedStart, installedEnd),
  );
  sql = replace(
    sql,
    "app.main_history_install_approved",
    "app.main_history_activation_approved",
    2,
  );
  sql = replace(
    sql,
    "Specific Main disabled-installation approval required",
    "Specific Main activation approval required",
  );
  sql = replace(
    sql,
    "-- INSTALLS DISABLED ONLY. Does not activate history or migrate learner rows.",
    "-- ACTIVATES HISTORY WRITES. Separate specific owner approval required. No existing learner rows migrated.",
  );
  // Preserve unknown settings fields too: mask only the three explicitly approved keys.
  sql = replace(
    sql,
    "to_jsonb(t)::text",
    "(to_jsonb(t) - CASE WHEN t.tableoid=''public.v3_history_settings''::regclass THEN ARRAY[''enabled'',''write_enabled'',''client_release''] ELSE ARRAY[]::text[] END)::text",
    2,
  );
  const installBody = read(installer.sourceFile)
    .replace(/^BEGIN;$/m, "")
    .replace(/^COMMIT;$/m, "");
  const activateBody = source
    .replace(/^BEGIN;$/m, "")
    .replace(/^COMMIT;$/m, "");
  sql = replace(
    sql,
    `SET LOCAL app.history_storage_reviewed='yes';\nSET LOCAL app.history_expected_project_ref='sfogrvedypgtxfvecmbx';\n${installBody}`,
    `SET LOCAL app.history_cutover_reviewed='yes';\nSET LOCAL app.history_expected_project_ref='sfogrvedypgtxfvecmbx';\nSET LOCAL app.history_client_release='${client}';\n${activateBody}`,
  );
  const preserveStart = sql.indexOf("DO $preserve$");
  const preserveEnd =
    sql.indexOf("END $preserve$;", preserveStart) + "END $preserve$;".length;
  const preserve = sql.slice(preserveStart, preserveEnd);
  sql = replace(
    sql,
    preserve,
    replace(
      preserve,
      "WHERE singleton AND NOT enabled AND NOT write_enabled AND client_release IS NULL)",
      `WHERE singleton AND enabled AND write_enabled AND client_release='${client}')`,
    ),
  );
  sql = replace(
    sql,
    "Disabled empty history required before commit",
    "Exact enabled empty history required before commit",
  );
  sql = replace(
    sql,
    "progressStorageVersion' IS DISTINCT FROM '1'",
    "progressStorageVersion' IS DISTINCT FROM '2'",
  );
  sql = replace(
    sql,
    "Existing identity and V1 capability must be preserved",
    "Main identity and V2 capability must match",
  );
  sql = replace(
    sql,
    "'historyEnabled',false,'historyWritesEnabled',false,'progressStorageVersion',1",
    "'historyEnabled',true,'historyWritesEnabled',true,'progressStorageVersion',2,'clientRelease','" +
      client +
      "'",
  );
  sql = replace(
    sql,
    "AS main_history_install_checks",
    "AS main_history_activation_checks",
  );
  const block = (tag) => {
    const start = sql.indexOf(`DO $${tag}$`);
    const end = sql.indexOf(`END $${tag}$;`, start) + `END $${tag}$;`.length;
    if (start < 0 || end <= start)
      throw new Error("Missing activation precheck block");
    return sql.slice(start, end);
  };
  const precheckSql = `BEGIN READ ONLY;
SET LOCAL search_path='';SET LOCAL statement_timeout='30s';
${block("target")}
${block("contracts")}
${block("activity")}
${block("newtables")}
SELECT jsonb_build_object('projectRef','sfogrvedypgtxfvecmbx','installedContractsMatch',true,'freshDisabledHistory',true,'permissionsMatch',true,'activityMatchesReviewedCheckpoint',true) AS main_activation_precheck;
COMMIT;
`;
  return {
    sql,
    precheckSql,
    manifest: {
      projectRef: "sfogrvedypgtxfvecmbx",
      deployedClient: client,
      installedPackageSha256,
      sourceFile,
      sourceSha256,
      sqlSha256: hash(sql),
      precheckSqlSha256: hash(precheckSql),
      ownerApprovalRequired: true,
      currentDeploymentProofRequired: true,
      originalTableAclsCompared: true,
      onlyPermittedRowChange:
        "public.v3_history_settings singleton exact false/false/null to true/true/reviewed-client",
      accountChangesIncluded: false,
    },
  };
}
if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.length !== 2 || args[0] !== "--out")
    throw new Error(
      "Usage: node scripts/prepare-main-history-activation.cjs --out NEW_DIRECTORY",
    );
  const p = prepare(),
    out = path.resolve(args[1]);
  if (fs.existsSync(out))
    throw new Error("Never overwrite a reviewed activation package");
  fs.mkdirSync(out, { recursive: true });
  fs.writeFileSync(path.join(out, "ACTIVATE-MAIN-HISTORY.sql"), p.sql, {
    flag: "wx",
  });
  fs.writeFileSync(
    path.join(out, "READ-ONLY-MAIN-ACTIVATION.sql"),
    p.precheckSql,
    { flag: "wx" },
  );
  fs.writeFileSync(
    path.join(out, "MANIFEST.json"),
    JSON.stringify(p.manifest, null, 2) + "\n",
    { flag: "wx" },
  );
  console.log(JSON.stringify(p.manifest, null, 2));
}
module.exports = { prepare, deployedClient, sourceFile };
