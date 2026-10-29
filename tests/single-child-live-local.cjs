// REAL LOCAL Supabase Auth + PostgREST + PostgreSQL. No hosted endpoints or claim stubs.
const H=require('./helpers/local-supabase.cjs'),assert=require('node:assert/strict'),crypto=require('node:crypto'),{execFileSync}=require('node:child_process');
const env={...process.env};for(const k of ['DOCKER_HOST','DOCKER_CONTEXT','DOCKER_TLS','DOCKER_TLS_VERIFY','DOCKER_CERT_PATH'])delete env[k];
const sql=s=>execFileSync('docker',['--host=unix:///var/run/docker.sock','exec','-i','jaxon-local-db','psql','-U','postgres','-XqAt','-v','ON_ERROR_STOP=1'],{env,input:s,encoding:'utf8',stdio:['pipe','pipe','pipe']}).trim();
const parent=(a,action,args={})=>H.rpc(a.token,'v12_parent',{p_action:action,p_args:args});
const service=(fn,args)=>H.rpc(H.cfg.serviceKey,fn,args),bucket=()=>crypto.randomBytes(32).toString('hex');let count=0;
const test=async(label,f)=>{await f();count++;console.log('PASS',label)};
(async()=>{
 const a=await H.account('api-a'),b=await H.account('api-b');let childA,childB,device,grant,code;
 await test('real email confirmation required and actual password JWT permits one nickname profile',async()=>{
  for(const who of [a,b]){const r=await parent(who,'create',{nickname:'Fictional Explorer'});assert.equal(r.status,200);assert.equal(r.data.gameReady,true);assert.equal((await parent(who,'create',{nickname:'Second child'})).data.error,'One child profile already exists');assert.equal((await parent(who,'pin',{pin:'1234'})).status,200);}
  childA=sql(`select child_id from v12_private.profiles where parent_id='${a.user}'`);childB=sql(`select child_id from v12_private.profiles where parent_id='${b.user}'`);
  assert.notEqual(childA,childB);assert.equal(sql(`select count(*) from auth.users where id in ('${childA}','${childB}')`),'0');
 });
 await test('all new private tables and service-only RPCs deny public/authenticated direct access',async()=>{
  for(const token of [H.cfg.anonKey,a.token,b.token]){
   assert.ok((await H.rpc(token,'v12_pair',{p_code:'0'.repeat(32),p_bucket:bucket()})).status>=400);
   assert.ok((await H.rpc(token,'v13_device_request',{p_grant:'0'.repeat(64),p_operation:'read',p_args:{}})).status>=400);
   const r=await fetch(H.cfg.restUrl+'/v3_progress?select=*',{headers:{authorization:'Bearer '+token}});assert.ok(r.status>=400);
  }
 });
 await test('expiry, replacement, parent binding and concurrent single-use pairing execute in database',async()=>{
  const old=(await parent(a,'issue')).data.code;code=(await parent(a,'issue')).data.code;
  assert.ok((await service('v12_pair',{p_code:old,p_bucket:bucket()})).data.error);
  const r=await parent(b,'issue',{child:childA});assert.ok(r.status>=400);
  const results=await Promise.all([1,2].map(()=>service('v12_pair',{p_code:code,p_bucket:bucket()})));
  assert.equal(results.filter(r=>r.data.deviceToken).length,1);device=results.find(r=>r.data.deviceToken).data;
  assert.ok((await service('v12_pair',{p_code:code,p_bucket:bucket()})).data.error);
  const q=(await parent(b,'issue')).data.code;sql(`update v12_private.codes set expires_at=now()-interval '1 second' where code_hash=extensions.digest('${q}','sha256')`);
  assert.ok((await service('v12_pair',{p_code:q,p_bucket:bucket()})).data.error);
 });
 await test('persistent guessing and generation limits reject retries without using an expired credential',async()=>{
  const k=bucket(),fresh=(await parent(b,'issue')).data.code;
  for(let i=0;i<10;i++)assert.ok((await service('v12_pair',{p_code:'0'.repeat(32),p_bucket:k})).data.error);
  assert.ok((await service('v12_pair',{p_code:fresh,p_bucket:k})).data.error);
  let r;for(let i=0;i<6;i++)r=await parent(b,'issue');assert.ok(r.data.error);
 });
 await test('PIN cooldown persists across address changes; server resolves learner family and refuses parent actions',async()=>{
  for(let i=0;i<5;i++)assert.ok((await service('v12_device_unlock',{p_device:device.deviceToken,p_pin:'0000',p_bucket:bucket()})).data.error);
  assert.ok((await service('v12_device_unlock',{p_device:device.deviceToken,p_pin:'1234',p_bucket:bucket()})).data.error);
  sql(`update v12_private.profiles set blocked_until=now()-interval '1 second' where child_id='${childA}'`);
  grant=(await service('v12_device_unlock',{p_device:device.deviceToken,p_pin:'1234',p_bucket:bucket()})).data.grantToken;assert.equal(typeof grant,'string');
  const read=await service('v13_device_request',{p_grant:grant,p_operation:'read',p_args:{}});assert.equal(read.status,200);assert.equal(read.data.role,'learner');
  assert.ok((await service('v13_device_request',{p_grant:grant,p_operation:'award',p_args:{requestId:crypto.randomUUID(),amount:10}})).status>=400);
  assert.ok((await service('v13_device_request',{p_grant:grant,p_operation:'save',p_args:{child:childB,requestId:crypto.randomUUID(),revision:0,progress:{}}})).status>=400);
 });
 const draft={startingProfile:{version:1},savedDraft:'3.75',coins:99999,unknown:{kept:true}};
 await test('paired learner uses same CAS/compact-receipt game core; no fabricated wallet or cross-family data',async()=>{
  const args={requestId:crypto.randomUUID(),revision:0,progress:draft},call=()=>service('v13_device_request',{p_grant:grant,p_operation:'save',p_args:args});
  const first=await call();assert.equal(first.status,200);assert.equal(first.data.revision,1);assert.deepEqual((await call()).data,first.data);
  const read=(await service('v13_device_request',{p_grant:grant,p_operation:'read',p_args:{}})).data;assert.deepEqual(read.progress,draft);assert.equal(read.wallet.coins,0);
  assert.equal(sql(`select progress from public.v3_progress where child_user_id='${childB}'`),'{}');
  assert.equal(sql(`select count(*) from public.v3_transactions where child_user_id='${childA}' and payload ? 'progress'`),'0');
  assert.ok((await parent(b,'revoke',{device:device.device})).status>=400);
 });
 await test('verified parent can use existing parent PIN/progress API while learner cannot act as parent',async()=>{
  assert.equal((await H.rpc(a.token,'v3_set_pin',{p_pin:'654321'})).status,200);
  const u=await H.rpc(a.token,'v3_unlock',{p_pin:'654321'});assert.equal(u.status,200);assert.equal(u.data.role,'parent');assert.equal(u.data.child,childA);
  const r=await H.rpc(a.token,'v3_request',{p_token:u.data.token,p_operation:'read',p_args:{}});assert.deepEqual(r.data.progress,draft);
  assert.ok((await H.rpc(b.token,'v3_request',{p_token:u.data.token,p_operation:'read',p_args:{}})).status>=400);
 });
 await test('parent PIN reset invalidates grants; lost-device revoke and replacement preserve exact same child progress',async()=>{
  assert.equal((await parent(a,'pin',{pin:'4321'})).status,200);
  assert.ok((await service('v13_device_request',{p_grant:grant,p_operation:'read',p_args:{}})).status>=400);
  const g=(await service('v12_device_unlock',{p_device:device.deviceToken,p_pin:'4321',p_bucket:bucket()})).data.grantToken;
  assert.equal((await parent(a,'revoke',{device:device.device})).status,200);
  assert.ok((await service('v13_device_request',{p_grant:g,p_operation:'read',p_args:{}})).status>=400);
  assert.ok((await service('v12_device_unlock',{p_device:device.deviceToken,p_pin:'4321',p_bucket:bucket()})).data.error);
  const replacement=(await parent(a,'issue')).data.code,d=(await service('v12_pair',{p_code:replacement,p_bucket:bucket()})).data;
  const next=(await service('v12_device_unlock',{p_device:d.deviceToken,p_pin:'4321',p_bucket:bucket()})).data.grantToken;
  const r=await service('v13_device_request',{p_grant:next,p_operation:'read',p_args:{}});assert.deepEqual(r.data.progress,draft);assert.equal(r.data.revision,1);
  const status=(await service('v13_device_status',{p_device:d.deviceToken,p_grant:next})).data;assert.equal(status.child,childA);assert.equal(status.gameReady,true);
 });

 await test('disabled parent is denied even with a still-signed JWT; paired game scope is blocked too',async()=>{
  const c=(await parent(a,'issue')).data.code,d=(await service('v12_pair',{p_code:c,p_bucket:bucket()})).data;
  const g=(await service('v12_device_unlock',{p_device:d.deviceToken,p_pin:'4321',p_bucket:bucket()})).data.grantToken;
  assert.equal((await service('v13_device_request',{p_grant:g,p_operation:'read',p_args:{}})).status,200);
  const parentUnlock=await H.rpc(a.token,'v3_unlock',{p_pin:'654321'});assert.equal(parentUnlock.status,200);
  sql(`update auth.users set banned_until=now()+interval '1 hour' where id='${a.user}'`);
  try{assert.ok((await H.rpc(a.token,'v3_request',{p_token:parentUnlock.data.token,p_operation:'read',p_args:{}})).status>=400);assert.ok((await parent(a,'read')).status>=400);assert.ok((await service('v13_device_request',{p_grant:g,p_operation:'read',p_args:{}})).status>=400);}finally{sql(`update auth.users set banned_until=null where id='${a.user}'`);}
  assert.equal((await service('v13_device_request',{p_grant:g,p_operation:'read',p_args:{}})).status,200);
  sql(`update v12_private.grants set expires_at=now()-interval '1 second' where token_hash=extensions.digest('${g}','sha256')`);
  assert.ok((await service('v13_device_request',{p_grant:g,p_operation:'read',p_args:{}})).status>=400);
 });
 await test('in-flight save and revocation serialize on the same profile without losing the committed save',async()=>{
  const c=(await parent(a,'issue')).data.code,d=(await service('v12_pair',{p_code:c,p_bucket:bucket()})).data;
  const g=(await service('v12_device_unlock',{p_device:d.deviceToken,p_pin:'4321',p_bucket:bucket()})).data.grantToken;
  sql(`create function v12_private.test_delay() returns trigger language plpgsql as $$begin if new.child_user_id='${childA}' then perform pg_sleep(0.5);end if;return new;end$$;create trigger local_test_delay before update on public.v3_progress for each row execute function v12_private.test_delay();`);
  try{
   const save=service('v13_device_request',{p_grant:g,p_operation:'save',p_args:{requestId:crypto.randomUUID(),revision:1,progress:{...draft,race:'committedBeforeRevoke'}}});
   let sleeping=false;for(let i=0;i<30;i++){if(sql("select exists(select 1 from pg_stat_activity where wait_event='PgSleep')")==='t'){sleeping=true;break;}await new Promise(r=>setTimeout(r,25));}assert.equal(sleeping,true);
   const revoke=parent(a,'revoke',{device:d.device});const [saved,revoked]=await Promise.all([save,revoke]);assert.equal(saved.status,200);assert.equal(revoked.status,200);assert.ok((await service('v13_device_request',{p_grant:g,p_operation:'read',p_args:{}})).status>=400);
   assert.equal(sql(`select progress->>'race' from public.v3_progress where child_user_id='${childA}'`),'committedBeforeRevoke');
  }finally{sql('drop trigger local_test_delay on public.v3_progress;drop function v12_private.test_delay();');}
 });
 console.log(`${count} real LOCAL Supabase account/device/game groups passed. No hosted verification claimed.`);
})().catch(e=>{console.error('Local integration failed:',e.constructor.name,e.message.slice(0,200));process.exitCode=1});
