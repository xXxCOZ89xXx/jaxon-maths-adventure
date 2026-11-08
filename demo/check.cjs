'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),dir=path.join(root,'demo-dist');
const inv=JSON.parse(fs.readFileSync(path.join(root,'work/public-demo/build-inventory.json')));
const walk=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(d,e.name)):[path.relative(dir,path.join(d,e.name))]);
assert.deepEqual(walk(dir).sort(),inv.files.map(f=>f.path).sort());
const html=fs.readFileSync(path.join(dir,'index.html'),'utf8'),app=fs.readFileSync(path.join(dir,'v3/app.js'),'utf8');
assert(html.includes('Demo only — progress is saved on this device and is not connected to Jaxon’s game'));
assert(!/data-nav="parent"|touch-review|dev\//.test(html));
assert(!/function parent\(|Demo parent summary|href="dev\//.test(app));
assert(!app.includes('window.V3CloudContext'));assert(app.includes('"jaxon_public_demo_v1"'));
for(const f of inv.files){
 const data=fs.readFileSync(path.join(dir,f.path));assert.equal(crypto.createHash('sha256').update(data).digest('hex'),f.sha256);
 assert(!/(?:cloud|staging|backend|production|supabase|\.env|manifest\.webmanifest|_worker|_redirects)/i.test(f.path),f.path);
 if(!/\.(js|css|html|svg)$/.test(f.path))continue;const text=data.toString();
 assert(!/supabase\.(co|com)|eyJ[A-Za-z0-9_-]{20,}|sb_(publishable|secret)_|service_role|anonKey|child_user_id|parent_user_id/i.test(text),'Backend identity/config in '+f.path);
 assert(!/\bfetch\s*\(|\bXMLHttpRequest\b|\bWebSocket\b|\bEventSource\b|sendBeacon|serviceWorker|window\.open\s*\(|location\.(?:href|assign|replace)|\bimport\s*\(/.test(text),'Network/navigation API in '+f.path);
}
const csp=fs.readFileSync(path.join(dir,'_headers'),'utf8');for(const policy of ["connect-src 'none'","worker-src 'none'","frame-src 'none'","form-action 'none'","frame-ancestors 'none'"])assert(csp.includes(policy));
assert(html.includes("connect-src 'none'"));
console.log('PASS exact publish allowlist, SHA256 inventory, no credentials/backend/parent entry points, network APIs or outbound navigation, restrictive CSP.');
