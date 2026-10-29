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
 sql("set app.v3.staging_authorized='yes';set app.v3.staging_ref='sfogrvedypgtxfvecmbx';"+fs.readFileSync('supabase/v3-staging/001_secure_core.sql','utf8'));
 sql(`insert into auth.users(id,email_confirmed_at,is_anonymous) values ${Object.entries(ids).map(([k,id])=>`('${id}',${k==='unverified'?'null':'now()'},${k==='anonymous'})`).join(',')};
 insert into public.maths_families values('${ids.legacyC}','${ids.legacyP}');
 insert into public.v3_progress(child_user_id,revision,progress) values('${ids.legacyC}',7,'{"coins":45,"startingProfile":{"version":1},"draft":"saved"}');`);
 sql(fs.readFileSync('supabase/v3-staging/004_compact_save_receipts.sql','utf8'));
 sql(`insert into public.v3_wallet(child_user_id,coins,bonus,owned) values('${ids.legacyC}',33,17,'[\"cap\"]');`);
 const before=sql('select jsonb_agg(to_jsonb(p)) from public.v3_progress p;select jsonb_agg(to_jsonb(f)) from public.maths_families f;select count(*) from auth.users;');

 sql('alter table auth.users add column banned_until timestamptz, add column deleted_at timestamptz');
 const legacyPrefix=claims('legacyC');sql(legacyPrefix+"select public.v3_set_pin('1234')");const legacyUnlock=JSON.parse(sql(legacyPrefix+"select public.v3_unlock('1234')")).token;const pinBefore=sql('select jsonb_agg(to_jsonb(p)) from public.v3_pins p;select jsonb_agg(to_jsonb(u)) from public.v3_unlocks u;');
 const foundation=fs.readFileSync('supabase/single-child-draft/001_pairing_foundation.sql','utf8');
 sql("set app.v12.foundation_reviewed='yes';set app.v12.target_ref='sfogrvedypgtxfvecmbx';"+foundation);
 const migration=fs.readFileSync('supabase/single-child-draft/002_identity_bridge.sql','utf8');
 const reviewed="set app.v13.bridge_reviewed='yes';set app.v12.target_ref='sfogrvedypgtxfvecmbx';";
 await test('bridge refuses missing review, production target, changed core and late migration failure atomically',()=>{
  fail(()=>sql(migration));fail(()=>sql("set app.v13.bridge_reviewed='yes';set app.v12.target_ref='mbdelspbjusarbwlltol';"+migration));
  sql('alter function public.v3_request(text,text,jsonb) rename to v3_request_original;create function public.v3_request(text,text,jsonb) returns jsonb language sql as $$select null::jsonb$$;');fail(()=>sql(reviewed+migration));sql('drop function public.v3_request(text,text,jsonb);alter function public.v3_request_original(text,text,jsonb) rename to v3_request;');
  fail(()=>sql(reviewed+migration.replace(/commit;\s*$/, "do $$begin raise exception 'late failure';end$$;commit;")));
  assert.equal(sql("select to_regclass('v12_private.children') is null"),'t');
 });
 sql(reviewed+migration);
 await test('migration preserves exact legacy IDs, progress, wallets, grants and Auth rows',()=>{
  assert.equal(sql('select jsonb_agg(to_jsonb(p)) from public.v3_progress p;select jsonb_agg(to_jsonb(f)) from public.maths_families f;select count(*) from auth.users;'),before);
  assert.equal(sql(`select coins||':'||bonus||':'||owned::text from public.v3_wallet where child_user_id='${ids.legacyC}'`),'33:17:["cap"]');
  assert.equal(sql('select jsonb_agg(to_jsonb(p)) from public.v3_pins p;select jsonb_agg(to_jsonb(u)) from public.v3_unlocks u;'),pinBefore);assert.equal(JSON.parse(sql(legacyPrefix+`select public.v3_request('${legacyUnlock}','read','{}')`)).revision,7);
  assert.equal(sql(`select legacy_auth_user=child_id from v12_private.children where child_id='${ids.legacyC}'`),'t');
 });
 await test('existing family adopts its original child without adding an Auth identity or overwriting saved evidence',()=>{
  assert.equal(parent('legacyP','create',{nickname:'Existing explorer'}).gameReady,true);parent('legacyP','pin',{pin:'4321'});
  const c=parent('legacyP','issue').code,d=service('v12_pair',[c,bucket()]);const g=service('v12_device_unlock',[d.deviceToken,'4321',bucket()]);
  const r=service('v13_device_request',[g.grantToken,'read','{}']);assert.equal(r.progress.draft,'saved');assert.equal(r.revision,7);assert.equal(r.wallet.coins,33);assert.equal(r.wallet.bonus,17);
  const scope=service('v12_device_scope',[g.grantToken]);assert.equal(scope.child,ids.legacyC);assert.equal(scope.gameReady,true);assert.equal(sql('select count(*) from auth.users'),'6');
  assert.ok(parent('legacyP','create',{nickname:'Second'}).error);
 });
 await test('legacy Auth learner still uses its original role/PIN/game path after FK migration',()=>{
  const pre=claims('legacyC');sql(pre+"select public.v3_set_pin('1234')");const t=JSON.parse(sql(pre+"select public.v3_unlock('1234')")).token;
  const r=JSON.parse(sql(pre+`select public.v3_request('${t}','read','{}')`));assert.equal(r.progress.draft,'saved');assert.equal(r.revision,7);
  parent('legacyP','pin',{pin:'5678'});fail(()=>sql(pre+`select public.v3_request('${t}','read','{}')`));
 });
 await test('canonical core is private and every new/retargeted table denies direct client grants',()=>{
  for(const role of ['anon','authenticated','service_role'])fail(()=>sql(`set role ${role};select * from v12_private.children`));
  for(const role of ['anon','authenticated','service_role'])fail(()=>sql(`set role ${role};select v12_private.request_core('{"role":"parent","child":"${ids.legacyC}"}','read','{}')`));
  assert.equal(sql("select count(*) from pg_constraint where conname like '%_canonical_child'"),'4');
 });
 console.log(`${count} identity-bridge preservation/rollback groups passed; network-disabled PostgreSQL, fictional legacy records.`);
}finally{try{docker(['rm','-f',name]);}catch{}}})().catch(e=>{console.error(String(e.stderr||e.message));process.exitCode=1});
