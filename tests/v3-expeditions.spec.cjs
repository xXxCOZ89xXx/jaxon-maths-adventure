const { test, expect } = require("@playwright/test");
const AxeBuilder = require("@axe-core/playwright").default;
const KEY = "jaxon_v3_fictional_demo_2026";
const saved = (page) =>
  page.evaluate((key) => JSON.parse(localStorage.getItem(key)), KEY);
async function click(page, action) {
  await page
    .locator('[data-action="' + action + '"]')
    .first()
    .click();
  await page.waitForFunction(
    () => !document.documentElement.hasAttribute("data-saving"),
  );
}
async function amount(page, value) {
  await page.locator("#mission-amount").fill(String(value));
  await page.waitForFunction(
    () => !document.documentElement.hasAttribute("data-saving"),
  );
}
async function axe(page) {
  const result = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(
    result.violations.map((v) => ({
      id: v.id,
      nodes: v.nodes.map((n) => n.target),
    })),
  ).toEqual([]);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
  ).toBe(true);
}
const failures = [];
const checkedKinds = new Set();
test.beforeEach(async ({ page, context }) => {
  failures.length = 0;
  checkedKinds.clear();
  await context.route("**/*", async (route) => {
    const u = new URL(route.request().url());
    if (!["127.0.0.1", "localhost"].includes(u.hostname)) {
      failures.push("Nonlocal " + u.origin);
      await route.abort();
    } else await route.continue();
  });
  await context.addInitScript(() => {
    window.v3PolicyErrors = [];
    document.addEventListener("securitypolicyviolation", (e) =>
      window.v3PolicyErrors.push(e.blockedURI),
    );
  });
  page.on("pageerror", (e) => failures.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error") failures.push(m.text());
  });
  await page.goto("/v3-adventure.html");
});
test.afterEach(async ({ page }) => {
  expect(failures).toEqual([]);
  expect(await page.evaluate(() => window.v3PolicyErrors)).toEqual([]);
});
async function solve(page) {
  let s = await saved(page),
    q = s.adventure.active,
    t = q.tasks[q.i];
  await expect(page.getByText("FIRST, BUILD THE IDEA")).toBeVisible();
  await click(page, "m-begin");
  if (!checkedKinds.has(t.kind)) {
    await axe(page);
    checkedKinds.add(t.kind);
  }
  if (["basket", "offers", "blocks", "budget", "array", "chart", "volume"].includes(t.kind)) {
    for (let i = 0; i < t.answer.length; i++) {
      const step = t.kind === "budget" ? 100 : 1;
      for (let n = 0; n < t.answer[i] / step; n++)
        await click(page, `m-part:${i}:${step}`);
    }
  } else if (["order","match"].includes(t.kind)) {
    for(let i=0;i<t.answer.length;i++){await click(page,'h-pick:'+t.answer[i]);await click(page,'h-place:'+i);}
  } else if (["fraction", "chance"].includes(t.kind)) {
    for (let i = 0; i < t.answer; i++) await click(page, "m-select:" + i);
  } else if (t.kind === "grid") {
    for (const i of t.answer) await click(page, "m-select:" + i);
  } else if (t.kind === "coordinate")
    await click(page, `m-point:${t.answer[0]}:${t.answer[1]}`);
  else if (t.kind === "journey") await click(page, "m-choice:" + t.answer);
  else if (t.kind === "coins") {
    let left = t.answer;
    for (const p of [5000, 2000, 1000, 500, 200, 100, 50, 20, 10, 5, 2, 1])
      while (left >= p) {
        await click(page, "m-coin:" + p);
        left -= p;
      }
  } else if (t.kind === "rotate") {
    for (let n = 0; n < t.answer / 90; n++) await click(page, "m-turn");
  } else if (t.kind === "clock") {
    const time =
      String(Math.floor(t.answer / 60)).padStart(2, "0") +
      ":" +
      String(t.answer % 60).padStart(2, "0");
    await page.locator("#arrival-time").fill(time);
    await page.waitForFunction(
      () => !document.documentElement.hasAttribute("data-saving"),
    );
  } else if (t.kind === "line") await click(page, "m-value:" + t.answer);
  else {
    if (t.kind === "bank")
      for (let i = 0; i < t.transactions.length; i++)
        await click(page, "m-post:" + i);
    await amount(page, t.answer);
  }
  await click(page, "m-submit");
  await expect(
    page.locator('.mission-task .feedback[role="status"]'),
  ).toContainText("That works!");
}
async function finish(page) {
  for (let i = 0; i < 3; i++) {
    await solve(page);
    await click(page, "m-next");
  }
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "A visit worth remembering",
  );
}
test("Practical Town: all eight venues teach and complete actual tasks, restore town and decorate camp", async ({
  page,
}, info) => {
  test.setTimeout(120000);
  await page.locator('nav [data-nav="map"]').click();
  await expect(page.locator(".world-card")).toHaveCount(9);
  await click(page, "world:town");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Practical Maths Town",
  );
  await expect(page.locator(".town-hotspots button")).toHaveCount(8);
  await axe(page);
  await page.screenshot({
    path: `tests/artifacts/${info.project.name}-town.png`,
    fullPage: true,
  });
  const venues = await page.evaluate(() => V3Town.venues.map((v) => v.id));
  for (const venue of venues) {
    await page.locator("[data-mission-tier]").selectOption("1");
    await page.waitForFunction(
      () => !document.documentElement.hasAttribute("data-saving"),
    );
    await click(page, `mission:town:${venue}:1`);
    await finish(page);
    await click(page, "world:town");
  }
  const s = await saved(page);
  expect(Object.keys(s.adventure.records)).toHaveLength(8);
  expect(s.milestones).toHaveLength(8);
  expect(s.skills).toEqual({});
  await expect(page.getByText("3/3 LANDMARKS RESTORED")).toBeVisible();
  await page.locator('nav [data-nav="camp"]').click();
  await page.getByText("Your discoveries · achievement journal", {exact:true}).click();
  await expect(page.getByText("Town neighbour · earned")).toBeVisible();
  await expect(page.locator(".keepsake")).toHaveCount(8);
  await page.locator('[data-camp-slot="shelf"]').selectOption("town|market");
  await page.waitForFunction(
    () => !document.documentElement.hasAttribute("data-saving"),
  );
  await page.reload();
  await expect(page.locator('[data-camp-slot="shelf"]')).toHaveValue(
    "town|market",
  );
  await expect(page.locator(".camp-map .camp-scene title")).toContainText(
    "Market basket at camp shelf",
  );
  await axe(page);
  await page.screenshot({
    path: `tests/artifacts/${info.project.name}-collection.png`,
    fullPage: true,
  });
});
test("Optional gateways across all nine worlds vary interactions and preserve finite rewards", async ({
  page,
}) => {
  test.setTimeout(120000);
  const worlds = await page.evaluate(() => V3Engine.worlds.map((w) => w.id));
  for (const world of worlds) {
    await page.locator('nav [data-nav="map"]').click();
    await click(page, "world:" + world);
    await page.locator("[data-mission-tier]").selectOption("2");
    await page.waitForFunction(
      () => !document.documentElement.hasAttribute("data-saving"),
    );
    await click(page, `mission:${world}:gateway:2`);
    await finish(page);
  }
  const before = await saved(page);
  expect(before.milestones).toHaveLength(9);
  await page.locator('nav [data-nav="map"]').click();
  await click(page, "world:number");
  await click(page, "mission:number:gateway:2");
  await finish(page);
  expect((await saved(page)).milestones).toEqual(before.milestones);
  expect(Object.keys((await saved(page)).adventure.records)).toHaveLength(9);
});
test("Hands-on town task saves exact selections, help and latest activity; higher level is freely available", async ({
  page,
}) => {
  await page.locator('nav [data-nav="map"]').click();
  await click(page, "world:town");
  await page.locator("[data-mission-tier]").selectOption("3");
  await page.waitForFunction(
    () => !document.documentElement.hasAttribute("data-saving"),
  );
  await click(page, "mission:town:market:3");
  await click(page, "m-begin");
  await click(page, "m-part:0:1");
  await click(page, "m-worked");
  const q = (await saved(page)).adventure.active;
  await click(page, "nav:home");
  await page.reload();
  await click(page, "continue");
  expect((await saved(page)).adventure.active).toEqual(q);
  await page.locator('nav [data-nav="map"]').click();
  await click(page, "world:algebra");
  await click(page, "mission:algebra:2:1");
  await click(page, "nav:home");
  await page.reload();
  await click(page, "continue");
  expect((await saved(page)).adventure.active.world).toBe("algebra");
  await page.locator('nav [data-nav="map"]').click();
  await click(page, "world:town");
  await click(page, "mission:town:market:3");
  expect((await saved(page)).adventure.active).toEqual(q);
  expect((await saved(page)).milestones).toHaveLength(0);
  await page.setViewportSize({ width: 390, height: 844 });
  await axe(page);
});
test("New town lessons and fresh checks keep assistance out of mastery, even after restored town visits", async ({
  page,
}) => {
  await page.locator('nav [data-nav="map"]').click();
  await click(page, "world:town");
  await page.locator(".town-lessons summary").click();
  await expect(
    page.locator('[data-action="check:town_balance"]'),
  ).toBeDisabled();
  await click(page, "learn:town_balance");
  await expect(
    page.getByText("Easier example:", { exact: false }),
  ).toBeVisible();
  await click(page, "practice");
  const practice = (await saved(page)).learning.qs.map((q) => q[0]);
  for (let i = 0; i < 3; i++) {
    await click(page, "learning-skip");
    await click(page, "next-learning");
  }
  await click(page, "check:town_balance");
  const l = (await saved(page)).learning;
  expect(l.qs.every((q) => !practice.includes(q[0]))).toBe(true);
  for (let i = 0; i < 3; i++) {
    const next = (await saved(page)).learning;
    await click(page, "answer:" + next.qs[i][2].indexOf(next.qs[i][1]));
    await click(page, "next-learning");
  }
  expect((await saved(page)).checks.town_balance.stage).toBe(1);
  expect((await saved(page)).skills.town_balance.state).toBe("review");
  await click(page, "world:town");
  await expect(
    page.locator('[data-action="check:town_balance"]'),
  ).toBeDisabled();
});
test("Concurrent mission completion grants one milestone and camp projects need durable evidence", async ({
  page,
  context,
}) => {
  await page.evaluate((key) => {
    const s = V3Engine.fresh();
    V3Adventure.start(s, "town", "market", 1);
    s.adventure.active.i = 2;
    s.adventure.active.phase = "play";
    s.adventure.active.solved = true;
    s.adventure.active.unassisted = 2;
    localStorage.setItem(key, JSON.stringify(s));
  }, KEY);
  await page.reload();
  const other = await context.newPage();
  await other.goto("/v3-adventure.html");
  await page.evaluate(() => {
    navigator.locks.request(
      "jaxon_v3_fictional_demo_2026:transaction",
      () =>
        new Promise((resolve) => {
          window.releaseMissionSave = resolve;
        }),
    );
  });
  await page.waitForFunction(() => !!window.releaseMissionSave);
  await Promise.all([
    page.locator('[data-action="m-next"]').click(),
    other.locator('[data-action="m-next"]').click(),
  ]);
  await page.evaluate(() => window.releaseMissionSave());
  await expect.poll(async () => (await saved(page)).milestones.length).toBe(1);
  expect(Object.keys((await saved(page)).adventure.records)).toHaveLength(1);
  await other.close();
  await page.locator('nav [data-nav="camp"]').click();
  await expect(
    page.locator('[data-action="camp-build:greenhouse"]'),
  ).toBeDisabled();
});
test("Higher levels use negative coordinates and composed clockwise/anticlockwise turns", async ({
  page,
}) => {
  test.setTimeout(60000);
  await page.locator('nav [data-nav="map"]').click();
  await click(page, "world:algebra");
  await page.locator("[data-mission-tier]").selectOption("3");
  await page.waitForFunction(
    () => !document.documentElement.hasAttribute("data-saving"),
  );
  await click(page, "mission:algebra:2:3");
  expect((await saved(page)).adventure.active.tasks[0].answer).toEqual([
    -2, -1,
  ]);
  await finish(page);
  await page.locator('nav [data-nav="map"]').click();
  await click(page, "world:geometry");
  await page.locator("[data-mission-tier]").selectOption("3");
  await page.waitForFunction(
    () => !document.documentElement.hasAttribute("data-saving"),
  );
  await click(page, "mission:geometry:0:3");
  expect(
    (await saved(page)).adventure.active.tasks.map((t) => t.answer),
  ).toEqual([270, 0, 180]);
  await finish(page);
});

test("Purpose-built Town entrances open their own interiors and exterior views preserve the exact task",async({page})=>{
  test.setTimeout(90000);
  const venues=await page.evaluate(()=>V3Town.venues.map(v=>({id:v.id,name:v.name})));
  for(let i=0;i<venues.length;i++){
    await page.locator('nav [data-nav="map"]').click();await click(page,'world:town');
    const pin=page.locator('.town-hotspots button').nth(i);await expect(pin).toHaveAttribute('aria-label','Enter '+venues[i].name);await pin.click();
    await expect(page.getByRole('heading',{level:1})).toHaveText(venues[i].name);
    await expect(page.locator('.location-scene')).toHaveClass(new RegExp('interior-'+venues[i].id));
    const before=await saved(page);await click(page,'venue-view:exterior');await expect(page.locator('.exterior-scene')).toBeVisible();
    await click(page,'venue-view:interior');expect((await saved(page)).adventure.active).toEqual(before.adventure.active);
    expect((await saved(page)).coins).toBe(before.coins);await click(page,'m-begin');await expect(page.locator('.task-controls')).toBeVisible();
  }
  await axe(page);
});

test("All eight camp homes render actual upgrades and reduced motion stops watermill machinery",async({page})=>{
  test.setTimeout(90000);
  for(let stage=1;stage<=8;stage++){
    await page.evaluate(({stage,key})=>{const s=V3Engine.fresh();s.view='camp';s.tourSeen=true;s.settings.motion=true;s.bought=['cap','fox'];s.equipped=['cap','fox'];s.coins=83.5;s.milestones=V3Adventure.campMilestoneIds().slice(0,V3Adventure.campStages[stage-1].need);localStorage.setItem(key,JSON.stringify(s));},{stage,key:KEY});
    await page.reload();const scene=page.locator('.camp-map>.camp-scene');await expect(scene).toHaveAttribute('data-camp-stage',String(stage));
    await expect(page.locator('.estate-track button')).toHaveCount(8);
    if(stage>=3)await expect(scene.locator('[data-estate-part="residence-'+stage+'"]').first()).toBeVisible();
    if(stage>=6){await expect(scene.locator('[data-estate-part="watermill"]')).toBeVisible();await expect(scene.locator('[data-estate-part="storage-tank-and-pipework"]')).toBeVisible();}
    if(stage>=7)await expect(scene.locator('[data-estate-part="private-power-grid"]')).toBeVisible();
    const s=await saved(page);expect(s.bought).toEqual(['cap','fox']);expect(s.equipped).toEqual(['cap','fox']);expect(s.coins).toBe(83.5);expect(s.skills).toEqual({});
    if(stage===1||stage===8)await axe(page);
  }
  await page.emulateMedia({reducedMotion:'reduce'});
  expect(await page.locator('.camp-map .mill-wheel').evaluate(el=>getComputedStyle(el).animationName)).toBe('none');
  await page.emulateMedia({reducedMotion:'no-preference'});
  expect(await page.locator('.camp-map .mill-wheel').evaluate(el=>getComputedStyle(el).animationName)).toBe('mill-turn');
  await page.reload();await expect(page.locator('.camp-map>.camp-scene')).toHaveAttribute('data-camp-stage','8');
});

test("Camp upgrade celebration and previews preserve history and cannot earn a mansion, coins, mastery or time",async({page})=>{
  await page.clock.install({time:new Date('2026-10-20T12:00:00Z')});
  await page.evaluate(key=>{const s=V3Engine.fresh();s.view='camp';s.tourSeen=true;s.coins=71.25;s.milestones=V3Adventure.campMilestoneIds().slice(0,3);V3Adventure.state(s).campProjects.greenhouse=true;V3Adventure.state(s).historical={keep:17};s.milestones.push(V3Adventure.campMilestoneIds()[3]);localStorage.setItem(key,JSON.stringify(s));},KEY);
  await page.reload();await expect(page.locator('.estate-celebration')).toBeVisible();const before=await saved(page);
  await click(page,'camp-preview:8');await expect(page.locator('.estate-preview')).toHaveAttribute('data-camp-stage','8');
  await expect(page.locator('.camp-map>.camp-scene')).toHaveAttribute('data-camp-stage','2');await click(page,'camp-celebrate');
  await page.clock.runFor(30000);await page.reload();const after=await saved(page);
  expect(after.adventure.campEstate.highest).toBe(2);expect(after.adventure.campEstate.celebrated).toBe(2);expect(after.adventure.historical).toEqual({keep:17});expect(after.adventure.campProjects.greenhouse).toBe(true);
  for(const key of ['coins','earned','minutes','weekly','milestones','skills','checks','bought','equipped'])expect(after[key]).toEqual(before[key]);
  await expect(page.locator('.estate-celebration')).toHaveCount(0);
});
