const base=require('./playwright.guided-progression.config.cjs');
module.exports={...base,testMatch:/guided-preview\.spec\.cjs/,outputDir:'test-results/guided-preview',reporter:[['list'],['json',{outputFile:'work/guided-progression/preview-browser.json'}]]};
