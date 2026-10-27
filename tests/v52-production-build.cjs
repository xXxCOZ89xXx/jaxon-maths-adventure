const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),assert=require('node:assert/strict');
const {build,verify}=require('../scripts/build-v52-production.cjs'),B=require('../v3/backend-config.js');
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'v52-production-build-'));
const config={...B.production,authorizedRef:B.production.projectRef,url:`https://${B.production.projectRef}.supabase.co`,anonKey:'sb_publishable_'+'a'.repeat(24)};
try {
 assert.throws(()=>build({...config,anonKey:'sb_secret_never_ship'},dir));assert.deepEqual(fs.readdirSync(dir),[]);
 build({...config,serviceRoleKey:'PRIVATE_MARKER'},dir);verify(dir);
 assert.throws(()=>build(config,dir),/empty/);
 const html=fs.readFileSync(path.join(dir,'index.html'),'utf8');
 const js=fs.readFileSync(path.join(dir,'production-app.js'),'utf8');
 assert.ok(!html.includes('staging-config.js')&&!html.includes('review/'));
 assert.ok(html.includes('src="v3/guide-portraits.js"')&&html.includes('href="v3/guide-portraits.css"'));
 for(const file of ['painted-forest-preview.js','painted-desert-preview.js','guide-portraits-preview.js','assets/painted-forest-preview','assets/fraction-desert-preview'])
   assert.ok(!fs.existsSync(path.join(dir,'v3',file)), 'No development art in production: '+file);
 const portraits=JSON.parse(fs.readFileSync('v3/assets/world-guide-portraits-preview/manifest.json'));
 for(const asset of portraits.assets)assert.ok(fs.readFileSync(path.join(dir,'v3/assets/world-guide-portraits-preview',asset.file)).equals(fs.readFileSync(path.join('v3/assets/world-guide-portraits-preview',asset.file))));
 assert.ok(js.includes('contractVersion')&&js.includes('Historical redeemed time'));
  for(const old of ['v2-game-test.html','v2-secure-preview.html','secure-access-test.html','v3-adventure.html','town-interactions-preview.html','world-interactions-preview.html']) {
    const redirect=fs.readFileSync(path.join(dir,old),'utf8');
    assert.ok(redirect.includes('0;url=./')&&!redirect.includes('supabase.co'));
  }
 assert.ok(!fs.readFileSync(path.join(dir,'production-config.js'),'utf8').includes('PRIVATE_MARKER'));
 for(const f of ['engine.js','app.js','hands-on.js','journey.js','adaptive.js','style.css'])
 assert.ok(fs.readFileSync(path.join(dir,'v3',f)).equals(fs.readFileSync(path.join('v3',f))));
 for(const p of ['tests','supabase','.git','.env','review'])assert.ok(!fs.existsSync(path.join(dir,p)));
 console.log('PASS production build: strict public configuration, CSP/assets, nine worlds/55 skills, unchanged gameplay bytes, separate output and no tests/SQL/private files.');
}finally{fs.rmSync(dir,{recursive:true,force:true});}
