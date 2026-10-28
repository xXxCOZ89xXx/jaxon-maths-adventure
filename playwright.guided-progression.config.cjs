const base=require('./playwright.config.cjs');
module.exports={...base,testMatch:/guided-progression\.spec\.cjs/,outputDir:'test-results/guided-progression',workers:1,
 reporter:[['list'],['json',{outputFile:'work/guided-progression/browser-results.json'}]],
 projects:[...base.projects,{name:'small-touch',use:{...base.projects[1].use,viewport:{width:360,height:800}}}]};
