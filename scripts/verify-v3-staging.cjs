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
  assert.ok(html.includes('V3 STAGING') && !html.includes('V3 TEST CAMP'));
  assert.ok(html.includes("connect-src 'self' "+c.url));
  assert.ok(!html.includes('src="v3/app.js"'),'Offline demo entry point must be replaced');
  assert.ok(html.includes('id="cloud-lock"') && html.includes('id="cloud-signout"'));
  for(const [,src] of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
    if(src.startsWith('#')) continue;
    assert.ok(!src.includes('://') && !src.includes('..'),'Only bundled local assets');
    const file=path.join(out,src);
    assert.ok(fs.statSync(file).isFile(),'Missing local asset: '+src);
    if(src.endsWith('.js')) new vm.Script(fs.readFileSync(file,'utf8'),{filename:src});
  }
  const js=fs.readFileSync(path.join(out,'staging-app.js'),'utf8');
  assert.ok(js.includes('Staging account sign-in') && js.includes('v3_identity'));
  assert.ok(js.includes('v3_set_pin') && js.includes('Unlock your '));
  const E=require(path.join(out,'v3/engine.js')).V3Engine;
  const C=require(path.join(out,'v3/curriculum.js')).V3Curriculum;
  assert.equal(E.worlds.length,9);
  assert.equal(C.catalog.length,40);
  console.log('PASS staging build: pinned configuration (key redacted), sign-in/PIN entry, all assets, nine worlds, 40 catalogue items');
}
module.exports={verify};
if(require.main===module) verify(path.resolve(__dirname,'../staging-dist'),'sfogrvedypgtxfvecmbx');
