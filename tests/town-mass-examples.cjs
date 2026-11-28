"use strict";
const assert = require("node:assert/strict"),
  crypto = require("node:crypto"),
  { E, L, fixture } = require("./helpers/town-mass-example.cjs"),
  baseline = require("./fixtures/town-mass-examples-baseline-20261128.json");
const clone = (x) => JSON.parse(JSON.stringify(x));
function stable(x) {
  if (Array.isArray(x)) return x.map(stable);
  if (x && typeof x === "object") {
    const mass = x.kind === "measure" && x.unit === "g";
    return Object.fromEntries(
      Object.entries(x)
        .filter(
          ([k]) =>
            !mass || !baseline.excludedForGramMeasureTasksOnly.includes(k),
        )
        .map(([k, v]) => [k, stable(v)]),
    );
  }
  return x;
}
let changed = 0;
for (const row of baseline.rows) {
  const run = L.make(row.scenario, row.tier, row.seed);
  assert.equal(
    crypto
      .createHash("sha256")
      .update(JSON.stringify(stable(run)))
      .digest("hex"),
    row.sha256,
    row.scenario,
  );
  function walk(tasks) {
    for (const t of tasks) {
      if (t.kind === "measure" && t.unit === "g") {
        changed++;
        assert.equal(t.contentVersion, 2);
        assert(t.questionKey.includes("/v2/"));
        assert.match(t.teach, /grams \(g\)/);
        assert.match(t.example, /6 × 25 g = 150 g/);
        assert.equal(6 * 25, 150);
        assert(!/litre|\bml\b/.test(t.teach + " " + t.example));
        assert.notEqual(t.answer, 150);
      }
      if (t.branches) Object.values(t.branches).forEach(walk);
    }
  }
  walk(run.steps);
}
assert.equal(changed, 18);
for (const snapshot of baseline.snapshots) {
  const s = E.fresh(),
    old = clone(snapshot);
  old.futureField = { keep: ["old", 42] };
  old.values = { draft: "saved exactly" };
  s.adventure = {
    townLifeV2: {
      version: 2,
      runs: { [old.id]: old },
      counts: { [old.scenario]: old.seed },
      active: old.id,
    },
  };
  const before = clone(old),
    restored = E.migrate(clone(s));
  assert(L.start(restored, old.scenario, 3));
  assert.deepEqual(L.state(restored), before);
  const t = before.steps.find((t) => t.kind === "measure" && t.unit === "g");
  assert(t.questionKey.includes("/v1/"));
  assert.equal(t.example, "0.1 litre equals 100 ml.");
}
for (const id of ["cook-pizza", "cook-soup"])
  for (const tier of [1, 2, 3])
    for (const seed of [1, 2, 7]) {
      const s = fixture(id, tier, seed),
        j = L.state(s),
        t = L.task(s),
        stage = j.stage,
        cash = j.cash,
        coins = s.coins,
        receipts = clone(j.receipts);
      assert(L.action(s, "j-value", String(t.answer + 25)));
      assert.equal(L.action(s, "j-submit"), false);
      assert.equal(j.stage, stage);
      assert.equal(j.solved, false);
      assert(L.action(s, "j-value", String(t.answer)));
      assert(L.action(s, "j-submit"));
      assert.equal(j.stage, stage);
      assert(j.solved);
      assert.equal(j.cash, cash);
      assert.equal(s.coins, coins);
      assert.deepEqual(j.receipts, receipts);
      assert.deepEqual(L.state(E.migrate(clone(s))), j);
    }
console.log(
  "PASS gram teaching: 243 complete run contracts including all unchanged task IDs; 18 corrected new task identities; 18 wrong/correct/resume cases; two original full saved snapshots retained exactly.",
);
