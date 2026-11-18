const {test,expect}=require('./helpers/identities.cjs');
async function settled(p){await p.waitForFunction(()=>!document.documentElement.hasAttribute('data-saving'));}
async function open(p){const dialog=p.locator('dialog.world-task-dialog');if(!await dialog.isVisible())await p.locator('.activity-entry [data-world-task-open]').tap();await expect(dialog).toBeVisible();}
for(const [name,seed,stage]of [['negative quadratic',1,4],['positive line',28,5]])test(`Algebra graph range: ${name} can be tapped, moved and resumed`,async({camp})=>{
 const {page:p,key,read}=camp;
 await p.evaluate(({key,seed,stage})=>{const s={...V3Engine.fresh(),startingProfile:window.FictionalStartingProfile};s.tourSeen=true;V3Adventure.start(s,'algebra','curr-algebra_graphs',3);s.adventure.active.i=stage;s.adventure.active.tasks[stage]=V8Curriculum.task('algebra_graphs',9,seed,stage);localStorage.setItem(key,JSON.stringify(s));},{key,seed,stage});
 await p.reload();await settled(p);await open(p);await p.locator('[data-action="m-begin"]').tap();await settled(p);
 const task=(await read()).adventure.active.tasks[stage],points=JSON.parse(task.answer),svg=p.locator('.c8-graph');
 await expect(svg.locator('[data-c8-point]')).toHaveCount(121);
 expect(await svg.getAttribute('aria-label')).not.toContain('y from -5 to 5');
 // The horizontal zero axis must not be drawn halfway through a translated window.
 expect(await svg.locator('path[stroke-width="3"]').getAttribute('d')).not.toContain('H340');
 for(const i of [...points.keys()].reverse()){
  await p.locator(`[data-action="c8-m:active-${i}"]`).tap();await settled(p);
  const target=p.locator(`[data-c8-point="${points[i].join(',')}"]`);await target.tap();await settled(p);
  const placed=(await read()).adventure.active.values.c8.points[i];expect(placed).toEqual(points[i]);
 }
 // A real keyboard-operated movement button uses the same shifted limits as tapping.
 await p.locator('[data-action="c8-m:dy--1"]').focus();await p.keyboard.press('Enter');await settled(p);
 expect((await read()).adventure.active.values.c8.points[0]).toEqual([points[0][0],points[0][1]-1]);
 await p.locator('[data-action="c8-m:dy-1"]').focus();await p.keyboard.press('Enter');await settled(p);
 const before=(await read()).adventure.active;expect(before.tasks[stage]).toEqual(task);
 expect(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
 await p.reload();await settled(p);await open(p);expect((await read()).adventure.active).toEqual(before);
 await p.locator('[data-action="m-submit"]').tap();await settled(p);expect((await read()).adventure.active.solved).toBe(true);expect((await read()).skills).toEqual({});
});
