const {test,expect}=require('@playwright/test'),fs=require('node:fs');
const {fixture,mock}=require('./helpers/cloud-server.cjs');
const F=require('./helpers/guided-progression.cjs'),B=require('../v3/backend-config.js');
const before=process.env.NAV_BEFORE==='1',key='jaxon_v3_fictional_demo_2026';
const options={projectRef:B.production.projectRef,projectName:B.production.projectName,identity:{contractVersion:1,ready:true}};
async function selected(page,name){
 const nav=page.getByRole('navigation',{name:'Main navigation'});
 await expect(nav.locator('[aria-current="page"]')).toHaveCount(1);
 await expect(nav.getByRole('button',{name,exact:true})).toHaveAttribute('aria-current','page');
}
async function shot(page,info,name){
 await page.mouse.move(0,0);
 await page.evaluate(()=>Promise.all([...document.images].map(i=>i.decode().catch(()=>{}))));
 const dir=`docs/review/town-navigation/${before?'before':'after'}/${info.project.name}`;
 fs.mkdirSync(dir,{recursive:true});await page.screenshot({path:`${dir}/${name}.jpg`,type:'jpeg',quality:85});
}
for(const production of [true,false])test(`${production?'production':'offline'}: top navigation reflects Town and all sections after reload and browser history`,async({page},info)=>{
 const server=fixture();server.progress=F.fresh();server.progress.view='home';
 server.wallet.coins=server.progress.coins;server.wallet.owned=server.progress.bought.slice();
 const initialWallet=structuredClone(server.wallet);
 const preservedFields=['coins','earned','skills','checks','bought','equipped','settings','startingProfile','customFuture'];
 const preserved=structuredClone(server.progress);
 const errors=await mock(page,server,options),url=production?'/production-test-dist/':'/v3-adventure.html';
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.goto(url);
 if(production){
  await page.getByLabel('Email',{exact:true}).fill('learner@fictional.invalid');
  await page.getByLabel('Account password',{exact:true}).fill('fictional-only-password');
  await page.getByRole('button',{name:'Continue',exact:true}).click();
  await page.getByLabel('PIN',{exact:true}).fill('1234');
  await page.getByRole('button',{name:'Continue',exact:true}).click();
 }else{
  await page.evaluate(({s,key})=>localStorage.setItem(key,JSON.stringify(s)),{s:server.progress,key});await page.reload();
 }
 await expect(page.locator('#main h1')).toBeVisible();
 const nav=page.getByRole('navigation',{name:'Main navigation'});
 await nav.getByRole('button',{name:'Worlds',exact:true}).click();await selected(page,'Worlds');
 await nav.getByRole('button',{name:'Town',exact:true}).click();
 await expect(page.locator('#main h1')).toHaveText('Practical Maths Town');
 if(before){await selected(page,'Worlds');await expect(nav.getByRole('button',{name:'Town',exact:true})).not.toHaveAttribute('aria-current','page');if(production)await shot(page,info,'town');return;}
 await selected(page,'Town');if(production)await shot(page,info,'town');
 // Sections are saved app views, not URL routes. Real document back/forward
 // restores the latest saved view; clicking sections creates no history entries.
 const initialURL=page.url(),initialHistory=await page.evaluate(()=>history.length);
 for(const [label,heading] of [['Worlds','Where will you go?'],['Home','Base Camp'],['My explorer','Base Camp'],['Settings','Settings'],['How to play','How to play'],['Town','Practical Maths Town']]){
  await nav.getByRole('button',{name:label,exact:true}).click();
  await expect(page.locator('#main h1')).toHaveText(heading);await selected(page,label);
  expect(page.url()).toBe(initialURL);expect(await page.evaluate(()=>history.length)).toBe(initialHistory);
  await page.reload();await expect(page.locator('#main h1')).toHaveText(heading);await selected(page,label);
  if(production)await shot(page,info,label.toLowerCase().replaceAll(' ','-'));
 }
 await page.goto(url+'?navigation-history-check=1');await selected(page,'Town');
 await page.goBack();await expect(page.locator('#main h1')).toHaveText('Practical Maths Town');await selected(page,'Town');
 await page.goForward();await expect(page.locator('#main h1')).toHaveText('Practical Maths Town');await selected(page,'Town');
 // A stale last-selected Town must not select Town on the subject atlas.
 await nav.getByRole('button',{name:'Worlds',exact:true}).click();await selected(page,'Worlds');
 await page.locator('[data-action="world:number"]').first().click();await expect(page.locator('#main h1')).toHaveText('Number Forest');await selected(page,'Worlds');
 await page.reload();await selected(page,'Worlds');
 await nav.getByRole('button',{name:'Town',exact:true}).click();await selected(page,'Town');
 if(!production){
  const stored=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),key);
  for(const field of preservedFields)expect(stored[field]).toEqual(preserved[field]);
 }
 if(production){
  expect(server.wallet).toEqual(initialWallet);
  for(const field of preservedFields)expect(server.progress[field]).toEqual(preserved[field]);
 }
 if(!production){
  for(const town of [true,false]){
   const s=F.fresh();
   if(town)require('../v3/town-life').V52TownLife.start(s,'cook-pasta',1);else F.M.start(s,'number','0',1);
   await page.evaluate(({s,key})=>localStorage.setItem(key,JSON.stringify(s)),{s,key});await page.reload();
   await expect(page.locator('#main h1')).toBeVisible();await selected(page,town?'Town':'Worlds');
   await nav.getByRole('button',{name:'Home',exact:true}).click();await selected(page,'Home');
   await page.getByRole('button',{name:'Continue adventure',exact:false}).first().click();await selected(page,town?'Town':'Worlds');
  }
 }
 expect(errors).toEqual([]);expect(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1)).toBe(false);
});
