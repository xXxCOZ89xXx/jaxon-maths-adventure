// Explicit completed-baseline fixture for post-profile regression suites only.
// New first-play tests use V3Engine.fresh() unchanged and complete the real flow.
const fs=require('node:fs'),vm=require('node:vm');
let cached;
function completed(){if(!cached){const c=require('../../scripts/audit-curriculum.cjs').load();vm.runInContext(fs.readFileSync('v3/starting-profile.js','utf8'),c);const s=c.V3Engine.fresh(),P=c.V11StartingProfile;for(const id of Object.keys(P.areas))for(let n=0;n<4;n++){P.start(s,id,c.V3Curriculum,1793232000000);P.answer(s,id,P.question(s,id).answer,false,1793232000000);P.advance(s,id,c.V3Curriculum,1793232000000);}cached=JSON.parse(JSON.stringify(s.startingProfile));}return JSON.parse(JSON.stringify(cached));}
function ready(s){s.startingProfile=completed();return s;}
async function browser(page){await page.context().addInitScript(p=>window.FictionalStartingProfile=p,completed());}
module.exports={completed,ready,browser};
