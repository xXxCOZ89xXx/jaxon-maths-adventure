const base=require('./playwright.base-camp.config.cjs');
module.exports={...base,testMatch:/parent-game-reset\.spec\.cjs/,globalSetup:require.resolve('./tests/prepare-v52-production.cjs'),outputDir:'test-results/parent-reset',reporter:[['list'],['json',{outputFile:'work/base-camp/reset-browser-results.json'}]]};
