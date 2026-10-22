'use strict';
const {test,expect}=require('./helpers/identities.cjs');
const {V52TownLife:L}=require('../v3/town-life');
const AxeBuilder=require('@axe-core/playwright').default;
async function click(page,action){await page.locator(`[data-action="${action}"]`).first().click();await page.waitForFunction(()=>!document.documentElement.hasAttribute('data-saving'));}
async function current(page,key){return page.evaluate(key=>V52TownLife.state(JSON.parse(localStorage.getItem(key))),key);}
async function answer(page,t){
  if(['order','match'].includes(t.kind)){for(let slot=0;slot<t.answer.length;slot++){await click(page,'j-pick:'+t.answer[slot]);await click(page,'j-place:'+slot);}}
  else if(['basket','budget'].includes(t.kind)){for(let i=0;i<t.answer.length;i++){let n=t.answer[i];for(const step of t.kind==='budget'?[1000,500,100,5]:[1])while(n>=step){await click(page,`j-part:${i}:${step}`);n-=step;}expect(n).toBe(0);}}
  else if(['journey','choice'].includes(t.kind))await click(page,'j-choice:'+t.answer);
  else if(t.kind==='coins'){let n=t.answer;for(const p of [5000,2000,1000,500,200,100,50,20,10,5,2,1])while(n>=p){await click(page,'j-coin:'+p);n-=p;}}
  else if(t.kind==='clock'){
    // Use only touch-equivalent clock buttons, including non-five-minute times.
    let n=t.answer;for(const step of [60,5,1])while(n>=step){await click(page,'j-adjust:'+step);n-=step;}
  }else if(t.kind==='measure'){for(let n=0;n<t.answer;n+=t.step)await click(page,'j-adjust:'+t.step);}
  else {let n=t.answer;for(const step of [5000,2000,1000,500,200,100,50,20,10,5,2,1])while(n>=step){await click(page,'j-adjust:'+step);n-=step;}}
}
const landscapePlans=new Set(['cook-soup','shop-budget','travel-connection','job-cafe','errand-post']);
for(const c of L.catalog)test(`Town plan ${c.id}: touch completion, exact reload and fresh replay`,async({camp},info)=>{
  test.skip(info.project.name.includes('landscape')&&!landscapePlans.has(c.id),'Landscape representatives cover each category.');
  const {page,key,read}=camp;
  await click(page,'skip-tour');await page.locator('nav [data-nav="map"]').click();await click(page,'world:town');
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
    if(j.stage===0){await click(page,'j-skip');await expect(page.locator('.feedback')).toBeVisible();}
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
  expect((await read()).coins).toEqual(initial.coins);expect((await read()).checks).toEqual(initial.checks);
  if(landscapePlans.has(c.id))expect((await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa']).analyze()).violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)}))).toEqual([]);
  await click(page,'j-replay:'+c.id);const replay=await current(page,key);expect(replay.seed).toBe(2);expect(replay.steps).not.toEqual(finished.steps);
  expect((await read()).adventure.townLifeV2.runs[finished.id]).toEqual(finished);
});
test('Expanded plans preserve legacy drafts, switch/resume and refuse an incomplete clock',async({camp})=>{
  const {page,key}=camp;
  await page.evaluate(key=>{const s=JSON.parse(localStorage.getItem(key));V5Journey.start(s,'bolognese');V5Journey.state(s).values.parts=[1,1,0];V52TownLife.start(s,'travel-swim');localStorage.setItem(key,JSON.stringify(s));},key);await page.reload();
  let j=await current(page,key);await answer(page,j.steps[j.stage]);await click(page,'j-submit');await click(page,'j-next');j=await current(page,key);await answer(page,j.steps[j.stage]);await click(page,'j-submit');await click(page,'j-next');
  const t=(await current(page,key)).steps[2];await page.locator('[data-life-clock]').fill('');await page.reload();await expect(page.locator('[data-life-clock]')).toHaveValue('');await expect(page.locator('[data-life-clock]')).toHaveAttribute('aria-invalid','true');
  await page.locator('[data-life-clock]').fill(String(Math.floor(t.answer/60)).padStart(2,'0')+':'+String(t.answer%60).padStart(2,'0'));await page.waitForFunction(()=>!document.documentElement.hasAttribute('data-saving'));await click(page,'j-submit');expect((await current(page,key)).solved).toBe(true);
  const snapshot=await current(page,key);await click(page,'world:town');await page.locator('.town-plan-catalog details').filter({has:page.locator('summary',{hasText:'Cooking'})}).locator('summary').click();await click(page,'j-plan:cook-pizza');await click(page,'world:town');await page.locator('.town-plan-catalog details').filter({has:page.locator('summary',{hasText:'Travel'})}).locator('summary').click();await click(page,'j-plan:travel-swim');expect(await current(page,key)).toEqual(snapshot);
  await click(page,'world:town');await click(page,'j-start:bolognese');expect(await page.evaluate(key=>V5Journey.state(JSON.parse(localStorage.getItem(key))).values.parts,key)).toEqual([1,1,0]);
});
test('Expanded cooking plan saves every stage through the existing staging JSON contract',async({family})=>{
  const page=await family.open('learner'),key=`jaxon_v3_staging:${family.ref}:${family.uid}:game`;
  await click(page,'skip-tour');await page.locator('nav [data-nav="map"]').click();await click(page,'world:town');await page.locator('.town-plan-catalog details').filter({has:page.locator('summary',{hasText:'Cooking'})}).locator('summary').click();await click(page,'j-plan:cook-curry');
  while(!(await current(page,key)).done){const j=await current(page,key);await answer(page,j.steps[j.stage]);await click(page,'j-submit');await click(page,'j-next');const snapshot=await current(page,key);await expect.poll(()=>family.server.progress.adventure?.townLifeV2?.runs[snapshot.id]?.stage).toBe(snapshot.stage);await page.reload();expect(await current(page,key)).toEqual(snapshot);}
  await expect(page.getByRole('heading',{name:'Town plan complete.'})).toBeVisible();
});
test.describe('Evidence-informed Town level',()=>{
  test.use({profileName:'advanced'});
  test('Independent evidence suggests harder quantities; learner can choose an easier new plan',async({camp})=>{
    const {page,key}=camp;await page.locator('nav [data-nav="map"]').click();await click(page,'world:town');
    await expect(page.locator('[data-mission-tier="town"]')).toHaveValue('3');
    await page.locator('.town-plan-catalog details').filter({has:page.locator('summary',{hasText:'Cooking'})}).locator('summary').click();await click(page,'j-plan:cook-pasta');
    const hard=await current(page,key);expect(hard.tier).toBe(3);expect(hard.steps[1].answer.reduce((a,b)=>a+b,0)).toBeGreaterThan(5);
    await click(page,'world:town');await page.locator('[data-mission-tier="town"]').selectOption('1');await page.waitForFunction(()=>!document.documentElement.hasAttribute('data-saving'));
    await page.locator('.town-plan-catalog details').filter({has:page.locator('summary',{hasText:'Cooking'})}).locator('summary').click();await click(page,'j-plan:cook-soup');expect((await current(page,key)).tier).toBe(1);
    expect(await page.evaluate(key=>JSON.parse(localStorage.getItem(key)).adventure.townLifeV2.runs['cook-pasta:1'],key)).toEqual(hard);
  });
});
test('An offline Town draft retains its original pending save and resumes after reconnect',async({family})=>{
  const page=await family.open('learner'),key=`jaxon_v3_staging:${family.ref}:${family.uid}:game`,queue=key+':queue';
  await click(page,'skip-tour');await page.locator('nav [data-nav="map"]').click();await click(page,'world:town');await page.locator('.town-plan-catalog details').filter({has:page.locator('summary',{hasText:'Cooking'})}).locator('summary').click();await click(page,'j-plan:cook-pizza');
  await expect.poll(()=>family.server.progress.adventure?.townLifeV2?.active).toBe('cook-pizza:1');
  family.server.loseSave=true;await click(page,'j-part:0:1');
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
