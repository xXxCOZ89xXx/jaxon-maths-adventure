/* Jaxon's Maths Adventure - V2 secure cloud adapter (development)
 * Use only after the V2 schema is migrated and the old cloud writer retired.
 * This module never authenticates using a PIN alone.
 */
(function(global){
  'use strict';
  const TABLES={families:'maths_families',learning:'maths_learning',rewards:'maths_rewards',events:'maths_reward_events',avatarCatalog:'maths_avatar_catalog',avatarPurchases:'maths_avatar_purchases'};
  const ALLOWED=['diag','skills','coins','earned','minutes','weekly','lastTick','lastActivity','equipped','bought','recent','session','discovery'];
  function cleanProgress(state){
    const result={};
    for(const key of ALLOWED)if(Object.prototype.hasOwnProperty.call(state||{},key))result[key]=state[key];
    return result;
  }
  function createSecureAdapter(client){
    if(!client)throw Error('A Supabase client is required');
    let identity=null,activeChild=null;
    async function authenticate(){
      const {data,error}=await client.auth.getUser();
      if(error){if(/auth session missing|session missing/i.test(error.message||'')){identity=null;activeChild=null;return {role:'guest',childUserId:null}}throw error;}
      if(!data?.user){identity=null;activeChild=null;return {role:'guest',childUserId:null}}
      const uid=data.user.id;
      const q=await client.from(TABLES.families).select('parent_user_id,child_user_id').or('parent_user_id.eq.'+uid+',child_user_id.eq.'+uid);
      if(q.error)throw q.error;
      const parent=q.data?.find(r=>r.parent_user_id===uid);
      const child=q.data?.find(r=>r.child_user_id===uid);
      if(parent){identity='parent';activeChild=parent.child_user_id}
      else if(child){identity='learner';activeChild=uid}
      else{identity='unlinked';activeChild=null}
      return {role:identity,childUserId:activeChild};
    }
    function requireRole(role){if(identity!==role||!activeChild)throw Error(role+' account required');}
    async function readProgress(){
      if(!activeChild||!['parent','learner'].includes(identity))throw Error('Linked account required');
      const q=await client.from(TABLES.learning).select('progress,updated_at').eq('child_user_id',activeChild).maybeSingle();
      if(q.error)throw q.error;
      return q.data||null;
    }
    async function writeProgress(state){
      requireRole('learner');
      const record={child_user_id:activeChild,progress:cleanProgress(state),updated_at:new Date().toISOString()};
      const q=await client.from(TABLES.learning).upsert(record,{onConflict:'child_user_id'});
      if(q.error)throw q.error;
      return true;
    }
    async function readRewards(){
      if(!activeChild||!['parent','learner'].includes(identity))throw Error('Linked account required');
      const q=await client.from(TABLES.rewards).select('bonus_coins,redeemed_minutes,updated_at').eq('child_user_id',activeChild).maybeSingle();
      if(q.error)throw q.error;
      return q.data||{bonus_coins:0,redeemed_minutes:0};
    }
    async function readAvatarEconomy(){
      if(!activeChild||!['parent','learner'].includes(identity))throw Error('Linked account required');
      const catalogue=await client.from(TABLES.avatarCatalog).select('item_id,cost').eq('active',true);
      if(catalogue.error){
        if(['42P01','PGRST205'].includes(catalogue.error.code))return {enabled:false,available:0,owned:[],prices:{}};
        throw catalogue.error;
      }
      const balance=await client.from(TABLES.rewards).select('bonus_coins,bonus_spent').eq('child_user_id',activeChild).maybeSingle();
      if(balance.error){
        if(balance.error.code==='42703')return {enabled:false,available:0,owned:[],prices:{}};
        throw balance.error;
      }
      const purchases=await client.from(TABLES.avatarPurchases).select('item_id,cost').eq('child_user_id',activeChild);
      if(purchases.error)throw purchases.error;
      const granted=Math.max(0,Number(balance.data?.bonus_coins||0));
      const spent=Math.max(0,Number(balance.data?.bonus_spent||0));
      const prices=Object.fromEntries((catalogue.data||[]).map(x=>[x.item_id,Number(x.cost)]));
      return {enabled:true,granted,spent,available:Math.max(0,granted-spent),owned:(purchases.data||[]).map(x=>x.item_id),prices};
    }
    async function buyAvatarBonus(itemId,requestId){
      requireRole('learner');
      if(typeof itemId!=='string'||!/^[a-z][a-z0-9_]{1,50}$/.test(itemId))throw Error('Invalid shop item');
      if(typeof requestId!=='string'||!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(requestId))throw Error('Stable purchase request ID required');
      const q=await client.rpc('learner_buy_maths_avatar_bonus',{p_item_id:itemId,p_request_id:requestId});
      if(q.error)throw q.error;
      return q.data;
    }
    async function parentAward(kind,amount,requestId){
      requireRole('parent');
      if(!['bonus_coins','redeem_minutes'].includes(kind)||!Number.isInteger(amount)||amount<1||amount>60)throw Error('Invalid reward request');
      if(!requestId||!/^[0-9a-f-]{36}$/i.test(requestId))throw Error('A stable request ID is required for safe retries');
      const q=await client.rpc('parent_award_maths_once',{p_child:activeChild,p_kind:kind,p_amount:amount,p_request_id:requestId});
      if(q.error)throw q.error;
      return q.data;
    }
    async function signOut(){
      const q=await client.auth.signOut();if(q.error)throw q.error;
      identity=null;activeChild=null;
    }
    return Object.freeze({authenticate,readProgress,writeProgress,readRewards,readAvatarEconomy,buyAvatarBonus,parentAward,signOut,getRole:()=>identity,getChildId:()=>activeChild});
  }
  global.JaxonSecureCloud=Object.freeze({createSecureAdapter,cleanProgress});
})(window);
