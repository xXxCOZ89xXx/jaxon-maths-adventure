const {test,expect}=require('@playwright/test'),fs=require('node:fs');
const F=require('./helpers/guided-progression.cjs'),{fixture,mock}=require('./helpers/cloud-server.cjs');
const kinds=['post','recycling','meters'],origin='http://127.0.0.1:4173';
const settled=p=>p.waitForFunction(()=>!document.documentElement.hasAttribute('data-saving'));
async function click(p,action){const selector=`[data-action="${action}"]:visible`,dialog=p.locator('dialog[open]');const target=(await dialog.count()&&await dialog.locator(selector).count()?dialog.locator(selector):p.locator(selector)).first();if(p.homeTouch)await target.tap();else await target.click();await settled(p);}
async function open(p){const d=p.locator('.world-task-dialog');if(await d.count()&&!await d.isVisible())await p.locator('[data-world-task-open]').first().click();}
async function shot(p,info,build,name,selector='#main'){const dir=`work/home-exterior/${process.env.HOME_BEFORE?'before':'after'}/${build}/${info.project.name}`;fs.mkdirSync(dir,{recursive:true});await p.locator(selector).locator('img').evaluateAll(images=>Promise.all(images.map(i=>i.decode())));await p.locator(selector).screenshot({path:dir+'/'+name+'.png'});}
for(const build of ['private','demo'])test(`${build}: Home selection, all six transitions, pause and completion`,async({page:p},info)=>{
 const errors=[],external=[];p.homeTouch=!!info.project.use.hasTouch;p.on('pageerror',e=>errors.push(e.message));
 let key,server,mockErrors=[];
 if(build==='private'){
  server=fixture();server.progress=F.fresh();mockErrors=await mock(p,server);
  await p.goto(process.env.HOME_BEFORE?'/work/home-baseline/private/':'/staging-fixture-dist/');await p.getByLabel('Email',{exact:true}).fill('learner@fictional.invalid');await p.getByLabel('Account password',{exact:true}).fill('fictional-only-password');await p.getByRole('button',{name:'Continue',exact:true}).click();await p.getByLabel('PIN',{exact:true}).fill('1234');await p.getByRole('button',{name:'Continue',exact:true}).click();await expect(p.locator('#main h1')).toHaveText('Base Camp');
  key=await p.evaluate(()=>V3CloudContext.key);
 }else{
  await p.route('**/*',r=>{if(new URL(r.request().url()).origin===origin)return r.continue();external.push(r.request().url());return r.abort();});await p.goto(process.env.HOME_BEFORE?'/work/home-baseline/source/demo-dist/':'/demo-dist/');await click(p,'skip-tour');key='jaxon_public_demo_v1';expect(await p.evaluate(()=>typeof V3CloudContext)).toBe('undefined');
 }
 const read=async()=>{await settled(p);return p.evaluate(k=>JSON.parse(localStorage.getItem(k)),key);};
 await click(p,'world:town');await shot(p,info,build,'exterior','.home-activity-board');
 if(process.env.HOME_BEFORE){for(const kind of kinds){await click(p,'home-activity:'+kind);await shot(p,info,build,kind,'.immersive-mission');const actual=(await read()).adventure.active.context.homeActivity;console.log('BASELINE',build,kind,'opened',actual);await click(p,'world:town');}return;}
 await expect(p.locator('.home-exterior-selector [data-home-hotspot]')).toHaveCount(3);
 await p.keyboard.press('Tab');
 for(const h of await p.locator('[data-home-hotspot]').all()){await h.scrollIntoViewIfNeeded();const b=await h.boundingBox();expect(b.width).toBeGreaterThanOrEqual(44);expect(b.height).toBeGreaterThanOrEqual(44);expect(await h.getAttribute('aria-label')).toBeTruthy();await h.focus();expect(await h.evaluate(e=>e.matches(':focus-visible'))).toBe(true);expect(await h.evaluate(e=>getComputedStyle(e).outlineWidth)).toBe('4px');}
 const boxes=await p.locator('[data-home-hotspot]').evaluateAll(items=>items.map(e=>e.getBoundingClientRect().toJSON()));
 for(let i=0;i<boxes.length;i++)for(let j=i+1;j<boxes.length;j++){const a=boxes[i],b=boxes[j];expect(a.right<=b.left||b.right<=a.left||a.bottom<=b.top||b.bottom<=a.top,'Touch targets must not overlap').toBe(true);}
 // Keyboard alternative below the scene uses exactly the same actions.
 for(const kind of kinds){await p.locator('.home-accessible summary').press('Enter');await p.locator(`.home-accessible [data-action="home-activity:${kind}"]`).focus();await p.keyboard.press('Enter');await settled(p);expect((await read()).adventure.active.context.homeActivity).toBe(kind);await click(p,'home-exterior');}
 const initial=await read();
 for(const from of kinds)for(const to of kinds.filter(k=>k!==from)){
  await click(p,'home-activity:'+from);await open(p);if((await read()).adventure.active.phase==='lesson')await click(p,'m-begin');await click(p,'m-help');
  const old=structuredClone((await read()).adventure.active);
  await p.locator('.world-task-close').click();await click(p,'home-activity:'+to);
  expect((await read()).adventure.active.context.homeActivity).toBe(to);
  await expect(p.locator('.world-task-dialog')).toBeVisible();
  expect(JSON.parse(await p.locator('.world-task-dialog').getAttribute('data-world-scope'))[2]).toBe((await read()).adventure.active.key);
  await p.locator('.world-task-close').click();
  await shot(p,info,build,to,'.immersive-mission');
  await click(p,'pause-explore');await p.reload();await settled(p);
  await click(p,'resume-saved:mission:'+encodeURIComponent(old.key));expect((await read()).adventure.active).toEqual(old);
  await click(p,'home-exterior');await expect(p.locator('.home-exterior-selector')).toBeVisible();await p.reload();await click(p,'home-activity:'+to);expect((await read()).adventure.active.context.homeActivity).toBe(to);
  await click(p,'home-exterior');
 }
 // Finish each activity through real visible controls, then select both alternatives.
 for(const kind of kinds){
  await click(p,'home-activity:'+kind);
  while((await read()).view==='adventure'){
   await open(p);const q=(await read()).adventure.active,t=q.tasks[q.i];if(q.phase==='lesson')await click(p,'m-begin');
   await shot(p,info,build,kind+'-activity','dialog[open]');
   if(['order','match'].includes(t.kind)){for(let i=0;i<t.answer.length;i++){await click(p,'h-pick:'+t.answer[i]);await click(p,'h-place:'+i);}}
   else if(t.kind==='choice'){await click(p,'m-choice:'+t.answer);}
   else if(t.kind==='coins'){for(const coin of require('../v3/town').V3Town.moneyTokens(t.answer))await click(p,'m-coin:'+coin);}
   else if(t.unit==='p'){for(const coin of require('../v3/town').V3Town.moneyTokens(t.answer))await click(p,'m-adjust:'+coin);}
   else{const input=p.locator('dialog[open] [data-numeric-answer]');if(await input.count())await input.fill(String(t.answer));else await p.locator('dialog[open] [data-model-range]').evaluate((e,n)=>{e.value=String(n);e.dispatchEvent(new Event('change',{bubbles:true}));},t.answer);await settled(p);}
   if(t.kind!=='choice')await click(p,'m-submit');await require('./helpers/progression.cjs').advance(p);
  }
  expect((await read()).view).toBe('recap');const records=structuredClone((await read()).adventure.records);
  await click(p,'world:town');for(const other of kinds.filter(k=>k!==kind)){await click(p,'home-activity:'+other);expect((await read()).adventure.active.context.homeActivity).toBe(other);expect((await read()).adventure.records).toEqual(records);await click(p,'home-exterior');}
 }
 const end=await read();expect(end.skills).toEqual(initial.skills);expect(end.bought).toEqual(initial.bought);expect(end.equipped).toEqual(initial.equipped);
 expect(errors).toEqual([]);expect(mockErrors).toEqual([]);expect(external).toEqual([]);expect(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
 if(build==='demo'){expect(await p.evaluate(()=>Object.keys(localStorage))).toEqual([key]);expect(await p.context().cookies()).toEqual([]);}
});
