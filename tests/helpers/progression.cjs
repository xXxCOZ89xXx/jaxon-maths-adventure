// Progress stays visible until the learner explicitly activates its Next button.
exports.advance=async page=>{
  await page.waitForFunction(()=>!document.documentElement.hasAttribute('data-saving'));
  const scope=await page.locator('dialog[open]').count()?page.locator('dialog[open]').last():page;
  const next=scope.locator('[data-action="next-learning"]:visible,[data-action="m-next"]:visible,[data-action="j-next"]:visible,[data-action="next-quest"]:visible').first();
  await next.waitFor({state:'visible'});
  await next.click();
  await page.waitForFunction(()=>!document.documentElement.hasAttribute('data-saving'));
};
