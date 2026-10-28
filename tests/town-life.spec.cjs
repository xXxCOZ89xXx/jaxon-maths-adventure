'use strict';
const {test,expect}=require('./helpers/identities.cjs');
const {V52TownLife:L}=require('../v3/town-life');
const AxeBuilder=require('@axe-core/playwright').default;
async function openScene(page,mode){const d=page.locator('.immersive-journey .scene-dialog');if(await d.isVisible())await d.locator('[data-scene-close]').click();const opener=page.locator(`[data-scene-open="${mode}"]`).first();if(await opener.count())await opener.click();}
async function openCurrent(page){const world=page.locator('dialog.world-task-dialog');if(await world.count()&&!await world.isVisible())await page.locator('.activity-entry [data-world-task-open]').click();const d=page.locator('.immersive-journey .scene-dialog');if(await d.count()&&!await d.isVisible())await page.locator('.scene-dock [data-scene-open]').first().click();}
async function target(page,act){
 await openCurrent(page);const selector=`[data-action="${act}"]`;
 const world=page.locator('dialog.world-task-dialog[open]');if(await world.count()&&await world.locator(selector).count())return world.locator(selector).first();
 const dialog=page.locator('.immersive-journey .scene-dialog[open]');if(await dialog.count()&&await dialog.locator(selector).count())return dialog.locator(selector).first();
 for(const mode of ['task','pantry','fridge','basket','timetable','ticket'])if(await page.locator(`[data-scene-open="${mode}"]`).count()){await openScene(page,mode);const d=page.locator('.scene-dialog[open]');if(await d.locator(selector).count())return d.locator(selector).first();}
 const overlay=page.locator('.immersive-journey .scene-dialog[open]');if(await overlay.count())await overlay.locator('[data-scene-close]').click();
 return page.locator(selector).first();
}
async function click(page,act){const control=await target(page,act),door=control.locator("xpath=ancestor::details[contains(@class, 'stock-door')]");if(await door.count()&&(await door.getAttribute('open'))===null)await door.locator('summary').click();await control.click();await page.waitForFunction(()=>!document.documentElement.hasAttribute('data-saving'));}
async function town(page){const map=page.locator('dialog[open] [data-action="nav:map"]');if(await map.count())await map.first().click();else await page.locator('.topbar [data-nav="map"]').click();await page.waitForFunction(()=>!document.documentElement.hasAttribute('data-saving'));await click(page,'world:town');}
async function current(page,key){return page.evaluate(key=>V52TownLife.state(JSON.parse(localStorage.getItem(key))),key);}
async function setRange(page,n){
 await openCurrent(page);const opener=page.locator('.scene-dock [data-scene-open]').first();if(await opener.count())await openScene(page,await opener.getAttribute('data-scene-open'));
 const range=page.locator('[data-model-range]').filter({visible:true}).first();
 if(await range.count())await range.evaluate((el,n)=>{el.value=String(n);el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));},n);
 else await page.locator('[data-numeric-answer]').filter({visible:true}).first().fill(String(n));
 await page.waitForFunction(()=>!document.documentElement.hasAttribute('data-saving'));
}
async function answer(page,t,choice){
 if(['order','match'].includes(t.kind)){for(let slot=0;slot<t.answer.length;slot++){await click(page,'j-pick:'+t.answer[slot]);await click(page,'j-place:'+slot);}}
 else if(['basket','budget'].includes(t.kind)){for(let i=0;i<t.answer.length;i++){let n=t.answer[i];for(const step of t.kind==='budget'?[1000,500,100,5,1]:[1])while(n>=step){if(t.kind==='budget'){await click(page,'j-budget-pick:'+step);await click(page,'j-budget-place:'+i);}else await click(page,`j-part:${i}:${step}`);n-=step;}}}
 else if(['choice','journey'].includes(t.kind))await click(page,'j-choice:'+(choice??t.answer));
 else if(t.kind==='coins'){let n=t.answer;for(let p of [5000,2000,1000,500,200,100,50,20,10,5,2,1])while(n>=p){await click(page,'j-coin:'+p);n-=p;}}
 else if(t.kind==='clock'){const h=Math.floor(t.answer/60),m=t.answer%60;await click(page,'j-value:'+h*60);await click(page,'j-value:'+(h*60+Math.floor(m/5)*5));if(m%5)for(let i=1;i<=m%5;i++)await click(page,'j-value:'+(h*60+Math.floor(m/5)*5+i));}
 else if(t.kind==='measure'||t.unit!=='p')await setRange(page,t.answer);
 else {let n=t.answer;for(const p of [5000,2000,1000,500,200,100,50,20,10,5,2,1])while(n>=p){await click(page,'j-adjust:'+p);n-=p;}}
}
const landscapePlans=new Set(['cook-soup','shop-budget','travel-connection','job-cafe','errand-post']);
for(const c of L.catalog)test(`Town plan ${c.id}: touch completion, exact reload and fresh replay`,async({camp},info)=>{
  test.skip(info.project.name.includes('landscape')&&!landscapePlans.has(c.id),'Landscape representatives cover each category.');
  const {page,key,read}=camp;
  await click(page,'skip-tour');await page.locator('nav [data-nav="map"]').click();await town(page);
  if(c.category==='Employment'){
    await page.locator(`.town-hotspots [data-action^="j-work:${c.venue}:"]`).click();
    await expect(page.locator('.journey-progress')).toContainText('worker context');
  }else{
    await page.locator('.town-plan-catalog details').filter({has:page.locator('summary',{hasText:c.category})}).locator('summary').click();
    await click(page,'j-plan:'+c.id);
  }
  const initial=await read();let visits=0;
  while(!(await current(page,key)).done){
    const j=await current(page,key),t=j.steps[j.stage];
    if(j.stage===0){await click(page,'j-skip');await expect(page.locator('.feedback').filter({visible:true}).first()).toBeVisible();}
    await answer(page,t);
    const exact=await current(page,key);
    if(j.stage===0||t.kind==='clock'||t.kind==='budget'||t.kind==='match'||t.kind==='measure'){
      await page.reload();expect(await current(page,key)).toEqual(exact);
    }
    await click(page,'j-submit');expect((await current(page,key)).solved).toBe(true);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
    await click(page,'j-next');expect(++visits).toBeLessThan(18);
  }
  await expect(page.getByRole('heading',{name:'Town plan complete.'})).toBeVisible();
  const finished=await current(page,key);expect(finished.receipts.length).toBeGreaterThan(1);
  const final=await read();expect(final.coins-initial.coins).toBe(final.earned-initial.earned);expect(final.earned).toBe(Math.floor(final.minutes*10+1e-9));expect(final.checks).toEqual(initial.checks);
  if(landscapePlans.has(c.id))expect((await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa']).analyze()).violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)}))).toEqual([]);
  await click(page,'j-replay:'+c.id);const replay=await current(page,key);expect(replay.seed).toBe(2);expect(replay.steps).not.toEqual(finished.steps);
  expect((await read()).adventure.townLifeV2.runs[finished.id]).toEqual(finished);
});
test('Expanded plans preserve legacy drafts, switch/resume and refuse an incomplete clock',async({camp})=>{
  const {page,key}=camp;
  await page.evaluate(key=>{const s=JSON.parse(localStorage.getItem(key));V5Journey.start(s,'bolognese');V5Journey.state(s).values.parts=[1,1,0];V52TownLife.start(s,'travel-swim');localStorage.setItem(key,JSON.stringify(s));},key);await page.reload();
  let j=await current(page,key);while(j.steps[j.stage].kind!=='clock'){await answer(page,j.steps[j.stage]);await click(page,'j-submit');await click(page,'j-next');j=await current(page,key);}
  const t=j.steps[j.stage];
  // Older saves may retain an incomplete typed-time draft. The current clock
  // uses hour/minute buttons; it must still refuse that draft until edited.
  await page.evaluate(key=>{const s=JSON.parse(localStorage.getItem(key));V52TownLife.state(s).values.clockDraft='';localStorage.setItem(key,JSON.stringify(s));},key);await page.reload();await openCurrent(page);await click(page,'j-submit');expect((await current(page,key)).solved).toBe(false);expect((await current(page,key)).values.clockDraft).toBe('');
  await answer(page,t);await click(page,'j-submit');expect((await current(page,key)).solved).toBe(true);expect((await current(page,key)).values.clockDraft).toBeUndefined();
  const snapshot=await current(page,key);await town(page);await page.locator('.town-plan-catalog details').filter({has:page.locator('summary',{hasText:'Cooking'})}).locator('summary').click();await click(page,'j-plan:cook-pizza');await town(page);await page.locator('.town-plan-catalog details').filter({has:page.locator('summary',{hasText:'Travel'})}).locator('summary').click();await click(page,'j-plan:travel-swim');expect(await current(page,key)).toEqual(snapshot);
  await town(page);await click(page,'j-start:bolognese');expect(await page.evaluate(key=>V5Journey.state(JSON.parse(localStorage.getItem(key))).values.parts,key)).toEqual([1,1,0]);
});
test('Expanded cooking plan saves every stage through the existing staging JSON contract',async({family})=>{
  const page=await family.open('learner'),key=`jaxon_v3_staging:${family.ref}:${family.uid}:game`;
  await click(page,'skip-tour');await page.locator('nav [data-nav="map"]').click();await town(page);await page.locator('.town-plan-catalog details').filter({has:page.locator('summary',{hasText:'Cooking'})}).locator('summary').click();await click(page,'j-plan:cook-curry');
  while(!(await current(page,key)).done){const j=await current(page,key);await answer(page,j.steps[j.stage]);await click(page,'j-submit');await click(page,'j-next');const snapshot=await current(page,key);await page.evaluate(()=>window.dispatchEvent(new Event('online')));await expect.poll(()=>family.server.progress.adventure?.townLifeV2?.runs[snapshot.id]?.stage).toBe(snapshot.stage);await page.reload();expect(await current(page,key)).toEqual(snapshot);}
  await expect(page.getByRole('heading',{name:'Town plan complete.'})).toBeVisible();
});
test.describe('Evidence-informed Town level',()=>{
  test.use({profileName:'advanced'});
  test('Independent evidence suggests harder quantities; learner can choose an easier new plan',async({camp})=>{
    const {page,key}=camp;await page.locator('nav [data-nav="map"]').click();await town(page);
    await expect(page.locator('[data-mission-tier="town"]')).toHaveValue('3');
    await page.locator('.town-plan-catalog details').filter({has:page.locator('summary',{hasText:'Cooking'})}).locator('summary').click();await click(page,'j-plan:cook-pasta');
    const hard=await current(page,key);expect(hard.tier).toBe(3);expect(hard.steps[1].answer.reduce((a,b)=>a+b,0)).toBeGreaterThan(5);
    await town(page);await page.locator('[data-mission-tier="town"]').selectOption('1');await page.waitForFunction(()=>!document.documentElement.hasAttribute('data-saving'));
    await page.locator('.town-plan-catalog details').filter({has:page.locator('summary',{hasText:'Cooking'})}).locator('summary').click();await click(page,'j-plan:cook-soup');expect((await current(page,key)).tier).toBe(1);
    expect(await page.evaluate(key=>JSON.parse(localStorage.getItem(key)).adventure.townLifeV2.runs['cook-pasta:1'],key)).toEqual(hard);
  });
});
test('An offline Town draft retains its original pending save and resumes after reconnect',async({family})=>{
  const page=await family.open('learner'),key=`jaxon_v3_staging:${family.ref}:${family.uid}:game`,queue=key+':queue';
  await click(page,'skip-tour');await page.locator('nav [data-nav="map"]').click();await town(page);await page.locator('.town-plan-catalog details').filter({has:page.locator('summary',{hasText:'Cooking'})}).locator('summary').click();await click(page,'j-plan:cook-pizza');
  await page.evaluate(()=>window.dispatchEvent(new Event('online')));await expect.poll(()=>family.server.progress.adventure?.townLifeV2?.active).toBe('cook-pizza:1');
  family.server.loseSave=true;await click(page,'j-part:0:1');await page.evaluate(()=>window.dispatchEvent(new Event('online')));
  await expect.poll(()=>page.evaluate(queue=>{const q=JSON.parse(localStorage.getItem(queue));return q?.pending?.requestId||null;},queue)).not.toBeNull();
  const pending=await page.evaluate(queue=>JSON.parse(localStorage.getItem(queue)).pending,queue);
  await page.context().setOffline(true);await click(page,'j-part:1:1');const draft=await current(page,key);
  const offline=await page.evaluate(queue=>JSON.parse(localStorage.getItem(queue)),queue);expect(offline.pending).toEqual(pending);
  expect(offline.latest.adventure.townLifeV2.runs[draft.id].values.parts).toEqual(draft.values.parts);
  await page.context().setOffline(false);await page.evaluate(()=>window.dispatchEvent(new Event('online')));
  await expect.poll(()=>family.server.progress.adventure?.townLifeV2?.runs[draft.id]?.values).toEqual(draft.values);
  expect(family.server.calls.some(c=>c.body?.p_operation==='save'&&c.body.p_args.requestId===pending.requestId)).toBe(true);
  await page.reload();expect(await current(page,key)).toEqual(draft);
});
