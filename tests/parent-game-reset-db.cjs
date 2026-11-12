// Local PostgreSQL only. Never connects to a hosted project or real identity.
const fs=require('fs'),assert=require('node:assert/strict'),crypto=require('crypto'),cp=require('child_process');
const env={...process.env};for(const k of ['DOCKER_HOST','DOCKER_CONTEXT','DOCKER_TLS','DOCKER_TLS_VERIFY','DOCKER_CERT_PATH'])delete env[k];
const staging=process.argv.includes('--staging');
const name='camp-reset-'+process.pid,lit=x=>"'"+String(x).replaceAll("'","''")+"'";
const docker=(args,input)=>cp.execFileSync('docker',['--host=unix:///var/run/docker.sock',...args],{env,input,encoding:'utf8',stdio:['pipe','pipe','pipe']}).trim();
const sql=s=>docker(['exec','-i',name,'psql','-h','127.0.0.1','-U','postgres','-XqAt','-v','ON_ERROR_STOP=1'],s);
const ids={learner:'11111111-1111-4111-8111-111111111111',parent:'22222222-2222-4222-8222-222222222222',other:'33333333-3333-4333-8333-333333333333',otherParent:'44444444-4444-4444-8444-444444444444'},tokens={};
const prefix=who=>`set role authenticated;set request.jwt.claims=${lit(JSON.stringify({sub:ids[who],amr:[{method:'password',timestamp:Math.floor(Date.now()/1000)}]}))};`;
const call=(who,fn,args)=>JSON.parse(sql(prefix(who)+`select public.${fn}(${args});`));
const req=(who,op,args={})=>call(who,'v3_request',[lit(tokens[who]),lit(op),lit(JSON.stringify(args))].join(','));
const rejects=(f,re)=>assert.throws(f,e=>(re||/required|permission denied|changed|RESET|reused/).test(String(e.stderr||e.message)));
let count=0;function test(label,f){f();count++;console.log('PASS reset DB:',label);}
(async()=>{try{
 docker(['run','--pull=never','--rm','-d','--name',name,'--network','none','-e','POSTGRES_HOST_AUTH_METHOD=trust','postgres:17-alpine']);
 let ready=false;for(let i=0;i<100;i++){try{sql('select 1');ready=true;break;}catch{await new Promise(r=>setTimeout(r,100));}}assert(ready);
 sql(`create role anon;create role authenticated;create role service_role bypassrls;create schema auth;create table auth.users(id uuid primary key);create schema extensions;create extension pgcrypto with schema extensions;
 create function auth.jwt() returns jsonb language sql stable as $$select coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb$$;
 create function auth.uid() returns uuid language sql stable as $$select (auth.jwt()->>'sub')::uuid$$;grant usage on schema auth to anon,authenticated;grant execute on function auth.jwt(),auth.uid() to anon,authenticated;`);
 sql(fs.readFileSync('tests/fixtures/v52-legacy-schema.sql','utf8'));
 sql(`insert into auth.users values ${Object.values(ids).map(x=>'('+lit(x)+')').join(',')};insert into public.maths_families(parent_user_id,child_user_id) values('${ids.parent}','${ids.learner}'),('${ids.otherParent}','${ids.other}');`);
 const guard="set app.v51.migration_authorized='yes';set app.v51.authorized_ref='mbdelspbjusarbwlltol';";
 if(staging){
  const g="set app.v3.staging_authorized='yes';set app.v3.staging_ref='sfogrvedypgtxfvecmbx';";
  sql(g+fs.readFileSync('supabase/v3-staging/001_secure_core.sql','utf8'));sql(fs.readFileSync('supabase/v3-staging/002_catalog.sql','utf8'));sql(fs.readFileSync('supabase/v3-staging/004_compact_save_receipts.sql','utf8'));
 }else{sql(guard+fs.readFileSync('supabase/v51-production/001_secure_backend.sql','utf8'));sql(guard+fs.readFileSync('supabase/v51-production/002_catalog.sql','utf8'));}
 if(!staging)sql('update public.v3_environment set ready=true,pin_transition_approved=true');
 sql(`insert into public.v3_wallet(child_user_id,coins,bonus,owned,active_seconds,redeemed${staging?'':',opening_seconds,legacy_redeemed'}) values('${ids.learner}',200,50,'["cap"]',600,2${staging?'':',120,7'}),('${ids.other}',3,4,'[]',0,0${staging?'':',0,0'});insert into public.v3_progress(child_user_id) values('${ids.learner}'),('${ids.other}');`);
 for(const who of Object.keys(ids)){call(who,'v3_set_pin',lit(who.includes('arent')?'654321':'1234'));tokens[who]=call(who,'v3_unlock',lit(who.includes('arent')?'654321':'1234')).token;}
 const s=require('./helpers/guided-progression.cjs').fresh();s.milestones=require('../v3/adventure').V3Adventure.campMilestoneIds().slice(0,85);require('../v3/adventure').V3Adventure.state(s).campProjects={greenhouse:true};s.checks={place:{stage:2}};s.resumeView='adventure';s.unknownOldGame={discard:true};
 const oldSave={requestId:crypto.randomUUID(),revision:0,progress:s};req('learner','save',oldSave);
 const before=sql("select jsonb_build_object('users',(select jsonb_agg(id order by id) from auth.users),'pins',(select jsonb_agg(to_jsonb(x) order by user_id) from public.v3_pins x),'families',(select jsonb_agg(to_jsonb(x) order by id) from public.maths_families x),'environment',(select jsonb_agg(to_jsonb(x)) from public.v3_environment x),'other',(select to_jsonb(x) from public.v3_wallet x where child_user_id='"+ids.other+"'))");
 const migration=fs.readFileSync('supabase/base-camp/001_parent_game_reset.sql','utf8');
 test('installation requires review and does not execute a reset',()=>{rejects(()=>sql(migration),/review/);sql("set app.base_camp_reset_reviewed='yes';"+migration);assert.equal(req('parent','read').gameEpoch,0);assert.deepEqual(req('parent','read').progress,s);});
 const payload={requestId:crypto.randomUUID(),gameEpoch:0,revision:1,confirmation:'RESET ALL GAME PROGRESS'};
 test('anonymous, learner, expired and cross-family unlocks cannot reset',()=>{
  rejects(()=>sql("set role anon;select public.v3_request('x','reset_game','{}')"),/permission denied/);
  rejects(()=>req('learner','reset_game',payload),/Parent/);
  rejects(()=>call('otherParent','v3_request',[lit(tokens.parent),lit('reset_game'),lit(JSON.stringify(payload))].join(',')),/Unlock/);
  sql(`update public.v3_unlocks set expires_at=now()-interval '1 second' where user_id='${ids.otherParent}'`);rejects(()=>req('otherParent','reset_game',payload),/Unlock/);
 });
 test('missing confirmation, stale revision and target injection fail without changing state',()=>{
  rejects(()=>req('parent','reset_game',{...payload,confirmation:'yes'}),/confirmation/);rejects(()=>req('parent','reset_game',{...payload,revision:0}),/changed/);rejects(()=>req('parent','reset_game',{...payload,child:ids.other}),/confirmation/);assert.equal(req('parent','read').revision,1);
 });
 test('a late database error rolls back progress, wallet, generation and unlock changes',()=>{
  sql("create function public.fictional_reset_abort() returns trigger language plpgsql as $$begin raise exception 'FICTIONAL_LATE_RESET_FAILURE';end$$;create trigger fictional_reset_abort before update on public.v3_wallet for each row execute function public.fictional_reset_abort();");
  rejects(()=>req('parent','reset_game',payload),/FICTIONAL_LATE_RESET_FAILURE/);
  sql('drop trigger fictional_reset_abort on public.v3_wallet;drop function public.fictional_reset_abort()');
  const still=req('learner','read');assert.equal(still.gameEpoch,0);assert.equal(still.revision,1);assert.deepEqual(still.progress,s);assert.equal(still.wallet.coins,200);
 });
 test('explicit reset clears every active gameplay field and wallet entitlement atomically',()=>{
  const r=req('parent','reset_game',payload);assert.equal(r.gameEpoch,1);const after=req('parent','read');assert.deepEqual(after.progress,{});assert.equal(after.revision,2);for(const k of ['coins','bonus','active_seconds','redeemed','opening_seconds','legacy_redeemed'])assert.equal(after.wallet[k]??0,0);assert.deepEqual(after.wallet.owned,[]);
  const fresh=require('../v3/engine').V3Engine.migrate(after.progress),M=require('../v3/adventure').V3Adventure;assert.equal(M.campProgress(fresh).current.id,1);assert.deepEqual(M.state(fresh).campProjects,{});assert.deepEqual(fresh.checks,{});assert.deepEqual(fresh.milestones,[]);assert.equal(fresh.learning,null);assert.deepEqual(fresh.bought,[]);
 });
 test('accounts, complete PIN records, family links, environment and other family wallet remain exact',()=>{
  assert.equal(sql("select jsonb_build_object('users',(select jsonb_agg(id order by id) from auth.users),'pins',(select jsonb_agg(to_jsonb(x) order by user_id) from public.v3_pins x),'families',(select jsonb_agg(to_jsonb(x) order by id) from public.maths_families x),'environment',(select jsonb_agg(to_jsonb(x)) from public.v3_environment x),'other',(select to_jsonb(x) from public.v3_wallet x where child_user_id='"+ids.other+"'))"),before);
 });
 test('revoked unlock and old offline requests cannot restore progress even after a fresh unlock',()=>{
  rejects(()=>req('learner','save',oldSave),/Unlock/);tokens.learner=call('learner','v3_unlock',"'1234'").token;
  rejects(()=>req('learner','save',oldSave),/GAME_RESET_REQUIRED/);
  rejects(()=>req('learner','save',{...oldSave,requestId:crypto.randomUUID(),revision:2}),/GAME_RESET_REQUIRED/);
  rejects(()=>req('learner','save',{...oldSave,gameEpoch:1}),/GAME_RESET_REQUIRED/);
  for(const op of ['active','buy'])rejects(()=>req('learner',op,{requestId:crypto.randomUUID(),seconds:10,item:'cap'}),/GAME_RESET_REQUIRED/);
  rejects(()=>req('parent','award',{requestId:crypto.randomUUID(),amount:20,gameEpoch:0}),/GAME_RESET_REQUIRED/);
 });
 test('new epoch saves work; retrying lost reset acknowledgement never clears newer play',()=>{
  req('learner','save',{requestId:crypto.randomUUID(),gameEpoch:1,revision:2,progress:{newGame:true}});assert.equal(req('parent','reset_game',payload).revision,2);assert.deepEqual(req('parent','read').progress,{newGame:true});
  rejects(()=>req('parent','reset_game',{...payload,revision:3}),/reused/);
 });
 test('internal delegate, direct table access and unguarded legacy writes are denied',()=>{
  rejects(()=>call('parent','v3_request_before_game_reset',[lit(tokens.parent),lit('read'),"'{}'"].join(',')),/permission denied/);
  rejects(()=>sql("set role authenticated;update public.v3_progress set progress='{}'"),/permission denied/);
  rejects(()=>sql(`update public.v3_wallet set coins=999 where child_user_id='${ids.learner}'`),/GAME_RESET_REQUIRED/);
  // Models a legacy function invocation whose execute permission was checked
  // before the wrapper installation. Its wallet/progress writes are still fenced.
  const oldArgs={requestId:crypto.randomUUID(),revision:3,progress:{legacyWriter:true}};
  rejects(()=>sql(`set request.jwt.claims=${lit(JSON.stringify({sub:ids.learner}))};select public.v3_request_before_game_reset(${lit(tokens.learner)},'save',${lit(JSON.stringify(oldArgs))});`),/GAME_RESET_REQUIRED/);
  assert.deepEqual(req('parent','read').progress,{newGame:true});
 });
 if(staging)test('brand-new staging family still initializes on its first read',()=>{
  ids.newLearner='55555555-5555-4555-8555-555555555555';ids.newParent='66666666-6666-4666-8666-666666666666';
  sql(`insert into auth.users values('${ids.newLearner}'),('${ids.newParent}');insert into public.maths_families(parent_user_id,child_user_id) values('${ids.newParent}','${ids.newLearner}');`);
  call('newLearner','v3_set_pin',"'1234'");tokens.newLearner=call('newLearner','v3_unlock',"'1234'").token;
  const fresh=req('newLearner','read');assert.equal(fresh.gameEpoch,0);assert.deepEqual(fresh.progress,{});assert.equal(fresh.wallet.coins,0);
 });
 fs.mkdirSync('work/base-camp',{recursive:true});fs.writeFileSync('work/base-camp/reset-db'+(staging?'-staging':'')+'-results.json',JSON.stringify({passed:count,remoteConnections:0,network:'none'})+'\n');console.log(count+' reset authorization/recovery groups passed.');
 }finally{try{docker(['rm','-f',name]);}catch{}}})().catch(e=>{console.error(e.stderr||e);process.exit(1)});
