// Fictional end-to-end PowerShell/pg_restore rehearsal. No genuine archive or remote DB.
// Requires an installed pwsh (PWSH_EXECUTABLE) and cached postgres:17-alpine.
const fs = require("node:fs"),
  os = require("node:os"),
  path = require("node:path"),
  cp = require("node:child_process"),
  assert = require("node:assert/strict");
const work = fs.mkdtempSync(path.join(os.tmpdir(), "esa-current-restore-")),
  name = "esa-local-current-restore-" + process.pid;
const env = {
  ...process.env,
  XDG_CACHE_HOME: path.join(work, "cache"),
  XDG_CONFIG_HOME: path.join(work, "config"),
  XDG_DATA_HOME: path.join(work, "data"),
};
for (const k of [
  "DOCKER_HOST",
  "DOCKER_CONTEXT",
  "DOCKER_TLS",
  "DOCKER_TLS_VERIFY",
  "DOCKER_CERT_PATH",
])
  delete env[k];
const pwsh = process.env.PWSH_EXECUTABLE || "pwsh";
const d = (args) =>
  cp.execFileSync("docker", ["--host=unix:///var/run/docker.sock", ...args], {
    env,
    encoding: "utf8",
    stdio: ["pipe", "pipe", "pipe"],
  });
const sql = (s, db = "source") =>
  cp
    .execFileSync(
      "docker",
      [
        "--host=unix:///var/run/docker.sock",
        "exec",
        "-i",
        name,
        "psql",
        "-h",
        "127.0.0.1",
        "-p",
        "5433",
        "-U",
        "postgres",
        "-XqAt",
        "-v",
        "ON_ERROR_STOP=1",
        "-d",
        db,
      ],
      { env, input: s, encoding: "utf8", stdio: ["pipe", "pipe", "pipe"] },
    )
    .trim();
const script = path.resolve("scripts/windows/Verify-CurrentGameBackup.ps1");
let suites = 0;
function pass(s) {
  suites++;
  console.log("PASS", s);
}
try {
  d([
    "run",
    "--pull=never",
    "--rm",
    "-d",
    "--name",
    name,
    "--network",
    "none",
    "--mount",
    `type=bind,src=${work},dst=${work}`,
    "-e",
    "POSTGRES_HOST_AUTH_METHOD=trust",
    "postgres:17-alpine",
    "postgres",
    "-p",
    "5433",
    "-c",
    "listen_addresses=localhost",
  ]);
  for (let i = 0; i < 100; i++) {
    try {
      sql("select 1", "postgres");
      break;
    } catch {
      cp.execFileSync("sleep", ["0.1"]);
    }
  }
  sql("create database source;create database jaxon_restore_test;", "postgres");
  sql(`create role anon;create role authenticated;create role service_role;create schema auth;create schema extensions;
 create extension pgcrypto with schema extensions;
 create function auth.uid() returns uuid language sql stable as $$ select null::uuid $$;
 create type auth.fictional_state as enum('active','inactive');
 create table auth.users(id uuid primary key,email text,encrypted_password text,state auth.fictional_state default 'active');
 create table auth.identities(id uuid primary key,user_id uuid not null references auth.users(id),identity_data jsonb);
 create index users_email_index on auth.users(email);`);
  sql(fs.readFileSync("tests/fixtures/v52-legacy-schema.sql", "utf8"));
  sql(
    `create function auth.jwt() returns jsonb language sql stable as $$select '{}'::jsonb$$;
 set app.v3.staging_authorized='yes';set app.v3.staging_ref='sfogrvedypgtxfvecmbx';` +
      fs.readFileSync("supabase/v3-staging/001_secure_core.sql", "utf8"),
  );
  sql(fs.readFileSync("supabase/v3-staging/002_catalog.sql", "utf8"));
  sql(
    fs.readFileSync(
      "supabase/v3-staging/004_compact_save_receipts.sql",
      "utf8",
    ),
  );
  sql(
    `set app.base_camp_reset_reviewed='yes';` +
      fs.readFileSync("supabase/base-camp/001_parent_game_reset.sql", "utf8"),
  );
  sql(`create schema v52_staging_private;create table v52_staging_private.control(state text,previous jsonb);
 insert into v52_staging_private.control values('open','{"private":"PRIVATE_FICTIONAL_JSON"}');
 create table public.future_evidence(id int primary key,detail text);
 insert into public.future_evidence values(1,E'PRIVATE_FICTIONAL_JSON\\nline\\ttab\\\\slash');`);
  sql(
    "create table old_restore_marker(id int);insert into old_restore_marker values(1);",
    "jaxon_restore_test",
  );
  const child = "11111111-1111-4111-8111-111111111111",
    parent = "22222222-2222-4222-8222-222222222222";
  sql(`insert into auth.users values('${child}','PRIVATE_FICTIONAL_EMAIL','PRIVATE_FICTIONAL_PASSWORD_HASH','active'),('${parent}','parent@fictional.invalid','fictional','active');
 insert into auth.identities values('${child}','${child}','{"private":"PRIVATE_FICTIONAL_JSON"}');
 insert into public.maths_families(parent_user_id,child_user_id) values('${parent}','${child}');
 insert into public.learning_progress(user_id,game_state) values('${child}','{"draft":"\\nCOPY auth.users fake\\tPRIVATE_FICTIONAL_JSON"}');
 insert into public.maths_learning(child_user_id,progress) values('${child}','{"coins":999}');
 insert into public.maths_rewards(child_user_id,bonus_coins,redeemed_minutes) values('${child}',80,7);
 insert into public.maths_reward_events(child_user_id,parent_user_id,kind,amount,request_id) values('${child}','${parent}','bonus_coins',20,'${child}');

 set app.game_request_epoch='2';
 insert into public.v3_progress(child_user_id,revision,game_epoch,progress) values('${child}',17,2,'{"unknown":{"private":"PRIVATE_FICTIONAL_JSON"},"paused":{"answer":"untouched"}}');
 insert into public.v3_wallet(child_user_id,coins,bonus,active_seconds,redeemed,owned) values('${child}',103,7,600,2,'["old-item"]');
 insert into public.v3_pins(user_id,hash,generation) values('${child}','PRIVATE_FICTIONAL_PASSWORD_HASH',3);
 insert into public.v3_unlocks values(decode('aabb','hex'),'${child}',3,'2026-12-01T12:34:56+00');
 insert into public.v3_transactions(child_user_id,request_id,operation,payload,result) values('${child}','${child}','award','{"amount":4}','{"coins":103}');
 insert into public.v3_game_requests values('${child}','${child}',2);
 insert into public.v3_game_resets values('${child}','${child}','${parent}',1,2,17,now());
 create schema managed_only;create table managed_only.not_supported(id int);
 create function auth.unrelated_managed_function() returns text language sql as $$select 'PRIVATE_FICTIONAL_SECRET'::text$$;`);
  // A fictional test-only extension creates an actual EXTENSION TOC entry. Its files are
  // removed before restore to reproduce unavailable managed dependencies without mocking Auth.
  d([
    "exec",
    name,
    "sh",
    "-c",
    `printf "default_version = '1.0'\nrelocatable = false\n" > /usr/local/share/postgresql/extension/supabase_vault.control`,
  ]);
  d([
    "exec",
    name,
    "sh",
    "-c",
    `printf "%s" "create schema vault;create table vault.secrets(id uuid primary key,secret text);select pg_catalog.pg_extension_config_dump('vault.secrets','');" > /usr/local/share/postgresql/extension/supabase_vault--1.0.sql`,
  ]);
  sql("create extension supabase_vault;");
  const privateDir = path.join(work, "Users/c_mil/Jaxon-Private-Backup");
  fs.mkdirSync(privateDir, { recursive: true });
  const dump = path.join(privateDir, "current-game.dump");
  d([
    "exec",
    name,
    "pg_dump",
    "-h",
    "127.0.0.1",
    "-p",
    "5433",
    "-U",
    "postgres",
    "-Fc",
    "-f",
    dump,
    "source",
  ]);
  let original = fs.readFileSync(dump);
  d([
    "exec",
    name,
    "rm",
    "/usr/local/share/postgresql/extension/supabase_vault.control",
    "/usr/local/share/postgresql/extension/supabase_vault--1.0.sql",
  ]);
  const bin = path.join(work, "bin");
  fs.mkdirSync(bin);
  for (const tool of ["psql", "pg_restore"]) {
    // Test transport only: real PostgreSQL tools inside a network-disabled container.
    const body = `#!/bin/sh\nexec docker --host=unix:///var/run/docker.sock exec -e PGPASSWORD -e PGOPTIONS -e PGCLIENTENCODING -e PGHOST -e PGHOSTADDR -e PGPORT -e PGDATABASE -e PGSERVICE -e PGSERVICEFILE -e PGPASSFILE ${name} ${tool} "$@"\n`;
    fs.writeFileSync(path.join(bin, tool + ".exe"), body, { mode: 0o700 });
  }
  const launch = path.join(work, "launch.ps1");
  function run(scriptPath = script, poison = false) {
    const quote = (s) => "'" + s.replaceAll("'", "''") + "'";
    const oldReports = new Set(
      fs.readdirSync(privateDir).filter((x) => x.endsWith(".json")),
    );
    fs.writeFileSync(
      launch,
      `New-PSDrive -Name C -PSProvider FileSystem -Root ${quote(work)} | Out-Null\nfunction Read-Host { ConvertTo-SecureString 'fictional-local-password' -AsPlainText -Force }\n${poison ? "$env:PGHOST='remote.invalid';$env:PGDATABASE='production';$env:PGPORT='9999';$env:PGSERVICE='wrong';$env:PGOPTIONS='-c search_path=unsafe'\n" : ""}& ${quote(scriptPath)} -PgBin ${quote(bin)} -ArchivePath 'C:\\Users\\c_mil\\Jaxon-Private-Backup\\current-game.dump'\nexit $LASTEXITCODE\n`,
    );
    const r = cp.spawnSync(pwsh, ["-NoProfile", "-File", launch], {
      env,
      encoding: "utf8",
    });
    const reports = fs
      .readdirSync(privateDir)
      .filter((x) => x.endsWith(".json") && !oldReports.has(x));
    assert.equal(reports.length, 1, "one private report");
    const report = JSON.parse(
      fs
        .readFileSync(path.join(privateDir, reports[0]), "utf8")
        .replace(/^\uFEFF/, ""),
    );
    const visible = r.stdout + r.stderr + JSON.stringify(report);
    for (const secret of [
      "PRIVATE_FICTIONAL_EMAIL",
      "PRIVATE_FICTIONAL_PASSWORD_HASH",
      "PRIVATE_FICTIONAL_JSON",
      "PRIVATE_FICTIONAL_SECRET",
      "fictional-local-password",
    ])
      assert.ok(
        !visible.includes(secret),
        "no sensitive values displayed/reported",
      );
    assert.deepEqual(fs.readFileSync(dump), original, "archive immutable");
    return { ...r, report };
  }
  let r = run(script, true);
  const target = r.report.target.split("/")[1];
  if (r.status !== 0 || r.report.status !== "PARTIAL") {
    console.error("Fictional rehearsal report:", JSON.stringify(r.report));
    console.error(r.stdout, r.stderr);
    throw Error("Supported restoration failed");
  }
  assert.equal(r.report.status, "PARTIAL");
  assert.equal(r.report.applicationChecks, "PASS");
  for (const table of [
    "v3_progress",
    "v3_wallet",
    "v3_pins",
    "v3_unlocks",
    "v3_transactions",
    "v3_game_resets",
    "v3_game_requests",
    "future_evidence",
  ])
    assert.equal(r.report.tableCounts["public." + table], 1, table);
  assert.equal(r.report.tableCounts["v52_staging_private.control"], 1);
  assert.equal(r.report.tableCounts["auth.users"], 2);
  assert.ok(
    r.report.managedDependencies.some(
      (x) => x.name === "supabase_vault" && !x.locallyAvailable && !x.restored,
    ),
  );
  assert.equal(
    sql(
      "select encrypted_password from auth.users where email='PRIVATE_FICTIONAL_EMAIL'",
      target,
    ),
    "PRIVATE_FICTIONAL_PASSWORD_HASH",
  );
  assert.equal(
    sql(
      "select to_regclass('vault.secrets') is null and to_regclass('managed_only.not_supported') is null",
      target,
    ),
    "t",
  );
  assert.equal(
    sql(`select has_database_privilege('anon','${target}','CONNECT')`, target),
    "f",
  );
  assert.equal(
    sql("select count(*) from old_restore_marker", "jaxon_restore_test"),
    "1",
  );
  assert.equal(
    sql(
      "select revision::text||'|'||game_epoch::text from public.v3_progress",
      target,
    ),
    "17|2",
  );
  pass(
    "current game + old tables + future public table + private control + actual Auth: original data/content digests, reset, PIN, wallet/receipt preservation; unavailable Vault explicitly excluded; no sensitive output",
  );
  r = run();
  assert.equal(r.status, 0);
  assert.notEqual(r.report.target, "localhost:5433/" + target);
  assert.equal(
    sql("select count(*) from old_restore_marker", "jaxon_restore_test"),
    "1",
  );
  assert.equal(sql("select count(*) from public.maths_families", target), "1");
  pass(
    "rerun creates a fresh database; previous recovery and old restore database remain intact",
  );
  function mutation(from, to) {
    const p = path.join(work, "guard-test.ps1");
    const source = fs.readFileSync(script, "utf8");
    assert.ok(source.includes(from));
    fs.writeFileSync(p, source.replace(from, to));
    return p;
  }
  r = run(mutation("port=5433 dbname=", "port=5432 dbname="));
  assert.notEqual(r.status, 0);
  assert.equal(r.report.status, "FAIL");
  pass("wrong port rejected");
  r = run(mutation("$state.address -notin", "'192.0.2.1' -notin"));
  assert.notEqual(r.status, 0);
  assert.equal(r.report.status, "FAIL");
  pass("non-loopback reported server rejected before database creation");
  r = run(
    mutation(
      "$script:TargetDatabase = 'esa_restore_' + [guid]::NewGuid().ToString('N')",
      "$script:TargetDatabase = 'source'",
    ),
  );
  assert.notEqual(r.status, 0);
  pass("invalid generated target refused without touching another database");
  r = run(
    mutation(
      "        $restoredCopy = Invoke-Pg",
      "        if ($table -eq 'public.v3_wallet') { [void](Query 'update public.v3_wallet set coins=coins+1;') }\n        $restoredCopy = Invoke-Pg",
    ),
  );
  assert.notEqual(r.status, 0);
  assert.equal(r.report.applicationChecks, "FAIL");
  pass("same row count but altered wallet is rejected by content digest");
  sql(
    "alter table auth.users add column missing_dependency managed_only.not_supported;",
  );
  d([
    "exec",
    name,
    "pg_dump",
    "-h",
    "127.0.0.1",
    "-p",
    "5433",
    "-U",
    "postgres",
    "-Fc",
    "-f",
    dump,
    "source",
  ]);
  original = fs.readFileSync(dump);
  r = run();
  assert.notEqual(r.status, 0);
  assert.equal(r.report.status, "FAIL");
  assert.match(r.report.reason, /Restore selected/);
  assert.equal(
    sql(
      "select count(*) from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname in ('public','auth')",
      r.report.target.split("/")[1],
    ),
    "0",
  );
  pass(
    "unsupported dependency aborts the restore transaction; no invented objects",
  );
  sql(
    "alter table auth.users drop column missing_dependency;drop table public.v3_game_requests;",
  );
  d([
    "exec",
    name,
    "pg_dump",
    "-h",
    "127.0.0.1",
    "-p",
    "5433",
    "-U",
    "postgres",
    "-Fc",
    "-f",
    dump,
    "source",
  ]);
  original = fs.readFileSync(dump);
  r = run();
  assert.notEqual(r.status, 0);
  assert.equal(r.report.status, "FAIL");
  assert.match(r.report.reason, /Inspect archive/);
  pass("missing current reset/request table fails before restore");
  console.log(
    `${suites} current-game recovery suites passed; PowerShell on Linux, network-disabled PostgreSQL, fictional records only. Owner Windows/archive not executed.`,
  );
} finally {
  try {
    d(["rm", "-f", name]);
  } catch {}
  fs.rmSync(work, { recursive: true, force: true });
}
