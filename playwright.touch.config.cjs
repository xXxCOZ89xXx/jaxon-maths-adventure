const base=require('./playwright.curriculum.config.cjs');
module.exports={...base,testMatch:/touch\.spec\.cjs/,timeout:120000,workers:1,outputDir:'test-results/touch',reporter:[['list'],['json',{outputFile:'work/touch-browser.json'}]]};
