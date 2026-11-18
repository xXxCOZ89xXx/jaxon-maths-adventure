'use strict';
const assert=require('node:assert/strict'),E=require('../v3/engine').V3Engine,L=require('../v3/town-life').V52TownLife;
const copy=x=>JSON.parse(JSON.stringify(x));
let s=E.fresh();assert(L.start(s,'cook-soup'));const soup=copy(L.state(s));assert(L.start(s,'shop-party'));const damaged=s.adventure.townLifeV2.runs['shop-party:1'];damaged.version=99;damaged.unknown={keep:['all','bytes']};const preserved=copy(damaged);
assert(L.start(s,'cook-soup'));assert.deepEqual(L.state(s),soup);assert(L.start(s,'shop-groceries'));const before=copy(s);assert(!L.start(s,'shop-party'));assert.deepEqual(s,before);assert.deepEqual(s.adventure.townLifeV2.runs['shop-party:1'],preserved);
s.adventure.townLifeV2.runs['shop-offers:1']=null;const nullBefore=copy(s);assert(!L.start(s,'shop-offers'));assert.deepEqual(s,nullBefore);
s.adventure.townLifeV2.counts['travel-library']='unsupported';assert(L.start(s,'travel-swim'));const counterBefore=copy(s);assert(!L.start(s,'travel-library'));assert.deepEqual(s,counterBefore);
s=E.fresh();assert(L.startRecipe(s,'bolognese'));const original=copy(L.state(s));assert(L.startRecipe(s,'lentil'));s.adventure.townLifeV2.runs['original-lentil:1'].version=99;assert(L.startRecipe(s,'bolognese'));assert.deepEqual(L.state(s),original);
// The existing renderer derives missing display titles from prompts; optional nulls are legacy no-ops.
s=E.fresh();assert(L.start(s,'travel-swim'));let legacy=L.state(s);
for(const t of legacy.steps){delete t.title;t.requiresStock ??= null;t.branches ??= null;for(const key of ['earn','spend','savings','minutes','sale','add','consume','list','receipt','choice'])if(t.effect[key]===undefined)t.effect[key]=null;}
legacy.envelopes=null;legacy.decisions=null;legacy.savings=null;const legacySteps=copy(legacy.steps);
assert(L.state(s),'Legacy titleless steps must still open');assert.equal(typeof L.model(s).task.title,'string');
while(!L.state(s).done)require('./helpers/guided-progression.cjs').townStep(s);
assert.deepEqual(L.state(s).steps,legacySteps,'Display fallbacks must not rewrite historical step snapshots');
function refused(edit,pattern){
 const s=E.fresh();assert(L.start(s,'shop-budget'));const j=L.state(s),t=L.task(s);j.values.choice=t.answer;j.solved=true;t.effect={spend:50,savings:5,minutes:3,receipt:'Saved test receipt',add:{flour:2},list:{flour:2}};edit(j,t);
 const before=copy(s);assert(!L.next(s));assert.match(j.feedback,pattern);const after=copy(s);after.adventure.townLifeV2.runs[j.id].feedback=before.adventure.townLifeV2.runs[j.id].feedback;assert.deepEqual(after,before,'failure must change only explanatory feedback');
}
refused((j,t)=>{delete t.branches[j.values.choice];},/next step for this choice is missing/);
refused((j,t)=>{t.branches[j.values.choice]=[null];},/next step for this choice needs another look/);
refused((j,t)=>{t.branches[j.values.choice]=Array.from({length:2},()=>({prompt:'Incomplete saved step',answer:0,effect:{},venue:'home'}));},/next step for this choice needs another look/);
refused((j,t)=>{j.decisions={unsupported:true};t.effect.choice='Saved choice';},/saved decisions need another look/);
refused(j=>{j.cash=10;},/not enough pretend cash/);
refused(j=>{j.time=1439;},/end of the saved day/);
refused((j,t)=>{t.effect.consume={flour:3};},/not enough ingredients/);
refused((j,t)=>{t.effect.spend=-10;},/saved step needs another look/);
refused((j,t)=>{t.effect.add={flour:NaN};},/saved step needs another look/);
refused((j,t)=>{t.effect.minutes='3';},/saved step needs another look/);
console.log('PASS Town safety: corrupt plans/counters isolated, original recipe resume preserved, missing/malformed branches and invalid cash/time/stock/effects are atomic with useful feedback.');
