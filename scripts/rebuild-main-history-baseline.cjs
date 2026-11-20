// Explicit offline maintenance tool. Generates contracts only from repository SQL and fictional schema.
const fs = require("node:fs");
const path = require("node:path");
const {
  fixture,
  sources,
} = require("../tests/helpers/main-history-fixture.cjs");
const {
  contracts,
  hash,
} = require("../tests/helpers/main-history-contract.cjs");
const root = path.resolve(__dirname, "..");
const installation = "supabase/history/001_retained_history.sql";
const installedSignatures = [
  "public.v3_request(text,text,jsonb)",
  "public.v3_request_before_history(text,text,jsonb)",
  "public.v3_identity()",
  "public.v3_identity_before_history()",
  "public.v3_history_children(jsonb)",
  "public.v3_history_value(uuid,bigint,text,integer)",
  "public.v3_history_restore(uuid,bigint,jsonb)",
  "public.v3_request_before_game_reset(text,text,jsonb)",
  "public.v3_role()",
  "public.v3_set_pin(text)",
  "public.v3_unlock(text)",
];
async function rebuild() {
  const db = await fixture();
  try {
    const before = await contracts(db);
    await db.exec(
      "SET app.history_storage_reviewed='yes';SET app.history_expected_project_ref='sfogrvedypgtxfvecmbx';" +
        fs.readFileSync(path.join(root, installation), "utf8"),
    );
    return {
      scope: "Reviewed source contracts, not a live database inventory",
      projectRef: "sfogrvedypgtxfvecmbx",
      sourceHashes: Object.fromEntries(
        [...sources, installation].map((file) => [
          file,
          hash(fs.readFileSync(path.join(root, file), "utf8")),
        ]),
      ),
      before,
      installed: await contracts(db, installedSignatures),
    };
  } finally {
    await db.close();
  }
}
if (require.main === module)
  rebuild()
    .then((b) => {
      const out = path.join(
        root,
        "supabase/history/main-review/SOURCE-BASELINE.json",
      );
      fs.writeFileSync(out, JSON.stringify(b, null, 2) + "\n");
      console.log(
        "Rebuilt fictional source contracts; review baseline changes before packaging",
      );
    })
    .catch((e) => {
      console.error(e.message);
      process.exitCode = 1;
    });
module.exports = { rebuild };
