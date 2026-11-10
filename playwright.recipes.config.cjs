const base=require('./playwright.home.config.cjs');
module.exports={...base,testMatch:/recipes\.spec\.cjs/,fullyParallel:true,workers:2,timeout:240000,outputDir:'test-results/recipes',reporter:[['list'],['json',{outputFile:process.env.RECIPE_REPORT||'work/recipes/results.json'}]]};
