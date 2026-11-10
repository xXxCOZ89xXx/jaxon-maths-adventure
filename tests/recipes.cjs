const assert=require('node:assert/strict'),fs=require('node:fs');
const F=require('./helpers/guided-progression.cjs'),{L}=F,N=require('../v3/activity-navigation').V10Navigation;
const copy=x=>JSON.parse(JSON.stringify(x));let stages=0;
for(const meal of L.meals)for(const tier of [1,2,3])for(const seed of [1,2,7]){
 const s=F.fresh();s.adventure={townLifeV2:{version:2,runs:{},counts:{['cook-'+meal.id]:seed-1},active:null}};L.start(s,'cook-'+meal.id,tier);
 const j=L.state(s),card=j.recipeCard,protectedBefore=copy([s.checks,s.startingProfile,s.coins,s.bought]);
 assert.equal(card.recipeVersion,1);assert.equal(card.portions,2*tier);assert.equal(card.totalMinutes,card.prepMinutes+card.minutes);assert(card.safety.includes('adult'));assert(card.allergens);assert(card.optional.length);
 const inspect=j.steps.find(t=>t.visualContext==='stock'),list=j.steps.find(t=>t.visualContext==='list'),shelf=j.steps.find(t=>t.visualContext==='shelves'),paid=j.steps.find(t=>t.effect.receipt==='recipe ingredients');
 for(const [n,i]of card.ingredients.entries()){
  assert.equal(i.required,i.base*tier);assert.equal(inspect.stock[i.key]*i.packQuantity,j.inventory[i.key]);
  const need=Math.ceil(Math.max(0,i.required-j.inventory[i.key])/i.packQuantity);
  assert.equal(list.answer[n],need);assert.equal(list.effect.list[i.key],need);assert.equal(shelf.answer[n],need);assert.equal(shelf.items[n].name,i.key);assert.equal(paid.effect.add[i.key],need*i.packQuantity);
  assert(j.inventory[i.key]+paid.effect.add[i.key]>=i.required);assert(j.inventory[i.key]+paid.effect.add[i.key]-i.required<i.packQuantity||need===0);
  assert.equal(shelf.items[n].storage,i.storage);
 }
 assert.equal(paid.effect.spend,shelf.answer.reduce((sum,n,i)=>sum+n*shelf.items[i].price,0));
 if(meal.id==='pancakes')assert(card.ingredients.some(i=>i.name==='Rolled oats'));if(meal.id==='curry')assert(!card.ingredients.some(i=>/chilli|curry paste/i.test(i.name)));
 const initialInventory=copy(j.inventory);
 while(!L.state(s).done){
  const t=L.task(s);if(t.requiresStock&&t.title==='Check ingredients before cooking'){
   const name=Object.keys(t.requiresStock)[0],available=j.inventory[name],stage=j.stage;j.inventory[name]=0;
   j.values.choice=t.answer;assert(!L.action(s,'j-submit'));assert(!L.action(s,'j-skip'));assert(!L.next(s));assert.equal(j.stage,stage);assert(j.feedback.includes('Not enough ingredients'));j.inventory[name]=available;
  }
  F.townStep(s);stages++;assert(L.validRun(L.state(s)));
  const snapshot=copy(L.state(s));N.pause(s);N.resume(s);assert.deepEqual(L.state(s),snapshot);
 }
 for(const i of card.ingredients)assert.equal(j.inventory[i.key],initialInventory[i.key]+paid.effect.add[i.key]-i.required);
 assert.deepEqual([s.checks,s.startingProfile,s.coins,s.bought],protectedBefore);
 const completed=copy(j);L.start(s,'cook-'+meal.id,tier,true);assert.equal(L.state(s).recipeCard.recipeVersion,1);assert.deepEqual(L.book(s).runs[completed.id],completed);
}
// Every previously saved recipe keeps its exact old units, task order and draft.
for(let index=0;index<5;index++){
 const s=require('./helpers/recipe-legacy.cjs')(index),old=copy(L.state(s));assert(!old.recipeCard.recipeVersion);assert(L.start(s,old.scenario,3));assert.deepEqual(L.state(s),old);
 while(!L.state(s).done)F.townStep(s);assert.deepEqual(L.state(s).steps,old.steps);
 const completed=copy(L.state(s));L.start(s,old.scenario,2,true);assert.equal(L.state(s).recipeCard.recipeVersion,1);assert.deepEqual(L.book(s).runs[completed.id],completed);
}
// Explicit selections replace only Continue's transient pointer.
const s=F.fresh();L.start(s,'cook-pasta',1);F.townStep(s);N.pause(s);const pasta=copy(L.state(s));L.start(s,'cook-curry',2);N.resume(s);assert.equal(L.state(s).scenario,'cook-curry');assert.deepEqual(L.book(s).runs[pasta.id],pasta);
N.pause(s);const curry=copy(L.state(s));assert(F.M.visit(s,'town','bank',2).available);N.resume(s);assert.equal(s.view,'adventure');assert.equal(F.M.current(s).route,'bank');assert.deepEqual(L.book(s).runs[curry.id],curry);
L.start(s,'cook-pasta',3);assert.deepEqual(L.state(s),pasta);
const legacy=F.fresh();require('./helpers/legacy-town.cjs')(legacy);const oldV1=copy(legacy.adventure.journeyV1);L.start(legacy,'cook-pancakes',2);const other=copy(L.state(legacy));N.pause(legacy);const J=require('../v3/journey').V5Journey;assert(J.start(legacy,'bolognese'));N.resume(legacy);assert.equal(legacy.adventure.townActive,1);assert.deepEqual(J.state(legacy),oldV1);assert.deepEqual(L.book(legacy).runs[other.id],other);
console.log(`PASS five recipes × three serving levels × three seeds; ${stages} stages, pack/usable-unit conservation, exact missing purchases, stock guards, leftovers, legacy snapshots, switching and Continue.`);
