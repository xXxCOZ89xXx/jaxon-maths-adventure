// Fictional PostgreSQL only. No hosted endpoints, credentials or real rows.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { fixture } = require("./helpers/main-history-fixture.cjs");
const installer = require("../scripts/prepare-main-history-preservation.cjs");
const activation = require("../scripts/prepare-main-history-activation.cjs");
const root = path.resolve(__dirname, "..");
const read = (f) => fs.readFileSync(path.join(root, f), "utf8");
const approval = "SET app.main_history_activation_approved='yes';";
const p = activation.prepare();
let groupsPassed = 0;
async function check(name, fn) {
  await fn();
  groupsPassed++;
  console.log("PASS " + name);
}
async function run() {
  await check(
    "wrong client and changed source or install envelope refused",
    async () => {
      assert.throws(
        () => activation.prepare("a".repeat(40)),
        /deployed Main client/,
      );
      for (const target of [activation.sourceFile, installer.sourceFile])
        assert.throws(
          () =>
            activation.prepare(
              activation.deployedClient,
              (f) => read(f) + (f === target ? "\n" : ""),
            ),
          /source changed/,
        );
    },
  );
  const db = await fixture();
  const exec = (s) => db.exec(s);
  const one = async (s) => (await db.query(s)).rows[0];
  const reject = async (s, re) => {
    await assert.rejects(exec(s), re);
    await exec("ROLLBACK;RESET ROLE;");
  };
  const disabled = async () =>
    assert.deepEqual(
      (
        await one(
          "SELECT enabled,write_enabled,client_release FROM public.v3_history_settings",
        )
      ).enabled,
      false,
    );
  try {
    await exec(
      `INSERT INTO auth.users VALUES('11111111-1111-4111-8111-111111111111');INSERT INTO public.v3_progress(child_user_id,progress,revision,updated_at) VALUES('11111111-1111-4111-8111-111111111111','{"unknown":{"bytes":[1,null,"2/3"]}}',1,'2026-11-15T20:24:51.624774Z');`,
    );
  } catch (e) {
    await db.close();
    throw e;
  }
  try {
    // Use the actual schema constraints and establish the reviewed activity without importing records.
    await exec(
      "INSERT INTO public.v3_wallet(child_user_id,coins,last_active) VALUES('11111111-1111-4111-8111-111111111111',10,'2026-10-28T11:39:25.933273Z');",
    );
    await exec(
      "INSERT INTO public.v3_transactions(child_user_id,request_id,operation,payload,result,created_at) VALUES('11111111-1111-4111-8111-111111111111','22222222-2222-4222-8222-222222222222','fixture','{}','{}','2026-11-15T20:24:51.624774Z');",
    );
    await exec(
      "SET app.main_history_install_approved='yes';" + installer.prepare().sql,
    );
    await exec(
      "ALTER TABLE public.v3_history_settings ADD COLUMN future_field jsonb DEFAULT '{\"preserve\":[1,null]}'::jsonb;",
    );
    await check(
      "read-only activation precheck returns aggregate flags and refuses writes",
      async () => {
        const result = (await db.exec(p.precheckSql))
          .flatMap((x) => x.rows || [])
          .find((x) => x.main_activation_precheck).main_activation_precheck;
        assert.equal(result.freshDisabledHistory, true);
        await reject(
          p.precheckSql.replace(
            "COMMIT;",
            "UPDATE public.v3_history_settings SET enabled=true;COMMIT;",
          ),
          /read-only transaction/,
        );
        await disabled();
      },
    );
    await check(
      "separate approval and exact Main target required",
      async () => {
        await reject(p.sql, /Specific Main activation/);
        await reject(
          approval +
            p.sql.replaceAll("'sfogrvedypgtxfvecmbx'", "'wrong-project'"),
          /Exact Main/,
        );
        await disabled();
      },
    );
    await check(
      "installed function drift and browser column grants stop activation",
      async () => {
        await exec(
          "GRANT SELECT(progress) ON public.v3_progress TO authenticated;",
        );
        await reject(approval + p.sql, /column grant/);
        await exec(
          "REVOKE SELECT(progress) ON public.v3_progress FROM authenticated;",
        );
        await reject(
          approval +
            p.sql.replace(
              "DO $contracts$",
              "ALTER FUNCTION public.v3_identity() SET search_path='public';DO $contracts$",
            ),
          /contract mismatch/,
        );
        await disabled();
      },
    );
    await check("changed activity refuses activation", async () => {
      await reject(
        approval +
          p.sql.replace(
            "DO $activity$",
            "UPDATE public.v3_progress SET updated_at=now();DO $activity$",
          ),
        /activity differs/,
      );
      await disabled();
    });
    await check(
      "data corruption, settings unknown fields and ACL changes roll back activation",
      async () => {
        for (const mutation of [
          "UPDATE public.v3_wallet SET coins=coins+1;",
          "UPDATE public.v3_history_settings SET future_field='{}';",
          "GRANT SELECT ON public.v3_history_settings TO authenticated;",
        ]) {
          await reject(
            approval +
              p.sql.replace("DO $preserve$", mutation + "DO $preserve$"),
            /Original rows changed|Original table permissions changed/,
          );
          await disabled();
        }
      },
    );
    await check(
      "late failure restores disabled settings and original data",
      async () => {
        await reject(
          approval +
            p.sql.replace(
              "-- Accept only if",
              () =>
                "DO $$ BEGIN RAISE EXCEPTION 'fixture late failure'; END $$;\n-- Accept only if",
            ),
          /fixture late failure/,
        );
        await disabled();
      },
    );
    await check(
      "activation changes only approved settings, preserves unknown fields and refuses reruns",
      async () => {
        const before = await one(
          "SELECT to_jsonb(p) AS row FROM public.v3_progress p",
        );
        await exec(approval + p.sql);
        assert.equal(
          (
            await one(
              "SELECT public.v3_identity()->>'progressStorageVersion' AS version",
            )
          ).version,
          "2",
        );
        assert.deepEqual(
          await one("SELECT to_jsonb(p) AS row FROM public.v3_progress p"),
          before,
        );
        assert.deepEqual(
          (await one("SELECT future_field FROM public.v3_history_settings"))
            .future_field,
          { preserve: [1, null] },
        );
        const settings = await one(
          "SELECT enabled,write_enabled,client_release FROM public.v3_history_settings",
        );
        assert.deepEqual(settings, {
          enabled: true,
          write_enabled: true,
          client_release: activation.deployedClient,
        });
        await reject(approval + p.sql, /Fresh disabled empty history/);
      },
    );
  } finally {
    await db.close();
  }
  fs.writeFileSync(
    path.join(
      root,
      "tests/artifacts/main-history-activation-verification.json",
    ),
    JSON.stringify(
      {
        groupsPassed,
        package: p.manifest,
        scope: "Fictional in-memory PostgreSQL; hosted activation not executed",
      },
      null,
      2,
    ) + "\n",
  );
  console.log(groupsPassed + " Main activation groups passed");
}
run().catch((e) => {
  console.error(e.stack || e.message);
  process.exitCode = 1;
});
