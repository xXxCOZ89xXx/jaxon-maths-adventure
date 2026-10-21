// Build-only. Shares the existing connected UI/game; no deployment, SQL or Auth calls.
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const { configuration } = require('./build-v51-production-preparation.cjs');
const root = path.resolve(__dirname, '..');
function once(source, before, after) {
  assert.equal(source.split(before).length, 2, 'Connected source contract changed: ' + before.slice(0,55));
  return source.replace(before, after);
}
function entry() {
  let s = fs.readFileSync(path.join(root, 'v3/staging-app.js'), 'utf8');
  s = 'import Backend from "./backend-config.js";\nlet productionEpoch="initial";\n' + s;
  s = once(s, 'window.V3CloudSync.config(window.V3StagingConfig)', 'Backend.productionConfig(window.V51ProductionConfig)');
  s = once(s, '"jaxon_v3_staging_auth:" + c.projectRef', 'Backend.namespace(c, "auth")');
  s = once(s, '    } else {\n      if (\n        check.data?.name', '    } else {\n      Backend.verifyIdentity(c, check.data);\n      productionEpoch=Backend.activationEpoch(check.data);\n      if (\n        check.data?.name');
  s = once(s, '    if (check.error) {\n      if (\n        navigator.onLine ||\n        sessionStorage.getItem(verifiedKey) !== c.projectRef\n      )\n        throw Error("Staging identity was not verified. Sign-in is disabled.");',
    '    if (check.error) {\n      throw Error("Reconnect to verify the active family release before opening saved progress.");');
  s = once(s, 'const key = `jaxon_v3_staging:${c.projectRef}:${identity.user}:game`,',
    'const key = `jaxon_v51_production:${c.projectRef}:${productionEpoch}:${identity.user}:game`,');
  s = s.replaceAll('"v3-unlock:" + c.projectRef', '"v3-unlock:" + c.projectRef + ":" + productionEpoch')
    .replaceAll('`v3-last-remote:${c.projectRef}:${identity.user}`','`v3-last-remote:${c.projectRef}:${productionEpoch}:${identity.user}`')
    .replaceAll('`v3-intent:${c.projectRef}:${identity.user}`','`v52-production-intent:${c.projectRef}:${productionEpoch}:${identity.user}`');
  s = once(s, 'Use a fictional account from jaxon-maths-v3-staging. Your game account and PIN are separate.',
    'Sign in with your existing family account. Your account password and game PIN are separate.');
  s = once(s, 'set ? "Set your staging PIN"', 'set ? "Enroll your game PIN after password sign-in"');
  s = once(s, '    `<p>${len} digits.', '    `<p>Existing device PIN data is preserved. For first server enrollment you may enter the same known digits; it is not copied automatically.</p><p>${len} digits.');
  s = once(s, 'Test Camp remains a separate offline game. No production fallback is available.',
    'Your accounts and saved records have not been reset. Retry when the family service is available.');
  s = s.replaceAll('jaxon_v3_staging_auth:', 'jaxon_v51_production_auth:')
    .replaceAll('jaxon_v3_staging:', 'jaxon_v51_production:')
    .replaceAll('v3-unlock:', 'v52-production-unlock:')
    .replaceAll('v3-verified:', 'v52-production-verified:')
    .replaceAll('v3-last-remote:', 'v52-production-last-remote:')
    .replaceAll('Fictional family only', 'Family progress')
    .replaceAll('Staging', 'Family service').replaceAll('staging', 'family service');
  s = s.replaceAll('Number(wallet.active_seconds) / 60', '(Number(wallet.active_seconds) + Number(wallet.opening_seconds || 0)) / 60');
  s = s.replaceAll('Number(remote.wallet.active_seconds) / 60 - Number(remote.wallet.redeemed)',
    '(Number(remote.wallet.active_seconds) + Number(remote.wallet.opening_seconds || 0)) / 60 - Number(remote.wallet.redeemed)');
  s = once(s, 'Redeemed screen time · already used', 'Redeemed since this release · already used');
  s = once(s, '<p class="form-note">Server-credited active time:',
    '<p class="form-note">Historical redeemed time: ${P.minutes(remote.wallet.legacy_redeemed || 0)} minutes. Reviewed opening entitlement: ${P.minutes(Number(remote.wallet.opening_seconds || 0) / 60)} minutes.</p><p class="form-note">Server-credited active time:');
  return s;
}
function build(config, out) {
  const c = require('../v3/backend-config.js').productionConfig(config);
  if (fs.existsSync(out) && fs.readdirSync(out).length) throw Error('Production output must be empty');
  fs.mkdirSync(out, { recursive: true });
  for (const file of ['v3','icon.svg','v2-review-bank.js','v2-guided-teaching.js','v2-maths-tools.js','v2-extra-tools.js'])
    fs.cpSync(path.join(root,file),path.join(out,file),{recursive:true});
  let html = fs.readFileSync(path.join(root,'v3-adventure.html'),'utf8');
  html = once(html,"connect-src 'none'",`connect-src 'self' ${c.url}`);
  html = html.replaceAll('V5 Interactive Test Camp','V5.2 Maths Adventure').replaceAll('V3 TEST CAMP','V5.2 FAMILY ADVENTURE')
    .replaceAll('Offline demo · fictional explorer · saved only on this device','Family account required · secure cloud saves')
    .replaceAll('No cloud connection in Test Camp.','Family account · 60-minute weekly goal · screen time 1:1')
    .replaceAll('href="v3-adventure.html"','href="index.html"');
  html = html.replace(/<button data-nav="parent">Demo parent summary<\/button\s*>/,
    '<button id="cloud-lock">Lock account</button><button id="cloud-signout">Sign out</button>');
  html = once(html,'<script src="v3/app.js"></script>',
    '<script src="production-config.js"></script><script src="v3/cloud-sync.js"></script><script src="production-app.js"></script>');
  fs.writeFileSync(path.join(out,'index.html'),html);
  // Future deployment retires stale writers/bookmarks; original repository pages stay intact.
  const redirect='<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src \'none\'; base-uri \'none\'; form-action \'none\'"><meta http-equiv="refresh" content="0;url=./"><title>Jaxon’s Maths Adventure has moved</title><p><a href="./">Open Jaxon’s Maths Adventure</a></p></html>\n';
  for(const old of ['v2-game-test.html','v2-secure-preview.html','secure-access-test.html'])
    fs.writeFileSync(path.join(out,old),redirect);
  fs.writeFileSync(path.join(out,'production-config.js'),'window.V51ProductionConfig = '+JSON.stringify(c)+';\n');
  require('esbuild').buildSync({ stdin: { contents: entry(), resolveDir:path.join(root,'v3'),sourcefile:'production-app.js' },
    outfile:path.join(out,'production-app.js'),bundle:true,format:'iife',minify:true });
  fs.writeFileSync(path.join(out,'release.json'),JSON.stringify({version:'5.2',environment:c.environment,projectRef:c.projectRef,
    contractVersion:c.contractVersion,requiresReviewedBackend:true, deployed:false},null,2)+'\n');
  verify(out);
}
function verify(out) {
  const vm = require('node:vm'), ctx={window:{}};
  vm.runInNewContext(fs.readFileSync(path.join(out,'production-config.js'),'utf8'),ctx);
  const c=require('../v3/backend-config.js').productionConfig(ctx.window.V51ProductionConfig);
  const html=fs.readFileSync(path.join(out,'index.html'),'utf8');
  assert.ok(html.includes(`connect-src 'self' ${c.url}`));
  assert.ok(!html.includes('src="v3/app.js"') && !html.includes('Demo parent summary'));
  assert.ok(html.includes('id="cloud-lock"') && html.includes('id="cloud-signout"'));
  for(const [,src] of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
    if(src.startsWith('#'))continue;
    assert.ok(!src.includes('://')&&!src.includes('..'));
    assert.ok(fs.statSync(path.join(out,src)).isFile());
  }
  assert.equal(require('../v3/engine.js').V3Engine.worlds.length,9);
  const C=structuredClone(require('../v3/curriculum.js').V3Curriculum);
  require('../v3/town.js').V3Town.install(C,{supportedSkills:[]});
  assert.equal(C.skills.length,55);
  new vm.Script(fs.readFileSync(path.join(out,'production-app.js'),'utf8'));
  assert.ok(!fs.existsSync(path.join(out,'review')));
}
module.exports={build,verify,entry};
if(require.main===module){
  build(configuration(process.env),path.join(root,'production-dist'));
  console.log('PASS production build and assets, nine worlds/55 skills; no SQL, Auth or deployment performed.');
}
