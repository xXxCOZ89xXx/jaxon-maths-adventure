'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');const c={};c.window=c;vm.createContext(c);for(const p of ['v3/curriculum.js','v2-review-bank.js','v3/town.js','v3/education.js','v3/education-depth.js'])vm.runInContext(fs.readFileSync(p,'utf8'),c,{filename:p});const D=c.V7EducationDepth,B=c.JaxonFreshReview;assert.equal(c.V3Curriculum.skills.length,63);assert.equal(D.ids.length,50);let count=0;
for(const id of D.ids){for(const band of [5,7,9])for(let seed=1;seed<=12;seed++)for(let f=0;f<6;f++){const q=D.question(id,band,seed,f);assert.equal(q[2].filter(a=>a===q[1]).length,1,id);assert.equal(new Set(q[2]).size,4,id);assert(q[3]&&q[4]&&q[5].misconception,id);assert(!q[0].includes('undefined'),id);count++;}const exclude=new Set();for(let round=1;round<=12;round++){const qs=B.create(id,5,round,{exclude});assert.equal(qs.length,6,id);assert.equal(new Set(qs.map(q=>q[1])).size,6,id);assert(new Set(qs.map(q=>q[5].family)).size>=3,id);for(const q of qs){assert(!exclude.has(q[0]),id);exclude.add(q[0]);}}}
// Independent arithmetic oracles for formulas that can be easy to misstate.
for(let seed=1;seed<=100;seed++){
 let q=D.question('negative',7,seed,4),v=q[0].match(/−(\d+)/g).map(x=>Number(x.slice(1)));assert.equal(Number(q[1]),v[0]-v[1]);
 q=D.question('geometry_area',7,seed,4);v=q[0].match(/\d+/g).map(Number);assert.equal(Number(q[1]),v[0]*v[1]/2);
 q=D.question('town_bills',7,seed,0);v=q[0].match(/\d+/g).map(Number);assert.equal(Number(q[1]),v[1]-v[0]);
 q=D.question('town_wages',7,seed,2);v=q[0].match(/\d+/g).map(Number);assert.equal(Number(q[1]),(v[0]-1)*v[1]);
 q=D.question('measure_volume',7,seed,0);v=q[0].match(/\d+/g).map(Number);assert.equal(Number(q[1]),v[0]*v[1]*v[2]);
}
console.log(`PASS: 50 remaining banks, ${count} generated questions, 12 fresh rounds per skill and focused arithmetic oracles.`);
vm.runInContext(fs.readFileSync('v3/hands-on.js','utf8'),c);
const H=c.V5HandsOn;
for(const id of D.ids)for(let f=0;f<6;f++){const q=D.question(id,7,25,f),t=H.practiceSpec({id},q);if(!t)continue;if(q[5].unit==='pence')assert.equal(t.scale,1,id);if(q[5].unit==='pounds')assert.equal(t.scale,100,id);if(['kWh','m³','minutes','people','percent'].includes(q[5].unit))assert.notEqual(t.unit,'p',id);}
const old=['Historical meter question','8',['8','7','6','5'],'hint','worked'];assert.equal(H.practiceSpec({id:'town_bills'},old).unit,'p','Historical snapshots keep their original contract');
console.log('PASS: new response units match manipulatives; historical question contracts retained.');
