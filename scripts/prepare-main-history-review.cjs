// Offline packager for catalogue metadata only. No database/network calls.
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const root = path.resolve(__dirname, "..");
const projectRef = "sfogrvedypgtxfvecmbx";
const sourceFile = "supabase/history/000_preflight.sql";
const sourceSha256 =
  "0c708db5f507ae9e24dd8294e2e16093bb6edf092f5b56831a4348380f6dec3d";
const hash = (s) => crypto.createHash("sha256").update(s).digest("hex");
function once(s, before, after) {
  if (s.split(before).length !== 2)
    throw new Error("Review read-only inventory transformation");
  return s.replace(before, () => after);
}
function prepare(read = (f) => fs.readFileSync(path.join(root, f), "utf8")) {
  const source = read(sourceFile);
  if (hash(source) !== sourceSha256)
    throw new Error("Reviewed read-only source changed");
  let sql = once(
    source,
    "BEGIN READ ONLY;",
    `BEGIN READ ONLY;\nSET LOCAL app.history_expected_project_ref='${projectRef}';`,
  );
  sql = once(
    sql,
    "SELECT jsonb_build_object(\n 'scope'",
    "SELECT jsonb_build_object(\n 'projectRef',(SELECT project_ref FROM public.v3_environment),\n 'scope'",
  );
  sql = `-- READ ONLY: MAIN game project ${projectRef}, not the new test project.\n-- Catalogue booleans and routine hashes only; no learner rows or function bodies.\n-- Does not install or activate history, change grants, or write application data.\n-- Copy this entire file into one new postgres SQL-editor query.\n${sql}`;
  return {
    sql,
    manifest: {
      projectRef,
      sourceFile,
      sourceSha256,
      sqlSha256: hash(sql),
      transactionMode: "READ ONLY",
      outputs: "catalogue/contract flags and definition digests only",
      installationIncluded: false,
      activationIncluded: false,
    },
  };
}
if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.length !== 2 || args[0] !== "--out")
    throw new Error(
      "Usage: node scripts/prepare-main-history-review.cjs --out NEW_DIRECTORY",
    );
  const p = prepare(),
    out = path.resolve(args[1]);
  if (fs.existsSync(out))
    throw new Error("Never overwrite a reviewed inventory package");
  fs.mkdirSync(out, { recursive: true });
  fs.writeFileSync(path.join(out, "READ-ONLY-MAIN-CONTRACT.sql"), p.sql, {
    flag: "wx",
  });
  fs.writeFileSync(
    path.join(out, "MANIFEST.json"),
    JSON.stringify(p.manifest, null, 2) + "\n",
    { flag: "wx" },
  );
  console.log(JSON.stringify(p.manifest, null, 2));
}
module.exports = { prepare, sourceFile, sourceSha256 };
