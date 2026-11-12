const base=require('./playwright.config.cjs');
module.exports={...base,testMatch:/top-navigation\.spec\.cjs/,workers:1,
 globalSetup:require.resolve('./tests/prepare-v52-production.cjs'),
 outputDir:'test-results/top-navigation',reporter:[['list'],['json',{outputFile:'work/top-navigation/results.json'}]]};
