// Actual offline artifact, isolated fictional saves, every external origin denied.
const {test, expect} = require('@playwright/test');
const fs = require('node:fs');
const key = 'jaxon_v3_fictional_demo_2026';
const root = process.env.PAINTED_DESERT_SHOTS || 'docs/review/fraction-desert-preview';
const url = '/preview-dist/PLAY-V3.html' + (process.env.PREVIOUS_GUIDES ? '?guides=previous' : '');
async function loaded(page) {
  await page.locator('#main h1').waitFor();
  await page.evaluate(() => Promise.all([...document.images].map(i => i.decode().catch(() => {}))));
  await expect(page.locator('html')).not.toHaveAttribute('data-saving');
}
async function seed(page, view = 'world', restored = false) {
  await page.evaluate(({key,view,restored}) => {
    const s = V3Engine.fresh();
    s.tourSeen = true; s.settings.motion = false; s.settings.sound = false;
    s.world = 'fractions'; s.view = view;
    if (restored) s.milestones.push('fractions:0', 'fractions:1', 'fractions:2');
    if (view === 'quest') V3Engine.startQuest(s, 'fractions');
    localStorage.setItem(key, JSON.stringify(s));
  }, {key,view,restored});
  await page.reload(); await loaded(page);
}
async function state(page) { return page.evaluate(key => JSON.parse(localStorage.getItem(key)), key); }
async function shot(page, project, name) {
  const dir = `${root}/${project}`; fs.mkdirSync(dir, {recursive:true});
  await page.screenshot({path: `${dir}/${name}.png`, fullPage:false});
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1)).toBe(false);
}
test.beforeEach(async ({page}) => {
  const errors = [], external = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.route('**/*', route => {
    if (new URL(route.request().url()).origin === 'http://127.0.0.1:4173') return route.continue();
    external.push(route.request().url()); return route.abort();
  });
  page.artErrors = errors; page.artExternal = external;
  await page.goto(url); await loaded(page);
});
test.afterEach(async ({page}) => {
  expect(page.artErrors).toEqual([]); expect(page.artExternal).toEqual([]);
});

test('art comparison preserves saves, avatars, geometry and readable restoration layers', async ({page}, info) => {
  await seed(page);
  const select = page.getByRole('combobox', {name:'Compare preview artwork'});
  const current = page.locator('.painted-desert-scene > .scene-background');
  const backdrop = page.locator('.painted-desert-backdrop');
  await select.selectOption('current');
  const before = await page.evaluate(() => ({save:localStorage.getItem('jaxon_v3_fictional_demo_2026'),
    header:document.querySelector('#headerExplorer').innerHTML,
    explorer:document.querySelector('.world-overview .explorer').outerHTML,
    pins:[...document.querySelectorAll('.world-route-pins button')].map(e => [e.dataset.action,e.getBoundingClientRect().toJSON()])}));
  const box = await current.boundingBox();
  await shot(page, info.project.name, 'before-world');
  await select.selectOption('painted'); await loaded(page);
  await expect(backdrop).toBeVisible();
  expect(await current.boundingBox()).toEqual(box);
  expect(await page.evaluate(() => ({save:localStorage.getItem('jaxon_v3_fictional_demo_2026'),
    header:document.querySelector('#headerExplorer').innerHTML,
    explorer:document.querySelector('.world-overview .explorer').outerHTML,
    pins:[...document.querySelectorAll('.world-route-pins button')].map(e => [e.dataset.action,e.getBoundingClientRect().toJSON()])}))).toEqual(before);
  await expect(page.locator('.repair-region')).toHaveCount(3);
  await expect(page.locator('.area-damaged')).toHaveCount(3);
  await shot(page, info.project.name, 'after-world');
  await page.locator('[data-action="quest:fractions"]').click(); await loaded(page);
  await expect(page.locator('.guide .desert-guide-painted-art')).toBeVisible();
  await expect(page.locator('.desert-guide-current-art')).toBeHidden();
  // Guide close-up shows real alpha composited against the game's solid panel.
  await page.locator('.guide').scrollIntoViewIfNeeded();
  await shot(page, info.project.name, 'after-guide');
  await page.locator('.guide').screenshot({path:`${root}/${info.project.name}/after-guide-panel.png`});
  const questBefore = await state(page);
  await select.selectOption('current');
  await expect(page.locator('.guide .desert-guide-painted-art')).toBeHidden();
  await expect(page.locator('.desert-guide-current-art')).toBeVisible();
  await page.locator('.guide').scrollIntoViewIfNeeded();
  await shot(page, info.project.name, 'before-guide');
  await page.locator('.guide').screenshot({path:`${root}/${info.project.name}/before-guide-panel.png`});
  expect(await state(page)).toEqual(questBefore);
  await page.goto(url+(url.includes('?')?'&':'?')+'art=current'); await loaded(page);
  await expect(select).toHaveValue('current');
  await seed(page, 'world', true);
  await select.selectOption('painted');
  await expect(page.locator('.area-restored')).toHaveCount(3);
  await shot(page, info.project.name, 'after-restored');
  await page.locator('[data-action="before"]').click();
  await expect(page.locator('.area-damaged')).toHaveCount(3);
  // Existing landmark navigation still enters a real saved mission.
  await page.locator('.world-route-pins button').first().click();
  await expect(page.locator('[data-world-task-open]').first()).toBeVisible();
  expect((await state(page)).view).toBe('adventure');
});

test('painted world remains playable and restores canal progress across reloads', async ({page}) => {
  await seed(page, 'quest');
  await page.locator('[data-world-task-open]').first().click();
  await page.locator('[data-action="begin"]').click();
  const answer = await page.evaluate(() => V3Engine.puzzle('fractions',0).answer);
  for(let i=0;i<answer;i++) await page.locator(`[data-action="part:${i}"]`).click();
  await page.locator('[data-action="solve"]').click();
  await expect(page.locator('.world-task-dialog .feedback')).toContainText('Restored!');
  await expect(page.locator('.area-restored')).toHaveCount(1);
  expect((await state(page)).milestones.filter(x=>x==='fractions:0')).toHaveLength(1);
  await page.reload(); await loaded(page);
  await expect(page.locator('.area-restored')).toHaveCount(1);
  expect((await state(page)).quest.solved).toBe(true);
  await page.locator('[data-world-task-open]').first().click();
  await page.locator('[data-action="next-quest"]').click();
  await expect.poll(async () => (await state(page)).quest.i).toBe(1);
});

test('standalone embeds original bytes; other worlds and non-preview entry stay current', async ({page}) => {
  const result = await page.evaluate(() => ({
    files:window.FractionDesertPreviewFiles,
    standalone:![...document.querySelectorAll('script[src],link[rel=stylesheet]')].length,
    csp:document.querySelector('meta[http-equiv="Content-Security-Policy"]').content,
    otherWorld:V3Art.scene('algebra',0), otherGuide:V3Art.guide('Finn'),
  }));
  expect(result.standalone).toBe(true); expect(result.csp).toContain("connect-src 'none'");
  for(const [name,file] of Object.entries({desert:'fraction-desert-painted-backdrop.jpg',saff:'fraction-desert-guide-transparent.webp'})) {
    expect(Buffer.from(result.files[name].split(',')[1],'base64')).toEqual(fs.readFileSync('v3/assets/fraction-desert-preview/'+file));
  }
  expect(result.otherWorld).not.toContain('painted-desert');
  expect(result.otherGuide).not.toContain('desert-guide-');
  const transparency = await page.evaluate(async () => {
    const image = new Image(); image.src = FractionDesertPreviewFiles.saff;
    await image.decode();
    const canvas = document.createElement('canvas');
    canvas.width = image.naturalWidth; canvas.height = image.naturalHeight;
    const ctx = canvas.getContext('2d'); ctx.drawImage(image,0,0);
    const rgba = ctx.getImageData(0,0,canvas.width,canvas.height).data;
    let clear = 0, visible = 0;
    for(let i=3;i<rgba.length;i+=4) { if(rgba[i]===0) clear++; else visible++; }
    return {width:canvas.width,height:canvas.height,clear,visible,
      corners:[3,canvas.width*4-1,(canvas.height-1)*canvas.width*4+3,rgba.length-1].map(i=>rgba[i])};
  });
  expect(transparency).toEqual({width:560,height:700,clear:149965,visible:242035,corners:[0,0,0,0]});
  const alpha = await page.locator('.desert-guide-painted-art').count(); expect(alpha).toBe(0);
  await page.goto('/v3-adventure.html'); await loaded(page);
  await expect(page.getByRole('combobox',{name:'Compare preview artwork'})).toHaveCount(0);
  expect(await page.evaluate(() => window.FractionDesertPreviewFiles)).toBeUndefined();
});
