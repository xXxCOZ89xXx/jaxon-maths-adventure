'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const c={console,Date,Math,Set,Map,structuredClone};c.window=c;vm.createContext(c);
const files=['v3/curriculum.js','v2-review-bank.js','v2-guided-teaching.js','v2-maths-tools.js','v2-extra-tools.js','v3/discovery.js','v3/town.js','v3/education.js','v3/education-depth.js','v3/curriculum-expansion.js','v3/curriculum-activities.js','v3/curriculum-map.js','v3/touch-activities.js','v3/touch-content.js','v3/adaptive.js','v3/hands-on.js','v3/town-content.js','v3/town-life.js','v3/journey.js','v3/restoration.js','v3/activity-navigation.js','v3/adventure.js','v3/engine.js'];
for(const p of files)vm.runInContext(fs.readFileSync(p,'utf8'),c,{filename:p});
const D=c.V7EducationDepth,B=c.JaxonFreshReview,C=c.V3Curriculum,ED=c.V6Education,E=c.V3Engine,H=c.V5HandsOn;
assert.equal(C.skills.length,96);assert.equal(B.supportedSkills.length,96);let count=0,rounds=0;
// Exercise each real runtime bank across every band it supports. Exclusions
// accumulate exactly as they do for new independent lessons/checks.
for(const skill of C.skills){
 const first=ED.minBand(skill.id);
 for(let band=first;band<=9;band++){
  const excluded=new Set();
  for(let round=1;round<=40;round++){
   let qs;try{qs=B.create(skill.id,band,round,{exclude:excluded});}catch(error){throw Error(`${skill.id} band ${band} round ${round}: ${error.message}`);}
   assert.equal(qs.length,6,`${skill.id} band ${band} round ${round}`);
   assert.equal(new Set(qs.map(q=>q[0])).size,6,`${skill.id}: duplicate prompt in set`);
   assert(new Set(qs.map(q=>q[5]?.family||q[5]?.id||q[0])).size>=3,`${skill.id}: too few question families`);
   for(const q of qs){assert(!excluded.has(q[0]),`${skill.id} repeated a used prompt at band ${band}, round ${round}`);excluded.add(q[0]);count++;}
   rounds++;
  }
 }
}
assert.equal(D.ids.length,50);
for(const id of D.ids)for(const band of [5,7,9])for(let seed=1;seed<=12;seed++)for(let f=0;f<6;f++){
 const q=D.question(id,band,seed,f);assert.equal(q[2].filter(a=>a===q[1]).length,1,id);assert.equal(new Set(q[2]).size,4,id);assert(q[3]&&q[4]&&q[5].misconception,id);assert(!q[0].includes('undefined'),id);
}
// Exhaust a small fictional bank: practice must revisit the oldest questions,
// while an independent check must stay blocked and explain why.
const tiny=Array.from({length:6},(_,i)=>[`Old question ${i+1}`,String(i+1),['1','2','3','4'],'hint','worked',{family:'tiny:'+i}]);
const exhausted={supportedSkills:['negative'],create(_id,_band,_round){return tiny;}};
let s=E.fresh();s.seen=tiny.map(q=>q[0]);
assert.equal(E.generate(s,'negative','practice',exhausted,C,Date.UTC(2026,10,1)),null);
assert.deepEqual(Array.from(s.learning.qs,q=>q[0]),tiny.map(q=>q[0]));
assert.equal(s.learning.mode,'practice');
s=E.fresh();s.practice.number_bonds={completed:true};s.seen=tiny.map(q=>q[0]);
const before=JSON.stringify(s),message=E.generate(s,'number_bonds','check',exhausted,C,Date.UTC(2026,10,1));
assert.match(message,/fresh independent check is not available/i);assert.equal(JSON.stringify(s),before,'A blocked check must not change learner state.');
// Independent arithmetic oracles for formulas that can be easy to misstate.
for(let seed=1;seed<=100;seed++){
 let q=D.question('negative',7,seed,4),v=q[0].match(/−(\d+)/g).map(x=>Number(x.slice(1)));assert.equal(Number(q[1]),v[0]-v[1]);
 q=D.question('geometry_area',7,seed,4);v=q[0].match(/\d+/g).map(Number);assert.equal(Number(q[1]),v[0]*v[1]/2);
 q=D.question('town_bills',7,seed,0);v=q[0].match(/\d+/g).map(Number);assert.equal(Number(q[1]),v[1]-v[0]);
 q=D.question('town_wages',7,seed,2);v=q[0].match(/\d+/g).map(Number);assert.equal(Number(q[1]),(v[0]-1)*v[1]);
 q=D.question('measure_volume',7,seed,0);v=q[0].match(/\d+/g).map(Number);assert.equal(Number(q[1]),v[0]*v[1]*v[2]);
}
console.log(`PASS: ${rounds} skill-band rounds across ${C.skills.length} skills; ${count} prompts remain fresh; practice fallback and independent-check protection verified.`);
vm.runInContext(fs.readFileSync('v3/hands-on.js','utf8'),c);
for(const id of D.ids)for(let f=0;f<6;f++){const q=D.question(id,7,25,f),t=H.practiceSpec({id},q);if(!t)continue;if(q[5].unit==='pence')assert.equal(t.scale,1,id);if(q[5].unit==='pounds')assert.equal(t.scale,100,id);if(['kWh','m³','minutes','people','percent'].includes(q[5].unit))assert.notEqual(t.unit,'p',id);}
const old=['Historical meter question','8',['8','7','6','5'],'hint','worked'];assert.equal(H.practiceSpec({id:'town_bills'},old).unit,'p','Historical snapshots keep their original contract');
console.log('PASS: new response units match manipulatives; historical question contracts retained.');
