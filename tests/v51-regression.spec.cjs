const {test,expect}=require('./helpers/identities.cjs');
const {C,E,names}=require('./helpers/profiles.cjs');
const AxeBuilder=require('@axe-core/playwright').default;
async function click(page,action) {
  if(/^(learn|check):town_/.test(action) && await page.locator('.town-lessons:not([open])').count()) await page.locator('.town-lessons > summary').click();
  await page.locator(`[data-action="${action}"]${action.startsWith("nav:") ? `,[data-nav="${action.slice(4)}"]` : ""}`).first().click();
  await page.waitForFunction(()=>!document.documentElement.hasAttribute('data-saving'));
}
async function answer(page,read,constructed=true) {
  const l=(await read()).learning,q=l.qs[l.i];
  const input=page.locator('[data-numeric-answer="practice"]');
  if(constructed && await input.count()) {
    const spec=await page.evaluate(()=>{const l=JSON.parse(localStorage.getItem('jaxon_v3_fictional_demo_2026')).learning;return V5HandsOn.practiceSpec({id:l.id},l.qs[l.i]);});
    await input.fill(String(Number(q[1])*(spec.scale||1)));
    await click(page,'p5-submit');
    return 'typed-model';
  }
  await click(page,'answer:'+q[2].findIndex(a=>String(a)===String(q[1])));
  return 'choice';
}
for(const profileName of Object.keys(names)) {
  test.describe(names[profileName],()=>{
    test.use({profileName});
    for(const world of E.worlds) test(`${world.name}: all skill interfaces, resume and independent separation`,async({camp},testInfo)=>{
      const {page,read}=camp,coverage=[];
      if(!(await read()).tourSeen) await click(page,'skip-tour');
      for(const [i,skill] of C.skills.filter(k=>k.world===world.id).entries()) {
        await click(page,'nav:map');await click(page,`world:${world.id}`);
        await click(page,`learn:${skill.id}`);await click(page,'practice');
        let before=await read();
        expect(before.learning.id).toBe(skill.id);
        const method=await answer(page,read);
        expect((await read()).learning.answered).toBe(true);
        await page.reload();
        let after=await read();
        expect(after.learning.answered).toBe(true);
        expect(after.skills[skill.id]?.independentEvidence).toEqual(before.skills[skill.id]?.independentEvidence);
        expect(after.checks[skill.id]?.stage||0).toBe(before.checks[skill.id]?.stage||0);
        coverage.push({profile:profileName,world:world.id,skill:skill.id,method,resumed:true});
        if(i===0) {
          // Complete a real supported round before the distinct fresh check.
          while((await read()).learning?.mode==='practice') {
            if(!(await read()).learning.answered) await answer(page,read);
            await click(page,'next-learning');
          }
          await click(page,'nav:map');await click(page,`world:${world.id}`);
          await click(page,`check:${skill.id}`);
          expect((await read()).learning.mode).toBe('check');
          await expect(page.locator('.practice-manipulative,[data-numeric-answer]')).toHaveCount(0);
          const priorQuestions=new Set(before.learning.qs.map(q=>q[0]));
          for(const q of (await read()).learning.qs) expect(priorQuestions.has(q[0])).toBe(false);
          let answered=0;
          while((await read()).learning?.mode==='check') {
            if(profileName==='foundation') await click(page,'learning-skip');
            else {if(profileName==='developing'&&answered===0) await click(page,'learning-hint');await answer(page,read,false);}
            await click(page,'next-learning');answered++;
          }
          const final=await read();
          expect(final.checks[skill.id].stage).toBe(profileName==='foundation'||profileName==='developing'?0:1);
          expect(final.skills[skill.id]?.state).not.toBe('mastered');
          coverage.at(-1).completedIndependentRound=true;
          coverage.at(-1).assisted=profileName==='foundation'||profileName==='developing';
        }
      }
      await testInfo.attach('curriculum-coverage',{body:Buffer.from(JSON.stringify(coverage)),contentType:'application/json'});
      const result=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
      expect(result.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)}))).toEqual([]);
      expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
    });
  });
}

test('Fictional parent and learner sessions require no credential entry and retain role boundaries',async({family})=>{
  const learner=await family.open('learner'),parent=await family.open('parent');
  await expect(learner.locator('#reward-form')).toHaveCount(0);
  await expect(parent.locator('#reward-form')).toBeVisible();
  const request=async(page,token,operation)=>page.evaluate(async({token,operation})=>{
    const raw=JSON.parse(localStorage.getItem('jaxon_v3_staging_auth:abcdefghijklmnopqrst'));
    const r=await fetch('https://abcdefghijklmnopqrst.supabase.co/rest/v1/rpc/v3_request',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+raw.access_token},body:JSON.stringify({p_token:token,p_operation:operation,p_args:{amount:10,requestId:'forbidden',revision:0,progress:{}}})});
    return r.status;
  },{token,operation});
  expect(await request(learner,'unlock-'+family.uid,'award')).toBe(403);
  expect(await request(parent,'unlock-'+family.parentUid,'save')).toBe(403);
  expect(await request(learner,'unlock-'+family.parentUid,'read')).toBe(403);
  await parent.getByLabel('Action',{exact:true}).selectOption('award');
  await parent.getByLabel('Amount (1 to 60)',{exact:true}).fill('10');
  await parent.getByRole('button',{name:'Submit parent reward'}).click();
  await expect.poll(()=>family.server.wallet.bonus).toBe(10);
  expect(family.server.calls.some(c=>c.path==='/auth/v1/token'||c.path.endsWith('/v3_unlock'))).toBe(false);
  await learner.reload();await parent.reload();
  await expect(parent.getByRole('heading',{name:'Staging parent dashboard'})).toBeVisible();
  expect(family.server.wallet.bonus).toBe(10);
});

test('A fresh identity fixture resets progress and sessions for the next test',async({family})=>{
  expect(family.server.progress).toEqual(E.fresh());
  expect(family.server.wallet.bonus).toBe(0);
  const learner=await family.open('learner');
  await expect(learner.getByRole('heading',{name:'A little maths. A big adventure.'})).toBeVisible();
});

test('Preauthenticated fictional learner completes the connected journey with cloud-fixture saves and parent review',async({family})=>{
  const page=await family.open('learner');
  const key=`jaxon_v3_staging:${family.ref}:${family.uid}:game`;
  const read=()=>page.evaluate(key=>JSON.parse(localStorage.getItem(key)),key);
  if(!(await read()).tourSeen) await click(page,'skip-tour');
  await click(page,'nav:map');await click(page,'world:town');await click(page,'j-start:lentil');
  const before=await read();
  for(let step=0;step<8;step++) {
    const t=await page.evaluate(key=>V5Journey.task(JSON.parse(localStorage.getItem(key))),key);
    if(t.kind==='basket') for(let i=0;i<t.answer.length;i++) for(let n=0;n<t.answer[i];n++) await click(page,`j-part:${i}:1`);
    else if(t.kind==='journey') await click(page,'j-choice:'+t.answer);
    else if(t.kind==='coins') {
      let rest=t.answer;for(const n of [5000,2000,1000,500,200,100,50,20,10,5,2,1]) while(rest>=n) {await click(page,'j-coin:'+n);rest-=n;}
    } else {await page.locator('[data-numeric-answer="journey"]').fill(String(t.answer));await page.waitForFunction(()=>!document.documentElement.hasAttribute('data-saving'));}
    const exact=(await read()).adventure.journeyV1;
    await expect.poll(()=>family.server.progress.adventure?.journeyV1?.values).toEqual(exact.values);
    await page.reload();await expect(page.locator('.journey-progress')).toBeVisible();
    expect((await read()).adventure.journeyV1).toEqual(exact);
    await click(page,'j-submit');expect((await read()).adventure.journeyV1.solved).toBe(true);
    await click(page,'j-next');
  }
  await expect.poll(()=>family.server.progress.adventure?.journeyV1?.done).toBe(true);
  const after=await read();expect(after.adventure.journeyV1.receipts).toHaveLength(2);
  expect(after.coins).toBe(before.coins);expect(after.milestones).toEqual(before.milestones);expect(after.checks).toEqual(before.checks);
  const ledger=JSON.stringify(after.adventure.journeyV1);
  await page.reload();expect(JSON.stringify((await read()).adventure.journeyV1)).toBe(ledger);
  const parent=await family.open('parent');await expect(parent.getByRole('heading',{name:'Staging parent dashboard'})).toBeVisible();
  expect(family.server.calls.filter(c=>c.body.p_operation==='save').length).toBeGreaterThan(8);
});
