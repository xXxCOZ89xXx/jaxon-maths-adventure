"use strict";
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const E=require('../v3/engine').V3Engine,M=require('../v3/adventure').V3Adventure,T=require('../v3/town').V3Town,C=require('../v3/curriculum').V3Curriculum;
let suites=0;function test(name,fn){fn();suites++;console.log('PASS estate: '+name)}
const ids=M.campMilestoneIds();
function claimThrough(s,stage){for(let id=M.campProgress(s).current.id+1;id<=stage;id++)assert.ok(M.upgradeCamp(s,id));}
test('Eight exact thresholds, finite capacity and mansion without level-three or perfect mastery',()=>{
 assert.deepEqual(M.campStages.map(x=>x.need),[0,4,10,18,30,45,65,85]);
 assert.equal(ids.length,147);assert.equal(new Set(ids).size,147);
 const starter=ids.filter(id=>!id.startsWith('mission|')||id.endsWith('|1'));
 assert.equal(starter.length,65);
 const s=E.fresh();M.state(s);s.milestones=[...starter,...ids.filter(x=>x.endsWith('|2')).slice(0,20)];
 claimThrough(s,8);assert.equal(M.campProgress(s).current.id,8);assert.deepEqual(s.checks,{});assert.equal(s.coins,0);
 for(const st of M.campStages){const s=E.fresh();s.milestones=ids.slice(0,st.need);claimThrough(s,st.id);assert.equal(M.campProgress(s).current.id,st.id);if(st.need){const b=E.fresh();b.milestones=ids.slice(0,st.need-1);claimThrough(b,st.id-1);assert.equal(M.upgradeCamp(b,st.id),false);assert.equal(M.campProgress(b).current.id,st.id-1)}}
});
test('Duplicates, arbitrary strings, invalid routes and navigation do not advance upgrades or award coins',()=>{
 const s=E.fresh();M.state(s);s.milestones=Array(100).fill(ids[0]).concat(['fixture:12','mission|town|pharmacy|1','mission|number|0|4']);
 const before=JSON.stringify([s.coins,s.earned,s.minutes,s.weekly,s.skills,s.checks]);
 assert.equal(M.campProgress(s).count,1);assert.equal(M.campProgress(s).current.id,1);
 for(let i=0;i<10;i++){M.campProgress(s);M.celebrateCamp(s);M.campPlace(s,'shelf','');}
 assert.equal(JSON.stringify([s.coins,s.earned,s.minutes,s.weekly,s.skills,s.checks]),before);
});
test('Repeated actual expedition completions keep one milestone; a new stage celebrates once',()=>{
 const s=E.fresh();M.state(s);
 for(let repeat=0;repeat<5;repeat++){
  M.start(s,'number','0',1);
  for(let i=0;i<3;i++){M.begin(s);const q=M.current(s);M.edit(s,'amount',q.tasks[q.i].answer);assert.ok(M.submit(s));M.next(s);}
 }
 assert.equal(M.campProgress(s).count,1);assert.equal(s.milestones.length,1);assert.equal(s.coins,0);
 s.milestones=ids.slice(0,4);claimThrough(s,2);assert.ok(M.campProgress(s).pending);M.celebrateCamp(s);assert.equal(M.campProgress(s).pending,false);
 s.milestones=ids.slice(0,10);claimThrough(s,3);assert.ok(M.campProgress(s).pending);assert.equal(M.campProgress(E.migrate(s)).current.id,3);
});
test('Backward-compatible history, equipment, projects and camp placements survive; earned home cannot downgrade',()=>{
 const old={...E.fresh(),coins:13.1545871666667,earned:250,minutes:25,bought:['cap','fox'],equipped:['cap','fox'],milestones:ids.slice(0,45),adventure:{campEstate:{version:1,highest:6,celebrated:6},camp:{shelf:'number|0',garden:'fractions|0'},campProjects:{greenhouse:true,lookout:true,noticeboard:true},unknownHistory:{keep:'yes'}},historical:{opaque:[1,2,3]}};
 const s=E.migrate(old);assert.equal(M.campProgress(s).current.id,6);
 for(const k of ['coins','earned','minutes','bought','equipped','milestones','historical'])assert.deepEqual(s[k],old[k]);
 assert.deepEqual(s.adventure.camp,old.adventure.camp);assert.deepEqual(s.adventure.campProjects,old.adventure.campProjects);assert.deepEqual(s.adventure.unknownHistory,old.adventure.unknownHistory);
 assert.deepEqual(E.migrate(s),s);s.milestones=[];assert.equal(M.campProgress(E.migrate(s)).current.id,6);
 assert.deepEqual(M.projects.map(p=>p.need),[12,30,60]);
});
test('New and explicitly reset fictional saves start at Level 1 and zero builds',()=>{
 for(const s of [E.fresh(),E.migrate(E.fresh())]){
  for(let i=0;i<3;i++){assert.equal(M.campProgress(s).current.id,1);assert.equal(M.campProgress(s).count,0);assert.deepEqual(M.state(s).campProjects,{});}
  assert.equal(M.upgradeCamp(s,2),false);for(const p of M.projects)assert.equal(M.build(s,p.id),false);
 }
 const discarded=E.fresh();discarded.milestones=ids.slice(0,85);claimThrough(discarded,8);M.build(discarded,'greenhouse');
 const reset=E.migrate(E.fresh());assert.equal(M.campProgress(reset).current.id,1);assert.deepEqual(M.state(reset).campProjects,{});
});
test('Opening camp never upgrades; claims are sequential, earned and idempotent',()=>{
 const s=E.fresh();s.milestones=ids.slice(0,85);
 for(let i=0;i<10;i++)assert.equal(M.campProgress(s).current.id,1);
 assert.equal(M.upgradeCamp(s,8),false);assert.equal(M.upgradeCamp(s,0),false);
 const keep=JSON.stringify([s.coins,s.earned,s.minutes,s.weekly,s.checks,s.skills,s.settings,s.bought]);
 for(let level=2;level<=8;level++){assert.ok(M.upgradeCamp(s,level));assert.equal(M.upgradeCamp(s,level),false);assert.equal(M.campProgress(E.migrate(JSON.parse(JSON.stringify(s)))).current.id,level);}
 assert.equal(M.upgradeCamp(s,9),false);
 assert.equal(JSON.stringify([s.coins,s.earned,s.minutes,s.weekly,s.checks,s.skills,s.settings,s.bought]),keep);
});
test('Projects use saved completion only, survive JSON recovery and never award rewards',()=>{
 let s=E.fresh();s.milestones=ids.slice(0,30);claimThrough(s,5);
 assert.deepEqual(M.state(s).campProjects,{}); // Homestead does not pre-build greenhouse.
 const keep=JSON.stringify([s.coins,s.earned,s.minutes,s.weekly,s.checks,s.settings,s.milestones]);
 for(const p of M.projects){
  const locked=E.fresh();locked.milestones=ids.slice(0,p.need-1);assert.equal(M.build(locked,p.id),false);
  s.milestones=ids.slice(0,p.need);assert.ok(M.build(s,p.id));assert.equal(M.build(s,p.id),true);
  s=E.migrate(JSON.parse(JSON.stringify(s)));assert.equal(M.state(s).campProjects[p.id],true);
 }
 assert.deepEqual(M.state(s).campProjects,{greenhouse:true,lookout:true,noticeboard:true});
 s.milestones=ids.slice(0,30);assert.equal(JSON.stringify([s.coins,s.earned,s.minutes,s.weekly,s.checks,s.settings,s.milestones]),keep);
});
test('All eight architectural scenes and home stages render bounded original SVG with machinery and old projects',()=>{
 const ctx={window:{V3Engine:E,V3Adventure:M,V3Town:T,V3Curriculum:C}};vm.createContext(ctx);
 for(const file of ['v3/art.js','v3/places-art.js'])vm.runInContext(fs.readFileSync(file,'utf8'),ctx);
 const A=ctx.window.V3Art,exteriors=new Set(),interiors=new Set();
 for(const v of T.venues){const ext=A.exterior(v.id),inside=A.location(v.id);assert.ok(ext.includes(v.name.replace('&','&amp;')));assert.ok(inside.includes('Inside '));assert.ok(!/NaN|undefined|d="[^"]*--/.test(ext+inside));exteriors.add(ext);interiors.add(inside)}
 assert.equal(exteriors.size,8);assert.equal(interiors.size,8);assert.equal(A.townPlots.length,8);
 for(const st of M.campStages){const s=E.fresh();s.milestones=ids.slice(0,st.need);claimThrough(s,st.id);const svg=A.camp(s);assert.ok(svg.includes('data-camp-stage="'+st.id+'"'));assert.ok(svg.includes(st.id<=2?'data-estate-part="'+(st.id===1?'starter-tent':'improved-tent')+'"':'data-estate-part="residence-'+st.id+'"'));assert.ok(!/NaN|undefined|d="[^"]*--/.test(svg));assert.ok((svg.match(/</g)||[]).length<1100);if(st.id>=6)for(const part of ['watermill','turning-waterwheel','stream-and-channel','storage-tank-and-pipework'])assert.ok(svg.includes('data-estate-part="'+part+'"'));if(st.id>=7)assert.ok(svg.includes('data-estate-part="private-power-grid"'));}
 const unbuilt=E.fresh();unbuilt.milestones=ids.slice(0,30);claimThrough(unbuilt,5);assert.ok(!A.camp(unbuilt).includes('data-estate-part="community-greenhouse"'));
 const s=E.fresh();M.state(s).campProjects={greenhouse:true,lookout:true,noticeboard:true};const scene=A.camp(s);assert.ok(scene.includes('community-greenhouse'));assert.ok(scene.includes('Lookout'));assert.ok(scene.includes('M-31 0v-78'));
});
console.log(suites+' camp/architecture suites passed; no accounts, network or learning records used.');
