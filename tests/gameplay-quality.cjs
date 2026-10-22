'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const E=require('../v3/engine').V3Engine,M=require('../v3/adventure').V3Adventure,L=require('../v3/town-life').V52TownLife,J=require('../v3/journey').V5Journey,H=require('../v3/hands-on').V5HandsOn;
const copy=x=>JSON.parse(JSON.stringify(x));
function solve(s,chosen){let t=L.task(s),j=L.state(s);if(['order','match'].includes(t.kind))j.values.order=copy(t.answer);else if(['basket','budget'].includes(t.kind))j.values.parts=copy(t.answer);else if(['journey','choice'].includes(t.kind))j.values.choice=chosen??t.answer;else if(t.kind==='coins'){j.values.coins=[];let n=t.answer;for(let p of [5000,2000,1000,500,200,100,50,20,10,5,2,1])while(n>=p){j.values.coins.push(p);n-=p;}}else j.values.amount=t.answer;assert(L.action(s,'j-submit'),t.title);assert(!L.action(s,'j-submit'),'duplicate submit must not add evidence');assert(L.next(s),t.title);}
const definitions=[];
for(const c of L.catalog)for(const tier of [1,2,3])for(const seed of [1,2,7]){
 const run=L.make(c.id,tier,seed);assert(L.validRun(run));assert.deepEqual(run,copy(run));
 if(c.category==='Cooking'){assert(run.recipeCard);definitions.push(run.recipeCard);assert(run.steps.some(t=>t.title==='Set the recipe temperature'));assert(run.steps.some(t=>t.kind==='measure'));}
 if(c.id!=='shop-missing'&&c.category!=='Cooking')assert(!run.steps.some(t=>t.visualContext==='stock'),c.id+' irrelevant stock');
 for(const t of run.steps){assert(!t.prompt.includes('Reach '+c.name));assert(!t.prompt.includes('receipts, cash, then purchases'));if(t.kind==='basket'&&t.budget)assert(t.answer.reduce((s,n,i)=>s+n*t.items[i].price,0)<=t.budget,c.id+' budget');}
}
assert.equal(new Set(definitions.map(m=>m.name)).size,5);assert.equal(new Set(definitions.map(m=>m.prep.join('|'))).size,5);
// Every choice branch at each tier/seed is playable, recorded, affordable and survives serialization.
for(const tier of [1,2,3])for(const seed of [1,2,7])for(const lunch of ['Cheese','Tomato','Jacket']){
 let s=E.fresh();s.adventure={townLifeV2:{version:2,runs:{},counts:{'shop-budget':seed-1},active:null}};L.start(s,'shop-budget',tier);const t=L.task(s),chosen=t.options.findIndex(o=>o.name.startsWith(lunch));solve(s,chosen);
 while(!L.state(s).done){s=E.migrate(copy(s));solve(s);}
 const j=L.state(s);assert(j.cash>=0);assert(j.decisions[0].choice.startsWith(lunch));assert(Object.keys(j.inventory).some(k=>k.includes(lunch==='Cheese'?'rolls':lunch==='Tomato'?'Rice':'Sweet potatoes')));assert.equal(j.cash+j.savings,6500+(tier-1)*500-j.receipts.reduce((n,r)=>n+r.spent-r.earned,0));
}
// Resume the actual pre-change V2 snapshot without regenerating or renumbering its tasks.
let s=E.fresh();s.adventure={townLifeV2:require('./fixtures/town-v2-before-quality.json'),townActive:2};const saved=copy(L.state(s));assert(L.start(s,'cook-pasta'));assert.deepEqual(L.state(s),saved);while(!L.state(s).done)solve(s);assert.equal(L.state(s).cash,6065); // frozen original plan's two fares and shopping
const oldDone=copy(L.state(s));L.start(s,'cook-pasta',1,true);assert.deepEqual(L.book(s).runs[oldDone.id],oldDone);assert.equal(L.state(s).contentRevision,3);
// New original journeys use the full recipe while an unfinished V1 remains exact and can still finish.
s=E.fresh();require('./helpers/legacy-town.cjs')(s);const v1=copy(s.adventure.journeyV1);assert(J.start(s,'bolognese'));assert.deepEqual(J.state(s),v1);assert(J.validState(J.state(s)));
s=E.fresh();assert(J.start(s,'bolognese'));assert.equal(J.state(s).recipeCard.name,'Spaghetti Bolognese');while(!L.state(s).done)solve(s);const before=copy(L.state(s));J.start(s,'bolognese');assert.deepEqual(L.book(s).runs[before.id],before);assert.equal(L.state(s).seed,2);
// New display order cannot be a complete answer, including older already-sorted snapshots.
let orderChecks=0;for(const world of E.worlds)for(const r of M.routes(world.id))for(const tier of [1,2,3])for(let stage=0;stage<3;stage++){
 const t=M.task(world.id,r.id,tier,1,stage);if(['order','match'].includes(t.kind)){const html=H.render({world:world.id,route:r.id,values:{}},t),shown=[...html.matchAll(/data-action="h-pick:(\d+)"/g)].map(m=>+m[1]);assert.notDeepEqual(shown,t.answer);orderChecks++;}}
const manifest={townPlans:L.catalog.length,tiers:3,seeds:[1,2,7],lunchBranches:27,orderingDisplays:orderChecks,legacyV1:true,legacyV2:true,liveWrites:0};fs.writeFileSync('tests/artifacts/gameplay-quality-logic.json',JSON.stringify(manifest,null,2)+'\n');console.log('PASS gameplay quality',manifest);
