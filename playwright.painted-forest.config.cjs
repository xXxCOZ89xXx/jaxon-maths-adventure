const base = require('./playwright.config.cjs');
module.exports = {
  ...base,
  testMatch: /painted-forest\.spec\.cjs/,
  workers: 1,
  outputDir: 'test-results/painted-forest',
  reporter: [['list'], ['json', {outputFile: 'work/painted-forest/browser-results.json'}]],
};
