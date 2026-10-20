const { test, expect } = require("@playwright/test");
const AxeBuilder = require("@axe-core/playwright").default;
const KEY = "jaxon_v3_fictional_demo_2026";
const action = (p, a) => {
  const locator = p.locator('[data-action="' + a + '"]');
  const click = locator.click.bind(locator);
  locator.click = async (options) => {
    await click(options);
    await p.waitForFunction(
      () => !document.documentElement.hasAttribute("data-saving"),
    );
  };
  return locator;
};
const read = (p) =>
  p.evaluate((key) => JSON.parse(localStorage.getItem(key)), KEY);
async function seed(page, fixture) {
  await page.evaluate(
    ({ key, fixture }) => {
      const state = window.V3Engine.migrate(fixture);
      localStorage.setItem(key, JSON.stringify(state));
    },
    { key: KEY, fixture },
  );
  await page.reload();
}
async function saveWait(page, predicate) {
  await expect
    .poll(async () => {
      const s = await read(page);
      return predicate.includes("equipped")
        ? s.equipped.includes("cap")
        : s.bought.includes("cap");
    })
    .toBe(true);
}
let network = [],
  errors = [];
test.beforeEach(async ({ page, context }) => {
  network = [];
  errors = [];
  await context.route("**/*", async (route) => {
    const u = new URL(route.request().url());
    if (u.hostname !== "127.0.0.1" && u.hostname !== "localhost") {
      network.push(u.origin);
      await route.abort("blockedbyclient");
    } else await route.continue();
  });
  await page.addInitScript(() => {
    window.v3BlockedRequests = [];
    document.addEventListener("securitypolicyviolation", (e) =>
      window.v3BlockedRequests.push(e.blockedURI),
    );
  });
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  await page.goto("/v3-adventure.html");
});
test.afterEach(async ({ page }) => {
  expect(
    await page.evaluate(() => window.v3BlockedRequests || []),
    "No CSP-blocked production attempts",
  ).toEqual([]);
  expect(network, "Zero nonlocal or production requests").toEqual([]);
  expect(errors, "No browser runtime or console errors").toEqual([]);
});
async function accessibility(page) {
  const a = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(
    a.violations.map((v) => ({
      id: v.id,
      nodes: v.nodes.map((n) => n.target),
    })),
  ).toEqual([]);
  await expect(page.locator("body")).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
  ).toBe(true);
}
async function solve(page) {
  const q = await page.evaluate(() => {
    const s = JSON.parse(localStorage.getItem("jaxon_v3_fictional_demo_2026"));
    return { q: s.quest, p: V3Engine.puzzle(s.quest.world, s.quest.i) };
  });
  if (q.p.kind === "line") await action(page, "value:" + q.p.answer).click();
  else if (["fraction", "chance"].includes(q.p.kind)) {
    for (let n = 0; n < q.p.answer; n++)
      await action(page, "part:" + n).click();
  } else if (q.p.kind === "rotate") {
    for (let n = 0; n < q.p.answer / 90; n++)
      await action(page, "rotate").click();
  } else {
    await page.locator('[data-numeric-answer="quest"]').fill(String(q.p.answer));
    await page.waitForFunction(() => !document.documentElement.hasAttribute("data-saving"));
  }
  await action(page, "solve").click();
  await expect(action(page, "next-quest")).toBeVisible();
}
test("Home, tour, map and all eight interactive world quests restore and persist", async ({
  page,
}, info) => {
  // This case completes 24 puzzles plus accessibility checks; each action still has its own timeout.
  test.setTimeout(120000);
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "A little maths.",
  );
  await accessibility(page);
  await page.screenshot({
    path: `tests/artifacts/${info.project.name}-home.png`,
    fullPage: true,
  });
  await action(page, "nav:tour").click();
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "A world",
  );
  await action(page, "finish-tour").click();
  await expect(page.locator(".world-card")).toHaveCount(9);
  await accessibility(page);
  const worlds = await page.evaluate(() =>
    V3Engine.worlds.filter((w) => w.id !== "town").map((w) => w.id),
  );
  for (const id of worlds) {
    await action(page, "world:" + id).click();
    await action(page, "quest:" + id).click();
    await action(page, "begin").click();
    await action(page, "skip").click();
    await expect(page.getByRole("status").first()).toBeVisible();
    expect((await read(page)).milestones).toHaveLength(worlds.indexOf(id) * 3);
    for (let i = 0; i < 3; i++) {
      await solve(page);
      await accessibility(page);
      await action(page, "next-quest").click();
    }
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "Look what you restored",
    );
    await page.locator('nav [data-nav="map"]').click();
  }
  expect((await read(page)).milestones).toHaveLength(24);
  expect((await read(page)).skills).toEqual({});
  await page.reload();
  expect((await read(page)).milestones).toHaveLength(24);
  await page.locator('nav [data-nav="camp"]').click();
  await expect(
    page.getByText("Explorer lodge", { exact: false }),
  ).toBeVisible();
  await page.screenshot({
    path: `tests/artifacts/${info.project.name}-camp.png`,
    fullPage: true,
  });
});
test("Mid-quest Save & Exit and reload resume exact puzzle, selection, hint and milestone", async ({
  page,
}) => {
  await action(page, "continue").first().click();
  await action(page, "begin").click();
  await solve(page);
  await action(page, "next-quest").click();
  await action(page, "value:1").click();
  await action(page, "hint").click();
  const before = (await read(page)).quest;
  await action(page, "nav:home").click();
  await page.reload();
  await action(page, "continue").first().click();
  expect((await read(page)).quest).toEqual(before);
  await expect(page.getByText("PUZZLE 2 / 3", { exact: false })).toBeVisible();
  expect((await read(page)).milestones).toEqual(["number:0"]);
  await page.evaluate(() => {
    navigator.locks.request(
      "jaxon_v3_fictional_demo_2026:transaction",
      () =>
        new Promise((resolve) => {
          window.releaseFocusSave = resolve;
        }),
    );
  });
  await page.waitForFunction(() => !!window.releaseFocusSave);
  await action(page, "value:2").focus();
  await page.keyboard.press("Enter");
  await action(page, "solve").focus();
  await page.evaluate(() => window.releaseFocusSave());
  await page.waitForFunction(
    () => !document.documentElement.hasAttribute("data-saving"),
  );
  await expect(action(page, "solve")).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(action(page, "next-quest")).toBeVisible();
});
test("Lesson, visual tools, independent freshness, help and failed check reteaching", async ({
  page,
}) => {
  await page.locator('nav [data-nav="map"]').click();
  await action(page, "world:number").click();
  await action(page, "learn:place").click();
  await expect(
    page.getByRole("heading", { name: "Build the idea" }),
  ).toBeVisible();
  await action(page, "practice").click();
  await expect(page.locator(".math-tool").first()).toBeVisible();
  const prompts = (await read(page)).learning.qs.map((q) => q[0]);
  for (let i = 0; i < 3; i++) {
    await action(page, "learning-hint").click();
    await action(page, "learning-skip").click();
    await action(page, "next-learning").click();
  }
  expect((await read(page)).skills.place.state).toBe("learning");
  await action(page, "check:place").click();
  const qs = (await read(page)).learning.qs;
  expect(qs.every((q) => !prompts.includes(q[0]))).toBe(true);
  await action(page, "learning-hint").click();
  for (let i = 0; i < 3; i++) {
    const l = (await read(page)).learning;
    const idx = l.qs[i][2].indexOf(l.qs[i][1]);
    await action(page, "answer:" + idx).click();
    await action(page, "next-learning").click();
  }
  expect((await read(page)).checks.place.score).toBe(67);
  expect((await read(page)).checks.place.reteach).toBe(true);
  await action(page, "world:number").click();
  await expect(action(page, "check:place")).toBeDisabled();
  await accessibility(page);
});
test("Shop, avatar across screens, preferences and mock parent summary", async ({
  page,
}) => {
  await seed(page, {
    coins: 200,
    bought: ["fox"],
    equipped: ["fox"],
    milestones: ["number:0"],
    tourSeen: true,
  });
  await page.locator('nav [data-nav="camp"]').click();
  await action(page, "nav:shop").click();
  await expect(page.locator(".shop-item")).toHaveCount(40);
  await action(page, "buy:cap").click();
  await saveWait(page, 's.equipped.includes("cap")');
  expect((await read(page)).coins).toBe(155);
  await expect(page.locator("#headerExplorer svg")).toHaveAttribute(
    "aria-label",
    /Forest cap/,
  );
  await page.locator('nav [data-nav="home"]').click();
  await expect(page.locator("#headerExplorer svg")).toHaveAttribute(
    "aria-label",
    /Forest cap/,
  );
  await page.reload();
  await expect(page.locator("#headerExplorer svg")).toHaveAttribute(
    "aria-label",
    /Forest cap/,
  );
  await page.locator('nav [data-nav="settings"]').click();
  await page.locator('[data-setting="motion"]').check();
  await expect.poll(async () => (await read(page)).settings.motion).toBe(true);
  await page.locator('[data-setting="sound"]').check();
  await expect.poll(async () => (await read(page)).settings.sound).toBe(true);
  await page.reload();
  await expect(page.locator('[data-setting="sound"]')).toBeChecked();
  await accessibility(page);
  await page.locator('footer [data-nav="parent"]').click();
  await expect(
    page.getByText("Offline summary only.", { exact: false }),
  ).toBeVisible();
  await accessibility(page);
});
test("Two tabs serialize purchases and milestones without duplicate rewards", async ({
  page,
  context,
}) => {
  await seed(page, { coins: 100, tourSeen: true });
  await page.locator('nav [data-nav="camp"]').click();
  await action(page, "nav:shop").click();
  const other = await context.newPage();
  await other.goto("/v3-adventure.html");
  await Promise.all([
    action(page, "buy:cap").click(),
    action(other, "buy:cap").click(),
  ]);
  await saveWait(page, 's.bought.includes("cap")');
  expect((await read(page)).coins).toBe(55);
  expect((await read(page)).bought).toEqual(["cap"]);
  await other.close();
});
test("Responsive navigation, focus, touch targets and reduced motion", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.locator('nav [data-nav="map"]').click();
  await expect(page.locator("main")).toBeFocused();
  const small = await page.locator("button:visible").evaluateAll((nodes) =>
    nodes
      .filter((n) => {
        const r = n.getBoundingClientRect();
        return r.width < 44 || r.height < 44;
      })
      .map((n) => n.outerHTML),
  );
  expect(small).toEqual([]);
  await accessibility(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await accessibility(page);
  await action(page, "world:number").click();
  await action(page, "quest:number").click();
  await action(page, "begin").click();
  await accessibility(page);
  await page.screenshot({
    path: "tests/artifacts/phone-quest.png",
    fullPage: true,
  });
});

test("Adaptive discovery, device isolation and offline play preserve fictional state", async ({
  page,
  context,
}) => {
  await page.evaluate(() =>
    localStorage.setItem(
      "jaxon_maths_v2_2026",
      JSON.stringify({ fictionalSentinel: true, coins: 999 }),
    ),
  );
  await page.locator('nav [data-nav="map"]').click();
  await action(page, "world:number").click();
  await action(page, "discover:place").click();
  await accessibility(page);
  for (let i = 0; i < 4; i++) {
    await action(page, "learning-skip").click();
    await action(page, "next-learning").click();
  }
  const state = await read(page);
  expect(state.discovery.place.band).toBe(6);
  expect(state.skills).toEqual({});
  await action(page, "discover:place").click();
  await expect(page.getByText("QUESTION 1 / 4")).toBeVisible();
  await context.setOffline(true);
  await action(page, "learning-hint").click();
  await action(page, "learning-skip").click();
  await action(page, "next-learning").click();
  expect((await read(page)).learning.i).toBe(1);
  await context.setOffline(false);
  await page.reload();
  expect((await read(page)).learning.i).toBe(1);
  expect(
    await page.evaluate(() =>
      JSON.parse(localStorage.getItem("jaxon_maths_v2_2026")),
    ),
  ).toEqual({ fictionalSentinel: true, coins: 999 });
});
test("Visible active learning earns time; simulated hidden and idle time stop earning", async ({
  page,
  context,
}) => {
  await page.clock.install({ time: new Date("2026-10-20T12:00:00Z") });
  await page.reload();
  await page.bringToFront();
  await action(page, "continue").first().click();
  await action(page, "begin").click();
  // Opening a puzzle alone must not accrue rewards.
  await page.clock.runFor(10000);
  expect((await read(page)).minutes).toBe(0);
  await action(page, "value:1").click();
  await page.clock.runFor(10000);
  await expect
    .poll(async () => (await read(page)).minutes)
    .toBeGreaterThan(0.1);
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", {
      configurable: true,
      get: () => true,
    });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  const minutes = (await read(page)).minutes;
  await page.clock.runFor(15000);
  expect((await read(page)).minutes).toBe(minutes);
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", {
      configurable: true,
      get: () => false,
    });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await action(page, "value:1").click();
  await page.clock.runFor(75000);
  const idle = (await read(page)).minutes;
  await page.clock.runFor(15000);
  expect((await read(page)).minutes).toBe(idle);
});
test("Corrupt demo saves remain intact and show a temporary-session warning", async ({
  page,
}) => {
  await page.evaluate(
    (key) => localStorage.setItem(key, "{broken fictional save"),
    KEY,
  );
  await page.reload();
  await expect(page.locator("#status")).toContainText(
    "saved copy has been preserved",
  );
  await page.locator('nav [data-nav="map"]').click();
  await expect(page.locator(".world-card")).toHaveCount(9);
  expect(await page.evaluate((key) => localStorage.getItem(key), KEY)).toBe(
    "{broken fictional save",
  );
});

test("menus, idle movement, no-op edits and refresh cannot renew learning rewards", async ({
  page,
}) => {
  await page.clock.install({ time: new Date("2026-10-20T12:00:00Z") });
  await page.reload();
  await action(page, "continue").first().click();
  await action(page, "begin").click();
  await page.clock.runFor(30000);
  expect((await read(page)).minutes).toBe(0);
  await action(page, "value:1").click();
  await page.clock.runFor(10000);
  const initial = (await read(page)).minutes;
  expect(initial).toBeGreaterThan(0);
  await page.clock.runFor(20000);
  const stopped = (await read(page)).minutes;
  for (let i = 0; i < 5; i++) {
    await page.mouse.move(100 + i * 10, 100);
    await page.keyboard.press("Tab");
    await action(page, "value:1").click();
    await page.clock.runFor(5000);
  }
  expect((await read(page)).minutes).toBe(stopped);
  await page.reload();
  await page.clock.runFor(20000);
  expect((await read(page)).minutes).toBe(stopped);
  await page.locator('nav [data-nav="home"]').click();
  await page.clock.runFor(20000);
  expect((await read(page)).minutes).toBe(stopped);
});

test("World-stage bridge exposes every destination and moves its explorer without changing learning evidence", async ({ page }) => {
  await action(page,"continue").first().click();
  await action(page,"begin").click();
  const initial = await read(page);
  const line = page.getByRole("group",{name:"Bridge number line"});
  const bounds = await line.evaluate(el => {
    const r=el.getBoundingClientRect();
    return {scroll:el.scrollWidth,width:el.clientWidth,buttons:[...el.querySelectorAll("button")].map(b=>{const q=b.getBoundingClientRect();return {label:b.textContent,w:q.width,h:q.height,inside:q.left>=r.left&&q.right<=r.right};})};
  });
  expect(bounds.scroll).toBeLessThanOrEqual(bounds.width+1);
  expect(bounds.buttons.every(b=>b.w>=44&&b.h>=44&&b.inside)).toBe(true);
  const last=bounds.buttons.at(-1).label;
  await line.getByRole("button",{name:last,exact:true}).click();
  await expect(page.getByRole("img",{name:"Bridge marker at "+last})).toBeVisible();
  await page.reload();
  await expect(line.getByRole("button",{name:last,exact:true})).toHaveAttribute("aria-pressed","true");
  const saved=await read(page);
  expect(saved.quest.value).toBe(Number(last));
  expect(saved.milestones).toEqual(initial.milestones);
  expect(saved.skills).toEqual(initial.skills);
  expect(saved.checks).toEqual(initial.checks);
  await accessibility(page);
});

test("Camp places are keyboard links to usable displays; navigation cannot earn rewards", async ({page})=>{
  await page.locator('nav [data-nav="camp"]').click();
  // Navigation persists through Web Locks; click completion is not a save acknowledgement.
  await expect.poll(async () => (await read(page))?.view).toBe("camp");
  const before=await read(page);
  const garden=page.getByRole("link",{name:"Garden",exact:true});
  await garden.focus();await page.keyboard.press("Enter");
  await expect(page.locator("#camp-garden")).toBeInViewport();
  await expect(page.locator('[data-camp-slot="garden"]')).toBeVisible();
  expect(await page.locator(".camp-hotspots a").count()).toBe(4);
  const after=await read(page);
  expect(after.coins).toBe(before.coins);
  expect(after.milestones).toEqual(before.milestones);
  expect(after.weekly).toEqual(before.weekly);
  await accessibility(page);
  await page.setViewportSize({width:390,height:844});
  const links=await page.locator(".camp-hotspots a").evaluateAll(els=>els.map(e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height};}));
  expect(links.every(r=>r.w>=44&&r.h>=44)).toBe(true);
  for(let i=0;i<links.length;i++)for(let j=i+1;j<links.length;j++){
    const a=links[i],b=links[j];
    expect(a.x+a.w<=b.x||b.x+b.w<=a.x||a.y+a.h<=b.y||b.y+b.h<=a.y).toBe(true);
  }
  await accessibility(page);
});

test("Landscape entrances open real expeditions in each original world without granting progress", async ({page})=>{
  const worlds=await page.evaluate(()=>V3Engine.worlds.filter(w=>w.id!=="town").map(w=>w.id));
  for(const id of worlds){
    await page.locator('nav [data-nav="map"]').click();
    await action(page,"world:"+id).click();
    const pins=page.locator(".world-route-pins button");
    await expect(pins).toHaveCount(3);
    const title=(await pins.first().getAttribute("aria-label")).replace(/^Visit /,"");
    await pins.first().click();
    await expect(page.getByRole("heading",{level:1})).toHaveText(title);
    await expect(action(page,"m-begin")).toBeVisible();
  }
  const state=await read(page);
  expect(state.milestones).toEqual([]);
  expect(state.skills).toEqual({});
});
