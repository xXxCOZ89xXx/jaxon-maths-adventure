// Run real builders with fictional configuration only. No hosted services.
require('node:child_process').execFileSync(process.execPath,['tests/prepare-v3.cjs'],{stdio:'inherit'});
// The existing demo inventory uses URL paths; normalize Windows separators only
// inside this build/check process, without changing production build sources.
const path=require('node:path'),relative=path.relative;
try{path.relative=(...args)=>relative(...args).split(path.sep).join('/');require('../demo/build.cjs');require('../demo/check.cjs');}
finally{path.relative=relative;}
