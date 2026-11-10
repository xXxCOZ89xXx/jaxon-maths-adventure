const {test,expect}=require('@playwright/test'),fs=require('node:fs');
const F=require('./helpers/guided-progression.cjs'),{fixture,mock}=require('./helpers/cloud-server.cjs');
const origin='http://127.0.0.1:4173',copy=x=>JSON.parse(JSON.stringify(x));
const settled=p=>p.waitForFunction(()=>!document.documentElement.hasAttribute('data-saving'));
async function action(p,a){const selector=`[data-action="${a}"]:visible`,d=p.locator('dialog[open]');await(await d.count()&&await d.locator(selector).count()?d.locator(selector):p.locator(selector)).first().tap();await settled(p);}
async function compartment(p,name){const d=p.locator('.immersive-journey dialog[open]');if(await d.count())await d.locator('[data-scene-close]').tap();await p.locator(`[data-scene-open="${name}"]`).first().tap();}
const run=s=>F.L.state(s);
function preserved(s){return copy({completed:Object.values(s.adventure.townLifeV2.runs).find(r=>r.scenario==='cook-pasta'&&r.done),skills:s.skills,checks:s.checks,startingProfile:s.startingProfile,bought:s.bought,equipped:s.equipped,customFuture:s.customFuture});}
async function launch(p,build){
 const state=F.completedTown(),errors=[],external=[];let key,server,mockErrors=[];
 p.on('pageerror',e=>errors.push(e.message));
 if(build==='private'){
  server=fixture();server.progress=state;mockErrors=await mock(p,server);
  await p.goto('/staging-fixture-dist/');await p.getByLabel('Email',{exact:true}).fill('learner@fictional.invalid');await p.getByLabel('Account password',{exact:true}).fill('fictional-only-password');await p.getByRole('button',{name:'Continue',exact:true}).tap();await p.getByLabel('PIN',{exact:true}).fill('1234');await p.getByRole('button',{name:'Continue',exact:true}).tap();await expect(p.locator('#main h1')).toHaveText('Base Camp');key=await p.evaluate(()=>V3CloudContext.key);
 }else{
  key='jaxon_public_demo_v1';await p.route('**/*',r=>{if(new URL(r.request().url()).origin===origin)return r.continue();external.push(r.request().url());return r.abort();});
  await p.addInitScript(({key,state})=>{if(!sessionStorage.getItem('cooking-fixture')){localStorage.setItem(key,JSON.stringify(state));sessionStorage.setItem('cooking-fixture','1');}},{key,state});
  await p.goto('/demo-dist/');expect(await p.evaluate(()=>typeof window.V3CloudContext)).toBe('undefined');
 }
 const read=async()=>{await settled(p);return p.evaluate(k=>JSON.parse(localStorage.getItem(k)),key);};
 const baseline=preserved(await read());expect(baseline.completed?.done).toBe(true);await action(p,'world:town');await action(p,'j-start:bolognese');await compartment(p,'pantry');
 return{key,server,read,baseline,verify:async()=>{expect(errors).toEqual([]);expect(mockErrors).toEqual([]);expect(external).toEqual([]);expect(preserved(await read())).toEqual(baseline);expect(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);if(build==='demo'){expect(await p.evaluate(()=>Object.keys(localStorage))).toEqual([key]);expect(await p.context().cookies()).toEqual([]);}}};
}
async function shot(p,info,build,name){const dir=`work/cooking-recovery/${process.env.COOKING_BEFORE?'before':'after'}/${build}/${info.project.name}`;fs.mkdirSync(dir,{recursive:true});const storage=p.locator('dialog[open] .storage-closeup');await storage.locator('img').evaluateAll(images=>Promise.all(images.map(i=>i.decode())));await storage.screenshot({path:dir+'/'+name+'.png'});}
for(const build of ['private','demo']){
 test(`Cooking recovery: ${build} pantry/fridge controls do not overlap and support touch and keyboard`,async({page:p},info)=>{
  const f=await launch(p,build);
  for(const name of ['pantry','fridge']){
   if(name!=='pantry')await compartment(p,name);await shot(p,info,build,name);
   const rows=await p.locator('dialog[open] .live-stock-item').evaluateAll(els=>els.map(e=>e.getBoundingClientRect().toJSON()));
   for(let i=0;i<rows.length-1;i++)expect(rows[i].bottom<=rows[i+1].top,'Ingredient rows must not cover one another').toBe(true);
   const button=p.locator('dialog[open] .stock-pick').first(),a=await button.getAttribute('data-action'),index=Number(a.split(':')[1]),before=run(await f.read()).values.parts?.[index]||0;
   const b=await button.boundingBox();expect(b.width).toBeGreaterThanOrEqual(44);expect(b.height).toBeGreaterThanOrEqual(44);
   await button.tap();expect(run(await f.read()).values.parts[index]).toBe(before+1);
   await p.locator(`dialog[open] [data-action="${a}"]`).first().focus();await p.keyboard.press('Enter');await settled(p);expect(run(await f.read()).values.parts[index]).toBe(before+2);
   await action(p,`j-part:${index}:-1`);expect(run(await f.read()).values.parts[index]).toBe(before+1);
  }
  const saved=copy(run(await f.read()));await action(p,'pause-explore');await p.reload();await action(p,'resume-saved:town:'+encodeURIComponent(saved.id));expect(run(await f.read())).toEqual(saved);await f.verify();
 });
 test(`Cooking recovery: ${build} offline edits survive reconnect, reload and exact pause/resume`,async({page:p})=>{
  const f=await launch(p,build),queue=f.key+':queue';if(f.server)f.server.loseSave=true;
  await action(p,'j-part:0:1');let pending;
  if(f.server){await p.evaluate(()=>window.dispatchEvent(new Event('online')));await expect.poll(()=>p.evaluate(k=>JSON.parse(localStorage.getItem(k))?.pending?.requestId,queue)).toBeTruthy();pending=await p.evaluate(k=>JSON.parse(localStorage.getItem(k)).pending,queue);}
  await p.context().setOffline(true);await action(p,'j-part:0:1');
  if(f.server)expect(await p.evaluate(k=>JSON.parse(localStorage.getItem(k)).pending,queue)).toEqual(pending);
  const saved=copy(run(await f.read()));await p.context().setOffline(false);await p.reload();
  if(f.server)await expect.poll(()=>p.evaluate(k=>JSON.parse(localStorage.getItem(k)).pending,queue)).toBeNull();
  expect(run(await f.read())).toEqual(saved);await action(p,'pause-explore');await p.reload();await action(p,'resume-saved:town:'+encodeURIComponent(saved.id));expect(run(await f.read())).toEqual(saved);await f.verify();
 });
 test(`Cooking recovery: ${build} repeated ingredient taps save immediately and exit flushes without resetting progress`,async({page:p})=>{
  const f=await launch(p,build),initial=f.server?.calls.filter(c=>c.body?.p_operation==='save').length;
  for(let i=0;i<3;i++)await action(p,'j-part:0:1');const saved=copy(run(await f.read()));expect(saved.values.parts[0]).toBe(3);
  if(f.server)expect(f.server.calls.filter(c=>c.body?.p_operation==='save').length-initial).toBeLessThanOrEqual(1);
  await action(p,'nav:home');if(f.server)await expect.poll(()=>run(f.server.progress)?.values?.parts?.[0]).toBe(3);
  await p.reload();await action(p,'resume-saved:town:'+encodeURIComponent(saved.id));expect(run(await f.read())).toEqual(saved);await f.verify();
 });
}
