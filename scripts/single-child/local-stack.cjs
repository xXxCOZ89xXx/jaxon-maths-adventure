// Minimal local Supabase: real GoTrue, PostgREST, PostgreSQL and captured mail.
// No remote credentials. Dedicated internal Docker network; published loopback ports only.
const fs=require('node:fs'),crypto=require('node:crypto'),{execFileSync,spawn}=require('node:child_process');
const root='work/single-child-integration';fs.mkdirSync(root,{recursive:true});
const env={...process.env};for(const k of ['DOCKER_HOST','DOCKER_CONTEXT','DOCKER_TLS','DOCKER_TLS_VERIFY','DOCKER_CERT_PATH'])delete env[k];
const docker=(args,input)=>execFileSync('docker',['--host=unix:///var/run/docker.sock',...args],{env,input,encoding:'utf8',stdio:['pipe','pipe','pipe']}).trim();
const exists=name=>{try{return !!docker(['inspect',name]);}catch{return false;}};
const jwt=(role,secret)=>{const h=Buffer.from(JSON.stringify({alg:'HS256',typ:'JWT'})).toString('base64url'),p=Buffer.from(JSON.stringify({role,iss:'supabase-local',iat:Math.floor(Date.now()/1000),exp:Math.floor(Date.now()/1000)+86400*30})).toString('base64url');return h+'.'+p+'.'+crypto.createHmac('sha256',secret).update(h+'.'+p).digest('base64url');};
const cfgPath=root+'/local-private.json';let cfg;
if(fs.existsSync(cfgPath))cfg=JSON.parse(fs.readFileSync(cfgPath));else{const secret=crypto.randomBytes(32).toString('hex');cfg={localOnly:true,origin:'https://127.0.0.1:4443',authUrl:'http://127.0.0.1:54321',restUrl:'http://127.0.0.1:54322',mailUrl:'http://127.0.0.1:54324',jwtSecret:secret,anonKey:jwt('anon',secret),serviceKey:jwt('service_role',secret),rateSecret:crypto.randomBytes(32).toString('hex')};fs.writeFileSync(cfgPath,JSON.stringify(cfg),{mode:0o600});}
const sql=s=>docker(['exec','-i','jaxon-local-db','psql','-U','postgres','-XqAt','-v','ON_ERROR_STOP=1'],s);
(async()=>{
 if(!exists('jaxon-local-supabase'))docker(['network','create','--internal','jaxon-local-supabase']);
 if(!exists('jaxon-local-db'))docker(['run','--pull=never','-d','--name','jaxon-local-db','--network','jaxon-local-supabase','-e','POSTGRES_HOST_AUTH_METHOD=trust','postgres:17-alpine']);
 for(let i=0;i<100;i++){try{sql('select 1');break;}catch{await new Promise(r=>setTimeout(r,100));}}
 if(sql("select exists(select 1 from pg_roles where rolname='supabase_auth_admin')")!=='t')sql(`create role supabase_auth_admin login password 'local-fictional-auth-only';create role authenticator login noinherit password 'local-fictional-rest-only';create role anon nologin;create role authenticated nologin;create role service_role nologin bypassrls;grant anon,authenticated,service_role to authenticator;grant create on database postgres to supabase_auth_admin;create schema auth authorization supabase_auth_admin;create schema extensions;create extension pgcrypto with schema extensions;grant usage on schema public,auth,extensions to authenticated,anon,service_role;`);
 sql("alter role supabase_auth_admin set search_path=auth;do $$begin if to_regprocedure('auth.uid()') is not null then alter function auth.uid() owner to supabase_auth_admin; end if; if to_regprocedure('auth.jwt()') is not null then alter function auth.jwt() owner to supabase_auth_admin; end if;end $$;");
 if(!exists('jaxon-local-mail'))docker(['run','--pull=never','-d','--name','jaxon-local-mail','--network','jaxon-local-supabase','-p','127.0.0.1:54324:8025','axllent/mailpit:v1.27.1']);
 if(!exists('jaxon-local-auth')){
  const vars={GOTRUE_API_HOST:'0.0.0.0',GOTRUE_API_PORT:'9999',API_EXTERNAL_URL:cfg.origin+'/supabase/auth/v1',GOTRUE_DB_DRIVER:'postgres',GOTRUE_DB_DATABASE_URL:'postgres://supabase_auth_admin:local-fictional-auth-only@jaxon-local-db:5432/postgres',GOTRUE_SITE_URL:cfg.origin,GOTRUE_URI_ALLOW_LIST:cfg.origin+'/**',GOTRUE_DISABLE_SIGNUP:'false',GOTRUE_JWT_SECRET:cfg.jwtSecret,GOTRUE_JWT_EXP:'3600',GOTRUE_JWT_AUD:'authenticated',GOTRUE_JWT_DEFAULT_GROUP_NAME:'authenticated',GOTRUE_JWT_ADMIN_ROLES:'service_role',GOTRUE_EXTERNAL_EMAIL_ENABLED:'true',GOTRUE_MAILER_AUTOCONFIRM:'false',GOTRUE_SMTP_HOST:'jaxon-local-mail',GOTRUE_SMTP_PORT:'1025',GOTRUE_SMTP_ADMIN_EMAIL:'noreply@fictional.invalid',GOTRUE_SMTP_SENDER_NAME:'Local fictional review',GOTRUE_MAILER_URLPATHS_CONFIRMATION:'/supabase/auth/v1/verify',GOTRUE_MAILER_URLPATHS_RECOVERY:'/supabase/auth/v1/verify',GOTRUE_RATE_LIMIT_EMAIL_SENT:'1000',GOTRUE_RATE_LIMIT_SIGN_UPS:'1000',GOTRUE_RATE_LIMIT_TOKEN_REFRESH:'1000',GOTRUE_SECURITY_CAPTCHA_ENABLED:'false',GOTRUE_EXTERNAL_ANONYMOUS_USERS_ENABLED:'false',GOTRUE_LOG_LEVEL:'error'};
  docker(['run','--pull=never','-d','--name','jaxon-local-auth','--network','jaxon-local-supabase','-p','127.0.0.1:54321:9999',...Object.entries(vars).flatMap(([k,v])=>['-e',k+'='+v]),'supabase/gotrue:v2.197.0']);
 }
 if(docker(['inspect','--format','{{.State.Running}}','jaxon-local-auth'])!=='true')docker(['start','jaxon-local-auth']);
 // Auth performs its own real migrations; never substitute stub Auth records/claims here.
 const authIp=docker(['inspect','--format','{{(index .NetworkSettings.Networks \"jaxon-local-supabase\").IPAddress}}','jaxon-local-auth']);
 if(!/^172\.(1[6-9]|2\d|3[01])\.\d+\.\d+$/.test(authIp))throw Error('Expected local Docker Auth address');
 let healthy=false;for(let i=0;i<100;i++){try{const r=await fetch('http://'+authIp+':9999/health');if(r.ok){healthy=true;break;}}catch{}await new Promise(r=>setTimeout(r,200));}
 if(!healthy)throw Error('Real local Auth health check failed');
 if(sql("select to_regclass('auth.users') is not null")!=='t')throw Error('Local Auth migrations did not complete');
 sql(`create or replace function auth.jwt() returns jsonb language sql stable as $$select coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb$$;
 create or replace function auth.uid() returns uuid language sql stable as $$select (auth.jwt()->>'sub')::uuid$$;
 grant execute on function auth.jwt(),auth.uid() to anon,authenticated,service_role;`);
 if(sql("select to_regclass('public.v3_environment') is not null")!=='t'){
  sql("set app.v3.staging_authorized='yes';set app.v3.staging_ref='sfogrvedypgtxfvecmbx';"+fs.readFileSync('supabase/v3-staging/001_secure_core.sql','utf8'));
  sql(fs.readFileSync('supabase/v3-staging/002_catalog.sql','utf8'));
  sql(fs.readFileSync('supabase/v3-staging/004_compact_save_receipts.sql','utf8'));
  sql("set app.v12.foundation_reviewed='yes';set app.v12.target_ref='sfogrvedypgtxfvecmbx';"+fs.readFileSync('supabase/single-child-draft/001_pairing_foundation.sql','utf8'));
 }
 if(sql("select to_regclass('v12_private.children') is not null")!=='t')sql("set app.v13.bridge_reviewed='yes';set app.v12.target_ref='sfogrvedypgtxfvecmbx';"+fs.readFileSync('supabase/single-child-draft/002_identity_bridge.sql','utf8'));
 if(!exists('jaxon-local-rest'))docker(['run','--pull=never','-d','--name','jaxon-local-rest','--network','jaxon-local-supabase','-p','127.0.0.1:54322:3000','-e','PGRST_DB_URI=postgres://authenticator:local-fictional-rest-only@jaxon-local-db:5432/postgres','-e','PGRST_DB_SCHEMAS=public','-e','PGRST_DB_ANON_ROLE=anon','-e','PGRST_JWT_SECRET='+cfg.jwtSecret,'-e','PGRST_DB_EXTRA_SEARCH_PATH=extensions','postgrest/postgrest:v14.18']);
 sql("notify pgrst,'reload schema'");
 let forwarded=false;try{const r=await fetch(cfg.authUrl+'/health');forwarded=r.ok&&r.headers.get('x-jaxon-local-fixture')==='true';}catch{}
 if(!forwarded){const log=fs.openSync(root+'/forward.log','a');const child=spawn(process.execPath,['scripts/single-child/local-forward.cjs'],{env,detached:true,stdio:['ignore',log,log]});child.unref();fs.writeFileSync(root+'/forward.pid',String(child.pid));}
 let localReady=false;for(let i=0;i<50;i++){try{const r=await fetch(cfg.authUrl+'/health');const rest=await fetch(cfg.restUrl+'/');if(r.ok&&rest.ok&&r.headers.get('x-jaxon-local-fixture')==='true'){localReady=true;break;}}catch{}await new Promise(r=>setTimeout(r,100));}if(!localReady)throw Error('Local-only HTTP forwarding did not become healthy');
 console.log('Local Supabase components ready: real Auth/email confirmation, PostgREST and database. No remote endpoints or credentials.');
})().catch(e=>{console.error('Local stack failed:',String(e.stderr||e.message).replaceAll(cfg.jwtSecret,'[redacted]'));process.exitCode=1;});
