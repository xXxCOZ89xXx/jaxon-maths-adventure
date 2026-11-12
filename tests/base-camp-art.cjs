const assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto'),vm=require('node:vm');
const E=require('../v3/engine').V3Engine,M=require('../v3/adventure').V3Adventure;
const a=JSON.parse(fs.readFileSync('v3/assets/base-camp/manifest.json')).assets;
const proposed=JSON.parse(fs.readFileSync('docs/review/base-camp/proposed-assets.json')).assets;
assert.equal(a.length,54);assert.equal(new Set(a.map(x=>x.file)).size,54);
for(const entry of a){assert.equal(crypto.createHash('sha256').update(fs.readFileSync('v3/assets/base-camp/'+entry.file)).digest('hex'),entry.sha256);assert(proposed.some(p=>p.id===entry.id&&p.path==='v3/assets/base-camp/'+entry.file));}
const ctx={window:{V3Engine:E,V3Adventure:M,V3Curriculum:require('../v3/curriculum').V3Curriculum}};vm.createContext(ctx);vm.runInContext(fs.readFileSync('v3/art.js','utf8'),ctx);const A=ctx.window.V3Art;
for(const entry of a.filter(x=>x.id.startsWith('keepsake:'))){const id=entry.id.slice(9),art=A.keepsake({id,name:'Renamed without changing identity'});assert(art.includes('src="v3/assets/base-camp/'+entry.file+'"'));assert(!art.includes('<path'));assert(A.keepsake({id,name:'Renamed'},true).includes('<image'));}
for(const id of ['greenhouse','lookout','noticeboard'])for(const built of [false,true])assert(A.project(id,built).includes(`${id}-${built?'built':'planned'}.webp`));
console.log('PASS Base Camp art: 54 hashed mapped crops, 41 stable keepsake identities, SVG compatibility and planned/built asset separation.');
Object.assign(ctx,{V3Art:A,V3Adventure:M,V3Engine:E,V6AssetArt:{}});vm.runInContext(fs.readFileSync('v3/world-art.js','utf8'),ctx);
const s=E.fresh();s.milestones=M.campMilestoneIds().slice(0,85);M.state(s);
for(const level of M.campStages){const art=A.camp(s,level.id);assert(art.includes('src="v3/assets/rollout/camp1.webp"'),'Unbuilt projects must not appear baked into higher-tier scenery');}
M.build(s,'greenhouse');assert(A.camp(s,5).includes('src="v3/assets/rollout/camp1.webp"'));
M.build(s,'lookout');assert(A.camp(s,5).includes('src="v3/assets/rollout/camp3.webp"'));
M.build(s,'noticeboard');assert(A.camp(s,3).includes('src="v3/assets/rollout/camp2.webp"'));assert(A.camp(s,8).includes('src="v3/assets/rollout/camp4.webp"'));
console.log('PASS fixed background project imagery is gated by actual saved builds, including previews; all four approved backdrops remain available.');
