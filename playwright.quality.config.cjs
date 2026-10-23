const base=require('./playwright.config.cjs');
module.exports={...base,testMatch:/gameplay-quality\.spec\.cjs/,timeout:120000,projects:base.projects.filter(p=>p.name.includes('ipad')),reporter:[['list'],['json',{outputFile:process.env.QUALITY_REPORT||'tests/artifacts/gameplay-quality-browser.json'}]]};
