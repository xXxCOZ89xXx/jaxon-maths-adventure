const {test,expect}=require('./helpers/identities.cjs');
const fs=require('node:fs'),path=require('node:path');
const out=path.resolve('work/curriculum-shots');fs.mkdirSync(out,{recursive:true});
async function saved(p){await p.waitForFunction(()=>!document.documentElement.hasAttribute('data-saving'));}
async function open(p){const dialog=p.locator('dialog.world-task-dialog');if(!await dialog.isVisible())await p.locator('.activity-entry [data-world-task-open]').tap();await expect(dialog).toBeVisible();return dialog;}
async function start(p,key,world,route,tier=1){await p.evaluate(({key,world,route,tier})=>{const s=({...V3Engine.fresh(),startingProfile:window.FictionalStartingProfile});s.tourSeen=true;V3Adventure.start(s,world,route,tier);localStorage.setItem(key,JSON.stringify(s));},{key,world,route,tier});await p.reload();await saved(p);return open(p);}
async function bounds(p){expect(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);const d=p.locator('dialog[open]');if(await d.count())expect(await d.evaluate(e=>e.scrollWidth<=e.clientWidth+2)).toBe(true);}
async function selectAnswer(p,t){if(t.direct){await require('./helpers/direct.cjs').alternative(p,t.direct,t.answer);return;}if(!t.activity){await p.locator('[data-c8-input]').fill(t.answer);await saved(p);}
 else if(['order','match'].includes(t.activity.kind))for(const i of JSON.parse(t.answer)){await p.locator(`[data-action="c8-m:place-${i}"]`).tap();await saved(p);}
 else if(t.activity.kind==='coordinate'){const [x,y]=JSON.parse(t.answer);await p.locator(`[data-c8-point="${x},${y}"]`).tap();await saved(p);}
 else {await p.locator(`[data-action="c8-m:choice-${t.answer}"]`).tap();await saved(p);}}
for(const [world,route]of [['number','written_methods'],['fractions','fraction_reasoning'],['algebra','algebra_graphs'],['geometry','geometry_similarity'],['ratio','ratio_scale'],['statistics','statistics_scatter'],['probability','probability_sets'],['measure','measure_composite'],['town','town_planning']]){
 test(`${world}: complete, resume and review a six-task curriculum mission`,async({camp})=>{
  const{page:p,key,read}=camp;await start(p,key,world,'curr-'+route,2);
  for(let i=0;i<6;i++){
   await p.locator('[data-action="m-begin"]').tap();await saved(p);const t=(await read()).adventure.active.tasks[i];await selectAnswer(p,t);await bounds(p);
   if(i===4){await p.screenshot({path:path.join(out,`${world}-${p.viewportSize().width}.png`),fullPage:false});const before=(await read()).adventure.active;await p.reload();await saved(p);await open(p);expect((await read()).adventure.active).toEqual(before);}
   if(t.activity?.kind!=='choice')await p.locator('[data-action="m-submit"]').tap();await saved(p);expect((await read()).adventure.active.solved,t.prompt).toBe(true);
   await p.locator('[data-action="m-next"]').tap();await saved(p);if(i<5)await open(p);
  }
  const s=await read();expect(s.view).toBe('recap');expect(s.adventure.records[`${world}|curr-${route}|2`].taskCount).toBe(6);expect(s.skills).toEqual({});expect(s.coins).toBe(s.earned);expect(s.earned).toBe(Math.floor(s.minutes*10+1e-9));
 });
}
test('Wrong answers and I do not know open teaching, keep the model and do not earn independent mastery',async({camp})=>{
 const{page:p,key,read}=camp;await start(p,key,'number','curr-written_methods');await p.locator('[data-action="m-begin"]').tap();await p.locator('[data-c8-input]').fill('wrong');await saved(p);await p.locator('[data-action="m-submit"]').tap();await saved(p);await expect(p.locator('[data-action="m-begin"]')).toHaveCount(0);expect((await read()).adventure.active.phase).toBe('play');await expect(p.locator('.feedback').last()).toContainText((await read()).adventure.active.tasks[0].teach);
 await p.locator('[data-action="m-worked"]').tap();await saved(p);expect((await read()).adventure.active.phase).toBe('lesson');expect((await read()).adventure.active.assisted).toBe(true);await bounds(p);
});
test('Coordinate activity has real axes, no visible coordinate-pair answers, and keyboard movement alternatives',async({camp})=>{
 const{page:p,key,read}=camp;await start(p,key,'algebra','curr-algebra_graphs');await p.evaluate(key=>{const s=JSON.parse(localStorage.getItem(key));s.adventure.active.i=4;localStorage.setItem(key,JSON.stringify(s));},key);await p.reload();await open(p);await p.locator('[data-action="m-begin"]').tap();await expect(p.locator('.c8-graph')).toBeVisible();await expect(p.locator('.c8-graph text')).toHaveCount(24);expect(await p.locator('.c8-graph').textContent()).not.toMatch(/\(-?\d,\s*-?\d\)/);
 const button=p.locator('[data-action="c8-m:dx--1"]');await button.focus();await p.keyboard.press('Enter');await saved(p);await p.locator('[data-action="c8-m:dx--1"]').focus();await p.keyboard.press('Enter');await saved(p);for(let n=0;n<3;n++){await p.locator('[data-action="c8-m:dy--1"]').focus();await p.keyboard.press('Enter');await saved(p);}await p.locator('[data-action="m-submit"]').tap();await saved(p);expect((await read()).adventure.active.solved).toBe(true);
});
test('New supported practice, discovery and the existing customer/worker Town journeys remain available',async({camp})=>{
 const{page:p,key,read}=camp;await p.evaluate(key=>{const s=({...V3Engine.fresh(),startingProfile:window.FictionalStartingProfile});s.tourSeen=true;V3Engine.generate(s,'algebra_rules','practice',JaxonFreshReview,V3Curriculum);localStorage.setItem(key,JSON.stringify(s));},key);await p.reload();await expect(p.getByRole('heading',{name:'Build the idea',exact:true})).toBeVisible();await p.locator('[data-action="practice"]').tap();await saved(p);await expect(p.locator('.c8-activity')).toBeVisible();const t=(await read()).learning.qs[0];await p.locator('[data-c8-input]').fill(t[1]);await saved(p);await p.locator('[data-action="c8-check"]').tap();await saved(p);expect((await read()).learning.answered).toBe(true);expect((await read()).skills).toEqual({});
 await p.evaluate(key=>{const s=({...V3Engine.fresh(),startingProfile:window.FictionalStartingProfile});s.tourSeen=true;s.view='world';s.world='town';localStorage.setItem(key,JSON.stringify(s));},key);await p.reload();await expect(p.locator('[data-action="j-start:bolognese"]')).toBeVisible();await p.locator('[data-action="j-start:bolognese"]').tap();await saved(p);const s=await read();expect(s.view).toBe('journey');expect(await p.evaluate(()=>V5Journey.model(JSON.parse(localStorage.getItem('jaxon_v3_fictional_demo_2026'))).context.role)).toMatch(/customer|home cook/);await bounds(p);
});

async function advancedTask(p,key,id,index=4,seed=1){
 const world=await p.evaluate(id=>V8Curriculum.packs.find(p=>p.id===id).world,id);await start(p,key,world,'curr-'+id,3);
 await p.evaluate(({key,index,seed,id})=>{const s=JSON.parse(localStorage.getItem(key)),q=s.adventure.active;q.i=index;q.tasks[index]=V8Curriculum.task(id,9,seed,index);localStorage.setItem(key,JSON.stringify(s));},{key,index,seed,id});await p.reload();await open(p);await p.locator('[data-action="m-begin"]').tap();await saved(p);return (await p.evaluate(key=>JSON.parse(localStorage.getItem(key)),key)).adventure.active.tasks[index];
}
for(const id of ['algebra_graphs','geometry_construction','geometry_similarity','statistics_scatter'])test(`Higher-level ${id}: plot a whole graph or figure with keyboard and tap controls`,async({camp})=>{
 const{page:p,key,read}=camp,t=await advancedTask(p,key,id);const points=JSON.parse(t.answer);
 // Select the last vertex first: sparse partial plots must survive reload without throwing.
 for(const i of [...points.keys()].reverse()){await p.locator(`[data-action="c8-m:active-${i}"]`).tap();await saved(p);const[x,y]=points[i];await p.locator(`[data-c8-point="${x},${y}"]`).tap();await saved(p);}
 await bounds(p);await p.screenshot({path:path.join(out,`advanced-${id}-${p.viewportSize().width}.png`)});await p.reload();await open(p);await p.locator('[data-action="m-submit"]').tap();await saved(p);expect((await read()).adventure.active.solved).toBe(true);
});
for(const id of ['statistics_graphs','statistics_distributions'])test(`Higher-level ${id}: construct a chart and retain exact cell values`,async({camp})=>{
 const{page:p,key,read}=camp,t=await advancedTask(p,key,id);for(const [i,n]of JSON.parse(t.answer).entries()){await p.locator(`[data-c8-cell="${i}"]`).fill(String(n));await p.locator(`[data-c8-cell="${i}"]`).press('Tab');await saved(p);}await bounds(p);await p.screenshot({path:path.join(out,`advanced-${id}-${p.viewportSize().width}.png`)});await p.locator('[data-action="m-submit"]').tap();await saved(p);expect((await read()).adventure.active.solved).toBe(true);
});
test('Build a cube net; alternate valid nets are accepted and overlapping faces are rejected',async({camp})=>{
 const{page:p,key,read}=camp;await advancedTask(p,key,'geometry_solids');for(const i of [3,8,12,13,14,18]){await p.locator(`[data-action="c8-m:square-${i}"]`).tap();await saved(p);}await bounds(p);await p.screenshot({path:path.join(out,`advanced-net-${p.viewportSize().width}.png`)});await p.locator('[data-action="m-submit"]').tap();await saved(p);expect((await read()).adventure.active.solved).toBe(true);
});
test('Construct a Venn diagram and save experimental observations between mini-tasks',async({camp})=>{
 const{page:p,key,read}=camp,t=await advancedTask(p,key,'probability_sets');for(const [i,n]of JSON.parse(t.answer).entries()){await p.locator(`[data-action="c8-m:cell-${i}-${n}"]`).tap();await saved(p);}await p.screenshot({path:path.join(out,`advanced-venn-${p.viewportSize().width}.png`)});await p.locator('[data-action="m-submit"]').tap();await saved(p);expect((await read()).adventure.active.solved).toBe(true);
 const exp=await advancedTask(p,key,'probability_experiments');for(let n=0;n<7;n++){await p.locator('[data-action="c8-m:trial"]').tap();await saved(p);}await p.reload();await open(p);expect((await read()).adventure.active.values.c8.trials).toBe(7);for(let n=7;n<20;n++){await p.locator('[data-action="c8-m:trial"]').tap();await saved(p);}for(const [i,n]of JSON.parse(exp.answer).entries())for(let x=1;x<=n;x++){await p.locator(`[data-action="c8-m:cell-${i}-${x}"]`).tap();await saved(p);}await p.screenshot({path:path.join(out,`advanced-experiment-${p.viewportSize().width}.png`)});await p.locator('[data-action="m-submit"]').tap();await saved(p);expect((await read()).adventure.active.solved).toBe(true);await bounds(p);
});

test('Protractor and real-number-line sliders have working keyboard alternatives and retain their values',async({camp})=>{
 const{page:p,key,read}=camp,t=await advancedTask(p,key,'geometry_design',1);await expect(p.locator('[data-c8-kind="angle"]')).toBeVisible();const range=p.locator('[data-c8-input]');await range.focus();await p.keyboard.press('Home');for(let n=0;n<Number(t.answer);n++)await p.keyboard.press('ArrowRight');await saved(p);await p.locator('[data-action="m-submit"]').tap();await saved(p);expect((await read()).adventure.active.solved).toBe(true);
 await advancedTask(p,key,'number_precision',2);await p.locator('[data-c8-input]').focus();await p.keyboard.press('Home');for(let n=0;n<141;n++)await p.keyboard.press('ArrowRight');await saved(p);await bounds(p);await p.screenshot({path:path.join(out,`advanced-numberline-${p.viewportSize().width}.png`)});await p.reload();await open(p);await p.locator('[data-action="m-submit"]').tap();await saved(p);expect((await read()).adventure.active.solved).toBe(true);
});
test('ASA construction, parallel markings and degree-mode calculator are usable without dragging',async({camp})=>{
 const{page:p,key,read}=camp,t=await advancedTask(p,key,'geometry_design',4,4);expect(t.activity.kind).toBe('triangle');for(const [i,n]of JSON.parse(t.answer).entries()){await p.locator(`[data-c8-cell="${i}"]`).evaluate((el,n)=>{el.value=String(n);el.dispatchEvent(new Event('change',{bubbles:true}));},n);await saved(p);}await bounds(p);await p.screenshot({path:path.join(out,`advanced-asa-${p.viewportSize().width}.png`)});await p.locator('[data-action="m-submit"]').tap();await saved(p);expect((await read()).adventure.active.solved).toBe(true);
 await advancedTask(p,key,'geometry_design',5);for(const [i,n]of [2,1,2,1].entries()){await p.locator(`[data-action="c8-m:cell-${i}-${n}"]`).tap();await saved(p);}await p.locator('[data-action="m-submit"]').tap();await saved(p);expect((await read()).adventure.active.solved).toBe(true);
 await advancedTask(p,key,'geometry_derivations',3);await p.locator('.c8-calculator summary').tap();await p.locator('[data-c8-calc]').fill('30');await saved(p);await p.locator('[data-action="c8-m:calc-op-sin"]').tap();await saved(p);await expect(p.locator('.c8-calculator output')).toHaveText('0.5');expect((await read()).adventure.active.solved).toBe(false);await bounds(p);
});
test('Large-number and thousandth place builders are accessible and do not depend on typed answers',async({camp})=>{
 const{page:p,key,read}=camp,t=await advancedTask(p,key,'number_precision',0);let left=Number(t.answer);for(const [i,weight]of t.activity.weights.entries()){const digit=Math.floor(left/weight+1e-7);for(let n=1;n<=digit;n++){await p.locator(`[data-action="c8-m:cell-${i}-${n}"]`).tap();await saved(p);}left=Number((left-digit*weight).toFixed(6));}await bounds(p);await p.screenshot({path:path.join(out,`advanced-place-${p.viewportSize().width}.png`)});await p.locator('[data-action="m-submit"]').tap();await saved(p);expect((await read()).adventure.active.solved).toBe(true);
});

test('Equivalent fraction shading accepts different equal parts rather than a fixed answer pattern',async({camp})=>{
 const{page:p,key,read}=camp;await advancedTask(p,key,'fraction_reasoning');for(const i of [1,3,5]){await p.locator(`[data-action="c8-m:square-${i}"]`).tap();await saved(p);}await bounds(p);await p.screenshot({path:path.join(out,`advanced-fractions-${p.viewportSize().width}.png`)});await p.locator('[data-action="m-submit"]').tap();await saved(p);expect((await read()).adventure.active.solved).toBe(true);
});
test('Route-specific recommendation resumes the saved level even when the world suggestion differs',async({camp})=>{
 const{page:p,key,read}=camp;await p.evaluate(key=>{const s=({...V3Engine.fresh(),startingProfile:window.FictionalStartingProfile});s.tourSeen=true;for(const k of V3Curriculum.skills.filter(k=>k.world==='number'))s.discovery[k.id]={band:5,rounds:[{band:5,correct:2,total:4}],answers:[],complete:true};s.discovery.written_methods.band=7;s.discovery.written_methods.rounds=[{band:7,correct:2,total:4}];V3Adventure.start(s,'number','curr-written_methods',2);V3Adventure.begin(s);V3Adventure.edit(s,'c8action','input-17');s.view='world';localStorage.setItem(key,JSON.stringify(s));},key);await p.reload();const b=p.locator('[data-action="mission:number:curr-written_methods:2"]');await expect(b).toContainText('Resume');await b.tap();await saved(p);expect((await read()).adventure.active.values.c8.draft).toBe('17');expect((await read()).adventure.active.tier).toBe(2);
});

test('Accessibility audit covers constructed graphs, charts, place columns, protractor and ASA controls',async({camp})=>{
 const{page:p,key}=camp,AxeBuilder=require('@axe-core/playwright').default;for(const [id,stage,seed]of [['algebra_graphs',4,1],['statistics_graphs',4,1],['number_precision',0,1],['geometry_design',1,1],['geometry_design',4,4]]){await advancedTask(p,key,id,stage,seed);const results=await new AxeBuilder({page:p}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();expect(results.violations.map(v=>({id:v.id,targets:v.nodes.map(n=>n.target)})),id).toEqual([]);await bounds(p);}
});

test('Delayed curriculum edits cannot overwrite a replacement mission or learning question in another tab',async({camp})=>{
 const{page:p,context,key,read}=camp;
 for(const mode of ['mission','practice']){
  if(mode==='mission')await advancedTask(p,key,'number_precision',2);
  else{await p.evaluate(key=>{const s=({...V3Engine.fresh(),startingProfile:window.FictionalStartingProfile});s.tourSeen=true;V3Engine.generate(s,'written_methods','practice',JaxonFreshReview,V3Curriculum);s.learning.started=true;s.view='practice';localStorage.setItem(key,JSON.stringify(s));},key);await p.reload();}
  await p.evaluate(key=>new Promise(held=>{navigator.locks.request(key+':transaction',()=>new Promise(release=>{window.releaseCurriculumLock=release;held();}));}),key);
  await p.locator('[data-c8-input]').evaluate(el=>{el.value='1.41';el.dispatchEvent(new Event('input',{bubbles:true}));});
  const other=await context.newPage();await other.goto('/v3-adventure.html');await other.evaluate(({key,mode})=>{const s=({...V3Engine.fresh(),startingProfile:window.FictionalStartingProfile});s.tourSeen=true;if(mode==='mission'){V3Adventure.start(s,'algebra','curr-algebra_rules',1);V3Adventure.begin(s);}else{V3Engine.generate(s,'algebra_rules','practice',JaxonFreshReview,V3Curriculum);s.learning.started=true;s.view='practice';}localStorage.setItem(key,JSON.stringify(s));},{key,mode});
  await expect.poll(async()=>{const s=await read();return mode==='mission'?s.adventure.active.world:s.learning.id;}).toBe(mode==='mission'?'algebra':'algebra_rules');
  await p.evaluate(()=>window.releaseCurriculumLock());await saved(p);const s=await read();if(mode==='mission')expect(s.adventure.active.values.c8).toBeUndefined();else expect(s.learning.manipulation).toBeUndefined();await other.close();
 }
});
