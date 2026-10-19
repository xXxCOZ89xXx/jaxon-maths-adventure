/* Offline Supabase adapter tests; run node tests/v2-bonus-shop-regression.cjs.
   No real credentials, data, browser or database are used. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const moduleSource=fs.readFileSync('v2-secure-cloud.js','utf8');
const ctx={window:{}};
vm.runInNewContext(moduleSource,ctx);
const create=ctx.window.JaxonSecureCloud.createSecureAdapter;
function fakeClient(role,migrated){
 const logs=[],uid=role==='parent'?'parent-user':role==='learner'?'child-user':'unlinked-user';
 const family={parent_user_id:'parent-user',child_user_id:'child-user'};
 const makeResult=(table)=>{
  if(table==='maths_avatar_catalog'&&!migrated)return {data:null,error:{code:'PGRST205',message:'Table is not installed'}};
  if(table==='maths_avatar_catalog')return {data:[{item_id:'cap',cost:45},{item_id:'helmet',cost:100}],error:null};
  if(table==='maths_avatar_purchases')return {data:[{item_id:'cap',cost:45}],error:null};
  if(table==='maths_rewards')return {data:{bonus_coins:150,bonus_spent:45,redeemed_minutes:10},error:null};
  return {data:null,error:null};
 };
 const client={
  auth:{getUser:async()=>({data:{user:{id:uid}},error:null}),signOut:async()=>({error:null})},
  from(table){return {
   select(){return {
     or:async()=>({data:role==='unlinked'?[]:[family],error:null}),
     eq(){const result=makeResult(table);return {
       then(resolve,reject){return Promise.resolve(result).then(resolve,reject)},
       maybeSingle:async()=>result
     }}
   }}
  }},
  rpc:async(name,params)=>{logs.push({name,params});return {data:{bonus_coins:150,bonus_spent:90,redeemed_minutes:10},error:null}}
 };
 return {client,logs};
}
(async()=>{
 const req='123e4567-e89b-42d3-a456-426614174000';
 const legacy=fakeClient('learner',false),old=create(legacy.client);
 assert.equal((await old.authenticate()).role,'learner');
 const before=await old.readAvatarEconomy();
 assert.equal(before.enabled,false,'Existing game must work without new table');
 assert.equal(before.available,0);
 const linked=fakeClient('learner',true),learner=create(linked.client);
 assert.equal((await learner.authenticate()).role,'learner');
 const result=await learner.readAvatarEconomy();
 assert.equal(result.enabled,true);
 assert.equal(result.available,105);
 assert.equal(result.owned[0],'cap');
 assert.equal(result.prices.helmet,100);
 await learner.buyAvatarBonus('helmet',req);
 assert.equal(linked.logs.length,1);
 assert.equal(linked.logs[0].name,'learner_buy_maths_avatar_bonus');
 assert.equal(linked.logs[0].params.p_item_id,'helmet');
 await assert.rejects(()=>learner.buyAvatarBonus('invalid item',req),/Invalid shop item/);
 await assert.rejects(()=>learner.buyAvatarBonus('helmet','not-a-uuid'),/request ID/i);
 const parent=fakeClient('parent',true),adult=create(parent.client);
 assert.equal((await adult.authenticate()).role,'parent');
 await assert.rejects(()=>adult.buyAvatarBonus('helmet',req),/learner account required/);
 assert.equal(parent.logs.length,0,'Parent must not call learner purchase RPC');
 const stranger=fakeClient('unlinked',true),unlinked=create(stranger.client);
 assert.equal((await unlinked.authenticate()).role,'unlinked');
 await assert.rejects(()=>unlinked.buyAvatarBonus('helmet',req),/learner account required/);
 console.log('PASS: missing-schema compatibility, learner bonus balance, server-only purchases, parent/unlinked permissions.');
})().catch(error=>{console.error(error);process.exitCode=1});
