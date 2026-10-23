'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),c={};c.window=c;vm.createContext(c);for(const file of ['v3/curriculum.js','v2-review-bank.js','v3/town.js','v3/education.js','v3/education-depth.js','v3/hands-on.js'])vm.runInContext(fs.readFileSync(file,'utf8'),c);
const H=c.V5HandsOn,D=c.V7EducationDepth;let built=0;
for(const id of ['fraction_operations','fraction_mult','fraction_mixed','stats_pie','town_bills'])for(let seed=1;seed<=30;seed++)for(let f=0;f<6;f++){
 const q=D.question(id,7,seed,f),t=H.practiceSpec({id},q);if(!t)continue;assert.notEqual(t.kind,'blocks');const l={id,mode:'practice',qs:[q],i:0,manipulation:{}};
 if(t.kind==='fraction-calc'){const [n,d=1]=String(q[1]).split('/').map(Number),parts=n*t.denominator/d;assert(Number.isInteger(parts)&&parts<=t.total,id+' '+q[0]+' denominator '+t.denominator);for(let j=0;j<parts;j++)assert(H.practiceEdit(l,'shade',j));}else{assert(Number(q[1])<=t.max);assert(H.practiceEdit(l,'value',Number(q[1])));}
 assert.equal(H.practiceValue(l),q[1],id+' '+q[0]);assert(!H.practiceRender(l,{id}).includes('place-value blocks'));built++;
}
const old=['Historical amount','8',['8','7','6','5'],'hint','worked'];assert.equal(H.practiceSpec({id:'town_bills'},old).unit,'p');
console.log(`PASS ${built} contextual fraction/chart/meter constructions, independent simplified answers, valid ranges and historical response contract.`);
