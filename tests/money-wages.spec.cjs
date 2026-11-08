'use strict';
const {test,expect}=require('./helpers/identities.cjs');
const saved=p=>p.waitForFunction(()=>!document.documentElement.hasAttribute('data-saving'));
async function seed(camp,kind='practice'){
 const {page:p,key}=camp;
 await p.evaluate(({key,kind})=>{
  const s={...V3Engine.fresh(),startingProfile:window.FictionalStartingProfile};s.tourSeen=true;
  if(kind==='practice'){
   s.world='town';s.view=s.resumeView='practice';
   s.learning={id:'town_totals',mode:'practice',started:true,round:1,band:5,i:0,correct:0,answered:false,assisted:false,qs:[
    ['Pay £5 for items costing £2.00 and £2.35. Change in pounds?','0.65',['0.65','1.65','2.65','3.65'],'Add the prices, then subtract from £5.','£5.00 − £4.35 = £0.65.',{contentVersion:3,unit:'pounds'}],
    ['Convert £2.50 to pence.','250',['250','25','2.5','2500'],'Multiply pounds by 100.','£2.50 × 100 = 250p.',{contentVersion:3,unit:'pence'}],
    ['A £5 note and a 50p coin. Total in pounds?','5.5',['5.5','5.05','55','550'],'Add £5 and £0.50.','£5.00 + £0.50 = £5.50.',{contentVersion:3,unit:'pounds'}]
   ]};
  } else if(kind==='direct'){
   V3Engine.generate(s,'negative','practice',JaxonFreshReview,V3Curriculum);s.learning.started=true;s.view=s.resumeView='practice';
  } else if(kind==='mission'){
   V3Adventure.start(s,'town','bank',1);V3Adventure.begin(s);
  } else {
   V52TownLife.start(s,'job-market',1);
   if(kind==='budget')while(V52TownLife.task(s).kind!=='budget'){V52TownLife.action(s,'j-skip');V52TownLife.next(s);}
  }
  localStorage.setItem(key,JSON.stringify(s));
 },{key,kind});await p.reload();await saved(p);
}
async function open(p){const d=p.locator('dialog.world-task-dialog');if(await d.count()&&!await d.isVisible())await p.locator('[data-world-task-open]').first().click();const j=p.locator('.scene-dialog');if(!await d.count()&&await j.count()&&!await j.isVisible())await p.locator('[data-scene-open]').first().click();}
async function waitIndex(camp,i){await expect.poll(async()=>(await camp.read()).learning?.i).toBe(i);}
test('Pounds and pence typed answers: unit feedback, wrong retry, one-submit advance, fresh hints and completion',async({camp})=>{
 const {page:p,read}=camp;await seed(camp);
 await p.locator('[data-action="learning-hint"]').click();await expect(p.locator('.feedback').last()).toContainText('Add the prices');
 const input=p.locator('[data-numeric-answer="practice"]');await input.fill('65p');await expect(input).toHaveAttribute('aria-invalid','true');await expect(p.locator('.numeric-help')).toContainText('not 450p');
 await input.fill('£1.65');await p.locator('[data-action="p5-submit"]').click();await saved(p);await p.waitForTimeout(1100);expect((await read()).learning.i).toBe(0);expect((await read()).learning.responses[0].correct).toBe(false);
 await input.fill('£0.65');await p.locator('[data-action="p5-submit"]').click();await waitIndex(camp,1);await expect(p.locator('.feedback')).toHaveCount(0);expect((await read()).learning.hintLevel).toBeUndefined();
 await p.locator('[data-action="learning-hint"]').click();await expect(p.locator('.feedback').last()).toContainText('Multiply pounds');await expect(p.locator('main')).not.toContainText('Add the prices');
 await p.locator('[data-numeric-answer="practice"]').fill('250p');await p.locator('[data-action="p5-submit"]').click();await waitIndex(camp,2);
 await p.locator('[data-action="answer:0"]').click();await expect.poll(async()=>(await read()).view).toBe('recap');expect((await read()).skills.town_totals.state).not.toBe('mastered');
});
test('Choice selection and I do not know advance once, including a saved pending answer after reload',async({camp})=>{
 const {page:p,read}=camp;await seed(camp);await p.locator('[data-action="answer:0"]').click();await saved(p);await p.reload();await waitIndex(camp,1);
 await p.locator('[data-action="learning-skip"]').click();await waitIndex(camp,2);expect((await read()).learning.responses.at(-1).skipped).toBe(true);await p.waitForTimeout(1100);expect((await read()).learning.i).toBe(2);
});
test('Unrelated direct questions reset hint/example state, and wrong answers allow retry',async({camp})=>{
 const {page:p,read}=camp;await seed(camp,'direct');await p.locator('[data-action="learning-hint"]').click();const first=(await read()).learning.qs[0];await p.locator('[data-action="d9-check"]').click();await saved(p);expect((await read()).learning.i).toBe(0);await require('./helpers/direct.cjs').alternative(p,first[5].direct,first[1]);await p.locator('[data-action="d9-check"]').click();await waitIndex(camp,1);expect((await read()).learning.responses[0].correct).toBe(false);await seed(camp,'direct');await p.locator('[data-action="learning-hint"]').click();
 await p.locator('[data-action="learning-skip"]').click();await waitIndex(camp,1);expect((await read()).learning.manipulation).toBeUndefined();expect((await read()).learning.teachingExample).toBeUndefined();await expect(p.locator('.feedback')).toHaveCount(0);
 await seed(camp);await expect(p.locator('main')).not.toContainText(first[3]);
});
test('Town choice, money tray and skips advance after one action, while wrong amounts stay',async({camp})=>{
 const {page:p,read}=camp;await seed(camp,'journey');await open(p);let j=await p.evaluate(()=>V52TownLife.state(JSON.parse(localStorage.getItem('jaxon_v3_fictional_demo_2026'))));
 await p.locator('.scene-dialog [data-action="j-choice:'+j.steps[0].answer+'"]').click();await expect.poll(async()=>(await read()).adventure.townLifeV2.runs['job-market:1'].stage).toBe(1);
 // Skip the basket; this is a captured assisted response, not an independent answer.
 await open(p);await p.locator('.scene-dialog [data-action="j-skip"]').click();await expect.poll(async()=>(await read()).adventure.townLifeV2.runs['job-market:1'].stage).toBe(2);
 await open(p);await p.locator('.scene-dialog [data-action="j-coin:1"]').click();await saved(p);await p.locator('.scene-dialog [data-action="j-submit"]').click();await p.waitForTimeout(1100);expect((await read()).adventure.townLifeV2.runs['job-market:1'].stage).toBe(2);
 await p.locator('.scene-dialog [data-action="j-coin:clear"]').click();await saved(p);j=(await read()).adventure.townLifeV2.runs['job-market:1'];let n=j.steps[2].answer;for(const token of [5000,2000,1000,500,200,100,50,20,10,5,2,1])while(n>=token){await p.locator('.scene-dialog [data-action="j-coin:'+token+'"]').click();n-=token;}
 await p.locator('.scene-dialog [data-action="j-submit"]').click();await expect.poll(async()=>(await read()).adventure.townLifeV2.runs['job-market:1'].stage).toBe(3);
});
test('50p token, visible balances and educational payslip survive allocation and reload',async({camp})=>{
 const {page:p,read}=camp;await seed(camp,'budget');await expect(p.locator('.money-balances').first()).toContainText('Savings at the bank');await expect(p.locator('.educational-payslip').first()).toContainText('£1,718.92'.replace(',',''));
 await open(p);await expect(p.locator('.scene-dialog .money-balances')).toBeVisible();await p.locator('.scene-dialog [data-action="j-budget-pick:50"]').click();await p.locator('.scene-dialog [data-action="j-budget-place:0"]').click();await saved(p);let j=(await read()).adventure.townLifeV2.runs['job-market:1'];expect(j.values.parts[0]).toBe(50);
 await expect(p.locator('.money-balances').first()).toContainText('£0.50');await p.locator('.scene-dialog [data-action="j-part:0:-50"]').click();
 const t=j.steps[j.stage];for(let i=0;i<t.answer.length;i++){let n=t.answer[i];for(const token of [1000,500,100,50,5,1])while(n>=token){await p.locator('.scene-dialog [data-action="j-budget-pick:'+token+'"]').click();await p.locator('.scene-dialog [data-action="j-budget-place:'+i+'"]').click();n-=token;}}
 await p.locator('.scene-dialog [data-action="j-submit"]').click();await expect.poll(async()=>(await read()).adventure.townLifeV2.runs['job-market:1'].stage).toBe(j.stage+1);const after=(await read()).adventure.townLifeV2;await p.reload();expect((await read()).adventure.townLifeV2).toEqual(after);
 await p.screenshot({path:`test-results/money-wages/balances-${p.viewportSize().width}.png`,fullPage:true});
});
test('Mission correct submission and unknown response progress without a second confirmation',async({camp})=>{
 const {page:p,read}=camp;await seed(camp,'mission');await open(p);let q=(await read()).adventure.active,t=q.tasks[0];
 // Bank tasks require posting every transaction before entering the balance.
 if(t.kind==='bank'){for(let i=0;i<t.transactions.length;i++){await p.locator('[data-action="m-post:'+i+'"]').click();await saved(p);}}
 const input=p.locator('[data-numeric-answer="mission"]');await input.fill(String(t.answer));await saved(p);await expect.poll(async()=>(await read()).adventure.active.values.amount).toBe(t.answer);await p.locator('[data-action="m-submit"]').click();await expect.poll(async()=>(await read()).adventure.active.i).toBe(1);
 await open(p);await p.locator('[data-action="m-begin"]').click();await p.locator('[data-action="m-worked"]').click();await expect.poll(async()=>(await read()).adventure.active.i).toBe(2);expect((await read()).adventure.active.evidence.at(-1).skipped).toBe(true);
});
