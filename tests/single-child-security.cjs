// Fictional claims + real PostgreSQL/pgcrypto, network disabled. NOT hosted Auth acceptance.
const {execFileSync,execFile}=require('node:child_process'),fs=require('node:fs'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const env={...process.env};for(const k of ['DOCKER_HOST','DOCKER_CONTEXT','DOCKER_TLS','DOCKER_TLS_VERIFY','DOCKER_CERT_PATH'])delete env[k];
const name='jaxon-one-child-'+process.pid,d=['--host=unix:///var/run/docker.sock'];
const docker=(args,input)=>execFileSync('docker',[...d,...args],{env,input,encoding:'utf8',stdio:['pipe','pipe','pipe']}).trim();
const args=['exec','-i',name,'psql','-h','127.0.0.1','-X','-qAt','-v','ON_ERROR_STOP=1','-U','postgres'];
const sql=s=>docker(args,s),lit=x=>"'"+String(x).replaceAll("'","''")+"'",json=x=>lit(JSON.stringify(x))+'::jsonb';
const asyncSQL=s=>new Promise((resolve,reject)=>{const p=execFile('docker',[...d,...args],{env,encoding:'utf8'},(e,o)=>e?reject(e):resolve(o.trim()));p.stdin.end(s);});
const ids={p:'11111111-1111-4111-8111-111111111111',q:'22222222-2222-4222-8222-222222222222',legacyP:'33333333-3333-4333-8333-333333333333',legacyC:'44444444-4444-4444-8444-444444444444',unverified:'55555555-5555-4555-8555-555555555555',anonymous:'66666666-6666-4666-8666-666666666666'};
const claims=(who,age=0)=>`set role authenticated;set request.jwt.claims=${lit(JSON.stringify({sub:ids[who],amr:age===null?[]:[{method:'password',timestamp:Math.floor(Date.now()/1000)-age}]}))};`;
const parent=(who,op,a={},age=0)=>JSON.parse(sql(claims(who,age)+`select public.v12_parent(${lit(op)},${json(a)});`));
const service=(fn,a)=>JSON.parse(sql(`set role service_role;select public.${fn}(${a.map(lit).join(',')});`));
const bucket=()=>crypto.randomBytes(32).toString('hex');const fail=f=>assert.throws(f);let count=0;
const test=async(label,f)=>{await f();console.log('PASS',label);count++;};
(async()=>{try{
 docker(['run','--pull=never','--rm','-d','--name',name,'--network','none','-e','POSTGRES_HOST_AUTH_METHOD=trust','postgres:17-alpine']);
 for(let i=0;i<100;i++){try{sql('select 1');break;}catch{await new Promise(r=>setTimeout(r,100));}}
 sql(`create role anon;create role authenticated;create role service_role bypassrls;create schema auth;
 create table auth.users(id uuid primary key,email_confirmed_at timestamptz,is_anonymous boolean default false);
 create function auth.jwt() returns jsonb language sql stable as $$select coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb$$;
 create function auth.uid() returns uuid language sql stable as $$select (auth.jwt()->>'sub')::uuid$$;
 grant usage on schema auth to authenticated;grant execute on function auth.jwt(),auth.uid() to authenticated;`);
 sql("set app.v3.staging_authorized='yes';set app.v3.staging_ref='abcdefghijklmnopqrst';"+fs.readFileSync('supabase/v3-staging/001_secure_core.sql','utf8'));
 sql(`insert into auth.users(id,email_confirmed_at,is_anonymous) values ${Object.entries(ids).map(([k,id])=>`('${id}',${k==='unverified'?'null':'now()'},${k==='anonymous'})`).join(',')};
 insert into public.maths_families values('${ids.legacyC}','${ids.legacyP}');
 insert into public.v3_progress(child_user_id,revision,progress) values('${ids.legacyC}',7,'{"coins":45,"startingProfile":{"version":1},"draft":"saved"}');`);
 const before=sql('select jsonb_agg(to_jsonb(p)) from public.v3_progress p;select jsonb_agg(to_jsonb(f)) from public.maths_families f;select count(*) from auth.users;');
 const migration=fs.readFileSync('supabase/single-child-draft/001_pairing_foundation.sql','utf8');fail(()=>sql(migration));sql("set app.v12.foundation_reviewed='yes';set app.v12.target_ref='abcdefghijklmnopqrst';"+migration);
 await test('email verification, non-anonymous identity, recent password and parent role are enforced in SQL',()=>{
  for(const who of ['unverified','anonymous','legacyC'])fail(()=>parent(who,'create',{nickname:'Explorer'}));
  for(const age of [null,600,-600])fail(()=>parent('p','create',{nickname:'Explorer'},age));
  fail(()=>parent('legacyP','create',{nickname:'Duplicate'}));
  fail(()=>parent('p','create',{nickname:'Explorer',child:ids.legacyC}));
  assert.equal(parent('p','create',{nickname:'Explorer'}).nickname,'Explorer');
  assert.equal(parent('q','create',{nickname:'Other explorer'}).gameReady,false);
  assert.ok(parent('p','create',{nickname:'Second'}).error);
 });
 await test('all new tables have RLS, deny clients and service direct access; functions have narrow grants',()=>{
  for(const t of ['profiles','codes','devices','grants','limits']){
   assert.equal(sql(`select relrowsecurity from pg_class where oid='v12_private.${t}'::regclass`),'t');
   for(const role of ['anon','authenticated','service_role'])fail(()=>sql(`set role ${role};select * from v12_private.${t}`));
  }
  for(const role of ['anon','authenticated'])for(const [fn,a] of [['v12_pair',"'x','x'"],['v12_device_unlock',"'x','1234','x'"],['v12_device_scope',"'x'"],['v12_device_lock',"'x'"]])fail(()=>sql(`set role ${role};select public.${fn}(${a})`));
  fail(()=>sql("set role anon;select public.v12_parent('read','{}')"));
 });
 let code,device,grant;
 await test('code is server-random 128-bit, hashed only, short lived, child bound and replaced safely',()=>{
  fail(()=>parent('p','issue'));parent('p','pin',{pin:'1234'});parent('q','pin',{pin:'5678'});
  const old=parent('p','issue');code=parent('p','issue').code;assert.match(code,/^[a-f0-9]{32}$/);assert.notEqual(code,old.code);
  assert.ok(service('v12_pair',[old.code,bucket()]).error);
  assert.equal(sql(`select encode(code_hash,'hex') from v12_private.codes where child_id=(select child_id from v12_private.profiles where parent_id='${ids.p}')`),crypto.createHash('sha256').update(code).digest('hex'));
  assert.equal(sql("select bool_and(expires_at<=now()+interval '10 minutes') from v12_private.codes"),'t');
  fail(()=>parent('q','issue',{child:ids.p}));
 });
 await test('racing pair requests allow exactly one use; raw device tokens never persist',async()=>{
  const query=`set role service_role;select public.v12_pair('${code}','${bucket()}');`;
  const results=(await Promise.all([asyncSQL(query),asyncSQL(query)])).map(JSON.parse);
  assert.equal(results.filter(r=>r.deviceToken).length,1);device=results.find(r=>r.deviceToken);
  assert.ok(service('v12_pair',[code,bucket()]).error);
  const hash=sql(`select encode(token_hash,'hex') from v12_private.devices where device_id='${device.device}'`);
  assert.equal(hash,crypto.createHash('sha256').update(device.deviceToken).digest('hex'));
  assert.equal(parent('q','read').devices.length,0);assert.equal(parent('p','read').devices.length,1);
 });
 await test('expired pairing, guess throttling, generation throttling and cancellation fail safely',()=>{
  const c=parent('q','issue').code;sql(`update v12_private.codes set expires_at=now()-interval '1 second' where code_hash=extensions.digest('${c}','sha256')`);assert.ok(service('v12_pair',[c,bucket()]).error);
  const fresh=parent('q','issue').code,b=bucket();for(let i=0;i<10;i++)assert.ok(service('v12_pair',['0'.repeat(32),b]).error);
  assert.ok(service('v12_pair',[fresh,b]).error);assert.ok(service('v12_pair',[fresh,bucket()]).deviceToken);
  parent('q','issue');parent('q','cancel-code');assert.ok(service('v12_pair',[fresh,bucket()]).error);
  while(Number(sql(`select count from v12_private.limits where bucket='issue:${ids.q}'`))<5)parent('q','issue');
  assert.ok(parent('q','issue').error);
 });
 await test('persistent child PIN limits cannot be avoided with a new device bucket; unlock and scope bind family',()=>{
  for(let i=0;i<5;i++)assert.ok(service('v12_device_unlock',[device.deviceToken,'0000',bucket()]).error);
  assert.ok(service('v12_device_unlock',[device.deviceToken,'1234',bucket()]).error);
  sql(`update v12_private.profiles set blocked_until=now()-interval '1 second' where parent_id='${ids.p}'`);
  grant=service('v12_device_unlock',[device.deviceToken,'1234',bucket()]);assert.match(grant.grantToken,/^[a-f0-9]{64}$/);
  const scope=service('v12_device_scope',[grant.grantToken]);assert.equal(scope.parent,ids.p);assert.equal(scope.role,'learner');assert.equal(scope.gameReady,false);
  assert.notEqual(scope.child,ids.q);fail(()=>service('v12_device_scope',['0'.repeat(64)]));
 });
 await test('wrong parent cannot revoke device; reset revokes grants/codes, preserving profile and legacy progress',()=>{
  fail(()=>parent('q','revoke',{device:device.device}));parent('p','pin',{pin:'4321'});
  fail(()=>service('v12_device_scope',[grant.grantToken]));assert.equal(parent('p','read').nickname,'Explorer');
  grant=service('v12_device_unlock',[device.deviceToken,'4321',bucket()]);assert.ok(grant.grantToken);
 });
 await test('lost device revoked by verified parent; replacement rejoins same child without child email',()=>{
  const child=service('v12_device_scope',[grant.grantToken]).child;
  parent('p','revoke',{device:device.device});fail(()=>service('v12_device_scope',[grant.grantToken]));
  assert.ok(service('v12_device_unlock',[device.deviceToken,'4321',bucket()]).error);
  const newCode=parent('p','issue').code,newDevice=service('v12_pair',[newCode,bucket()]);
  const g=service('v12_device_unlock',[newDevice.deviceToken,'4321',bucket()]);assert.equal(service('v12_device_scope',[g.grantToken]).child,child);
  service('v12_device_lock',[g.grantToken]);fail(()=>service('v12_device_scope',[g.grantToken]));
  const again=service('v12_device_unlock',[newDevice.deviceToken,'4321',bucket()]);sql("update v12_private.grants set expires_at=now()-interval '1 second'");fail(()=>service('v12_device_scope',[again.grantToken]));
  sql("update v12_private.devices set expires_at=now()-interval '1 second'");assert.ok(service('v12_device_unlock',[newDevice.deviceToken,'4321',bucket()]).error);
 });
 await test('existing Auth, family IDs and exact saved progress untouched; no new game grants or anonymous users',()=>{
  assert.equal(sql('select jsonb_agg(to_jsonb(p)) from public.v3_progress p;select jsonb_agg(to_jsonb(f)) from public.maths_families f;select count(*) from auth.users;'),before);
  assert.equal(sql("select count(*) from information_schema.columns where table_schema='v12_private' and table_name='profiles' and column_name in('email','full_name','date_of_birth','school','photo')"),'0');
 });
 console.log(`${count} foundation security groups passed. Hosted verification and game identity bridge NOT established.`);
}finally{try{docker(['rm','-f',name]);}catch{}}})().catch(e=>{console.error(String(e.stderr||e.message));process.exitCode=1});
