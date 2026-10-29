/* HTTPS account/device gateway + static review build. No credential logs.
 * --local uses generated fictional-only local Supabase config.
 * Otherwise only an explicitly pinned, NON-production staging project is accepted.
 */
const Policy=require('../v3/staging-policy.js');
const fs=require('node:fs'),https=require('node:https'),path=require('node:path'),{create}=require('./pairing-gateway.cjs');
function publicConfiguration(env){Policy.assertRef(env.V13_STAGING_PROJECT_REF);const ref=env.V13_STAGING_PROJECT_REF,url=env.V13_STAGING_URL,origin=env.V13_REVIEW_ORIGIN;if(!/^[a-z]{20}$/.test(ref||'')||ref==='mbdelspbjusarbwlltol'||env.V13_AUTHORIZED_STAGING_REF!==ref||url!==`https://${ref}.supabase.co`||!/^https:\/\/[^/]+$/.test(origin||'')||origin.includes('jaxon-maths-private-git.pages.dev'))throw Error('Distinct reviewed staging configuration required');require('../v3/backend-config.js').publicKey(env.V13_STAGING_ANON_KEY,ref);return {projectRef:ref,origin,authUrl:url+'/auth/v1',restUrl:url+'/rest/v1',anonKey:env.V13_STAGING_ANON_KEY};}
function configuration(env,local=false){
 if(local){const c=JSON.parse(fs.readFileSync('work/single-child-integration/local-private.json'));if(c.localOnly!==true||c.origin!=='https://127.0.0.1:4443'||!['authUrl','restUrl'].every(k=>/^http:\/\/127\.0\.0\.1:\d+$/.test(c[k])))throw Error('Invalid local review configuration');return c;}
 Policy.assertRef(env.V13_STAGING_PROJECT_REF);
 const ref=env.V13_STAGING_PROJECT_REF,url=env.V13_STAGING_URL,origin=env.V13_REVIEW_ORIGIN;
 if(!/^[a-z]{20}$/.test(ref||'')||ref==='mbdelspbjusarbwlltol'||env.V13_AUTHORIZED_STAGING_REF!==ref||url!==`https://${ref}.supabase.co`||!/^https:\/\/[^/]+$/.test(origin||'')||origin.includes('jaxon-maths-private-git.pages.dev'))throw Error('Distinct reviewed staging configuration required');
 const B=require('../v3/backend-config.js');B.publicKey(env.V13_STAGING_ANON_KEY,ref);
 if(typeof env.V13_STAGING_SERVICE_ROLE_KEY!=='string'||!env.V13_STAGING_SERVICE_ROLE_KEY||!/^[a-f0-9]{64}$/.test(env.V13_PAIRING_RATE_SECRET||''))throw Error('Private staging server bindings required');
 let service;try{service=JSON.parse(Buffer.from(env.V13_STAGING_SERVICE_ROLE_KEY.split('.')[1],'base64url'));}catch{throw Error('Staging service-role JWT required');}if(service.role!=='service_role'||service.ref!==ref)throw Error('Matching staging service credential required');
 return {origin,authUrl:url+'/auth/v1',restUrl:url+'/rest/v1',anonKey:env.V13_STAGING_ANON_KEY,serviceKey:env.V13_STAGING_SERVICE_ROLE_KEY,rateSecret:env.V13_PAIRING_RATE_SECRET};
}
function createServer(c,{cert,key,dir='single-child-dist'}={}){
 Policy.assertEndpoint(c.authUrl,{allowLocal:c.localOnly===true});Policy.assertEndpoint(c.restUrl,{allowLocal:c.localOnly===true});
 const rpc=async(token,name,args)=>{const r=await fetch(c.restUrl+'/rpc/'+name,{method:'POST',headers:{apikey:token===c.serviceKey?c.serviceKey:c.anonKey,authorization:'Bearer '+token,'content-type':'application/json'},body:JSON.stringify(args)});if(!r.ok){const value=await r.json().catch(()=>({}));const e=Error('Request refused');if(['Unlock required','Unlock this connected device again'].includes(value.message))e.status=401;else if(['Parent account required','Learner account required'].includes(value.message))e.status=403;throw e;}return r.json();};
 const gateway=create({origin:c.origin,rateSecret:Buffer.from(c.rateSecret,'hex'),parentRpc:(token,name,args)=>rpc(token,name,args),serviceRpc:(name,args)=>rpc(c.serviceKey,name,args)});
 const headers={'Cache-Control':'no-store','Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff','Permissions-Policy':'camera=(), microphone=(), geolocation=()','Content-Security-Policy':"default-src 'self'; connect-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; frame-ancestors 'none'; object-src 'none'; base-uri 'none'; form-action 'self'"};
 return https.createServer({cert,key},async(req,res)=>{
  const reply=(status,body,extra={})=>{res.writeHead(status,{...headers,...extra});res.end(body);};
  try{
   if(req.headers.host!==new URL(c.origin).host)return reply(400,'Invalid host');
   const u=new URL(req.url,c.origin);let body='';for await(const chunk of req){body+=chunk;if(Buffer.byteLength(body)>2100000)return reply(413,'Request too large');}
   if(u.pathname.startsWith('/setup/')){const r=await gateway({method:req.method,url:req.url,headers:req.headers,body,remoteAddress:req.socket.remoteAddress});return reply(r.status,r.body,r.headers);}
   if(u.pathname.startsWith('/supabase/')){
    const isAuth=u.pathname.startsWith('/supabase/auth/v1/'),part=u.pathname.replace(/^\/supabase\/(auth|rest)\/v1/,'');
    const authPaths=['/signup','/token','/user','/verify','/recover','/logout','/resend'];const rpcNames=['v3_identity','v3_role','v3_set_pin','v3_unlock','v3_request','v12_parent','v13_capabilities'];
    if(isAuth?!authPaths.includes(part):!(req.method==='POST'&&rpcNames.includes(part.replace('/rpc/',''))&&part.startsWith('/rpc/')))return reply(404,'Unavailable');
    if(req.method!=='GET'&&req.headers.origin!==c.origin)return reply(403,'Origin refused');
    const token=req.headers.authorization||'Bearer '+c.anonKey;
    if(token==='Bearer '+c.serviceKey)return reply(403,'Unavailable');
    const endpoint=(isAuth?c.authUrl:c.restUrl)+part+u.search;
    const upstream=await fetch(endpoint,{method:req.method,redirect:'manual',headers:{apikey:c.anonKey,authorization:token,'content-type':'application/json'},...(!['GET','HEAD'].includes(req.method)?{body:body||'{}'}:{})});
    const h={'Content-Type':upstream.headers.get('content-type')||'application/json'};const location=upstream.headers.get('location');if(location){if(!location.startsWith(c.origin+'/'))return reply(502,'Redirect unavailable');h.Location=location;}
    return reply(upstream.status,Buffer.from(await upstream.arrayBuffer()),h);
   }
   if(req.method!=='GET')return reply(405,'Unavailable');
   const file=path.resolve(dir,'.'+decodeURIComponent(u.pathname==='/'?'/index.html':u.pathname));if(!file.startsWith(path.resolve(dir)+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile())return reply(404,'Unavailable');
   const type={'.html':'text/html','.js':'application/javascript','.css':'text/css','.webp':'image/webp','.svg':'image/svg+xml','.jpg':'image/jpeg','.json':'application/json'}[path.extname(file)]||'application/octet-stream';reply(200,fs.readFileSync(file),{'Content-Type':type});
  }catch{return reply(503,JSON.stringify({error:'Request could not be confirmed. Reconnect and unlock; your saved work is preserved.'}),{'Content-Type':'application/json'});}
 });
}
module.exports={configuration,publicConfiguration,createServer};
if(require.main===module){try{const local=process.argv.includes('--local'),c=configuration(process.env,local),root='work/single-child-integration';const server=createServer(c,{cert:fs.readFileSync(local?root+'/localhost-cert.pem':process.env.V13_TLS_CERT_FILE),key:fs.readFileSync(local?root+'/localhost-key.pem':process.env.V13_TLS_KEY_FILE)});server.listen(Number(new URL(c.origin).port||443),'127.0.0.1',()=>console.log('Single-child HTTPS review server ready at '+c.origin));}catch{console.error('Review server configuration unavailable; no fallback to production.');process.exitCode=1;}}
