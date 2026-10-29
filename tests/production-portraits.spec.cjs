// Actual production artifact, fictional intercepted family only. No remote requests continue.
const {test,expect}=require('@playwright/test'),fs=require('node:fs'),crypto=require('node:crypto');
const {fixture,mock}=require('./helpers/cloud-server.cjs'),B=require('../v3/backend-config.js');
const live=process.env.GUIDE_BUILD==='live',site=live?'/staging-fixture-dist/':'/production-test-dist/';
const options=live?{}:{projectRef:B.production.projectRef,projectName:B.production.projectName,identity:{contractVersion:1,ready:true}};
const worlds={number:['Rowan','number-forest'],fractions:['Saff','fraction-desert'],algebra:['Finn','algebra-peaks'],geometry:['Kit','geometry-kingdom'],ratio:['Marin','ratio-island'],statistics:['Ada','statistics-city'],probability:['Nova','probability-portal'],measure:['Flint','measurement-mines'],town:['Ellis','practical-maths-town']};
async function account(p){await p.goto(site);await p.getByLabel('Email',{exact:true}).fill('learner@fictional.invalid');await p.getByLabel('Account password',{exact:true}).fill('fictional-only-password');await p.getByRole('button',{name:'Continue',exact:true}).click()}
for(const [world,[guide,name]] of Object.entries(worlds))test(`${world}: production portrait, alpha, fallback and unchanged world`,async({page:p},info)=>{
 await require("./helpers/starting-profile.cjs").browser(p);const server=fixture(),errors=await mock(p,server,options);await p.emulateMedia({reducedMotion:'reduce'});await account(p);
 server.progress=await p.evaluate(w=>{const s={...V3Engine.fresh(),startingProfile:window.FictionalStartingProfile};s.tourSeen=true;s.settings.motion=false;s.world=w;if(w==='town'){V3Adventure.start(s,'town','gateway',1);s.view='adventure'}else {for(const id of V10Restoration.mapping[w][0])s.discovery[id]={complete:true,rounds:[{band:5,correct:2,total:4}]};V3Engine.startQuest(s,w);}return s},world);
 await p.getByLabel('PIN',{exact:true}).fill('1234');await p.getByRole('button',{name:'Continue',exact:true}).click();
 const panel=p.locator('.panel.guide'),image=panel.locator('.world-guide-portrait');await expect(image).toBeVisible();
 await p.evaluate(()=>Promise.all([...document.images].map(i=>i.decode().catch(()=>{}))));await panel.scrollIntoViewIfNeeded();
 await expect(image).toHaveAttribute('alt',guide+', your guide');await expect(image.locator('..')).toHaveAttribute('data-guide-world',world);
 const response=await p.request.get(site+'v3/assets/world-guide-portraits-preview/'+name+'-guide.webp');expect(await response.body()).toEqual(fs.readFileSync('v3/assets/world-guide-portraits-preview/'+name+'-guide.webp'));
 expect(await p.locator('select[aria-label^="Compare"]').count()).toBe(0);
 const scripts=await p.locator('script[src]').evaluateAll(es=>es.map(e=>e.getAttribute('src')));expect(scripts.some(s=>/painted|preview/.test(s))).toBe(false);
 const scene=p.locator('.world-stage .asset-scene').first(),background=scene.locator(':scope > .scene-background');
 // Compare the decoded background layer, not Chromium's viewport/tile
 // resampling of a fractional-size WebP. Sparse seams occurred with identical
 // source/layout/styles, even at a pinned scroll position. Keep strict bytes,
 // computed visual/layout state, guide rendering and mutation controls separate.
 const backgroundShot=async()=>{
  await p.evaluate(()=>window.scrollTo({top:0,left:0,behavior:'instant'}));
  return Buffer.from(await background.evaluate(async e=>{
   await e.decode();const c=document.createElement('canvas');c.width=e.naturalWidth;c.height=e.naturalHeight;
   const x=c.getContext('2d'),s=getComputedStyle(e);x.filter=s.filter;x.globalAlpha=Number(s.opacity);x.drawImage(e,0,0);
   return c.toDataURL('image/png').split(',')[1];
  }),'base64');
 };
 const backgroundState=()=>background.evaluate(e=>{const r=e.getBoundingClientRect(),c=getComputedStyle(e);return{
  src:e.currentSrc,natural:[e.naturalWidth,e.naturalHeight],viewport:[r.x,r.y,scrollX,scrollY],rect:[r.x+scrollX,r.y+scrollY,r.width,r.height],fit:c.objectFit,objectPosition:c.objectPosition,filter:c.filter,opacity:c.opacity,transform:c.transform,blend:c.mixBlendMode,clip:c.clipPath,mask:c.maskImage,borderRadius:c.borderRadius,imageRendering:c.imageRendering,visibility:c.visibility,shadow:c.boxShadow,ancestors:Array.from((function*(n){while(n){yield n;n=n.parentElement}})(e.parentElement)).map(n=>{const s=getComputedStyle(n);return[n.className,s.filter,s.opacity,s.transform,s.mixBlendMode,s.clipPath,s.maskImage,s.overflow,s.borderRadius,s.backgroundColor,s.visibility,s.boxShadow]})
 }});
 const before=await backgroundShot(),beforeLayout=await backgroundState();
 const stable=()=>p.evaluate(()=>({scene:document.querySelector('.world-stage .asset-scene').outerHTML,avatar:document.querySelector('#headerExplorer').innerHTML,save:Object.entries(localStorage).filter(([k])=>k.endsWith(':game'))}));const state=await stable();
 const dir=(live?'docs/review/live-guide-portraits/':'docs/review/production-guide-portraits/')+info.project.name;fs.mkdirSync(dir,{recursive:true});
 await p.evaluate(()=>document.documentElement.dataset.guidePortraits='previous');await expect(panel.locator('.world-guide-previous')).toBeVisible();await panel.screenshot({path:dir+'/'+world+'-before.png'});
 await p.evaluate(()=>document.documentElement.dataset.guidePortraits='supplied');await expect(image).toBeVisible();expect(await stable()).toEqual(state);const after=await backgroundShot(),afterLayout=await backgroundState();
 expect(afterLayout).toEqual(beforeLayout);
 if(!after.equals(before)){
  await info.attach('world-before',{body:before,contentType:'image/png'});
  await info.attach('world-after',{body:after,contentType:'image/png'});
  await info.attach('world-layout',{body:JSON.stringify({before:beforeLayout,after:afterLayout},null,2),contentType:'application/json'});
 }
 expect(after.equals(before),'Guide toggles must leave the background image pixels identical').toBe(true);
 const geometry=await image.evaluate(e=>{const r=e.getBoundingClientRect(),p=e.closest('.panel.guide').getBoundingClientRect(),h=e.closest('.panel.guide').querySelector('h3').getBoundingClientRect(),s=getComputedStyle(e);const c=document.createElement('canvas');c.width=e.naturalWidth;c.height=e.naturalHeight;const x=c.getContext('2d');x.drawImage(e,0,0);const b=x.getImageData(0,0,c.width,c.height).data;let transparent=0;for(let i=3;i<b.length;i+=4)if(!b[i])transparent++;return{width:r.width,height:r.height,natural:[e.naturalWidth,e.naturalHeight],fit:s.objectFit,inside:r.left>=p.left&&r.right<=p.right&&r.top>=p.top&&r.bottom<=p.bottom,overlap:r.right>h.left,transparent,corners:[3,c.width*4-1,(c.height-1)*c.width*4+3,b.length-1].map(i=>b[i])}});
 expect(geometry).toMatchObject({width:80,height:110,natural:[560,700],fit:'contain',inside:true,overlap:false,corners:[0,0,0,0]});const audit=JSON.parse(fs.readFileSync('v3/assets/world-guide-portraits-preview/manifest.json'));expect(geometry.transparent).toBe(audit.assets.find(a=>a.file===name+'-guide.webp').alpha.transparent);
 expect(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1)).toBe(false);
 await panel.screenshot({path:dir+'/'+world+'-after.png'});await p.screenshot({path:dir+'/'+world+'-context.png'});
 // Regression control: foreground hover changes the old composite capture,
 // while the strict background capture stays equal. A real background edit
 // must still fail the same byte comparison (no tolerance/mask over the image).
 if(world==='ratio'){
  await info.attach('background-before',{body:before,contentType:'image/png'});
  await info.attach('background-after',{body:after,contentType:'image/png'});
  const plain=await backgroundShot();
  await scene.scrollIntoViewIfNeeded();await p.mouse.move(0,0);
  const composite=await scene.screenshot({animations:'disabled'});
  const hit=scene.locator('.world-tool-hit');await hit.hover();await expect(hit).toBeVisible();expect(await hit.evaluate(e=>e.matches(':hover'))).toBe(true);
  expect((await scene.screenshot({animations:'disabled'})).equals(composite)).toBe(false);
  expect((await backgroundShot()).equals(plain)).toBe(true);
  await background.evaluate(e=>e.style.filter='grayscale(1)');
  expect((await backgroundShot()).equals(plain),'A changed background must be detected').toBe(false);
  await background.evaluate(e=>e.style.removeProperty('filter'));
  expect((await backgroundShot()).equals(plain)).toBe(true);
  const originalSource=await background.getAttribute('src');
  await background.evaluate(e=>{const c=document.createElement('canvas');c.width=e.naturalWidth;c.height=e.naturalHeight;const x=c.getContext('2d');x.drawImage(e,0,0);x.fillStyle='#ff00ff';x.fillRect(0,0,1,1);e.src=c.toDataURL('image/png');});
  expect((await backgroundShot()).equals(plain),'A one-pixel background source edit must be detected').toBe(false);
  await background.evaluate((e,src)=>{e.src=src;},originalSource);
  expect((await backgroundShot()).equals(plain)).toBe(true);
  await expect(image).toBeVisible();
 }
 // Real error event restores original markup automatically, without a live art control.
 await image.evaluate(e=>e.src='data:image/webp;base64,invalid');await expect(image).toBeHidden();await expect(panel.locator('.world-guide-previous')).toBeVisible();expect(errors).toEqual([]);
 fs.writeFileSync(dir+'/'+world+'-checks.json',JSON.stringify({world,guide,geometry,captureScope:'decoded background pixels plus filter/opacity; strict layout/ancestor styles and foreground controls checked separately',backgroundPixelsUnchanged:true,backgroundLayout:afterLayout,backgroundSHA256:crypto.createHash('sha256').update(before).digest('hex')},null,2));
});
for(const [name,identity,receipt,error] of (live?[]:[
 ['wrong project',{projectRef:'wrong'},1,false],['wrong name',{name:'wrong'},1,false],['unready',{ready:false},1,false],['wrong contract',{contractVersion:0},1,false],['missing receipt',{},0,false],['identity RPC error',{},1,true]
]))test('production identity refuses '+name,async({page:p})=>{
 const server=fixture();server.receiptVersion=receipt;await mock(p,server,{...options,identity:{...options.identity,...identity}});
 if(error)await p.route('**/rest/v1/rpc/v3_identity',r=>r.fulfill({status:503,contentType:'application/json',body:JSON.stringify({message:'fictional unavailable'})}));
 await p.goto(site);await expect(p.getByRole('heading',{name:'Family service is unavailable'})).toBeVisible();await expect(p.getByLabel('Account password',{exact:true})).toHaveCount(0);
});
