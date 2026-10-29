// No remote requests. These are forbidden targets, even with matching markers/keys.
const assert=require('node:assert/strict'),fs=require('node:fs'),{execFileSync}=require('node:child_process');
const P=require('../v3/staging-policy.js'),Sync=require('../v3/cloud-sync.js'),Server=require('../server/single-child-server.cjs');
const ref='zzzzzzzzzzzzzzzzzzzz',origin='https://review.fictional.invalid';
const pub=r=>({V13_STAGING_PROJECT_REF:r,V13_AUTHORIZED_STAGING_REF:r,V13_STAGING_URL:`https://${r}.supabase.co`,V13_REVIEW_ORIGIN:origin,V13_STAGING_ANON_KEY:'sb_publishable_'+'a'.repeat(24)});
for(const bad of [P.mainRef,P.deletedRef]){
 assert.throws(()=>P.assertRef(bad,{allowLocal:true}));assert.throws(()=>P.assertEndpoint(`https://${bad}.supabase.co/rest/v1`,{allowLocal:true}));
 assert.throws(()=>Sync.config({environment:'staging',projectName:'jaxon-maths-v3-staging',projectRef:bad,authorizedRef:bad,url:`https://${bad}.supabase.co`,anonKey:'sb_publishable_'+'a'.repeat(24)}));
 assert.throws(()=>Server.publicConfiguration(pub(bad)));assert.throws(()=>Server.configuration(pub(bad)));assert.throws(()=>Server.createServer({origin,authUrl:`https://${bad}.supabase.co/auth/v1`,restUrl:`https://${bad}.supabase.co/rest/v1`,localOnly:true}));
 // Audit fails during config validation, before it could invoke curl.
 assert.throws(()=>execFileSync(process.execPath,['-e',`const cp=require('child_process');cp.execFileSync=()=>{throw Error('NETWORK_ATTEMPT');};require('./scripts/check-v3-staging.cjs');`],{env:{...process.env,V3_STAGING_PROJECT_REF:bad,V3_STAGING_AUTHORIZED_REF:bad,V3_STAGING_URL:`https://${bad}.supabase.co`,V3_STAGING_ANON_KEY:'sb_publishable_'+'a'.repeat(24)},stdio:['pipe','pipe','pipe'],encoding:'utf8'}),e=>!String(e.stderr).includes('NETWORK_ATTEMPT'));
}
assert.equal(Server.publicConfiguration(pub(ref)).projectRef,ref);assert.throws(()=>Server.publicConfiguration(pub(P.localRef)));P.assertEndpoint('http://127.0.0.1:54321',{allowLocal:true});
for(const f of ['supabase/v3-staging/001_secure_core.sql','supabase/v3-staging/004_compact_save_receipts.sql','supabase/single-child-draft/001_pairing_foundation.sql','supabase/single-child-draft/002_identity_bridge.sql']){const s=fs.readFileSync(f,'utf8');assert.ok(s.includes(P.mainRef)&&s.includes(P.deletedRef),f);}
console.log('PASS owner-confirmed Main/deleted denylist in configuration, direct server construction, audit-before-network, and migration preconditions; zero remote requests.');
