const {test,expect}=require('@playwright/test'),fs=require('node:fs');
const F=require('./helpers/guided-progression.cjs'),KEY='jaxon_v3_fictional_demo_2026';
const before=process.env.BASE_CAMP_BEFORE==='1';
async function read(p){await p.waitForFunction(()=>!document.documentElement.hasAttribute('data-saving'));return p.evaluate(k=>JSON.parse(localStorage.getItem(k)),KEY);}
async function seed(p,s){F.M.state(s);await p.goto('/v3-adventure.html');await p.evaluate(({s,k})=>localStorage.setItem(k,JSON.stringify(s)),{s,k:KEY});await p.reload();await p.locator('#main h1').waitFor();}
async function shot(p,info,name,loc){const dir=`docs/review/base-camp/${before?'before':'after'}/${info.project.name}`;fs.mkdirSync(dir,{recursive:true});await p.evaluate(()=>Promise.all([...document.images].map(i=>i.decode().catch(()=>{}))));await (loc||p).screenshot({path:`${dir}/${name}.jpg`,type:'jpeg',quality:82,...(loc?{}:{fullPage:true})});}
function collected(){const s=F.fresh();F.M.state(s);for(const world of ['number','fractions','algebra'])s.adventure.records[world+'|0|1']={world,route:'0',tier:1};s.milestones=['mission|number|0|1','mission|fractions|0|1','mission|algebra|0|1'];s.view='camp';s.adventure.camp={shelf:'number|0',garden:'fractions|0',gate:'algebra|0'};return s;}
test.beforeEach(async({page:p})=>{p.errors=[];p.external=[];p.on('pageerror',e=>p.errors.push(e.message));await p.route('**/*',r=>{if(new URL(r.request().url()).origin==='http://127.0.0.1:4173')return r.continue();p.external.push(r.request().url());return r.abort();});await p.emulateMedia({reducedMotion:'reduce'});});
test.afterEach(async({page:p})=>{expect(p.errors).toEqual([]);expect(p.external).toEqual([]);expect(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1)).toBe(false);});
test('visual audit: empty and earned sections, current artwork',async({page:p},info)=>{
 const s=F.fresh();s.view='camp';await seed(p,s);await shot(p,info,'new-camp');await shot(p,info,'empty-builds',p.locator('#camp-projects'));
 await seed(p,collected());await shot(p,info,'adventure-display',p.locator('.camp-designer'));const journal=p.locator('.camp-workshop > details');await journal.evaluate(e=>e.open=true);await shot(p,info,'keepsake-collection',journal);await shot(p,info,'build-projects',p.locator('#camp-projects'));await shot(p,info,'upgrade-planner',p.locator('#estate-planner'));
});
test('progression locks, earned upgrades and saved builds',async({page:p},info)=>{
 test.skip(before,'Functional assertions apply to changed code');
 const s=F.fresh();s.view='camp';s.minutes=7;s.earned=70;s.weekly={'2026-11-09':7};s.settings={motion:false,sound:false};
 await seed(p,s);const planner=p.locator('#estate-planner'),projects=p.locator('#camp-projects');
 await expect(planner).toContainText('BASE CAMP LEVEL 1 / 8');await expect(planner).toContainText('earn 4 unique milestones');await expect(planner).toContainText('Complete different world restoration stages or expedition difficulty levels');
 await expect(planner.locator('[data-action="camp-upgrade:2"]')).toBeDisabled();for(let i=2;i<=8;i++)await expect(planner.locator(`[data-action="camp-preview:${i}"]`)).toBeDisabled();
 await expect(projects).toContainText('0 / 3 projects built');expect((await read(p)).adventure.campProjects).toEqual({});await expect(projects.locator('.badge').first()).toHaveText('0 / 12 LANDMARKS');
 const invariant=x=>({coins:x.coins,earned:x.earned,minutes:x.minutes,weekly:x.weekly,settings:x.settings,checks:x.checks,skills:x.skills,bought:x.bought,equipped:x.equipped,startingProfile:x.startingProfile,customFuture:x.customFuture});
 const untouched=invariant(await read(p));
 for(let n=0;n<2;n++){await p.getByRole('button',{name:'Subject worlds',exact:true}).first().click();await p.getByRole('button',{name:'Home',exact:true}).first().click();}
 expect(invariant(await read(p))).toEqual(untouched);await expect(planner).toContainText('BASE CAMP LEVEL 1 / 8');
 const earned=await read(p);earned.milestones=F.M.campMilestoneIds().slice(0,30);await seed(p,earned);
 await expect(planner).toContainText('BASE CAMP LEVEL 1 / 8');await expect(projects).toContainText('0 / 3 projects built');await shot(p,info,'earned-before-claim',planner);
 await planner.locator('[data-action="camp-upgrade:2"]').click();await expect(planner).toContainText('BASE CAMP LEVEL 2 / 8');await expect(planner.locator('[data-action="camp-preview:3"]')).toBeDisabled();
 await p.reload();await expect(planner).toContainText('BASE CAMP LEVEL 2 / 8');
 for(let level=3;level<=5;level++)await planner.locator(`[data-action="camp-upgrade:${level}"]`).click();
 await expect(projects).toContainText('0 / 3 projects built');await expect(projects.locator('[data-action="camp-build:greenhouse"]')).toBeEnabled();await expect(projects.locator('[data-action="camp-build:noticeboard"]')).toBeDisabled();
 await projects.locator('[data-action="camp-build:greenhouse"]').click();await expect(projects).toContainText('1 / 3 projects built');await projects.locator('[data-action="camp-build:lookout"]').click();await expect(projects).toContainText('2 / 3 projects built');
 const built=(await read(p)).adventure.campProjects;expect(built).toEqual({greenhouse:true,lookout:true});await shot(p,info,'completed-builds',projects);await shot(p,info,'earned-level-5',planner);
 await p.getByRole('button',{name:'Subject worlds',exact:true}).first().click();await p.getByRole('button',{name:'Home',exact:true}).first().click();await p.reload();expect((await read(p)).adventure.campProjects).toEqual(built);await expect(projects).toContainText('2 / 3 projects built');expect(invariant(await read(p))).toEqual(untouched);
 // An explicit replacement of a fictional local fixture models a full game reset.
 const reset=F.fresh();reset.view='camp';await seed(p,reset);await expect(planner).toContainText('BASE CAMP LEVEL 1 / 8');await expect(projects).toContainText('0 / 3 projects built');
});
test('milestone-ready save does not substitute for a claimed home or completed project',async({page:p},info)=>{
 const s=collected();s.milestones=F.M.campMilestoneIds().slice(0,30);await seed(p,s);await shot(p,info,'milestone-ready-planner',p.locator('#estate-planner'));await shot(p,info,'milestone-ready-builds',p.locator('#camp-projects'));
 if(!before){await expect(p.locator('#estate-planner')).toContainText('BASE CAMP LEVEL 1 / 8');await expect(p.locator('#camp-projects')).toContainText('0 / 3 projects built');}
});
