const base = require('./playwright.config.cjs');
module.exports = {
  ...base,
  testMatch: /guide-portraits\.spec\.cjs/,
  workers: 1,
  outputDir: 'test-results/guide-portraits',
  reporter: [['list'], ['json', {outputFile: 'work/all-world-guides/browser-results.json'}]],
};
