"use strict";
const assert = require("node:assert/strict"),
  fs = require("node:fs"),
  vm = require("node:vm");
const E = require("../v3/engine").V3Engine,
  M = require("../v3/adventure").V3Adventure,
  T = require("../v3/town").V3Town,
  C = require("../v3/curriculum").V3Curriculum;
const sandbox = { window: {} };
vm.runInNewContext(fs.readFileSync("v2-review-bank.js", "utf8"), sandbox);
T.install(C, sandbox.window.JaxonFreshReview);
let suites = 0,
  tasks = 0;
const test = (name, fn) => {
  fn();
  suites++;
  console.log("PASS: " + name);
};
function choose(s) {
  const q = M.current(s),
    t = q.tasks[q.i];
  M.begin(s);
  if (["basket", "offers", "budget", "blocks"].includes(t.kind))
    M.edit(s, "parts", t.answer);
  else if (["fraction", "chance"].includes(t.kind))
    M.edit(
      s,
      "selected",
      Array.from({ length: t.answer }, (_, i) => i),
    );
  else if (t.kind === "grid") M.edit(s, "selected", t.answer);
  else if (t.kind === "coordinate") M.edit(s, "point", t.answer);
  else if (t.kind === "journey") M.edit(s, "choice", t.answer);
  else if (t.kind === "coins") {
    let left = t.answer;
    const coins = [];
    for (const p of [5000, 2000, 1000, 500, 200, 100, 50, 20, 10, 5, 2, 1])
      while (left >= p) {
        coins.push(p);
        left -= p;
      }
    assert.ok(M.edit(s, "coins", coins));
  } else {
    assert.ok(M.edit(s, "amount", t.answer), t.kind + " " + t.answer);
    if (t.kind === "bank")
      for (let i = 0; i < t.transactions.length; i++)
        M.edit(s, "posted", i + 1);
  }
  assert.equal(M.submit(s), true, t.kind + " " + t.prompt);
  assert.equal(M.submit(s), false, "Repeated submission must not count");
  tasks++;
}
function finish(s) {
  for (let i = 0; i < 3; i++) {
    choose(s);
    M.next(s, Date.UTC(2026, 9, 20));
  }
}
test("Nine worlds, eight town venues, sixteen new skills, unchanged forty shop IDs", () => {
  assert.equal(E.worlds.length, 9);
  assert.equal(T.venues.length, 8);
  assert.equal(C.skills.length, 55);
  assert.equal(C.catalog.length, 40);
  assert.equal(
    Object.values(C.discovery).reduce(
      (n, b) => n + Object.values(b).reduce((m, qs) => m + qs.length, 0),
      0,
    ),
    1100,
  );
});
test("123 mission/difficulty combinations across twelve repeat seeds are solvable and teach every task first", () => {
  let missions = 0;
  for (const w of E.worlds)
    for (const route of [...M.routes(w.id).map((r) => r.id), "gateway"])
      for (let tier = 1; tier <= 3; tier++) {
        const s = E.fresh();
        for (let round = 0; round < 12; round++) {
          assert.equal(M.start(s, w.id, route, tier), true);
          const q = M.current(s);
          assert.equal(q.phase, "lesson");
          assert.equal(
            new Set(
              q.tasks.map((t) =>
                JSON.stringify([t.kind, t.prompt, t.values, t.answer]),
              ),
            ).size,
            3,
            `Tasks within ${w.id}/${route}/${tier}/${round} must vary`,
          );
          assert.equal(M.submit(s), false);
          for (const t of q.tasks) {
            assert.ok(t.teach && t.example && t.worked);
            assert.ok(
              C.skills.some((k) => k.id === t.skill),
              "Unknown skill " + t.skill,
            );
          }
          finish(s);
          assert.equal(s.milestones.length, 1);
          assert.equal(E.xp(s), 100);
          assert.equal(s.coins, 0);
          assert.deepEqual(s.skills, {});
          assert.equal(M.collections(s).length, 1);
        }
        missions++;
      }
  assert.equal(missions, 123);
});
test("Fresh task values vary on replay, resume preserves exact state and switching worlds keeps unfinished visits", () => {
  let s = E.fresh();
  M.start(s, "town", "market", 2);
  const first = JSON.stringify(M.current(s).tasks);
  M.begin(s);
  M.edit(s, "parts", [1, 0, 1]);
  M.help(s, true);
  const saved = JSON.stringify(M.current(s));
  M.start(s, "number", "1", 1);
  s = E.migrate(JSON.parse(JSON.stringify(s)));
  M.start(s, "town", "market", 2);
  assert.equal(JSON.stringify(M.current(s)), saved);
  finish(s);
  M.start(s, "town", "market", 2);
  assert.notEqual(JSON.stringify(M.current(s).tasks), first);
  assert.equal(M.current(s).seed, 2);
});
test("Supported missions do not grant mastery; recommendation follows recent support without taking away earned rewards", () => {
  const s = E.fresh();
  M.start(s, "number", "0", 2);
  finish(s);
  assert.equal(M.recommendation(s, "number"), 3);
  M.start(s, "number", "0", 2);
  for (let i = 0; i < 3; i++) {
    M.help(s, true);
    choose(s);
    M.next(s);
  }
  assert.equal(M.recommendation(s, "number"), 1);
  assert.equal(s.milestones.length, 1);
  assert.deepEqual(s.skills, {});
  assert.equal(s.coins, 0);
});
test("Town restoration requires distinct completed venues, collections are per route, and camp decoration cannot farm rewards", () => {
  const s = E.fresh();
  assert.equal(M.campPlace(s, "gate", "town|market"), false);
  for (const v of T.venues) {
    M.start(s, "town", v.id, 1);
    finish(s);
  }
  assert.equal(M.visualLevel(s, "town"), 3);
  assert.equal(M.collections(s).length, 8);
  assert.ok(M.campPlace(s, "shelf", "town|market"));
  assert.equal(M.campPlace(s, "unknown", "town|market"), false);
  const xp = E.xp(s);
  for (let i = 0; i < 30; i++) M.campPlace(s, "garden", "town|cafe");
  assert.equal(E.xp(s), xp);
  M.start(s, "town", "market", 3);
  finish(s);
  assert.equal(M.collections(s).length, 8);
  assert.equal(s.milestones.length, 9);
});
test("Invalid moves, counterfeit denominations and out-of-sequence ledger posting are rejected", () => {
  const s = E.fresh();
  M.start(s, "town", "bank", 1);
  M.begin(s);
  assert.equal(M.edit(s, "posted", 2), false);
  assert.equal(M.edit(s, "amount", -1), false);
  assert.equal(M.edit(s, "amount", NaN), false);
  assert.equal(M.edit(s, "amount", 0.5), false);
  M.start(s, "town", "market", 1);
  choose(s);
  M.next(s);
  choose(s);
  M.next(s);
  M.begin(s);
  assert.equal(M.edit(s, "coins", [175]), false);
  assert.equal(M.edit(s, "coins", Array(101).fill(1)), false);
  assert.equal(M.submit(s), false);
});

test("Camp projects require durable milestones and malformed new state does not break V2 migration", () => {
  const s = E.fresh();
  assert.equal(M.build(s, "greenhouse"), false);
  s.milestones = Array.from({ length: 12 }, (_, i) => "fixture:" + i);
  assert.ok(M.build(s, "greenhouse"));
  const before = E.xp(s);
  assert.ok(M.build(s, "greenhouse"));
  assert.equal(E.xp(s), before);
  assert.equal(M.build(s, "lookout"), false);
  const migrated = E.migrate({
    coins: 42,
    bought: ["cap"],
    adventure: {
      active: { world: "town" },
      suspended: { broken: { i: -1 } },
      records: { bad: null },
    },
  });
  assert.equal(migrated.coins, 42);
  assert.deepEqual(migrated.bought, ["cap"]);
  assert.equal(migrated.adventure.active, null);
  assert.deepEqual(migrated.adventure.records, {});
  const invalid = E.fresh();
  M.start(invalid, "town", "market", 1);
  invalid.adventure.active.route = "unknown-place";
  assert.equal(E.migrate(invalid).adventure.active, null);
});

test("Academic celebration badges survive later struggle without falsely preserving current mastery", () => {
  let s = E.migrate({
    checks: { place: { stage: 2 } },
    skills: { place: { state: "mastered" } },
  });
  assert.ok(s.achievements.includes("memory"));
  s.checks.place.stage = 0;
  s.skills.place.state = "learning";
  s = E.migrate(s);
  assert.ok(s.achievements.includes("memory"));
  assert.equal(s.skills.place.state, "learning");
});

test("Higher-level coordinates and turn composition match worked mathematical examples", () => {
  assert.deepEqual(
    [0, 1, 2].map((i) => M.task("geometry", "0", 3, 1, i).answer),
    [270, 0, 180],
  );
  assert.deepEqual(
    [0, 1, 2].map((i) => M.task("geometry", "0", 2, 1, i).answer),
    [180, 270, 90],
  );
  assert.deepEqual(
    [0, 1, 2].map((i) => M.task("algebra", "2", 3, 1, i).answer),
    [
      [-2, -1],
      [-1, 2],
      [0, 0],
    ],
  );
});
test("Fresh practical checks vary answer-producing quantities across rounds", () => {
  for (const lesson of T.lessons)
    for (let band = 5; band <= 9; band++)
      for (let round = 1; round <= 12; round++) {
        const qs = [0, 1, 2].map((i) => T.question(lesson[0], band, round, i));
        assert.ok(
          new Set(qs.map((q) => q[1])).size > 1,
          lesson[0] + " must require varied calculations",
        );
      }
});
test("Best-value shopping varies the cheaper pack and cinema offers cover the requested group", () => {
  assert.deepEqual(M.task("town", "market", 1, 1, 1).answer, [0, 1]);
  assert.deepEqual(M.task("town", "market", 1, 2, 1).answer, [2, 0]);
  const t = M.task("town", "leisure", 2, 1, 0);
  assert.deepEqual(t.answer, [0, 2]);
  assert.equal(t.budget, undefined);
  assert.equal(t.items[1].quantity * 2, t.need);
  assert.equal(t.items[1].price * 2, 1600);
  assert.ok(t.items[1].price * 2 < t.items[0].price * t.need);
});
console.log(
  `PASS: ${suites} expedition suites; ${tasks} generated tasks solved using fictional data.`,
);
