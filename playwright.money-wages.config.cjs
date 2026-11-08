const base=require('./playwright.config.cjs');
module.exports={...base,testMatch:/money-wages\.spec\.cjs/,outputDir:'test-results/money-wages',reporter:[['list'],['json',{outputFile:'work/money-wages-browser.json'}]]};
