// Only the fictional output may be removed. Deployable family/test artifacts stay intact.
const fs = require("node:fs"),
  path = require("node:path");
const { build } = require("../scripts/build-synthetic-environment.cjs");
const { config } = require("./helpers/synthetic-project.cjs");
const out = path.resolve(__dirname, "../synthetic-fixture-dist");
fs.rmSync(out, { recursive: true, force: true });
build(config, { fixture: true });
console.log(
  "Prepared isolated synthetic fixture; all remote traffic must be intercepted.",
);
