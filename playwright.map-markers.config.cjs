const base = require('./playwright.guided-progression.config.cjs');
module.exports = {
  ...base,
  testMatch: /map-marker-bounds\.spec\.cjs/,
  timeout: 120000,
  workers: 1,
  outputDir: process.env.MARKER_ENTRY ? 'test-results/map-marker-negative' : 'test-results/map-markers',
  reporter: [['list'], ['json', {outputFile: process.env.MARKER_REPORT || (process.env.MARKER_BASELINE ? 'work/map-markers/before-results.json' : 'work/map-markers/after-results.json')}]],
  webServer: {command: 'node tests/home-server.cjs', url: 'http://127.0.0.1:4173/v3-adventure.html', reuseExistingServer: false},
};
