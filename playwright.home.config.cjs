const {chromium}=require('@playwright/test'),base=require('./playwright.guided-progression.config.cjs');
module.exports={...base,testMatch:/home-exterior\.spec\.cjs/,timeout:120000,workers:1,
 projects:base.projects.map(p=>({...p,use:{...p.use,launchOptions:{executablePath:process.env.V3_CHROMIUM_EXECUTABLE||chromium.executablePath()}}})),
 reporter:[['list'],['json',{outputFile:'work/home-exterior/browser-results.json'}]],outputDir:'test-results/home-exterior',
 webServer:{command:'node tests/home-server.cjs',url:'http://127.0.0.1:4173/v3-adventure.html',reuseExistingServer:false}};
