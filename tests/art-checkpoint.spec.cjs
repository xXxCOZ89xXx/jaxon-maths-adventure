'use strict';
const {test,expect}=require('./helpers/identities.cjs');
async function click(page,action){await page.locator(`[data-action="${action}"]`).first().tap();await page.waitForFunction(()=>!document.documentElement.hasAttribute('data-saving'));}
async function images(page){await page.waitForFunction(()=>[...document.querySelectorAll('img')].every(i=>i.complete&&i.naturalWidth>0));}
test('Asset checkpoint: camp links and artwork at iPad size',async({camp})=>{
 const {page,read}=camp;await click(page,'skip-tour');await page.locator('nav [data-nav="camp"]').tap();await images(page);const nav=page.getByRole('navigation',{name:'Base Camp navigation'});await expect(nav.getByRole('button')).toHaveCount(5);
 const before=await read();await page.locator('.asset-camp').screenshot({path:`tests/artifacts/asset-camp-${page.viewportSize().width}.png`});
 const targets=await nav.locator('button,a').evaluateAll(ns=>ns.map(n=>{const b=n.getBoundingClientRect();return {x:b.x,y:b.y,w:b.width,h:b.height};}));for(const b of targets){expect(b.w).toBeGreaterThanOrEqual(44);expect(b.h).toBeGreaterThanOrEqual(44);expect(b.x).toBeGreaterThanOrEqual(0);expect(b.x+b.w).toBeLessThanOrEqual(page.viewportSize().width);}
 for(let i=0;i<targets.length;i++)for(let k=i+1;k<targets.length;k++){const a=targets[i],b=targets[k];expect(a.x+a.w<=b.x||b.x+b.w<=a.x||a.y+a.h<=b.y||b.y+b.h<=a.y,'Camp controls must not overlap').toBe(true);}
 await nav.getByRole('link',{name:'Trophy journal'}).tap();await expect(page.locator('#camp-achievements')).toHaveAttribute('open','');expect((await read()).coins).toBe(before.coins);expect((await read()).milestones).toEqual(before.milestones);
 await nav.getByRole('button',{name:'Avatar shop'}).tap();await expect(page.locator('#wardrobe-preview')).toBeVisible();await page.locator('nav [data-nav="camp"]').tap();await nav.getByRole('button',{name:'Explore worlds'}).tap();await expect(page.locator('.world-card')).toHaveCount(9);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
});
test('Asset checkpoint: connected meal uses bus, stock, shop, checkout and cooking with exact reopen',async({camp})=>{
 const {page,key,read}=camp;await click(page,'skip-tour');await page.locator('nav [data-nav="map"]').tap();await click(page,'world:town');await click(page,'j-start:bolognese');const places=new Set();let count=0;
 while(count++<60){const s=await read(),j=await page.evaluate(s=>V52TownLife.state(s),s);if(j.done)break;const t=j.steps[j.stage];places.add(t.venue||'');await images(page);
 if(t.venue==='station'){await expect(page.locator('.interior-station img.scene-background')).toBeVisible();await page.locator('.stage-vista').screenshot({path:`tests/artifacts/asset-bus-${page.viewportSize().width}.png`});}
 // Synthetic answer setup exercises existing validation/effects; touch behavior is checked separately.
 await page.evaluate(({key})=>{const s=JSON.parse(localStorage.getItem(key)),L=V52TownLife,j=L.state(s),t=L.task(s);if(['basket','budget'].includes(t.kind))j.values.parts=t.answer;else if(['choice','journey'].includes(t.kind))j.values.choice=t.answer;else if(['order','match'].includes(t.kind))j.values.order=t.answer;else if(t.kind==='coins')j.values.coins=Array(Math.floor(t.answer/100)).fill(100).concat(Array(t.answer%100).fill(1));else j.values.amount=t.answer;localStorage.setItem(key,JSON.stringify(s));},{key});await page.reload();await click(page,'j-submit');expect((await page.evaluate(s=>V52TownLife.state(s),await read())).solved).toBe(true);await click(page,'j-next');const exact=(await read()).adventure.townLifeV2;await page.reload();expect((await read()).adventure.townLifeV2).toEqual(exact);
 }
 const j=await page.evaluate(s=>V52TownLife.state(s),await read());expect(j.done).toBe(true);expect(count).toBeLessThan(60);expect(places.has('station')).toBe(true);expect(places.has('market')).toBe(true);expect(places.has('home')).toBe(true);expect(j.receipts.length).toBeGreaterThan(0);
});
test('Asset checkpoint: standalone preview embeds images and honours reduced motion',async({camp})=>{
 const {page}=camp;await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/preview-dist/PLAY-V3.html');await click(page,'skip-tour');await page.locator('nav [data-nav="camp"]').tap();await images(page);expect(await page.locator('.asset-camp .scene-background').getAttribute('src')).toMatch(/^data:image\/webp;base64,/);await page.getByRole('button',{name:'Explore worlds',exact:true}).first().focus();await page.keyboard.press('Enter');await expect(page.locator('.world-card')).toHaveCount(9);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
});
