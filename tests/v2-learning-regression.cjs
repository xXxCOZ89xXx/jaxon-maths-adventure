/* Run from the repository root: node tests/v2-learning-regression.cjs
   Offline educational regression checks. No Supabase credentials or learner data used. */
'use strict';
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const get=(name)=>fs.readFileSync(path.join(root,name),'utf8');
const html=get('v2-game-test.html');
const appMatch=html.match(/<script>([\s\S]*?)<\/script>/);
assert.ok(appMatch,'Inline game script present');
new vm.Script(appMatch[1],{filename:'v2-game-test.html'});
function loadModule(file,name){
  const context={window:{}};
  vm.runInNewContext(get(file),context,{filename:file});
  assert.ok(context.window[name],name+' module missing');
  return context.window[name];
}
const tutor=loadModule('v2-guided-teaching.js','JaxonTutor');
const review=loadModule('v2-review-bank.js','JaxonFreshReview');
const skills=vm.runInNewContext(html.slice(html.indexOf('const skills=['),html.indexOf('const diagnostic='))+';skills');
const discovery=vm.runInNewContext(html.slice(html.indexOf('const discoveryBank={'),html.indexOf('function discoveryData()'))+';discoveryBank');
assert.equal(skills.length,tutor.supportedSkills.length,'Teaching for all missions');
assert.equal(skills.length,review.supportedSkills.length,'Reviews for all missions');
assert.equal(tutor.validate().issues.length,0,'Teaching choices must be valid');
let questionCount=0;
for(const skill of skills){
 assert.ok(tutor.supportedSkills.includes(skill.id),'Missing teaching '+skill.id);
 assert.ok(review.supportedSkills.includes(skill.id),'Missing review '+skill.id);
 for(const q of skill.qs){
  assert.equal(new Set(q[2]).size,4,'Four distinct mission options: '+skill.id);
  assert.ok(q[2].some(choice=>String(choice).replace(/−/g,'-')===String(q[1]).replace(/−/g,'-')),'Mission answer key '+skill.id);
 }
 for(let year=5;year<=9;year++){
  assert.equal(discovery[skill.id]?.[year]?.length,4,'Discovery bank '+skill.id+' '+year);
  for(let round=1;round<=8;round++){
   const reviewQs=review.create(skill.id,year,round);
   assert.equal(reviewQs.length,3,'Review length');
   for(const q of reviewQs){
    assert.equal(new Set(q[2]).size,4,'Four distinct review answers');
    assert.ok(q[2].includes(q[1]),'Review answer key');
    assert.ok(q[3]&&q[4],'Review hints and worked examples');
    questionCount++;
   }
  }
 }
 const plan=tutor.plan(skill.id,[{q:skill.qs[0][0],correct:false}]);
 assert.ok(plan,'Missing guided lesson '+skill.id);
 assert.equal(plan.choices.length,4,'Four scaffold answers');
 assert.ok(plan.choices.includes(plan.answer),'Guided example answer key');
}
function slice(a,b){const i=html.indexOf(a),j=html.indexOf(b,i);assert.ok(i>=0&&j>i,'Missing game code boundary: '+a);return html.slice(i,j)}
const startFunctions=slice('function reviewDue(','function question(){');
const finishFunction=slice('function finishIfDone()','function fractionModel()');
let missionChecks=0;
for(const skill of skills){
 const ctx={
  skills:[skill],window:{JaxonFreshReview:review},s:{skills:{},discovery:{},recent:[],coins:0},
  v2Role:'learner',pending:null,Date,
  percent(n,d){return Math.round(n/d*100);},
  save(){},render(){}
 };
 ctx.status=(id)=>ctx.s.skills[id]||{};
 vm.runInNewContext(startFunctions+finishFunction,ctx);
 ctx.s.discovery[skill.id]={rounds:[{band:7,score:2}],answers:[]};
 ctx.startMission(skill.id);
 assert.equal(ctx.s.session.qs,null,'Initial mission keeps authored questions');
 ctx.s.session.i=3;ctx.s.session.correct=3;ctx.s.session.firstTry=3;ctx.finishIfDone();
 ctx.startMission(skill.id);
 assert.equal(ctx.s.session.qs?.length,3,'Repeat mission must use fresh questions');
 const first=ctx.s.session.qs.map(q=>q[0]);
 assert.ok(first.every(prompt=>!skill.qs.some(q=>q[0]===prompt)),'Repeat mission duplicates authored question');
 ctx.s.session.i=3;ctx.s.session.correct=3;ctx.s.session.firstTry=3;ctx.finishIfDone();
 ctx.startMission(skill.id);
 const second=ctx.s.session.qs.map(q=>q[0]);
 assert.ok(second.every(prompt=>!first.includes(prompt)),'Repeat mission duplicates earlier practice');
 ctx.s.session.i=3;ctx.s.session.correct=3;ctx.s.session.firstTry=3;ctx.finishIfDone();
 ctx.startIndependentCheck(skill.id);
 assert.equal(ctx.s.session?.type,'review','Independent review is available');
 assert.ok(ctx.s.session.qs.every(q=>!first.includes(q.q[0])&&!second.includes(q.q[0])),'Review must differ from repeat practice');
 missionChecks++;
}

const basicMaths=loadModule('v2-maths-tools.js','JaxonMathTools');
const extraMaths=loadModule('v2-extra-tools.js','JaxonMathToolsExtra');
let visualSkills=0;
for(const skill of skills){
 const basic=basicMaths.supports(skill.id,skill.world);
 const extra=extraMaths.supports(skill.id,skill.world);
 if(basic.length+extra.length)visualSkills++;
 for(const mode of ['lesson','teaching','question','hint']){
  const learner={type:'mission',mode,firstTry:2,coins:99,correct:1};
  const old={firstTry:learner.firstTry,coins:learner.coins,correct:learner.correct};
  const output=basicMaths.render(skill.id,skill.world,learner)+extraMaths.render(skill.id,skill.world,learner);
  if(basic.length+extra.length)assert.ok(output.includes('data-act='),'Visual aid should be interactive: '+skill.id);
  for(const field of Object.keys(old))assert.equal(learner[field],old[field],'Rendering must never affect scores or coins');
 }
 assert.equal(basicMaths.render(skill.id,skill.world,{type:'review',mode:'question'}),'','No aids during independent checks');
 assert.equal(extraMaths.render(skill.id,skill.world,{type:'review',mode:'question'}),'','No extra aids during checks');
}
const state={type:'mission',mode:'question',coins:40,firstTry:1,correct:1};
for(const [tool,action] of [
 [basicMaths,'math:den:1'],[basicMaths,'math:frac:4'],[basicMaths,'math:line:-3'],
 [basicMaths,'math:coord:2:-1'],[basicMaths,'math:ratio:g1'],
 [basicMaths,'math:clock:15'],[basicMaths,'math:percent:40'],
 [extraMaths,'mathx:digit:0'],[extraMaths,'mathx:rows:1'],
 [extraMaths,'mathx:cols:-1'],[extraMaths,'mathx:angle:15'],
 [extraMaths,'mathx:coin:50']
])assert.equal(tool.update(state,action),true,'Tool action failed '+action);
assert.equal(state.coins,40,'Maths tools must not change rewards');
assert.equal(state.firstTry,1,'Maths tools must not alter first-try score');
assert.equal(state.correct,1,'Maths tools must not mark answers');
for(const [tool,action] of [
 [basicMaths,'math:coord:999:0'],[basicMaths,'math:percent:105'],
 [extraMaths,'mathx:digit:9'],[extraMaths,'mathx:coin:999']
])assert.equal(tool.update(state,action),false,'Invalid tool action accepted: '+action);
console.log('PASS: '+skills.length+' skills, '+questionCount+' generated review questions, '+missionChecks+' repeat-practice flows, '+visualSkills+' skills with safe touch tools.');

