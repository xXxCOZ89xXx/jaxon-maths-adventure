'use strict';
const assert=require('node:assert/strict');
const {load}=require('../scripts/audit-curriculum.cjs');
const c=load(),A=c.V8Activities,X=c.V8Curriculum,E=c.V3Engine,M=c.V3Adventure,plain=x=>JSON.parse(JSON.stringify(x));
let count=0;
for(let seed=1;seed<=250;seed++)for(const stage of [4,5]){
 const t=X.task('algebra_graphs',9,seed,stage),before=plain(t),points=JSON.parse(t.answer),v={};
 const html=A.render(t),targets=[...html.matchAll(/data-c8-point="(-?\d+),(-?\d+)"/g)].map(m=>[Number(m[1]),Number(m[2])]);
 assert.equal(targets.length,121,'Keep the full-size 11 by 11 tapping grid');
 assert(!A.correct(t,v));
 for(const [i,p]of points.entries()){
  assert(targets.some(([x,y])=>x===p[0]&&y===p[1]),t.prompt+': missing visible tap target '+p);
  assert(A.edit(t,v,'active-'+i));assert(A.edit(t,v,'point-'+p.join(',')));assert(!A.edit(t,v,'point-'+p[0]+',999'));
 }
 assert(A.correct(t,v));assert.deepEqual(plain(t),before,'Rendering/editing must not rewrite a saved task');count++;
}
for(const [seed,stage]of [[1,4],[28,5]]){
 const t=X.task('algebra_graphs',9,seed,stage),s=E.fresh();M.start(s,'algebra','curr-algebra_graphs',3);s.adventure.active.i=stage;s.adventure.active.tasks[stage]=plain(t);M.begin(s);
 for(const [i,[x,y]]of JSON.parse(t.answer).entries()){
  assert(M.edit(s,'c8action','active-'+i));
  // An old snapshot has no range metadata. Exercise button-only placement from its default point.
  for(let n=0;n<100;n++){const html=A.render(t,M.current(s).values),m=html.match(/Selected x (-?\d+), y (-?\d+)/),px=Number(m[1]),py=Number(m[2]);if(px===x&&py===y)break;assert(M.edit(s,'c8action',px!==x?'dx-'+(px<x?1:-1):'dy-'+(py<y?1:-1)));}
 }
 const before=plain(M.current(s));const restored=E.migrate(plain(s));assert.deepEqual(plain(M.current(restored)),before);assert(M.submit(restored),t.prompt);assert.deepEqual(plain(M.current(restored).tasks[stage]),plain(t));
 const v={};A.edit(t,v,'dy--1');for(let n=0;n<100;n++)A.edit(t,v,'dy--1');const bottom=plain(v);assert(A.edit(t,v,'dy--1'));assert.deepEqual(plain(v),bottom,'Movement clamps to the visible window');
}
const coordinate={activity:{kind:'coordinate'},answer:'[-2,-3]'};assert(A.render(coordinate).includes('x from -5 to 5, y from -5 to 5'));assert(!A.edit(coordinate,{},'point-0,-34'));assert(A.edit(coordinate,{},'point--2,-3'));
console.log(`PASS algebra graph ranges: ${count} quadratic/linear tasks have reachable tap targets, positive/negative button placement, legacy resume and unchanged coordinate limits.`);
