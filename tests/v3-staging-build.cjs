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
const invalid={...process.env,V3_STAGING_BUILD_FIXTURE:'1',
  V3_STAGING_PROJECT_REF:'sfogrvedypgtxfvecmbx', V3_STAGING_AUTHORIZED_REF:'sfogrvedypgtxfvecmbx',
  V3_STAGING_URL:'https://sfogrvedypgtxfvecmbx.supabase.co',
  V3_STAGING_ANON_KEY:'sb_publishable_fictional_test_only'};
assert.throws(()=>execFileSync(process.execPath,['scripts/build-v3-staging.cjs'],{cwd:root,env:invalid,stdio:'pipe'}),
  e=>String(e.stderr).includes('Fixture output requires fictional configuration'));
assert.deepEqual(snapshot(real),before);
console.log('PASS staging build isolation: test preparation preserves every deployable byte and rejects non-fictional fixture targets');
