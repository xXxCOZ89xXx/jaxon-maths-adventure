// Actual production artifact, fictional intercepted family only. No remote requests continue.
const {test,expect}=require('@playwright/test'),fs=require('node:fs'),crypto=require('node:crypto');
const {fixture,mock}=require('./helpers/cloud-server.cjs'),B=require('../v3/backend-config.js');
const live=process.env.GUIDE_BUILD==='live',site=live?'/staging-fixture-dist/':'/production-test-dist/';
const options=live?{}:{projectRef:B.production.projectRef,projectName:B.production.projectName,identity:{contractVersion:1,ready:true}};
const worlds={number:['Rowan','number-forest'],fractions:['Saff','fraction-desert'],algebra:['Finn','algebra-peaks'],geometry:['Kit','geometry-kingdom'],ratio:['Marin','ratio-island'],statistics:['Ada','statistics-city'],probability:['Nova','probability-portal'],measure:['Flint','measurement-mines'],town:['Ellis','practical-maths-town']};
async function account(p){await p.goto(site);await p.getByLabel('Email',{exact:true}).fill('learner@fictional.invalid');await p.getByLabel('Account password',{exact:true}).fill('fictional-only-password');await p.getByRole('button',{name:'Continue',exact:true}).click()}
for(const [world,[guide,name]] of Object.entries(worlds))test(`${world}: production portrait, alpha, fallback and unchanged world`,async({page:p},info)=>{
 const server=fixture(),errors=await mock(p,server,options);await p.emulateMedia({reducedMotion:'reduce'});await account(p);
 server.progress=await p.evaluate(w=>{const s=V3Engine.fresh();s.tourSeen=true;s.settings.motion=false;s.world=w;if(w==='town'){V3Adventure.start(s,'town','gateway',1);s.view='adventure'}else V3Engine.startQuest(s,w);return s},world);
 await p.getByLabel('PIN',{exact:true}).fill('1234');await p.getByRole('button',{name:'Continue',exact:true}).click();
 const panel=p.locator('.panel.guide'),image=panel.locator('.world-guide-portrait');await expect(image).toBeVisible();
 await p.evaluate(()=>Promise.all([...document.images].map(i=>i.decode().catch(()=>{}))));await panel.scrollIntoViewIfNeeded();
 await expect(image).toHaveAttribute('alt',guide+', your guide');await expect(image.locator('..')).toHaveAttribute('data-guide-world',world);
 const response=await p.request.get(site+'v3/assets/world-guide-portraits-preview/'+name+'-guide.webp');expect(await response.body()).toEqual(fs.readFileSync('v3/assets/world-guide-portraits-preview/'+name+'-guide.webp'));
 expect(await p.locator('select[aria-label^="Compare"]').count()).toBe(0);
 const scripts=await p.locator('script[src]').evaluateAll(es=>es.map(e=>e.getAttribute('src')));expect(scripts.some(s=>/painted|preview/.test(s))).toBe(false);
 const scene=p.locator('.world-stage .asset-scene').first();const before=await scene.screenshot({animations:'disabled'});
 const stable=()=>p.evaluate(()=>({scene:document.querySelector('.world-stage .asset-scene').outerHTML,avatar:document.querySelector('#headerExplorer').innerHTML,save:Object.entries(localStorage).filter(([k])=>k.endsWith(':game'))}));const state=await stable();
 const dir=(live?'docs/review/live-guide-portraits/':'docs/review/production-guide-portraits/')+info.project.name;fs.mkdirSync(dir,{recursive:true});
 await p.evaluate(()=>document.documentElement.dataset.guidePortraits='previous');await expect(panel.locator('.world-guide-previous')).toBeVisible();await panel.screenshot({path:dir+'/'+world+'-before.png'});
 await p.evaluate(()=>document.documentElement.dataset.guidePortraits='supplied');await expect(image).toBeVisible();expect(await stable()).toEqual(state);expect((await scene.screenshot({animations:'disabled'})).equals(before)).toBe(true);
 const geometry=await image.evaluate(e=>{const r=e.getBoundingClientRect(),p=e.closest('.panel.guide').getBoundingClientRect(),h=e.closest('.panel.guide').querySelector('h3').getBoundingClientRect(),s=getComputedStyle(e);const c=document.createElement('canvas');c.width=e.naturalWidth;c.height=e.naturalHeight;const x=c.getContext('2d');x.drawImage(e,0,0);const b=x.getImageData(0,0,c.width,c.height).data;let transparent=0;for(let i=3;i<b.length;i+=4)if(!b[i])transparent++;return{width:r.width,height:r.height,natural:[e.naturalWidth,e.naturalHeight],fit:s.objectFit,inside:r.left>=p.left&&r.right<=p.right&&r.top>=p.top&&r.bottom<=p.bottom,overlap:r.right>h.left,transparent,corners:[3,c.width*4-1,(c.height-1)*c.width*4+3,b.length-1].map(i=>b[i])}});
 expect(geometry).toMatchObject({width:80,height:110,natural:[560,700],fit:'contain',inside:true,overlap:false,corners:[0,0,0,0]});const audit=JSON.parse(fs.readFileSync('v3/assets/world-guide-portraits-preview/manifest.json'));expect(geometry.transparent).toBe(audit.assets.find(a=>a.file===name+'-guide.webp').alpha.transparent);
 expect(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1)).toBe(false);
 await panel.screenshot({path:dir+'/'+world+'-after.png'});await p.screenshot({path:dir+'/'+world+'-context.png'});
 // Real error event restores original markup automatically, without a live art control.
 await image.evaluate(e=>e.src='data:image/webp;base64,invalid');await expect(image).toBeHidden();await expect(panel.locator('.world-guide-previous')).toBeVisible();expect(errors).toEqual([]);
 fs.writeFileSync(dir+'/'+world+'-checks.json',JSON.stringify({world,guide,geometry,backgroundPixelsUnchanged:true,backgroundSHA256:crypto.createHash('sha256').update(before).digest('hex')},null,2));
});
for(const [name,identity,receipt,error] of (live?[]:[
 ['wrong project',{projectRef:'wrong'},1,false],['wrong name',{name:'wrong'},1,false],['unready',{ready:false},1,false],['wrong contract',{contractVersion:0},1,false],['missing receipt',{},0,false],['identity RPC error',{},1,true]
]))test('production identity refuses '+name,async({page:p})=>{
 const server=fixture();server.receiptVersion=receipt;await mock(p,server,{...options,identity:{...options.identity,...identity}});
 if(error)await p.route('**/rest/v1/rpc/v3_identity',r=>r.fulfill({status:503,contentType:'application/json',body:JSON.stringify({message:'fictional unavailable'})}));
 await p.goto(site);await expect(p.getByRole('heading',{name:'Family service is unavailable'})).toBeVisible();await expect(p.getByLabel('Account password',{exact:true})).toHaveCount(0);
});
