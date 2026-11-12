const base=require('./playwright.guided-progression.config.cjs');
module.exports={...base,testMatch:/base-camp\.spec\.cjs/,outputDir:'test-results/base-camp',reporter:[['list'],['json',{outputFile:'work/base-camp/browser-results.json'}]]};
