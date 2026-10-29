const base=require('./playwright.config.cjs');
module.exports={...base,outputDir:'test-results/town-life',testMatch:/town-life\.spec\.cjs/,reporter:[['list'],['json',{outputFile:'tests/artifacts/town-life-browser.json'}]]};
