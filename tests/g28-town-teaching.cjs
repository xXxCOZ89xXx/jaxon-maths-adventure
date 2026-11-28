"use strict";
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const E = require("../v3/engine").V3Engine;
const L = require("../v3/town-life").V52TownLife;
const Q = require("../v3/town-content").V53TownContent;
const fixture = require("./fixtures/g28-town-contracts.json");
const clone = (x) => JSON.parse(JSON.stringify(x));
function contract(v) {
  if (Array.isArray(v)) return v.map(contract);
  if (v && typeof v === "object")
    return Object.fromEntries(
      Object.entries(v)
        .filter(
          ([k]) =>
            !fixture.excludedFields.includes(k) && k !== "employmentInduction",
        )
        .map(([k, x]) => [k, contract(x)]),
    );
  return v;
}
const expected = {
  "Choose your work shift": ["unpaid break", "12:30"],
  "Calculate gross wages": ["paid hours", "£24"],
  "Read your fictional payslip": ["supplied deduction", "£21"],
  "Prepare a customer order": ["millilitres", "200 ml"],
  "Sell return tickets": ["return ticket", "£6"],
  "Measure a repair piece": ["centimetre", "40 cm"],
  "Post a customer deposit": ["balance", "£15"],
};
let reviewed = 0;
function check(tasks) {
  for (const t of tasks) {
    if (expected[t.title]) {
      assert.equal(t.contentVersion, 4);
      assert(t.teach.includes(expected[t.title][0]), t.title);
      assert(t.example.includes(expected[t.title][1]), t.title);
      reviewed++;
    }
    if (t.branches) Object.values(t.branches).forEach(check);
  }
}
for (const row of fixture.rows) {
  const meta = L.catalog.find((x) => x.id === row.scenario);
  const run = Q.make(meta, row.tier, row.seed, { jobs: L.jobs });
  assert.equal(
    crypto
      .createHash("sha256")
      .update(JSON.stringify(contract(run)))
      .digest("hex"),
    row.sha256,
    `${row.scenario} tier ${row.tier} seed ${row.seed}`,
  );
  check(run.steps);
  const s = E.fresh();
  assert(L.start(s, row.scenario, row.tier));
  const old = L.state(s);
  assert.equal(old.employmentInduction.version, 2);
  delete old.employmentInduction;
  old.steps[0].teach = "Historical saved teaching";
  old.steps[0].example = "Saved example";
  old.steps[0].contentVersion = 1;
  old.steps[0].questionId = "saved:old:shift:0042";
  old.values = { choice: 1, unknownDraft: "keep me" };
  old.futureField = { exact: ["unknown", 42] };
  const snapshot = clone(old),
    coins = clone(s.coins),
    checks = clone(s.checks);
  const restored = E.migrate(clone(s));
  assert(L.start(restored, row.scenario, 3));
  assert.deepEqual(L.state(restored), snapshot);
  assert.deepEqual(restored.coins, coins);
  assert.deepEqual(restored.checks, checks);
  const generated = L.make(row.scenario, row.tier, row.seed);
  assert(generated.steps[0].questionKey.includes("/v4/"));
}
console.log(
  `PASS G28 Town teaching: ${fixture.rows.length} baseline contracts, ${reviewed} branch/task lessons; saved IDs, drafts, unknown fields, coins and checks preserved.`,
);
