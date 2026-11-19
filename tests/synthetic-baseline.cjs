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
create schema auth;create table auth.users(id uuid primary key);create table auth.identities(id uuid primary key,user_id uuid references auth.users(id));
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
  sql("insert into auth.users values('11111111-1111-4111-8111-111111111111')");
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
  sql(
    `insert into auth.users values ${Object.values(ids)
      .map((x) => `(${lit(x)})`)
      .join(
        ",",
      )};insert into public.maths_families values('${ids.learner}','${ids.parent}'),('${ids.other}','${ids.otherParent}')`,
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
