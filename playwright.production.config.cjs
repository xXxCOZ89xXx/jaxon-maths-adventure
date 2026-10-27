const {defineConfig}=require('@playwright/test');
module.exports=defineConfig({testDir:'./tests',testMatch:'v52-production.spec.cjs',timeout:60000,workers:1,outputDir:'test-results/production-browser',
 globalSetup:require.resolve('./tests/prepare-v52-production.cjs'),
 reporter:[['list'],['json',{outputFile:'tests/artifacts/v5-2-production-browser.json'}]],
 use:{baseURL:'http://127.0.0.1:4173',actionTimeout:15000,trace:'retain-on-failure'},
 projects:[{name:'desktop',use:{viewport:{width:1440,height:1000}}},
 {name:'ipad-portrait',use:{viewport:{width:820,height:1180},isMobile:true,hasTouch:true}},
 {name:'ipad-landscape',use:{viewport:{width:1180,height:820},isMobile:true,hasTouch:true}}].map(p=>({...p,use:{...p.use,browserName:'chromium',
 launchOptions:{executablePath:process.env.V3_CHROMIUM_EXECUTABLE||(process.env.CI?undefined:'/usr/bin/chromium'),args:['--no-sandbox']}}})),
 webServer:{command:'python3 tests/serve-preview.py',url:'http://127.0.0.1:4173/v3-adventure.html',reuseExistingServer:true}});
