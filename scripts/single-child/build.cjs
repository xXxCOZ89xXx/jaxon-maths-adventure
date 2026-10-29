// Isolated account review build only; never modifies production output/configuration.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const staging=process.argv.includes('--staging');
const cfg=staging?require('../../server/single-child-server.cjs').publicConfiguration(process.env):JSON.parse(fs.readFileSync('work/single-child-integration/local-private.json'));
if(!staging){assert.equal(cfg.origin,'https://127.0.0.1:4443');assert.equal(cfg.localOnly,true);}
const out='single-child-dist';fs.mkdirSync(out,{recursive:true});
for(const f of ['v3','icon.svg','v2-review-bank.js','v2-guided-teaching.js','v2-maths-tools.js','v2-extra-tools.js'])fs.cpSync(f,path.join(out,f),{recursive:true});
let html=fs.readFileSync('v3-adventure.html','utf8').replace("connect-src 'none'","connect-src 'self'").replace('<script src="v3/app.js"></script>','<script src="family-config.js"></script><script src="v3/cloud-sync.js"></script><script src="family-app.js"></script>').replace('<button data-nav="parent">Demo parent summary</button','<button id="cloud-lock">Lock account</button><button id="cloud-signout">Sign out</button><a href="/?setup=parent">Parent setup</a').replaceAll('Offline demo · fictional explorer · saved only on this device','Supabase account review · fictional accounts only').replace('No cloud connection in Test Camp.','Connected review saves · fictional accounts only.').replaceAll('href=\"v3-adventure.html\"','href=\"/\"');
fs.writeFileSync(out+'/index.html',html);fs.writeFileSync(out+'/family-config.js','window.V13FamilyConfig='+JSON.stringify({kind:'single-child-review',url:cfg.origin+'/supabase',anonKey:cfg.anonKey,projectName:'jaxon-maths-v3-staging',projectRef:cfg.projectRef||require('../../v3/staging-policy.js').localRef})+';');
let source=fs.readFileSync('v3/staging-app.js','utf8');
const once=(a,b)=>{assert.equal(source.split(a).length,2,a.slice(0,65));source=source.replace(a,b);};
source='import Family from "./family-connected.js";\n'+source;
once('window.V3CloudSync.config(window.V3StagingConfig)','Family.config(window.V13FamilyConfig)');
once('client = createClient(c.url, c.anonKey, {','client = Family.client(createClient, c.url, c.anonKey, {');
once('    const code = new URL(location.href).searchParams.get("code");','    if (await Family.start(client, {authForm,pinScreen,open,panel,message})) return;\n    const code = new URL(location.href).searchParams.get("code");');
once('  if (!set) {','  if (!set && !client.isDevice) {');
once('${set ? \"\" : button(\"Reset PIN with account password\", \"reset-pin\")}','${set || client.isDevice ? \"\" : button(\"Reset PIN with account password\", \"reset-pin\")}');
source=source.replace('Account recovery requires your account password.','${client.isDevice ? "Ask your parent to reset a forgotten learner PIN. No child email is needed." : "Account recovery requires your account password."}');
once('  document.querySelector(\"nav\").hidden = false;\n  if (!runningGame)', '  document.querySelector(\"header\").hidden = false;\n  document.querySelector(\"nav\").hidden = false;\n  message(\"Connected. Your saved adventure is ready.\");\n  if (!runningGame)');
source=source.replaceAll('Set your staging PIN','Set your game PIN').replaceAll('Staging parent dashboard','Parent dashboard').replaceAll('Saved to staging ·','Saved to cloud ·').replaceAll('waiting for staging sync','waiting for cloud sync');
require('esbuild').buildSync({stdin:{contents:source,resolveDir:path.resolve('v3'),sourcefile:'family-app.js'},outfile:out+'/family-app.js',bundle:true,format:'iife'});
if(cfg.serviceKey)assert.ok(!fs.readFileSync(out+'/family-config.js','utf8').includes(cfg.serviceKey));console.log('Built isolated local Supabase account game; no service credential in browser output.');
