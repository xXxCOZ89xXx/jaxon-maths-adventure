// Targeted contract/build/old-queue tests, no network and no browser-suite rerun.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),vm=require('node:vm');
const P=require('../v3/staging-preserve.js'),Sync=require('../v3/cloud-sync.js');
const {build,entry}=require('../scripts/build-v52-staging.cjs');
const config={environment:'staging',projectName:'jaxon-maths-v3-staging',projectRef:'abcdefghijklmnopqrst',authorizedRef:'abcdefghijklmnopqrst',
 url:`https://abcdefghijklmnopqrst.supabase.co`,anonKey:'sb_publishable_fictional_preservation_fixture_only_0000'};
const id={name:config.projectName,projectRef:'abcdefghijklmnopqrst',stagingUpgradeVersion:2};
const results=[];async function test(label,f){await f();results.push(label);console.log('PASS',label);}
(async()=>{
 await test('staging identity/version fails closed and preserves all existing namespace literals',()=>{
  P.verify(config,id);
  for(const wrong of [{...id,stagingUpgradeVersion:1},{...id,projectRef:'mbdelspbjusarbwlltol'},{...id,name:'jaxon-maths-production'}])assert.throws(()=>P.verify(config,wrong));
  const old=fs.readFileSync('v3/staging-app.js','utf8'),next=entry();
  for(const marker of ['jaxon_v3_staging_auth:','jaxon_v3_staging:','v3-intent:','v3-unlock:','v3-last-remote:',':queue'])
   assert.equal(next.split(marker).length,old.split(marker).length,'Storage namespace changed: '+marker);
  assert.ok(next.includes('Preserve.verify(c,check.data)'));
  assert.ok(next.includes('Existing queues and drafts are retained'));
 });
 await test('pre-upgrade transaction retry keeps extra fields and request identity; failed retries retain exact bytes',async()=>{
  const source=entry().split('async function transaction(op, payload) {')[1].split('async function heartbeat')[0];
  const saved=' {"op":"award","payload":{"amount":5,"requestId":"old-request-id","legacyExtra":"keep"}} ';
  const data=new Map([[`v3-intent:abcdefghijklmnopqrst:fictional-parent`,saved]]);let sent,fail=true,ids=0;
  const ctx={Preserve:P,c:config,identity:{user:'fictional-parent'},wallet:null,crypto:{randomUUID(){ids++;return 'new-id';}},
   localStorage:{getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,v),removeItem:k=>data.delete(k)},
   rpc:async(op,p)=>{if(op==='read')return {wallet:{coins:7},revision:3,progress:{}};sent=p;if(fail)throw {code:'P0001',message:'Review required'};return {wallet:{coins:7}};}};
  vm.runInNewContext('async function transaction(op,payload){'+source+'\nthis.transaction=transaction;',ctx);
  await assert.rejects(ctx.transaction('award',{amount:5}));
  assert.equal(data.get(`v3-intent:abcdefghijklmnopqrst:fictional-parent`),saved);
  assert.equal(sent.requestId,'old-request-id');assert.equal(sent.legacyExtra,'keep');assert.equal(ids,0);
  fail=false;await ctx.transaction('award',{amount:5});
  assert.ok(!data.has(`v3-intent:abcdefghijklmnopqrst:fictional-parent`));assert.equal(ids,0);
 });
 await test('existing save queue remains intact on rejection and commits an exact retry without reseeding',async()=>{
  const key='existing-queue',doc={version:1,revision:7,pending:{requestId:'same-id',revision:7,progress:{draft:'keep'}},latest:null,conflict:null,archives:[{old:'retained'}]};
  const map=new Map([[key,JSON.stringify(doc)]]),raw=map.get(key);let fail=true,seen;
  const storage={getItem:k=>map.get(k)||null,setItem:(k,v)=>map.set(k,v)};
  const sync=Sync.create({storage,key,rpc:async(op,p)=>{seen=p;if(fail)throw Error('review');return {revision:8};}});
  sync.seed({revision:100,progress:{}});assert.equal(map.get(key),raw);
  await assert.rejects(sync.flush());assert.equal(map.get(key),raw);
  assert.equal(seen.requestId,'same-id');assert.equal(seen.progress.draft,'keep');
  fail=false;await sync.flush();assert.equal(sync.snapshot().revision,8);assert.equal(sync.snapshot().archives[0].old,'retained');
 });
 await test('unpublished artifact is staging-only, bundles latest unchanged gameplay and refuses nonempty output',()=>{
  const out=path.resolve('v52-staging-test-dist');
  if(fs.existsSync(out))fs.rmSync(out,{recursive:true}); // test-only synthetic output
  build(config,out);
  const html=fs.readFileSync(path.join(out,'index.html'),'utf8'),js=fs.readFileSync(path.join(out,'staging-app.js'),'utf8');
  assert.ok(html.includes(`connect-src 'self' ${config.url}`));assert.ok(html.includes('V5.2 STAGING'));
  assert.ok(!html.includes('src="v3/app.js"'));assert.ok(!js.includes('mbdelspbjusarbwlltol'));
  assert.ok(!fs.existsSync(path.join(out,'v3/production-cloud.js')));assert.ok(!fs.existsSync(path.join(out,'v3/backend-config.js')));
  assert.ok(js.includes('stagingUpgradeVersion'));new vm.Script(js);
  for(const f of ['app.js','engine.js','adventure.js','hands-on.js','journey.js','style.css'])
   assert.deepEqual(fs.readFileSync(path.join(out,'v3',f)),fs.readFileSync(path.join('v3',f)));
  assert.equal(require('../v3/engine.js').V3Engine.worlds.length,9);
  assert.throws(()=>build(config,out),/empty/);
  assert.throws(()=>build({...config,projectRef:'mbdelspbjusarbwlltol',authorizedRef:'mbdelspbjusarbwlltol',url:'https://mbdelspbjusarbwlltol.supabase.co'},out+'-wrong'),/existing fictional/);
 });
 fs.mkdirSync('tests/artifacts',{recursive:true});fs.writeFileSync('tests/artifacts/v52-staging-preserve-client.json',JSON.stringify({scope:'offline contract, transformed transaction and queue tests; no hosted/browser claim',suites:results},null,2)+'\n');
 console.log('PASS',results.length,'focused staging-preservation client/build suites');
})().catch(e=>{console.error(e);process.exitCode=1;});
