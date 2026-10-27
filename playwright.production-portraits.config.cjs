const base=require('./playwright.config.cjs');
module.exports={...base,testMatch:/production-portraits\.spec\.cjs/,workers:1,
 globalSetup:require.resolve(process.env.GUIDE_BUILD==='live'?'./tests/prepare-live-portraits.cjs':'./tests/prepare-v52-production.cjs'),
 reporter:[['list'],['json',{outputFile:process.env.GUIDE_BUILD==='live'?'work/production-portraits/live-results.json':'work/production-portraits/browser-results.json'}]],
 outputDir:process.env.GUIDE_BUILD==='live'?'test-results/live-portraits':'test-results/production-portraits'};
