const base = require("./playwright.guided-progression.config.cjs");
module.exports = {
  ...base,
  testMatch:
    /(?:launch-clothing|artwork-review|g28-town-teaching|town-induction-practice|town-mass-examples)\.spec\.cjs/,
  grep: /every outfit|clothing purchase|Town pictures|standalone decoration|G28 |Interactive induction|Gram teaching/,
  timeout: 120000,
  outputDir: "test-results/approved-artwork",
  reporter: [
    ["list"],
    ["json", { outputFile: "work/approved-artwork/browser-results.json" }],
  ],
  webServer: {
    command: "node scripts/serve-artwork-review.cjs",
    url: "http://127.0.0.1:4173/v3-adventure.html",
    reuseExistingServer: true,
  },
};
