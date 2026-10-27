const base = require('./playwright.config.cjs');
module.exports = {
  ...base,
  testMatch: /painted-desert\.spec\.cjs/,
  workers: 1,
  outputDir: 'test-results/painted-desert',
  reporter: [['list'], ['json', {outputFile: 'work/fraction-desert/browser-results.json'}]],
};
