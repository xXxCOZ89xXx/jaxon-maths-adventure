'use strict';
// Render every generated activity definition, without a backend or learner data.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const E=require('../v3/engine').V3Engine,M=require('../v3/adventure').V3Adventure,L=require('../v3/town-life').V52TownLife,H=require('../v3/hands-on').V5HandsOn,C=require('../v3/curriculum').V3Curriculum,T=require('../v3/town').V3Town;
T.install(C,{supportedSkills:[],create:()=>[]});
const sandbox={window:{V3Engine:E,V3Adventure:M,V3Curriculum:C,V3Town:T,V5HandsOn:H,V52TownLife:L}};vm.createContext(sandbox);
for(const name of ['art','adventure-ui'])vm.runInContext(fs.readFileSync('v3/'+name+'.js','utf8'),sandbox);
const U=sandbox.window.V3AdventureUI,kinds={};let missions=0,town=0;
const physical=new Set(['sequence','array','volume','chart','measure','balance','ratio','bars','angle','blocks','budget','clock','order','match','coordinate','fraction','chance','grid','rotate','basket','offers','coins','journey','choice']);
function inspect(t,q){const html=U.controls(q,t);assert(html.includes('data-action=')||html.includes('data-model-range='),t.kind+' needs an input');if(physical.has(t.kind))assert(!html.includes('amount-editor'),t.kind+' must not rely on numeric editor');assert(t.teach&&t.example&&t.hint&&t.worked,t.kind+' teaching');kinds[t.kind]=(kinds[t.kind]||0)+1;if(t.visualContext==='stock'){assert(html.includes('stock-door'));assert(!html.includes('£'));}if(t.visualContext==='temperature')assert(html.includes('temperature-dial'));}
for(const w of E.worlds)for(const r of [...M.routes(w.id),{id:'gateway'}])for(const tier of [1,2,3])for(const seed of [1,2,7])for(let stage=0;stage<3;stage++){const t=M.task(w.id,r.id,tier,seed,stage);inspect(t,{world:w.id,route:r.id,values:{}});missions++;}
for(const c of L.catalog)for(const tier of [1,2,3])for(const seed of [1,2,7]){const j=L.make(c.id,tier,seed);for(const t of j.steps){inspect(t,{world:'town',route:t.venue,values:{}});town++;}}
// Exact notation/calculation practice can retain entry; independently assessed
// questions intentionally use answer choices without model/teaching assistance.
assert.equal(C.skills.length,55);const skills=C.skills.map(k=>({id:k.id,world:k.world,questions:k.qs.length,reason:'Calculate/identify the answer; supported models where the answer type permits, independent checks without aids.'}));
const result={worlds:E.worlds.length,skills:skills.length,townPlans:L.catalog.length,missionDefinitions:missions,townStages:town,kinds,exceptions:['Exact numerical/notation calculation practice and independent assessment','Pre-existing journey snapshots retain original tasks until completed; no rewriting saved answers or ledgers','Recipe preparation is sequenced from reference instructions; food/heat are not physically simulated'],liveWrites:0};fs.writeFileSync('tests/artifacts/gameplay-action-coverage.json',JSON.stringify(result,null,2)+'\n');console.log('PASS action/render coverage',result);
