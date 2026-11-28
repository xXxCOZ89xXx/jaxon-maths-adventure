"use strict";
const E = require("../../v3/engine").V3Engine,
  L = require("../../v3/town-life").V52TownLife;
function solve(s) {
  const t = L.task(s);
  if (["order", "match"].includes(t.kind))
    t.answer.forEach((pick, slot) => {
      L.action(s, "j-pick", String(pick));
      L.action(s, "j-place", String(slot));
    });
  else if (["basket", "budget"].includes(t.kind)) {
    for (let i = 0; i < t.answer.length; i++) {
      let n = t.answer[i];
      for (const step of t.kind === "budget" ? [1000, 500, 100, 25, 5, 1] : [1])
        while (n >= step) {
          L.action(s, "j-part", String(i), "j-part:" + i + ":" + step);
          n -= step;
        }
    }
  } else if (["journey", "choice"].includes(t.kind))
    L.action(s, "j-choice", String(t.answer));
  else if (t.kind === "coins") {
    let n = t.answer;
    for (const p of [5000, 2000, 1000, 500, 200, 100, 50, 20, 10, 5, 2, 1])
      while (n >= p) {
        L.action(s, "j-coin", String(p));
        n -= p;
      }
  } else L.action(s, "j-value", String(t.answer));
  if (!L.action(s, "j-submit")) throw Error("Could not solve " + t.title);
  if (!L.action(s, "j-next")) throw Error("Could not continue " + t.title);
}
function fixture(scenario, tier = 1, seed = 1) {
  const s = require("./profiles.cjs").profile("new");
  s.adventure ||= {};
  s.adventure.townLifeV2 = {
    version: 2,
    runs: {},
    counts: { [scenario]: seed - 1 },
    active: null,
  };
  if (!L.start(s, scenario, tier)) throw Error(scenario);
  while (!(L.task(s)?.kind === "measure" && L.task(s)?.unit === "g")) {
    if (L.state(s).done) throw Error("No gram measure in " + scenario);
    solve(s);
  }
  return s;
}
module.exports = { E, L, solve, fixture };
