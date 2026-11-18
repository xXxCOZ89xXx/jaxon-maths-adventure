const {test,expect}=require('@playwright/test');
const F=require('./helpers/guided-progression.cjs');
const KEY='jaxon_v3_fictional_demo_2026';

test.beforeEach(async({page})=>{
  await require('./helpers/starting-profile.cjs').browser(page);
  await page.route('**/*',r=>new URL(r.request().url()).origin==='http://127.0.0.1:4173'?r.continue():r.abort());
  await page.emulateMedia({reducedMotion:'reduce'});
});

async function seed(page,state){
  await page.goto('/v3-adventure.html');
  await page.evaluate(({key,state})=>localStorage.setItem(key,JSON.stringify(state)),{key:KEY,state});
  await page.reload();
  await page.locator('#main h1').waitFor();
}

test('a skipped answer and a solved Town step wait for the learner to continue',async({page})=>{
  const s=F.fresh();
  s.learning={id:'town_money',mode:'check',round:1,started:true,qs:[['What is 2 + 2?','4',['3','4','5','6'],'Add two and two.','2 + 2 = 4.'],['What is 3 + 2?','5',['3','4','5','6'],'Add three and two.','3 + 2 = 5.']],i:0,correct:0,answered:false,assisted:false};
  s.view=s.resumeView='check';
  await seed(page,s);
  await page.locator('[data-action="learning-skip"]').click();
  await expect(page.locator('.feedback[role="status"]')).toContainText('2 + 2 = 4.');
  const nextLearning=page.locator('[data-action="next-learning"]');
  await expect(nextLearning).toBeVisible();
  await expect(nextLearning).toBeFocused();
  await page.waitForTimeout(3100);
  await expect(page.locator('.feedback[role="status"]')).toContainText('2 + 2 = 4.');
  await expect(nextLearning).toBeVisible();
  expect((await page.evaluate(k=>JSON.parse(localStorage.getItem(k)),KEY)).learning.i).toBe(0);
  await nextLearning.click();
  await expect.poll(()=>page.evaluate(k=>JSON.parse(localStorage.getItem(k)).learning?.i,KEY)).toBe(1);

  const town=F.fresh();
  expect(F.L.start(town,'travel-library',1)).toBe(true);
  expect(F.L.action(town,'j-skip')).toBe(true);
  const stage=F.L.state(town).stage;
  await seed(page,town);
  const scope=await page.locator('dialog[open]').count()?page.locator('dialog[open]').last():page;
  const nextTown=scope.locator('[data-action="j-next"]:visible').first();
  await expect(nextTown).toBeVisible();
  await expect(scope.locator('.feedback[role="status"]:visible').first()).toContainText('Skipped with help.');
  await page.waitForTimeout(3100);
  await expect(nextTown).toBeVisible();
  expect((await page.evaluate(k=>V52TownLife.state(JSON.parse(localStorage.getItem(k))).stage,KEY))).toBe(stage);
  await nextTown.click();
  await expect.poll(()=>page.evaluate(k=>V52TownLife.state(JSON.parse(localStorage.getItem(k))).stage,KEY)).toBe(stage+1);
});
