/* New-account foundation only; deliberately not imported by a production entry.
 * Hosted enablement requires the reviewed identity bridge and gateway first.
 */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.V12FamilySetup=api;})(globalThis,()=>{
 'use strict';
 function create({auth,request}){
  let generation=0;
  async function register(email,password){
   if(typeof email!=='string'||!email.includes('@')||typeof password!=='string'||password.length<12)throw Error('Use your parent email and a password of at least 12 characters');
   const r=await auth.signUp({email,password});
   if(r.error)throw Error('Account setup could not be confirmed. Wait before trying again');
   // Confirmation is mandatory even if a misconfigured service returns a session.
   if(r.data?.session){const out=await auth.signOut();if(out?.error)throw Error('Sign out before continuing email verification');}
   return {verificationRequired:true};
  }
  async function parent(action,args={}){
   const turn=generation,{data,error}=await auth.getUser();
   if(error||!data?.user?.email_confirmed_at||data.user.is_anonymous)throw Error('Verify your parent email and sign in again');
   const r=await request('/setup/parent',{action,args});
   if(turn!==generation)throw Error('Account changed; reopen setup');
   if(r.error)throw Error(r.error);
   return r;
  }
  async function pair(code){
   if(typeof code!=='string'||!/^([a-f0-9]{4}[ -]?){8}$/.test(code))throw Error('Enter the temporary code from your parent');
   const r=await request('/setup/pair',{code:code.replace(/[ -]/g,'')});
   if(r.error)throw Error(r.error);return r;
  }
  const invalidate=()=>{generation++;};
  return {register,parent,pair,invalidate};
 }
 return {create};
});
