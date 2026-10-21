// Build only: never connects to Supabase, applies SQL, authenticates or publishes.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {config}=require('../v3/cloud-sync.js');
const Preserve=require('../v3/staging-preserve.js');
const root=path.resolve(__dirname,'..');
function once(s,a,b){assert.equal(s.split(a).length,2,'Staging source changed: '+a.slice(0,60));return s.replace(a,b);}
function entry(){
 let s=fs.readFileSync(path.join(root,'v3/staging-app.js'),'utf8');
 s='import Preserve from "./staging-preserve.js";\nlet preserveVerified=false;\n'+s;
 s=once(s,'  if (!active()) throw Error("Unlock your account to continue");',
  '  if (!preserveVerified) throw Error("Reconnect to verify the preservation staging release. Queues are retained.");\n  if (!active()) throw Error("Unlock your account to continue");');
 s=once(s,'    if (check.error) {\n      if (\n        navigator.onLine ||\n        sessionStorage.getItem(verifiedKey) !== c.projectRef\n      )\n        throw Error("Staging identity was not verified. Sign-in is disabled.");',
  '    if (check.error) {\n      throw Error("Reconnect to verify the staging upgrade. Existing queues and drafts are retained.");');
 s=once(s,'    } else {\n      if (\n        check.data?.name',
  '    } else {\n      Preserve.verify(c,check.data);\n      preserveVerified=true;\n      if (\n        check.data?.name');
 s=once(s,'    if (err.code && err.code !== "PGRST000") localStorage.removeItem(key);',
  '    if (!Preserve.retainIntent(err)) localStorage.removeItem(key);');
 s=once(s,`    intent.op !== op ||
    JSON.stringify({ ...intent.payload, requestId: undefined }) !==
      JSON.stringify({ ...payload, requestId: undefined })`,
  '    !Preserve.matchesIntent(intent,op,payload)');
 s=once(s,'  localStorage.setItem(key, JSON.stringify(intent));',
  '  if (!raw) localStorage.setItem(key, JSON.stringify(intent));');
 s=s.replace('Server rejections are final; transport failures preserve the exact intent for retry.',
  'Preserve all pre-upgrade intents, including validation rejections; no silent clearing or new ID.');
 s=s.replace('Not synced. Your changes remain on this device; reconnect and unlock to retry.',
  'Not synced. Drafts and the original request are retained. Reconnect to retry; a validation rejection needs private review.');
 s=s.replace('Redeemed screen time · already used','Redeemed screen time · cumulative staging history');
 return s;
}
function build(input,out){
 const c=config(input);
 assert.equal(c.projectRef,Preserve.projectRef,'Only the existing fictional staging project is allowed');
 assert.equal(c.url,`https://${Preserve.projectRef}.supabase.co`);
 assert.ok(!fs.existsSync(out)||fs.readdirSync(out).length===0,'Output must be empty; never clear an existing artifact');
 fs.mkdirSync(out,{recursive:true});
 for(const f of ['v3','icon.svg','v2-review-bank.js','v2-guided-teaching.js','v2-maths-tools.js','v2-extra-tools.js'])
  fs.cpSync(path.join(root,f),path.join(out,f),{recursive:true,
   filter:src=>!['production-cloud.js','backend-config.js'].includes(path.basename(src))});
 let html=fs.readFileSync(path.join(root,'v3-adventure.html'),'utf8');
 html=html.replace("connect-src 'none'",`connect-src 'self' ${c.url}`)
 .replaceAll('V3 Test Camp','V5.2 Preservation Staging').replaceAll('V5 Interactive Test Camp','V5.2 Preservation Staging')
 .replace('V3 TEST CAMP','V5.2 STAGING').replace('Offline demo · fictional explorer · saved only on this device','Existing fictional families · preservation staging')
 .replace('href="v3-adventure.html"','href="index.html"')
 .replace(/<button data-nav="parent">Demo parent summary<\/button\s*>/,'<button id="cloud-lock">Lock account</button><button id="cloud-signout">Sign out</button>')
 .replace('No cloud connection in Test Camp.','Private preservation staging only.')
 .replace('<script src="v3/app.js"></script>','<script src="staging-config.js"></script><script src="v3/cloud-sync.js"></script><script src="staging-app.js"></script>');
 fs.writeFileSync(path.join(out,'index.html'),html);
 fs.writeFileSync(path.join(out,'.nojekyll'),'');
 fs.writeFileSync(path.join(out,'staging-config.js'),'window.V3StagingConfig = '+JSON.stringify(c)+';\n');
 // Bundle transformed entry in memory; source and the existing staging/production builders stay unchanged.
 require('esbuild').buildSync({stdin:{contents:entry(),resolveDir:path.join(root,'v3'),loader:'js'},outfile:path.join(out,'staging-app.js'),bundle:true,format:'iife',minify:true});
 return c;
}
function environment(){return {environment:'staging',projectName:'jaxon-maths-v3-staging',projectRef:process.env.V3_STAGING_PROJECT_REF,
 authorizedRef:process.env.V3_STAGING_AUTHORIZED_REF,url:process.env.V3_STAGING_URL,anonKey:process.env.V3_STAGING_ANON_KEY};}
module.exports={build,entry,environment};
if(require.main===module){build(environment(),path.join(root,'v52-staging-dist'));console.log('Prepared unpublished v52-staging-dist; no network or deployment.');}
