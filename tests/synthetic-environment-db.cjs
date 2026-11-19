// Network-disabled local PostgreSQL; fictional users/claims only. No hosted APIs.
const assert = require("node:assert/strict"),
  fs = require("node:fs"),
  crypto = require("node:crypto"),
  cp = require("node:child_process");
const ref = "abcdefghijklmnopqrst",
  name = "esa-synthetic-contract-" + process.pid,
  env = { ...process.env };
for (const k of [
  "DOCKER_HOST",
  "DOCKER_CONTEXT",
  "DOCKER_TLS",
  "DOCKER_TLS_VERIFY",
  "DOCKER_CERT_PATH",
])
  delete env[k];
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
const lit = (x) => "'" + String(x).replaceAll("'", "''") + "'";
const source = (f) => fs.readFileSync(f, "utf8");
const ids = {
    learner: "11111111-1111-4111-8111-111111111111",
    parent: "22222222-2222-4222-8222-222222222222",
    other: "33333333-3333-4333-8333-333333333333",
    otherParent: "44444444-4444-4444-8444-444444444444",
  },
  tokens = {};
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
  JSON.parse(sql(prefix(who) + `select public.${fn}(${args});`));
const req = (who, op, args = {}) =>
  call(
    who,
    "v3_request",
    `${lit(tokens[who])},${lit(op)},${lit(JSON.stringify(args))}`,
  );
const reject = (fn, re) =>
  assert.throws(fn, (e) => re.test(String(e.stderr || e.message)));
let suites = 0;
const pass = (s) => {
  suites++;
  console.log("PASS", s);
};
try {
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
  sql(
    `create role anon;create role authenticated;create role service_role bypassrls;create schema auth;
 create table auth.users(id uuid primary key);create table auth.identities(id uuid primary key,user_id uuid references auth.users(id));
 create function auth.jwt() returns jsonb language sql stable as $$select coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb$$;
 create function auth.uid() returns uuid language sql stable as $$select (auth.jwt()->>'sub')::uuid$$;
 grant usage on schema auth to anon,authenticated;grant execute on function auth.jwt(),auth.uid() to anon,authenticated;
 set app.v3.staging_authorized='yes';set app.v3.staging_ref='${ref}';` +
      source("supabase/v3-staging/001_secure_core.sql"),
  );
  sql(source("supabase/v3-staging/002_catalog.sql"));
  // The existing compact migration remains project-pinned. Only the disposable test copy is rebound.
  sql(
    source("supabase/v3-staging/004_compact_save_receipts.sql").replaceAll(
      "sfogrvedypgtxfvecmbx",
      ref,
    ),
  );
  sql(
    "set app.base_camp_reset_reviewed='yes';" +
      source("supabase/base-camp/001_parent_game_reset.sql"),
  );
  const marker = source("supabase/synthetic/001_environment_marker.sql");
  const identityHash = sql(
    "select encode(extensions.digest(convert_to(pg_get_functiondef('public.v3_identity()'::regprocedure),'UTF8'),'sha256'),'hex')",
  );
  const requestHash = sql(
    "select encode(extensions.digest(convert_to(pg_get_functiondef('public.v3_request(text,text,jsonb)'::regprocedure),'UTF8'),'sha256'),'hex')",
  );
  const flags = `set app.synthetic_setup_reviewed='yes';set app.synthetic_expected_project_ref='${ref}';set app.synthetic_identity_sha256='${identityHash}';set app.synthetic_request_sha256='${requestHash}';`;
  reject(() => sql(marker), /Reviewed separate/);
  for (const live of ["sfogrvedypgtxfvecmbx", "mbdelspbjusarbwlltol"])
    reject(
      () =>
        sql(
          flags + `set app.synthetic_expected_project_ref='${live}';` + marker,
        ),
      /Reviewed separate/,
    );
  reject(
    () =>
      sql(
        flags +
          "set app.synthetic_expected_project_ref='zzzzzzzzzzzzzzzzzzzz';" +
          marker,
      ),
    /identity mismatch/,
  );
  reject(
    () =>
      sql(
        flags +
          "set app.synthetic_request_sha256='" +
          "0".repeat(64) +
          "';" +
          marker,
      ),
    /exact synthetic baseline/,
  );
  pass(
    "operator/project/live-ref and exact installed-definition guards fail before marker installation",
  );
  sql(`insert into auth.users values('${ids.learner}')`);
  reject(() => sql(flags + marker), /Empty synthetic environment/);
  sql(`delete from auth.users where id='${ids.learner}'`);
  sql(
    "create table public.unrelated_records(value text);insert into public.unrelated_records values('fictional existing data');",
  );
  reject(() => sql(flags + marker), /unrelated records/);
  assert.equal(
    sql("select value from public.unrelated_records"),
    "fictional existing data",
  );
  sql("drop table public.unrelated_records;");
  sql("grant select on public.v3_wallet to anon");
  reject(() => sql(flags + marker), /table isolation/);
  sql("revoke select on public.v3_wallet from anon");
  assert.equal(sql("select to_regnamespace('esa_test_private') is null"), "t");
  pass(
    "existing identities and permissive baseline grants refused without marker or data changes",
  );
  const before = sql(
    "select jsonb_build_object('environment',(select jsonb_agg(to_jsonb(e)) from public.v3_environment e),'catalog',(select jsonb_agg(to_jsonb(c) order by item_id) from public.v3_catalog c))",
  );
  reject(
    () =>
      sql(
        flags +
          marker.replace(
            /COMMIT;\s*$/,
            "DO $$BEGIN RAISE EXCEPTION 'fictional late failure';END$$;COMMIT;",
          ),
      ),
    /fictional late failure/,
  );
  assert.equal(sql("select to_regnamespace('esa_test_private') is null"), "t");
  assert.equal(
    sql(
      "select to_regprocedure('public.v3_identity_before_synthetic()') is null",
    ),
    "t",
  );
  pass("late marker error rolls back schema and function rename atomically");
  sql(flags + marker);
  assert.equal(
    sql(
      "select jsonb_build_object('environment',(select jsonb_agg(to_jsonb(e)) from public.v3_environment e),'catalog',(select jsonb_agg(to_jsonb(c) order by item_id) from public.v3_catalog c))",
    ),
    before,
  );
  const identity = JSON.parse(sql("set role anon;select public.v3_identity()"));
  assert.equal(identity.environmentKind, "synthetic-test");
  assert.equal(identity.syntheticOnly, true);
  assert.equal(identity.syntheticContractVersion, 1);
  assert.equal(identity.projectRef, ref);
  assert.equal(identity.saveReceiptVersion, 1);
  for (const role of ["anon", "authenticated", "service_role"]) {
    reject(
      () => sql(`set role ${role};select * from esa_test_private.environment`),
      /permission denied/,
    );
    reject(
      () =>
        sql(`set role ${role};select public.v3_identity_before_synthetic()`),
      /permission denied/,
    );
  }
  pass(
    "marker preserves original environment/catalog and exposes only aggregate capability; helper/table stay private",
  );
  sql(`insert into auth.users values ${Object.values(ids)
    .map((id) => "(" + lit(id) + ")")
    .join(",")};
 insert into public.maths_families values('${ids.learner}','${ids.parent}'),('${ids.other}','${ids.otherParent}');`);
  for (const who of Object.keys(ids)) {
    call(
      who,
      "v3_set_pin",
      lit(who.toLowerCase().includes("parent") ? "654321" : "1234"),
    );
    const bad = call(who, "v3_unlock", lit("999999"));
    assert(bad.error);
    tokens[who] = call(
      who,
      "v3_unlock",
      lit(who.toLowerCase().includes("parent") ? "654321" : "1234"),
    ).token;
    req(who, "read");
  }
  pass(
    "fictional parent/learner PIN flows and reset-wrapper first-read initialization work with preserved internal name",
  );
  const args = {
    requestId: crypto.randomUUID(),
    revision: 0,
    gameEpoch: 0,
    progress: {
      paused: { draft: "synthetic-only" },
      unknown: { preserved: true },
    },
  };
  const saved = req("learner", "save", args);
  assert.deepEqual(req("learner", "save", args), saved);
  assert.equal(
    sql(
      `select count(*) from public.v3_transactions where child_user_id='${ids.learner}'`,
    ),
    "1",
  );
  assert.deepEqual(req("learner", "read").progress, args.progress);
  assert.deepEqual(req("other", "read").progress, {});
  reject(
    () =>
      req("learner", "award", {
        requestId: crypto.randomUUID(),
        amount: 5,
        gameEpoch: 0,
      }),
    /Parent account/,
  );
  reject(
    () => sql(prefix("learner") + "select * from public.v3_progress"),
    /permission denied/,
  );
  const award = { requestId: crypto.randomUUID(), amount: 60, gameEpoch: 0 };
  const awarded = req("parent", "award", award);
  assert.deepEqual(req("parent", "award", award), awarded);
  const purchase = {
    requestId: crypto.randomUUID(),
    item: "cap",
    gameEpoch: 0,
  };
  const bought = req("learner", "buy", purchase);
  assert.deepEqual(req("learner", "buy", purchase), bought);
  assert(req("learner", "read").wallet.owned.includes("cap"));
  assert.deepEqual(req("other", "read").wallet.owned, []);
  pass(
    "two-family isolation, exact save/award/purchase retries, server roles and unrelated progress/wallet preserved",
  );
  reject(() => sql(flags + marker), /already exists/);
  sql(
    `set app.history_expected_project_ref='${ref}';set app.history_storage_reviewed='yes';` +
      source("supabase/history/001_retained_history.sql"),
  );
  const after = JSON.parse(sql("set role anon;select public.v3_identity()"));
  assert.equal(after.syntheticOnly, true);
  assert.equal(after.progressStorageVersion, 1);
  assert.deepEqual(req("learner", "read").progress, args.progress);
  pass(
    "rerun refused; later disabled history wrapper preserves synthetic identity and exact stored progress",
  );
  console.log(
    `${suites} synthetic environment database groups passed; no hosted project or genuine record used.`,
  );
} finally {
  try {
    docker(["rm", "-f", name]);
  } catch {}
}
