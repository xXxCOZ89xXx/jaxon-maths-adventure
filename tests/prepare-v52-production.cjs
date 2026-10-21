// Test-only caller of the real production builder. All remote traffic must be intercepted.
const path=require('node:path'),fs=require('node:fs');
const B=require('../v3/backend-config.js');
const out=path.resolve(__dirname,'../production-test-dist');
function prepare(){
fs.rmSync(out,{recursive:true,force:true});
require('../scripts/build-v52-production.cjs').build({...B.production,authorizedRef:B.production.projectRef,
 url:`https://${B.production.projectRef}.supabase.co`,anonKey:'sb_publishable_'+'a'.repeat(24)},out);
console.log('Built production-test-dist with fictional public key; browser tests deny unhandled remote traffic.');
}
module.exports=prepare;
if(require.main===module)prepare();
