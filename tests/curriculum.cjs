'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs');
const {load,audit}=require('../scripts/audit-curriculum.cjs');
const c=load(),E=c.V3Engine,M=c.V3Adventure,X=c.V8Curriculum,A=c.V8Activities,C=c.V3Curriculum,ED=c.V6Education;
const plain=x=>JSON.parse(JSON.stringify(x));let suites=0,tasks=0;
function test(name,fn){fn();suites++;console.log('PASS: '+name);}
function solve(s){const q=M.current(s),t=q.tasks[q.i];M.begin(s);
 if(t.kind==='curriculum'){
  const a=t.activity;if(a?.kind==='place'){let left=Number(t.answer);for(const [i,weight]of a.weights.entries()){const digit=Math.min(9,Math.floor(left/weight+1e-7));assert(M.edit(s,'c8action','cell-'+i+'-'+digit));left=Number((left-digit*weight).toFixed(6));}}
  else if(!a||['readgraph','angle','numberline'].includes(a.kind))assert(M.edit(s,'c8action','input-'+t.answer));
  else if(a.kind==='plotset')for(const [i,point] of JSON.parse(t.answer).entries()){assert(M.edit(s,'c8action','active-'+i));assert(M.edit(s,'c8action','point-'+point.join(',')));}
  else if(['chart','venn','experiment','triangle','markings'].includes(a.kind)){if(a.kind==='experiment')for(let n=0;n<a.outcomes.length;n++)assert(M.edit(s,'c8action','trial'));for(const [i,n]of JSON.parse(t.answer).entries())assert(M.edit(s,'c8action','cell-'+i+'-'+n));}
  else if(a.kind==='cells')for(const n of JSON.parse(t.answer))assert(M.edit(s,'c8action','square-'+n));
  else if(['match','order'].includes(a.kind))for(const i of JSON.parse(t.answer))assert(M.edit(s,'c8action','place-'+i));
  else if(a.kind==='coordinate')assert(M.edit(s,'c8action','point-'+JSON.parse(t.answer).join(',')));
  else assert(M.edit(s,'c8action','choice-'+t.answer));
 }else if(['basket','offers','budget','blocks','array','chart','volume'].includes(t.kind))assert(M.edit(s,'parts',t.answer));
 else if(['fraction','chance'].includes(t.kind))assert(M.edit(s,'selected',Array.from({length:t.answer},(_,i)=>i)));
 else if(['order','match'].includes(t.kind))assert(M.edit(s,'order',t.answer));
 else if(t.kind==='grid')assert(M.edit(s,'selected',t.answer));
 else if(t.kind==='coordinate')assert(M.edit(s,'point',t.answer));
 else if(t.kind==='journey')assert(M.edit(s,'choice',t.answer));
 else if(t.kind==='coins'){let left=t.answer;const coins=[];for(const p of [5000,2000,1000,500,200,100,50,20,10,5,2,1])while(left>=p){coins.push(p);left-=p;}assert(M.edit(s,'coins',coins));}
 else {assert(M.edit(s,'amount',t.answer));if(t.kind==='bank')for(let n=1;n<=t.transactions.length;n++)assert(M.edit(s,'posted',n));}
 assert(M.submit(s),t.skill+': '+t.prompt);assert.equal(M.submit(s),false);tasks++;
}
test('Objective, world, skill, prerequisite, question and mission references form a valid graph',()=>{
 const report=audit();assert.equal(report.worldCount,9);assert.equal(report.missionLevelCount,222);assert.equal(report.skillCount,96);assert.equal(new Set(report.objectives.map(o=>o.id)).size,report.objectiveCount);
 const ids=new Set(C.skills.map(k=>k.id));for(const k of C.skills)for(const pre of ED.prerequisites[k.id]||[])assert(ids.has(pre),k.id+' -> '+pre);
 function walk(id,path=[]){assert(!path.includes(id),'prerequisite cycle '+path);for(const p of ED.prerequisites[id]||[])walk(p,[...path,id]);}for(const id of ids)walk(id);
 for(const p of X.packs){assert(report.missions.some(m=>m.tasks.some(t=>t.skill===p.id)));assert(C.skills.find(k=>k.id===p.id).curriculum.objectives.length,p.id);}
});
test('All 222 mission/level combinations teach, solve, persist every mini-task, complete once and safely replay',()=>{
 for(const w of E.worlds)for(const route of [...M.routes(w.id).map(r=>r.id),'gateway'])for(const tier of [1,2,3]){
  let s=E.fresh();assert(M.start(s,w.id,route,tier));let q=M.current(s);assert.equal(q.tasks.length,route==='gateway'?12:6);assert.equal(q.phase,'lesson');if(w.id==='town'&&route.startsWith('curr-'))assert.equal(q.context.role,'customer');assert.equal(M.submit(s),false);assert.equal(new Set(q.tasks.map(t=>t.prompt)).size,q.tasks.length,'No duplicate prompts inside a mission');
  const snapshot=plain(q.tasks),count=q.tasks.length;
  for(let i=0;i<count;i++){solve(s);const before=plain(M.current(s));s=E.migrate(plain(s));assert.deepEqual(plain(M.current(s)),before);assert.deepEqual(plain(M.current(s).tasks),snapshot);M.next(s,Date.UTC(2026,9,23));}
  assert.equal(s.view,'recap');assert(M.entry(s,w.id,route,tier));assert.equal(s.milestones.length,1);assert.equal(s.coins,0);assert.deepEqual(plain(s.skills),{});const xp=E.xp(s);assert(M.start(s,w.id,route,tier));for(let i=0;i<count;i++){solve(s);M.next(s);}assert.equal(E.xp(s),xp);assert.equal(s.coins,0);
 }
});
test('New hints, wrong answers and unknown routing preserve first-attempt evidence and resume the exact model',()=>{
 let s=E.fresh();M.start(s,'algebra','curr-algebra_graphs',2);M.begin(s);const task=plain(M.current(s).tasks[0]);M.edit(s,'c8action','input-999999');assert.equal(M.submit(s),false);let q=M.current(s);assert.equal(q.phase,'play');assert(q.assisted);assert(q.feedback.includes(task.teach));s=E.migrate(plain(s));assert.equal(M.current(s).values.c8.draft,'999999');M.begin(s);M.edit(s,'c8action','input-'+task.answer);assert(M.submit(s));assert.equal(M.current(s).unassisted,0);assert.equal(M.current(s).evidence[0].correct,false);M.next(s);M.begin(s);M.help(s,true);assert.equal(M.current(s).phase,'lesson');assert(M.current(s).feedback.includes('work through'));
 const prior=plain(M.current(s));M.start(s,'number','curr-written_methods',1);M.start(s,'algebra','curr-algebra_graphs',2);assert.deepEqual(plain(M.current(s)),prior);
});
test('Discovery moves up/down independently per topic without awarding mastery',()=>{
 for(const p of X.packs)for(const correct of [true,false]){const s=E.fresh();assert.equal(E.startDiscovery(s,p.id,C,c.V3Discovery),null);const old=s.discovery[p.id].band;for(let n=0;n<4;n++){E.answerLearning(s,correct?s.learning.qs[n][1]:'',!correct);E.nextLearning(s);}assert.equal(s.discovery[p.id].band,old+(correct?1:-1));assert.equal(s.skills[p.id],undefined);assert.equal(s.discovery.place,undefined);}
});
test('Every new skill supplies fresh varied practice/checks; assisted work cannot establish mastery',()=>{
 for(const p of X.packs){const s=E.fresh(),now=Date.UTC(2026,9,23);for(const pre of ED.prerequisites[p.id]||[])s.checks[pre]={stage:1};assert.equal(E.generate(s,p.id,'practice',c.JaxonFreshReview,C,now),null,p.id);const first=new Set(s.learning.qs.map(q=>q[0]));assert.equal(E.answerLearning(s,s.learning.qs[0][1]),undefined,'Teaching must precede supported practice');assert.equal(s.learning.answered,false);s.learning.started=true;s.learning.assisted=true;while(s.learning){E.answerLearning(s,s.learning.qs[s.learning.i][1]);E.nextLearning(s,now);}assert.notEqual(s.skills[p.id].state,'mastered');
  assert.equal(E.generate(s,p.id,'check',c.JaxonFreshReview,C,now),null,p.id);assert(s.learning.qs.every(q=>!first.has(q[0])),p.id);assert(new Set(s.learning.qs.map(q=>q[5].family)).size>=3,p.id+' varied check');while(s.learning){E.answerLearning(s,s.learning.qs[s.learning.i][1]);E.nextLearning(s,now);}assert.equal(s.checks[p.id].stage,1,p.id);assert.match(E.generate(s,p.id,'check',c.JaxonFreshReview,C,now),/not due/);
  const later=now+3*86400000;assert.equal(E.generate(s,p.id,'check',c.JaxonFreshReview,C,later),null,p.id);while(s.learning){E.answerLearning(s,s.learning.qs[s.learning.i][1]);E.nextLearning(s,later);}assert.equal(s.checks[p.id].stage,2,p.id+' spaced mastery');
 }
});
test('Mathematical answer keys agree with independent worked examples and equivalent numerical answers',()=>{
  // Use the printed quantities as an independent oracle, not the generator parameters.
 for(let seed=1;seed<=40;seed++){
  let r=X.rows('written_methods',6,seed)[0],v=r[0].match(/\d+/g).map(Number);assert.equal(Number(r[1]),v[0]*v[1]);
  r=X.rows('number_accuracy',8,seed)[1];v=r[0].match(/\d+/g).map(Number);assert.equal(Number(r[1]),v[0]-.5);
  r=X.rows('measure_composite',8,seed)[0];v=r[0].match(/\d+/g).map(Number);assert.equal(Number(r[1]),(v[0]+v[1])/2*v[2]);
  r=X.rows('geometry_pythagoras',9,seed)[0];v=r[0].match(/\d+/g).map(Number);assert.equal(Number(r[1])**2,v[0]**2+v[1]**2);
  r=X.rows('ratio_inverse',8,seed)[1];v=r[0].match(/\d+/g).map(Number);assert.equal(Number(r[1]),v[0]*v[1]/v[2]);
 }
 const s=E.fresh();s.learning={id:'fraction_reasoning',mode:'practice',started:true,qs:[['Fraction','0.333333',[],'hint','worked',{contentVersion:8}]],i:0,correct:0,assisted:false};assert(E.answerLearning(s,'1/3'));
});
test('Fictional legacy saves, 3-task snapshots, old mastery and queued unknown fields retain their meaning',()=>{
 const old=E.fresh();M.start(old,'number','0',1);old.adventure.active.tasks=old.adventure.active.tasks.slice(0,3);delete old.adventure.active.contentVersion;old.adventure.active.i=2;old.adventure.active.tasks[2].prompt='Saved historical wording';old.pendingFictional={requestId:'fixture',progress:{unknown:'retain'}};old.skills.place={state:'mastered',reviewStage:2};const expected=plain(old);const migrated=E.migrate(old);assert.deepEqual(plain(migrated.adventure.active),expected.adventure.active);assert.deepEqual(plain(migrated.pendingFictional),expected.pendingFictional);assert.deepEqual(plain(migrated.skills),expected.skills);assert.deepEqual(plain(old),expected);
 for(const file of ['tests/fixtures/town-v2-before-quality.json','tests/fixtures/town-v3-published-before-major.json']){const fixture=JSON.parse(fs.readFileSync(file));const before=JSON.stringify(fixture);E.migrate(fixture);assert.equal(JSON.stringify(fixture),before);}
});
test('Reasoning answer positions vary; symbolic ordering and inverse checks retain their mathematical meaning',()=>{
 const positions=new Set(),orders=new Set();for(let seed=1;seed<=30;seed++){
  const q=X.rows('number_sets',7,seed)[5],a=q[5].activity;positions.add(q[1]);assert.equal(a.labels[Number(q[1])],'2');
  const r=X.rows('written_methods',7,seed)[4],items=JSON.parse(r[1]).map(i=>r[5].activity.items[i]);assert.match(items[0],/Divide/);assert.match(items[1],/Multiply/);orders.add(r[1]);
 }assert(positions.size>1);assert(orders.size>1);
});
test('Cube nets, equivalent fraction shading, ASA constructions and scientific tools use valid mathematical contracts',()=>{
 assert(A.matches({answer:'8000000'},'8,000,000'));assert.equal(A.matches({answer:'8000000'},'8000000.01'),false);
 assert(A.cubeNet([2,7,11,12,13,17]));assert(A.cubeNet([3,8,12,13,14,18]));assert.equal(A.cubeNet([0,1,2,5,6,7]),false);
 const fraction=X.task('fraction_reasoning',9,1,4);assert(A.matches(fraction,JSON.stringify([1,3,5])));assert.equal(A.matches(fraction,JSON.stringify([1,1,5])),false);
 const triangle=X.task('geometry_design',9,4,4);assert.equal(triangle.activity.kind,'triangle');assert(A.matches(triangle,triangle.answer));const model={c8:{cells:[4,120,30]}};assert(!/NaN|Infinity/.test(A.render(triangle,model)));
 const methods=X.packs.find(p=>p.id==='number_precision').build(123,4);assert.equal(methods[1].answer,4.92);assert.equal(methods[2].answer,1.23);
 const values={},t={activity:null,allowCalculator:true,answer:'0.5'};assert(A.edit(t,values,'calc-input-30'));assert(A.edit(t,values,'calc-op-sin'));assert.equal(values.c8.calcResult,'0.5');assert.equal(A.value(t,values),'');assert.equal(A.correct(t,values),false,'Calculating cannot auto-submit a correct answer');assert(A.edit(t,values,'calc-input-2'));assert(A.edit(t,values,'calc-op-asin'));assert.match(values.c8.calcResult,/domain/);
 const prec=X.task('number_precision',9,1,2);assert.equal(prec.activity.kind,'numberline');assert(A.matches(prec,'1.41'));assert.equal(A.matches(prec,'1.5'),false);
});
test('Higher-band banks retain fresh mathematical families and graph estimates agree with the drawn segments',()=>{
 function interpolate(points,x){for(let i=1;i<points.length;i++){const [x0,y0]=points[i-1],[x1,y1]=points[i];if(x>=x0&&x<=x1)return y0+(x-x0)/(x1-x0)*(y1-y0);}throw Error('Outside graph range');}
 for(const p of X.packs)for(const band of [6,8,9]){const exclude=new Set();for(let round=1;round<=3;round++){const qs=X.create(p.id,band,round,{exclude});assert.equal(qs.length,6,p.id);assert(new Set(qs.map(q=>q[5].family)).size>=3,p.id);for(const q of qs){assert(!exclude.has(q[0]));exclude.add(q[0]);}}}
 for(let seed=1;seed<=30;seed++){
  const qs=X.rows('algebra_graphs',9,seed);for(const i of [0,1]){const q=qs[i],xs=[...q[0].matchAll(/x = ([-+]?[0-9]+(?:\.[0-9]+)?)/g)],x=Number(xs.at(-1)[1]);assert(Math.abs(Number(q[1])-interpolate(q[5].activity.series[0],x))<1e-6);}
  const q=qs[2],y=Number(q[0].match(/y = ([0-9.]+)\./)[1]);assert(Math.abs(Number(q[1])-interpolate(q[5].activity.series[0].map(([x,y])=>[y,x]),y))<1e-6);
  const form=X.rows('number_standard',8,seed)[0];const coef=Number(form[0].match(/Write ([0-9.]+)/)[1]);assert(coef>=1&&coef<10);assert.equal(Number(form[1]),Math.round(coef*10000));
 }
});
test('Fresh independent checks exclude questions and worked examples already encountered in guided missions',()=>{
 const s=E.fresh(),id='written_methods';s.practice[id]={completed:true};for(const pre of ED.prerequisites[id])s.checks[pre]={stage:1};s.discovery[id]={band:7,complete:true,answers:[],rounds:[{band:7,correct:2,total:4}]};
 M.start(s,'number','curr-'+id,2);const t=M.current(s).tasks[0];M.begin(s);assert(s.seen.includes(t.prompt));assert(s.seen.includes(t.examplePrompt));assert.equal(E.generate(s,id,'check',c.JaxonFreshReview,C),null);assert(s.learning.qs.every(q=>q[0]!==t.prompt&&q[0]!==t.examplePrompt));
});
test('All mission snapshots can be paused together with additional fictional history inside the existing save limit',()=>{
 let s=E.fresh();for(const w of E.worlds)for(const route of [...M.routes(w.id).map(r=>r.id),'gateway'])for(const tier of [1,2,3])M.start(s,w.id,route,tier);
 assert.equal(Object.keys(s.adventure.suspended).length,221);assert(s.adventure.active);s.fictionalHistoryReserve='x'.repeat(300000);const bytes=Buffer.byteLength(JSON.stringify(s));assert(bytes<2000000,'Content snapshot growth needs review before exceeding the existing server limit');const copy=E.migrate(plain(s));assert.equal(Object.keys(copy.adventure.suspended).length,221);assert.equal(copy.fictionalHistoryReserve.length,300000);assert.deepEqual(plain(copy.adventure.active),plain(s.adventure.active));
});
console.log(`PASS: ${suites} curriculum suites; ${tasks} task completions with fictional fixtures.`);
module.exports={solve};
