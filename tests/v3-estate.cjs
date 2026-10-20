"use strict";
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const E=require('../v3/engine').V3Engine,M=require('../v3/adventure').V3Adventure,T=require('../v3/town').V3Town,C=require('../v3/curriculum').V3Curriculum;
let suites=0;function test(name,fn){fn();suites++;console.log('PASS estate: '+name)}
const ids=M.campMilestoneIds();
test('Eight exact thresholds, finite capacity and mansion without level-three or perfect mastery',()=>{
 assert.deepEqual(M.campStages.map(x=>x.need),[0,4,10,18,30,45,65,85]);
 assert.equal(ids.length,147);assert.equal(new Set(ids).size,147);
 const starter=ids.filter(id=>!id.startsWith('mission|')||id.endsWith('|1'));
 assert.equal(starter.length,65);
 const s=E.fresh();M.state(s);s.milestones=[...starter,...ids.filter(x=>x.endsWith('|2')).slice(0,20)];
 assert.equal(M.campProgress(s).current.id,8);assert.deepEqual(s.checks,{});assert.equal(s.coins,0);
 for(const st of M.campStages){const s=E.fresh();s.milestones=ids.slice(0,st.need);assert.equal(M.campProgress(s).current.id,st.id);if(st.need){const b=E.fresh();b.milestones=ids.slice(0,st.need-1);assert.equal(M.campProgress(b).current.id,st.id-1)}}
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
 s.milestones=ids.slice(0,4);assert.ok(M.campProgress(s).pending);M.celebrateCamp(s);assert.equal(M.campProgress(s).pending,false);
 s.milestones=ids.slice(0,10);assert.ok(M.campProgress(s).pending);assert.equal(M.campProgress(E.migrate(s)).current.id,3);
});
test('Backward-compatible history, equipment, projects and camp placements survive; earned home cannot downgrade',()=>{
 const old={...E.fresh(),coins:13.1545871666667,earned:250,minutes:25,bought:['cap','fox'],equipped:['cap','fox'],milestones:ids.slice(0,45),adventure:{camp:{shelf:'number|0',garden:'fractions|0'},campProjects:{greenhouse:true,lookout:true,noticeboard:true},unknownHistory:{keep:'yes'}},historical:{opaque:[1,2,3]}};
 const s=E.migrate(old);assert.equal(M.campProgress(s).current.id,6);
 for(const k of ['coins','earned','minutes','bought','equipped','milestones','historical'])assert.deepEqual(s[k],old[k]);
 assert.deepEqual(s.adventure.camp,old.adventure.camp);assert.deepEqual(s.adventure.campProjects,old.adventure.campProjects);assert.deepEqual(s.adventure.unknownHistory,old.adventure.unknownHistory);
 assert.deepEqual(E.migrate(s),s);s.milestones=[];assert.equal(M.campProgress(E.migrate(s)).current.id,6);
 assert.deepEqual(M.projects.map(p=>p.need),[12,30,60]);
});
test('All eight architectural scenes and home stages render bounded original SVG with machinery and old projects',()=>{
 const ctx={window:{V3Engine:E,V3Adventure:M,V3Town:T,V3Curriculum:C}};vm.createContext(ctx);
 for(const file of ['v3/art.js','v3/places-art.js'])vm.runInContext(fs.readFileSync(file,'utf8'),ctx);
 const A=ctx.window.V3Art,exteriors=new Set(),interiors=new Set();
 for(const v of T.venues){const ext=A.exterior(v.id),inside=A.location(v.id);assert.ok(ext.includes(v.name.replace('&','&amp;')));assert.ok(inside.includes('Inside '));assert.ok(!/NaN|undefined|d="[^"]*--/.test(ext+inside));exteriors.add(ext);interiors.add(inside)}
 assert.equal(exteriors.size,8);assert.equal(interiors.size,8);assert.equal(A.townPlots.length,8);
 for(const st of M.campStages){const s=E.fresh();s.milestones=ids.slice(0,st.need);const svg=A.camp(s);assert.ok(svg.includes('data-camp-stage="'+st.id+'"'));assert.ok(svg.includes(st.id<=2?'data-estate-part="'+(st.id===1?'starter-tent':'improved-tent')+'"':'data-estate-part="residence-'+st.id+'"'));assert.ok(!/NaN|undefined|d="[^"]*--/.test(svg));assert.ok((svg.match(/</g)||[]).length<1100);if(st.id>=6)for(const part of ['watermill','turning-waterwheel','stream-and-channel','storage-tank-and-pipework'])assert.ok(svg.includes('data-estate-part="'+part+'"'));if(st.id>=7)assert.ok(svg.includes('data-estate-part="private-power-grid"'));}
 const s=E.fresh();M.state(s).campProjects={greenhouse:true,lookout:true,noticeboard:true};const scene=A.camp(s);assert.ok(scene.includes('community-greenhouse'));assert.ok(scene.includes('Lookout'));assert.ok(scene.includes('M-31 0v-78'));
});
console.log(suites+' camp/architecture suites passed; no accounts, network or learning records used.');
