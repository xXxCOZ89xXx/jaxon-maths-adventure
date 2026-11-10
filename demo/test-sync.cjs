'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),{execFileSync,spawnSync}=require('node:child_process');
const root=path.resolve(__dirname,'..'),build=()=>execFileSync(process.execPath,['demo/build.cjs'],{cwd:root,stdio:'pipe'});
build();execFileSync(process.execPath,['demo/check.cjs'],{cwd:root,stdio:'pipe'});
const audited=JSON.parse(fs.readFileSync(path.join(__dirname,'dependencies.json'))),inv=JSON.parse(fs.readFileSync(path.join(root,'work/public-demo/build-inventory.json')));
const transformed=new Set(['v3/app.js','v3/starting-profile.js','v3/activity-navigation.js','v3/town.js']);
for(const file of inv.scripts)if(!transformed.has(file))assert.equal(fs.readFileSync(path.join(root,'demo-dist',file),'utf8'),fs.readFileSync(path.join(root,file),'utf8'),file+' must be shared verbatim');
for(const branch of ['', 'codex/offline-demo-release-sync','main']){const r=spawnSync(process.execPath,['demo/release-build.cjs'],{cwd:root,env:{...process.env,CF_PAGES_BRANCH:branch},encoding:'utf8'});assert.notEqual(r.status,0);assert.match(r.stderr,/only from release\/ipad/);}
// Simulate a later approved source change in a disposable copy; never publish it.
const scratch=fs.mkdtempSync(path.join(root,'work/demo-sync-'));
try{
 const files=new Set([...audited.source.map(x=>x.path),...audited.images.map(x=>x.path),'demo/build.cjs','demo/check.cjs','demo/dependencies.json',...['checkpoint','rollout','world-guide-portraits-preview','ingredients'].map(x=>'v3/assets/'+x+'/manifest.json')]);
 for(const file of files){const target=path.join(scratch,file);fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync(path.join(root,file),target);}
 fs.appendFileSync(path.join(scratch,'v3/home-activities.js'),'\n// Fictional subsequent approved source revision for rebuild verification.\n');
 execFileSync(process.execPath,['demo/build.cjs'],{cwd:scratch,stdio:'pipe'});execFileSync(process.execPath,['demo/check.cjs'],{cwd:scratch,stdio:'pipe'});
 const later=JSON.parse(fs.readFileSync(path.join(scratch,'work/public-demo/build-inventory.json'))),before=inv.files.find(f=>f.path==='v3/home-activities.js'),after=later.files.find(f=>f.path===before.path);assert.notEqual(before.sha256,after.sha256);assert(fs.readFileSync(path.join(scratch,'demo-dist/v3/home-activities.js'),'utf8').includes('subsequent approved source revision'));
}finally{fs.rmSync(scratch,{recursive:true,force:true});}
// Shared Home calendar, postage arithmetic, choice validation and old-snapshot preservation.
const c=require('../scripts/audit-curriculum.cjs').load();c.V3Art={esc:String};c.V7WorldArt={};c.V3AdventureUI={controls:()=>''};vm.runInContext(fs.readFileSync(path.join(root,'v3/home-activities.js'),'utf8'),c);
const H=c.V7Home,E=c.V3Engine,M=c.V3Adventure;
for(const date of ['2026-11-08T12:00:00Z','2026-11-09T12:00:00Z','2026-12-31T12:00:00Z','2027-01-01T12:00:00Z','2027-03-28T23:30:00Z','2026-10-25T00:30:00Z']){const t=H.collectionCalendar(new Date(date));assert.equal(new Date(t.collection).getUTCDay(),1);assert.equal(new Date(t.putOut).getUTCDay(),0);assert(new Date(t.collection)>new Date(t.today));assert.equal((new Date(t.collection)-new Date(t.putOut))/86400000,1);assert.equal(t.options[t.answer].name,t.bins+' · '+new Intl.DateTimeFormat('en-GB',{timeZone:'UTC',weekday:'long',day:'numeric',month:'long',year:'numeric'}).format(new Date(t.putOut)));}
assert.equal(H.collectionCalendar(new Date('2026-11-08T12:00:00Z')).bins,'General waste and food caddy');assert.equal(H.collectionCalendar(new Date('2026-11-09T12:00:00Z')).bins,'Mixed recycling and food caddy');
for(const tier of [1,2,3])for(let seed=1;seed<=10;seed++){
 const ts=H.tasks('post',tier,seed);assert.equal(ts.length,4);const weight=ts[1].answer,choice=ts[2],cost=choice.options[choice.answer].price;assert(choice.options[choice.answer].limit>=weight);assert(choice.options.filter(o=>o.limit>=weight).every(o=>o.price>=cost));assert.equal(ts[3].answer,Math.ceil(cost/500)*500-cost);
 const s=E.fresh();H.start(s,'post',tier);const q=M.current(s);assert(q,JSON.stringify({tier,seed,state:s.adventure}));q.i=2;q.phase='play';const t=q.tasks[2];M.edit(s,'choice',(t.answer+1)%3);assert.equal(M.submit(s),false);M.edit(s,'choice',t.answer);assert.equal(M.submit(s),true);
 const saved=JSON.stringify(q);H.start(s,'recycling',tier);assert.equal(M.current(s).context.homeActivity,'recycling');assert.equal(JSON.stringify(M.state(s).suspended[q.key]),saved,'Earlier Home snapshot stays saved');H.start(s,'post',tier);assert.equal(JSON.stringify(M.current(s)),saved,'Selecting the same activity resumes it exactly');
}
for(const kind of ['meters','recycling','post']){
 const s=E.fresh();H.start(s,kind);const q=M.current(s);
 // Legacy Home visits predate the additive marker and all have three tasks,
 // even when generated inside the expanded contentVersion 8 curriculum.
 delete q.homeContentVersion;q.tasks=q.tasks.slice(0,3);q.contentVersion=8;
 const saved=JSON.stringify(q);assert.equal(JSON.stringify(M.current(s)),saved);
 H.start(s,kind);assert.equal(JSON.stringify(M.current(s)),saved,'Legacy '+kind+' visit must resume unchanged');
 H.start(s,'post');assert.equal(M.current(s).context.homeActivity,'post');if(kind!=='post')assert.equal(JSON.stringify(M.state(s).suspended[q.key]),saved,'Legacy '+kind+' stays available after choosing Post');
}
console.log('PASS shared Home/Town source parity; later shared edit rebuilds safely; release-only branch guard; calendar/DST/year boundaries; packaged-weight postage, change, choices and snapshots.');
