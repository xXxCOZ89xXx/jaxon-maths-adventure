const assert = require("node:assert/strict");
const P = require("../v3/presentation").V3Presentation;
const value = 13.154587166666667;
assert.equal(P.coins(value), "13.15");
assert.equal(value, 13.154587166666667);
assert.equal(P.coins(1200), "1,200");
assert.equal(P.coins(0), "0");
assert.equal(P.minutes(2.3548), "2.4");
assert.equal(P.date("bad"), "Unknown time");
assert.match(P.recoveryMessage({ status: 429 }), /Too many recovery requests/);
assert.ok(
  !P.recoveryMessage({
    status: 400,
    message: "private@example.invalid",
  }).includes("private@"),
);
console.log(
  "PASS display-only coin/time formatting and non-sensitive recovery/invalid-date handling",
);
