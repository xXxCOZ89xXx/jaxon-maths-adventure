const { spawnSync } = require("node:child_process"),
  path = require("node:path"),
  files = require("./maintained-source.cjs");
const mode = process.argv[2],
  tool = mode === "lint" ? "eslint" : "prettier";
if (!["lint", "format", "check"].includes(mode))
  throw Error("Choose lint, format or check");
const bin = path.join(
  path.dirname(require.resolve(tool + "/package.json")),
  "bin",
  tool === "eslint" ? "eslint.js" : "prettier.cjs",
);
const args =
  mode === "lint"
    ? ["--max-warnings=0", ...files.filter((f) => /\.[cm]?js$/.test(f))]
    : [mode === "format" ? "--write" : "--check", ...files];
const result = spawnSync(process.execPath, [bin, ...args], {
  stdio: "inherit",
});
process.exitCode = result.status ?? 1;
