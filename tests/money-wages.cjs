'use strict';
// Fictional, offline fixtures only. No learner records or network.
const assert=require('node:assert/strict');
const {load}=require('../scripts/audit-curriculum.cjs');
const c=load(),T=c.V3Town,E=c.V3Engine,H=c.V5HandsOn;
const {V52TownLife:L}=require('../v3/town-life');
let questions=0;
for(let band=3;band<=9;band++)for(let seed=1;seed<=16;seed++)for(let f=0;f<6;f++)for(const id of ['town_money','town_totals']){
 const q=c.V7EducationDepth.question(id,band,seed,f),unit=q[5].unit;
 assert(q[2].includes(q[1]));assert.equal(new Set(q[2]).size,4);
 assert(['pounds','pence'].includes(unit));
 if(id==='town_totals'){assert.equal(unit,'pounds');assert(!/\d{4,}p/.test(q[0]));}
 assert.match(T.answerLabel(q,q[1]),unit==='pounds'?/^£\d+\.\d{2}$/:/p$/);
 const spec=H.practiceSpec({id},q);assert(spec);assert.equal(spec.scale,unit==='pounds'?100:1);
 const n=H.numericValue(T.answerLabel(q,q[1]),spec,spec.scale);assert.equal(n,Math.round(Number(q[1])*spec.scale));
 for(const answer of [q[1],T.answerLabel(q,q[1])]){
  const s=E.fresh();s.learning={id,mode:'practice',started:true,qs:[q],i:0,correct:0};assert.equal(E.answerLearning(s,answer),true);
 }
 questions++;
}
for(let band=5;band<=9;band++)for(let r=1;r<30;r++)for(let i=0;i<3;i++)for(const id of ['town_money','town_totals']){
 const q=T.question(id,band,r,i);assert(Number.isFinite(Number(q[1])));assert(q[2].includes(q[1]));
 if(id==='town_totals'){assert.equal(q[5].unit,'pounds');const a=[...q[0].matchAll(/£(\d+\.\d{2})/g)].map(m=>Math.round(Number(m[1])*100));assert(a[0]<=2000);assert.equal(Math.round(Number(q[1])*100),a[0]-a[1]-a[2]);}
}
const Direct=require('../v3/touch-content').V9TouchContent;
for(let band=3;band<=9;band++)for(let seed=1;seed<=30;seed++){
 const q=Direct.row('town_totals',band,seed),a=q[5].direct;
 assert.match(q[0],/total of £[0-9]+\.[0-9]{2}/);assert.match(q[4],/Apples £/);
 assert.equal(Number(q[1]),a.items[0].price+a.items[2].price);
}
assert.equal(T.isWageTask(null),false);const oldGuidance={unit:'p',example:'Three groups of 2 items contain 6 items.'};assert.match(T.taskDetails(oldGuidance).example,/£5/);assert.equal(oldGuidance.example,'Three groups of 2 items contain 6 items.');
const P=require('../v3/starting-profile').V11StartingProfile;
for(const prompt of ['Convert 250p to pounds.','Count five 10p coins. Total in pence?']){
 const unit=T.moneyUnit(prompt),state={startingProfile:{active:'town',areas:{town:{question:{prompt,answer:unit==='pounds'?'2.5':'50'},responses:[]}}}};
 const wrongUnit=unit==='pounds'?'250p':'£0.50';assert.equal(P.answer(state,'town',wrongUnit),false);assert.equal(state.startingProfile.areas.town.responses.length,0);
 assert.match(state.startingProfile.areas.town.validation,/£1 = 100p/);
 assert.equal(P.answer(state,'town',unit==='pounds'?'£2.50':'50p'),true);assert.equal(state.startingProfile.areas.town.responses[0].correct,true);
}

assert.equal(H.numericValue('450p',{unit:'p',min:0,max:100000},100),null);
assert.equal(H.numericValue('£4.50',{unit:'p',min:0,max:100000},1),null);
assert.match(H.numericMessage({unit:'p'},100),/not 450p/);
// Independent expected result from HMRC 2026/27 Tables A and B manual method,
// not a second call to the implementation. Tables A p57: 214.92 + 2*416.67.
const p=T.educationalPayslip();
assert.equal(p.gross,206538);assert.equal(p.qualifying,154538);
assert.equal(p.pension,7727);assert.equal(p.employerPension,4636);
assert.equal(p.freePay,104826);assert.equal(p.taxable,939);
assert.equal(p.tax,18780);assert.equal(p.ni,8139);assert.equal(p.net,171892);
assert.equal(p.net+p.tax+p.ni+p.pension,p.gross);
assert.match(T.payslipPanel(),/not deducted from net pay/);
// Token placement/return, over-allocation prevention, totals, save/resume and ledger effects.
let s=E.fresh();assert(L.start(s,'job-market',1));
while(L.task(s).kind!=='budget'){assert(L.action(s,'j-skip'));assert(L.next(s));}
const j=L.state(s),task=L.task(s),cash=j.cash;
assert(L.action(s,'j-budget-pick','50'));assert(L.action(s,'j-budget-place','0'));assert.equal(j.values.parts[0],50);
assert(L.action(s,'j-part','', 'j-part:0:-50'));assert.equal(j.values.parts[0],0);
j.values.parts=[task.budget-1,0,0];assert.equal(L.action(s,'j-budget-place','1'),false);assert.equal(j.values.parts[1],0);j.values.parts=[0,0,0];
assert.match(H.render({world:'town',values:j.values},task),/m-budget-pick:50/);
assert.match(T.balancePanel(j,task),/Savings at the bank/);
j.values.parts=[...task.answer];assert.match(T.balancePanel(j,task),/still to allocate £0.00/);
assert(L.action(s,'j-submit'));assert(L.next(s));
assert.equal(j.cash,cash-task.answer[0]);assert.equal(j.savings,task.answer[0]);
assert.equal(j.envelopes.Travel,task.answer[1]);assert.equal(j.envelopes.Spending,task.answer[2]);
assert.equal(j.cash+j.savings,cash);
const resumed=E.migrate(JSON.parse(JSON.stringify(s)));assert.equal(JSON.stringify(L.state(resumed)),JSON.stringify(L.state(s)));
// Wrong answers retain the question and first-attempt evidence; skips record no independent success.
s=E.fresh();L.start(s,'job-market',1);L.action(s,'j-skip');L.next(s);const stage=L.state(s).stage;
assert.equal(L.action(s,'j-submit'),false);assert.equal(L.state(s).stage,stage);assert(!L.state(s).solved);
L.action(s,'j-skip');assert.equal(L.state(s).evidence.at(-1).correct,false);assert.equal(L.state(s).evidence.at(-1).skippedAfterAttempt,true);assert(L.state(s).solved);L.next(s);assert.equal(L.state(s).stage,stage+1);
// A skipped worked model never rewrites the saved historical task.
const before=JSON.stringify(L.state(s).steps);L.action(s,'j-skip');L.next(s);assert.equal(JSON.stringify(L.state(s).steps),before);
// The starting-point sample uses the same unit-aware Town generator; pence totals are coin-only.
// Each money family must retain enough fresh variants for spaced checks and retakes.
for(const [i,minUnique] of [[0,80],[1,80],[2,80]]){
 const prompts=new Set(Array.from({length:100},(_,round)=>T.question('town_money',9,round+1,i)[0]));
 assert(prompts.size>=minUnique,`town_money family ${i} has too few unique prompts: ${prompts.size}`);
}
for(let band=3;band<=9;band++){
 const coins=T.question('town_money',band,1,0);
 assert.equal(coins[5].unit,'pence');assert.match(coins[0],/pence altogether\?/);assert(!coins[0].includes('£'));assert(Number(coins[1])<=100);
 const mixed=T.question('town_money',band,2,1);
 assert.equal(mixed[5].unit,'pounds');assert.match(mixed[0],/in pounds\?/);assert.match(T.answerLabel(mixed,mixed[1]),/^£\d+\.\d{2}$/);
 const conversion=T.question('town_money',band,3,2);
 assert.equal(conversion[5].unit,'pounds');assert.match(conversion[0],/^Convert \d+p to pounds\.$/);assert.match(T.answerLabel(conversion,conversion[1]),/^£\d+\.\d{2}$/);
}
const townProfile=E.fresh();assert.equal(P.start(townProfile,'town',c.V3Curriculum,1),null);
let baselineQ=P.question(townProfile,'town');assert.equal(baselineQ.moneyQuestionVersion,2);assert.equal(P.answer(townProfile,'town',baselineQ.answer),true);P.advance(townProfile,'town',c.V3Curriculum);
baselineQ=P.question(townProfile,'town');assert.equal(baselineQ.skill,'town_timetable');assert(P.answer(townProfile,'town',baselineQ.answer));P.advance(townProfile,'town',c.V3Curriculum);
baselineQ=P.question(townProfile,'town');assert.equal(baselineQ.skill,'town_money');assert.equal(baselineQ.moneyQuestionVersion,2);assert.match(baselineQ.prompt,/in pounds\?/);assert.match(T.answerLabel([baselineQ.prompt],baselineQ.answer),/^£/);
// An old unanswered saved baseline item refreshes; completed responses are retained.
const legacyProfile=E.fresh();legacyProfile.startingProfile={version:1,areas:{town:{band:5,responses:[],startedAt:1,draft:'18430',question:{skill:'town_money',band:5,prompt:'A £174 note-and-coin total plus 30p: how many pence altogether?',answer:'17430',choices:['17430','18430','16430','19430'],explanation:'Convert to pence.'}}}};
assert.equal(P.start(legacyProfile,'town',c.V3Curriculum,2),null);assert.equal(legacyProfile.startingProfile.areas.town.question.moneyQuestionVersion,2);assert.match(legacyProfile.startingProfile.areas.town.question.prompt,/pence\?/);assert(!legacyProfile.startingProfile.areas.town.question.prompt.includes('£174'));assert.equal(legacyProfile.startingProfile.areas.town.draft,'');
console.log(`PASS money/wages: ${questions} generated questions, all bands and families; official payroll method, tokens, balances, skips and snapshots.`);
