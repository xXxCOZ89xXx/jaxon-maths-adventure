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
            assert(q.feedback.includes(t.teach));
            M.help(s);
            assert.ok(q.assisted);
            assert.equal(q.phase,"play","Wrong answers keep the question available for retry");
            M.begin(s);
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
  require("./helpers/legacy-town.cjs")(s,"lentil");
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
test("Missing journey context is retained and fails closed instead of crashing",()=>{const s=E.fresh();require('./helpers/legacy-town.cjs')(s);delete J.state(s).context;const before=JSON.stringify(J.state(s));assert.equal(J.model(s),null);assert.equal(J.start(s),false);assert.equal(JSON.stringify(J.state(s)),before);assert.equal(T.context('unknown','journey'),null);});
test("Completed constructed-practice evidence survives recap without becoming independent mastery",()=>{const s=E.fresh(),bank={create:()=>[0,1,2].map(i=>['Unseen constructed audit '+i,'2',['1','2','3'],'Use objects','Two units'])};assert.equal(E.generate(s,'operations','practice',bank,C),null);for(let i=0;i<3;i++){s.learning.manipulation={amount:2};E.answerLearning(s,'2');E.nextLearning(s);}assert.equal(s.skills.operations.practiceEvidence[0].responses.length,3);assert.ok(s.skills.operations.practiceEvidence[0].responses.every(r=>r.interaction==='constructed'&&!r.firstIndependent&&r.firstAttempt));assert.deepEqual(s.checks,{});assert.equal(s.skills.operations.state,'learning');});
test("Every supported practice response is constructible in the question's units across all 55 skills and bands",()=>{const ctx={window:{}};vm.runInNewContext(fs.readFileSync('v2-review-bank.js','utf8'),ctx);const bank=T.install(C,ctx.window.JaxonFreshReview);let checked=0;for(const k of C.skills)for(const band of [5,6,7,8,9])for(const round of [1,23,80])for(const q of (()=>{try{return bank.create(k.id,band,round);}catch(e){if(/^Duplicate questions in review/.test(e.message))return [];throw e;}})()){const t=H.practiceSpec(k,q);if(!t)continue;const l={id:k.id,mode:'practice',qs:[q],i:0,manipulation:{}};if(t.kind==='fraction')l.manipulation.selected=Array.from({length:Number(q[1].split('/')[0])},(_,i)=>i);else l.manipulation.amount=Number(q[1])*(t.scale||1);assert.equal(H.practiceValue(l),String(q[1]),k.id+' '+q[0]);if(['town_money','town_totals','town_menu','town_value','town_travel','town_bills','town_wages'].includes(k.id))assert.equal(t.scale,1);if(['town_timetable','town_time'].includes(k.id))assert.equal(t.unit,'minutes');checked++;}assert.ok(checked>1000);assert.equal(H.practiceSpec({id:'fraction_mixed'},['','7/3']),null);assert.equal(H.practiceSpec({id:'algebra_missing'},['','-100']),null);});
test("Practice generation skips a rejected duplicate round and serves a validated fresh set",()=>{const s=E.fresh();let calls=0;const bank={create:()=>{if(!calls++)throw Error('Duplicate questions in review for operations');return [0,1,2].map(i=>['Fresh duplicate recovery '+i,'2',['1','2','3'],'Hint','Worked']);}};assert.equal(E.generate(s,'operations','practice',bank,C),null);assert.equal(calls,2);assert.equal(s.learning.qs.length,3);});
test("Ordering and matching supply positions vary deterministically rather than repeating an answer-slot pattern",()=>{for(const [world,route,stage] of [['number','2',0],['ratio','1',1],['town','shops',1],['fractions','1',2]]){const layouts=new Set();for(let seed=1;seed<=12;seed++){const t=M.task(world,route,2,seed,stage);assert.deepEqual(M.task(world,route,2,seed,stage),t);layouts.add(JSON.stringify(t.answer));}assert.ok(layouts.size>=3,world+' should vary the answer slots');}});


test('V5.1 strict numeric drafts prevent stale submissions without recording learning evidence',()=>{
  for(const raw of ['', ' ', '1e3','NaN','2.5','-1','101','Infinity']) assert.equal(H.numericValue(raw,{min:0,max:100}),null,raw);
  for(const raw of ['0','001','100']) assert.equal(H.numericValue(raw,{min:0,max:100}),Number(raw));
  assert.equal(H.numericValue('-12',{min:-20,max:20}),-12);
  assert.equal(H.numericValue('4.50',{min:0,max:100000},100),450);
  assert.equal(H.numericValue('4.001',{min:0,max:100000},100),null);
  assert.equal(H.invalidDraft({amountDraft:'4.50'},{min:0,max:100000,practice:true,scale:100}),false);
  assert.equal(H.invalidDraft({amountDraft:'4.001'},{min:0,max:100000,practice:true,scale:100}),true);
  const s=E.fresh(); M.start(s,'town','cafe',2);s.adventure.active.i=1;M.begin(s);
  const q=M.current(s),t=q.tasks[1];M.edit(s,'amount',t.answer);q.values.amountDraft='';
  assert.equal(M.submit(s),false);assert.equal(q.solved,false);assert.equal(q.evidence?.length||0,0);
  M.edit(s,'amount',t.answer);assert.equal(q.values.amountDraft,undefined);assert.equal(M.submit(s),true);
  assert.match(H.sharing(t,t.answer),/£0.00 left to share/);
  assert.match(H.sharing(t,0),/1\/3/);
});

console.log(
  `${suites} V5 suites, ${steps} generated task steps; fictional fixtures only.`,
);

