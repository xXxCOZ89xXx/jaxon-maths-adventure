'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),{load}=require('../scripts/audit-curriculum.cjs');
const c=load();for(const f of ['v3/town-content.js','v3/town-life.js'])vm.runInContext(fs.readFileSync(f,'utf8'),c);vm.runInContext(fs.readFileSync('v3/starting-profile.js','utf8'),c);
const {V11StartingProfile:P,V3Engine:E,V3Curriculum:C,V10Restoration:R,V3Adventure:M,V52TownLife:L}=c;
const copy=x=>JSON.parse(JSON.stringify(x)),at=1794916800000;
function answer(s,id,correct=true){const q=P.question(s,id);assert(P.answer(s,id,q.answer,!correct,at+s.startingProfile.areas[id].responses.length));assert(P.advance(s,id,C,at+s.startingProfile.areas[id].responses.length));}
function finish(s,id){while(!P.valid(s.startingProfile.areas[id]))answer(s,id);}
let count=0;
for(const id of Object.keys(P.areas))for(const year of P.years(C,id))for(const correct of [true,false]){
 const s=E.fresh(),before=copy({skills:s.skills,checks:s.checks,coins:s.coins,milestones:s.milestones});assert.equal(P.start(s,id,C,at,year),null);const a=s.startingProfile.areas[id];assert.equal(P.length(a),8);
 for(let i=0;i<8;i++)answer(s,id,correct);
 assert(P.valid(a));assert(P.unlocked(s));assert.equal(a.estimate.total,8);assert.equal(a.estimate.enoughEvidence,correct);assert.equal(a.responses.length,8);assert(!P.answer(s,id,'1'));assert.deepEqual(copy({skills:s.skills,checks:s.checks,coins:s.coins,milestones:s.milestones}),before);count++;
}
let s=E.fresh();P.start(s,'number',C,at,5);answer(s,'number');assert.equal(P.question(s,'number').band,5);answer(s,'number');assert.equal(P.question(s,'number').band,6);finish(s,'number');
assert(!P.complete(s));assert(P.unlocked(s));for(const action of ['learn:negative','mission:town:market:1','j-plan:cook-pasta'])assert(P.allowed(s,action));
assert.equal(E.generate(s,'negative','practice',c.JaxonFreshReview,C),null);assert(M.start(s,'town','market',1));assert(L.start(s,'travel-library',1));
assert.equal(c.V5Adaptive.skill(s,'fractions').band,c.V6Education.minBand('fractions'),'Unassessed areas retain the gentle default');
const completed=s.startingProfile.areas.number.completedAt;assert(P.recent(s,'number',completed+14*86400000-1));assert(!P.recent(s,'number',completed+14*86400000));assert(!P.recent(s,'number',completed-1));
// Date boundary affects only the per-skill discovery gate, never historical evidence.
const OriginalDate=vm.runInContext('Date',c);c.Date={now:()=>completed+14*86400000-1};assert(R.gate(s,'number',0).ready);c.Date={now:()=>completed+14*86400000};assert(!R.gate(s,'number',0).ready);c.Date=OriginalDate;
// Existing version-2 check paused on question 9 stays a 15-question check.
s=E.fresh();P.start(s,'number',C,at,5);s.startingProfile.areas.number.assessmentVersion=2;for(let i=0;i<8;i++)answer(s,'number');const paused=copy(s.startingProfile);s=copy(s);P.start(s,'number',C,at+100);assert.deepEqual(copy(s.startingProfile),paused);finish(s,'number');assert.equal(s.startingProfile.areas.number.responses.length,15);
// A complete old profile is unchanged. A retake keeps its prior estimate and play access.
s=E.fresh();s.startingProfile=copy(require('./fixtures/starting-profile-v1.json').completed);const old=copy(s.startingProfile);assert(P.complete(s));assert(P.unlocked(s));for(const id of Object.keys(P.areas))P.start(s,id,C,at);assert.deepEqual(copy(s.startingProfile),old);P.chooseYear(s,'number',5,C,true);P.retake(s,'number',C,at);assert.equal(P.length(s.startingProfile.areas.number),8);assert(P.unlocked(s));assert.deepEqual(copy(P.latest(s,'number')),old.areas.number);
console.log(`PASS ${count} short checks, two-answer streak, one-area lesson/mission/Town admission, gentle defaults, exact 14-day boundary, 15-question resume and legacy/retake preservation.`);

// Every completed fifteen-question area remains byte-for-byte valid and visible.
const full=E.fresh();for(const id of Object.keys(P.areas)){P.start(full,id,C,at,5);full.startingProfile.areas[id].assessmentVersion=2;finish(full,id);}const original=copy(full.startingProfile);assert(P.complete(full));for(const id of Object.keys(P.areas))P.start(full,id,C,at);assert.deepEqual(copy(full.startingProfile),original);assert(P.rows(full).every(r=>r.limit===15));
