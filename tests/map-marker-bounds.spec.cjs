const {test, expect} = require('@playwright/test');
const fs = require('node:fs');
const F = require('./helpers/guided-progression.cjs');
const key = 'jaxon_v3_fictional_demo_2026';
const baseline = !!process.env.MARKER_BASELINE;
const entry = process.env.MARKER_ENTRY || (baseline ? '/work/marker-baseline/v3-adventure.html' : '/v3-adventure.html');
const settled = p => p.waitForFunction(() => !document.documentElement.hasAttribute('data-saving'));
async function press(p, selector, touch) {
  const button = p.locator(selector).filter({visible: true}).first();
  if (touch) await button.tap(); else await button.click();
  await settled(p);
}
async function load(p, state) {
  await p.evaluate(({key, state}) => localStorage.setItem(key, JSON.stringify(state)), {key, state});
  await p.goto(entry);
  await p.locator('.world-overview img').evaluateAll(imgs => Promise.all(imgs.map(i => i.decode())));
}
async function shot(p, info, world, level) {
  const dir = `work/map-markers/${baseline ? 'before' : 'after'}/${info.project.name}`;
  fs.mkdirSync(dir, {recursive: true});
  await p.locator('.world-overview').evaluate(e => scrollTo(0, e.getBoundingClientRect().top + scrollY - 20));
  await p.screenshot({path: `${dir}/${world}-${level}.jpg`, type: 'jpeg', quality: 75, animations: 'disabled'});
}
async function markers(p, world) {
  return p.locator('.world-route-map').evaluate((map, world) => {
    const box = el => {const b = el.getBoundingClientRect(); return {x: b.x + scrollX, y: b.y + scrollY, width: b.width, height: b.height};};
    const art = map.querySelector(world === 'town' ? '.building-navigation' : '.hero-art');
    const buttons = [...map.querySelectorAll(world === 'town' ? '.building-hit-layer>button' : '.world-route-pins>button')];
    return {art: box(art), pins: buttons.map(b => ({...box(b), left: b.style.left, top: b.style.top, label: b.getAttribute('aria-label'), text: b.firstElementChild.textContent, action: b.dataset.action, ui: b.dataset.ui, display: getComputedStyle(b).display, visibility: getComputedStyle(b).visibility})), routes: V3Adventure.routes(world).map(r => ({id: r.id, name: r.name}))};
  }, world);
}
async function checkMarkers(p, world, interactive = true) {
  const {art, pins, routes} = await markers(p, world);
  expect(pins).toHaveLength(world === 'town' ? 8 : routes.length);
  if (world === 'number') expect(pins).toHaveLength(8);
  for (const [i, pin] of pins.entries()) {
    for (const value of [pin.left, pin.top]) {
      expect(value).toMatch(/^\d+(\.\d+)?%$/);
      expect(parseFloat(value)).toBeGreaterThan(0);
      expect(parseFloat(value)).toBeLessThan(100);
    }
    expect(pin.display).not.toBe('none'); expect(pin.visibility).toBe('visible');
    expect(pin.width).toBeGreaterThanOrEqual(44); expect(pin.height).toBeGreaterThanOrEqual(44);
    expect(pin.x, pin.label + ' left').toBeGreaterThanOrEqual(art.x - 1);
    expect(pin.y, pin.label + ' top').toBeGreaterThanOrEqual(art.y - 1);
    expect(pin.x + pin.width, pin.label + ' right').toBeLessThanOrEqual(art.x + art.width + 1);
    expect(pin.y + pin.height, pin.label + ' bottom').toBeLessThanOrEqual(art.y + art.height + 1);
    // Town uses existing building-sized hit regions; numbered route pins must not overlap.
    for (const other of world === 'town' ? [] : pins.slice(0, i)) {
      expect(pin.x + pin.width <= other.x || other.x + other.width <= pin.x || pin.y + pin.height <= other.y || other.y + other.height <= pin.y, pin.label + ' overlaps').toBe(true);
    }
    if (world !== 'town') {
      expect(pin.label).toBe('Visit ' + routes[i].name); expect(pin.text).toBe(String(i + 1));
      expect(pin.action.split(':').slice(0, 3)).toEqual(['scene-mission', world, routes[i].id]);
    } else {
      expect(pin.label).toBe('Enter ' + routes[i].name);
      if (routes[i].id === 'home') expect(pin.ui).toBe('choose-home-activity');
      else expect(pin.action.split(':')[1]).toBe(routes[i].id);
    }
  }
  const buttons = p.locator(world === 'town' ? '.building-hit-layer>button' : '.world-route-pins>button');
  for (let i = 0; interactive && i < pins.length; i++) {
    const button = buttons.nth(i);
    await button.scrollIntoViewIfNeeded();
    expect(await button.evaluate(b => {const r = b.getBoundingClientRect(); return b.contains(document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2));})).toBe(true);
    // Switch to keyboard modality before checking the existing :focus-visible label.
    await p.keyboard.press('Tab');
    await button.focus();
    if (world !== 'town') {
      await expect(button.locator('.route-label')).toBeVisible();
      const within = await button.evaluate(b => {const r = b.querySelector('.route-label').getBoundingClientRect(), m = b.closest('.world-route-map').getBoundingClientRect(); return r.left >= m.left - 1 && r.right <= m.right + 1 && r.top >= m.top - 1 && r.bottom <= m.bottom + 1;});
      expect(within, pins[i].label + ' focused label stays on map').toBe(true);
    }
    await button.evaluate(b => b.blur());
  }
  expect(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  return pins;
}
function finishRepair(s) {
  while (F.M.current(s)) {
    const q = F.M.current(s); F.M.begin(s); const task = q.tasks[q.i];
    q.values.c8 = task.activity?.kind === 'choice' ? {choice: Number(task.answer)} : {draft: task.answer};
    expect(F.M.submit(s)).toBe(true); F.M.next(s);
  }
}
for (const world of Object.keys(F.R.mapping)) test(`${world}: marker geometry, route links and all repair states`, async ({page: p}, info) => {
  const touch = !!info.project.use.hasTouch, errors = [], external = [];
  p.on('pageerror', e => errors.push(e.message));
  await p.route('**/*', r => {if (new URL(r.request().url()).origin === 'http://127.0.0.1:4173') return r.continue(); external.push(r.request().url()); return r.abort();});
  await p.emulateMedia({reducedMotion: 'reduce'});
  await p.goto(entry);
  const s = F.fresh(); s.world = world; s.view = 'world';
  await load(p, s);
  if (baseline) {
    await shot(p, info, world, 0);
    const {pins, art, routes} = await markers(p, world);
    if (world !== 'town') {
      expect(pins).toHaveLength(routes.length);
      expect(pins.filter(pin => !pin.left || !pin.top)).toHaveLength(routes.length - 3);
      if (world === 'number') {expect(pins).toHaveLength(8); expect(pins[7].x).toBeLessThan(art.x); expect(pins[7].y + pins[7].height).toBeGreaterThan(art.y + art.height);}
    }
  } else {
    // Missing assessments still gate restoration; merely viewing markers changes no evidence.
    await checkMarkers(p, world); await shot(p, info, world, 0);
    await press(p, '.repair-entry summary', touch);
    await expect(p.locator('.restoration-path [data-action^="restore:"]')).toHaveCount(0);
    F.assess(s, F.R.mapping[world].flat());
    for (let level = 0; level <= 3; level++) {
      s.view = 'world'; await load(p, s); await checkMarkers(p, world, false);
      if (level === 3) await shot(p, info, world, level);
      await press(p, '.repair-entry summary', touch);
      const cards = p.locator('.restoration-path .skill-list>article');
      for (let i = 0; i < 3; i++) {
        await expect(cards.nth(i).locator('h3')).toContainText(F.E.worlds.find(w => w.id === world).stages[i]);
        await expect(cards.nth(i).locator(`[data-action="restore:${world}:${i}"]`)).toHaveCount(i <= level ? 1 : 0);
      }
      if (level < 3) {
        await press(p, `[data-action="restore:${world}:${level}"]`, touch);
        const read = () => p.evaluate(key => JSON.parse(localStorage.getItem(key)), key);
        const started = await read(); expect(started.adventure.active.restoration.stage).toBe(level);
        await press(p, '[data-action="pause-explore"]', touch);
        await checkMarkers(p, world, false);
        await p.reload();
        await press(p, '.repair-entry summary', touch);
        await press(p, `[data-action="restore:${world}:${level}"]`, touch);
        expect((await read()).adventure.active).toEqual(started.adventure.active);
        expect((await read()).restoration.completed).toEqual(s.restoration?.completed || {});
        expect(F.R.start(s, world, level)).toBeNull(); finishRepair(s);
      } else {
        for (let i = 0; i < 3; i++) {
          await press(p, `[data-action="restore:${world}:${i}"]`, touch);
          await expect(p.locator('.recap')).toContainText('restoration stage is complete');
          await press(p, `[data-action="world:${world}"]`, touch);
          await press(p, '.repair-entry summary', touch);
        }
        await p.reload();
        const saved = await p.evaluate(key => JSON.parse(localStorage.getItem(key)), key);
        for (const field of ['milestones', 'restoration', 'discovery', 'skills', 'coins', 'bought', 'equipped', 'customFuture']) expect(saved[field], field).toEqual(s[field]);
      }
    }
    // Exercise every numbered marker, including every appended curriculum route.
    if (world !== 'town') {
      const routes = await p.evaluate(id => V3Adventure.routes(id), world);
      for (let i = 0; i < routes.length; i++) {
        await press(p, `.world-route-pins>button:nth-child(${i + 1})`, touch);
        const active = await p.evaluate(key => JSON.parse(localStorage.getItem(key)).adventure.active, key);
        expect(active.world).toBe(world); expect(active.route).toBe(routes[i].id);
        await press(p, '[data-action="pause-explore"]', touch);
        await press(p, '[data-nav="map"]', touch);
        await press(p, `[data-action="world:${world}"]`, touch);
      }
    }
  }
  expect(errors).toEqual([]); expect(external).toEqual([]);
});
