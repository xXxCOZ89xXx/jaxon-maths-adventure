// Fixed synthetic history only. No file inputs, remote endpoints or production exports.
const assert = require("node:assert/strict"),
  crypto = require("node:crypto");
const E = require("../v3/engine").V3Engine;
const historical = {
  version: 2,
  coins: 713.1545871666667,
  earned: 820,
  minutes: 82,
  skills: {
    place: { state: "mastered", reviewStage: 2, firstTry: 3 },
    negative: { state: "learning", reviewStage: 0 },
  },
  weekly: { "2026-10-19": 18 },
  bought: ["cap", "fox", "jacket"],
  equipped: ["cap", "jacket", "fox"],
  parentSettings: { weeklyGoal: 60, conversion: 1, quiet: true },
  rewardLedger: { bonus: 12, redeemed: 7, active_seconds: 4920 },
  family: { child: "fictional-child", parent: "fictional-parent" },
  quest: {
    world: "number",
    i: 1,
    value: 2,
    selected: [1],
    intro: false,
    assisted: true,
    solved: false,
  },
  futureField: { preserve: ["unknown", "history"] },
};
const backup = JSON.stringify(historical),
  sha = (s) => crypto.createHash("sha256").update(s).digest("hex");
const manifest = {
  kind: "SYNTHETIC_REHEARSAL_ONLY",
  version: 2,
  checksum: sha(backup),
};
const source = JSON.parse(backup),
  v3 = E.migrate(source);
assert.equal(
  sha(JSON.stringify(source)),
  manifest.checksum,
  "Migration mutated source",
);
for (const key of Object.keys(historical).filter((k) => k !== "version"))
  assert.deepEqual(v3[key], historical[key], "Lost historical field " + key);
assert.equal(v3.version, 3);
assert.deepEqual(E.migrate(v3), v3, "Retry migration changed history");
assert.equal(v3.coins, historical.coins);
assert.equal(v3.rewardLedger.redeemed, 7);
assert.equal(v3.skills.negative.state, "learning");
assert.deepEqual(
  v3.checks,
  {},
  "Legacy mastery was fabricated as fresh V3 checks",
);
const rollback = JSON.parse(backup);
assert.equal(sha(JSON.stringify(rollback)), manifest.checksum);
assert.deepEqual(rollback, historical);
assert.notEqual(
  sha(backup + "x"),
  manifest.checksum,
  "Corrupt backup must not verify",
);
console.log(
  "PASS synthetic migration rehearsal: verified immutable backup; all skills/evidence, exact balances, time, items, parent/family and unknown fields retained; idempotent migration and byte-equivalent rollback",
);
