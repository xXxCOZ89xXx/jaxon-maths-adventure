'use strict';
const {test,expect}=require('./helpers/identities.cjs');
async function click(page,act){await page.locator(`[data-action="${act}"]`).first().tap();await page.waitForFunction(()=>!document.documentElement.hasAttribute('data-saving'));}
async function seed(page,key,world,route,stage=0){await page.evaluate(({key,world,route,stage})=>{const s=V3Engine.fresh();s.tourSeen=true;V3Adventure.start(s,world,route,1);const q=V3Adventure.current(s);q.i=stage;q.phase='play';s.view='adventure';localStorage.setItem(key,JSON.stringify(s));},{key,world,route,stage});await page.reload();}
async function run(page,key){return page.evaluate(k=>V52TownLife.state(JSON.parse(localStorage.getItem(k))),key);}
async function setRange(page,n){const range=page.locator('[data-model-range]');await range.evaluate((el,n)=>{el.value=String(n);el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));},n);await page.waitForFunction(()=>!document.documentElement.hasAttribute('data-saving'));}
async function answer(page,t,choice){
 if(['order','match'].includes(t.kind)){for(let slot=0;slot<t.answer.length;slot++){await click(page,'j-pick:'+t.answer[slot]);await click(page,'j-place:'+slot);}}
 else if(['basket','budget'].includes(t.kind)){for(let i=0;i<t.answer.length;i++){let n=t.answer[i];for(const step of t.kind==='budget'?[1000,500,100,5,1]:[1])while(n>=step){await click(page,`j-part:${i}:${step}`);n-=step;}}}
 else if(['choice','journey'].includes(t.kind))await click(page,'j-choice:'+(choice??t.answer));
 else if(t.kind==='coins'){let n=t.answer;for(let p of [5000,2000,1000,500,200,100,50,20,10,5,2,1])while(n>=p){await click(page,'j-coin:'+p);n-=p;}}
 else if(t.kind==='clock'){const h=Math.floor(t.answer/60),m=t.answer%60;await click(page,'j-value:'+h*60);await click(page,'j-value:'+(h*60+Math.floor(m/5)*5));if(m%5)for(let i=1;i<=m%5;i++)await click(page,'j-value:'+(h*60+Math.floor(m/5)*5+i));}
 else if(t.kind==='measure'||t.unit!=='p')await setRange(page,t.answer);
 else {let n=t.answer;for(const p of [5000,2000,1000,500,200,100,50,20,10,5,2,1])while(n>=p){await click(page,'j-adjust:'+p);n-=p;}}
}
const worlds=[['number','2',1,'array'],['fractions','1',1,'order'],['algebra','1',0,'sequence'],['geometry','0',0,'rotate'],['ratio','0',0,'ratio'],['statistics','0',0,'chart'],['probability','2',0,'chance'],['measure','0',0,'measure']];
for(const [world,route,stage,kind] of worlds)test(`${world}: actual model, wrong answer, hint and saved placement`,async({camp})=>{
 const {page,key,read}=camp;await seed(page,key,world,route,stage);let q=(await read()).adventure.active,t=q.tasks[q.i];expect(t.kind).toBe(kind);
 await click(page,'m-submit');expect((await read()).adventure.active.solved).toBe(false);await click(page,'m-help');await expect(page.locator('.feedback')).toBeVisible();
 if(kind==='array')await click(page,`m-array:${t.answer[0]}:${t.answer[1]}`);
 else if(kind==='order'){for(let i=0;i<t.answer.length;i++){await click(page,'h-pick:'+t.answer[i]);await click(page,'h-place:'+i);}}
 else if(kind==='sequence'){await expect(page.getByRole('group',{name:'Loose train carriages'})).toBeVisible();await click(page,'m-value:'+t.answer);}
 else if(kind==='rotate')for(let n=0;n<t.answer;n+=90)await click(page,'m-turn');
 else if(kind==='ratio')await click(page,'m-value:'+t.answer);
 else if(kind==='chart')for(let i=0;i<t.answer.length;i++)await click(page,`m-chart:${i}:${t.answer[i]}`);
 else if(kind==='chance')for(let i=0;i<t.answer;i++)await click(page,'m-select:'+i);
 else await setRange(page,t.answer);
 const exact=(await read()).adventure.active;await page.reload();expect((await read()).adventure.active).toEqual(exact);await click(page,'m-submit');expect((await read()).adventure.active.solved).toBe(true);expect((await read()).checks).toEqual({});
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
 if(world==='algebra')await page.screenshot({path:`tests/artifacts/quality-train-${page.viewportSize().width}.png`,fullPage:true});
});
for(const id of ['cook-pizza','shop-budget','travel-library','job-cafe','errand-post'])test(`${id}: full touch journey, context, decisions and exact reopen`,async({camp})=>{
 const {page,key,read}=camp;await page.evaluate(({key,id})=>{let s=V3Engine.fresh();s.tourSeen=true;V52TownLife.start(s,id,2);localStorage.setItem(key,JSON.stringify(s));},{key,id});await page.reload();
 let count=0;while(!(await run(page,key)).done){const j=await run(page,key),t=j.steps[j.stage];
  if(j.stage===0){await click(page,'j-submit');if(!(await run(page,key)).solved){await click(page,'j-help');await expect(page.locator('.feedback')).toBeVisible();}}
  if((await run(page,key)).solved){await click(page,'j-next');continue;}
  if(id==='travel-library')expect(t.prompt).not.toContain('Reach Library visit');
  if(t.visualContext==='stock')await expect(page.locator('.task-controls')).not.toContainText('£');
  if(j.recipeCard){await page.locator('.recipe-card summary').tap();await expect(page.locator('.recipe-card')).toContainText('190 °C');}
  await answer(page,t,id==='shop-budget'&&t.lunchChoice?t.options.findIndex(o=>o.name.startsWith('Tomato')):undefined);
  if(count===0||['choice','measure','clock'].includes(t.kind)||t.visualContext==='shelves'){const exact=await run(page,key);await page.reload();expect(await run(page,key)).toEqual(exact);}
  await click(page,'j-submit');expect((await run(page,key)).solved,`${id}: ${t.title}`).toBe(true);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
  if(t.visualContext==='shelves'||t.visualContext==='stock')await page.screenshot({path:`tests/artifacts/quality-${id}-${t.visualContext}-${page.viewportSize().width}.png`,fullPage:true});
  await click(page,'j-next');expect(++count).toBeLessThan(25);
 }
 const j=await run(page,key);expect(j.receipts.length).toBeGreaterThan(1);if(id==='shop-budget'){expect(j.decisions.map(d=>d.choice).join(' ')).toContain('Tomato pasta');expect(j.inventory['Rice · bag']).toBe(1);}
 const final=await read();expect(final.coins).toBe(0);expect(final.checks).toEqual({});await page.reload();expect(await run(page,key)).toEqual(j);
});
test('Bolognese starts the full recipe; native iPad jug gesture and price-free cupboards',async({camp})=>{
 const {page,key,read}=camp;await page.evaluate(k=>{const s=V3Engine.fresh();s.tourSeen=true;V5Journey.start(s,'bolognese');localStorage.setItem(k,JSON.stringify(s));},key);await page.reload();
 await expect(page.locator('.recipe-card summary')).toContainText('Spaghetti Bolognese');await expect(page.locator('.kitchen-stock')).toBeVisible();await expect(page.locator('.task-controls')).not.toContainText('£');
 await page.screenshot({path:`tests/artifacts/quality-bolognese-${page.viewportSize().width}.png`,fullPage:true});
 // Separate synthetic state at a measure stage. Interact with the actual range track using touch.
 await page.evaluate(k=>{const s=JSON.parse(localStorage.getItem(k)),j=V52TownLife.state(s);j.stage=j.steps.findIndex(t=>t.kind==='measure');j.completed=Array.from({length:j.stage},(_,i)=>i);j.values={};localStorage.setItem(k,JSON.stringify(s));},key);await page.reload();
 const range=page.locator('[data-model-range]');await range.scrollIntoViewIfNeeded();const box=await range.boundingBox();await page.touchscreen.tap(box.x+box.width*.6,box.y+box.height/2);await expect.poll(async()=>((await run(page,key)).values.amount||0)).toBeGreaterThan(0);const exact=await run(page,key);await page.reload();expect(await run(page,key)).toEqual(exact);
});
test('Mocked cloud keeps immutable pending saves while new Town stock selections reconnect',async({family})=>{
 const page=await family.open('learner'),key=`jaxon_v3_staging:${family.ref}:${family.uid}:game`,queue=key+':queue';await click(page,'skip-tour');await page.locator('nav [data-nav="map"]').tap();await click(page,'world:town');await page.locator('.town-plan-catalog details').filter({has:page.locator('summary',{hasText:'Cooking'})}).locator('summary').tap();await click(page,'j-plan:cook-pasta');
 family.server.loseSave=true;await click(page,'j-part:0:1');await expect.poll(()=>page.evaluate(k=>JSON.parse(localStorage.getItem(k))?.pending?.requestId,queue)).toBeTruthy();const pending=await page.evaluate(k=>JSON.parse(localStorage.getItem(k)).pending,queue);
 await page.context().setOffline(true);await click(page,'j-part:1:1');expect(await page.evaluate(k=>JSON.parse(localStorage.getItem(k)).pending,queue)).toEqual(pending);const exact=await run(page,key);
 await page.context().setOffline(false);await page.evaluate(()=>window.dispatchEvent(new Event('online')));await expect.poll(()=>family.server.progress.adventure?.townLifeV2?.runs[exact.id]?.values).toEqual(exact.values);await page.reload();expect(await run(page,key)).toEqual(exact);
});
test('Balance bundles and old V2 snapshots retain their saved meaning',async({camp})=>{
 const {page,key,read}=camp;await seed(page,key,'algebra','0',0);let q=(await read()).adventure.active,t=q.tasks[0];await expect(page.getByRole('group',{name:'Unit bundles'})).toBeVisible();await click(page,'m-value:'+t.answer);await click(page,'m-submit');expect((await read()).adventure.active.solved).toBe(true);
 const book=require('./fixtures/town-v2-before-quality.json');await page.evaluate(({key,book})=>{const s=V3Engine.fresh();s.tourSeen=true;s.adventure={townLifeV2:book,townActive:2};s.view=s.resumeView='journey';s.world='town';localStorage.setItem(key,JSON.stringify(s));},{key,book});await page.reload();expect((await run(page,key)).steps).toEqual(book.runs[book.active].steps);await expect(page.locator('.shop-counter')).toBeVisible();const exact=await run(page,key);await click(page,'nav:home');await click(page,'continue');expect(await run(page,key)).toEqual(exact);
});
test('A stale range edit cannot overwrite a replacement adventure in another tab',async({camp})=>{
 const {page,context,key,read}=camp;await seed(page,key,'measure','0');
 await page.evaluate(k=>new Promise(held=>{navigator.locks.request(k+':transaction',()=>new Promise(release=>{window.releaseRangeLock=release;held();}));}),key);
 await page.locator('[data-model-range]').evaluate(el=>{el.value='125';el.dispatchEvent(new Event('change',{bubbles:true}));});
 const other=await context.newPage();await other.goto('/v3-adventure.html');await other.evaluate(k=>{const s=V3Engine.fresh();s.tourSeen=true;V3Adventure.start(s,'algebra','0',1);V3Adventure.begin(s);localStorage.setItem(k,JSON.stringify(s));},key);
 await expect(page.getByRole('heading',{name:'Generator engineer',exact:true})).toBeVisible();await page.evaluate(()=>window.releaseRangeLock());await page.waitForFunction(()=>!document.documentElement.hasAttribute('data-saving'));
 const q=(await read()).adventure.active;expect(q.world).toBe('algebra');expect(q.values.amount).toBeUndefined();await other.close();
});
