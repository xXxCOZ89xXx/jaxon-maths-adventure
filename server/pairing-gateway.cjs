/* Server-only, deployment-neutral foundation. Never bundled into a browser.
 * parentRpc MUST forward the verified parent bearer JWT (not a service JWT).
 * serviceRpc MUST be private. Device game requests use the reviewed server-resolved identity bridge.
 */
const {createHmac}=require('node:crypto');
const cookie=(name,value,age)=>`${name}=${value}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${age}`;
const cookies=header=>Object.fromEntries((header||'').split(';').map(x=>x.trim().split('=')));
function create({origin,rateSecret,parentRpc,serviceRpc}){
 if(!/^https:\/\/[^/]+$/.test(origin)||!Buffer.isBuffer(rateSecret)||rateSecret.length<32)throw Error('HTTPS origin and server rate secret required');
 const bucket=address=>createHmac('sha256',rateSecret).update(address).digest('hex');
 return async function handle({method,url,headers,body,remoteAddress}){
  const base={'Content-Type':'application/json','Cache-Control':'no-store','Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff'};
  const reply=(status,value,extra={})=>({status,headers:{...base,...extra},body:JSON.stringify(value)});
  if(method!=='POST'||headers.origin!==origin||headers['content-type']!=='application/json'||!remoteAddress||typeof body!=='string'||Buffer.byteLength(body)>(url==='/setup/game'?2100000:4096)||url.includes('?'))return reply(400,{error:'Setup request unavailable'});
  let data;try{data=JSON.parse(body);if(!data||Array.isArray(data)||typeof data!=='object')throw Error();}catch{return reply(400,{error:'Setup request unavailable'});}
  const ck=cookies(headers.cookie),valid=v=>/^[a-f0-9]{64}$/.test(v||'');
  try{
   let r;
   if(url==='/setup/parent'){
    if(Object.keys(data).some(k=>!['action','args'].includes(k))||!/^Bearer [A-Za-z0-9._-]{20,4096}$/.test(headers.authorization||''))return reply(401,{error:'Sign in again to manage setup'});
    r=await parentRpc(headers.authorization.slice(7),'v12_parent',{p_action:data.action,p_args:data.args||{}});
   }else if(url==='/setup/pair'){
    if(Object.keys(data).join()!=='code')return reply(400,{error:'Pairing unavailable'});
    r=await serviceRpc('v12_pair',{p_code:data.code,p_bucket:bucket(remoteAddress)});
    if(r.error)return reply(429,{error:'Pairing unavailable. Wait and ask your parent for help'});
    if(!valid(r.deviceToken))throw Error();
    return reply(200,{paired:true,gameReady:true},{'Set-Cookie':[cookie('__Host-jaxon-device',r.deviceToken,2592000),cookie('__Host-jaxon-grant','',0)]});
   }else if(url==='/setup/unlock'){
    if(Object.keys(data).join()!=='pin'||!valid(ck['__Host-jaxon-device']))return reply(401,{error:'Connect this device with your parent'});
    r=await serviceRpc('v12_device_unlock',{p_device:ck['__Host-jaxon-device'],p_pin:data.pin,p_bucket:bucket(remoteAddress)});
    if(r.error)return reply(429,{error:'Unlock unavailable. Wait or ask your parent for help'});
    if(!valid(r.grantToken))throw Error();
    return reply(200,{unlocked:true,gameReady:true},{'Set-Cookie':cookie('__Host-jaxon-grant',r.grantToken,43200)});
   }else if(url==='/setup/status'){
    if(Object.keys(data).length)return reply(400,{error:'Setup request unavailable'});
    if(!valid(ck['__Host-jaxon-device']))return reply(200,{connected:false});
    r=await serviceRpc('v13_device_status',{p_device:ck['__Host-jaxon-device'],p_grant:valid(ck['__Host-jaxon-grant'])?ck['__Host-jaxon-grant']:null});
    return reply(200,r);
   }else if(url==='/setup/game'){
    if(Object.keys(data).some(k=>!['operation','args'].includes(k))||!valid(ck['__Host-jaxon-grant']))return reply(401,{error:'Unlock this device again'});
    r=await serviceRpc('v13_device_request',{p_grant:ck['__Host-jaxon-grant'],p_operation:data.operation,p_args:data.args||{}});
    return reply(200,r);
   }else if(url==='/setup/disconnect'){
    if(Object.keys(data).length)return reply(400,{error:'Setup request unavailable'});
    if(valid(ck['__Host-jaxon-grant']))await serviceRpc('v12_device_lock',{p_grant:ck['__Host-jaxon-grant']});
    return reply(200,{disconnected:true},{'Set-Cookie':[cookie('__Host-jaxon-grant','',0),cookie('__Host-jaxon-device','',0)]});
   }else if(url==='/setup/lock'){
    if(Object.keys(data).length)return reply(400,{error:'Setup request unavailable'});
    if(valid(ck['__Host-jaxon-grant']))await serviceRpc('v12_device_lock',{p_grant:ck['__Host-jaxon-grant']});
    return reply(200,{locked:true},{'Set-Cookie':cookie('__Host-jaxon-grant','',0)});
   }else return reply(404,{error:'Setup request unavailable'});
   if(r.error)return reply(429,{error:'Setup unavailable. Wait or sign in again before retrying'});
   return reply(200,r);
  }catch(err){
   if(err?.status===401)return reply(401,{error:'Unlock this connected device again'});
   if(err?.status===403)return reply(403,{error:'This operation is not permitted'});
   // No raw Auth/SQL errors, request bodies, codes, PINs or tokens in logs/errors.
   return reply(503,{error:'Setup could not be confirmed. Keep this page and retry when connected'});
  }
 };
}
module.exports={create};
