// Real offline UI; only fictional browser contexts; all external origins denied.
const {test,expect}=require('@playwright/test'),fs=require('node:fs'),crypto=require('node:crypto');
const KEY='jaxon_v3_fictional_demo_2026',url='/preview-dist/PLAY-V3.html';
const out='docs/review/world-guide-portraits';
const worlds={number:['Rowan','number-forest'],fractions:['Saff','fraction-desert'],algebra:['Finn','algebra-peaks'],geometry:['Kit','geometry-kingdom'],ratio:['Marin','ratio-island'],statistics:['Ada','statistics-city'],probability:['Nova','probability-portal'],measure:['Flint','measurement-mines'],town:['Ellis','practical-maths-town']};
async function loaded(p){await p.locator('#main h1').waitFor();await p.evaluate(()=>Promise.all([...document.images].map(i=>i.decode().catch(()=>{}))));await expect(p.locator('html')).not.toHaveAttribute('data-saving');}
test.beforeEach(async({page:p})=>{p.artErrors=[];p.external=[];p.on('pageerror',e=>p.artErrors.push(e.message));p.on('console',m=>{if(m.type()==='error')p.artErrors.push(m.text())});await p.route('**/*',r=>{if(new URL(r.request().url()).origin==='http://127.0.0.1:4173')return r.continue();p.external.push(r.request().url());return r.abort()});await p.emulateMedia({reducedMotion:'reduce'});await p.goto(url);await loaded(p)});
test.afterEach(async({page:p})=>{expect(p.artErrors).toEqual([]);expect(p.external).toEqual([])});
for(const [world,[guide,name]] of Object.entries(worlds))test(`${world}: correct primary guide, uncropped transparent panel, unchanged backgrounds and save`,async({page:p},info)=>{
 await p.evaluate(({world,key})=>{const s=V3Engine.fresh();s.tourSeen=true;s.settings.motion=false;s.world=world;if(world==='town'){V3Adventure.start(s,'town','gateway',1);s.view='adventure'}else V3Engine.startQuest(s,world);localStorage.setItem(key,JSON.stringify(s))},{world,key:KEY});await p.reload();await loaded(p);
 const panel=p.locator('.panel.guide'),portrait=panel.locator('.world-guide-portrait');
 await expect(portrait).toHaveAttribute('alt',guide+', your guide');await expect(portrait.locator('..')).toHaveAttribute('data-guide-world',world);
 expect(await portrait.getAttribute('src')).toBe(await p.evaluate(w=>WorldGuidePortraitFiles[w],world));
 const select=p.getByRole('combobox',{name:'Compare guide portraits'}),scene=p.locator('.world-stage .asset-scene').first();
 await select.selectOption('previous');await panel.scrollIntoViewIfNeeded();
 const stable=()=>p.evaluate(key=>({save:localStorage.getItem(key),header:document.querySelector('#headerExplorer').innerHTML,scene:document.querySelector('.world-stage .asset-scene').outerHTML}),KEY);
 const bounds=()=>panel.evaluate(e=>{const r=e.getBoundingClientRect();return{x:r.x+scrollX,y:r.y+scrollY,width:r.width,height:r.height}});
 const before=await stable(),sceneBefore=await scene.screenshot({animations:'disabled'}),box=await bounds();
 const dir=`${out}/${info.project.name}`;fs.mkdirSync(dir,{recursive:true});
 await panel.screenshot({path:`${dir}/${world}-before.png`,animations:'disabled'});
 await select.selectOption('supplied');await panel.scrollIntoViewIfNeeded();await expect(portrait).toBeVisible();await expect(panel.locator('.world-guide-previous')).toBeHidden();
 expect(await stable()).toEqual(before);expect(await bounds()).toEqual(box);
 const sceneAfter=await scene.screenshot({animations:'disabled'});expect(sceneAfter.equals(sceneBefore),'Background/player pixels must be identical when switching portraits').toBe(true);
 const geometry=await portrait.evaluate(e=>{const r=e.getBoundingClientRect(),p=e.closest('.panel.guide').getBoundingClientRect(),h=e.closest('.panel.guide').querySelector('h3').getBoundingClientRect(),c=getComputedStyle(e);return{width:r.width,height:r.height,natural:[e.naturalWidth,e.naturalHeight],fit:c.objectFit,background:c.backgroundColor,inside:r.left>=p.left&&r.top>=p.top&&r.right<=p.right&&r.bottom<=p.bottom,overlap:r.right>h.left}});
 expect(geometry).toEqual({width:80,height:110,natural:[560,700],fit:'contain',background:'rgba(0, 0, 0, 0)',inside:true,overlap:false});
 expect(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1)).toBe(false);
 await panel.screenshot({path:`${dir}/${world}-after.png`,animations:'disabled'});
 await p.screenshot({path:`${dir}/${world}-context.png`,fullPage:false,animations:'disabled'});
 fs.writeFileSync(`${dir}/${world}-checks.json`,JSON.stringify({world,guide,layout:info.project.name,geometry,backgroundPixelsUnchanged:true,backgroundSHA256:crypto.createHash('sha256').update(sceneAfter).digest('hex')},null,2));
});
test('all nine originals embedded unchanged with alpha; portraits independent from art and absent from ordinary entry',async({page:p})=>{
 const files=await p.evaluate(()=>window.WorldGuidePortraitFiles);
 const audit=JSON.parse(fs.readFileSync('v3/assets/world-guide-portraits-preview/manifest.json'));
 for(const [world,[guide,name]] of Object.entries(worlds)){
  const file=name+'-guide.webp';expect(Buffer.from(files[world].split(',')[1],'base64')).toEqual(fs.readFileSync('v3/assets/world-guide-portraits-preview/'+file));
  const actual=await p.evaluate(async world=>{const i=new Image();i.src=WorldGuidePortraitFiles[world];await i.decode();const c=document.createElement('canvas');c.width=i.naturalWidth;c.height=i.naturalHeight;const x=c.getContext('2d');x.drawImage(i,0,0);const b=x.getImageData(0,0,c.width,c.height).data;let transparent=0;for(let j=3;j<b.length;j+=4)if(b[j]===0)transparent++;return{transparent,corners:[3,c.width*4-1,(c.height-1)*c.width*4+3,b.length-1].map(j=>b[j])}},world);
  const expected=audit.assets.find(a=>a.file===file).alpha;expect(actual).toEqual({transparent:expected.transparent,corners:expected.corners});
 }
 const previous=await p.evaluate(()=>({art:document.documentElement.dataset.forestArt,scenes:V3Engine.worlds.map(w=>V3Art.scene(w.id,0)),avatar:V3Art.explorer(V7Avatar.state),host:V3Art.guide('Priya')}));
 await p.getByRole('combobox',{name:'Compare guide portraits'}).selectOption('previous');
 expect(await p.evaluate(()=>({art:document.documentElement.dataset.forestArt,scenes:V3Engine.worlds.map(w=>V3Art.scene(w.id,0)),avatar:V3Art.explorer(V7Avatar.state),host:V3Art.guide('Priya')}))).toEqual(previous);
 expect(previous.host).not.toContain('world-guide-portrait');
 await p.goto(url+'?guides=previous');await loaded(p);await expect(p.getByRole('combobox',{name:'Compare guide portraits'})).toHaveValue('previous');
 expect(await p.evaluate(()=>document.querySelector('meta[http-equiv="Content-Security-Policy"]').content)).toContain("connect-src 'none'");
 await p.goto('/v3-adventure.html');await loaded(p);await expect(p.getByRole('combobox',{name:'Compare guide portraits'})).toHaveCount(0);expect(await p.evaluate(()=>window.WorldGuidePortraitFiles)).toBeUndefined();
});
