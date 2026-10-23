'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs');
const {profile,names,E,C}=require('./helpers/profiles.cjs');
const AD=require('../v3/adaptive').V5Adaptive,H=require('../v3/hands-on').V5HandsOn;
assert.equal(C.skills.length,55);assert.equal(E.worlds.length,9);
for(const name of Object.keys(names)) {
  const original=profile(name),copy=profile(name);
  assert.deepEqual(original,copy);assert.deepEqual(E.migrate(E.migrate(original)),E.migrate(original));
  original.coins=99;assert.equal(copy.coins,0);
  if(name==='new') {assert.deepEqual(copy.checks,{});assert.deepEqual(copy.discovery,{});}
}
for(const k of C.skills) {
  assert.equal(AD.skill(profile('foundation'),k.id).band,require('../v3/education').V6Education.minBand(k.id));
  assert.equal(AD.skill(profile('advanced'),k.id).tier,3);
}
assert.ok(new Set(C.skills.map(k=>AD.skill(profile('developing'),k.id).tier)).size>1);
// Test identities stay outside both builder dependency graphs and shipped application sources.
for(const file of ['scripts/build-v3-staging.cjs','scripts/build-v3-preview.cjs',...fs.readdirSync('v3').filter(n=>n.endsWith('.js')).map(n=>'v3/'+n)]) {
  assert.doesNotMatch(fs.readFileSync(file,'utf8'),/helpers\/(?:identities|profiles|cloud-server)|fixture-session:|installSession/);
}
assert.equal(H.invalidDraft({clockDraft:''},{min:0,max:1439}),true);
assert.equal(H.invalidDraft({clockDraft:'23:59'},{min:0,max:1439}),false);
assert.equal(H.invalidDraft({clockDraft:'24:00'},{min:0,max:1439}),true);
const discovery=require('../v3/discovery').V3Discovery;
for(const k of C.skills) {
  for(const name of ['foundation','developing','advanced']) assert.match(E.startDiscovery(profile(name),k.id,C,discovery),/already found/);
  const s=profile('new');assert.equal(E.startDiscovery(s,k.id,C,discovery),null);
  for(let n=0;n<4;n++) {E.answerLearning(s,s.learning.qs[s.learning.i][1]);E.nextLearning(s);}
  assert.equal(s.discovery[k.id].rounds.length,1);assert.equal(s.discovery[k.id].answers.length,4);
  assert.equal(s.skills[k.id]?.state,undefined);assert.equal(s.checks[k.id]?.stage,undefined);
}
console.log('PASS V5.1 fictional profiles: 55 skills, nine worlds, adaptive gaps/strengths, deterministic independent resets, no application test-auth hooks, clock draft validation.');
