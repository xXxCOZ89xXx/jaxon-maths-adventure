const {test,expect}=require('./helpers/identities.cjs');
const F=require('./helpers/guided-progression.cjs');
test('closed recipe close-ups defer images; opening loads small transparent WebP without changing the plan',async({camp})=>{
 const p=camp.page,s=F.fresh();F.L.startRecipe(s,'bolognese',1);
 const original=JSON.stringify(F.L.state(s)),requests=[];
 p.on('request',r=>{if(r.resourceType()==='image')requests.push(r.url());});
 await p.evaluate(({key,s})=>localStorage.setItem(key,JSON.stringify(s)),{key:camp.key,s});await p.reload();
 const dialog=p.locator('.immersive-journey dialog');await expect(dialog).toHaveCount(1);await expect(dialog).not.toHaveAttribute('open');
 expect(await dialog.locator('img[src]').count()).toBe(0);
 expect(requests.some(x=>/ingredients\/.*\.png/.test(x))).toBe(false);
 await p.locator('[data-scene-open="recipe"]').first().click();await expect(dialog).toHaveAttribute('open');
 const images=dialog.locator('.recipe-ingredient-image');expect(await images.count()).toBeGreaterThan(0);
 const rows=await images.evaluateAll(async es=>Promise.all(es.map(async img=>{await img.decode();const c=document.createElement('canvas');c.width=img.naturalWidth;c.height=img.naturalHeight;const ctx=c.getContext('2d');ctx.drawImage(img,0,0);const data=ctx.getImageData(0,0,c.width,c.height).data;let clear=0,visible=0;for(let i=3;i<data.length;i+=4){if(!data[i])clear++;if(data[i]>200)visible++;}return {src:img.getAttribute('src'),w:img.naturalWidth,h:img.naturalHeight,clear,visible,pixels:c.width*c.height};})));
 for(const r of rows){expect(r.src).toMatch(/ingredients\/served\/[^/]+\.webp$/);expect(r.w).toBeLessThanOrEqual(512);expect(r.h).toBeLessThanOrEqual(512);expect(r.clear).toBeGreaterThan(r.pixels*.05);expect(r.visible).toBeGreaterThan(r.pixels*.01);}
 expect(JSON.stringify(F.L.state(await camp.read()))).toBe(original);
 const bg=p.locator('.immersive-journey .scene-background').first();await expect(bg).toHaveAttribute('srcset',/1024w.*1536w/);
});
