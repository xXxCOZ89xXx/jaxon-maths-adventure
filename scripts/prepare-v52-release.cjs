// Offline preparation only. No SQL client, network call, root replacement, git mutation or deployment.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),cp=require('node:child_process');
const assert=require('node:assert/strict'),root=path.resolve(__dirname,'..');
const {build,verify}=require('./build-v52-production.cjs');
const files=['001_secure_backend.sql','002_catalog.sql','003_activation.sql','004_fresh_start.sql'];
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
function installation(){
 const bodies=files.map(file=>{
  const sql=fs.readFileSync(path.join(root,'supabase/v51-production',file),'utf8');
  assert.equal((sql.match(/^begin;\s*$/gm)||[]).length,1,'Unexpected transaction boundary: '+file);
  assert.equal((sql.match(/^commit;\s*$/gm)||[]).length,1,'Unexpected transaction boundary: '+file);
  assert.ok(!/^\s*(rollback|savepoint)\b/im.test(sql));
  return `\n-- Source: ${file}; SHA-256 ${sha(sql)}\n`+sql.replace(/^begin;\s*$/m,'').replace(/^commit;\s*$/m,'');
 });
 return '-- OWNER REVIEW REQUIRED. All four files, one INACTIVE installation transaction. No activation.\n'+
 "begin;\nset local app.v51.migration_authorized='yes';\nset local app.v51.authorized_ref='mbdelspbjusarbwlltol';\n"+
 bodies.join('\n')+'\ncommit;\n';
}
function inventory(dir,prefix=''){
 return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>{
  if(e.isSymbolicLink())throw Error('Symlinks forbidden in release');
  const name=prefix+e.name,full=path.join(dir,e.name);
  if(e.isDirectory())return inventory(full,name+'/');
  if(!e.isFile())throw Error('Non-file release entry');
  return [{path:name,sha256:sha(fs.readFileSync(full))}];
 }).sort((a,b)=>a.path.localeCompare(b.path));
}
function prepare(config,out){
 require('../v3/backend-config.js').productionConfig(config);
 if(fs.existsSync(out)&&fs.readdirSync(out).length)throw Error('Release preparation output must be empty');
 fs.mkdirSync(out,{recursive:true});const site=path.join(out,'site');build(config,site);verify(site);
 fs.writeFileSync(path.join(site,'.nojekyll'),'');
 const sql=installation();fs.writeFileSync(path.join(out,'install-inactive.sql'),sql);
 fs.copyFileSync(path.join(root,'docs/V52-RELEASE-VERIFY.sql'),path.join(out,'post-install-checks.sql'));
 const snapshot=fs.readFileSync(path.join(root,'docs/V52-FRESH-START-PREFLIGHT.sql'),'utf8');
 const state=snapshot.match(/with legacy as \(([\s\S]*?)\), permissions as \(/);
 assert.ok(state,'Canonical backup query changed');
 fs.writeFileSync(path.join(out,'restored-legacy-fingerprint.sql'),
 '-- READ ONLY. Owner runs against the already-restored local database; no restoration/testing repeated.\n'+
 '-- Returns only a canonical five-table data fingerprint; keep private. Compare with production preflight.\n'+
 'with legacy as ('+state[1]+")\nselect encode(extensions.digest((select * from legacy)::text,'sha256'),'hex') as legacy_fingerprint;\n");
 const siteFiles=inventory(site);
 for(const f of siteFiles){
  assert.ok(!/(^|\/)(tests|docs|supabase|review|\.git)(\/|$)|\.csv$|\.sql$|\.env|\.dump$|\.ps1$/.test(f.path),'Private/non-site release file');
 }
 const sourceCommit=cp.execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
 const sourceDirty=cp.execFileSync('git',['status','--porcelain'],{cwd:root,encoding:'utf8'}).trim()!=='';
 const manifest={version:'5.2',prepared:true,deployed:false,activated:false,sourceCommit,sourceDirty,
  projectRef:config.projectRef,rollbackTag:'rollback/production-before-v51-0d0b026',
  publishDirectory:'site only; never publish this package root',
  sqlFiles:files.map(file=>({path:'supabase/v51-production/'+file,sha256:sha(fs.readFileSync(path.join(root,'supabase/v51-production',file)))})),
  installationSha256:sha(sql),postInstallChecksSha256:sha(fs.readFileSync(path.join(out,'post-install-checks.sql'))),restoredFingerprintSqlSha256:sha(fs.readFileSync(path.join(out,'restored-legacy-fingerprint.sql'))),siteFiles};
 fs.writeFileSync(path.join(out,'release-manifest.json'),JSON.stringify(manifest,null,2)+'\n');
 return manifest;
}
module.exports={installation,inventory,prepare};
if(require.main===module){prepare(require('./build-v51-production-preparation.cjs').configuration(process.env),path.join(root,'release-preparation-dist'));
 console.log('Prepared inactive installation, canonical snapshot check and hashed site; no SQL, Auth, publishing or Git changes.');}
