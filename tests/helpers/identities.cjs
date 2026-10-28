'use strict';
const {test:base,expect}=require('@playwright/test');
const {profile}=require('./profiles.cjs');
const {fixture,mock,ref,uid,parentUid}=require('./cloud-server.cjs');
const KEY='jaxon_v3_fictional_demo_2026',ORIGIN='http://127.0.0.1:4173';
async function installSession(page,server,role) {
  if(!['learner','parent'].includes(role)) throw Error('Unknown fixture role');
  // Registered only in this intercepted in-memory server. No application test flag or bypass.
  const id=role==='parent'?parentUid:uid,token=`fake.${role}.token`,unlock=`unlock-${id}`;
  server.tokens.set(unlock,id);
  await page.addInitScript(({ref,id,role,token,unlock,origin})=>{
    if(location.origin!==origin||!location.pathname.startsWith('/staging-fixture-dist/')) return;
    const marker=`fixture-session:${role}`;
    if(sessionStorage.getItem(marker)) return;
    const user={id,aud:'authenticated',role:'authenticated',email:`${role}@fictional.invalid`,app_metadata:{provider:'email'},user_metadata:{},identities:[],created_at:new Date().toISOString()};
    localStorage.setItem(`jaxon_v3_staging_auth:${ref}`,JSON.stringify({access_token:token,refresh_token:'fictional-refresh',expires_in:3600,expires_at:Math.floor(Date.now()/1000)+3600,token_type:'bearer',user}));
    sessionStorage.setItem(`v3-unlock:${ref}`,JSON.stringify({token:unlock,expires:new Date(Date.now()+3600000).toISOString(),role,user:id,child:'11111111-1111-4111-8111-111111111111'}));
    sessionStorage.setItem(marker,'1');
  },{ref,id,role,token,unlock,origin:ORIGIN});
}
const test=base.extend({
  profileName:['new',{option:true}],
  camp:async({browser,profileName},use,testInfo)=>{
    const context=await browser.newContext(testInfo.project.use);
    const blocked=[],errors=[];
    await context.route('**/*',r=>{
      if(new URL(r.request().url()).origin===ORIGIN) return r.continue();
      blocked.push(r.request().url());return r.abort();
    });
    await context.addInitScript(({origin,key,state})=>{
      if(location.origin===origin && !sessionStorage.getItem('fixture-seeded')) {
        localStorage.setItem(key,JSON.stringify(state));sessionStorage.setItem('fixture-seeded','1');
      }
    },{origin:ORIGIN,key:KEY,state:profile(profileName)});
    const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
    await page.goto('/v3-adventure.html');
    try {await use({page,context,key:KEY,read:()=>page.evaluate(key=>JSON.parse(localStorage.getItem(key)),KEY)});}
    finally {
      await context.close();
      expect(blocked,'No external destinations permitted for fictional camp').toEqual([]);
      expect(errors,'No browser runtime errors').toEqual([]);
    }
  },
  family:async({browser,profileName},use,testInfo)=>{
    const server=fixture();server.progress=profile(profileName);
    const contexts=[],errors=[];
    async function open(role) {
      const context=await browser.newContext(testInfo.project.use);contexts.push(context);
      const page=await context.newPage();errors.push(await mock(page,server));
      await installSession(page,server,role);
      await page.goto('/staging-fixture-dist/');
      await expect(page.getByRole('heading',{name:role==='parent'?'Staging parent dashboard':'Base Camp',exact:true})).toBeVisible();
      return page;
    }
    try {await use({server,open,ref,uid,parentUid});}
    finally {await Promise.all(contexts.map(c=>c.close()));expect(errors.flat()).toEqual([]);}
  }
});
module.exports={test,expect,installSession,KEY,ORIGIN};
