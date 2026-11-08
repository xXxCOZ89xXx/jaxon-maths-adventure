'use strict';
const {test,expect}=require('@playwright/test');
const H=require('./helpers/direct.cjs'),T=require('../v3/town').V3Town;
const KEY='jaxon_public_demo_v1',ORIGIN='http://127.0.0.1:4174';
const saved=p=>p.waitForFunction(()=>!document.documentElement.hasAttribute('data-saving'));
const read=async p=>{await saved(p);return p.evaluate(k=>JSON.parse(localStorage.getItem(k)),KEY);};
async function click(p,act){const d=p.locator('dialog[open]'),selector=`[data-action="${act}"]`;await(await d.count()&&await d.locator(selector).count()?d.locator(selector):p.locator(selector)).first().click();await saved(p);}
async function open(p){const d=p.locator('dialog.world-task-dialog');if(await d.count()&&!await d.isVisible())await p.locator('[data-world-task-open]').first().click();const j=p.locator('.immersive-journey .scene-dialog');if(await j.count()&&!await j.isVisible())await p.locator('[data-scene-open]').first().click();}
async function advance(p){await require('./helpers/progression.cjs').advance(p);}
async function answerMission(p,t){
 if(['order','match'].includes(t.kind)){for(let i=0;i<t.answer.length;i++){await click(p,'h-pick:'+t.answer[i]);await click(p,'h-place:'+i);}}
 else if(t.kind==='choice'){await click(p,'m-choice:'+t.answer);return;}
 else if(t.kind==='coins'){for(const n of T.moneyTokens(t.answer))await click(p,'m-coin:'+n);}
 else if(t.unit==='p'){for(const n of T.moneyTokens(t.answer))await click(p,'m-adjust:'+n);}
 else{const range=p.locator('dialog[open] [data-model-range]');if(await range.count()){await range.evaluate((e,n)=>{e.value=String(n);e.dispatchEvent(new Event('change',{bubbles:true}));},t.answer);await saved(p);}else{const input=p.locator('dialog[open] [data-numeric-answer]');await input.fill(String(t.answer));await saved(p);}}
 await click(p,'m-submit');
}
test.beforeEach(async({page:p,context})=>{p.errors=[];p.external=[];await context.route('**/*',r=>{if(new URL(r.request().url()).origin===ORIGIN)return r.continue();p.external.push(r.request().url());return r.abort();});p.on('pageerror',e=>p.errors.push(e.message));await p.goto('/');await expect(p.locator('.demo-strip')).toContainText('PUBLIC DEMO');expect(await p.locator('input[type=password],input[type=email],input[type=tel]').count()).toBe(0);expect(await p.evaluate(()=>typeof V3CloudContext)).toBe('undefined');await click(p,'skip-tour');});
test.afterEach(async({page:p,context})=>{expect(p.errors).toEqual([]);expect(p.external).toEqual([]);expect(await context.cookies()).toEqual([]);expect(await p.evaluate(()=>Object.keys(localStorage))).toEqual([KEY]);expect(await p.evaluate(()=>sessionStorage.length)).toBe(0);expect(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);});
for(const kind of ['meters','recycling','post'])test(`Clean visitor completes shared Home ${kind} with one-action answers and exact resume`,async({page:p})=>{
 await p.clock.setFixedTime(new Date('2026-11-08T12:00:00Z'));
 await click(p,'world:town');await click(p,'home-activity:'+kind);await open(p);
 let total=0;while((await read(p)).view==='adventure'){
  await open(p);await click(p,'m-begin');const q=(await read(p)).adventure.active,t=q.tasks[q.i];
  if(kind==='meters'){await expect(p.locator('dialog[open] .meter-art')).toBeVisible();for(const meter of ['electricity','gas','water'])await expect(p.locator(`dialog[open] [aria-label="${meter} current reading"]`)).toContainText(String(t.readings[meter].current));await expect(p.locator('dialog[open]')).toContainText('Previous:');}
  if(kind==='recycling'&&q.i===2){expect(t.today).toBe('2026-11-08');expect(t.bins).toBe('General waste and food caddy');await expect(p.locator('dialog[open]')).toContainText('Monday 2 November 2026');}
  if(kind==='post'&&q.i===2){await click(p,'m-choice:'+(t.answer+1)%3);expect((await read(p)).adventure.active.i).toBe(q.i);expect((await read(p)).adventure.active.solved).toBe(false);}
  await click(p,'m-help');await expect(p.locator('dialog[open] .feedback').last()).toContainText(t.hint);
  if(q.i===1){const before=(await read(p)).adventure.active;await p.reload();await open(p);expect((await read(p)).adventure.active).toEqual(before);}
  await answerMission(p,t);await advance(p);const next=await read(p);if(next.adventure.active){expect(next.adventure.active.i).toBe(q.i+1);expect(next.adventure.active.feedback).toBe('');expect(next.adventure.active.hintLevel).toBe(0);}total++;
 }
 expect(total).toBe(kind==='post'?4:3);expect((await read(p)).view).toBe('recap');expect((await read(p)).skills).toEqual({});
});
test('Fresh Town money lesson uses shared units, correct hints, wrong retry, typed pounds and one-tap choices',async({page:p})=>{
 await click(p,'world:town');await p.locator('.town-lessons summary').click();await click(p,'learn:town_totals');await click(p,'practice');let s=await read(p),q=s.learning.qs[0];expect(q[5].direct.kind).toBe('basket');await click(p,'learning-hint');await expect(p.locator('.feedback').last()).toContainText(q[3]);await click(p,'d9-check');await p.waitForTimeout(1050);expect((await read(p)).learning.i).toBe(0);
 await H.alternative(p,q[5].direct,q[1]);await click(p,'d9-check');await advance(p);s=await read(p);expect(s.learning.i).toBe(1);await expect(p.locator('.feedback')).toHaveCount(0);expect(s.learning.mathExtra).toBeUndefined();
 q=s.learning.qs[1];expect(q[5].unit).toBe('pounds');await click(p,'learning-hint');await expect(p.locator('.feedback').last()).toContainText(q[3]);const input=p.locator('[data-numeric-answer="practice"]');await input.fill('50p');await expect(input).toHaveAttribute('aria-invalid','true');await input.fill('£'+Number(q[1]).toFixed(2));await saved(p);await click(p,'p5-submit');await advance(p);s=await read(p);expect(s.learning.i).toBe(2);q=s.learning.qs[2];await click(p,'answer:'+q[2].indexOf(q[1]));await advance(p);expect((await read(p)).learning.i).toBe(3);
});
test('Fresh wage journey shares the verified payslip and live 50p/envelope balances, saved only in this browser',async({page:p})=>{
 await click(p,'world:town');await p.locator('#town-plans summary').filter({hasText:'Employment'}).click();await click(p,'j-plan:job-market');
 while(true){await open(p);const s=await read(p),j=s.adventure.townLifeV2.runs['job-market:1'],t=j.steps[j.stage];if(t.kind==='budget')break;
  if(['choice','journey'].includes(t.kind))await click(p,'j-choice:'+t.answer);
  else if(t.kind==='basket'){for(let i=0;i<t.answer.length;i++)for(let n=0;n<t.answer[i];n++)await click(p,`j-part:${i}:1`);await click(p,'j-submit');}
  else if(t.kind==='coins'){for(const coin of T.moneyTokens(t.answer))await click(p,'j-coin:'+coin);await click(p,'j-submit');}
  else if(t.unit==='p'){for(const coin of T.moneyTokens(t.answer))await click(p,'j-adjust:'+coin);await click(p,'j-submit');}
  else {const input=p.locator('dialog[open] [data-numeric-answer]');await input.fill(String(t.answer/(t.responseUnit==='pounds'?100:1)));await saved(p);await click(p,'j-submit');}await advance(p);
 }
 await open(p);const s=await read(p),j=s.adventure.townLifeV2.runs['job-market:1'],t=j.steps[j.stage];
 expect(await p.evaluate(()=>V3Town.educationalPayslip())).toEqual(T.educationalPayslip());await expect(p.locator('dialog[open] .educational-payslip')).toContainText('£1718.92');await expect(p.locator('dialog[open] .educational-payslip')).toContainText('not deducted from net pay');
 await click(p,'j-budget-pick:50');await click(p,'j-budget-place:0');await expect(p.locator('dialog[open] [aria-label="Current account balances"]')).toContainText('£0.50');await click(p,'j-part:0:-50');
 for(let i=0;i<t.answer.length;i++)for(const coin of T.moneyTokens(t.answer[i])){ // Allocation supports these whole denominations (including 50p).
  if([1,5,50,100,500,1000].includes(coin)){await click(p,'j-budget-pick:'+coin);await click(p,'j-budget-place:'+i);}else{for(let n=0;n<coin/100;n++){await click(p,'j-budget-pick:100');await click(p,'j-budget-place:'+i);}}
 }
 await expect(p.locator('dialog[open] [aria-label="Current account balances"]')).toContainText('still to allocate £0.00');await click(p,'j-submit');await advance(p);const after=(await read(p)).adventure.townLifeV2;await p.reload();expect((await read(p)).adventure.townLifeV2).toEqual(after);const current=after.runs['job-market:1'];expect(current.savings).toBe(t.answer[0]);expect(current.envelopes.Travel).toBe(t.answer[1]);expect(current.envelopes.Spending).toBe(t.answer[2]);
});

test('Town page puts home activities before the map and opens illustrated meters',async({page:p})=>{
 await click(p,'world:town');
 const board=p.locator('.home-activity-board');
 await expect(board).toBeVisible();
 await expect(board).toContainText('At home and around home');
 await expect(board).toContainText('Read illustrated utility meters');
 await expect(board).toContainText('Check bins and recycling day');
 await expect(board).toContainText('Prepare and post a parcel');
 const boardTop=await board.evaluate(e=>e.getBoundingClientRect().top);
 const mapTop=await p.locator('.town-explore-map').evaluate(e=>e.getBoundingClientRect().top);
 expect(boardTop).toBeLessThan(mapTop);
 await click(p,'home-activity:meters');await open(p);await click(p,'m-begin');
 await expect(p.locator('dialog[open] .meter-art')).toBeVisible();
});
