// Successful submissions announce briefly, then use the saved next transition.
exports.advance=async page=>{
  await page.waitForFunction(()=>!document.documentElement.hasAttribute('data-saving'));
  await page.waitForFunction(()=>!document.querySelector('[data-action="next-learning"],[data-action="m-next"],[data-action="j-next"],[data-action="next-quest"]'));
};
