const{test,expect}=require('@playwright/test'),fs=require('node:fs');
const F=require('./helpers/guided-progression.cjs'),KEY='jaxon_v3_fictional_demo_2026';
test('standalone review game includes assessed restoration and original art in all nine worlds',async({page:p},info)=>{
 const errors=[],external=[];p.on('pageerror',e=>errors.push(e.message));
 await p.route('**/*',r=>{if(new URL(r.request().url()).origin==='http://127.0.0.1:4173')return r.continue();external.push(r.request().url());return r.abort();});
 await p.goto('/preview-dist/PLAY-V3.html');
 expect(await p.evaluate(()=>typeof V10Restoration.start)).toBe('function');
 expect(await p.locator('select[aria-label^="Compare"]').count()).toBe(0);
 for(const world of Object.keys(F.R.mapping)){
  const state=F.restoration(world,1);await p.evaluate(({state,key})=>localStorage.setItem(key,JSON.stringify(state)),{state,key:KEY});await p.reload();
  await expect(p.locator('#main h1')).toContainText('Restore');
  await expect(p.locator('.world-guide-portrait')).toBeVisible();
  expect(await p.locator('.scene-background').first().evaluate(e=>e.src.startsWith('data:image/webp;base64,'))).toBe(true);
  expect(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1)).toBe(false);
 }
 await p.locator('#play-help').click();await expect(p.locator('#main h1')).toHaveText('How to play');
 const dir='docs/review/guided-progression/after/'+info.project.name;fs.mkdirSync(dir,{recursive:true});
 await p.screenshot({path:dir+'/offline-how-to-play.jpg',type:'jpeg',quality:78,fullPage:true});
 expect(external).toEqual([]);expect(errors).toEqual([]);
});
