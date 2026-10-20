const assert = require("node:assert/strict"),
  fs = require("fs"),
  vm = require("vm");
const E = require("../v3/engine").V3Engine,
  M = require("../v3/adventure").V3Adventure,
  H = require("../v3/hands-on").V5HandsOn,
  AD = require("../v3/adaptive").V5Adaptive,
  J = require("../v3/journey").V5Journey,
  C = require("../v3/curriculum").V3Curriculum,
  T = require("../v3/town").V3Town;
T.install(C, { supportedSkills: [], create: () => [] });
let suites = 0,
  steps = 0;
function test(name, f) {
  f();
  suites++;
  console.log("PASS V5: " + name);
}
function answer(s, t) {
  if (["order", "match"].includes(t.kind)) M.edit(s, "order", t.answer);
  else if (
    [
      "basket",
      "offers",
      "budget",
      "blocks",
      "array",
      "chart",
      "volume",
    ].includes(t.kind)
  )
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
    let n = t.answer;
    const arr = [];
    for (const p of [5000, 2000, 1000, 500, 200, 100, 50, 20, 10, 5, 2, 1])
      while (n >= p) {
        arr.push(p);
        n -= p;
      }
    M.edit(s, "coins", arr);
  } else {
    M.edit(s, "amount", t.answer);
    if (t.kind === "bank")
      for (let i = 0; i < t.transactions.length; i++)
        M.edit(s, "posted", i + 1);
  }
}
test("Every generated mechanic validates wrong/correct attempts, hints, exact save/resume and three tiers without mastery", () => {
  for (const w of E.worlds)
    for (const r of [...M.routes(w.id).map((x) => x.id), "gateway"])
      for (const d of [1, 2, 3])
        for (const seed of [1, 2, 3]) {
          let s = E.fresh();
          M.state(s).attempts[M.id(w.id, r, d)] = seed - 1;
          M.start(s, w.id, r, d);
          for (let i = 0; i < 3; i++) {
            M.begin(s);
            const q = M.current(s),
              t = q.tasks[q.i];
            if (t.answer === 0) {
              if (t.kind === "coins") M.edit(s, "coins", [1]);
              else if (t.kind === "journey") M.edit(s, "choice", 1);
              else M.edit(s, "amount", 1);
            }
            assert.equal(M.submit(s), false, t.kind);
            M.help(s);
            assert.ok(q.assisted);
            answer(s, t);
            const snapshot = JSON.stringify(q);
            s = E.migrate(JSON.parse(JSON.stringify(s)));
            assert.equal(JSON.stringify(M.current(s)), snapshot);
            assert.ok(M.submit(s), t.kind);
            assert.equal(M.submit(s), false);
            M.next(s);
            steps++;
          }
          assert.equal(s.milestones.length, 1);
          assert.deepEqual(s.checks, {});
          assert.equal(s.coins, 0);
        }
});
test("Coverage has at least three actual model types per world and exceeds 70 percent; 55 skills remain accessible", () => {
  assert.equal(C.skills.length, 55);
  let total = 0,
    count = 0;
  for (const w of E.worlds) {
    const types = new Set();
    let all = 0,
      interactive = 0;
    for (const r of [...M.routes(w.id).map((x) => x.id), "gateway"])
      for (const d of [1, 2, 3])
        for (const i of [0, 1, 2]) {
          const t = M.task(w.id, r, d, 1, i),
            m = H.mechanic(t, w.id, r);
          all++;
          if (H.isHandsOn(t, w.id, r)) {
            interactive++;
            types.add(m);
          }
        }
    assert.ok(types.size >= 3, w.id);
    assert.ok(interactive / all >= 0.7, w.id);
    total += all;
    count += interactive;
  }
  assert.ok(count / total >= 0.7);
});
test("Cartesian axes and intersections expose no printed coordinate labels or target answer marker", () => {
  const t = { minCoord: -2, maxCoord: 2 },
    html = H.cartesian(t, null);
  assert.ok(html.includes(">x</text>") && html.includes(">y</text>"));
  assert.equal((html.match(/class="cartesian-point"/g) || []).length, 25);
  assert.ok(!html.includes('aria-pressed="true"'));
  assert.ok(!/>\s*-?\d+,\s*-?\d+\s*<\/button>/.test(html));
  assert.ok(H.cartesian(t, [-1, 2]).includes("Selected point: (-1, 2)"));
});
test("Adaptive levels depend on multi-question discovery, repeated independent checks and prerequisites, never one guided answer", () => {
  const s = E.fresh();
  M.start(s, "number", "0", 3);
  for (let i = 0; i < 3; i++) {
    M.begin(s);
    answer(s, M.current(s).tasks[i]);
    M.submit(s);
    M.next(s);
  }
  assert.equal(M.recommendation(s, "number"), 1);
  s.discovery.algebra_missing = { rounds: [{ band: 7, correct: 3, total: 4 }] };
  assert.equal(AD.skill(s, "algebra_missing").tier, 2);
  s.skills.algebra_missing = {
    independentEvidence: [{ correct: 3, total: 3 }],
  };
  assert.equal(AD.skill(s, "algebra_missing").band, 8);
  s.skills.algebra_missing.independentEvidence.push({ correct: 3, total: 3 });
  assert.equal(AD.skill(s, "algebra_missing").tier, 3);
  s.discovery.fractions = {
    rounds: [
      { band: 5, correct: 0, total: 4 },
      { band: 5, correct: 1, total: 4 },
    ],
  };
  s.discovery.fraction_mult = { rounds: [{ band: 9, correct: 4, total: 4 }] };
  assert.equal(AD.skill(s, "fraction_mult").tier, 1);
});
test("Practice components keep supported responses separate; independent assessment does not render aids", () => {
  for (const k of C.skills)
    for (const q of k.qs) {
      const l = { id: k.id, mode: "check", qs: [q], i: 0 };
      assert.equal(H.practiceRender(l, k), "");
    }
  const l = {
    id: "fractions",
    mode: "practice",
    qs: [["Shade", "1/4", [], "Hint", "Worked"]],
    i: 0,
  };
  H.practiceEdit(l, "shade", 0);
  assert.equal(H.practiceValue(l), "1/4");
  H.practiceEdit(l, "shade", 0);
  assert.equal(H.practiceValue(l), "0/4");
  assert.equal(H.practiceEdit({ ...l, mode: "check" }, "shade", 0), false);
});
test("Connected journey carries inventory, list, fare, payments and cooking; interruption and duplicate completion are safe", () => {
  let s = E.fresh();
  s.coins = 31.125;
  s.equipped = ["cap"];
  s.milestones = M.campMilestoneIds().slice(0, 18);
  M.state(s);
  const original = JSON.stringify([
    s.skills,
    s.coins,
    s.equipped,
    s.milestones,
    s.minutes,
    s.weekly,
  ]);
  J.start(s, "lentil");
  while (!J.state(s).done) {
    let j = J.state(s),
      t = J.task(s);
    assert.ok(!J.next(s));
    if (t.kind === "basket") j.values.parts = [...t.answer];
    else if (t.kind === "journey") j.values.choice = t.answer;
    else if (t.kind === "coins") j.values.coins = Array(t.answer).fill(1);
    else j.values.amount = t.answer;
    // Long payment is rejected by action validator, but ordinary legal denomination construction is used in browsers.
    if (t.kind === "coins") {
      j.values.coins = [];
      let n = t.answer;
      for (const p of [200, 100, 50, 20, 10, 5, 2, 1])
        while (n >= p) {
          j.values.coins.push(p);
          n -= p;
        }
    }
    assert.ok(J.action(s, "j-submit", "", "j-submit"));
    s = E.migrate(JSON.parse(JSON.stringify(s)));
    assert.ok(J.next(s));
    if (J.state(s).stage === 2)
      assert.deepEqual(J.state(s).shoppingList, [1, 1, 2]);
  }
  const j = J.state(s);
  assert.equal(j.cash, 470);
  assert.deepEqual(j.inventory, [0, 0, 0]);
  assert.equal(j.receipts.length, 2);
  assert.equal(new Set(j.receipts.map((x) => x.id)).size, 2);
  const done = JSON.stringify(j);
  for (let i = 0; i < 5; i++) assert.equal(J.next(s), false);
  assert.equal(JSON.stringify(J.state(s)), done);
  assert.equal(
    JSON.stringify([
      s.skills,
      s.coins,
      s.equipped,
      s.milestones,
      s.minutes,
      s.weekly,
    ]),
    original,
  );
});
test("Unsupported journey versions and malformed snapshots are preserved, never silently replaced", () => {
  const s = E.fresh();
  M.state(s);
  s.adventure.journeyV1 = { version: 2, opaque: { keep: true } };
  const old = JSON.stringify(s.adventure.journeyV1);
  assert.equal(J.start(s), false);
  assert.equal(J.model(s), null);
  assert.equal(JSON.stringify(s.adventure.journeyV1), old);
});
test("All eight buildings share validated worker/customer context metadata and retain their venue identity", () => {
  for (const v of T.venues) {
    const worker = T.context(v.id),
      customer = T.context(v.id, "journey");
    assert.equal(worker.venue, customer.venue);
    assert.equal(worker.role, "worker");
    assert.notEqual(worker.role, customer.role);
    assert.notEqual(worker.objective, customer.objective);
  }
});
test("Missing journey context is retained and fails closed instead of crashing",()=>{const s=E.fresh();J.start(s);delete J.state(s).context;const before=JSON.stringify(J.state(s));assert.equal(J.model(s),null);assert.equal(J.start(s),false);assert.equal(JSON.stringify(J.state(s)),before);assert.equal(T.context('unknown','journey'),null);});
test("Completed constructed-practice evidence survives recap without becoming independent mastery",()=>{const s=E.fresh(),bank={create:()=>[0,1,2].map(i=>['Unseen constructed audit '+i,'2',['1','2','3'],'Use objects','Two units'])};assert.equal(E.generate(s,'operations','practice',bank,C),null);for(let i=0;i<3;i++){s.learning.manipulation={amount:2};E.answerLearning(s,'2');E.nextLearning(s);}assert.equal(s.skills.operations.practiceEvidence[0].responses.length,3);assert.ok(s.skills.operations.practiceEvidence[0].responses.every(r=>r.interaction==='constructed'&&!r.firstIndependent&&r.firstAttempt));assert.deepEqual(s.checks,{});assert.equal(s.skills.operations.state,'learning');});
console.log(
  `${suites} V5 suites, ${steps} generated task steps; fictional fixtures only.`,
);
