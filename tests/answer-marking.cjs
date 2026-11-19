const assert = require("node:assert/strict"),
  { V3AnswerMarking: A } = require("../v3/answer-marking.js");
for (const [expected, input, context] of [
  ["1/12", "0.0833"],
  ["39.166667", "39 1/6"],
  ["-2.333333", "-2 1/3"],
  ["12.5", "£12.50", { unit: "pounds" }],
  ["1250", "£12.50", { unit: "pence" }],
  ["1.25", "1250 g", { unit: "kg" }],
  [".01", "100 cm²", { unit: "m2" }],
  ["90", "1.5 hours", { unit: "minutes" }],
  ["25", "25%", { unit: "percent" }],
  ["1", "1000 cm³", { unit: "l" }],
  [".001", "1 l", { unit: "m3" }],
  ["10", "36 km/h", { unit: "m/s" }],
  ["-2", "-2°C", { unit: "celsius" }],
  ["10:35", "10:35", { unit: "clock" }],
  ["3:2", "3:2"],
  ["Yes", " yes "],
  ["1200", "1,200"],
  ["1000", "1e3"],
  ["1/12", "8.33e-2"],
  ["-12.5", "-£12.50", { unit: "pounds" }],
])
  assert(A.matches(expected, input, context), expected + " = " + input);
for (const [expected, input, context] of [
  ["10:35", "10:30", { unit: "clock" }],
  ["3:2", "6:4"],
  ["1/12", "0.08"],
  ["1/12", "0.0832"],
  ["39.166667", "39 1/5"],
  ["12.5", "1250", { unit: "pounds" }],
  ["1.25", "1250 ml", { unit: "kg" }],
  ["1", "NaN"],
  ["1", "Infinity"],
  ["1", "1/0"],
  ["12", "1,2"],
  ["1", "1+0"],
  ["1", "1kg"],
  ["1e-9", "0"],
  ["1e-9", "0.0000"],
  ["0", "0.000000001"],
])
  assert(!A.matches(expected, input, context), expected + " != " + input);
assert(A.matches("1/12", "0.083", { decimalPlaces: 3 }));
assert(!A.matches("1/12", "0.0831", { decimalPlaces: 3 }));
assert.deepEqual(
  A.contract("Round to 3 decimal places. Give the answer in kilograms."),
  { unit: "kg", decimalPlaces: 3 },
);
assert.deepEqual(A.contract("Give the area in cm²."), { unit: "cm2" });
console.log(
  "PASS shared marking: rounded decimals, mixed/negative fractions, money and compatible units; wrong precision, wrong dimensions, malformed fractions and expressions refused.",
);
