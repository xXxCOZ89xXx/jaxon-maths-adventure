// Fictional snapshots only; no storage, accounts or service access.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const c=require('../scripts/audit-curriculum.cjs').load(),N=c.V10Navigation,M=c.V3Adventure;
c.V5Journey=require('../v3/journey').V5Journey;c.V52TownLife=require('../v3/town-life').V52TownLife;c.V11StartingProfile=require('../v3/starting-profile').V11StartingProfile;
c.V3Art={esc:String};c.V7WorldArt={};c.V3AdventureUI={controls(){}};
vm.runInContext(fs.readFileSync('v3/home-activities.js','utf8'),c);
const H=c.V7Home,copy=x=>JSON.parse(JSON.stringify(x)),fresh=()=>require('./helpers/starting-profile.cjs').ready(c.V3Engine.fresh());
const immutable=s=>copy({coins:s.coins,bought:s.bought,equipped:s.equipped,skills:s.skills,checks:s.checks,startingProfile:s.startingProfile,records:M.state(s).records,milestones:s.milestones});
const equal=(a,b)=>assert.deepStrictEqual(copy(a),copy(b));
let cases=0;
for(const from of H.kinds)for(const to of H.kinds.filter(k=>k!==from))for(const legacy of [false,true]){
 let s=fresh();H.start(s,from,2);M.begin(s);let q=M.current(s);q.values={amount:17,amountDraft:'17',picked:1};q.feedback='Saved feedback';q.hintLevel=2;
 if(legacy)q.key=M.id('town','home',2);
 const old=copy(q),before=immutable(s);N.pause(s);H.start(s,to,1);
 assert.equal(M.current(s).context.homeActivity,to);assert.notEqual(M.current(s).key,old.key);assert.equal(s.pausedActivity,undefined);equal(M.state(s).suspended[old.key],old);equal(immutable(s),before);
 N.pause(s);s=copy(s);N.resume(s);assert.equal(M.current(s).context.homeActivity,to);
 assert.equal(N.openSaved(s,'mission',old.key),null);equal(M.current(s),old);
 H.start(s,to);assert.equal(M.current(s).context.homeActivity,to);
 H.start(s,from);equal(M.current(s),old);cases++;
}
// Historical generic Home and unrelated activities remain available, byte for byte.
for(const route of ['home','market']){
 const s=fresh();M.start(s,'town',route,2);M.begin(s);M.current(s).values.amount=27;
 const old=copy(M.current(s));H.start(s,'post');assert.equal(M.current(s).context.homeActivity,'post');equal(M.state(s).suspended[old.key],old);N.openSaved(s,'mission',old.key);equal(M.current(s),old);cases++;
}
// Completing each kind never erases an earlier Home completion or another paused run.
for(const kind of H.kinds){const s=fresh();H.start(s,kind);const key=M.current(s).key;
 while(M.current(s)){const q=M.current(s);q.solved=true;M.next(s);}
 const before=immutable(s);assert(M.state(s).records[key]);
 for(const other of H.kinds.filter(k=>k!==kind)){H.start(s,other);assert.equal(M.current(s).context.homeActivity,other);equal(immutable(s),before);}
 H.start(s,kind);assert.equal(M.current(s).seed,2);equal(immutable(s),before);cases++;
}
assert.equal(H.start(fresh(),'not-a-home-activity'),false);
for(const kind of H.kinds){let s=fresh();H.start(s,kind);require('./helpers/mission-solver.cjs').solve(s,c);M.next(s);const old=copy(M.current(s));assert.equal(old.i,1);for(const other of H.kinds.filter(k=>k!==kind)){H.start(s,other);N.pause(s);s=copy(s);assert.equal(N.openSaved(s,'mission',old.key),null);equal(M.current(s),old);}cases++;}
for(const kind of H.kinds){const s=fresh();H.start(s,kind);M.begin(s);M.current(s).values.amount=17;const old=copy(M.current(s));assert.equal(N.recover(s,N.target(s),'restart'),null);assert.equal(M.current(s).context.homeActivity,kind);equal(M.current(s).values,{});equal(s.activityArchives[0].snapshot,old);cases++;}
console.log(`PASS ${cases} Home transition, legacy snapshot, exact resume, unrelated-state and completion cases.`);
