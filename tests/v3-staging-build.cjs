// Regression: mock preparation cannot overwrite a deployable staging directory.
const fs=require('node:fs'), path=require('node:path'), crypto=require('node:crypto');
const assert=require('node:assert/strict'), {execFileSync}=require('node:child_process');
const {verify}=require('../scripts/verify-v3-staging.cjs');
const root=path.resolve(__dirname,'..');
function snapshot(dir) {
  if(!fs.existsSync(dir)) return null;
  return fs.readdirSync(dir,{recursive:true}).sort().filter(f=>fs.statSync(path.join(dir,f)).isFile())
    .map(f=>[f,crypto.createHash('sha256').update(fs.readFileSync(path.join(dir,f))).digest('hex')]);
}
const real=path.join(root,'staging-dist'), before=snapshot(real);
execFileSync(process.execPath,['tests/prepare-v3.cjs'],{cwd:root,stdio:'pipe'});
assert.deepEqual(snapshot(real),before,'Mock preparation overwrote deployable staging bytes');
verify(path.join(root,'staging-fixture-dist'),'abcdefghijklmnopqrst');
const site=path.join(root,'staging-fixture-dist'),html=fs.readFileSync(path.join(site,'index.html'),'utf8');
assert.ok(html.includes('src="v3/guide-portraits.js"')&&html.includes('href="v3/guide-portraits.css"'));
for(const file of ['painted-forest-preview.js','painted-desert-preview.js','guide-portraits-preview.js','assets/painted-forest-preview','assets/fraction-desert-preview'])
 assert.ok(!fs.existsSync(path.join(site,'v3',file)),'No preview experiment in live build: '+file);
for(const asset of JSON.parse(fs.readFileSync('v3/assets/world-guide-portraits-preview/manifest.json')).assets)
 assert.ok(fs.readFileSync(path.join(site,'v3/assets/world-guide-portraits-preview',asset.file)).equals(fs.readFileSync(path.join('v3/assets/world-guide-portraits-preview',asset.file))));

const invalid={...process.env,V3_STAGING_BUILD_FIXTURE:'1',
  V3_STAGING_PROJECT_REF:'zzzzzzzzzzzzzzzzzzzz', V3_STAGING_AUTHORIZED_REF:'zzzzzzzzzzzzzzzzzzzz',
  V3_STAGING_URL:'https://zzzzzzzzzzzzzzzzzzzz.supabase.co',
  V3_STAGING_ANON_KEY:'sb_publishable_fictional_test_only'};
assert.throws(()=>execFileSync(process.execPath,['scripts/build-v3-staging.cjs'],{cwd:root,env:invalid,stdio:'pipe'}),
  e=>String(e.stderr).includes('Fixture output requires fictional configuration'));
assert.deepEqual(snapshot(real),before);
console.log('PASS staging build isolation: test preparation preserves every deployable byte and rejects non-fictional fixture targets');
