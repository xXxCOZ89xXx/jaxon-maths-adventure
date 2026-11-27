"use strict";
// Demo sample/stopping-point policy: pure checks with fictional state only.
const assert = require("node:assert/strict"),
  fs = require("node:fs"),
  path = require("node:path");
const { create } = require("./sample-policy.js");
const cfg = JSON.parse(
  fs.readFileSync(path.join(__dirname, "sample.json"), "utf8"),
);
const copy = (x) => JSON.parse(JSON.stringify(x));
let checks = 0;
const ok = (v, m) => {
  assert(v, m);
  checks++;
};

// Config shape and vocabulary must match real game identities.
const c = require("../scripts/audit-curriculum.cjs").load();
const skills = new Set(c.V3Curriculum.skills.map((k) => k.id));
for (const id of cfg.lessons) ok(skills.has(id), "Unknown sample skill " + id);
for (const [world, routes] of Object.entries(cfg.missions)) {
  const real = new Set(c.V3Adventure.routes(world).map((r) => String(r.id)));
  for (const r of routes) ok(real.has(r), `Unknown route ${world}:${r}`);
}
{
  const vm = require("node:vm");
  c.V3Art = { esc: String };
  for (const f of ["v3/town-content.js", "v3/town-life.js"])
    vm.runInContext(fs.readFileSync(path.join(__dirname, "..", f), "utf8"), c);
  const plans = new Set(c.V52TownLife.catalog.map((x) => x.id));
  for (const id of cfg.townPlans) ok(plans.has(id), "Unknown Town plan " + id);
}
for (const k of cfg.homeActivities)
  ok(["meters", "recycling", "post"].includes(k), "Unknown Home activity " + k);
ok(Number.isSafeInteger(cfg.stop.activities) && cfg.stop.activities > 0);
ok(Number.isSafeInteger(cfg.stop.repeatsPerActivity));

const P = create(cfg, {
  restoration: { recommend: () => ({ type: "learn", id: "place" }) },
});
const fresh = () => ({ view: "home", skills: {}, coins: 0 });

// Inside and outside the sample.
let s = fresh();
ok(P.allowed(s, "learn:place"));
ok(P.allowed(s, "check:negative") && P.allowed(s, "discover:fractions"));
ok(!P.allowed(s, "learn:geometry_trig"), "Unsampled lesson blocked");
ok(P.reason(s, "learn:geometry_trig") === cfg.messages.notInSample);
ok(
  P.allowed(s, "mission:number:0:1") &&
    P.allowed(s, "scene-mission:number:0:2"),
);
ok(!P.allowed(s, "mission:number:0:3"), "Level cap");
ok(!P.allowed(s, "mission:number:1:1"), "Unsampled route");
ok(
  P.allowed(s, "mission:town:market:1") &&
    !P.allowed(s, "mission:town:station:1"),
);
ok(P.allowed(s, "j-plan:cook-pasta") && !P.allowed(s, "j-plan:cook-curry"));
ok(P.allowed(s, "j-work:market:1") && !P.allowed(s, "j-work:bank:1"));
ok(
  !P.allowed(s, "j-start:bolognese") && !P.allowed(s, "j-recipe-replay:lentil"),
);
ok(P.allowed(s, "home-activity:meters"));
ok(P.allowed(s, "starting:number"), "Optional starting checks stay open");
ok(P.allowed(s, "next-path:number"), "Next path resolves to a sampled lesson");

// Continuing, pausing, resuming and shop/camp play are never blocked.
const continuing = [
  "continue",
  "resume-saved:learning",
  "pause-explore",
  "practice",
  "answer:0",
  "next-learning",
  "learning-hint",
  "learning-skip",
  "m-begin",
  "m-submit",
  "m-next",
  "j-next",
  "j-choice:1",
  "d9-check",
  "c8-check",
  "p5-submit",
  "nav:map",
  "world:geometry",
  "buy:hat",
  "camp-build:1",
  "starting-next",
  "skip-tour",
  "finish-tour",
];
for (const a of continuing) ok(P.allowed(s, a), "Never block " + a);
for (const a of continuing) ok(!P.record(s, a), "Not counted " + a);
ok(s.demoSample === undefined, "No sample book before a start");

// Stopping points: distinct starts up to the limit, repeats per activity.
s = fresh();
const starters = [
  "learn:place",
  "learn:negative",
  "learn:fractions",
  "learn:algebra_missing",
  "learn:geometry_angles",
  "learn:ratio_sharing",
  "learn:stats_tables",
  "learn:prob_events",
  "learn:measure_units",
  "learn:town_totals",
  "j-plan:cook-pasta",
];
for (let i = 0; i < cfg.stop.activities; i++) {
  ok(P.allowed(s, starters[i]), "Start " + i);
  ok(P.record(s, starters[i]));
}
ok(P.usage(s).count === cfg.stop.activities);
ok(P.ended(s) && P.banner(s).ended && P.banner(s).text === cfg.messages.ended);
ok(
  !P.allowed(s, starters[cfg.stop.activities]),
  "New start blocked after the end",
);
ok(P.reason(s, starters[cfg.stop.activities]) === cfg.messages.ended);
ok(P.allowed(s, "learn:place"), "A tried activity may be repeated");
P.record(s, "learn:place");
ok(!P.allowed(s, "learn:place"), "Repeat limit");
ok(P.reason(s, "learn:place") === cfg.messages.repeatUsed);
for (const a of continuing) ok(P.allowed(s, a), "Still never block " + a);
ok(P.allowed(s, "starting:fractions"), "Starting checks are not counted");

// Going back into a Town visit already under way, open or paused, is resuming:
// never blocked or counted. A replay after finishing and another level still count.
{
  const t = require("../tests/helpers/guided-progression.cjs").fresh(),
    A = c.V3Adventure,
    market = "mission:town:market:1";
  ok(P.allowed(t, market) && P.record(t, market), "First Town start counts");
  ok(A.start(t, "town", "market", 1));
  for (let i = 0; i < 3; i++) {
    ok(P.allowed(t, market), "Resume the open visit " + i);
    ok(!P.record(t, market), "Resuming is not counted " + i);
  }
  ok(A.start(t, "town", "cafe", 1), "Market is now paused");
  ok(P.allowed(t, market) && !P.record(t, market), "Paused visit resumes");
  ok(P.usage(t).used["mission:town:market"] === 1);
  ok(A.start(t, "town", "market", 1));
  for (let g = 0; t.adventure.active && g < 40; g++) {
    t.adventure.active.solved = true;
    A.next(t);
  }
  ok(!t.adventure.active && !t.adventure.suspended["town|market|1"]);
  ok(P.allowed(t, market) && P.record(t, market), "A replay counts");
  ok(!P.allowed(t, market), "Repeat limit still applies to replays");
  ok(P.reason(t, market) === cfg.messages.repeatUsed);
  ok(!P.allowed(t, "mission:town:market:3"), "Level 3 is outside the sample");
}

// Unknown fields and other samples' books are preserved; a new sample id starts fresh.
s.unknownFutureField = { keep: [1, 2] };
s.demoSample.samples["older-sample"] = { used: { "skill:x": 2 } };
const before = copy(s);
const Q = create({ ...cfg, id: "another-sample" });
ok(Q.usage(s).count === 0 && Q.allowed(s, "learn:place"));
Q.record(s, "learn:place");
ok(
  JSON.stringify(s.unknownFutureField) ===
    JSON.stringify(before.unknownFutureField),
);
ok(
  JSON.stringify(s.demoSample.samples[cfg.id]) ===
    JSON.stringify(before.demoSample.samples[cfg.id]),
);
ok(s.demoSample.samples["older-sample"].used["skill:x"] === 2);

// Corrupt books never crash and never invent progress.
for (const bad of [
  null,
  3,
  [],
  { samples: 5 },
  { samples: { [cfg.id]: { used: "x" } } },
]) {
  const t = { ...fresh(), demoSample: bad };
  ok(P.usage(t).count === 0 && P.allowed(t, "learn:place"));
}

// Disabled sample opens everything (full demo mode) and records nothing.
const open = create({ ...cfg, enabled: false });
ok(
  open.allowed(fresh(), "learn:geometry_trig") &&
    !open.record(fresh(), "learn:place"),
);

// Wildcard lessons.
ok(create({ ...cfg, lessons: ["*"] }).allowed(fresh(), "learn:geometry_trig"));
assert.throws(() => create({ version: 2 }), /DEMO_SAMPLE_CONFIG/);
checks++;
// A release build refuses any sample the owner has not approved.
if (!String(cfg.status).startsWith("approved")) {
  const r = require("node:child_process").spawnSync(
    process.execPath,
    [path.join(__dirname, "release-build.cjs")],
    {
      env: { ...process.env, CF_PAGES_BRANCH: "release/ipad" },
      encoding: "utf8",
    },
  );
  ok(
    r.status !== 0 && /not approved for release/.test(r.stderr),
    "Unapproved sample blocks release",
  );
}
console.log(`PASS demo sample policy: ${checks} checks (sample ${cfg.id}).`);
