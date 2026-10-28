"use strict";
const assert = require("node:assert/strict"),
  fs = require("node:fs"),
  vm = require("node:vm");
const E = require("../v3/engine").V3Engine,
  C = require("../v3/curriculum").V3Curriculum;
const ctx = { window: {} };
vm.runInNewContext(fs.readFileSync("v2-review-bank.js", "utf8"), ctx);
const bank = require("../v3/education").V6Education.install(C, require("../v3/town").V3Town.install(
  C,
  ctx.window.JaxonFreshReview,
));
let checks = 0;
function test(name, fn) {
  fn();
  checks++;
  console.log("PASS: " + name);
}
test("Migration preserves synthetic V2 fields, unknown data, balances, ownership and mastery", () => {
  const old = {
    coins: 830,
    minutes: 12,
    bought: ["cap", "fox"],
    equipped: ["cap"],
    skills: { place: { state: "mastered" } },
    weekly: { "2026-10-19": 12 },
    customFuture: { value: 7 },
  };
  const snapshot = JSON.stringify(old),
    s = E.migrate(old);
  assert.equal(JSON.stringify(old), snapshot);
  for (const k of Object.keys(old)) assert.deepEqual(s[k], old[k]);
  assert.equal(s.version, 3);
  assert.deepEqual(E.migrate(s), s);
  assert.equal(
    E.migrate({
      coins: -1,
      minutes: "bad",
      quest: { world: "unknown" },
      view: "quest",
    }).view,
    "home",
  );
});
test("Earlier saved quest loops persist exact state, restore 24 landmarks and cannot farm XP or coins", () => {
  let s = E.fresh();
  for (const w of E.worlds.filter((w) => w.id !== "town")) {
    assert.ok(C.skills.some((k) => k.id === w.skill));
    const R=require('../v3/restoration').V10Restoration;
    for(const id of R.mapping[w.id].flat())s.discovery[id]={complete:true,rounds:[{band:5,correct:2,total:4}]};
    // Released three-task snapshots remain resumable; new starts use assessed plans.
    s.quest={world:w.id,i:0,value:0,selected:[],assisted:false,solved:false,feedback:'',intro:true};
    s.quests[w.id]=s.quest;s.view='quest';s.resumeView='quest';
    assert.equal(s.quest.intro, true);
    s.quest.intro = false;
    for (let i = 0; i < 3; i++) {
      s.quest={world:w.id,i,value:0,selected:[],assisted:false,solved:false,feedback:'',intro:false};s.quests[w.id]=s.quest;s.view='quest';
      const p = E.puzzle(w.id, i);
      E.help(s);
      E.answerQuest(s, true);
      assert.equal(E.count(s, w.id), i);
      s.quest = JSON.parse(JSON.stringify(s.quest));
      if (["fraction", "chance"].includes(p.kind))
        s.quest.selected = Array.from({ length: p.answer }, (_, i) => i);
      else s.quest.value = p.answer;
      assert.ok(E.answerQuest(s));
      assert.equal(E.answerQuest(s), false);
      assert.equal(E.count(s, w.id), i + 1);
      s = E.migrate(s);
      assert.equal(s.quest.i, i);
      E.nextQuest(s);
    }
    assert.equal(s.view, "recap");
  }
  assert.equal(E.xp(s), 2400);
  assert.equal(s.coins, 0);
  E.startQuest(s, "number");
  assert.equal(s.quest,null);
  assert.equal(s.view,'recap');
  assert.equal(E.xp(s), 2400);
  assert.deepEqual(s.skills, {});
});
test("All runtime foundation skills: guided practice cannot award mastery, checks are fresh, immediate retakes blocked, spaced mastery works", () => {
  for (const k of C.skills) {
    const s = E.fresh(),
      now = Date.UTC(2026, 9, 20);
    // This suite isolates practice/check policy; prerequisite discovery is tested separately.
    for(const pre of require("../v3/education").V6Education.prerequisites[k.id]||[])s.checks[pre]={stage:1};
    assert.match(E.generate(s, k.id, "check", bank, C, now), /practice/);
    assert.equal(E.generate(s, k.id, "practice", bank, C, now), null);
    const practice = s.learning.qs.map((q) => q[0]);
    while (s.learning) {
      E.answerLearning(s, s.learning.qs[s.learning.i][1], false, now);
      E.nextLearning(s, now);
    }
    assert.notEqual(s.skills[k.id].state, "mastered");
    assert.equal(E.generate(s, k.id, "check", bank, C, now), null);
    assert.ok(
      s.learning.qs.every(
        (q) => !practice.includes(q[0]) && !k.qs.some((old) => old[0] === q[0]),
      ),
    );
    while (s.learning) {
      E.answerLearning(s, s.learning.qs[s.learning.i][1], false, now);
      E.nextLearning(s, now);
    }
    assert.equal(s.checks[k.id].stage, 1);
    assert.match(E.generate(s, k.id, "check", bank, C, now), /not due/);
    const due = s.checks[k.id].due;
    assert.equal(E.generate(s, k.id, "check", bank, C, due), null);
    while (s.learning) {
      E.answerLearning(s, s.learning.qs[s.learning.i][1], false, due);
      E.nextLearning(s, due);
    }
    assert.equal(s.skills[k.id].state, "mastered");
    assert.equal(s.coins, 0);
  }
});
test("Hinted, wrong and skipped check answers never inflate mastery; failed check requires reteaching", () => {
  const s = E.fresh();
  s.practice.place = { completed: true };
  s.checks.number_bonds = {stage:1};
  E.generate(s, "place", "check", bank, C);
  s.learning.assisted = true;
  E.answerLearning(s, s.learning.qs[0][1]);
  E.answerLearning(s, s.learning.qs[0][1]);
  E.nextLearning(s);
  E.answerLearning(s, "wrong");
  E.nextLearning(s);
  while(s.learning){E.answerLearning(s, "", true);E.nextLearning(s);}
  assert.equal(s.checks.place.score, 0);
  assert.equal(s.checks.place.reteach, true);
  assert.match(E.generate(s, "place", "check", bank, C), /practice/);
  E.generate(s, "place", "practice", bank, C);
  while (s.learning) {
    E.answerLearning(s, "", true);
    E.nextLearning(s);
  }
  assert.equal(s.checks.place.reteach, false);
  assert.equal(E.generate(s, "place", "check", bank, C), null);
});
test("Active time and coins are bounded, 60-minute goal is unmodified, reward conversion remains 1:1", () => {
  const s = E.fresh(),
    now = Date.UTC(2026, 9, 20);
  E.activeTime(s, 999999, false, now);
  assert.equal(s.minutes, 0);
  for (let i = 0; i < 720; i++) E.activeTime(s, 5000, true, now);
  assert.ok(Math.abs(s.minutes - 60) < 1e-8);
  assert.ok(s.coins >= 599 && s.coins <= 600);
  assert.equal(E.weekKey(now), "2026-10-19");
  const prev = s.minutes;
  E.activeTime(s, 999999, true, now);
  assert.ok(s.minutes - prev < 0.084);
});
test("40 unchanged catalogue IDs, unaffordable purchase rejection, equip slot and repeated purchase safety", () => {
  assert.equal(C.catalog.length, 40);
  const s = E.fresh();
  assert.equal(E.purchase(s, "cap", C.catalog), false);
  s.coins = 200;
  assert.ok(E.purchase(s, "cap", C.catalog));
  assert.equal(s.coins, 155);
  assert.ok(E.purchase(s, "cap", C.catalog));
  assert.equal(s.coins, 155);
  assert.deepEqual(s.equipped, []);
  E.purchase(s, "helmet", C.catalog);
  E.purchase(s, "cap", C.catalog);
  assert.deepEqual(s.equipped, ["cap"]);
  assert.deepEqual(s.bought, ["cap", "helmet"]);
});
test("No cloud scripts, production keys or external assets in V3 entrypoint", () => {
  const html = fs.readFileSync("v3-adventure.html", "utf8");
  assert.ok(html.includes("connect-src 'none'"));
  assert.ok(!html.includes("v2-secure-cloud"));
  assert.ok(!/https?:\/\//.test(html));
  assert.ok(
    !fs.readFileSync("v3/app.js", "utf8").includes("jaxon_maths_v2_2026"),
  );
});
test("All 1100 discovery choices remain valid; adaptive rounds choose a band without granting mastery", () => {
  const helper = require("../v3/discovery").V3Discovery;
  for (const k of C.skills) {
    for (let band = 5; band <= 9; band++)
      for (let i = 0; i < 4; i++) {
        const h = helper(C.discovery, k.id, { band, i });
        assert.equal(new Set(h.choices()).size, 4);
        assert.equal(
          h
            .choices()
            .filter(
              (v) => Math.abs(h.parse(String(v)) - h.question()[2]) < 1e-8,
            ).length,
          1,
        );
      }
    const s = E.fresh();
    for (let round = 0; round < 3; round++) {
      assert.equal(E.startDiscovery(s, k.id, C, helper), null);
      const prompts = s.learning.qs.map((q) => q[0]);
      for (let i = 0; i < 4; i++) {
        const l = s.learning;
        E.answerLearning(s, l.qs[i][1]);
        E.nextLearning(s);
      }
      assert.ok(prompts.every((q) => s.seen.includes(q)));
    }
    assert.equal(s.discovery[k.id].complete, true);
    assert.equal(s.discovery[k.id].rounds.at(-1).band, require("../v3/education").V6Education.minBand(k.id)===3 ? 7 : 9);
    assert.deepEqual(s.skills, {});
    assert.equal(s.coins, 0);
  }
});
test("Changing worlds preserves assessed restoration snapshots without rewarding navigation", () => {
 const R=require('../v3/restoration').V10Restoration,M=require('../v3/adventure').V3Adventure,s=E.fresh();
 for(const world of ['number','fractions'])for(const id of R.mapping[world][0])s.discovery[id]={complete:true,rounds:[{band:5,correct:2,total:4}]};
 E.startQuest(s,'number');M.begin(s);M.current(s).values={c8:{draft:'1'}};M.help(s);const number=JSON.parse(JSON.stringify(M.current(s)));
 E.startQuest(s,'fractions');M.begin(s);M.current(s).values={c8:{draft:'1/2'}};const fraction=JSON.parse(JSON.stringify(M.current(s)));
 const reloaded=E.migrate(s);E.startQuest(reloaded,'number');assert.deepEqual(M.current(reloaded),number);E.startQuest(reloaded,'fractions');assert.deepEqual(M.current(reloaded),fraction);assert.equal(reloaded.coins,0);assert.equal(E.xp(reloaded),0);
});

console.log(
  `PASS: ${checks} V3 suites, original eight quest worlds and all 55 skills. Fictional fixtures only.`,
);
