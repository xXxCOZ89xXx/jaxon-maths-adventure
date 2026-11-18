const {test,expect}=require('./helpers/identities.cjs'),F=require('./helpers/guided-progression.cjs'),fs=require('node:fs');
const settled=p=>p.waitForFunction(()=>!document.documentElement.hasAttribute('data-saving'));
async function seed(camp,s){await camp.page.evaluate(({key,s})=>localStorage.setItem(key,JSON.stringify(s)),{key:camp.key,s});await camp.page.reload();await settled(camp.page);}
async function readable(p){const small=await p.locator('body *').evaluateAll(es=>es.filter(e=>{const st=getComputedStyle(e),box=e.getBoundingClientRect();return box.width>0&&box.height>0&&st.visibility!=='hidden'&&st.display!=='none'&&Number(st.opacity)!==0&&[...e.childNodes].some(n=>n.nodeType===3&&n.textContent.trim())&&parseFloat(st.fontSize)>0&&parseFloat(st.fontSize)<14&&!e.closest('[hidden],dialog:not([open])');}).map(e=>({tag:e.tagName,cls:e.className?.baseVal??e.className,font:getComputedStyle(e).fontSize,text:e.textContent.slice(0,50)})));expect(small).toEqual([]);expect(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);}
test('number line uses the task width and existing button answers still save with a compact activity header',async({camp},info)=>{
 const p=camp.page;await p.evaluate(key=>{const s=V3Engine.fresh();s.startingProfile=window.FictionalStartingProfile;s.tourSeen=true;s.discovery.negative={complete:true,rounds:[{band:7,correct:2,total:4}],answers:[]};const error=V3Engine.generate(s,'negative','practice',JaxonFreshReview,V3Curriculum);if(error)throw Error(error);localStorage.setItem(key,JSON.stringify(s));},camp.key);await p.reload();await p.locator('[data-action="practice"]').click();await settled(p);
 const line=p.locator('.d9-line-window');await expect(line).toBeVisible();const boxes=await p.evaluate(()=>{const a=document.querySelector('.learning-practice-split').getBoundingClientRect(),b=document.querySelector('.learning-practice-split>.panel').getBoundingClientRect();return {all:a.width,task:b.width};});expect(boxes.task/boxes.all).toBeGreaterThan(.95);await expect(p.locator('body')).toHaveClass(/task-active/);await expect(p.locator('#headerExplorer')).toBeHidden();
 const targets=await p.locator('.topbar nav button').evaluateAll(es=>es.map(e=>e.getBoundingClientRect()).filter(r=>r.width&&r.height).map(r=>({w:r.width,h:r.height})));for(const r of targets){expect(r.w).toBeGreaterThanOrEqual(44);expect(r.h).toBeGreaterThanOrEqual(44);}
 await p.getByRole('button',{name:'One step right',exact:true}).click();await settled(p);expect((await camp.read()).learning.manipulation.d9.value).toBe(-19);
 if(p.viewportSize().width<600){
  await line.scrollIntoViewIfNeeded();const rect=await line.boundingBox(),cdp=await p.context().newCDPSession(p),y=rect.y+45,start=rect.x+rect.width-25,end=rect.x+25;
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:start,y,id:1}]});
  for(let i=1;i<=8;i++){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:start+(end-start)*i/8,y,id:1}]});await p.waitForTimeout(20);}
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await cdp.detach();
  await expect.poll(()=>line.evaluate(e=>e.scrollLeft)).toBeGreaterThan(0);expect((await camp.read()).learning.manipulation.d9.value).toBe(-19);
 }
 await p.reload();expect((await camp.read()).learning.manipulation.d9.value).toBe(-19);await readable(p);
 fs.mkdirSync('work/phase2-ui',{recursive:true});await p.screenshot({path:`work/phase2-ui/${info.project.name}-line.png`});
});
test('Town labels stay visible and close-ups put task controls before money and navigation',async({camp},info)=>{
 const p=camp.page,s=F.fresh();s.view='world';s.world='town';await seed(camp,s);
 const labels=p.locator('.building-navigation .building-hit .object-tag');expect(await labels.count()).toBe(8);for(const label of await labels.all()){await expect(label).toHaveCSS('opacity','1');await expect(label).toBeVisible();}
 await readable(p);fs.mkdirSync('work/phase2-ui',{recursive:true});await p.screenshot({path:`work/phase2-ui/${info.project.name}-town.png`});
 const plan=F.fresh();F.L.startRecipe(plan,'bolognese',1);await seed(camp,plan);await p.locator('[data-scene-open="pantry"]').first().click();const d=p.locator('dialog[open]');await expect(d.locator('.scene-closeup-controls')).toBeVisible();
 expect(await d.evaluate(d=>{const a=d.querySelector('.scene-closeup-controls'),b=d.querySelector('.scene-money'),n=d.querySelector('.activity-safety');return !!(a.compareDocumentPosition(b)&Node.DOCUMENT_POSITION_FOLLOWING)&&!!(a.compareDocumentPosition(n)&Node.DOCUMENT_POSITION_FOLLOWING);})).toBe(true);await expect(d.locator('.scene-money')).not.toHaveAttribute('open');await d.locator('.scene-money>summary').click();await expect(d.locator('.money-balances')).toBeVisible();await readable(p);
 await p.screenshot({path:`work/phase2-ui/${info.project.name}-task.png`});
});
test('ingredient pictures fit inside the supermarket shelf touch targets',async({camp})=>{
 const s=F.fresh();F.L.start(s,'cook-pasta');while(F.L.task(s).visualContext!=='shelves')F.townStep(s);await seed(camp,s);
 const images=camp.page.locator('.shelf-touch .recipe-ingredient-image');expect(await images.count()).toBeGreaterThan(0);
 const sizes=await images.evaluateAll(async es=>{await Promise.all(es.map(e=>e.decode()));return es.map(e=>{const a=e.getBoundingClientRect(),b=e.closest('.shelf-touch').getBoundingClientRect();return {imageWidth:a.width,imageHeight:a.height,targetWidth:b.width,targetHeight:b.height};});});
 for(const r of sizes){expect(r.imageWidth).toBeLessThanOrEqual(r.targetWidth+1);expect(r.imageHeight).toBeLessThanOrEqual(r.targetHeight+1);expect(r.targetWidth).toBeGreaterThanOrEqual(44);}
});
