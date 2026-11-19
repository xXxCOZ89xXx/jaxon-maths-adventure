// Disposable PostgreSQL, network disabled, synthetic identities only.
const fs = require("node:fs"),
  assert = require("node:assert/strict"),
  crypto = require("node:crypto"),
  cp = require("node:child_process"),
  { V3HistoryStorage: H } = require("../v3/history-storage.js");
const env = { ...process.env };
for (const k of [
  "DOCKER_HOST",
  "DOCKER_CONTEXT",
  "DOCKER_TLS",
  "DOCKER_TLS_VERIFY",
  "DOCKER_CERT_PATH",
])
  delete env[k];
const name = "history-storage-" + process.pid,
  lit = (x) => "'" + String(x).replaceAll("'", "''") + "'";
const docker = (args, input) =>
  cp
    .execFileSync("docker", ["--host=unix:///var/run/docker.sock", ...args], {
      env,
      input,
      encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"],
      maxBuffer: 32 * 1024 * 1024,
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
const ids = {
    learner: "11111111-1111-4111-8111-111111111111",
    parent: "22222222-2222-4222-8222-222222222222",
    other: "33333333-3333-4333-8333-333333333333",
    otherParent: "44444444-4444-4444-8444-444444444444",
  },
  tokens = {};
const prefix = (who) =>
  `set role authenticated;set request.jwt.claims=${lit(JSON.stringify({ sub: ids[who], amr: [{ method: "password", timestamp: Math.floor(Date.now() / 1000) }] }))};`;
const req = (who, op, args = {}) =>
  JSON.parse(
    sql(
      prefix(who) +
        `select public.v3_request(${lit(tokens[who])},${lit(op)},${lit(JSON.stringify(args))});`,
    ),
  );
const reject = (fn, re) =>
  assert.throws(fn, (e) => re.test(String(e.stderr || e.message)));
(async () => {
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
    let ready = false;
    for (let i = 0; i < 100; i++) {
      try {
        sql("select 1");
        ready = true;
        break;
      } catch {
        await new Promise((r) => setTimeout(r, 100));
      }
    }
    assert(ready);
    sql(
      `create role anon;create role authenticated;create role service_role bypassrls;create schema auth;create table auth.users(id uuid primary key);create function auth.jwt() returns jsonb language sql stable as $$select coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb$$;create function auth.uid() returns uuid language sql stable as $$select (auth.jwt()->>'sub')::uuid$$;grant usage on schema auth to anon,authenticated;grant execute on function auth.jwt(),auth.uid() to anon,authenticated;set app.v3.staging_authorized='yes';set app.v3.staging_ref='sfogrvedypgtxfvecmbx';` +
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
      "set app.base_camp_reset_reviewed='yes';" +
        fs.readFileSync("supabase/base-camp/001_parent_game_reset.sql", "utf8"),
    );
    sql(
      `insert into auth.users values ${Object.values(ids)
        .map((x) => "(" + lit(x) + ")")
        .join(
          ",",
        )};insert into public.maths_families values('${ids.learner}','${ids.parent}'),('${ids.other}','${ids.otherParent}');`,
    );
    for (const who of Object.keys(ids)) {
      sql(
        prefix(who) +
          `select public.v3_set_pin(${lit(who.includes("arent") ? "654321" : "1234")});`,
      );
      tokens[who] = JSON.parse(
        sql(
          prefix(who) +
            `select public.v3_unlock(${lit(who.includes("arent") ? "654321" : "1234")});`,
        ),
      ).token;
      req(who, "read");
    }
    const old = {
      requestId: crypto.randomUUID(),
      revision: 0,
      gameEpoch: 0,
      progress: { original: "preserved" },
    };
    const oldResult = req("learner", "save", old);
    const before = sql(
        "select jsonb_agg(to_jsonb(p)) from public.v3_progress p",
      ),
      migration = fs.readFileSync(
        "supabase/history/001_retained_history.sql",
        "utf8",
      );
    const preflight = fs.readFileSync(
      "supabase/history/000_preflight.sql",
      "utf8",
    );
    const reviewModule = require("../scripts/prepare-main-history-review.cjs");
    const mainReview = reviewModule.prepare();
    assert.equal(
      fs.readFileSync(
        "supabase/history/main-review/READ-ONLY-MAIN-CONTRACT.sql",
        "utf8",
      ),
      mainReview.sql,
    );
    assert.deepEqual(
      JSON.parse(
        fs.readFileSync("supabase/history/main-review/MANIFEST.json", "utf8"),
      ),
      mainReview.manifest,
    );
    reject(
      () => reviewModule.prepare((f) => fs.readFileSync(f, "utf8") + "\n"),
      /read-only source changed/,
    );
    const review = () => JSON.parse(sql(mainReview.sql));
    reject(
      () =>
        sql(
          mainReview.sql.replace(
            "SET LOCAL statement_timeout='10s';",
            "SET LOCAL statement_timeout='10s';UPDATE public.v3_wallet SET bonus=bonus+1;",
          ),
        ),
      /read-only transaction/,
    );
    reject(() => sql(preflight), /verified project/);
    reject(
      () =>
        sql(
          "set app.history_expected_project_ref='abcdefghijklmnopqrst';" +
            preflight,
        ),
      /verified project/,
    );
    const inspected = review();
    assert.equal(inspected.projectRef, "sfogrvedypgtxfvecmbx");
    sql("update public.v3_environment set project_ref='abcdefghijklmnopqrst'");
    reject(() => review(), /verified project/);
    sql("update public.v3_environment set project_ref='sfogrvedypgtxfvecmbx'");
    assert.equal(inspected.historyAlreadyInstalled, false);
    assert.equal(inspected.authenticatedRequestAllowed, true);
    assert.equal(inspected.anonymousRequestDenied, true);
    assert.equal(inspected.baseResetDelegatePrivate, true);
    for (const table of Object.values(inspected.tables)) {
      assert.equal(table.present, true);
      assert.equal(table.rls, true);
      assert.equal(table.noClientTableAccess, true);
    }
    for (const routine of Object.values(inspected.routines)) {
      assert.equal(routine.present, true);
      assert.equal(routine.secureDefiner, true);
      assert.match(routine.definitionSha256, /^[a-f0-9]{64}$/);
    }
    sql("grant select on public.v3_wallet to anon;");
    assert.equal(
      review().tables["public.v3_wallet"].noClientTableAccess,
      false,
    );
    sql("revoke select on public.v3_wallet from anon;");
    assert.equal(
      sql("select jsonb_agg(to_jsonb(p)) from public.v3_progress p"),
      before,
    );
    console.log(
      "PASS read-only installed-contract review: project guard, table/RLS/grant inspection, secure routine hashes, leaked grant detection; no record output or data changes.",
    );
    reject(() => sql(migration), /Reviewed/);
    reject(
      () =>
        sql(
          "set app.history_expected_project_ref='sfogrvedypgtxfvecmbx';set app.history_storage_reviewed='yes';" +
            migration.replace(
              /COMMIT;\s*$/,
              "DO $$BEGIN RAISE EXCEPTION 'fictional late failure';END$$;COMMIT;",
            ),
        ),
      /fictional late failure/,
    );
    assert.equal(
      sql("select to_regclass('public.v3_history_nodes') is null"),
      "t",
    );
    sql(
      "set app.history_expected_project_ref='sfogrvedypgtxfvecmbx';set app.history_storage_reviewed='yes';" +
        migration,
    );
    assert.equal(
      sql("select jsonb_agg(to_jsonb(p)) from public.v3_progress p"),
      before,
    );
    assert.deepEqual(req("learner", "save", old), oldResult);
    reject(() => req("learner", "read_v2"), /not enabled/);
    const activate = fs.readFileSync(
      "supabase/history/002_enable_retained_history.sql",
      "utf8",
    );
    reject(() => sql(activate), /Reviewed/);
    sql(
      "set app.history_cutover_reviewed='yes';set app.history_expected_project_ref='sfogrvedypgtxfvecmbx';set app.history_client_release='cccccccccccccccccccccccccccccccccccccccc';" +
        activate,
    );
    const s = {
      skills: {
        place: {
          independentEvidence: Array.from({ length: 128 }, (_, i) => ({
            at: i,
            questionKey: "fixture/" + i,
            original: "x".repeat(17000),
          })),
        },
      },
      seen: ["original"],
      unknown: { retained: true },
    };
    assert(Buffer.byteLength(JSON.stringify(s)) > 2000000);
    const transport = H.transport((op, args) => req("learner", op, args), {
        epoch: () => 0,
      }),
      pending = {
        storageVersion: 2,
        requestId: crypto.randomUUID(),
        revision: 1,
        gameEpoch: 0,
        progress: s,
      };
    const saved = await transport("save", pending);
    assert.equal(saved.revision, 2);
    const count = sql("select count(*) from public.v3_history_nodes");
    assert.deepEqual(await transport("save", pending), saved);
    assert.equal(sql("select count(*) from public.v3_history_nodes"), count);
    assert.deepEqual((await transport("read")).progress, s);
    assert.deepEqual(req("learner", "save", old), oldResult);
    reject(() => req("learner", "read"), /UPDATE_REQUIRED/);
    reject(
      () =>
        req("learner", "save", {
          ...old,
          requestId: crypto.randomUUID(),
          revision: 2,
        }),
      /UPDATE_REQUIRED/,
    );
    const packed = await H.pack(s),
      root = packed.progress._historyV2.refs[0].root;
    assert.deepEqual(
      req("other", "history_get", { ids: [root], gameEpoch: 0 }).nodes,
      [],
    );
    assert.equal(
      req("parent", "history_get", { ids: [root], gameEpoch: 0 }).nodes.length,
      1,
    );
    reject(
      () =>
        req("parent", "history_put", { node: packed.nodes[0], gameEpoch: 0 }),
      /Learner/,
    );
    reject(
      () =>
        req("learner", "history_put", {
          node: { id: root, body: "{}" },
          gameEpoch: 0,
        }),
      /hash mismatch/,
    );
    reject(
      () =>
        req("learner", "history_put", { node: packed.nodes[0], gameEpoch: 99 }),
      /GAME_RESET_REQUIRED/,
    );
    const invalid = JSON.parse(JSON.stringify(packed.progress));
    invalid._historyV2.refs[0].root = "0".repeat(64);
    reject(
      () =>
        req("learner", "save_v2", {
          ...pending,
          revision: 2,
          requestId: crypto.randomUUID(),
          progress: invalid,
        }),
      /missing or invalid/,
    );
    assert.equal(req("learner", "read_v2").revision, 2);
    for (const role of ["anon", "authenticated", "service_role"])
      for (const table of ["v3_history_nodes", "v3_history_roots"])
        reject(
          () => sql(`set role ${role};select * from public.${table};`),
          /permission denied/,
        );
    sql("update public.v3_history_settings set write_enabled=false");
    assert.deepEqual((await transport("read")).progress, s);
    reject(
      () =>
        req("learner", "save_v2", {
          ...pending,
          requestId: crypto.randomUUID(),
          revision: 2,
          progress: packed.progress,
        }),
      /writes are paused/,
    );
    assert.deepEqual(await transport("save", pending), saved);
    sql("update public.v3_history_settings set write_enabled=true");
    const firstPage = req("parent", "history_roots", {
      gameEpoch: 0,
      limit: 1,
    });
    assert.equal(firstPage.roots.length, 1);
    const nextPage = req("parent", "history_roots", {
      gameEpoch: 0,
      limit: 1,
      cursor: firstPage.nextCursor,
    });
    assert.equal(nextPage.roots.length, 1);
    assert.notEqual(nextPage.roots[0].root, firstPage.roots[0].root);
    assert.deepEqual(req("other", "history_roots", { gameEpoch: 0 }).roots, []);
    const rootCount = sql("select count(*) from public.v3_history_roots");
    sql(
      "create function public.fixture_history_failure() returns trigger language plpgsql as $$begin raise exception 'fictional commit failure';end$$;create trigger fixture_history_failure before insert on public.v3_history_roots for each row execute function public.fixture_history_failure();",
    );
    const recovery = {
      ...pending,
      requestId: crypto.randomUUID(),
      revision: 2,
      progress: { ...s, retainedAfterConflict: true },
    };
    await assert.rejects(transport("save", recovery), (e) =>
      /fictional commit failure/.test(String(e.stderr || e.message)),
    );
    assert.equal(req("learner", "read_v2").revision, 2);
    assert.equal(
      sql("select count(*) from public.v3_history_roots"),
      rootCount,
    );
    sql(
      "drop trigger fixture_history_failure on public.v3_history_roots;drop function public.fixture_history_failure()",
    );
    assert.equal((await transport("save", recovery)).revision, 3);
    assert.equal((await transport("save", pending)).revision, 2);
    assert.equal(req("learner", "read_v2").revision, 3);
    const reset = req("parent", "reset_game", {
      requestId: crypto.randomUUID(),
      gameEpoch: 0,
      revision: 3,
      confirmation: "RESET ALL GAME PROGRESS",
    });
    assert.equal(reset.gameEpoch, 1);
    assert.equal(sql("select count(*) from public.v3_history_nodes"), count);
    tokens.learner = JSON.parse(
      sql(prefix("learner") + "select public.v3_unlock('1234');"),
    ).token;
    assert.deepEqual(
      req("learner", "history_get", { ids: [root], gameEpoch: 1 }).nodes,
      [],
    );
    reject(
      () => req("learner", "history_get", { ids: [root], gameEpoch: 0 }),
      /GAME_RESET_REQUIRED/,
    );
    console.log(
      "PASS history database: additive disabled installation, full rollback, >2MB exact restore, bounded saves, immutable retries, V1 receipt bridge/refusal, missing pages, roles/family isolation, write pause and reset generation fencing.",
    );
  } finally {
    try {
      docker(["rm", "-f", name]);
    } catch {}
  }
})().catch((e) => {
  console.error(String(e.stderr || e.stack || e));
  process.exitCode = 1;
});
