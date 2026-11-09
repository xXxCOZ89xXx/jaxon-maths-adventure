const {test,expect}=require('@playwright/test'),fs=require('node:fs');
const F=require('./helpers/guided-progression.cjs'),{fixture,mock}=require('./helpers/cloud-server.cjs');
const origin='http://127.0.0.1:4173',copy=x=>JSON.parse(JSON.stringify(x));
const settled=p=>p.waitForFunction(()=>!document.documentElement.hasAttribute('data-saving'));
async function press(p,selector){const dialog=p.locator('dialog[open]'),inside=dialog.locator(selector).filter({visible:true});const b=await dialog.count()&&await inside.count()?inside.first():p.locator(selector).filter({visible:true}).first();if(p.touch)await b.tap();else await b.click();await settled(p);}
async function launch(p,build,state){
 let key,errors=[],external=[],mockErrors=[];p.on('pageerror',e=>errors.push(e.message));
 if(build==='private'){
  const server=fixture();server.progress=state;mockErrors=await mock(p,server);await p.goto('/staging-fixture-dist/');
  await p.getByLabel('Email',{exact:true}).fill('learner@fictional.invalid');await p.getByLabel('Account password',{exact:true}).fill('fictional-only-password');await p.getByRole('button',{name:'Continue',exact:true}).click();await p.getByLabel('PIN',{exact:true}).fill('1234');await p.getByRole('button',{name:'Continue',exact:true}).click();await p.waitForFunction(()=>!!window.V3CloudContext);key=await p.evaluate(()=>V3CloudContext.key);
 }else{
  key=process.env.AREA_BEFORE?'jaxon_v3_fictional_demo_2026':'jaxon_public_demo_v1';
  await p.route('**/*',r=>{if(new URL(r.request().url()).origin===origin)return r.continue();external.push(r.request().url());return r.abort();});
  await p.addInitScript(({key,state})=>{if(!sessionStorage.getItem('area-fixture')){localStorage.setItem(key,JSON.stringify(state));sessionStorage.setItem('area-fixture','1');}},{key,state});
  await p.goto(process.env.AREA_BEFORE?'/work/area-baseline/v3-adventure.html':'/demo-dist/');
 }
 const read=async()=>{await settled(p);return p.evaluate(k=>JSON.parse(localStorage.getItem(k)),key);};
 return{read,verify:async()=>{expect(errors).toEqual([]);expect(mockErrors).toEqual([]);expect(external).toEqual([]);if(build==='demo'&&!process.env.AREA_BEFORE){expect(await p.evaluate(()=>typeof V3CloudContext)).toBe('undefined');expect(await p.evaluate(()=>Object.keys(localStorage))).toEqual([key]);}}};
}
async function overview(p,world){await expect(p.locator('#main h1')).toHaveText(F.E.worlds.find(w=>w.id===world).name);await expect(p.locator('.world-route-map')).toHaveCount(1);await expect(p.locator(world==='town'?'.world-route-map .town-explore-map':'.world-route-map>.hero-art>.world-scene')).toHaveCount(1);if(world==='town')await expect(p.locator('.world-route-map>.hero-art')).toHaveCount(0);await expect(p.locator('.world-overview .restoration-regions')).toHaveCount(0);await expect(p.locator('.mission-board .town-explore-map')).toHaveCount(0);await expect(p.locator('.repair-entry summary')).toBeVisible();expect(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);}
async function shot(p,info,build,world){await p.locator('.world-overview img').evaluateAll(imgs=>Promise.all(imgs.map(i=>i.decode())));const dir=`work/area-maps/${process.env.AREA_BEFORE?'before':'after'}/${build}/${info.project.name}`;fs.mkdirSync(dir,{recursive:true});await p.locator('.world-overview').evaluate(e=>window.scrollTo(0,e.getBoundingClientRect().top+scrollY-70));await p.screenshot({path:`${dir}/${world}.jpg`,type:'jpeg',quality:70,animations:'disabled'});}
for(const build of (process.env.AREA_BEFORE?['demo']:['private','demo']))for(const world of Object.keys(F.R.mapping))test(`${build} ${world}: one map, gates, playable repair, exact resume and completed recap`,async({page:p,browser},info)=>{
 const contexts=[];try{
 p.touch=!!info.project.use.hasTouch;await p.emulateMedia({reducedMotion:'reduce'});
 const s=F.fresh();s.world=world;s.view='world';let f=await launch(p,build,s);
 async function scenario(state){await f.verify();const c=await browser.newContext({baseURL:origin,viewport:info.project.use.viewport,hasTouch:!!info.project.use.hasTouch,isMobile:!!info.project.use.isMobile});contexts.push(c);p=await c.newPage();p.touch=!!info.project.use.hasTouch;f=await launch(p,build,state);}
 if(process.env.AREA_BEFORE){await shot(p,info,build,world);return;}
 await overview(p,world);await shot(p,info,build,world);
 const before=await f.read();await press(p,'.repair-entry summary');await expect(p.locator('.restoration-path')).toBeVisible();await expect(p.locator('.restoration-path')).toContainText('Before this stage:');await expect(p.locator('.restoration-path [data-action^="restore:"]')).toHaveCount(0);expect((await f.read()).discovery).toEqual(before.discovery);
 // Existing assessment gates still reject starting a locked stage.
 expect(await p.evaluate(w=>V10Restoration.start(JSON.parse(localStorage.getItem(window.V3CloudContext?.key||'jaxon_public_demo_v1')),w,0),world)).toContain('starting point');
 // Use a fictional assessed snapshot; never touch a real account or service.
 const assessed=F.restoration(world),q=F.M.current(assessed);F.M.begin(assessed);q.values.c8={draft:q.tasks[0].answer};expect(F.M.submit(assessed)).toBe(true);F.M.next(assessed);const saved=copy(F.M.current(assessed));
 await scenario(assessed);
 await press(p,'[data-action="pause-explore"]');await overview(p,world);expect((await f.read()).adventure.active).toEqual(saved);await p.reload();await overview(p,world);
 await press(p,'.repair-entry summary');await press(p,`[data-action="restore:${world}:0"]`);expect((await f.read()).adventure.active).toEqual(saved);
 await press(p,'[data-world-task-open]');await press(p,'dialog[open] [data-action="m-begin"]');
 await p.locator('dialog[open] .c8-input').fill(saved.tasks[1].answer);await press(p,'dialog[open] [data-action="m-submit"]');await expect.poll(async()=>(await f.read()).adventure.active.i).toBe(2);
 await press(p,'[data-action="pause-explore"]');await overview(p,world);
 const completed=F.restoration(world);while(F.M.current(completed)){const q=F.M.current(completed);F.M.begin(completed);const t=q.tasks[q.i];q.values.c8=t.activity?.kind==='choice'?{choice:Number(t.answer)}:{draft:t.answer};if(!F.M.submit(completed))throw Error('Invalid completion fixture');F.M.next(completed);}
 const record=copy(completed.restoration.completed[world+':0']);completed.view='world';
 await scenario(completed);await overview(p,world);await press(p,'.repair-entry summary');await press(p,`[data-action="restore:${world}:0"]`);await expect(p.locator('.recap')).toContainText('restoration stage is complete');expect((await f.read()).restoration.completed[world+':0']).toEqual(record);
 await press(p,`[data-action="world:${world}"]`);await overview(p,world);await p.reload();expect((await f.read()).restoration.completed[world+':0']).toEqual(record);expect((await f.read()).customFuture).toEqual(s.customFuture);await f.verify();
 }finally{for(const c of contexts)await c.close();}
});

if(!process.env.AREA_BEFORE)for(const build of ['private','demo'])test(build+': pausing a check keeps its destination and an existing repair snapshot',async({page:p},info)=>{
 p.touch=!!info.project.use.hasTouch;const s=F.restoration('number'),repair=copy(F.M.current(s));s.view=s.resumeView='check';s.practice.place={completed:true};s.checks.place={stage:0,due:0,reteach:false};s.learning={id:'place',mode:'check',qs:[['Saved question','4',['4','5','6','7'],'Use place value.','Four.']],i:0,correct:0,answers:[],responses:[],assisted:false,answered:false,started:true,manipulation:{amount:9}};
 const f=await launch(p,build,s);await press(p,'[data-action="pause-explore"]');await expect(p.locator('#main h1')).toHaveText('Base Camp');const actual=await f.read();expect(actual.adventure.active).toEqual(repair);expect(actual.pausedLearning['place|check'].qs).toEqual(s.learning.qs);expect(actual.pausedLearning['place|check'].manipulation).toEqual(s.learning.manipulation);await f.verify();
});
