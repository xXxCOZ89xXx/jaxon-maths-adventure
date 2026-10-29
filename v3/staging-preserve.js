/* Staging V5.2 contract only. No SDK/network/storage access or production fallback. */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.V52StagingPreserve=api;
})(typeof window==='object'?window:globalThis,function(){
 'use strict';
 const projectRef=null,version=2; // No hosted staging project has been provisioned.
 function verify(config,identity){
  const projectRef=config.projectRef;
  if(!/^[a-z]{20}$/.test(projectRef||'')||['sfogrvedypgtxfvecmbx','mbdelspbjusarbwlltol'].includes(projectRef))throw Error('New isolated staging target required');
  if(config.environment!=='staging'||config.projectRef!==projectRef||config.authorizedRef!==projectRef||
     config.url!==`https://${projectRef}.supabase.co`||config.projectName!=='jaxon-maths-v3-staging'||
     identity?.name!==config.projectName||identity?.projectRef!==projectRef||identity?.stagingUpgradeVersion!==version)
   throw Error('Verify the preservation staging upgrade before connecting. Existing device queues are retained.');
 }
 function matchesIntent(intent,op,payload){
  if(intent?.op!==op||typeof intent.payload?.requestId!=='string')return false;
  if(op==='buy')return intent.payload.item===payload.item;
  if(['award','redeem','confirm_offline'].includes(op))return intent.payload.amount===payload.amount;
  return false;
 }
 function retainIntent(){
  // New validation must not silently erase a pre-upgrade immutable intent.
  // An owner can inspect/reconcile a rejected intent privately; never mint a new ID.
  return true;
 }
 return Object.freeze({projectRef,version,verify,matchesIntent,retainIntent});
});
