'use strict';
// Independent static build: never invoke staging/production builds or read env vars.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),out=path.join(root,'demo-dist');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const hash=x=>crypto.createHash('sha256').update(x).digest('hex');
const KEY='jaxon_public_demo_v1';
let html=read('v3-adventure.html');
const scripts=[...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(x=>x[1]);
const styles=[...html.matchAll(/<link rel="stylesheet" href="([^"]+)"\s*\/>/g)].map(x=>x[1]);
const audited=JSON.parse(read('demo/dependencies.json'));
for(const item of audited.source)assert.equal(hash(fs.readFileSync(path.join(root,item.path))),item.sha256,'Re-audit changed dependency: '+item.path);
assert.deepEqual([...scripts,...styles,'v3-adventure.html','icon.svg'],audited.source.map(x=>x.path));
const inventory=[];
fs.rmSync(out,{recursive:true,force:true});fs.mkdirSync(out,{recursive:true});
function emit(file,content){const dest=path.join(out,file);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest,content);inventory.push({path:file,bytes:Buffer.byteLength(content),sha256:hash(content)});}
function replaceOnce(s,from,to){assert.equal(s.split(from).length,2,'Source changed: '+from.slice(0,80));return s.replace(from,to);}
for(const file of scripts){
  assert(!/cloud|staging|backend|production/i.test(file),file);
  let js=read(file);
  assert(!/\b(?:fetch|XMLHttpRequest|WebSocket|EventSource|sendBeacon|importScripts)\s*\(|serviceWorker|\bimport\s*\(/.test(js),'Network API in '+file);
  if(file==='v3/app.js'){
    js=replaceOnce(js,'const cloud = window.V3CloudContext;','const cloud = undefined; // Public demo has no cloud adapter.');
    js=replaceOnce(js,'cloud?.key || "jaxon_v3_fictional_demo_2026"',JSON.stringify(KEY));
    const start=js.indexOf('  function parent() {'),end=js.indexOf('  function tour() {',start);assert(start>0&&end>start);js=js.slice(0,start)+js.slice(end);
    js=replaceOnce(js,'      parent,\n','');
    js=replaceOnce(js,'    if(!P.complete(s)&&P.views.includes(s.view))',"    if(s.view==='parent')s.view='home';\n    if(!P.complete(s)&&P.views.includes(s.view))");
    js=replaceOnce(js,'    const [name, arg] = action.split(":");','    const [name, arg] = action.split(":");\n    if(name === "nav" && arg === "parent") return;');
    js=replaceOnce(js,'This build has no cloud adapter or live account login. It uses its own device storage. Existing V2 progress is never read or changed. Cloud sync and secure parent rewards must be tested separately in staging.','Your fictional explorer is saved only in this browser. No account is needed. Nothing here is connected to Jaxon’s game.');
    js=js.replace(/^  if\(!cloud&&document.getElementById\("touch-review"\)\).*$/m,'');
  }
  emit(file,js);
}
for(const file of styles){assert(!/@import|url\s*\(/i.test(read(file)),'Unreviewed CSS dependency');emit(file,read(file));}
// All dynamic image families used by asset-checkpoint, world-art, avatar-art and guides.
for(const dir of ['checkpoint','rollout','world-guide-portraits-preview']){
 const base='v3/assets/'+dir,manifest=JSON.parse(read(base+'/manifest.json'));
 const files=Array.isArray(manifest.assets)?manifest.assets.map(a=>a.file):Object.keys(manifest.assets).map(n=>n+'.webp');
 for(const name of files){assert(/^[a-z0-9-]+\.webp$/.test(name));emit(base+'/'+name,fs.readFileSync(path.join(root,base,name)));}
}
emit('icon.svg',read('icon.svg'));
html=replaceOnce(html,'<title>Jaxon\'s Maths Adventure · V5 Interactive Test Camp</title>',"<title>Jaxon’s Maths Adventure · Public Demo</title>");
html=html.replace(/<div class="demo-strip">[\s\S]*?<\/div>/,'<div class="demo-strip" role="note">PUBLIC DEMO<span>Demo only — progress is saved on this device and is not connected to Jaxon’s game</span></div>');
html=replaceOnce(html,'href="v3-adventure.html"','href="/"');
html=html.replace(/      <button data-nav="parent">[\s\S]*?<div id="touch-review"[^>]*><\/div>/,'      <span>Fictional explorer · no account needed.</span>');
const csp="default-src 'none'; connect-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'; worker-src 'none'; frame-src 'none'; media-src 'none'; manifest-src 'none'";
html=html.replace(/content="default-src[^\"]+"/,`content="${csp}"`);
emit('index.html',html);
// Prevent Pages SPA fallback from presenting a private-looking route as a game page.
emit('404.html','<!doctype html><html lang="en"><meta charset="utf-8"><title>Demo page not found</title><h1>Demo page not found</h1><a href="/">Return to the public demo</a></html>');
emit('_headers',`/*\n  Content-Security-Policy: ${csp}; frame-ancestors 'none'\n  Referrer-Policy: no-referrer\n  X-Content-Type-Options: nosniff\n  X-Frame-Options: DENY\n  Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()\n  Cache-Control: no-cache\n`);
assert.deepEqual(inventory.filter(f=>f.path.endsWith('.webp')),audited.images,'Re-audit changed image dependencies');
fs.mkdirSync(path.join(root,'work/public-demo'),{recursive:true});
fs.writeFileSync(path.join(root,'work/public-demo/build-inventory.json'),JSON.stringify({entry:'v3-adventure.html',storageKey:KEY,scripts,styles,files:inventory},null,2)+'\n');
console.log(`Public demo: ${scripts.length} scripts, ${styles.length} styles, ${inventory.length} files. Output: demo-dist. No environment/config/SDK/backend files copied.`);
module.exports={KEY};
