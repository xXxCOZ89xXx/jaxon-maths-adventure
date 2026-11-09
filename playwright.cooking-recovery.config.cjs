const path=require('node:path'),base=require('./playwright.home.config.cjs');
module.exports={...base,testMatch:/(?:save-recovery|cooking-recovery)\.spec\.cjs/,
 grep:/Cooking recovery:|offline edits keep the immutable request|local edits save immediately/,
 // The existing recovery cases use tap, including at the desktop viewport.
 projects:base.projects.map(p=>({...p,use:{...p.use,hasTouch:true}})),
 outputDir:'test-results/cooking-recovery',
 reporter:[['list'],['json',{outputFile:process.env.COOKING_REPORT||'work/cooking-recovery/browser-results.json'}]],
 webServer:{...base.webServer,cwd:path.resolve(__dirname)}};
