// Static build validation. Reads public browser configuration without printing the key.
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const assert = require('node:assert/strict');
const {config} = require('../v3/cloud-sync.js');
function verify(out, expectedRef) {
  const ctx = {window:{}};
  vm.runInNewContext(fs.readFileSync(path.join(out,'staging-config.js'),'utf8'),ctx,{timeout:1000});
  const c=config(ctx.window.V3StagingConfig);
  assert.equal(c.projectRef,expectedRef,'Unexpected project in build');
  const html=fs.readFileSync(path.join(out,'index.html'),'utf8');
  assert.ok(html.includes('FAMILY MATHS ADVENTURE') && !html.includes('V3 TEST CAMP'));
  assert.ok(html.includes("connect-src 'self' "+c.url));
  assert.ok(!html.includes('src="v3/app.js"'),'Offline demo entry point must be replaced');
  assert.ok(html.includes('id="cloud-lock"') && html.includes('id="cloud-signout"'));
  assert.ok(!fs.existsSync(path.join(out,'review')),'The family build must not contain review screenshots');
  assert.ok(!html.includes('review/index.html'),'The family build must not link to the test gallery');
  const visibleHtml=html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,' ').replace(/<[^>]+>/g,' ');
  assert.doesNotMatch(visibleHtml,/\b(?:staging|fictional|test camp)\b/i,'Family-facing page copy must not mention staging or test accounts');
  for(const [,src] of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
    if(src.startsWith('#')) continue;
    assert.ok(!src.includes('://') && !src.includes('..'),'Only bundled local assets');
    const file=path.join(out,src);
    assert.ok(fs.statSync(file).isFile(),'Missing local asset: '+src);
    if(src.endsWith('.js')) new vm.Script(fs.readFileSync(file,'utf8'),{filename:src});
  }
  const js=fs.readFileSync(path.join(out,'staging-app.js'),'utf8');
  assert.ok(js.includes('Family account sign-in') && js.includes('v3_identity'));
  assert.ok(js.includes('Sign in with your family account. Your account password and game PIN are separate.'));
  assert.ok(js.includes('Family progress'));
  for(const copy of [
    'Staging account sign-in',
    'Use a fictional account from jaxon-maths-v3-staging',
    'Enter your staging email first.',
    'Set your staging PIN',
    'staging reconnects',
    'This staging build requires Web Locks',
    'This staging account is already open',
    'other staging device',
    'waiting for staging sync',
    'Saved to staging',
    'Fictional family only',
    'Staging parent dashboard',
    'Choose a new staging account password',
    'Staging is unavailable',
    'Test Camp remains a separate offline game',
  ]) assert.ok(!js.includes(copy),'Outdated learner or parent copy remains: '+copy);
  assert.ok(js.includes('v3_set_pin') && js.includes('Unlock your '));
  const E=require(path.join(out,'v3/engine.js')).V3Engine;
  const C=require(path.join(out,'v3/curriculum.js')).V3Curriculum;
  assert.equal(E.worlds.length,9);
  assert.equal(C.catalog.length,40);
  console.log('PASS staging build: pinned configuration (key redacted), sign-in/PIN entry, all assets, nine worlds, 40 catalogue items');
}
module.exports={verify};
if(require.main===module) verify(path.resolve(__dirname,'../staging-dist'),'sfogrvedypgtxfvecmbx');
