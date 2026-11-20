// In-memory PostgreSQL 17, no network listener, fictional identities only.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const { fixture, lit } = require("./helpers/main-history-fixture.cjs");
const { rebuild } = require("../scripts/rebuild-main-history-baseline.cjs");
const {
  prepare,
  sourceFile,
  baselineFile,
} = require("../scripts/prepare-main-history-preservation.cjs");
const { V3HistoryStorage: H } = require("../v3/history-storage.js");
const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const approval = "SET app.main_history_install_approved='yes';";
const ids = {
  learner: "11111111-1111-4111-8111-111111111111",
  parent: "22222222-2222-4222-8222-222222222222",
  other: "33333333-3333-4333-8333-333333333333",
  otherParent: "44444444-4444-4444-8444-444444444444",
};
const tokens = {};
const prefix = (who) =>
  `SET ROLE authenticated;SET request.jwt.claims=${lit(JSON.stringify({ sub: ids[who], amr: [{ method: "password", timestamp: Math.floor(Date.now() / 1000) }] }))};`;
const p = prepare();
let passed = 0;
const check = (name, fn) =>
  Promise.resolve()
    .then(fn)
    .then(() => {
      passed++;
      console.log("PASS " + name);
    });
async function run() {
  await check(
    "source baseline is reproducible from pristine fictional SQL",
    async () =>
      assert.deepEqual(JSON.parse(read(baselineFile)), await rebuild()),
  );
  await check("source drift and baseline tampering are refused", async () => {
    assert.throws(
      () => prepare((f) => read(f) + (f === sourceFile ? "\n" : "")),
      /source changed/,
    );
    assert.throws(
      () =>
        prepare((f) =>
          f === baselineFile
            ? read(f).replace('"postgres"', '"anon"')
            : read(f),
        ),
      /baseline.*changed/i,
    );
  });
  const db = await fixture();
  const one = async (s) => (await db.query(s)).rows[0];
  const exec = async (s) => {
    await db.exec(s);
  };
  const req = async (who, op, args = {}) => {
    try {
      await exec(prefix(who));
      return (
        await one(
          `SELECT public.v3_request(${lit(tokens[who])},${lit(op)},${lit(JSON.stringify(args))}) AS value`,
        )
      ).value;
    } finally {
      await exec("RESET ROLE;RESET request.jwt.claims;");
    }
  };
  const reject = async (s, re) => {
    await assert.rejects(exec(s), re);
    await exec("ROLLBACK;RESET ROLE;");
  };
  const absent = async () =>
    assert.equal(
      (
        await one(
          "SELECT to_regclass('public.v3_history_settings') IS NULL AS absent",
        )
      ).absent,
      true,
    );
  try {
    await exec(`INSERT INTO auth.users VALUES ${Object.values(ids)
      .map((id) => "(" + lit(id) + ")")
      .join(",")};
INSERT INTO auth.identities SELECT id,id FROM auth.users;
INSERT INTO public.maths_families VALUES('${ids.learner}','${ids.parent}'),('${ids.other}','${ids.otherParent}');`);
    for (const who of Object.keys(ids)) {
      const pin = who.toLowerCase().includes("parent") ? "654321" : "1234";
      await exec(prefix(who));
      await one(`SELECT public.v3_set_pin(${lit(pin)})`);
      tokens[who] = (
        await one(`SELECT public.v3_unlock(${lit(pin)}) AS value`)
      ).value.token;
      await exec("RESET ROLE;RESET request.jwt.claims;");
      await req(who, "read");
    }
    const old = {
      requestId: crypto.randomUUID(),
      revision: 0,
      gameEpoch: 0,
      progress: {
        original: "preserved",
        unknown: { nested: ["original", null, 7] },
        paused: { questionKey: "fixture/original", answer: "2/3" },
      },
    };
    const oldResult = await req("learner", "save", old);
    await exec(`UPDATE public.v3_progress SET updated_at='2026-11-15T20:24:51.624774Z';
UPDATE public.v3_transactions SET created_at='2026-11-15T20:24:51.624774Z';
UPDATE public.v3_wallet SET last_active='2026-10-28T11:39:25.933273Z';
CREATE SCHEMA v52_staging_private;CREATE TABLE v52_staging_private.fixture_unknown(payload jsonb);
INSERT INTO v52_staging_private.fixture_unknown VALUES ('{"unknown":"preserved"}');
CREATE TABLE public.fixture_unknown_columns(payload jsonb,original text);
INSERT INTO public.fixture_unknown_columns VALUES('{"paused":[1,2,3]}','untouched');`);
    const snapshot = async () =>
      JSON.stringify(
        (
          await db.query(`SELECT 'progress' AS kind,jsonb_agg(to_jsonb(t)) AS rows FROM public.v3_progress t
UNION ALL SELECT 'wallet',jsonb_agg(to_jsonb(t)) FROM public.v3_wallet t
UNION ALL SELECT 'auth',jsonb_agg(to_jsonb(t)) FROM auth.users t
UNION ALL SELECT 'identities',jsonb_agg(to_jsonb(t)) FROM auth.identities t
UNION ALL SELECT 'receipts',jsonb_agg(to_jsonb(t)) FROM public.v3_game_requests t
UNION ALL SELECT 'private',jsonb_agg(to_jsonb(t)) FROM v52_staging_private.fixture_unknown t`)
        ).rows,
      );
    const original = await snapshot();
    await check(
      "read-only precheck accepts reviewed source and returns only aggregate flags",
      async () => {
        const results = await db.exec(p.precheckSql);
        const result = results
          .flatMap((x) => x.rows || [])
          .find(
            (x) => x.main_preservation_precheck,
          )?.main_preservation_precheck;
        assert.deepEqual(result, {
          projectRef: "sfogrvedypgtxfvecmbx",
          sourceContractsMatch: true,
          tableAndColumnGrantsDenied: true,
          activityMatchesReviewedCheckpoint: true,
          historyAbsent: true,
        });
        assert.equal(await snapshot(), original);
        await reject(
          p.precheckSql.replace(
            "DO $target$",
            "UPDATE public.v3_wallet SET coins=coins+1;DO $target$",
          ),
          /read-only transaction/,
        );
      },
    );
    await check(
      "missing approval and wrong project stop before any installation",
      async () => {
        await reject(p.sql, /Specific Main/);
        await absent();
        await exec(
          "UPDATE public.v3_environment SET project_ref='abcdefghijklmnopqrst'",
        );
        await reject(approval + p.sql, /Exact Main/);
        await absent();
        await exec(
          "UPDATE public.v3_environment SET project_ref='sfogrvedypgtxfvecmbx'",
        );
      },
    );
    await check(
      "column-only and inherited grant leaks are refused",
      async () => {
        await exec("GRANT SELECT(hash) ON public.v3_pins TO authenticated");
        await reject(approval + p.sql, /column grant/);
        await absent();
        await exec(
          "REVOKE SELECT(hash) ON public.v3_pins FROM authenticated;CREATE ROLE fictional_leak;GRANT SELECT(hash) ON public.v3_pins TO fictional_leak;GRANT fictional_leak TO authenticated",
        );
        await reject(p.precheckSql, /column grant/);
        await exec(
          "REVOKE fictional_leak FROM authenticated;REVOKE SELECT(hash) ON public.v3_pins FROM fictional_leak;DROP ROLE fictional_leak",
        );
      },
    );
    await check(
      "changed routine body, security metadata and exposed delegate are refused",
      async () => {
        const saved = (
          await one(
            "SELECT pg_get_functiondef('public.v3_set_pin(text)'::regprocedure) AS definition",
          )
        ).definition;
        await exec(
          "CREATE OR REPLACE FUNCTION public.v3_set_pin(p_pin text) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$BEGIN RETURN '{}'::jsonb;END$$",
        );
        await reject(approval + p.sql, /routine contract mismatch/);
        await absent();
        await exec(saved);
        await exec("ALTER FUNCTION public.v3_role() SET search_path TO public");
        await reject(p.precheckSql, /routine contract mismatch/);
        await exec(
          "ALTER FUNCTION public.v3_role() SET search_path TO '';GRANT EXECUTE ON FUNCTION public.v3_request_before_game_reset(text,text,jsonb) TO anon",
        );
        await reject(p.precheckSql, /routine contract mismatch/);
        await exec(
          "REVOKE EXECUTE ON FUNCTION public.v3_request_before_game_reset(text,text,jsonb) FROM anon",
        );
      },
    );
    await check(
      "later gameplay invalidates the reviewed activity checkpoint",
      async () => {
        await exec(
          "UPDATE public.v3_progress SET updated_at='2026-11-20T00:00:00Z'",
        );
        await reject(approval + p.sql, /activity differs/);
        await absent();
        await exec(
          "UPDATE public.v3_progress SET updated_at='2026-11-15T20:24:51.624774Z'",
        );
      },
    );
    await check(
      "row corruption and a late permission leak roll back all DDL",
      async () => {
        for (const mutation of [
          "UPDATE public.v3_wallet SET coins=coins+1;",
          "DELETE FROM auth.identities;",
          "UPDATE v52_staging_private.fixture_unknown SET payload='{}';",
          "UPDATE public.fixture_unknown_columns SET original='changed';",
        ]) {
          await reject(
            approval +
              p.sql.replace("DO $preserve$", mutation + "DO $preserve$"),
            /Original rows changed/,
          );
          await absent();
          assert.equal(await snapshot(), original);
        }
        await reject(
          approval +
            p.sql.replace(
              "DO $preserve$",
              "GRANT SELECT(coins) ON public.v3_wallet TO anon;DO $preserve$",
            ),
          /must remain private/,
        );
        await absent();
        await exec(p.precheckSql);
      },
    );
    await check(
      "late errors roll back wrappers, schema and all original rows",
      async () => {
        await reject(
          approval +
            p.sql.replace(
              /^COMMIT;$/m,
              () =>
                "DO $$BEGIN RAISE EXCEPTION 'fictional late error';END$$;COMMIT;",
            ),
          /fictional late error/,
        );
        await absent();
        assert.equal(await snapshot(), original);
        assert.equal(
          (
            await one(
              "SELECT to_regprocedure('public.v3_request_before_history(text,text,jsonb)') IS NULL AS absent",
            )
          ).absent,
          true,
        );
      },
    );
    await check(
      "CRLF routine bodies from the same reviewed source are accepted",
      async () => {
        const d = (
          await one(
            "SELECT pg_get_functiondef('public.v3_set_pin(text)'::regprocedure) AS definition",
          )
        ).definition;
        const match = d.match(/AS (\$[^$]*\$)([\s\S]*)\1/);
        assert(match);
        await exec(
          d.replace(match[2], () =>
            match[2].replace(/\r\n/g, "\n").replace(/\n/g, "\r\n"),
          ),
        );
        await exec(p.precheckSql);
      },
    );
    await check(
      "approved installation is atomic, disabled, private and preserves all original rows",
      async () => {
        await exec(approval + p.sql);
        assert.equal(await snapshot(), original);
        assert.deepEqual(
          (
            await one(
              "SELECT to_jsonb(s) AS value FROM public.v3_history_settings s",
            )
          ).value,
          {
            singleton: true,
            enabled: false,
            write_enabled: false,
            client_release: null,
          },
        );
        assert.deepEqual(await req("learner", "save", old), oldResult);
        await assert.rejects(req("learner", "read_v2"), /not enabled/);
        for (const role of ["anon", "authenticated", "service_role"]) {
          await reject(
            `SET ROLE ${role};SELECT * FROM public.v3_history_nodes`,
            /permission denied/,
          );
        }
        await reject(approval + p.sql, /Fresh absent-history/);
        assert.equal(await snapshot(), original);
      },
    );
    await check(
      "separate fictional activation keeps old retries, >2MB V2 history and sibling isolation",
      async () => {
        await exec(
          "SET app.history_cutover_reviewed='yes';SET app.history_expected_project_ref='sfogrvedypgtxfvecmbx';SET app.history_client_release='cccccccccccccccccccccccccccccccccccccccc';" +
            read("supabase/history/002_enable_retained_history.sql"),
        );
        const state = {
          skills: {
            place: {
              independentEvidence: Array.from({ length: 128 }, (_, i) => ({
                at: i,
                questionKey: "fixture/" + i,
                original: "x".repeat(17000),
              })),
            },
          },
          unknown: { preserved: true },
          paused: { original: true },
        };
        assert(Buffer.byteLength(JSON.stringify(state)) > 2000000);
        const transport = H.transport((op, args) => req("learner", op, args), {
          epoch: () => 0,
        });
        const pending = {
          storageVersion: 2,
          requestId: crypto.randomUUID(),
          revision: 1,
          gameEpoch: 0,
          progress: state,
        };
        const saved = await transport("save", pending);
        assert.equal(saved.revision, 2);
        assert.deepEqual(await transport("save", pending), saved);
        assert.deepEqual((await transport("read")).progress, state);
        assert.deepEqual(await req("learner", "save", old), oldResult);
        await assert.rejects(
          req("learner", "save", {
            ...old,
            requestId: crypto.randomUUID(),
            revision: 2,
          }),
          /UPDATE_REQUIRED/,
        );
        const packed = await H.pack(state);
        assert.deepEqual(
          (
            await req("other", "history_get", {
              ids: [packed.nodes[0].id],
              gameEpoch: 0,
            })
          ).nodes,
          [],
        );
        await exec("UPDATE public.v3_history_settings SET write_enabled=false");
        assert.deepEqual((await transport("read")).progress, state);
        await assert.rejects(
          transport("save", {
            ...pending,
            revision: 2,
            requestId: crypto.randomUUID(),
          }),
          /writes are paused/,
        );
        assert.deepEqual(await transport("save", pending), saved);
      },
    );
  } finally {
    await db.close();
  }
  fs.writeFileSync(
    path.join(
      root,
      "tests/artifacts/main-history-preservation-verification.json",
    ),
    JSON.stringify(
      {
        runtime:
          "PGlite 0.4.6 / PostgreSQL 17.5, in-memory, no network listener",
        groupsPassed: passed,
        package: p.manifest,
        scope:
          "Fictional SQL rehearsals only, not native multi-session locking, live deployment or managed-service recovery certification",
        hostedSqlExecuted: false,
      },
      null,
      2,
    ) + "\n",
  );
  console.log(
    `${passed} Main preservation groups passed; no hosted service or real records used.`,
  );
}
run().catch((e) => {
  console.error(e.stack || e.message);
  process.exitCode = 1;
});
