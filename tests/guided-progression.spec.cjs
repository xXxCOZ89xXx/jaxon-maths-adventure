const {test,expect}=require('@playwright/test'),fs=require('node:fs');
const F=require('./helpers/guided-progression.cjs'),KEY='jaxon_v3_fictional_demo_2026';
const read=async p=>{await expect(p.locator('html')).not.toHaveAttribute('data-saving');return p.evaluate(k=>JSON.parse(localStorage.getItem(k)),KEY);};
async function seed(p,s){await p.goto('/v3-adventure.html');await p.evaluate(({key,s})=>localStorage.setItem(key,JSON.stringify(s)),{key:KEY,s});await p.reload();await p.locator('#main h1').waitFor();}
async function openWorkbench(p){if(!await p.locator('.world-task-dialog[open]').count())await p.locator('[data-world-task-open]').first().click();}
async function capture(p,info,name,locator){const dir='docs/review/guided-progression/after/'+info.project.name;fs.mkdirSync(dir,{recursive:true});await (locator||p).screenshot({path:dir+'/'+name+'.jpg',type:'jpeg',quality:78,animations:'disabled'});}
test.beforeEach(async({page:p})=>{p.failures=[];p.on('pageerror',e=>p.failures.push(e.message));await p.route('**/*',r=>new URL(r.request().url()).origin==='http://127.0.0.1:4173'?r.continue():r.abort());await p.emulateMedia({reducedMotion:'reduce'});});
test.afterEach(async({page:p})=>expect(p.failures).toEqual([]));
for(const recipe of [false,true])test('completed Town '+(recipe?'recipe':'plan')+' Continue shows its recap without new supermarket or day',async({page:p},info)=>{
 const s=F.completedTown(recipe),old=F.L.state(s),runs=JSON.stringify(F.L.book(s).runs);await seed(p,s);await p.getByRole('button',{name:'Continue adventure',exact:false}).first().click();
 await expect(p.getByRole('heading',{name:'Town plan complete.',exact:true})).toBeVisible();let actual=await read(p);expect(JSON.stringify(actual.adventure.townLifeV2.runs)).toBe(runs);expect(actual.adventure.active||null).toBeNull();expect(actual.adventure.townLifeV2.active).toBe(old.id);
 if(!recipe)await capture(p,info,'completed-town-recap');await p.getByRole('button',{name:'Choose another Town plan'}).click();await expect(p.locator('#main h1')).toHaveText('Practical Maths Town');
 await p.locator('nav [data-nav="home"]').click();await p.getByRole('button',{name:'Continue adventure',exact:false}).first().click();await expect(p.getByRole('heading',{name:'Town plan complete.',exact:true})).toBeVisible();
 await p.getByRole('button',{name:'Try another day',exact:true}).click();actual=await read(p);expect(actual.adventure.townLifeV2.active).not.toBe(old.id);expect(actual.adventure.townLifeV2.runs[old.id]).toEqual(old);
});
test('completed Town mission and final task Continue are idempotent recaps',async({page:p})=>{
 const s=F.fresh();s.world='town';s.lastResult={type:'expedition',world:'town',route:'gateway',tier:2};s.view='home';await seed(p,s);await p.getByRole('button',{name:'Continue adventure',exact:false}).first().click();await expect(p.locator('.recap')).toBeVisible();expect((await read(p)).adventure.active||null).toBeNull();
});
for(const world of Object.keys(F.R.mapping))test(world+': assessment gate, adaptive restoration, real answer, pause/reload and reliable exits',async({page:p},info)=>{
 const locked=F.fresh();locked.world=world;locked.view='world';await seed(p,locked);
 const path=p.locator('.restoration-path');await expect(path).toContainText('Find your starting point');expect(await path.locator('[data-action^="restore:"]').count()).toBe(0);
 expect(await p.evaluate(w=>V10Restoration.start(JSON.parse(localStorage.getItem('jaxon_v3_fictional_demo_2026')),w,0),world)).toContain('starting point');
 if(world==='number'){await path.scrollIntoViewIfNeeded();await capture(p,info,'assessment-gates');}
 const s=F.restoration(world),q=F.M.current(s),tasks=JSON.stringify(q.tasks);await seed(p,s);
 await expect(p.locator('#main h1')).toContainText('Restore');await openWorkbench(p);await p.getByRole('button',{name:'Try this task',exact:false}).click();
 await p.locator('dialog[open] .c8-input').fill(q.tasks[0].answer);await p.getByRole('button',{name:'Check answer',exact:true}).click();await expect(p.getByRole('button',{name:'Next task',exact:false})).toBeVisible();await p.getByRole('button',{name:'Next task',exact:false}).click();
 let actual=await read(p);expect(actual.adventure.active.i).toBe(1);expect(actual.adventure.active.tasks).toEqual(q.tasks);expect(actual.checks).toEqual(s.checks);expect(actual.discovery).toEqual(s.discovery);expect(actual.practice).toEqual(s.practice);expect(actual.adventure.active.evidence[0].source).toBe('restoration');
 await p.reload();expect(JSON.stringify((await read(p)).adventure.active.tasks)).toBe(tasks);expect((await read(p)).adventure.active.i).toBe(1);
 await openWorkbench(p);await p.locator('dialog[open]').getByRole('button',{name:'Home',exact:true}).click();await expect(p.locator('#main h1')).toContainText('A little maths');await p.getByRole('button',{name:'Continue adventure',exact:false}).first().click();expect((await read(p)).adventure.active.i).toBe(1);
 // Both the map and help remain reachable inside a native activity dialog.
 await openWorkbench(p);await p.locator('dialog[open]').getByRole('button',{name:'World map',exact:true}).click();await expect(p.locator('#main h1')).toHaveText('Where will you go?');
 if(world==='number'){await p.locator('nav [data-nav="home"]').click();await p.getByRole('button',{name:'Continue adventure',exact:false}).first().click();await capture(p,info,'restoration-plan');}
 expect(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1)).toBe(false);
});
test('Get unstuck confirms the named activity, supports cancellation and preserves other plans',async({page:p},info)=>{
 const s=F.fresh();F.L.start(s,'cook-soup',2);F.townStep(s);const other=JSON.parse(JSON.stringify(F.L.state(s)));F.L.start(s,'shop-party',2);F.townStep(s);const old=JSON.parse(JSON.stringify(F.L.state(s)));await seed(p,s);
 await p.getByRole('button',{name:'Get unstuck',exact:true}).first().click();let d=p.getByRole('dialog',{name:'Get unstuck confirmation'});await expect(d).toContainText(old.name);await expect(d).toContainText('completed steps');await capture(p,info,'recovery-confirmation',d);await d.getByRole('button',{name:'Keep playing',exact:true}).click();expect((await read(p)).activityArchives).toBeUndefined();
 await p.getByRole('button',{name:'Get unstuck',exact:true}).first().click();await d.getByRole('button',{name:'Confirm restart',exact:true}).click();let a=await read(p);expect(a.adventure.townLifeV2.runs[other.id]).toEqual(other);expect(a.activityArchives[0].snapshot).toEqual(old);expect(a.adventure.townLifeV2.active).not.toBe(old.id);expect(a.bought).toEqual(s.bought);expect(a.discovery).toEqual(s.discovery);expect(a.checks).toEqual(s.checks);
 await p.getByRole('button',{name:'Get unstuck',exact:true}).first().click();await d.getByRole('button',{name:'Exit this activity',exact:true}).click();await expect(p.locator('#main h1')).toHaveText('Where will you go?');a=await read(p);expect(a.resumeView).toBeNull();expect(a.adventure.townLifeV2.runs[other.id]).toEqual(other);
 await p.getByRole('button',{name:'How to play',exact:true}).first().click();await expect(p.getByText('Earlier attempts · 2', {exact:true})).toBeVisible();
});
test('How to play is always available and keeps a saved restoration intact',async({page:p},info)=>{
 const s=F.restoration('ratio',0),q=JSON.parse(JSON.stringify(F.M.current(s)));await seed(p,s);await openWorkbench(p);await p.locator('dialog[open]').getByRole('button',{name:'How to play',exact:true}).click();await expect(p.locator('#main h1')).toHaveText('How to play');const help=await p.locator('#play-help').boundingBox();expect(help.x).toBeGreaterThanOrEqual(0);expect(help.x+help.width).toBeLessThanOrEqual(p.viewportSize().width);await expect(p.locator('.tour')).toContainText('starting point');await expect(p.locator('.tour')).toContainText('not proof of mastery');await expect(p.locator('.tour')).toContainText('optional');await capture(p,info,'how-to-play');await p.getByRole('button',{name:'Continue my activity',exact:true}).click();expect((await read(p)).adventure.active).toEqual(q);
});
for(const world of Object.keys(F.R.mapping))test(world+': reasoning controls and final restoration completion survive Continue',async({page:p},info)=>{
 const s=F.restoration(world,2);let q=F.M.current(s);q.i=2;q.phase='play';await seed(p,s);await openWorkbench(p);await p.locator('dialog[open] [data-action="c8-m:choice-'+q.tasks[2].answer+'"]').click();await p.getByRole('button',{name:'Check answer',exact:true}).click();expect((await read(p)).adventure.active.solved).toBe(true);
 if(world==='number')await capture(p,info,'reasoning',p.locator('dialog[open]'));
 const final=F.restoration(world,2);q=F.M.current(final);
 while(q.i<q.tasks.length-1){F.M.begin(final);const t=q.tasks[q.i];q.values.c8=t.activity?.kind==='choice'?{choice:Number(t.answer)}:{draft:t.answer};if(!F.M.submit(final))throw Error('Invalid final restoration fixture');F.M.next(final);q=F.M.current(final);}
 await seed(p,final);await openWorkbench(p);await p.getByRole('button',{name:'Try this task',exact:false}).click();const t=q.tasks[q.i];await p.locator('dialog[open] .c8-input').fill(t.answer);await p.getByRole('button',{name:'Check answer',exact:true}).click();await p.getByRole('button',{name:'Complete visit',exact:false}).click();await expect(p.locator('.recap')).toContainText('restoration stage is complete');let actual=await read(p);expect(actual.milestones).toContain(world+':2');expect(actual.restoration.completed[world+':2'].evidence).toHaveLength(12);expect(actual.restoration.completed[world+':2'].independentMastery).toBe(false);expect(actual.checks).toEqual(final.checks);
 if(world==='number')await capture(p,info,'restoration-recap');await p.locator('nav [data-nav="home"]').click();await p.getByRole('button',{name:'Continue adventure',exact:false}).first().click();await expect(p.locator('.recap')).toBeVisible();expect((await read(p)).adventure.active).toBeNull();
});
test('a real starting-point assessment opens its stage without awarding mastery',async({page:p})=>{
 const s=F.fresh();s.world='number';s.view='world';await seed(p,s);await p.locator('.restoration-path [data-action="discover:negative"]').first().click();
 for(let safety=0;safety<16;safety++){
  const a=await read(p);if(a.discovery.negative?.complete)break;
  if(a.view==='recap'){await p.locator('[data-action="discover:negative"]').click();continue;}
  const l=a.learning,q=l.qs[l.i],index=q[2].map(String).indexOf(String(q[1]));expect(index).toBeGreaterThanOrEqual(0);await p.locator('.answer-grid [data-action="answer:'+index+'"]').click();await p.locator('[data-action="next-learning"]').click();
 }
 let a=await read(p);expect(a.discovery.negative.complete).toBe(true);expect(a.skills).toEqual({});expect(a.checks).toEqual({});await p.locator('[data-action="world:number"]').first().click();await expect(p.locator('[data-action="restore:number:0"]')).toBeVisible();expect(await p.locator('[data-action="restore:number:1"]').count()).toBe(0);await p.locator('[data-action="restore:number:0"]').click();a=await read(p);expect(a.adventure.active.restoration.placement.band).toBe(9);
});
test('independent-check recovery retains prior answers and resumes the exact paused question',async({page:p})=>{
 const s=F.fresh();s.world='number';s.view=s.resumeView='check';s.practice.place={completed:true};s.checks.place={stage:0,due:0,reteach:false};s.learning={id:'place',mode:'check',qs:[['Earlier question','3',['3','4','5','6'],'Use the place values.','Three.'],['Saved current question','4',['4','5','6','7'],'Use the place values.','Four.']],i:1,correct:0,answers:[false],responses:[{question:'Earlier question',firstIndependent:false,assisted:true}],assisted:true,answered:false,started:true,manipulation:{amount:9}};await seed(p,s);
 await p.getByRole('button',{name:'Get unstuck',exact:true}).first().click();const d=p.getByRole('dialog',{name:'Get unstuck confirmation'});await expect(d).toContainText('Independent check');await expect(d).toContainText('Earlier answers');await d.getByRole('button',{name:'Confirm restart',exact:true}).click();let a=await read(p);expect(a.learning.i).toBe(1);expect(a.learning.responses).toEqual(s.learning.responses);expect(a.learning.assisted).toBe(true);
 await p.getByRole('button',{name:'Get unstuck',exact:true}).first().click();await d.getByRole('button',{name:'Exit this activity',exact:true}).click();a=await read(p);expect(a.learning).toBeNull();expect(a.pausedLearning['place|check'].responses).toEqual(s.learning.responses);await p.locator('[data-action="world:number"]').last().click();await p.locator('[data-action="check:place"]').click();a=await read(p);expect(a.learning.i).toBe(1);expect(a.learning.responses).toEqual(s.learning.responses);expect(a.learning.qs).toEqual(s.learning.qs);
});
