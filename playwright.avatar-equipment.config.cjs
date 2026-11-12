const base=require('./playwright.config.cjs');
module.exports={...base,testMatch:/avatar-equipment\.spec\.cjs/,outputDir:'test-results/avatar-equipment',reporter:[['list'],['json',{outputFile:'work/avatar-equipment/browser-results.json'}]],projects:[...base.projects,{name:'small-touch',use:{...base.projects.find(p=>p.name==='ipad-portrait-chromium').use,viewport:{width:390,height:844}}}]};
