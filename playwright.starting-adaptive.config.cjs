const base=require('./playwright.home.config.cjs');
module.exports={...base,testMatch:/starting-adaptive\.spec\.cjs/,fullyParallel:true,workers:2,timeout:180000,outputDir:'test-results/starting-adaptive',reporter:[['list'],['json',{outputFile:'work/adaptive-starting-points/results.json'}]]};
