// Production migration rehearsal ONLY in disposable, network-disabled PostgreSQL.
// Signed-claim context is fictional; this does not run a hosted Supabase Auth service.
const fs=require('node:fs'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const {execFileSync,execFile}=require('node:child_process');
const env={...process.env};
for(const k of ['DOCKER_HOST','DOCKER_CONTEXT','DOCKER_TLS','DOCKER_TLS_VERIFY','DOCKER_CERT_PATH'])delete env[k];
const name='jaxon-v52-production-'+process.pid, d=['--host=unix:///var/run/docker.sock'];
const lit=x=>"'"+String(x).replaceAll("'","''")+"'";
function docker(args,input){return execFileSync('docker',[...d,...args],{env,input,encoding:'utf8',stdio:['pipe','pipe','pipe']}).trim();}
const sqlArgs=['exec','-i',name,'psql','-h','127.0.0.1','-X','-qAt','-v','ON_ERROR_STOP=1','-U','postgres'];
const sql=s=>docker(sqlArgs,s);
const asyncSQL=s=>new Promise((resolve,reject)=>{const c=execFile('docker',[...d,...sqlArgs],{env,encoding:'utf8'},(e,o)=>e?reject(e):resolve(o.trim()));c.stdin.end(s);});
const ids={learner:'11111111-1111-4111-8111-111111111111',parent:'22222222-2222-4222-8222-222222222222',
 other:'33333333-3333-4333-8333-333333333333',otherParent:'44444444-4444-4444-8444-444444444444'};
const prefix=(who,age=0)=>`set role authenticated;set request.jwt.claims=${lit(JSON.stringify({sub:ids[who],amr:age===null?[]:[{method:'password',timestamp:Math.floor(Date.now()/1000)-age}]}))};`;
const call=(who,fn,args='',age=0)=>sql(prefix(who,age)+`select public.${fn}(${args});`);
const reject=(f,re=/permission denied|not permitted|required|Invalid|review|Parent|Learner|Unknown|Unexpected|pending|Not enough|Already|generation/i)=>assert.throws(f,e=>re.test(String(e.stderr||e.message)));
let suites=0;async function test(label,f){await f();console.log('PASS',label);suites++;}
const guarded="set app.v51.migration_authorized='yes';set app.v51.authorized_ref='mbdelspbjusarbwlltol';\n";
const cutover="set app.v51.cutover_authorized='yes';\n";
const review={migrationId:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',pinTransitionApproved:true,families:[
 {child:ids.learner,bonus:80,remaining_minutes:2,legacy_redeemed:7,owned:['cap']},
 {child:ids.other,bonus:20,remaining_minutes:0,legacy_redeemed:3,owned:[]}]};
const activate=r=>sql(cutover+`select public.v3_admin_activate(${lit(JSON.stringify(r))});`);
const tokens={};
const request=(who,token,op,args={})=>JSON.parse(call(who,'v3_request',[lit(token),op===null?'null':lit(op),lit(JSON.stringify(args))].join(',')));
const req=(who,op,args={})=>request(who,tokens[who],op,args);
(async()=>{
 try{
 docker(['run','--pull=never','--rm','-d','--name',name,'--network','none','-e','POSTGRES_HOST_AUTH_METHOD=trust','postgres:17-alpine']);
 let ready=false;for(let i=0;i<100;i++){try{sql('select 1');ready=true;break;}catch{await new Promise(r=>setTimeout(r,100));}}assert.ok(ready);
 sql(`create role anon;create role authenticated;create role service_role bypassrls;create schema auth;
 create table auth.users(id uuid primary key);create schema extensions;create extension pgcrypto with schema extensions;
 create function auth.jwt() returns jsonb language sql stable as $$select coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb$$;
 create function auth.uid() returns uuid language sql stable as $$select (auth.jwt()->>'sub')::uuid$$;
 grant usage on schema auth to anon,authenticated;grant execute on function auth.jwt(),auth.uid() to anon,authenticated;`);
 sql(fs.readFileSync('tests/fixtures/v52-legacy-schema.sql','utf8'));
 sql(`insert into auth.users values ${Object.values(ids).map(x=>'('+lit(x)+')').join(',')};
 insert into public.maths_families(parent_user_id,child_user_id) values('${ids.parent}','${ids.learner}'),('${ids.otherParent}','${ids.other}');
 insert into public.maths_rewards(child_user_id,bonus_coins,redeemed_minutes) values('${ids.learner}',80,7),('${ids.other}',20,3);
 insert into public.maths_learning(child_user_id,progress) values('${ids.learner}','{"coins":999999,"minutes":999,"bought":["dragon"]}');`);
 const familyBefore=sql('select jsonb_agg(to_jsonb(f) order by child_user_id) from public.maths_families f;');
 const indexBefore=sql("select pg_get_indexdef(indexrelid) from pg_index where indrelid='public.maths_reward_events'::regclass order by indexrelid;");
 const privateFictionalBackup=docker(['exec',name,'pg_dump','-h','127.0.0.1','-U','postgres','--clean','--if-exists','--no-owner','postgres']);
 const install=fs.readFileSync('supabase/v51-production/001_secure_backend.sql','utf8');
 await test('targeted release preflight executes as a read-only catalog query',()=>{
 const result=sql('begin read only;'+fs.readFileSync('docs/V52-PRODUCTION-PREFLIGHT.sql','utf8')+'rollback;');
 assert.ok(result.includes('migration_owner_capabilities'));assert.ok(result.includes('auth_user_reference'));
 });
 await test('installation refuses missing review; production baseline grants and identity generation reconstructed',()=>{
 reject(()=>sql(install),/review/i);
 assert.equal(sql("select has_table_privilege('authenticated','public.learning_progress','TRUNCATE')"),'t');
 assert.equal(sql("select has_function_privilege('authenticated','public.parent_award_maths(uuid,text,integer)','EXECUTE')"),'f');
 assert.equal(sql("select has_function_privilege('authenticated','public.parent_award_maths_once(uuid,text,integer,uuid)','EXECUTE')"),'t');
 });
 sql(guarded+install);sql(guarded+fs.readFileSync('supabase/v51-production/002_catalog.sql','utf8'));
 sql(guarded+fs.readFileSync('supabase/v51-production/003_activation.sql','utf8'));
 await test('inactive additive backend preserves legacy/family records and exposes no protected operations',()=>{
 assert.equal(JSON.parse(sql('set role anon;select public.v3_identity();')).ready,false);
 reject(()=>call('learner','v3_role'));
 assert.equal(sql('select jsonb_agg(to_jsonb(f) order by child_user_id) from public.maths_families f'),familyBefore);
 assert.equal(sql('select count(*) from auth.users'),'4');
 assert.equal(sql("select has_table_privilege('authenticated','public.learning_progress','SELECT')"),'t');
 });
 await test('bad review rolls back opening writes atomically; admin functions unavailable to clients',()=>{
 const bad=structuredClone(review);bad.families[1].bonus=99;reject(()=>activate(bad),/mismatch/i);
 assert.equal(sql('select count(*) from public.v3_wallet'),'0');
 const noPin={...review,pinTransitionApproved:false};reject(()=>activate(noPin));
 for(const role of ['anon','authenticated','service_role'])
 reject(()=>sql(`set role ${role};select public.v3_admin_activate('{}');`),/permission denied/);
 });
 await test('activation copies reviewed rewards once, preserves history and does not mint JSON learning credit',()=>{
 assert.equal(JSON.parse(activate(review)).activated,true);assert.equal(JSON.parse(activate(review)).alreadyActivated,true);
 const w=JSON.parse(sql(`select to_jsonb(w) from public.v3_wallet w where child_user_id='${ids.learner}'`));
 assert.equal(w.coins,0);assert.equal(w.bonus,80);assert.equal(w.active_seconds,0);assert.equal(w.opening_seconds,120);
 assert.equal(w.legacy_redeemed,7);assert.equal(w.redeemed,0);assert.deepEqual(w.owned,['cap']);
 assert.equal(sql(`select progress from public.v3_progress where child_user_id='${ids.learner}'`),'{}');
 assert.equal(sql('select jsonb_agg(to_jsonb(f) order by child_user_id) from public.maths_families f'),familyBefore);
 assert.equal(sql("select pg_get_indexdef(indexrelid) from pg_index where indrelid='public.maths_reward_events'::regclass order by indexrelid"),indexBefore);
 });
 await test('cutover revokes TRUNCATE/legacy RPC access; database guard blocks privileged old writers too',()=>{
 for(const role of ['anon','authenticated'])for(const table of ['learning_progress','maths_learning','maths_rewards','maths_reward_events'])
 reject(()=>sql(`set role ${role};select * from public.${table} limit 0;`),/permission denied/);
 reject(()=>sql('set role authenticated;truncate public.learning_progress'),/permission denied/);
 reject(()=>call('parent','parent_award_maths_once',`'${ids.learner}','bonus_coins',1,'${crypto.randomUUID()}'`),/permission denied/);
 reject(()=>sql(`update public.maths_rewards set bonus_coins=bonus_coins+1 where child_user_id='${ids.learner}'`),/Legacy writes retired/);
 });
 await test('PIN enrollment requires fresh nonfuture password AMR and role-specific digits',()=>{
 for(const age of [null,600,-600])reject(()=>call('learner','v3_set_pin',"'1234'",age),/Sign in again/);
 reject(()=>call('parent','v3_set_pin',"'1234'"),/length/);
 for(const role of Object.keys(ids))call(role,'v3_set_pin',lit(role.includes('arent')?'654321':'1234'));
 assert.match(sql(`select hash from public.v3_pins where user_id='${ids.learner}'`),/^\$2/);
 });
 await test('incorrect PIN counters persist and cooldown cannot be bypassed by a new request',()=>{
 for(let i=0;i<5;i++)assert.ok(JSON.parse(call('learner','v3_unlock',"'0000'")).error);
 assert.match(JSON.parse(call('learner','v3_unlock',"'1234'")).error,/five minutes/);
 assert.equal(sql(`select attempts from public.v3_pins where user_id='${ids.learner}'`),'5');
 sql(`update public.v3_pins set blocked_until=now()-interval '1 second' where user_id='${ids.learner}'`);
 for(const role of Object.keys(ids))tokens[role]=JSON.parse(call(role,'v3_unlock',lit(role.includes('arent')?'654321':'1234'))).token;
 });
 await test('all protected tables reject clients despite hostile default grants; cross-user tokens denied',()=>{
 for(const t of ['v3_environment','v3_progress','v3_pins','v3_unlocks','v3_wallet','v3_catalog','v3_transactions','v3_activation'])
 for(const role of ['anon','authenticated'])reject(()=>sql(`set role ${role};select * from public.${t} limit 0`),/permission denied/);
 reject(()=>request('parent',tokens.learner,'read'),/Unlock/);
 reject(()=>request('learner','invalid','read'),/Unlock/);
 sql('grant select on public.v3_progress to authenticated');
 assert.equal(call('other','v3_request',`${lit(tokens.other)},'read','{}'`).includes('999999'),false);
 assert.equal(sql(prefix('other')+'select count(*) from public.v3_progress'),'0');
 sql('revoke select on public.v3_progress from authenticated');
 });
 await test('role and argument checks prevent parent saves, learner awards and caller-selected child/wallet',()=>{
 reject(()=>req('parent','save',{requestId:crypto.randomUUID(),revision:0,progress:{}}),/Learner/);
 reject(()=>req('learner','award',{requestId:crypto.randomUUID(),amount:60}),/Parent/);
 reject(()=>req('learner','save',{requestId:crypto.randomUUID(),revision:0,progress:{},child:ids.other}),/Unexpected/);
 reject(()=>req('learner',null,{requestId:crypto.randomUUID()}),/Unknown/);
 assert.deepEqual(req('otherParent','read').progress,{});
 });
 await test('CAS saves and immutable retries preserve complete drafts while ignoring client coin authority',async()=>{
 const a={requestId:crypto.randomUUID(),revision:0,progress:{minutes:3,coins:999999,quest:{amountDraft:'4.00',assisted:true}}};
 const first=req('learner','save',a);assert.deepEqual(req('learner','save',a),first);
 reject(()=>req('learner','save',{...a,progress:{}}),/reused/);
 assert.equal(req('learner','save',{...a,requestId:crypto.randomUUID(),revision:0}).conflict,true);
 assert.equal(req('parent','read').progress.quest.amountDraft,'4.00');assert.equal(req('parent','read').wallet.coins,0);
 const b={requestId:crypto.randomUUID(),revision:1,progress:{minutes:3,quest:{amountDraft:''}}};
 const text=prefix('learner')+`select public.v3_request('${tokens.learner}','save',${lit(JSON.stringify(b))});`;
 const [one,two]=await Promise.all([asyncSQL(text),asyncSQL(text)]);assert.deepEqual(JSON.parse(one),JSON.parse(two));
 assert.equal(req('parent','read').revision,2);
 });
 await test('purchases use server prices, unique ownership and stored exact-once results',()=>{
 const buy={requestId:crypto.randomUUID(),item:'gloves'};const result=req('learner','buy',buy);
 assert.deepEqual(req('learner','buy',buy),result);assert.equal(result.wallet.bonus,5);
 reject(()=>req('learner','buy',{...buy,requestId:crypto.randomUUID()}),/Already/);
 reject(()=>req('learner','buy',{requestId:crypto.randomUUID(),item:'dragon'}),/Not enough/);
 reject(()=>req('learner','buy',{requestId:crypto.randomUUID(),item:'free_item'}),/Unknown/);
 const award={requestId:crypto.randomUUID(),amount:60};const w=req('parent','award',award);
 assert.deepEqual(req('parent','award',award),w);assert.equal(w.wallet.bonus,65);
 assert.equal(req('other','read').wallet.bonus,20);
 });
 await test('nonfinite values cannot manipulate rewards or active-time credit',()=>{
 for(const seconds of ['NaN','Infinity',-1,16])reject(()=>req('learner','active',{requestId:crypto.randomUUID(),seconds}),/Invalid/);
 for(const amount of ['NaN','Infinity',null,0,61])reject(()=>req('parent','award',{requestId:crypto.randomUUID(),amount}),/Amount/);
 });
 await test('server clock caps credit across concurrent devices and repeated requests',async()=>{
 sql(`update public.v3_wallet set last_active=clock_timestamp()-interval '30 seconds' where child_user_id='${ids.learner}'`);
 const a={requestId:crypto.randomUUID(),seconds:15};const result=req('learner','active',a);
 assert.deepEqual(req('learner','active',a),result);assert.equal(result.wallet.active_seconds,15);
 const next={requestId:crypto.randomUUID(),seconds:15};req('learner','active',next);
 assert.ok(req('parent','read').wallet.active_seconds<16);
 });
 await test('reviewed opening entitlement redeems without fabricated learning; offline confirmation is parent-only and once',()=>{
 const redeem={requestId:crypto.randomUUID(),amount:2};const result=req('parent','redeem',redeem);
 assert.deepEqual(req('parent','redeem',redeem),result);assert.equal(result.wallet.redeemed,2);assert.equal(result.wallet.legacy_redeemed,7);
 reject(()=>req('parent','redeem',{requestId:crypto.randomUUID(),amount:1}),/Not enough/);
 const confirm={requestId:crypto.randomUUID(),amount:1};const credit=req('parent','confirm_offline',confirm);
 assert.deepEqual(req('parent','confirm_offline',confirm),credit);
 assert.ok(credit.wallet.active_seconds>=75&&credit.wallet.active_seconds<76);
 reject(()=>req('learner','confirm_offline',{requestId:crypto.randomUUID(),amount:1}),/Parent/);
 });
 await test('PIN recovery, explicit lock and expiration revoke server capabilities',()=>{
 const old=tokens.learner;call('learner','v3_set_pin',"'4321'");reject(()=>request('learner',old,'read'),/Unlock/);
 tokens.learner=JSON.parse(call('learner','v3_unlock',"'4321'")).token;
 req('learner','lock');reject(()=>req('learner','read'),/Unlock/);
 sql(`update public.v3_unlocks set expires_at=now()-interval '1 second' where user_id='${ids.parent}'`);
 reject(()=>req('parent','read'),/Unlock/);
 });
 await test('rollback freezes new backend, preserves all new records and restores safe legacy access',()=>{
 const count=sql('select count(*) from public.v3_transactions');
 reject(()=>sql("set app.v51.rollback_authorized='yes';select public.v3_admin_rollback();"),/Freeze/);
 sql("set app.v51.rollback_authorized='yes';select public.v3_admin_freeze();");
 reject(()=>sql("set app.v51.rollback_authorized='yes';select public.v3_admin_rollback();"),/Reconcile/);
 sql("set app.v51.rollback_authorized='yes';set app.v51.rollback_reconciled='yes';select public.v3_admin_rollback();");
 assert.equal(JSON.parse(sql('set role anon;select public.v3_identity()')).ready,false);
 assert.equal(sql('select count(*) from public.v3_transactions'),count);
 reject(()=>call('learner','v3_role'),/pending/);
 assert.equal(sql("select has_table_privilege('authenticated','public.learning_progress','TRUNCATE')"),'f');
 call('parent','parent_award_maths_once',`'${ids.learner}','bonus_coins',1,'${crypto.randomUUID()}'`);
 assert.equal(sql('select count(*) from auth.users'),'4');
 assert.equal(sql('select jsonb_agg(to_jsonb(f) order by child_user_id) from public.maths_families f'),familyBefore);
 reject(()=>activate(review),/Existing activation/);
 });
 await test('pre-migration fictional schema/data backup restores into a separate disposable database',()=>{
 docker(['exec',name,'createdb','-h','127.0.0.1','-U','postgres','v52_restore']);
 docker([...sqlArgs,'-d','v52_restore'],privateFictionalBackup);
 const restored=s=>docker([...sqlArgs,'-d','v52_restore'],s);
 assert.equal(restored('select count(*) from auth.users'),'4');
 assert.equal(restored('select jsonb_agg(to_jsonb(f) order by child_user_id) from public.maths_families f'),familyBefore);
 assert.equal(restored(`select bonus_coins from public.maths_rewards where child_user_id='${ids.learner}'`),'80');
 assert.equal(restored("select to_regclass('public.v3_wallet') is null"),'t');
 });
 console.log(`${suites} production migration/security rehearsal suites passed. Network-disabled PostgreSQL; fictional Auth claims, no production access.`);
 }finally{try{docker(['rm','-f',name]);}catch{}}
})().catch(e=>{console.error(e.message);if(e.stderr)console.error(String(e.stderr));process.exitCode=1;});
