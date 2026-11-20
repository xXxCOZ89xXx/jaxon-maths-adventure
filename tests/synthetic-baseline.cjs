// Network-disabled local PostgreSQL only. No hosted project or genuine data.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const crypto = require("node:crypto");
const cp = require("node:child_process");
const {
  prepare,
  writePackage,
  reviewedRef,
  sources,
  hash,
} = require("../scripts/prepare-synthetic-baseline.cjs");
const root = path.resolve(__dirname, "..");
const bundle = prepare();
const name = "esa-fresh-baseline-" + process.pid;
const env = { ...process.env };
for (const key of [
  "DOCKER_HOST",
  "DOCKER_CONTEXT",
  "DOCKER_TLS",
  "DOCKER_TLS_VERIFY",
  "DOCKER_CERT_PATH",
])
  delete env[key];
const docker = (args, input) =>
  cp
    .execFileSync("docker", ["--host=unix:///var/run/docker.sock", ...args], {
      env,
      input,
      encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"],
    })
    .trim();
const sql = (s) =>
  docker(
    [
      "exec",
      "-i",
      name,
      "psql",
      "-h",
      "127.0.0.1",
      "-U",
      "postgres",
      "-XqAt",
      "-v",
      "ON_ERROR_STOP=1",
    ],
    s,
  );
const lit = (s) => "'" + String(s).replaceAll("'", "''") + "'";
const flags = `set app.synthetic_fresh_install_reviewed='yes';set app.synthetic_dashboard_ref='${reviewedRef}';`;
const reject = (fn, re) =>
  assert.throws(fn, (e) => re.test(String(e.stderr || e.message)));
let groups = 0;
const pass = (s) => {
  groups++;
  console.log("PASS", s);
};
const noObjects = () =>
  assert.equal(
    sql(
      "select to_regclass('public.v3_environment') is null and to_regnamespace('esa_test_private') is null",
    ),
    "t",
  );
const scratch = fs.mkdtempSync(path.join(os.tmpdir(), "esa-baseline-"));
try {
  assert.equal(bundle.sql, prepare().sql);
  assert.equal(
    fs.readFileSync(
      path.join(
        root,
        "supabase/synthetic/fresh-baseline/RUN-IN-TEST-PROJECT.sql",
      ),
      "utf8",
    ),
    bundle.runSql,
  );
  assert.equal(
    fs.readFileSync(
      path.join(root, "supabase/synthetic/fresh-baseline/INSTALL-REVIEW.sql"),
      "utf8",
    ),
    bundle.sql,
  );
  assert.deepEqual(
    JSON.parse(
      fs.readFileSync(
        path.join(root, "supabase/synthetic/fresh-baseline/MANIFEST.json"),
        "utf8",
      ),
    ),
    bundle.manifest,
  );
  for (const ref of [
    "sfogrvedypgtxfvecmbx",
    "mbdelspbjusarbwlltol",
    "abcdefghijklmnopqrst",
    "bad'input",
    "",
  ])
    reject(() => prepare(ref), /owner-confirmed/);
  reject(
    () =>
      prepare(
        reviewedRef,
        (f) => fs.readFileSync(path.join(root, f), "utf8") + "\n",
      ),
    /source changed/,
  );
  const output = path.join(scratch, "review");
  const manifest = writePackage(output);
  assert.equal(
    hash(fs.readFileSync(path.join(output, "INSTALL-REVIEW.sql"))),
    manifest.sqlSha256,
  );
  reject(() => writePackage(output), /never overwrite/);
  assert.equal(
    hash(fs.readFileSync(path.join(output, "RUN-IN-TEST-PROJECT.sql"))),
    manifest.runSqlSha256,
  );
  assert.deepEqual(manifest.sourceSha256, sources);
  pass(
    "deterministic source-hash-bound package, exact confirmed target only and no overwrite",
  );
  docker([
    "run",
    "--pull=never",
    "--rm",
    "-d",
    "--name",
    name,
    "--network",
    "none",
    "-e",
    "POSTGRES_HOST_AUTH_METHOD=trust",
    "postgres:17-alpine",
  ]);
  for (let i = 0; i < 100; i++) {
    try {
      sql("select 1");
      break;
    } catch {
      cp.execFileSync("sleep", ["0.1"]);
    }
  }
  sql(`create role anon;create role authenticated;create role service_role bypassrls;
create schema auth;create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz);create table auth.identities(id uuid primary key,user_id uuid references auth.users(id));
create function auth.jwt() returns jsonb language sql stable as $$select coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb$$;
create function auth.uid() returns uuid language sql stable as $$select (auth.jwt()->>'sub')::uuid$$;
grant usage on schema auth to anon,authenticated;grant execute on function auth.jwt(),auth.uid() to anon,authenticated;
grant create on schema public to anon,authenticated;
alter default privileges for role postgres in schema public grant all on tables to anon,authenticated,service_role;
alter default privileges for role postgres in schema public grant execute on functions to anon,authenticated,service_role;`);
  const precheckSql = fs.readFileSync(
    path.join(root, "supabase/synthetic/fresh-baseline/PRECHECK.sql"),
    "utf8",
  );
  const precheck = JSON.parse(sql(precheckSql));
  assert.equal(precheck.intendedProjectRef, reviewedRef);
  assert.equal(precheck.authUserCount, 0);
  assert.equal(precheck.nonExtensionPublicRelationCount, 0);
  assert.equal(precheck.existingSyntheticMarker, false);
  assert.equal(precheck.physicalProjectMustBeCheckedInDashboard, true);
  noObjects();
  reject(() => sql(bundle.sql), /Owner review/);
  noObjects();
  reject(
    () =>
      sql(
        flags +
          "set app.synthetic_dashboard_ref='sfogrvedypgtxfvecmbx';" +
          bundle.sql,
      ),
    /Owner review/,
  );
  noObjects();
  reject(
    () => sql(flags + "set role authenticated;" + bundle.sql),
    /Owner review/,
  );
  noObjects();
  pass(
    "missing review, wrong target and non-owner roles refuse installation before application changes",
  );
  sql(
    "insert into auth.users(id) values('11111111-1111-4111-8111-111111111111')",
  );
  reject(() => sql(flags + bundle.sql), /existing Auth records preserved/);
  noObjects();
  assert.equal(sql("select count(*) from auth.users"), "1");
  sql(
    "delete from auth.users;create table public.occupied(value text);insert into public.occupied values('fictional existing record')",
  );
  reject(() => sql(flags + bundle.sql), /all existing objects preserved/);
  noObjects();
  assert.equal(
    sql("select value from public.occupied"),
    "fictional existing record",
  );
  sql("truncate public.occupied");
  reject(() => sql(flags + bundle.sql), /all existing objects preserved/);
  sql(
    "drop table public.occupied;create function public.occupied() returns integer language sql as $$select 1$$",
  );
  reject(() => sql(flags + bundle.sql), /all existing objects preserved/);
  sql(
    "drop function public.occupied();create type public.occupied as enum ('fictional')",
  );
  reject(() => sql(flags + bundle.sql), /all existing objects preserved/);
  sql("drop type public.occupied");
  sql(
    "create schema storage;create table storage.buckets(id text primary key);create table storage.objects(id text primary key);insert into storage.buckets values('fictional-existing-bucket')",
  );
  reject(() => sql(flags + bundle.sql), /existing Storage records preserved/);
  noObjects();
  assert.equal(sql("select count(*) from storage.buckets"), "1");
  sql(
    "truncate storage.buckets;insert into storage.objects values('fictional-existing-upload')",
  );
  reject(() => sql(flags + bundle.sql), /existing Storage records preserved/);
  noObjects();
  sql("truncate storage.objects");
  pass(
    "existing Auth users, Storage, data, empty tables, functions and types are refused and preserved",
  );
  const lateFailure = bundle.sql.replace(
    /COMMIT;\n-- Aggregate/,
    "DO $$BEGIN RAISE EXCEPTION 'fictional late failure';END$$;\nCOMMIT;\n-- Aggregate",
  );
  reject(() => sql(flags + lateFailure), /fictional late failure/);
  noObjects();
  assert.equal(
    sql("select has_schema_privilege('anon','public','CREATE')"),
    "t",
  );
  assert.equal(
    sql("select exists(select 1 from pg_extension where extname='pgcrypto')"),
    "f",
  );
  pass(
    "late failure rolls back all application objects, extension creation and schema privilege changes",
  );
  sql(bundle.runSql);
  const identity = JSON.parse(sql("set role anon;select public.v3_identity()"));
  assert.equal(identity.projectRef, reviewedRef);
  assert.equal(identity.syntheticOnly, true);
  assert.equal(identity.saveReceiptVersion, 1);
  assert.equal(sql("select count(*) from public.v3_catalog"), "40");
  assert.equal(sql("select count(*) from auth.users"), "0");
  reject(() => sql(flags + bundle.sql), /Already installed/);
  pass(
    "complete empty-project installation exposes synthetic identity, preserves catalogue and refuses rerun",
  );
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
  for (const role of ["anon", "authenticated", "service_role"]) {
    for (const table of tables)
      assert.equal(
        sql(
          `select has_table_privilege('${role}','public.${table}','SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER')`,
        ),
        "f",
      );
    assert.equal(
      sql(`select has_schema_privilege('${role}','public','CREATE')`),
      "f",
    );
    reject(
      () => sql(`set role ${role};select * from esa_test_private.environment`),
      /permission denied/,
    );
    for (const fn of [
      "v3_identity_before_synthetic()",
      "v3_request_before_game_reset(text,text,jsonb)",
      "v3_receipt_normalize(jsonb)",
      "v3_compact_receipt_insert()",
      "v3_game_epoch_write_guard()",
    ])
      assert.equal(
        sql(
          `select has_function_privilege('${role}','public.${fn}','EXECUTE')`,
        ),
        "f",
      );
  }
  assert.equal(
    sql(
      "select has_function_privilege('anon','public.v3_request(text,text,jsonb)','EXECUTE')",
    ),
    "f",
  );
  assert.equal(
    sql(
      "select has_function_privilege('authenticated','public.v3_request(text,text,jsonb)','EXECUTE')",
    ),
    "t",
  );
  pass(
    "permissive provider default grants do not expose tables, private delegates or schema creation",
  );
  const ids = {
    learner: "11111111-1111-4111-8111-111111111111",
    parent: "22222222-2222-4222-8222-222222222222",
    other: "33333333-3333-4333-8333-333333333333",
    otherParent: "44444444-4444-4444-8444-444444444444",
  };
  const prefix = (who) =>
    "set role authenticated;set request.jwt.claims=" +
    lit(
      JSON.stringify({
        sub: ids[who],
        amr: [{ method: "password", timestamp: Math.floor(Date.now() / 1000) }],
      }),
    ) +
    ";";
  const call = (who, fn, args = "") =>
    JSON.parse(sql(prefix(who) + `select public.${fn}(${args})`));
  const tokens = {};
  const req = (who, op, args = {}) =>
    call(
      who,
      "v3_request",
      `${lit(tokens[who])},${lit(op)},${lit(JSON.stringify(args))}`,
    );
  const links = fs.readFileSync(
    path.join(root, "supabase/synthetic/fresh-baseline/LINK-TEST-FAMILIES.sql"),
    "utf8",
  );
  reject(() => sql(links), /Exactly four reserved/);
  assert.equal(sql("select count(*) from public.maths_families"), "0");
  const emails = {
    learner: "learner-a@esa-test.invalid",
    parent: "parent-a@esa-test.invalid",
    other: "learner-b@esa-test.invalid",
    otherParent: "parent-b@esa-test.invalid",
  };
  sql(
    `insert into auth.users(id,email,email_confirmed_at) values ${Object.keys(
      ids,
    )
      .map((who) => `(${lit(ids[who])},${lit(emails[who])},now())`)
      .join(",")}`,
  );
  sql(
    `update auth.users set email_confirmed_at=null where id='${ids.learner}'`,
  );
  reject(() => sql(links), /admin-confirmed/);
  sql(
    `update auth.users set email_confirmed_at=now() where id='${ids.learner}'`,
  );
  sql("update public.v3_environment set project_ref='sfogrvedypgtxfvecmbx'");
  reject(() => sql(links), /Exact installed synthetic/);
  sql(`update public.v3_environment set project_ref='${reviewedRef}'`);
  reject(
    () => sql("set role authenticated;" + links),
    /postgres SQL-editor role/,
  );
  sql(
    `insert into public.maths_families values('${ids.learner}','${ids.otherParent}')`,
  );
  reject(() => sql(links), /Existing family links differ/);
  assert.equal(
    sql(
      `select parent_user_id from public.maths_families where child_user_id='${ids.learner}'`,
    ),
    ids.otherParent,
  );
  sql("delete from public.maths_families");
  const linked = JSON.parse(sql(links));
  assert.deepEqual(linked, {
    projectRef: reviewedRef,
    syntheticOnly: true,
    familiesLinked: 2,
    testAccounts: 4,
  });
  assert.deepEqual(JSON.parse(sql(links)), linked);
  assert.equal(sql("select count(*) from public.v3_progress"), "0");
  assert.equal(sql("select count(*) from public.v3_wallet"), "0");
  pass(
    "test-family linking refuses missing/unconfirmed/wrong-target/conflicting identities and safely retries exact links",
  );
  for (const who of Object.keys(ids)) {
    const pin = who.toLowerCase().includes("parent") ? "654321" : "1234";
    call(who, "v3_set_pin", lit(pin));
    tokens[who] = call(who, "v3_unlock", lit(pin)).token;
    req(who, "read");
  }
  const save = {
    requestId: crypto.randomUUID(),
    revision: 0,
    gameEpoch: 0,
    progress: { paused: { draft: "fictional" }, unknown: { preserved: true } },
  };
  const saved = req("learner", "save", save);
  assert.deepEqual(req("learner", "save", save), saved);
  const beforeLinkRetry = sql(
    "select jsonb_agg(to_jsonb(t) order by child_user_id) from public.v3_progress t",
  );
  sql(links);
  assert.equal(
    sql(
      "select jsonb_agg(to_jsonb(t) order by child_user_id) from public.v3_progress t",
    ),
    beforeLinkRetry,
  );
  assert.deepEqual(req("learner", "read").progress, save.progress);
  assert.deepEqual(req("other", "read").progress, {});
  reject(
    () => req("learner", "save", { ...save, progress: { tampered: true } }),
    /reused/,
  );
  assert.equal(
    sql(
      "select count(*) from public.v3_transactions where payload ? 'progress'",
    ),
    "0",
  );
  assert.equal(
    sql(
      "select count(*) from public.v3_transactions where octet_length(request_fingerprint)=32",
    ),
    "1",
  );
  reject(
    () =>
      req("learner", "award", {
        requestId: crypto.randomUUID(),
        amount: 5,
        gameEpoch: 0,
      }),
    /Parent account/,
  );
  const award = { requestId: crypto.randomUUID(), amount: 60, gameEpoch: 0 };
  const awarded = req("parent", "award", award);
  assert.deepEqual(req("parent", "award", award), awarded);
  const buy = { requestId: crypto.randomUUID(), item: "cap", gameEpoch: 0 };
  const bought = req("learner", "buy", buy);
  assert.deepEqual(req("learner", "buy", buy), bought);
  assert(req("learner", "read").wallet.owned.includes("cap"));
  assert.deepEqual(req("other", "read").wallet.owned, []);
  pass(
    "fictional two-family PIN/save isolation, compact receipts and exact financial/save retries work on the complete installer",
  );
  const reset = {
    requestId: crypto.randomUUID(),
    gameEpoch: 0,
    revision: saved.revision,
    confirmation: "RESET ALL GAME PROGRESS",
  };
  const resetResult = req("parent", "reset_game", reset);
  assert.equal(resetResult.gameEpoch, 1);
  assert.deepEqual(req("parent", "reset_game", reset), resetResult);
  tokens.learner = call("learner", "v3_unlock", lit("1234")).token;
  reject(
    () => req("learner", "save", { ...save, requestId: crypto.randomUUID() }),
    /GAME_RESET_REQUIRED/,
  );
  assert.deepEqual(req("other", "read").progress, {});
  pass(
    "reset generation and retry acknowledgement fence stale requests without affecting the other family",
  );
  const afterPrecheck = JSON.parse(sql(precheckSql));
  assert.equal(afterPrecheck.authUserCount, 4);
  assert.equal(afterPrecheck.existingSyntheticMarker, true);
  assert.deepEqual(req("other", "read").progress, {});
  const retainedFixture = {
    paused: { draft: "fictional pending draft" },
    unknown: { preserve: true },
    minutes: 3,
  };
  const retainedArgs = {
    requestId: crypto.randomUUID(),
    revision: 0,
    gameEpoch: 0,
    progress: retainedFixture,
  };
  const retainedAck = req("other", "save", retainedArgs);
  const retainedAward = {
    requestId: crypto.randomUUID(),
    amount: 10,
    gameEpoch: 0,
  };
  const retainedAwardAck = req("otherParent", "award", retainedAward);
  const historyPackage =
    require("../scripts/prepare-synthetic-history.cjs").prepare();
  assert.equal(
    fs.readFileSync(
      path.join(root, "supabase/synthetic/history/INSTALL-TEST-HISTORY.sql"),
      "utf8",
    ),
    historyPackage.sql,
  );
  assert.deepEqual(
    JSON.parse(
      fs.readFileSync(
        path.join(root, "supabase/synthetic/history/MANIFEST.json"),
        "utf8",
      ),
    ),
    historyPackage.manifest,
  );
  reject(
    () =>
      require("../scripts/prepare-synthetic-history.cjs").prepare(
        (f) => fs.readFileSync(path.join(root, f), "utf8") + "\n",
      ),
    /source changed/,
  );
  sql("update public.v3_environment set project_ref='sfogrvedypgtxfvecmbx'");
  reject(() => sql(historyPackage.sql), /Exact synthetic test identity/);
  sql(`update public.v3_environment set project_ref='${reviewedRef}'`);
  assert.equal(
    sql("select to_regclass('public.v3_history_settings') is null"),
    "t",
  );
  reject(
    () =>
      sql(
        historyPackage.sql.replace(
          /COMMIT;\nSELECT jsonb_build_object/,
          "DO $$BEGIN RAISE EXCEPTION 'fictional late history failure';END$$;COMMIT;\nSELECT jsonb_build_object",
        ),
      ),
    /fictional late history failure/,
  );
  assert.equal(
    sql("select to_regclass('public.v3_history_settings') is null"),
    "t",
  );
  reject(
    () =>
      sql(
        historyPackage.sql.replace(
          "DO $preserve$",
          `UPDATE public.v3_wallet SET bonus=bonus+1 WHERE child_user_id='${ids.other}';DO $preserve$`,
        ),
      ),
    /Application rows changed/,
  );
  assert.equal(
    sql("select to_regclass('public.v3_history_settings') is null"),
    "t",
  );
  assert.equal(req("other", "read").wallet.bonus, 10);
  sql(`update auth.users set email=null where id='${ids.otherParent}'`);
  reject(() => sql(historyPackage.sql), /four reserved fictional/);
  sql(
    `update auth.users set email='parent-b@esa-test.invalid' where id='${ids.otherParent}'`,
  );
  const historyResult = JSON.parse(sql(historyPackage.sql));
  assert.equal(historyResult.historyEnabled, false);
  assert.equal(historyResult.historyWritesEnabled, false);
  assert.equal(historyResult.originalRowsPreservedDuringInstall, true);
  assert.equal(historyResult.progressStorageVersion, 1);
  assert.equal(
    JSON.parse(sql("set role anon;select public.v3_identity()")).syntheticOnly,
    true,
  );
  const afterHistoryRead = req("other", "read");
  assert.deepEqual(afterHistoryRead.progress, retainedFixture);
  assert.equal(afterHistoryRead.wallet.bonus, 10);
  assert.deepEqual(req("other", "save", retainedArgs), retainedAck);
  assert.deepEqual(
    req("otherParent", "award", retainedAward),
    retainedAwardAck,
  );
  reject(() => sql(historyPackage.sql), /History already installed/);
  pass(
    "target-bound hosted-test history package preserves all application rows, rolls back on failure and leaves history disabled",
  );
  const activateModule = require("../scripts/prepare-synthetic-history-activation.cjs");
  const activation = activateModule.prepare();
  assert.equal(
    fs.readFileSync(
      path.join(
        root,
        "supabase/synthetic/history-activation/ACTIVATE-TEST-HISTORY.sql",
      ),
      "utf8",
    ),
    activation.sql,
  );
  assert.deepEqual(
    JSON.parse(
      fs.readFileSync(
        path.join(root, "supabase/synthetic/history-activation/MANIFEST.json"),
        "utf8",
      ),
    ),
    activation.manifest,
  );
  reject(
    () => activateModule.prepare("f".repeat(40)),
    /actual deployed test client/,
  );
  reject(
    () =>
      activateModule.prepare(
        activateModule.deployedClient,
        (f) =>
          fs.readFileSync(path.join(root, f), "utf8") +
          (f === activateModule.sourceFile ? "\n" : ""),
      ),
    /activation source changed/,
  );
  sql("update public.v3_environment set project_ref='sfogrvedypgtxfvecmbx'");
  reject(() => sql(activation.sql), /Exact synthetic test identity/);
  sql(`update public.v3_environment set project_ref='${reviewedRef}'`);
  reject(
    () =>
      sql(
        activation.sql.replace(
          /COMMIT;\nSELECT jsonb_build_object/,
          "DO $$BEGIN RAISE EXCEPTION 'fictional late activation failure';END$$;COMMIT;\nSELECT jsonb_build_object",
        ),
      ),
    /fictional late activation failure/,
  );
  assert.equal(
    sql("select enabled or write_enabled from public.v3_history_settings"),
    "f",
  );
  reject(
    () =>
      sql(
        activation.sql.replace(
          "DO $preserve$",
          `UPDATE public.v3_wallet SET bonus=bonus+1 WHERE child_user_id='${ids.other}';DO $preserve$`,
        ),
      ),
    /Application rows changed/,
  );
  assert.equal(
    sql("select enabled or write_enabled from public.v3_history_settings"),
    "f",
  );
  assert.equal(req("other", "read").wallet.bonus, 10);
  const enabled = JSON.parse(sql(activation.sql));
  assert.equal(enabled.historyEnabled, true);
  assert.equal(enabled.historyWritesEnabled, true);
  assert.equal(enabled.progressStorageVersion, 2);
  assert.equal(enabled.clientRelease, activateModule.deployedClient);
  assert.equal(enabled.originalRowsPreservedDuringActivation, true);
  assert.equal(
    JSON.parse(sql("set role anon;select public.v3_identity()")).syntheticOnly,
    true,
  );
  assert.deepEqual(req("other", "save", retainedArgs), retainedAck);
  assert.deepEqual(
    req("otherParent", "award", retainedAward),
    retainedAwardAck,
  );
  assert.deepEqual(req("other", "read_v2").progress, retainedFixture);
  const historyValues = [{ fixture: "original fictional history" }],
    nodeBody = JSON.stringify({ kind: "value", value: historyValues });
  const node = { id: hash(nodeBody), body: nodeBody };
  req("other", "history_put", { gameEpoch: 0, node });
  const nextBounded = {
    ...retainedFixture,
    evidence: [],
    _historyV2: {
      version: 2,
      sourceHash: hash(
        JSON.stringify({ ...retainedFixture, evidence: historyValues }),
      ),
      refs: [{ path: ["evidence"], root: node.id, mode: "array" }],
    },
  };
  const v2Args = {
    requestId: crypto.randomUUID(),
    revision: retainedAck.revision,
    gameEpoch: 0,
    progress: nextBounded,
  };
  const v2Saved = req("other", "save_v2", v2Args);
  assert.deepEqual(req("other", "save_v2", v2Args), v2Saved);
  assert.deepEqual(req("other", "read").progress, {
    ...retainedFixture,
    evidence: historyValues,
  });
  assert.deepEqual(req("other", "save", retainedArgs), retainedAck);
  reject(
    () =>
      req("other", "save", {
        ...retainedArgs,
        requestId: crypto.randomUUID(),
        revision: v2Saved.revision,
      }),
    /UPDATE_REQUIRED/,
  );
  reject(() => sql(activation.sql), /Fresh disabled history/);
  pass(
    "exact-client test activation preserves old acknowledgements, fences failed changes and supports V2 roundtrip without truncating progress",
  );
  fs.mkdirSync(path.join(root, "tests/artifacts"), { recursive: true });
  fs.writeFileSync(
    path.join(root, "tests/artifacts/synthetic-baseline-verification.json"),
    JSON.stringify(
      {
        scope: "network-disabled local PostgreSQL only",
        groups,
        manifest: bundle.manifest,
        providerAuthApiVerified: false,
        hostedSqlExecuted: false,
      },
      null,
      2,
    ) + "\n",
  );
  console.log(
    groups +
      " fresh synthetic baseline groups passed; no hosted SQL or real records.",
  );
} finally {
  try {
    docker(["rm", "-f", name]);
  } catch {}
  fs.rmSync(scratch, { recursive: true, force: true });
}
