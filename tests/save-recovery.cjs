const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),C=require('../v3/cloud-sync');
const store=()=>{const m=new Map();return {getItem:k=>m.get(k)||null,setItem:(k,v)=>m.set(k,v),removeItem:k=>m.delete(k)}};
let passed=0;const test=async(n,f)=>{await f();console.log('PASS',n);passed++};
(async()=>{
await test('lost purchase response, confirmed receipt/read loss, legacy intent, different item and reopen',async()=>{
 for(const failure of ['buy','read']){const storage=store();let lose=true,deductions=0;const ledger=new Map(),ids=[];const rpc=async(op,a)=>{if(op==='read'){if(failure==='read'&&lose){lose=false;throw Error('read lost')}return {wallet:{coins:200-deductions*45,owned:[]}};}ids.push(a.requestId);if(!ledger.has(a.requestId)){deductions++;ledger.set(a.requestId,{wallet:{coins:200-deductions*45,owned:[a.item]}});}if(failure==='buy'&&lose){lose=false;throw Error('buy response lost')}return ledger.get(a.requestId);};
 let intent=C.createIntents({storage,key:'x',rpc});await assert.rejects(intent.run('buy',{item:'cap'}));const original=intent.pending();assert(original);intent=C.createIntents({storage,key:'x',rpc});await intent.recover();assert.equal(intent.pending(),null);assert.equal(deductions,1);assert(ids.every(x=>x===original.payload.requestId));await intent.run('buy',{item:'helmet'});assert.equal(deductions,2);}
});
await test('parallel identical purchase retries, corrupt intent, role and auth failures preserve safety',async()=>{
 const storage=store();let resolveBuy,n=0;const rpc=async(op)=>{if(op==='read')return {wallet:{owned:['cap']}};n++;await new Promise(r=>resolveBuy=r);return {wallet:{owned:['cap']}}};const intent=C.createIntents({storage,key:'x',rpc,allowed:['buy']});const a=intent.run('buy',{item:'cap'});await new Promise(r=>setImmediate(r));const recovery=intent.recover();resolveBuy();await Promise.all([a,recovery]);assert.equal(n,1);await assert.rejects(intent.run('award',{amount:10}),/role/);
 storage.setItem('x','{corrupt');assert.throws(intent.pending,/preserved/);assert.equal(storage.getItem('x'),'{corrupt');storage.removeItem('x');
 const auth=C.createIntents({storage,key:'x',rpc:async()=>{throw {code:'P0001',message:'Unlock required'}}});await assert.rejects(auth.run('buy',{item:'cap'}));assert(auth.pending());
});
await test('unchanged revisions are deduplicated; legacy queue bytes and later edits survive',async()=>{
 const storage=store();let calls=0;const rpc=async()=>({revision:++calls});let sync=C.create({storage,key:'q',rpc});sync.seed({revision:0,progress:{revision:1,quest:{i:1}}});assert.equal(sync.enqueue({revision:2,quest:{i:1}}),false);await sync.flush();assert.equal(calls,0);sync.enqueue({revision:3,quest:{i:2}});await sync.flush();assert.equal(calls,1);assert.equal(sync.enqueue({revision:4,quest:{i:2}}),false);
 const legacy={version:1,revision:0,pending:{requestId:'old-id',revision:0,progress:{unknown:'keep',quest:{i:1}}},latest:{unknown:'keep',quest:{i:2}},conflict:null,archives:[]};storage.setItem('old',JSON.stringify(legacy));sync=C.create({storage,key:'old',rpc:async(_,a)=>({revision:a.revision+1})});assert.deepEqual(sync.snapshot(),legacy);await sync.flush();assert.equal(sync.snapshot().revision,2);
});
await test('actual adapter batches one hour of 720 local checkpoints into at most 121 uploads',async()=>{
 const storage=store();let calls=0,now=100000,offline=false;const sync=C.create({storage,key:'q',rpc:async()=>{if(offline)throw Error('offline');return {revision:++calls}}});
 const src=fs.readFileSync('v3/staging-app.js','utf8'),flush=src.slice(src.indexOf('async function flush(force=false)'),src.indexOf('async function recoverPurchase()')),method=src.slice(src.indexOf('    onSave(state) {'),src.indexOf('    onActive(ms) {'));
 const context={sync,active:()=>true,lastSaveAttempt:now,saveTimer:null,Date:{now:()=>now},setTimeout:()=>1,queueMicrotask:fn=>fn(),message:()=>{}};vm.createContext(context);vm.runInContext(flush+';globalThis.adapter={'+method+'};',context);
 for(let i=1;i<=720;i++){now+=5000;context.adapter.onSave({revision:i,view:'adventure',minutes:i/12,payload:'x'.repeat(32700)});if(i%2===0)await context.flush();}
 assert(calls<=120&&calls>=119);await context.flush(true);assert.equal(sync.snapshot().latest,null);
 offline=true;now+=30000;context.adapter.onSave({view:'adventure',quest:{i:3}});await context.flush();const pending=sync.snapshot().pending;context.adapter.onSave({view:'adventure',quest:{i:4}});assert.deepEqual(sync.snapshot().pending,pending);offline=false;await context.flush(true);assert.equal(sync.snapshot().pending,null);assert.equal(sync.snapshot().latest,null);
});
console.log(`${passed} save/purchase recovery groups passed; no external network.`);
})().catch(e=>{console.error(e);process.exitCode=1});
