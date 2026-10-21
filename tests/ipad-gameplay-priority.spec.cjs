// Focused latest-game acceptance; local fictional state, no hosted requests.
const {test,expect}=require('./helpers/identities.cjs');
async function click(page,action){
  await page.locator(`[data-action="${action}"]`).first().click();
  await page.waitForFunction(()=>!document.documentElement.hasAttribute('data-saving'));
}
test('All nine worlds open from the visible map and expose playable mission controls',async({camp})=>{
  const {page,read}=camp;
  await click(page,'skip-tour');
  const worlds=await page.evaluate(()=>V3Engine.worlds.map(w=>({id:w.id,name:w.name})));
  expect(worlds).toHaveLength(9);
  for(const world of worlds){
    await page.locator('nav [data-nav="map"]').click();
    await click(page,'world:'+world.id);
    const route=await page.evaluate(id=>V3Adventure.routes(id)[0].id,world.id);
    const selector=world.id==='town'?`.town-hotspots [data-action^="mission:town:${route}:"]`:`.world-route-pins [data-action^="scene-mission:${world.id}:${route}:"]`;
    await page.locator(selector).click();
    await click(page,'m-begin');
    await expect(page.locator('.task-controls')).toBeVisible();
    expect(await page.locator('.task-controls button,.task-controls input').count()).toBeGreaterThan(0);
    await click(page,'m-help');
    const snapshot=(await read()).adventure.active;
    expect(snapshot.world).toBe(world.id);
    await page.reload();
    expect((await read()).adventure.active).toEqual(snapshot);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
  }
});
test('Town map enters the workplace directly and completes employee wages, payslip and saving tasks',async({camp})=>{
  const {page,read}=camp;
  await click(page,'skip-tour');
  await page.locator('nav [data-nav="map"]').click();
  await click(page,'world:town');
  await page.locator('.town-hotspots [data-action^="mission:town:work:"]').click();
  await expect(page.locator('.guide .badge')).toHaveText('worker context');
  expect((await read()).adventure.journeyV1).toBeUndefined();
  for(const kind of ['timesheet','payslip','amount']){
    await click(page,'m-begin');
    const task=await page.evaluate(()=>{const s=JSON.parse(localStorage.getItem('jaxon_v3_fictional_demo_2026'));const q=V3Adventure.current(s);return q.tasks[q.i];});
    expect(task.kind).toBe(kind);
    await page.locator('[data-numeric-answer="mission"]').fill(String(task.answer));
    await page.waitForFunction(()=>!document.documentElement.hasAttribute('data-saving'));
    const snapshot=(await read()).adventure.active;
    await page.reload();
    expect((await read()).adventure.active).toEqual(snapshot);
    await click(page,'m-submit');
    expect((await read()).adventure.active.solved).toBe(true);
    await click(page,'m-next');
  }
  await expect(page.getByRole('heading',{name:'A visit worth remembering.'})).toBeVisible();
  expect((await read()).lastResult.route).toBe('work');
});
