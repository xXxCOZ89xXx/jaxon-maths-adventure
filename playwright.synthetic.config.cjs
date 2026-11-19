const base = require("./playwright.quality.config.cjs");
module.exports = {
  ...base,
  testMatch: /synthetic-environment\.spec\.cjs/,
  outputDir: "test-results/synthetic-environment",
  workers: 1,
  reporter: [
    ["list"],
    [
      "json",
      { outputFile: "tests/artifacts/synthetic-environment-browser.json" },
    ],
  ],
};
