// Fresh-start rehearsal in network-disabled PostgreSQL; fictional records/claims only.
const fs=require('node:fs'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const {execFileSync,execFile}=require('node:child_process');
const {E,C}=require('./helpers/profiles.cjs'),D=require('../v3/discovery.js').V3Discovery;
const env={...process.env};for(const k of ['DOCKER_HOST','DOCKER_CONTEXT','DOCKER_TLS','DOCKER_TLS_VERIFY','DOCKER_CERT_PATH'])delete env[k];
const name='jaxon-v52-fresh-'+process.pid,dargs=['--host=unix:///var/run/docker.sock'];
function docker(args,input){return execFileSync('docker',[...dargs,...args],{env,input,encoding:'utf8',stdio:['pipe','pipe','pipe']}).trim();}
const psql=['exec','-i',name,'psql','-h','127.0.0.1','-X','-qAt','-v','ON_ERROR_STOP=1','-U','postgres'];
const sql=s=>docker(psql,s),lit=x=>"'"+String(x).replaceAll("'","''")+"'";
const parallelSQL=s=>new Promise((resolve,reject)=>{const p=execFile('docker',[...dargs,...psql],{env,encoding:'utf8'},(e,o)=>e?reject(e):resolve(o.trim()));p.stdin.end(s);});
const id={learner:'11111111-1111-4111-8111-111111111111',parent:'22222222-2222-4222-8222-222222222222',other:'33333333-3333-4333-8333-333333333333',otherParent:'44444444-4444-4444-8444-444444444444'};
const prefix=who=>`set role authenticated;set request.jwt.claims=${lit(JSON.stringify({sub:id[who],amr:[{method:'password',timestamp:Math.floor(Date.now()/1000)}]}))};`;
const call=(who,fn,args='')=>sql(prefix(who)+`select public.${fn}(${args});`);
const rejects=(f,re=/permission denied|approval|required|manifest|mismatch|changed|review|Unexpected|Unknown|Existing|Reconcile|Freeze|Parent|Unlock|Not enough/i)=>assert.throws(f,e=>re.test(String(e.stderr||e.message)));
const install="set app.v51.migration_authorized='yes';set app.v51.authorized_ref='mbdelspbjusarbwlltol';";
const approval="set app.v51.cutover_authorized='yes';set app.v51.fresh_start_authorized='yes';";
let count=0;async function test(label,f){await f();count++;console.log('PASS',label);}
const hash=x=>crypto.createHash('sha256').update(x).digest('hex');
let manifest,backup,authBefore,familyBefore,oldState,tokens={};
const activate=(m=manifest,flags=approval)=>sql(flags+`select public.v3_admin_activate_fresh_start(${lit(JSON.stringify(m))});`);
const req=(who,op,args={})=>JSON.parse(call(who,'v3_request',`${lit(tokens[who])},${lit(op)},${lit(JSON.stringify(args))}`));
(async()=>{try{
 docker(['run','--pull=never','--rm','-d','--name',name,'--network','none','-e','POSTGRES_HOST_AUTH_METHOD=trust','postgres:17-alpine']);
 let ready=false;for(let i=0;i<100;i++){try{sql('select 1');ready=true;break;}catch{await new Promise(r=>setTimeout(r,100));}}assert.ok(ready);
 sql(`create role anon;create role authenticated;create role service_role bypassrls;
 create schema auth;create schema extensions;create extension pgcrypto with schema extensions;
 create table auth.users(id uuid primary key,email text not null,password_hash text not null);
 create function auth.jwt() returns jsonb language sql stable as $$select coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb$$;
 create function auth.uid() returns uuid language sql stable as $$select (auth.jwt()->>'sub')::uuid$$;
 grant usage on schema auth to anon,authenticated;grant execute on function auth.uid(),auth.jwt() to anon,authenticated;`);
 sql(fs.readFileSync('tests/fixtures/v52-legacy-schema.sql','utf8'));
 const old={coins:9999,minutes:500,weekly:{old:500},skills:{place:{state:'mastered'}},discovery:{place:{complete:true}},
  bought:['dragon'],equipped:['dragon'],achievements:['legacy'],estate:{stage:9},journey:{inventory:{lentils:99}},quests:{number:{complete:true}}};
 sql(`insert into auth.users values ${Object.entries(id).map(([k,v])=>`('${v}','${k}@fictional.invalid','fictional-password-hash-${k}')`).join(',')};
 insert into public.maths_families(parent_user_id,child_user_id) values('${id.parent}','${id.learner}'),('${id.otherParent}','${id.other}');
 insert into public.learning_progress(user_id,game_state) values('${id.parent}',${lit(JSON.stringify(old))});
 insert into public.maths_learning(child_user_id,progress) values('${id.learner}',${lit(JSON.stringify(old))});
 insert into public.maths_rewards(child_user_id,bonus_coins,redeemed_minutes) values('${id.learner}',80,7),('${id.other}',20,3);
 insert into public.maths_reward_events(child_user_id,parent_user_id,kind,amount,request_id) values('${id.learner}','${id.parent}','bonus_coins',20,'${crypto.randomUUID()}');`);
 authBefore=sql('select jsonb_agg(to_jsonb(u) order by id) from auth.users u');
 familyBefore=sql('select jsonb_agg(to_jsonb(f) order by id) from public.maths_families f');
 backup=docker(['exec',name,'pg_dump','-h','127.0.0.1','-U','postgres','--clean','--if-exists','--no-owner','postgres']);
 const [legacyFingerprint,permissionFingerprint]=sql(fs.readFileSync('docs/V52-FRESH-START-PREFLIGHT.sql','utf8')).split('|');
 const families=JSON.parse(familyBefore).map(f=>({familyId:f.id,parent:f.parent_user_id,child:f.child_user_id}));
 manifest={mode:'fresh-start',migrationId:crypto.randomUUID(),pinTransitionApproved:true,gameplayResetApproved:true,
 legacyFingerprint,permissionFingerprint,families,backupReceipt:{archiveId:crypto.randomUUID(),backupSha256:hash(backup),
 restoreReceiptSha256:hash('fictional isolated restoration checked'),restoreVerified:true}};
 await test('pre-migration fictional backup restores Auth credentials, family links and old rewards in isolation',()=>{
 docker(['exec',name,'createdb','-h','127.0.0.1','-U','postgres','fresh_backup_restore']);
 docker([...psql,'-d','fresh_backup_restore'],backup);
 assert.equal(docker([...psql,'-d','fresh_backup_restore'],'select jsonb_agg(to_jsonb(u) order by id) from auth.users u'),authBefore);
 assert.equal(docker([...psql,'-d','fresh_backup_restore'],'select jsonb_agg(to_jsonb(f) order by id) from public.maths_families f'),familyBefore);
 assert.deepEqual(JSON.parse(docker([...psql,'-d','fresh_backup_restore'],`select progress from public.maths_learning where child_user_id='${id.learner}'`)),old);
 assert.equal(docker([...psql,'-d','fresh_backup_restore'],`select bonus_coins from public.maths_rewards where child_user_id='${id.learner}'`),'80');
 });
 for(const f of ['001_secure_backend.sql','002_catalog.sql','003_activation.sql','004_fresh_start.sql'])sql(install+fs.readFileSync('supabase/v51-production/'+f,'utf8'));
 oldState=sql('select v51_private.legacy_state()');
 await test('read-only private fingerprints match locked activation helper across timezone/search-path contexts',()=>{
 assert.equal(sql("set timezone='Pacific/Auckland';select encode(extensions.digest(v51_private.legacy_state()::text,'sha256'),'hex')"),legacyFingerprint);
 assert.equal(sql("select encode(extensions.digest(v51_private.legacy_permissions()::text,'sha256'),'hex')"),permissionFingerprint);
 });
 await test('fresh-start needs distinct administrator approval and verified backup receipt, never a zeroed preservation manifest',()=>{
 rejects(()=>activate(manifest,"set app.v51.cutover_authorized='yes';"),/fresh-start approval/);
 const invalid=structuredClone(manifest);invalid.backupReceipt.restoreVerified=false;rejects(()=>activate(invalid),/restoration receipt/);
 rejects(()=>sql(approval+`select public.v3_admin_activate(${lit(JSON.stringify(manifest))});`),/separate fresh-start/);
 const bad=structuredClone(manifest);bad.families[0].bonus=0;rejects(()=>activate(bad),/unexpected opening fields/);
 assert.equal(sql('select count(*) from v51_private.fresh_start_archive'),'0');
 });
 await test('unexpected balances, permissions, families and new backend rows fail without partial activation',()=>{
 sql(`update public.maths_rewards set bonus_coins=81 where child_user_id='${id.learner}'`);rejects(()=>activate(),/records or balances changed/);
 sql(`update public.maths_rewards set bonus_coins=80 where child_user_id='${id.learner}'`);
 sql('grant update on public.maths_rewards to authenticated');rejects(()=>activate(),/permissions changed/);sql('revoke update on public.maths_rewards from authenticated');
 sql('create policy unexpected_public_read on public.maths_rewards for select to anon using(true)');
 rejects(()=>activate(),/permissions changed/);sql('drop policy unexpected_public_read on public.maths_rewards');
 sql(`insert into public.v3_progress(child_user_id) values('${id.other}')`);rejects(()=>activate(),/Unexpected new-backend/);sql('delete from public.v3_progress');
 const wrong=structuredClone(manifest);wrong.families[1].parent=wrong.families[1].parent===id.parent?id.otherParent:id.parent;rejects(()=>activate(wrong),/family identity mismatch/);
 assert.equal(sql('select count(*) from public.v3_wallet'),'0');assert.equal(sql('select count(*) from v51_private.fresh_start_archive'),'0');
 assert.equal(JSON.parse(sql('set role anon;select public.v3_identity()')).ready,false);
 });
 await test('an interrupted transaction rolls back archive, wallets, readiness, revocations and audit together',()=>{
 rejects(()=>sql('begin;'+approval+`select public.v3_admin_activate_fresh_start(${lit(JSON.stringify(manifest))});select 1/0;commit;`),/division by zero/);
 assert.equal(sql('select count(*) from public.v3_wallet'),'0');assert.equal(sql('select count(*) from v51_private.fresh_start_archive'),'0');
 assert.equal(sql("select has_table_privilege('authenticated','public.learning_progress','TRUNCATE')"),'t');
 });
 await test('fresh activation preserves identities/links, audits its mode and is exactly-once on matching retries',()=>{
 assert.equal(JSON.parse(activate()).activated,true);assert.equal(JSON.parse(activate()).alreadyActivated,true);
 assert.equal(sql('select count(*) from auth.users'),'4');assert.equal(sql('select count(*) from public.v3_wallet'),'2');
 assert.equal(sql('select jsonb_agg(to_jsonb(u) order by id) from auth.users u'),authBefore);
 assert.equal(sql('select jsonb_agg(to_jsonb(f) order by id) from public.maths_families f'),familyBefore);
 assert.equal(sql('select mode from public.v3_activation'),'fresh-start');
 const identity=JSON.parse(sql('set role anon;select public.v3_identity()'));assert.equal(identity.activationId,manifest.migrationId);assert.equal(identity.activationMode,'fresh-start');
 const changed={...manifest,migrationId:crypto.randomUUID()};rejects(()=>activate(changed),/Existing activation/);
 });
 await test('all learning, wallet, ownership and historical opening values are zero with no imported evidence',()=>{
 for(const child of [id.learner,id.other]){
 assert.equal(sql(`select progress from public.v3_progress where child_user_id='${child}'`),'{}');
 const w=JSON.parse(sql(`select to_jsonb(w) from public.v3_wallet w where child_user_id='${child}'`));
 for(const field of ['coins','bonus','active_seconds','opening_seconds','redeemed','legacy_redeemed'])assert.equal(w[field],0);
 assert.deepEqual(w.owned,[]);
 }
 const fresh=E.migrate({});assert.equal(fresh.minutes,0);assert.deepEqual(fresh.weekly,{});assert.deepEqual(fresh.discovery,{});
 assert.deepEqual(fresh.skills,{});assert.deepEqual(fresh.achievements,[]);assert.deepEqual(fresh.bought,[]);assert.deepEqual(fresh.quests,{});
 assert.equal(fresh.estate,undefined);assert.equal(fresh.journey,undefined);assert.equal(E.startDiscovery(fresh,'place',C,D),null);
 assert.ok(fresh.learning.qs.length>0);
 });
 await test('private archived records remain intact and cannot be read by learner, parent or service role',()=>{
 assert.equal(sql('select legacy_records from v51_private.fresh_start_archive'),oldState);
 assert.equal(sql('select v51_private.legacy_state()'),oldState);
 for(const role of ['anon','authenticated','service_role']){
 rejects(()=>sql(`set role ${role};select legacy_records from v51_private.fresh_start_archive`),/permission denied/);
 rejects(()=>sql(`set role ${role};select public.v3_admin_activate_fresh_start('{}')`),/permission denied/);
 }
 });
 await test('legacy writes and reward manipulation remain blocked after fresh activation',()=>{
 rejects(()=>sql('set role authenticated;truncate public.learning_progress'),/permission denied/);
 rejects(()=>call('parent','parent_award_maths_once',`'${id.learner}','bonus_coins',1,'${crypto.randomUUID()}'`),/permission denied/);
 rejects(()=>sql(`update public.maths_learning set progress='{}' where child_user_id='${id.learner}'`),/Legacy writes retired/);
 });
 await test('PIN enrollment and invalid-PIN rejection work without changing account passwords or identity',()=>{
 for(const who of Object.keys(id)){
 call(who,'v3_set_pin',lit(who.includes('arent')?'654321':'1234'));
 assert.ok(JSON.parse(call(who,'v3_unlock',"'0000'")).error);
 tokens[who]=JSON.parse(call(who,'v3_unlock',lit(who.includes('arent')?'654321':'1234'))).token;
 }
 assert.equal(sql('select jsonb_agg(to_jsonb(u) order by id) from auth.users u'),authBefore);
 for(let i=0;i<2;i++){const r=req('learner','read');assert.deepEqual(r.progress,{});assert.equal(r.wallet.bonus,0);assert.equal(r.wallet.legacy_redeemed,0);assert.equal(r.wallet.opening_seconds,0);}
 });
 await test('first eligible active minute earns ten coins and one screen minute, never legacy credit',()=>{
 const fresh=E.migrate(req('learner','read').progress);E.startDiscovery(fresh,'place',C,D);
 E.answerLearning(fresh,fresh.learning.qs[fresh.learning.i][1]);
 req('learner','save',{requestId:crypto.randomUUID(),revision:0,progress:fresh});
 for(let i=0;i<4;i++){
 sql(`update public.v3_wallet set last_active=clock_timestamp()-interval '15 seconds' where child_user_id='${id.learner}'`);
 req('learner','active',{requestId:crypto.randomUUID(),seconds:15});
 }
 const w=req('parent','read').wallet;assert.equal(w.coins,10);assert.equal(w.active_seconds/60,1);assert.equal(w.opening_seconds,0);
 });
 await test('parent rewards and new purchases work; learner cannot award, edit wallet or select another family',()=>{
 rejects(()=>req('learner','award',{requestId:crypto.randomUUID(),amount:60}),/Parent/);
 rejects(()=>sql(prefix('learner')+'update public.v3_wallet set coins=9999'),/permission denied/);
 rejects(()=>req('learner','save',{requestId:crypto.randomUUID(),revision:1,progress:{},child:id.other}),/Unexpected/);
 const award={requestId:crypto.randomUUID(),amount:40};const credited=req('parent','award',award);assert.deepEqual(req('parent','award',award),credited);
 const bought=req('learner','buy',{requestId:crypto.randomUUID(),item:'cap'});assert.deepEqual(bought.wallet.owned,['cap']);
 assert.equal(bought.wallet.bonus,5);assert.equal(bought.wallet.coins,0);assert.deepEqual(req('otherParent','read').progress,{});
 rejects(()=>JSON.parse(call('parent','v3_request',`${lit(tokens.learner)},'read','{}'`)),/Unlock/);
 });
 await test('save/resume, duplicate requests and concurrent revisions preserve new progress only',async()=>{
 const a={requestId:crypto.randomUUID(),revision:1,progress:{quest:{amountDraft:'4.00',assisted:true}}};
 const text=prefix('learner')+`select public.v3_request('${tokens.learner}','save',${lit(JSON.stringify(a))});`;
 const [one,two]=await Promise.all([parallelSQL(text),parallelSQL(text)]);assert.deepEqual(JSON.parse(one),JSON.parse(two));
 const r=req('learner','read');assert.equal(r.revision,2);assert.equal(r.progress.quest.amountDraft,'4.00');
 assert.equal(r.progress.estate,undefined);assert.equal(r.wallet.legacy_redeemed,0);
 assert.equal(req('learner','save',{...a,requestId:crypto.randomUUID()}).conflict,true);
 });
 await test('fresh-start freeze/rollback requires reconciliation and retains new and archived records',()=>{
 sql("set app.v51.rollback_authorized='yes';select public.v3_admin_freeze();");
 rejects(()=>sql("set app.v51.rollback_authorized='yes';select public.v3_admin_rollback();"),/Reconcile/);
 const tx=sql('select count(*) from public.v3_transactions');
 sql("set app.v51.rollback_authorized='yes';set app.v51.rollback_reconciled='yes';select public.v3_admin_rollback();");
 assert.equal(sql('select count(*) from public.v3_transactions'),tx);assert.equal(sql('select legacy_records from v51_private.fresh_start_archive'),oldState);
 assert.equal(sql('select jsonb_agg(to_jsonb(u) order by id) from auth.users u'),authBefore);
 rejects(()=>activate(),/Existing activation/);
 });
 console.log(`${count} fresh-start/backup suites passed; fictional records, network-disabled PostgreSQL, no production access.`);
}finally{try{docker(['rm','-f',name]);}catch{}}})().catch(e=>{console.error(e.message);if(e.stderr)console.error(String(e.stderr));process.exitCode=1;});
