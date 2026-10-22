const base=require('./playwright.config.cjs');
module.exports={...base,testMatch:/(ipad-polish|ipad-gameplay-priority)\.spec\.cjs/,reporter:[['list'],['json',{outputFile:'tests/artifacts/ipad-polish-results.json'}]]};
