'use strict';
const {test,expect}=require('./helpers/identities.cjs');
const AxeBuilder=require('@axe-core/playwright').default;
async function click(page,action){await page.locator(`[data-action="${action}"]`).first().click();await page.waitForFunction(()=>!document.documentElement.hasAttribute('data-saving'));}
async function layout(page){expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);expect((await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa']).analyze()).violations.map(v=>({id:v.id,targets:v.nodes.map(n=>n.target)}))).toEqual([]);}
test('Map and Town show distinct artwork, progress, buildings and literal role labels',async({camp},info)=>{
  const {page,read}=camp;await click(page,'skip-tour');await page.locator('nav [data-nav="map"]').click();
  await expect(page.locator('.world-vista svg')).toHaveCount(9);await expect(page.locator('.world-open')).toHaveCount(9);await expect(page.locator('.world-landmarks')).toHaveCount(9);expect(await page.locator('.world-card').evaluateAll(els=>new Set(els.map(e=>e.dataset.world)).size)).toBe(9);
  await layout(page);await page.screenshot({path:`tests/artifacts/${info.project.name}-polished-map.png`});
  await click(page,'world:town');await expect(page.locator('.location-vista svg')).toHaveCount(8);await expect(page.locator('.town-role-key')).toContainText('CUSTOMER');await expect(page.locator('.town-role-key')).toContainText('EMPLOYEE');await expect(page.locator('.town-plan-grid article')).toHaveCount(27);await layout(page);
  await page.locator('.town-explore-map').scrollIntoViewIfNeeded();await page.screenshot({path:`tests/artifacts/${info.project.name}-polished-town.png`});
  const before=await read();expect(before.settings.sound).toBe(false);await page.locator('.town-hotspots [data-action^="j-work:market:"]').click();await expect(page.locator('.location-ribbon')).toContainText('EMPLOYEE');await expect(page.locator('.location-ribbon')).toContainText('Supermarket');await layout(page);
});
test('Wardrobe previews are reversible and never change coins, ownership, equipment or storage',async({camp},info)=>{
  const {page,key,read}=camp;await click(page,'skip-tour');await click(page,'nav:camp');await click(page,'nav:shop');
  const before=await page.evaluate(key=>localStorage.getItem(key),key);const item=await page.evaluate(()=>V3Curriculum.catalog[0]);
  await page.locator(`[data-ui="preview-item"][data-item="${item.id}"]`).click();await expect(page.locator('#wardrobe-preview h2')).toContainText(item.label);await expect(page.locator('#wardrobe-preview svg')).toHaveAttribute('aria-label',new RegExp(item.label));expect(await page.evaluate(key=>localStorage.getItem(key),key)).toBe(before);
  await layout(page);await page.screenshot({path:`tests/artifacts/${info.project.name}-polished-preview.png`});await page.locator('[data-ui="clear-preview"]').click();await expect(page.locator('#wardrobe-preview h2')).toHaveText('Your explorer');expect(await page.evaluate(key=>localStorage.getItem(key),key)).toBe(before);
  await page.reload();expect((await read()).coins).toBe(JSON.parse(before).coins);await expect(page.locator('#wardrobe-preview h2')).toHaveText('Your explorer');
});
test('Selected and placed touch states persist through stop, Continue and reopen',async({camp})=>{
  const {page,key,read}=camp;await click(page,'skip-tour');
  await page.evaluate(key=>{const s=JSON.parse(localStorage.getItem(key));V52TownLife.start(s,'job-cafe');localStorage.setItem(key,JSON.stringify(s));},key);await page.reload();
  await click(page,'j-pick:0');await expect(page.locator('[data-action="j-pick:0"]')).toHaveAttribute('aria-pressed','true');await click(page,'j-place:0');await expect(page.locator('[data-action="j-place:0"]')).toHaveAttribute('data-placed','true');
  const box=await page.locator('[data-action="j-place:0"]').boundingBox();expect(box.height).toBeGreaterThanOrEqual(52);const saved=(await read()).adventure.townLifeV2;
  await click(page,'j-submit');await expect(page.locator('.feedback')).toContainText('Keep adjusting');expect(await page.locator('.feedback').evaluate(e=>parseFloat(getComputedStyle(e).fontSize))).toBeGreaterThanOrEqual(19);
  await click(page,'j-skip');const draft=(await read()).adventure.townLifeV2;await click(page,'nav:home');await expect(page.locator('.hero-copy')).toContainText('Café kitchen assistant');await page.locator('.hero-copy [data-action="continue"]').click();await page.reload();expect((await read()).adventure.townLifeV2).toEqual(draft);expect(saved.runs['job-cafe:1'].values.order).toEqual(draft.runs['job-cafe:1'].values.order);await layout(page);
});
test('Completion celebration is immediately skippable and leaves the saved result unchanged',async({camp},info)=>{
  const {page,key}=camp;await page.evaluate(key=>{const s=JSON.parse(localStorage.getItem(key));s.tourSeen=true;s.view='recap';s.lastResult={type:'expedition',world:'number',route:'1',tier:1,newReward:true};localStorage.setItem(key,JSON.stringify(s));},key);await page.reload();
  await expect(page.locator('.completion-ribbon')).toBeVisible();await expect(page.locator('[data-action="world:number"]')).toBeVisible();const saved=await page.evaluate(key=>localStorage.getItem(key),key);await layout(page);await page.screenshot({path:`tests/artifacts/${info.project.name}-polished-completion.png`});await page.locator('[data-ui="hide-celebration"]').click();await expect(page.locator('.completion-ribbon')).toHaveCount(0);expect(await page.evaluate(key=>localStorage.getItem(key),key)).toBe(saved);
});
test('Reduced motion overrides opt-in animation, with sound off',async({camp})=>{
  const {page,key,read}=camp;await page.emulateMedia({reducedMotion:'reduce'});await page.evaluate(key=>{const s=JSON.parse(localStorage.getItem(key));s.settings.motion=true;s.view='map';s.tourSeen=true;localStorage.setItem(key,JSON.stringify(s));},key);await page.reload();await page.locator('.world-card').first().hover();expect(await page.locator('.world-vista').first().evaluate(e=>getComputedStyle(e).animationName)).toBe('none');expect(await page.locator('.world-card').first().evaluate(e=>getComputedStyle(e).transitionDuration)).toBe('0s');expect((await read()).settings.sound).toBe(false);
});
test('Coin readout reflects a supplied balance change without awarding or persisting anything',async({camp})=>{
  const {page,key}=camp;await page.evaluate(key=>{const s=JSON.parse(localStorage.getItem(key));s.coins+=4;localStorage.setItem(key,JSON.stringify(s));},key);const saved=await page.evaluate(key=>localStorage.getItem(key),key);
  await page.evaluate(key=>window.dispatchEvent(new StorageEvent('storage',{key})),key);await expect(page.locator('#coin-readout')).toContainText('4 coins');await expect(page.locator('#coin-readout')).toContainText('+4');expect(await page.evaluate(key=>localStorage.getItem(key),key)).toBe(saved);expect(await page.locator('#coin-readout').evaluate(e=>getComputedStyle(e).position)).toBe('static');
});
