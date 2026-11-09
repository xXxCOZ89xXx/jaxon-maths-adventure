const base=require('./playwright.home.config.cjs');
module.exports={...base,testMatch:/area-maps\.spec\.cjs/,timeout:120000,outputDir:process.env.AREA_BEFORE?'test-results/area-baseline':'test-results/area-maps',reporter:[['list'],['json',{outputFile:process.env.AREA_REPORT||(process.env.AREA_BEFORE?'work/area-maps/baseline-results.json':'work/area-maps/browser-results.json')}]]};
