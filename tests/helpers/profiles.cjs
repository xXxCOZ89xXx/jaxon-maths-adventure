'use strict';
// Synthetic evidence scenarios, not age labels or assumptions about the real learner.
const E=require('../../v3/engine').V3Engine;
const C=require('../../v3/curriculum').V3Curriculum;
const T=require('../../v3/town').V3Town;
const vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const sandbox={window:{}};
vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../../v2-review-bank.js'),'utf8'),sandbox);
const bank=T.install(C,sandbox.window.JaxonFreshReview);
const names={new:'New Learner',foundation:'Foundation Learner',developing:'Developing Learner',advanced:'Advanced Learner'};
function profile(name='new') {
  if(!names[name]) throw Error('Unknown fictional profile');
  const s=require("./starting-profile.cjs").ready(E.fresh());
  if(name==='new') return s;
  C.skills.forEach((k,i)=>{
    const band=name==='advanced'?8:name==='developing'&&i%3?7:5;
    const correct=name==='foundation'?1:name==='developing'&&i%3===0?1:4;
    s.discovery[k.id]={band,answers:[],complete:true,rounds:[0,1].map(n=>({band,correct,total:4,date:`2026-10-${10+n}T12:00:00.000Z`}))};
    if(name==='advanced') s.skills[k.id]={independentEvidence:[0,1].map(n=>({correct:3,total:3,date:`2026-10-${12+n}T12:00:00.000Z`}))};
    if(name==='foundation'||name==='developing'&&i%3===0) s.checks[k.id]={stage:0,score:25,reteach:true};
  });
  return s;
}
module.exports={profile,names,E,C,T,bank};
