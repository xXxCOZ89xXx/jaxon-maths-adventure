"use strict";
const assert = require("node:assert/strict"),
  E = require("../v3/engine").V3Engine,
  L = require("../v3/town-life").V52TownLife,
  Q = require("../v3/town-content").V53TownContent;
const clone = (x) => JSON.parse(JSON.stringify(x)),
  runWithoutPractice = (s) => {
    const x = clone(s);
    delete L.state(x).employmentInduction.progress;
    return x;
  };
let cases = 0;
for (const job of L.catalog.filter((x) => x.category === "Employment"))
  for (const tier of [1, 2, 3])
    for (const seed of [1, 2, 7]) {
      const s = E.fresh();
      s.adventure = {
        townLifeV2: {
          version: 2,
          runs: {},
          counts: { [job.id]: seed - 1 },
          active: null,
        },
      };
      assert(L.start(s, job.id, tier));
      const j = L.state(s);
      assert.equal(j.employmentInduction.version, 2);
      j.employmentInduction.progress.future = { keep: "unchanged" };
      const stable = runWithoutPractice(s);
      assert(Q.inductionAction(j, "draft", { field: "gross", value: "13.00" }));
      const partial = E.migrate(clone(s));
      assert.deepEqual(L.state(partial), j);
      assert(Q.inductionAction(j, "check", { gross: "13.00", net: "11" }));
      assert.equal(Q.inductionModel(j).correct, false);
      assert.equal(j.employmentInduction.progress.status, "retry");
      assert.equal(j.employmentInduction.progress.attempts, 1);
      assert.match(Q.inductionModel(j).feedback, /Have another try/);
      for (const invalid of [
        "",
        "-14",
        "1e1",
        "Infinity",
        "14.001",
        "££14",
        "14p",
      ]) {
        const count = j.employmentInduction.progress.attempts;
        assert(Q.inductionAction(j, "check", { gross: invalid, net: "12" }));
        assert.equal(j.employmentInduction.progress.status, "incomplete");
        assert.equal(j.employmentInduction.progress.attempts, count);
      }
      assert(Q.inductionAction(j, "check", { gross: "£14.00", net: "12" }));
      assert(Q.inductionModel(j).correct);
      assert.equal(j.employmentInduction.progress.attempts, 2);
      const correct = clone(j);
      assert.equal(
        Q.inductionAction(j, "check", { gross: "14", net: "12" }),
        false,
      );
      assert.deepEqual(j, correct);
      assert(Q.inductionAction(j, "ready"));
      assert.equal(j.employmentInduction.progress.open, false);
      assert.deepEqual(runWithoutPractice(s), stable);
      assert.deepEqual(L.state(E.migrate(clone(s))), j);
      assert.equal(j.stage, 0);
      assert.deepEqual(j.evidence, []);
      assert.equal(j.solved, false);
      for (const legacyVersion of [1, 3]) {
        const old = clone(j);
        old.employmentInduction.version = legacyVersion;
        const before = clone(old);
        assert.equal(Q.inductionModel(old), null);
        assert.equal(
          Q.inductionAction(old, "check", { gross: "14", net: "12" }),
          false,
        );
        assert.deepEqual(old, before);
      }
      const noGuide = clone(j);
      delete noGuide.employmentInduction;
      assert.equal(
        Q.inductionAction(noGuide, "check", { gross: "14", net: "12" }),
        false,
      );
      const solved = clone(j);
      solved.solved = true;
      assert.equal(Q.inductionModel(solved), null);
      const later = clone(j);
      later.stage = 1;
      assert.equal(Q.inductionModel(later), null);
      const bad = clone(j);
      bad.employmentInduction.exercise.deduction = 999999;
      const beforeBad = clone(bad);
      assert.equal(Q.inductionAction(bad, "ready"), false);
      assert.deepEqual(bad, beforeBad);
      cases++;
    }
console.log(
  "PASS interactive employee practice: " +
    cases +
    " job/level/seed snapshots; partial drafts, invalid/wrong/correct/retry, exact reload, duplicate check, historical/unknown records, shift and full non-practice game state preserved.",
);
