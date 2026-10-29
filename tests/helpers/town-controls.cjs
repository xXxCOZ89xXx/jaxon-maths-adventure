const{expect}=require('@playwright/test');
async function openScene(page,mode){const d=page.locator('.immersive-journey .scene-dialog');if(await d.isVisible())await d.locator('[data-scene-close]').click();const opener=page.locator(`[data-scene-open="${mode}"]`).first();if(await opener.count())await opener.click();}
async function openCurrent(page){const world=page.locator('dialog.world-task-dialog');if(await world.count()&&!await world.isVisible())await page.locator('.activity-entry [data-world-task-open]').click();const d=page.locator('.immersive-journey .scene-dialog');if(await d.count()&&!await d.isVisible())await page.locator('.scene-dock [data-scene-open]').first().click();}
async function target(page,act){
 await openCurrent(page);const selector=`[data-action="${act}"]`;
 const world=page.locator('dialog.world-task-dialog[open]');if(await world.count()&&await world.locator(selector).count())return world.locator(selector).first();
 const dialog=page.locator('.immersive-journey .scene-dialog[open]');if(await dialog.count()&&await dialog.locator(selector).count())return dialog.locator(selector).first();
 for(const mode of ['task','pantry','fridge','basket','timetable','ticket'])if(await page.locator(`[data-scene-open="${mode}"]`).count()){await openScene(page,mode);const d=page.locator('.scene-dialog[open]');if(await d.locator(selector).count())return d.locator(selector).first();}
 const overlay=page.locator('.immersive-journey .scene-dialog[open]');if(await overlay.count())await overlay.locator('[data-scene-close]').click();
 return page.locator(selector).first();
}
async function click(page,act){const control=await target(page,act),door=control.locator("xpath=ancestor::details[contains(@class, 'stock-door')]");if(await door.count()&&(await door.getAttribute('open'))===null)await door.locator('summary').click();await control.click();await page.waitForFunction(()=>!document.documentElement.hasAttribute('data-saving'));}
async function seed(page,key,world,route,stage=0){await page.evaluate(({key,world,route,stage})=>{const s=V3Engine.fresh();s.tourSeen=true;V3Adventure.start(s,world,route,1);const q=V3Adventure.current(s);q.i=stage;q.phase='play';s.view='adventure';localStorage.setItem(key,JSON.stringify(s));},{key,world,route,stage});await page.reload();await openCurrent(page);}
async function run(page,key){return page.evaluate(k=>V52TownLife.state(JSON.parse(localStorage.getItem(k))),key);}
async function setRange(page,n){
 await openCurrent(page);const opener=page.locator('.scene-dock [data-scene-open]').first();if(await opener.count())await openScene(page,await opener.getAttribute('data-scene-open'));
 const range=page.locator('[data-model-range]').filter({visible:true}).first();
 if(await range.count())await range.evaluate((el,n)=>{el.value=String(n);el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));},n);
 else await page.locator('[data-numeric-answer]').filter({visible:true}).first().fill(String(n));
 await page.waitForFunction(()=>!document.documentElement.hasAttribute('data-saving'));
}
async function answer(page,t,choice){
 if(['order','match'].includes(t.kind)){for(let slot=0;slot<t.answer.length;slot++){await click(page,'j-pick:'+t.answer[slot]);await click(page,'j-place:'+slot);}}
 else if(['basket','budget'].includes(t.kind)){for(let i=0;i<t.answer.length;i++){let n=t.answer[i];for(const step of t.kind==='budget'?[1000,500,100,5,1]:[1])while(n>=step){if(t.kind==='budget'){await click(page,'j-budget-pick:'+step);await click(page,'j-budget-place:'+i);}else await click(page,`j-part:${i}:${step}`);n-=step;}}}
 else if(['choice','journey'].includes(t.kind))await click(page,'j-choice:'+(choice??t.answer));
 else if(t.kind==='coins'){let n=t.answer;for(let p of [5000,2000,1000,500,200,100,50,20,10,5,2,1])while(n>=p){await click(page,'j-coin:'+p);n-=p;}}
 else if(t.kind==='clock'){const h=Math.floor(t.answer/60),m=t.answer%60;await click(page,'j-value:'+h*60);await click(page,'j-value:'+(h*60+Math.floor(m/5)*5));if(m%5)for(let i=1;i<=m%5;i++)await click(page,'j-value:'+(h*60+Math.floor(m/5)*5+i));}
 else if(t.kind==='measure'||t.unit!=='p')await setRange(page,t.answer);
 else {let n=t.answer;for(const p of [5000,2000,1000,500,200,100,50,20,10,5,2,1])while(n>=p){await click(page,'j-adjust:'+p);n-=p;}}
}

module.exports={openScene,openCurrent,target,click,answer,setRange,run};
