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
 await page.getByRole('button',{name:'Start building',exact:false}).click();
 s.loseSave=true;await page.getByRole('button',{name:'Hint',exact:true}).click();
 await expect.poll(()=>s.progress.quest?.assisted).toBe(true);await page.reload();
 await expect(page.getByRole('button',{name:'Try my solution'})).toBeVisible();
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
