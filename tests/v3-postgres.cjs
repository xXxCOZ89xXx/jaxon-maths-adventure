// Real PostgreSQL/pgcrypto/RLS tests in a disposable, network-disabled container.
// auth.uid()/auth.jwt() emulate PostgREST signed claims, NOT a real Supabase Auth service.
const { execFileSync, execFile } = require("node:child_process"),
  fs = require("node:fs"),
  assert = require("node:assert/strict"),
  crypto = require("node:crypto");
const env = { ...process.env };
for (const k of [
  "DOCKER_HOST",
  "DOCKER_CONTEXT",
  "DOCKER_TLS",
  "DOCKER_TLS_VERIFY",
  "DOCKER_CERT_PATH",
])
  delete env[k];
const name = "jaxon-v3-security-" + process.pid,
  dargs = ["--host=unix:///var/run/docker.sock"];
function docker(args, input) {
  return execFileSync("docker", [...dargs, ...args], {
    env,
    input,
    encoding: "utf8",
    stdio: ["pipe", "pipe", "pipe"],
  }).trim();
}
function sql(s) {
  return docker(
    [
      "exec",
      "-i",
      name,
      "psql",
      "-h",
      "127.0.0.1",
      "-X",
      "-qAt",
      "-v",
      "ON_ERROR_STOP=1",
      "-U",
      "postgres",
    ],
    s,
  );
}
const ids = {
  learner: "11111111-1111-4111-8111-111111111111",
  parent: "22222222-2222-4222-8222-222222222222",
  other: "33333333-3333-4333-8333-333333333333",
  otherParent: "44444444-4444-4444-8444-444444444444",
};
const lit = (x) => "'" + String(x).replaceAll("'", "''") + "'";
function prefix(role, amr = true) {
  return `set role authenticated;set request.jwt.claims=${lit(JSON.stringify({ sub: ids[role], amr: amr ? [{ method: "password", timestamp: Math.floor(Date.now() / 1000) }] : [] }))};`;
}
function call(role, fn, args = "", amr = true) {
  return sql(prefix(role, amr) + `select public.${fn}(${args});`);
}
function request(role, token, op, args = {}) {
  return JSON.parse(
    call(
      role,
      "v3_request",
      [lit(token), lit(op), lit(JSON.stringify(args)) + "::jsonb"].join(","),
    ),
  );
}
function rejects(fn, pattern) {
  assert.throws(fn, (e) => pattern.test(String(e.stderr || e.message)));
}
let count = 0;
function test(title, fn) {
  fn();
  count++;
  console.log("PASS", title);
}
(async () => {
  try {
    docker([
      "run",
      "--rm",
      "--name",
      name,
      "--network",
      "none",
      "-e",
      "POSTGRES_HOST_AUTH_METHOD=trust",
      "-d",
      "postgres:17-alpine",
    ]);
    for (let i = 0; i < 100; i++) {
      try {
        sql("select 1");
        break;
      } catch {
        await new Promise((r) => setTimeout(r, 250));
      }
    }
    sql(`create role anon nologin;create role authenticated nologin;create schema auth;create table auth.users(id uuid primary key);
 create function auth.jwt() returns jsonb language sql stable as $$select coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb$$;
 create function auth.uid() returns uuid language sql stable as $$select (auth.jwt()->>'sub')::uuid$$;
 grant usage on schema auth to anon,authenticated;grant execute on function auth.jwt(),auth.uid() to anon,authenticated;`);
    const migration = fs.readFileSync(
      "supabase/v3-staging/001_secure_core.sql",
      "utf8",
    );
    test("migration refuses unverified project", () =>
      rejects(() => sql(migration), /Verify and authorise/));
    sql(
      "set app.v3.staging_authorized='yes';set app.v3.staging_ref='abcdefghijklmnopqrst';\n" +
        migration,
    );
    for (const f of ["002_catalog.sql", "003_import_compatibility.sql"])
      sql(fs.readFileSync("supabase/v3-staging/" + f, "utf8"));
    sql(
      `insert into auth.users values ${Object.values(ids)
        .map((id) => "(" + lit(id) + ")")
        .join(
          ",",
        )};insert into public.maths_families values('${ids.learner}','${ids.parent}'),('${ids.other}','${ids.otherParent}');`,
    );
    const fixture = {
      coins: 123,
      earned: 250,
      minutes: 18,
      bought: ["cap"],
      equipped: ["cap"],
      skills: { legacy: { state: "mastered" } },
      customFuture: { untouched: true },
      quest: { world: "number", i: 1, selected: [2], assisted: true },
    };
    test("privileged V2 fixture import preserves unknown fields, balances and items", () => {
      sql(
        `select public.v3_admin_import('${ids.learner}',${lit(JSON.stringify(fixture))}::jsonb);`,
      );
      const got = JSON.parse(
        sql(
          `select progress from public.v3_progress where child_user_id='${ids.learner}'`,
        ),
      );
      assert.deepEqual(got, fixture);
      rejects(
        () => sql(`select public.v3_admin_import('${ids.learner}','{}');`),
        /existing data is never overwritten/,
      );
      rejects(
        () => call("learner", "v3_admin_import", `'${ids.learner}','{}'`),
        /permission denied/,
      );
    });
    test("PIN enrollment needs recent account-password authentication and correct role length", () => {
      rejects(
        () => call("learner", "v3_set_pin", "'1234'", false),
        /Sign in again/,
      );
      rejects(() => call("parent", "v3_set_pin", "'1234'"), /length/);
      for (const role of Object.keys(ids))
        call(
          role,
          "v3_set_pin",
          lit(role.toLowerCase().includes("parent") ? "654321" : "1234"),
        );
      const hash = sql(
        `select hash from public.v3_pins where user_id='${ids.learner}'`,
      );
      assert.match(hash, /^\$2/);
      assert.notEqual(hash, "1234");
    });
    test("incorrect PIN attempts commit, throttle across sessions and recover after cooldown", () => {
      for (let i = 0; i < 5; i++)
        assert.ok(JSON.parse(call("learner", "v3_unlock", "'0000'")).error);
      assert.match(
        JSON.parse(call("learner", "v3_unlock", "'1234'")).error,
        /five minutes/,
      );
      assert.equal(
        sql(
          `select attempts from public.v3_pins where user_id='${ids.learner}'`,
        ),
        "5",
      );
      sql(
        `update public.v3_pins set blocked_until=now()-interval '1 second' where user_id='${ids.learner}'`,
      );
    });
    const tokens = Object.fromEntries(
      Object.keys(ids).map((r) => [
        r,
        JSON.parse(
          call(
            r,
            "v3_unlock",
            lit(r.toLowerCase().includes("parent") ? "654321" : "1234"),
          ),
        ).token,
      ]),
    );
    const req = (r, op, a = {}) => request(r, tokens[r], op, a);
    test("PIN required on server for reads and writes; tokens cannot cross accounts", () => {
      rejects(() => request("learner", "wrong", "read"), /Unlock required/);
      rejects(
        () => request("parent", tokens.learner, "read"),
        /Unlock required/,
      );
      assert.equal(
        req("learner", "read").progress.customFuture.untouched,
        true,
      );
    });
    test("RLS and grants deny direct data access, cross-family reads, catalog and ledger tampering", () => {
      for (const table of [
        "v3_pins",
        "v3_progress",
        "v3_wallet",
        "v3_transactions",
        "maths_families",
      ])
        rejects(
          () => sql(prefix("learner") + `select * from public.${table}`),
          /permission denied/,
        );
      rejects(
        () =>
          sql(prefix("learner") + `update public.v3_wallet set bonus=99999`),
        /permission denied/,
      );
      // Temporarily grant SELECT to prove actual RLS denies rows, then restore grants.
      sql("grant select on public.v3_progress to authenticated;");
      assert.equal(
        sql(prefix("other") + "select count(*) from public.v3_progress"),
        "0",
      );
      sql("revoke select on public.v3_progress from authenticated;");
      assert.deepEqual(req("other", "read").progress, {});
      assert.deepEqual(req("otherParent", "read").progress, {});
      assert.equal(req("parent", "read").wallet.coins, 123);
    });
    test("parent/learner permissions are enforced in SQL independently of UI", () => {
      rejects(
        () =>
          req("learner", "award", {
            amount: 60,
            requestId: crypto.randomUUID(),
          }),
        /Parent account/,
      );
      rejects(
        () =>
          req("parent", "save", {
            revision: 0,
            progress: {},
            requestId: crypto.randomUUID(),
          }),
        /Learner account/,
      );
      rejects(
        () =>
          req("parent", "buy", { item: "cap", requestId: crypto.randomUUID() }),
        /Learner account/,
      );
    });
    test("reward and purchase retries are idempotent; request reuse and insufficient funds fail", () => {
      const a = { amount: 60, requestId: crypto.randomUUID() };
      const first = req("parent", "award", a);
      assert.deepEqual(req("parent", "award", a), first);
      rejects(() => req("parent", "award", { ...a, amount: 59 }), /reused/);
      const b = { item: "glasses", requestId: crypto.randomUUID() };
      const bought = req("learner", "buy", b);
      assert.deepEqual(req("learner", "buy", b), bought);
      assert.equal(req("parent", "read").wallet.coins, 53);
      assert.equal(req("parent", "read").wallet.bonus, 60);
      assert.ok(req("learner", "read").wallet.owned.includes("cap"));
      rejects(
        () =>
          req("learner", "buy", {
            item: "dragon",
            requestId: crypto.randomUUID(),
          }),
        /Not enough/,
      );
      rejects(
        () =>
          req("learner", "buy", {
            item: "hacked",
            requestId: crypto.randomUUID(),
          }),
        /Unknown item/,
      );
    });
    test("CAS saves reject stale devices, preserve exact quest and never accept a client wallet", () => {
      const a = {
        requestId: crypto.randomUUID(),
        revision: 0,
        progress: { ...fixture, coins: 999999, bought: ["dragon"] },
      };
      assert.equal(req("learner", "save", a).revision, 1);
      assert.equal(req("learner", "save", a).revision, 1);
      const stale = req("learner", "save", {
        ...a,
        requestId: crypto.randomUUID(),
        progress: { quest: { i: 2 } },
      });
      assert.ok(stale.conflict);
      assert.deepEqual(stale.progress.quest, fixture.quest);
      assert.equal(req("learner", "read").wallet.coins, 53);
      assert.ok(!req("learner", "read").wallet.owned.includes("dragon"));
    });
    test("server time caps duplicate/concurrent active credit; redemption is parent only and 1:1", () => {
      sql(
        `update public.v3_wallet set last_active=now()-interval '60 seconds' where child_user_id='${ids.learner}'`,
      );
      const a = { seconds: 99999, requestId: crypto.randomUUID() };
      const creditStart = Date.now();
      const first = req("learner", "active", a);
      req("learner", "active", a);
      assert.equal(first.wallet.active_seconds, 18 * 60 + 15);
      assert.equal(first.wallet.coins, 55.5);
      req("learner", "active", {
        seconds: 99999,
        requestId: crypto.randomUUID(),
      });
      assert.ok(
        req("learner", "read").wallet.active_seconds <=
          18 * 60 + 15 + (Date.now() - creditStart) / 1000 + 0.05,
      );
      const red = { amount: 10, requestId: crypto.randomUUID() };
      req("parent", "redeem", red);
      req("parent", "redeem", red);
      assert.equal(req("parent", "read").wallet.redeemed, 10);
      rejects(
        () =>
          req("parent", "redeem", {
            amount: 60,
            requestId: crypto.randomUUID(),
          }),
        /Not enough/,
      );
    });
    const asyncSQL = (s) =>
      new Promise((resolve, reject) =>
        execFile(
          "docker",
          [
            ...dargs,
            "exec",
            "-i",
            name,
            "psql",
            "-h",
            "127.0.0.1",
            "-X",
            "-qAt",
            "-v",
            "ON_ERROR_STOP=1",
            "-U",
            "postgres",
            "-c",
            s,
          ],
          { env },
          (e, out, err) => (e ? reject(Error(err)) : resolve(out.trim())),
        ),
      );
    const concurrent = {
      requestId: crypto.randomUUID(),
      revision: 1,
      progress: { quest: { i: 2 } },
    };
    const payload =
      prefix("learner") +
      `select public.v3_request('${tokens.learner}','save',${lit(JSON.stringify(concurrent))}::jsonb);`;
    const results = await Promise.all(
      Array.from({ length: 4 }, () => asyncSQL(payload)),
    );
    assert.ok(results.every((x) => JSON.parse(x).revision === 2));
    assert.equal(req("learner", "read").revision, 2);
    count++;
    console.log("PASS concurrent identical saves commit exactly once");
    test("parent-reviewed offline minutes reconcile 1:1 once, bounded by saved evidence", () => {
      req("learner", "save", {
        revision: 2,
        progress: { minutes: 20 },
        requestId: crypto.randomUUID(),
      });
      const confirm = { amount: 1, requestId: crypto.randomUUID() };
      rejects(
        () => req("learner", "confirm_offline", confirm),
        /Parent account/,
      );
      const before = req("parent", "read").wallet;
      req("parent", "confirm_offline", confirm);
      req("parent", "confirm_offline", confirm);
      const after = req("parent", "read").wallet;
      assert.equal(after.active_seconds, before.active_seconds + 60);
      assert.ok(Math.abs(after.coins - before.coins - 10) < 1e-8);
      rejects(
        () =>
          req("parent", "confirm_offline", {
            amount: 2,
            requestId: crypto.randomUUID(),
          }),
        /Not enough uncredited/,
      );
    });
    test("locking, expiration and password-backed PIN recovery revoke server unlocks", () => {
      req("other", "lock");
      rejects(() => req("other", "read"), /Unlock required/);
      sql(
        `update public.v3_unlocks set expires_at=now()-interval '1 second' where user_id='${ids.otherParent}'`,
      );
      rejects(() => req("otherParent", "read"), /Unlock required/);
      call("parent", "v3_set_pin", "'234567'");
      rejects(() => req("parent", "read"), /Unlock required/);
      assert.ok(JSON.parse(call("parent", "v3_unlock", "'234567'")).token);
    });
    console.log(
      `${count} real PostgreSQL security suites passed. No hosted Supabase or real accounts used.`,
    );
  } finally {
    try {
      docker(["rm", "-f", name]);
    } catch {}
  }
})().catch((e) => {
  console.error(e.stderr?.toString() || e);
  process.exitCode = 1;
});
