const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const { review } = require("../scripts/review-credential-scan.cjs");
const line = 'const key="fictional local-storage identifier";';
const digest = crypto.createHash("sha256").update(line).digest("hex");
const finding = {
  RuleID: "generic-api-key",
  File: "fixture.js",
  Commit: "a".repeat(40),
  StartLine: 1,
  EndLine: 1,
};
const allowed = [
  {
    file: "fixture.js",
    lineSha256: digest,
    reason: "Fictional reviewed identifier",
  },
];
const log = "4 commits scanned.";
assert(review([finding], log, () => line, allowed).passed);
assert(!review([finding], log, () => line + "changed", allowed).passed);
assert(
  !review([{ ...finding, File: "other.js" }], log, () => line, allowed).passed,
);
assert(
  !review([{ ...finding, RuleID: "other-rule" }], log, () => line, allowed)
    .passed,
);
assert(
  !review(
    [finding],
    "ERR fatal: unreadable tree\n4 commits scanned.",
    () => line,
    allowed,
  ).passed,
);
assert(!review([], "no leaks found", () => line, allowed).passed);
assert(
  !review(
    [finding],
    log,
    () => {
      throw Error("missing");
    },
    allowed,
  ).passed,
);
assert(!review([{ ...finding, EndLine: 2 }], log, () => line, allowed).passed);
console.log(
  "PASS exact-line credential classification, changed content/path/rule refusal, partial scan errors and missing/multiline source",
);
