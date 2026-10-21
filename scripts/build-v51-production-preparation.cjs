// Offline modules-only packaging. This is deliberately NOT a deployable game build.
const fs = require('node:fs'), path = require('node:path');
const B = require('../v3/backend-config.js');
function configuration(env) {
  return B.productionConfig({ ...B.production,
    projectRef: env.V51_PRODUCTION_PROJECT_REF,
    authorizedRef: env.V51_PRODUCTION_AUTHORIZED_REF,
    url: env.V51_PRODUCTION_URL, anonKey: env.V51_PRODUCTION_ANON_KEY });
}
function build(out) {
  fs.mkdirSync(out, { recursive: true });
  if (fs.readdirSync(out).length) throw Error('Preparation output must be empty');
  require('esbuild').buildSync({ entryPoints: [path.join(__dirname, '../v3/production-cloud.js')],
    outfile: path.join(out, 'backend.js'), bundle: true, platform: 'browser', format: 'iife',
    globalName: 'V51ProductionCloud' });
  fs.writeFileSync(path.join(out, 'backend-contract.json'), JSON.stringify({ ...B.production,
    artifact: 'modules-only', deployable: false,
    blocked: ['metadata review', 'PIN transition', 'wallet reconciliation', 'backend migration', 'UI integration'],
  }, null, 2) + '\n');
  if (fs.existsSync(path.join(out, 'index.html'))) throw Error('Unexpected deployable entry point');
}
module.exports = { configuration, build };
if (require.main === module) {
  if (process.argv[2] === '--check-config') {
    configuration(process.env);
    console.log('PASS pinned production public configuration (key not printed; no connection)');
  } else {
    build(path.join(__dirname, '../production-preparation-dist'));
    console.log('Built modules-only production preparation; no deployable game, config credentials or database connection.');
  }
}
