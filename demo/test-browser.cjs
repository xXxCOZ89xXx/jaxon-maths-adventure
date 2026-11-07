'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),http=require('node:http'),path=require('node:path');
const {chromium,webkit}=require('playwright');
const root=path.resolve(__dirname,'..'),dir=path.join(root,'demo-dist'),KEY='jaxon_public_demo_v1';
const inventory=JSON.parse(fs.readFileSync(path.join(root,'work/public-demo/build-inventory.json')));
const mime={'.html':'text/html','.js':'application/javascript','.css':'text/css','.svg':'image/svg+xml','.webp':'image/webp'};
const headers=fs.readFileSync(path.join(dir,'_headers'),'utf8').split('\n').slice(1).filter(Boolean).map(s=>{const i=s.indexOf(':');return [s.slice(0,i).trim(),s.slice(i+1).trim()]});
const server=http.createServer((req,res)=>{let file=path.resolve(dir,'.'+decodeURIComponent(new URL(req.url,'http://local').pathname));if(!file.startsWith(dir+path.sep)&&file!==dir){res.writeHead(403).end();return;}if(file===dir||fs.existsSync(file)&&fs.statSync(file).isDirectory())file=path.join(file,'index.html');const exists=fs.existsSync(file);for(const [k,v]of headers)res.setHeader(k,v);res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');res.writeHead(exists?200:404);res.end(fs.readFileSync(exists?file:path.join(dir,'404.html')));});
const report={target:process.env.DEMO_URL||'local build',layouts:[],staticAssets:inventory.files.length};
async function settled(p){await p.waitForFunction(()=>!document.documentElement.hasAttribute('data-saving'));}
async function click(p,selector){await p.locator(selector).first().click();await settled(p);}
async function state(p){await settled(p);return p.evaluate(k=>JSON.parse(localStorage.getItem(k)),KEY);}
async function verifyLayout(p){assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Page overflows viewport');for(const el of await p.locator('.topbar nav button').all()){const b=await el.boundingBox();assert(b.width>=40&&b.height>=40,'Navigation touch target too small');}}
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const local='http://127.0.0.1:'+server.address().port,base=process.env.DEMO_URL||local,origin=new URL(base).origin;
 const browser=await (process.env.DEMO_ENGINE==='webkit'?webkit:chromium).launch(process.env.DEMO_ENGINE==='webkit'?{headless:true}:{executablePath:fs.existsSync('/usr/bin/chromium')?'/usr/bin/chromium':chromium.executablePath(),headless:true,args:['--no-sandbox']});
 try{for(const layout of [{name:'desktop',viewport:{width:1440,height:1000}},{name:'ipad-portrait',viewport:{width:810,height:1080},isMobile:true,hasTouch:true},{name:'ipad-landscape',viewport:{width:1080,height:810},isMobile:true,hasTouch:true}]){
 const ctx=await browser.newContext({...layout,serviceWorkers:'block'}),p=await ctx.newPage(),requests=[],external=[],errors=[],storageOps=[];
 await ctx.route('**/*',route=>{const url=route.request().url();requests.push(url);if(new URL(url).origin!==origin){external.push(url);return route.abort();}return route.continue();});
 p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
 await ctx.exposeBinding('recordStorage',(_,op)=>storageOps.push(op));
 await ctx.addInitScript(()=>{for(const name of ['getItem','setItem','removeItem','clear']){const orig=Storage.prototype[name];Storage.prototype[name]=function(...args){window.recordStorage({area:this===localStorage?'local':'session',op:name,key:args[0]||null});return orig.apply(this,args)}}});
 let response=await p.goto(base);assert.equal(response.status(),200);assert.equal(new URL(p.url()).origin,origin);assert((await response.allHeaders())['content-security-policy'].includes("connect-src 'none'"));
 assert(await p.getByText('Demo only — progress is saved on this device and is not connected to Jaxon’s game',{exact:true}).isVisible());
 assert.equal(await p.locator('input[type=password],input[type=email],[data-nav=parent],[data-action="nav:parent"]').count(),0);
 assert.equal(await p.evaluate(()=>typeof window.V3CloudContext),'undefined');
 await verifyLayout(p);
 // Every published asset must be accessible without credentials. No fallbacks/missing art.
 if(layout.name==='desktop')for(const f of inventory.files.filter(f=>f.path!=='_headers')){const r=await ctx.request.get(new URL(f.path,base.endsWith('/')?base:base+'/').href);assert.equal(r.status(),200,f.path);}
 await click(p,'[data-action="skip-tour"]');
 await click(p,'.home-path [data-action="nav:starting"]');
 await click(p,'[data-action="starting:number"]');await click(p,'[data-action="starting-choice:0"]');const before=await state(p);assert.equal(before.startingProfile.areas.number.responses.length,1);
 await p.reload();assert.deepEqual((await state(p)).startingProfile,before.startingProfile);
 await click(p,'[data-action="pause-explore"]');
 // Complete all nine real demo starting samples through the visible UI (no seeded learner).
 await click(p,'.home-path [data-action="nav:starting"]');
 for(const id of ['number','fractions','algebra','geometry','ratio','statistics','probability','measure','town']){
 await click(p,`[data-action="starting:${id}"]`);
 while(!(await p.evaluate(({key,id})=>V11StartingProfile.valid(JSON.parse(localStorage.getItem(key)).startingProfile.areas[id]),{key:KEY,id}))){const s=await state(p),a=s.startingProfile.areas[id];if(a.answered)await click(p,'[data-action="starting-next"]');else await click(p,'[data-action="starting-skip"]');if((await state(p)).view==='starting')break;}
 }
 assert(await p.evaluate(k=>V11StartingProfile.complete(JSON.parse(localStorage.getItem(k))),KEY));
 await click(p,'[data-nav="map"]');await verifyLayout(p);await p.screenshot({path:path.join(root,'work/public-demo',layout.name+'-map.png'),fullPage:true});
 for(const w of ['number','fractions','algebra','geometry','ratio','statistics','probability','measure']){await click(p,`[data-action="world:${w}"]`);await verifyLayout(p);await click(p,'[data-nav="map"]');}
 await click(p,'[data-action="world:number"]');await click(p,'[data-action="learn:negative"]');await verifyLayout(p);
 await click(p,'[data-action="pause-explore"]');await p.reload();assert((await state(p)).pausedLearning);
 await click(p,'[data-nav="settings"]');await click(p,'[data-setting="motion"]');const settings=(await state(p)).settings;await p.reload();assert.deepEqual((await state(p)).settings,settings);
 // Injecting the removed parent route cannot expose a parent screen.
 await p.evaluate(()=>{const b=document.createElement('button');b.dataset.action='nav:parent';b.id='parent-probe';b.textContent='probe';document.body.append(b)});await click(p,'#parent-probe');await p.locator('#parent-probe').evaluate(el=>el.remove());assert(!await p.locator('#main').innerText().then(t=>t.includes('Demo parent summary')));
 const saved=await state(p);const isolation=await browser.newContext();const second=await isolation.newPage();await second.goto(base);assert.equal(await second.evaluate(k=>localStorage.getItem(k),KEY),null);await isolation.close();
 // A second origin in the SAME browser context cannot read or replace the save.
 const firstOriginOps=storageOps.slice();
 const otherOrigin=local.replace('127.0.0.1','localhost');
 const other=await ctx.newPage();
 await other.route('**/*',r=>new URL(r.request().url()).origin===otherOrigin?r.continue():r.abort());
 await other.goto(otherOrigin);assert.equal(await other.evaluate(k=>localStorage.getItem(k),KEY),null);
 await other.evaluate(k=>localStorage.setItem(k,'fictional-other-origin'),KEY);
 assert.deepEqual(await state(p),saved);await other.close();
 await p.screenshot({path:path.join(root,'work/public-demo',layout.name+'.png'),fullPage:true});
 const keys=await p.evaluate(()=>Object.keys(localStorage));assert.deepEqual(keys,[KEY]);assert.equal(await p.evaluate(()=>sessionStorage.length),0);assert.equal((await ctx.cookies()).length,0);
 assert(firstOriginOps.every(o=>o.area==='local'&&o.key===KEY&&['getItem','setItem'].includes(o.op)),JSON.stringify(storageOps));
 assert.equal(saved.startingProfile.areas.number.responses.length,4);
 // All clickable links remain fragments or the demo root.
 for(const href of await p.locator('a[href]').evaluateAll(els=>els.map(a=>a.getAttribute('href'))))assert(href==='/'||href.startsWith('#'),href);
 assert.deepEqual(external,[]);assert.deepEqual(errors,[]);
 report.layouts.push({layout:layout.name,requests:requests,externalRequests:external,storageKeys:keys,storageOperations:storageOps.length,cookies:0,consoleErrors:errors.length,passed:true});await ctx.close();console.log('PASS '+layout.name);
 }
 }finally{await browser.close();server.close();}
 fs.writeFileSync(path.join(root,'work/public-demo/browser-results.json'),JSON.stringify(report,null,2)+'\n');
})().catch(e=>{console.error(e);server.close();process.exitCode=1});
