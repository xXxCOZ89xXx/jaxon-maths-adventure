// Offline preparation only. SQL is copied/hashed as text; no SQL client/network/Git writes.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {build,environment}=require('./build-v52-staging.cjs');
const root=path.resolve(__dirname,'..'),out=path.join(root,'v52-staging-package');
if(fs.existsSync(out)&&fs.readdirSync(out).length)throw Error('Package output must be empty; keep previous sealed artifacts');
fs.mkdirSync(out,{recursive:true});
const config=build(environment(),path.join(out,'site'));
fs.cpSync(path.join(root,'supabase/v52-staging-preserve'),path.join(out,'sql'),{recursive:true});
const files={};
function walk(dir){for(const ent of fs.readdirSync(dir,{withFileTypes:true})){const f=path.join(dir,ent.name);if(ent.isDirectory())walk(f);else files[path.relative(out,f).split(path.sep).join('/')]=crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');}}
walk(out);
const sourceFiles={};
for(const dir of ['v3','supabase/v52-staging-preserve']){
 function sourceWalk(d){for(const e of fs.readdirSync(d,{withFileTypes:true})){const f=path.join(d,e.name);if(e.isDirectory())sourceWalk(f);else sourceFiles[path.relative(root,f).split(path.sep).join('/')]=crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');}}
 sourceWalk(path.join(root,dir));
}
for(const file of ['scripts/build-v52-staging.cjs','scripts/prepare-v52-staging.cjs','package.json','package-lock.json','v3-adventure.html','icon.svg','v2-review-bank.js','v2-guided-teaching.js','v2-maths-tools.js','v2-extra-tools.js'])
 sourceFiles[file]=crypto.createHash('sha256').update(fs.readFileSync(path.join(root,file))).digest('hex');
const sourceCommit=process.env.V52_STAGING_SOURCE_COMMIT||null;
if(sourceCommit!==null&&!/^[0-9a-f]{40}$/.test(sourceCommit))throw Error('Use the exact reviewed source commit SHA');
fs.writeFileSync(path.join(out,'manifest.json'),JSON.stringify({kind:'v52-staging-preserve',projectRef:config.projectRef,stagingUpgradeVersion:2,
 applied:false,published:false,sourceCommit,files,sourceFiles},null,2)+'\n');
console.log('Prepared hashed v52-staging-package. SQL and site are separate; nothing executed or published.');
