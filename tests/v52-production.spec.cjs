const {test,expect}=require('@playwright/test');
const {fixture,mock}=require('./helpers/cloud-server.cjs');
const B=require('../v3/backend-config.js');
const options={projectRef:B.production.projectRef,projectName:B.production.projectName,identity:{contractVersion:1,ready:true}};
test('old bookmarked game route redirects to the protected production home',async({page})=>{
 const s=fixture(),errors=await mock(page,s,options);
 await page.goto('/production-test-dist/v2-game-test.html');
 await expect(page).toHaveURL(/\/production-test-dist\/$/);
 await expect(page.getByLabel('Account password',{exact:true})).toBeVisible();
 expect(errors).toEqual([]);
});
async function account(page,parent=false){
 await page.goto('/production-test-dist/');
 await page.getByLabel('Email',{exact:true}).fill(`${parent?'parent':'learner'}@fictional.invalid`);
 await page.getByLabel('Account password',{exact:true}).fill('fictional-only-password');
 await page.getByRole('button',{name:'Continue',exact:true}).click();
}
async function pin(page,parent=false){
 await page.getByLabel('PIN',{exact:true}).fill(parent?'654321':'1234');
 await page.getByRole('button',{name:'Continue',exact:true}).click();
}
test('unready or wrong-contract backend cannot display login',async({page})=>{
 const s=fixture(),errors=await mock(page,s,{...options,identity:{contractVersion:1,ready:false}});
 await page.goto('/production-test-dist/');
 await expect(page.getByRole('heading',{name:'Family service is unavailable'})).toBeVisible();
 await expect(page.getByLabel('Account password',{exact:true})).toHaveCount(0);
 expect(s.calls.map(c=>c.path)).toEqual(['/rest/v1/rpc/v3_identity']);expect(errors).toEqual([]);
});
test('normal learner login, wrong PIN, save response loss, resume and lock',async({page})=>{
 const s=fixture(),errors=await mock(page,s,options);await account(page);
 await page.getByLabel('PIN',{exact:true}).fill('0000');
 await page.getByRole('button',{name:'Continue',exact:true}).click();
 await expect(page.getByRole('status')).toContainText('PIN was not recognised');
 await pin(page);
 await expect(page.getByRole('heading',{name:'A little maths. A big adventure.'})).toBeVisible();
 await expect(page.getByRole('button',{name:'Demo parent summary'})).toHaveCount(0);
 await page.getByRole('button',{name:'Continue adventure',exact:false}).first().click();
 await page.locator('[data-action^="mission:number:0:"]').first().click();
 await page.getByRole('button',{name:'Use number workshop',exact:true}).first().click();
 await page.getByRole('button',{name:'Try this task',exact:false}).click();
 s.loseSave=true;await page.getByRole('button',{name:'Hint',exact:true}).click();
 // Routine edits batch for 30 seconds; reconnect forces the existing recovery path.
 await page.evaluate(()=>window.dispatchEvent(new Event('online')));
 // The lost acknowledgement intentionally leaves a pending request; reload recovers it.
 await expect.poll(()=>s.loseSave).toBe(false);await page.reload();
 await expect.poll(()=>s.progress.adventure?.active?.assisted).toBe(true);
 await page.getByRole('button',{name:'Use number workshop',exact:true}).first().click();
 await expect(page.getByRole('button',{name:'Check answer'})).toBeVisible();
 await page.locator('[data-world-task-close]').click();
 await page.getByRole('button',{name:'Lock account',exact:true}).click();
 await expect(page.getByRole('heading',{name:'Unlock your learner account'})).toBeVisible();
 expect(s.calls.some(c=>['award','redeem','confirm_offline'].includes(c.body.p_operation))).toBe(false);
 expect(errors).toEqual([]);
});
test('explicit first server PIN enrollment follows password sign-in',async({page})=>{
 const s=fixture();s.pinSet=false;const errors=await mock(page,s,options);await account(page);
 await expect(page.getByText('Existing device PIN data is preserved.',{exact:false})).toBeVisible();
 await expect(page.getByRole('heading',{name:'Enroll your game PIN after password sign-in'})).toBeVisible();
 await pin(page);await expect(page.getByRole('heading',{name:'A little maths. A big adventure.'})).toBeVisible();
 expect(s.calls.filter(c=>c.path.endsWith('/v3_set_pin'))).toHaveLength(1);expect(errors).toEqual([]);
});
test('parent history, reviewed opening entitlement and server reward action remain separate',async({page})=>{
 const s=fixture();s.wallet.opening_seconds=120;s.wallet.legacy_redeemed=7;s.wallet.bonus=20;
 const errors=await mock(page,s,options);await account(page,true);await pin(page,true);
 await expect(page.getByRole('heading',{name:'Family service parent dashboard'})).toBeVisible();
 await expect(page.getByText('Historical redeemed time:',{exact:false})).toContainText('7 minutes');
 await expect(page.getByText('Historical redeemed time:',{exact:false})).toContainText('2 minutes');
 await page.getByLabel('Amount (1 to 60)',{exact:true}).fill('2');
 await page.getByLabel('Action',{exact:true}).selectOption('award');
 await page.getByRole('button',{name:'Submit parent reward',exact:true}).click();
 await expect.poll(()=>s.wallet.bonus).toBe(22);
 expect(s.calls.some(c=>['save','buy'].includes(c.body.p_operation))).toBe(false);expect(errors).toEqual([]);
});
test('password recovery uses SDK PKCE and the intended production application redirect',async({page})=>{
 const s=fixture(),errors=await mock(page,s,options);await page.goto('/production-test-dist/');
 await page.getByLabel('Email',{exact:true}).fill('learner@fictional.invalid');
 await page.getByRole('button',{name:'Forgot account password'}).click();
 await expect(page.getByRole('status')).toContainText('private recovery link');
 const request=s.calls.find(c=>c.path==='/auth/v1/recover');expect(request.body.code_challenge).toBeTruthy();
 expect(request.body.email).toBe('learner@fictional.invalid');expect(errors).toEqual([]);
});
const freshEpoch='55555555-5555-4555-8555-555555555555';
async function seedPreviousRelease(page){
 await page.addInitScript(({ref,epoch})=>{
  if(localStorage.getItem('fresh-test-seeded'))return;
  const uid='11111111-1111-4111-8111-111111111111',parent='22222222-2222-4222-8222-222222222222';
  const old={coins:9999,minutes:500,skills:{place:{state:'mastered'}},bought:['dragon'],achievements:['old'],quest:{legacy:true}};
  for(const prefix of [`jaxon_v51_production:${ref}:${uid}:game`,`jaxon_v51_production:${ref}:initial:${uid}:game`]){
   localStorage.setItem(prefix,JSON.stringify(old));localStorage.setItem(prefix+':queue',JSON.stringify({version:1,revision:0,archives:[],latest:old}));
  }
  localStorage.setItem(`v3-intent:${ref}:${parent}`,JSON.stringify({op:'award',payload:{amount:60,requestId:epoch}}));
  localStorage.setItem(`v52-production-last-remote:${ref}:${uid}`,JSON.stringify({progress:old,wallet:{coins:9999}}));
  localStorage.setItem('legacy-device-pin-sentinel','fictional-preserved');localStorage.setItem('fresh-test-seeded','yes');
 },{ref:B.production.projectRef,epoch:freshEpoch});
}
test('fresh release ignores previous game caches and queues, preserves them privately, and resumes only new progress',async({page})=>{
 const s=fixture();s.wallet={coins:0,bonus:0,owned:[],active_seconds:0,redeemed:0,legacy_redeemed:0,opening_seconds:0};
 const errors=await mock(page,s,{...options,identity:{...options.identity,activationId:freshEpoch,activationMode:'fresh-start'}});
 await seedPreviousRelease(page);await account(page);await pin(page);
 await expect(page.getByRole('heading',{name:'A little maths. A big adventure.'})).toBeVisible();
 const current=await page.evaluate(({ref,epoch})=>JSON.parse(localStorage.getItem(`jaxon_v51_production:${ref}:${epoch}:11111111-1111-4111-8111-111111111111:game`)),{ref:B.production.projectRef,epoch:freshEpoch});
 expect(current.coins).toBe(0);expect(current.minutes).toBe(0);expect(current.bought).toEqual([]);expect(current.achievements).toEqual([]);expect(current.discovery).toEqual({});expect(current.skills).toEqual({});
 await page.getByRole('button',{name:'Continue adventure',exact:false}).first().click();
 await page.locator('[data-action^="mission:number:0:"]').first().click();
 await page.getByRole('button',{name:'Use number workshop',exact:true}).first().click();
 await page.getByRole('button',{name:'Try this task',exact:false}).click();await page.getByRole('button',{name:'Hint',exact:true}).click();
 // Routine edits batch for 30 seconds; reconnect forces the existing recovery path.
 await page.evaluate(()=>window.dispatchEvent(new Event('online')));
 await expect.poll(()=>s.progress.adventure?.active?.assisted).toBe(true);await page.reload();
 await page.getByRole('button',{name:'Use number workshop',exact:true}).first().click();
 await expect(page.getByRole('button',{name:'Check answer'})).toBeVisible();
 expect(s.progress.achievements).toEqual([]);expect(s.wallet.coins).toBe(0);
 expect(await page.evaluate(()=>localStorage.getItem('legacy-device-pin-sentinel'))).toBe('fictional-preserved');
 expect(await page.evaluate(ref=>JSON.parse(localStorage.getItem(`jaxon_v51_production:${ref}:11111111-1111-4111-8111-111111111111:game`)).coins,B.production.projectRef)).toBe(9999);
 expect(s.calls.filter(c=>c.body.p_operation==='save').some(c=>c.body.p_args.progress.quest?.legacy)).toBe(false);expect(errors).toEqual([]);
});
test('fresh parent dashboard starts at zero and ignores a previous release reward intent',async({page})=>{
 const s=fixture();s.wallet={coins:0,bonus:0,owned:[],active_seconds:0,redeemed:0,legacy_redeemed:0,opening_seconds:0};
 const errors=await mock(page,s,{...options,identity:{...options.identity,activationId:freshEpoch,activationMode:'fresh-start'}});
 await seedPreviousRelease(page);await account(page,true);await pin(page,true);
 await expect(page.getByText('No completed learning yet.')).toBeVisible();
 await expect(page.getByText('Historical redeemed time:',{exact:false})).toContainText('0 minutes');
 await page.getByLabel('Amount (1 to 60)',{exact:true}).fill('2');await page.getByLabel('Action',{exact:true}).selectOption('award');
 await page.getByRole('button',{name:'Submit parent reward',exact:true}).click();await expect.poll(()=>s.wallet.bonus).toBe(2);
 const awards=s.calls.filter(c=>c.body.p_operation==='award');expect(awards).toHaveLength(1);expect(awards[0].body.p_args.amount).toBe(2);
 expect(await page.evaluate(ref=>!!localStorage.getItem(`v3-intent:${ref}:22222222-2222-4222-8222-222222222222`),B.production.projectRef)).toBe(true);expect(errors).toEqual([]);
});
