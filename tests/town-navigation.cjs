const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const c=require('../scripts/audit-curriculum.cjs').load();vm.runInContext(fs.readFileSync('v3/starting-profile.js','utf8'),c);
const M=c.V3Adventure,N=require('../v3/activity-navigation').V10Navigation;
const fresh=()=>{const s=c.V3Engine.fresh();s.startingProfile=require('./helpers/starting-profile.cjs').completed();s.customFuture={preserve:true};s.coins=731;s.bought=['cap'];return s;};
let tasks=0;
for(const r of [...M.routes('town'),{id:'gateway'}])for(const tier of [1,2,3])for(const seed of [1,2,3]){
 const s=fresh();M.state(s).attempts[M.id('town',r.id,tier)]=seed-1;const protectedBefore=JSON.stringify([s.skills,s.checks,s.discovery,s.coins,s.bought,s.customFuture]);
 assert(M.visit(s,'town',r.id,tier).available);assert.equal(M.current(s).tier,tier);assert.equal(JSON.stringify([s.skills,s.checks,s.discovery,s.coins,s.bought,s.customFuture]),protectedBefore,'Navigation must not award or erase evidence');
 while(M.current(s)){require('./helpers/mission-solver.cjs').solve(s,c);tasks++;M.next(s);}
 const record=JSON.stringify(s.adventure.records[M.id('town',r.id,tier)]);assert(M.visit(s,'town',r.id,tier).available);assert.equal(M.current(s).i,0);assert.equal(JSON.stringify(s.adventure.records[M.id('town',r.id,tier)]),record);
 M.begin(s);M.current(s).values.draftFuture='keep';const snapshot=JSON.stringify(M.current(s));assert(M.visit(s,'town',r.id,tier).available);assert.equal(JSON.stringify(M.current(s)),snapshot);
}
const locked=fresh();delete locked.startingProfile.areas.number;delete locked.startingProfile.areas.town;const bytes=JSON.stringify(locked);const gate=M.visit(locked,'town','bank',1);assert.deepEqual(Array.from(gate.missing),['number','town']);assert(!gate.available);assert.equal(JSON.stringify(locked),bytes);
assert(!M.visit(fresh(),'town','missing',1).available);assert.equal(M.visitStatus(fresh(),'town','market',4).alternativeTier,1);
const fail=fresh(),before=JSON.stringify(fail),task=c.V8Curriculum.task;c.V8Curriculum.task=()=>{throw Error('fictional unavailable content');};assert(!M.visit(fail,'town','market',2).available);assert.equal(JSON.stringify(fail),before);c.V8Curriculum.task=task;
// Explicit selection changes only the transient Continue target, not saved work.
const resume=fresh();require('../v3/town-life').V52TownLife.start(resume,'travel-library',1);const old=JSON.stringify(resume.adventure.townLifeV2);resume.pausedActivity={kind:'town',key:resume.adventure.townLifeV2.active,world:'town'};assert(M.visit(resume,'town','market',1).available);assert.equal(resume.pausedActivity,null);assert.equal(JSON.stringify(resume.adventure.townLifeV2),old);
resume.view='home';N.resume(resume);assert.equal(resume.view,'adventure');assert.equal(M.current(resume).route,'market');assert.equal(JSON.stringify(resume.adventure.townLifeV2),old);
console.log(`PASS all 30 Town destination/level combinations across 3 seeds; ${tasks} tasks solved, exact resume/replay, locked requirements, atomic failures and unrelated progress preservation.`);
