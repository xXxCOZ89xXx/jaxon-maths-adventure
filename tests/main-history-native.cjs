// Actual PostgreSQL 17 in Docker --network none. Never accepts a host or live credentials.
const fs = require("node:fs");
const cp = require("node:child_process");
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const {
  bootstrapSql,
  sources,
  lit,
} = require("./helpers/main-history-fixture.cjs");
const { prepare } = require("../scripts/prepare-main-history-preservation.cjs");
const name = "esa-main-preservation-" + process.pid;
const env = { ...process.env };
for (const k of Object.keys(env)) if (k.startsWith("DOCKER_")) delete env[k];
const host = ["--host=unix:///var/run/docker.sock"];
const docker = (args, input) =>
  cp
    .execFileSync("docker", [...host, ...args], {
      env,
      input,
      encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"],
      maxBuffer: 32 * 1024 * 1024,
    })
    .trim();
const sqlArgs = [
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
];
const sql = (s) => docker(sqlArgs, s);
const reject = (s, re) =>
  assert.throws(
    () => sql(s),
    (e) => re.test(String(e.stderr || e.message)),
  );
const p = prepare(),
  approval = "SET app.main_history_install_approved='yes';";
const learner = "11111111-1111-4111-8111-111111111111",
  parent = "22222222-2222-4222-8222-222222222222";
const claims = lit(
  JSON.stringify({
    sub: learner,
    amr: [{ method: "password", timestamp: Math.floor(Date.now() / 1000) }],
  }),
);
const prefix = `SET ROLE authenticated;SET request.jwt.claims=${claims};`;
async function run() {
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
        sql("SELECT 1");
        ready = true;
        break;
      } catch {
        await new Promise((r) => setTimeout(r, 100));
      }
    }
    assert(ready, "Fictional container did not start");
    sql(
      bootstrapSql + sources.map((f) => fs.readFileSync(f, "utf8")).join("\n"),
    );
    sql(`INSERT INTO auth.users VALUES('${learner}'),('${parent}');INSERT INTO auth.identities SELECT id,id FROM auth.users;
INSERT INTO public.maths_families VALUES('${learner}','${parent}');`);
    sql(prefix + "SELECT public.v3_set_pin('1234');");
    const token = JSON.parse(
      sql(prefix + "SELECT public.v3_unlock('1234');"),
    ).token;
    const request = {
      requestId: crypto.randomUUID(),
      revision: 0,
      gameEpoch: 0,
      progress: { original: true, unknown: { paused: [1, null, "2/3"] } },
    };
    const save = () =>
      JSON.parse(
        sql(
          prefix +
            `SELECT public.v3_request(${lit(token)},'save',${lit(JSON.stringify(request))});`,
        ),
      );
    const receipt = save();
    sql(
      "UPDATE public.v3_progress SET updated_at='2026-11-15T20:24:51.624774Z';UPDATE public.v3_transactions SET created_at='2026-11-15T20:24:51.624774Z';UPDATE public.v3_wallet SET last_active='2026-10-28T11:39:25.933273Z';",
    );
    const snapshot = () =>
      sql(
        "SELECT jsonb_agg(to_jsonb(p)) FROM public.v3_progress p;SELECT jsonb_agg(to_jsonb(p)) FROM public.v3_wallet p;SELECT jsonb_agg(to_jsonb(p)) FROM public.v3_transactions p;SELECT jsonb_agg(to_jsonb(p)) FROM public.v3_game_requests p;",
      );
    const before = snapshot();
    assert(JSON.parse(sql(p.precheckSql)).sourceContractsMatch);
    reject(p.sql, /Specific Main/);
    sql("GRANT SELECT(hash) ON public.v3_pins TO authenticated");
    reject(approval + p.sql, /column grant/);
    sql("REVOKE SELECT(hash) ON public.v3_pins FROM authenticated");
    reject(
      approval +
        p.sql.replace(
          "DO $preserve$",
          "UPDATE public.v3_wallet SET coins=coins+1;DO $preserve$",
        ),
      /Original rows changed/,
    );
    assert.equal(snapshot(), before);
    assert.equal(
      sql("SELECT to_regclass('public.v3_history_settings') IS NULL"),
      "t",
    );
    console.log(
      "PASS native source contracts, column grants, approval refusal and atomic corruption rollback",
    );
    const writer = cp.spawn("docker", [...host, ...sqlArgs], {
      env,
      stdio: ["pipe", "pipe", "pipe"],
    });
    const finished = new Promise((resolve, reject) => {
      writer.once("error", reject);
      writer.once("close", (code) =>
        code === 0
          ? resolve()
          : reject(new Error("Fictional lock holder failed")),
      );
    });
    const locked = new Promise((resolve, reject) => {
      const timeout = setTimeout(
        () => reject(new Error("Fictional lock holder did not become ready")),
        10000,
      );
      let output = "";
      writer.stdout.on("data", (chunk) => {
        output += String(chunk);
        if (output.includes("fictional-lock-held")) {
          clearTimeout(timeout);
          resolve();
        }
      });
      writer.once("error", (e) => {
        clearTimeout(timeout);
        reject(e);
      });
    });
    writer.stdin.end(
      "BEGIN;LOCK TABLE public.v3_wallet IN ROW EXCLUSIVE MODE;SELECT 'fictional-lock-held';SELECT pg_sleep(6);COMMIT;",
    );
    // Observe both promises on all paths, so a failed holder cannot leave an unhandled rejection.
    finished.catch(() => {});
    try {
      await locked;
      reject(approval + p.sql, /lock timeout/);
      assert.equal(
        sql("SELECT to_regclass('public.v3_history_settings') IS NULL"),
        "t",
      );
    } finally {
      await finished;
    }
    assert.equal(snapshot(), before);
    console.log(
      "PASS native concurrent writer causes bounded lock-timeout rollback; original work unchanged",
    );
    const installed = sql(approval + p.sql);
    assert(installed.includes('"originalRowsPreserved": true'));
    assert.equal(snapshot(), before);
    assert.deepEqual(save(), receipt);
    assert.equal(
      sql("SELECT enabled OR write_enabled FROM public.v3_history_settings"),
      "f",
    );
    reject(approval + p.sql, /Fresh absent-history/);
    assert.equal(snapshot(), before);
    const activation =
      require("../scripts/prepare-main-history-activation.cjs").prepare();
    reject(activation.sql, /Specific Main activation/);
    const activationApproval =
      "SET app.main_history_activation_approved='yes';";
    reject(
      activationApproval +
        activation.sql.replace(
          "DO $preserve$",
          "UPDATE public.v3_wallet SET coins=coins+1;DO $preserve$",
        ),
      /Original rows changed/,
    );
    assert.equal(snapshot(), before);
    assert.equal(
      sql("SELECT enabled OR write_enabled FROM public.v3_history_settings"),
      "f",
    );
    sql(activationApproval + activation.sql);
    assert.equal(snapshot(), before);
    assert.deepEqual(save(), receipt);
    assert.equal(
      sql("SELECT public.v3_identity()->>'progressStorageVersion'"),
      "2",
    );
    reject(activationApproval + activation.sql, /Fresh disabled empty history/);
    console.log(
      "PASS native activation approval, corruption rollback, old retry preservation and rerun refusal",
    );
    fs.writeFileSync(
      "tests/artifacts/main-history-native-verification.json",
      JSON.stringify(
        {
          runtime: "Native PostgreSQL 17, Docker --network none",
          sourceContractsMatch: true,
          columnGrantRefusal: true,
          atomicCorruptionRollback: true,
          concurrentWriterTimeoutRollback: true,
          disabledInstallation: true,
          oldSaveRetryPreserved: true,
          hostedSqlExecuted: false,
        },
        null,
        2,
      ) + "\n",
    );
    console.log(
      "PASS native disabled installation, exact original data and old request acknowledgement preservation",
    );
  } finally {
    try {
      docker(["rm", "-f", name]);
    } catch {}
  }
}
run().catch((e) => {
  console.error(String(e.stderr || e.stack || e));
  process.exitCode = 1;
});
