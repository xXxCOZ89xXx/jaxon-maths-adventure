// Focused release-delta checks only. No backup restore, live Auth, gameplay regression or deployment.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),cp=require('node:child_process'),assert=require('node:assert/strict');
const crypto=require('node:crypto'),{prepare,installation}=require('../scripts/prepare-v52-release.cjs'),B=require('../v3/backend-config.js');
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'v52-release-')),name='jaxon-v52-release-'+process.pid;
const env={...process.env};for(const k of ['DOCKER_HOST','DOCKER_CONTEXT','DOCKER_TLS','DOCKER_TLS_VERIFY','DOCKER_CERT_PATH'])delete env[k];
const docker=(args,input)=>cp.execFileSync('docker',['--host=unix:///var/run/docker.sock',...args],{env,input,encoding:'utf8',stdio:['pipe','pipe','pipe']}).trim();
const sql=s=>docker(['exec','-i',name,'psql','-h','127.0.0.1','-U','postgres','-XqAt','-v','ON_ERROR_STOP=1'],s);
const lit=s=>"'"+String(s).replaceAll("'","''")+"'",hash=s=>crypto.createHash('sha256').update(s).digest('hex');
const c={...B.production,authorizedRef:B.production.projectRef,url:`https://${B.production.projectRef}.supabase.co`,anonKey:'sb_publishable_'+'a'.repeat(24)};
let count=0;function pass(s){count++;console.log('PASS',s);}
(async()=>{try{
 const manifest=prepare(c,temp);assert.equal(manifest.deployed,false);assert.equal(manifest.activated,false);
 for(const f of manifest.siteFiles)assert.equal(hash(fs.readFileSync(path.join(temp,'site',f.path))),f.sha256);
 assert.ok(fs.existsSync(path.join(temp,'site','.nojekyll')));assert.ok(!fs.existsSync(path.join(temp,'site','install-inactive.sql')));
 for(const route of ['v2-game-test.html','v2-secure-preview.html','secure-access-test.html','v3-adventure.html','town-interactions-preview.html','world-interactions-preview.html'])
  assert.match(fs.readFileSync(path.join(temp,'site',route),'utf8'),/0;url=\.\//);
 assert.throws(()=>prepare(c,temp),/empty/);
 pass('offline hashed release package: six legacy routes, .nojekyll, strict site boundary and nonempty-output refusal');
 const bundle=installation();assert.equal((bundle.match(/^begin;/gm)||[]).length,1);assert.equal((bundle.match(/^commit;/gm)||[]).length,1);
 assert.equal(manifest.installationSha256,hash(bundle));
 docker(['run','--pull=never','--rm','-d','--name',name,'--network','none','-e','POSTGRES_HOST_AUTH_METHOD=trust','postgres:17-alpine']);
 let ready=false;for(let i=0;i<100;i++){try{sql('select 1');ready=true;break;}catch{await new Promise(r=>setTimeout(r,100));}}assert.ok(ready);
 sql(`create role anon;create role authenticated;create role service_role;create schema auth;create schema extensions;
 create extension pgcrypto with schema extensions;create table auth.users(id uuid primary key,fictional_password text);
 create function auth.uid() returns uuid language sql stable as $$ select (current_setting('request.jwt.claims',true)::jsonb->>'sub')::uuid $$;
 create function auth.jwt() returns jsonb language sql stable as $$ select current_setting('request.jwt.claims',true)::jsonb $$;`);
 sql(fs.readFileSync('tests/fixtures/v52-legacy-schema.sql','utf8'));
 const child='11111111-1111-4111-8111-111111111111',parent='22222222-2222-4222-8222-222222222222';
 sql(`insert into auth.users values('${child}','fictional-only'),('${parent}','fictional-only');
 insert into public.maths_families(parent_user_id,child_user_id) values('${parent}','${child}');
 insert into public.maths_rewards(child_user_id,bonus_coins,redeemed_minutes) values('${child}',80,7);`);
 const families=sql('select jsonb_agg(to_jsonb(f) order by id) from public.maths_families f'),users=sql('select jsonb_agg(to_jsonb(u) order by id) from auth.users u');
 assert.throws(()=>sql(bundle.replace(/^commit;/m,'select 1/0;\ncommit;')));
 assert.equal(sql("select to_regclass('public.v3_environment') is null"),'t');assert.equal(sql("select to_regnamespace('v51_private') is null"),'t');
 pass('all-four installation is atomic on late failure; no partial backend/private schema remains');
 sql(bundle);assert.equal(JSON.parse(sql('select public.v3_identity()')).ready,false);
 assert.equal(sql('select count(*) from public.v3_wallet'),'0');assert.equal(sql('select jsonb_agg(to_jsonb(u) order by id) from auth.users u'),users);
 assert.equal(sql('select jsonb_agg(to_jsonb(f) order by id) from public.maths_families f'),families);
 pass('atomic inactive installation preserves existing Auth/family records and creates no openings');
 const baseline=sql(fs.readFileSync(path.join(temp,'restored-legacy-fingerprint.sql'),'utf8'));
 assert.equal(baseline,sql("select encode(extensions.digest(v51_private.legacy_state()::text,'sha256'),'hex')"));
 const review={mode:'fresh-start',migrationId:crypto.randomUUID(),pinTransitionApproved:true,gameplayResetApproved:true,
 legacyFingerprint:baseline,permissionFingerprint:sql("select encode(extensions.digest(v51_private.legacy_permissions()::text,'sha256'),'hex')"),
 families:JSON.parse(families).map(f=>({familyId:f.id,parent:f.parent_user_id,child:f.child_user_id})),
 backupReceipt:{archiveId:crypto.randomUUID(),backupSha256:'a'.repeat(64),restoreReceiptSha256:'b'.repeat(64),restoreVerified:true,
 recoveryScope:'application-data-only',managedAuthRecoveryVerified:false,managedServiceSafeguardsApproved:true}};
 const invalid=structuredClone(review);delete invalid.backupReceipt.recoveryScope;
 assert.throws(()=>sql("set app.v51.cutover_authorized='yes';set app.v51.fresh_start_authorized='yes';select public.v3_admin_activate_fresh_start("+lit(JSON.stringify(invalid))+');'));
 invalid.backupReceipt.recoveryScope='application-data-only';invalid.backupReceipt.managedServiceSafeguardsApproved=false;
 assert.throws(()=>sql("set app.v51.cutover_authorized='yes';set app.v51.fresh_start_authorized='yes';select public.v3_admin_activate_fresh_start("+lit(JSON.stringify(invalid))+');'));
 assert.equal(sql('select count(*) from v51_private.fresh_start_archive'),'0');
 pass('partial recovery receipt requires explicit scope and separately acknowledged managed-service safeguards, atomically');
 sql("set app.v51.cutover_authorized='yes';set app.v51.fresh_start_authorized='yes';select public.v3_admin_activate_fresh_start("+lit(JSON.stringify(review))+');');
 const checks=sql(fs.readFileSync(path.join(temp,'post-install-checks.sql'),'utf8')).split('\n').map(line=>{const p=line.indexOf('|');return {check:line.slice(0,p),result:JSON.parse(line.slice(p+1))};});
 assert.equal(checks[0].result.nonzero_openings,0);assert.equal(checks[0].result.nonempty_progress,0);
 assert.ok(checks.filter(x=>x.check==='protected_table_access').every(x=>x.result.rls&&!x.result.direct_access));
 assert.ok(checks.filter(x=>x.check==='legacy_access').every(x=>!x.result.any_direct_access));
 assert.ok(checks.filter(x=>x.check==='rpc_access').every(x=>x.result.execute===x.result.expected));
 assert.ok(checks.filter(x=>x.check==='private_archive_service_access').every(x=>!x.result.schema_usage&&!x.result.table_access));
 assert.equal(checks[0].result.activation_mode,'fresh-start');
 pass('canonical backup-state query and aggregate release checks match fresh zero openings/private access boundaries');
 sql("set app.v51.rollback_authorized='yes';select public.v3_admin_freeze();");
 assert.throws(()=>sql(`update public.maths_rewards set bonus_coins=81 where child_user_id='${child}'`));
 assert.equal(sql('select legacy_restored from public.v3_activation'),'f');
 pass('freeze retains legacy write guard even for privileged stale writers while backend is not ready');
 sql("set app.v51.rollback_authorized='yes';select public.v3_admin_rollback();");
 assert.equal(sql('select legacy_restored from public.v3_activation'),'t');
 sql(`update public.maths_rewards set bonus_coins=81 where child_user_id='${child}'`);
 assert.equal(sql('select jsonb_agg(to_jsonb(u) order by id) from auth.users u'),users);
 assert.equal(sql('select jsonb_agg(to_jsonb(f) order by id) from public.maths_families f'),families);
 assert.equal(sql('select count(*) from v51_private.fresh_start_archive'),'1');
 pass('explicit rollback alone restores legacy writes, retaining original accounts/families, new zero opening and private archive');
 console.log(`${count} focused final-release suites passed; fictional records, network-disabled PG17; no backup-restoration rerun or hosted requests.`);
}finally{try{docker(['rm','-f',name]);}catch{}fs.rmSync(temp,{recursive:true,force:true});}})().catch(e=>{console.error(e.message);process.exitCode=1;});
