const fs = require("fs"),
  vm = require("vm"),
  cp = require("child_process");
const C = require("../v3/curriculum").V3Curriculum,
  T = require("../v3/town").V3Town,
  M = require("../v3/adventure").V3Adventure,
  H = require("../v3/hands-on").V5HandsOn,
  E = require("../v3/engine").V3Engine;
const ctx = { window: {} };
vm.runInNewContext(fs.readFileSync("v2-review-bank.js", "utf8"), ctx);
const bank = T.install(C, ctx.window.JaxonFreshReview);
const prior = {
  module: { exports: {} },
  exports: {},
  require: (r) => require("../v3/" + r.replace("./", "")),
};
prior.exports = prior.module.exports;
vm.runInNewContext(
  cp.execFileSync("git", ["show", "792ffae:v3/adventure.js"], {
    encoding: "utf8",
  }),
  prior,
);
const old = prior.module.exports.V3Adventure;
const oldKinds = new Set([
  "line",
  "blocks",
  "fraction",
  "chance",
  "grid",
  "coordinate",
  "rotate",
  "basket",
  "offers",
  "budget",
  "coins",
]);
const worlds = E.worlds.map((w) => {
  let total = 0,
    handsOn = 0,
    before = 0;
  const mechanics = new Set();
  for (const r of [...M.routes(w.id).map((r) => r.id), "gateway"])
    for (let d = 1; d <= 3; d++) {
      const a = E.fresh(),
        b = E.fresh();
      M.start(a, w.id, r, d);
      old.start(b, w.id, r, d);
      for (let i = 0; i < 3; i++) {
        total++;
        const t = M.current(a).tasks[i],
          m = H.mechanic(t, w.id, r);
        if (H.isHandsOn(t, w.id, r)) {
          handsOn++;
          mechanics.add(m);
        }
        if (oldKinds.has(old.current(b).tasks[i].kind)) before++;
      }
    }
  return {
    id: w.id,
    steps: total,
    beforeHandsOn: before,
    handsOn,
    percent: Math.round((handsOn / total) * 100),
    mechanics: [...mechanics],
  };
});
const skills = C.skills.map((k) => {
  let samples = 0,
    constructed = 0;
  const mechanics = new Set();
  for (const d of [5, 7, 9])
    for (const q of bank.create(k.id, d, 23)) {
      samples++;
      const spec = H.practiceSpec(k, q);
      if (spec) {
        constructed++;
        mechanics.add(H.mechanic(spec));
      }
    }
  return {
    id: k.id,
    world: k.world,
    accessible: true,
    samples,
    constructed,
    mechanics: [...mechanics],
  };
});
const out = {
  scope:
    "Generated guided expedition steps across all routes, gateways and three tiers; repeat seeds do not inflate percentages. Digital clocks, numeric sequence steppers, budget steppers and normal multiple choice excluded. Practice audit samples nine actual fresh questions per skill, not a promise all variants use manipulatives.",
  worlds,
  skills,
  town: T.venues.map((v) => ({
    id: v.id,
    skills: v.skills,
    workerDirect: true,
    journeyCustomer: ["market", "station", "home"].includes(v.id),
  })),
  totals: {
    guidedSteps: worlds.reduce((n, w) => n + w.steps, 0),
    handsOn: worlds.reduce((n, w) => n + w.handsOn, 0),
    allGuidedSteps: worlds.reduce((n,w)=>n+w.steps,0)+24,
    conservativeAllGuidedHandsOn:worlds.reduce((n,w)=>n+w.handsOn,0),
    accessibleSkills: skills.length,
    skillsWithSampledManipulatives: skills.filter((s) => s.constructed).length,
  },
};
fs.writeFileSync(
  "tests/artifacts/v5-interaction-coverage.json",
  JSON.stringify(out, null, 2) + "\n",
);
console.log(JSON.stringify({ worlds, totals: out.totals }, null, 2));
