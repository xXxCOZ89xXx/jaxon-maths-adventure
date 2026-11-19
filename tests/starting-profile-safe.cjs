'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),{load}=require('../scripts/audit-curriculum.cjs');
// Parse the complete application too: a truncated source file must never pass logic-only checks.
new vm.Script(fs.readFileSync('v3/app.js','utf8'),{filename:'v3/app.js'});
const c=load();for(const p of ['v3/touch-content.js','v3/starting-profile.js'])vm.runInContext(fs.readFileSync(p,'utf8'),c,{filename:p});
const {V11StartingProfile:P,V3Engine:E,V3Curriculum:C}=c,unsafe=[
 ['Move the marker to the sum.','4',[],null,null,{direct:{kind:'line'}}],
 ['Build 3/5 + 3/5 using equal fraction pieces.','6/5',[],null,null,{contentVersion:8,activity:{kind:'fraction'}}],
 ['Measure wooden strip I in centimetres. Align the ruler zero with its end.','5',[],null,null,{direct:{kind:'ruler'}}],
 ['Sort these values into the groups.','3',[],null,null,{contentVersion:8,activity:{kind:'order'}}],
 ['Drag the ruler to the line.','3',[],null,null,{direct:{kind:'ruler'}}]
];
for(const row of unsafe)assert.equal(P.startingSafe(row),false,row[0]);
let checked=0;
for(const id of Object.keys(P.areas))for(const year of P.years(C,id))for(let seed=1;seed<=3;seed++){
 const s=E.fresh(),now=100000000+seed*100003+year*1009;assert.equal(P.start(s,id,C,now,year),null,`${id} Year ${year}`);
 for(let i=0;i<P.length(s.startingProfile.areas[id]);i++){
  const q=P.question(s,id);assert(q&&q.prompt,`${id} ${year} ${seed} question ${i}`);assert(P.startingSafe([q.prompt,q.answer,q.choices]),`${id} ${year} tool prompt: ${q.prompt}`);assert.equal(q.choices.length,4,'Each starting question uses choices; typed input is reserved for no-choice questions');assert(q.choices.includes(q.answer),'The canonical answer must be one of the displayed choices: '+q.prompt);
  assert(!/\b(?:drag|move the marker|move marker|move the point|plot the point|build .{0,50} using|measure .{0,40} strip|align the ruler|ruler's zero|sort (?:the )?)\b/i.test(q.prompt),q.prompt);
  assert(P.answer(s,id,q.answer,false,now+i));assert(P.advance(s,id,C,now+i));checked++;
 }
 assert(P.valid(s.startingProfile.areas[id]));
}
// An excluded prompt already present in an old paused assessment remains
// exactly resumable; after it is answered, subsequent new prompts are safe.
const saved=E.fresh(),now=100000123;assert.equal(P.start(saved,'number',C,now,5),null);const previous={...saved.startingProfile.areas.number.question,prompt:'Build 3/5 + 3/5 using equal fraction pieces.',choices:['1','2','3','4'],legacyField:'keep'};saved.startingProfile.areas.number.question=previous;
assert.equal(P.start(saved,'number',C,now+1),null);assert.deepEqual(JSON.parse(JSON.stringify(P.question(saved,'number'))),previous);assert(P.answer(saved,'number',previous.answer,false,now+2));assert(P.advance(saved,'number',C,now+2));assert(P.startingSafe([P.question(saved,'number').prompt,P.question(saved,'number').answer,P.question(saved,'number').choices]));
console.log(`PASS: ${checked} generated starting-check questions across every area, supported year and three seeds; direct/constructed wording excluded and saved paused questions preserved.`);
