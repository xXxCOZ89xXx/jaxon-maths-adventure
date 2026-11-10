const base=require('./playwright.home.config.cjs');
module.exports={...base,testMatch:/recipe-art\.spec\.cjs/,fullyParallel:true,workers:2,timeout:180000,outputDir:'test-results/recipe-art',reporter:[['list'],['json',{outputFile:process.env.ART_REPORT||'work/ingredient-art/results.json'}]]};
