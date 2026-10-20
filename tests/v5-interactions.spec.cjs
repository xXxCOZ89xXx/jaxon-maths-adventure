const { test, expect } = require("@playwright/test"),
  AxeBuilder = require("@axe-core/playwright").default;
const KEY = "jaxon_v3_fictional_demo_2026";
const state = (p) =>
  p.evaluate((k) => JSON.parse(localStorage.getItem(k)), KEY);
async function click(p, action) {
  await p
    .locator('[data-action="' + action + '"]')
    .first()
    .click();
  await p.waitForFunction(
    () => !document.documentElement.hasAttribute("data-saving"),
  );
}
async function mission(p, world, route, tier = 1, step = 0) {
  await p.evaluate(
    ({ KEY, world, route, tier, step }) => {
      const s = V3Engine.fresh();
      s.tourSeen = true;
      V3Adventure.start(s, world, route, tier);
      s.adventure.active.i = step;
      V3Adventure.begin(s);
      localStorage.setItem(KEY, JSON.stringify(s));
    },
    { KEY, world, route, tier, step },
  );
  await p.reload();
}
async function axe(p) {
  expect(
    (
      await new AxeBuilder({ page: p })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze()
    ).violations.map((v) => ({
      id: v.id,
      nodes: v.nodes.map((n) => n.target),
    })),
  ).toEqual([]);
  expect(
    await p.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
  ).toBe(true);
}
let errors = [];
test.beforeEach(async ({ page, context }) => {
  errors = [];
  await context.route("**/*", (r) => {
    if (
      ["127.0.0.1", "localhost"].includes(new URL(r.request().url()).hostname)
    )
      return r.continue();
    errors.push("Nonlocal request");
    return r.abort();
  });
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  await page.goto("/v3-adventure.html");
});
test.afterEach(() => expect(errors).toEqual([]));

test("V5 Cartesian axes use unlabelled intersections, negative ticks, arrow navigation and exact resumption", async ({
  page,
}) => {
  await mission(page, "algebra", "2", 3);
  await expect(page.locator(".cartesian-point")).toHaveCount(25);
  expect(await page.locator(".cartesian-point").allTextContents()).toEqual(
    Array(25).fill("•"),
  );
  await expect(page.locator(".cartesian-plot svg")).toContainText("x");
  await expect(page.locator(".cartesian-plot svg")).toContainText("y");
  await expect(page.locator(".cartesian-plot svg")).toContainText("-2");
  expect(
    await page.locator('.cartesian-point[aria-pressed="true"]').count(),
  ).toBe(0);
  const first = page.locator('[data-cx="-2"][data-cy="2"]');
  await first.focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.locator('[data-cx="-1"][data-cy="2"]')).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator(".cartesian-plane output")).toHaveText(
    "Selected point: (-1, 2)",
  );
  await page.reload();
  await expect(page.locator('[data-cx="-1"][data-cy="2"]')).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  const s = await state(page),
    answer = s.adventure.active.tasks[0].answer;
  await click(page, "m-point:" + answer.join(":"));
  await click(page, "m-submit");
  await expect(
    page.getByText("That works! Your plan is ready.", { exact: true }),
  ).toBeVisible();
  await axe(page);
});

test("V5 fraction shading supports tap, unshade and pointer painting without accidental extra toggle", async ({
  page,
}) => {
  await mission(page, "fractions", "0", 3);
  const cells = page.locator(".mission-parts .part");
  const tap = async (i) =>
    test.info().project.use.hasTouch
      ? cells.nth(i).tap()
      : cells.nth(i).click();
  await expect(cells).toHaveCount(8);
  await tap(0);
  await expect(cells.nth(0)).toHaveAttribute("aria-pressed", "true");
  await tap(0);
  await expect(cells.nth(0)).toHaveAttribute("aria-pressed", "false");
  const bounds = await cells.evaluateAll((els) =>
    els.map((e) => {
      const r = e.getBoundingClientRect();
      return {
        x: r.x + r.width / 2,
        y: r.y + r.height / 2,
        w: r.width,
        h: r.height,
      };
    }),
  );
  expect(bounds.every((b) => b.w >= 44 && b.h >= 44)).toBe(true);
  // Touch Pointer Events exercise the real shared gesture handler and hit testing. Physical Safari scrolling remains a later gate.
  await page.evaluate((b) => {
    const a = document.elementFromPoint(b[0].x, b[0].y);
    a.dispatchEvent(
      new PointerEvent("pointerdown", {
        bubbles: true,
        pointerId: 17,
        pointerType: "touch",
        clientX: b[0].x,
        clientY: b[0].y,
      }),
    );
    document.dispatchEvent(
      new PointerEvent("pointermove", {
        bubbles: true,
        pointerId: 17,
        pointerType: "touch",
        clientX: b[1].x,
        clientY: b[1].y,
      }),
    );
    document.dispatchEvent(
      new PointerEvent("pointerup", {
        bubbles: true,
        pointerId: 17,
        pointerType: "touch",
      }),
    );
  }, bounds);
  await expect
    .poll(
      async () =>
        ((await state(page)).adventure.active.values.selected || []).length,
    )
    .toBe(2);
  await page.reload();
  await expect(cells.nth(0)).toHaveAttribute("aria-pressed", "true");
  await expect(cells.nth(1)).toHaveAttribute("aria-pressed", "true");
  await tap(1);
  await expect(cells.nth(1)).toHaveAttribute("aria-pressed", "false");
  await axe(page);
});

test("V5 ordering, arrays, matching and chart construction validate actual objects and preserve wrong-first evidence", async ({
  page,
}) => {
  for (const [world, route, step] of [
    ["number", "2", 0],
    ["number", "2", 1],
    ["ratio", "1", 1],
    ["statistics", "0", 0],
  ]) {
    await mission(page, world, route, 2, step);
    await click(page, "m-submit");
    await expect(page.getByText(/Let’s adjust this together/)).toBeVisible();
    let s = await state(page),
      t = s.adventure.active.tasks[step];
    if (["order", "match"].includes(t.kind))
      for (let i = 0; i < t.answer.length; i++) {
        await click(page, "h-pick:" + t.answer[i]);
        await click(page, "h-place:" + i);
      }
    else
      for (let i = 0; i < t.answer.length; i++)
        for (let n = 0; n < t.answer[i]; n++)
          await click(page, "m-part:" + i + ":1");
    const values = (await state(page)).adventure.active.values;
    await page.reload();
    expect((await state(page)).adventure.active.values).toEqual(values);
    await click(page, "m-submit");
    s = await state(page);
    expect(s.adventure.active.solved).toBe(true);
    expect(s.adventure.active.evidence[0].correct).toBe(false);
    expect(s.adventure.active.unassisted).toBe(0);
    await axe(page);
  }
});

test("V5 spinner sectors and measuring ruler are usable on tablets and keep real model quantities", async ({
  page,
}) => {
  await mission(page, "probability", "2", 2);
  await expect(page.locator(".model-spinner button")).toHaveCount(6);
  await click(page, "m-select:0");
  await expect(page.locator(".model-spinner")).toHaveCSS(
    "background-image",
    /conic-gradient/,
  );
  await axe(page);
  await mission(page, "measure", "0", 1);
  await expect(
    page.getByRole("group", { name: "Measuring ruler" }),
  ).toBeVisible();
  const s = await state(page),
    answer = s.adventure.active.tasks[0].answer;
  await page.locator("#mission-amount").fill(String(answer));
  await page.waitForFunction(
    () => !document.documentElement.hasAttribute("data-saving"),
  );
  await click(page, "m-submit");
  expect((await state(page)).adventure.active.solved).toBe(true);
  await axe(page);
  await mission(page, "measure", "2", 2, 1);
  const dims = (await state(page)).adventure.active.tasks[1].answer;
  for (let i = 0; i < 3; i++)
    for (let n = 0; n < dims[i]; n++) await click(page, "m-part:" + i + ":1");
  await expect(page.locator(".volume-layers section")).toHaveCount(dims[2]);
  await click(page, "m-submit");
  expect((await state(page)).adventure.active.solved).toBe(true);
  await axe(page);
});

test("V5 constructed practice can retry with support while independent checks never show response models", async ({
  page,
}) => {
  await page.evaluate((KEY) => {
    const s = V3Engine.fresh();
    s.tourSeen = true;
    V3Engine.generate(
      s,
      "operations",
      "practice",
      JaxonFreshReview,
      V3Curriculum,
    );
    s.learning.started = true;
    s.view = "practice";
    localStorage.setItem(KEY, JSON.stringify(s));
  }, KEY);
  await page.reload();
  await expect(page.locator(".practice-manipulative")).toBeVisible();
  await click(page, "p5-submit");
  let s = await state(page);
  expect(s.learning.assisted).toBe(true);
  expect(s.learning.answered).toBe(false);
  expect(s.learning.responses[0].correct).toBe(false);
  const value = Number(s.learning.qs[0][1]);
  for (const n of [1000, 100, 10, 1])
    for (let i = 0; i < Math.floor(value / n) % 10; i++)
      await click(page, "p5-add:" + n);
  await click(page, "p5-submit");
  s = await state(page);
  expect(s.learning.answered).toBe(true);
  expect(s.learning.correct).toBe(0);
  expect(s.checks).toEqual({});
  await axe(page);
  await page.evaluate((KEY) => {
    const s = JSON.parse(localStorage.getItem(KEY));
    s.practice.operations = { completed: true };
    V3Engine.generate(s, "operations", "check", JaxonFreshReview, V3Curriculum);
    localStorage.setItem(KEY, JSON.stringify(s));
  }, KEY);
  await page.reload();
  await expect(page.locator(".practice-manipulative")).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "Your own thinking" }),
  ).toBeVisible();
});

test("V5 practical response builders preserve pence and minute units",async({page})=>{for(const id of ['town_money','town_timetable']){await page.evaluate(({KEY,id})=>{const s=V3Engine.fresh();s.tourSeen=true;V3Engine.generate(s,id,'practice',JaxonFreshReview,V3Curriculum);s.learning.started=true;s.view='practice';localStorage.setItem(KEY,JSON.stringify(s));},{KEY,id});await page.reload();const value=Number((await state(page)).learning.qs[0][1]);if(id==='town_money'){await expect(page.locator('.practice-manipulative')).toContainText('pence');let rest=value;for(const n of [5000,2000,1000,500,200,100,50,20,10,5,2,1])while(rest>=n){await click(page,'p5-add:'+n);rest-=n;}}else{await expect(page.locator('.practice-manipulative')).toContainText('minutes');for(const n of [1000,100,10,1])for(let i=0;i<Math.floor(value/n)%10;i++)await click(page,'p5-add:'+n);}await click(page,'p5-submit');const result=await state(page);expect(result.learning.responses[0].answer).toBe(String(value));expect(result.learning.responses[0].correct).toBe(true);expect(result.learning.responses[0].firstIndependent).toBe(false);await axe(page);}});

test("V5 worker and customer roles share the supermarket; a complete recipe journey carries exact list, fare, inventory and payments", async ({
  page,
}) => {
  await mission(page, "town", "market");
  await expect(page.locator(".guide .badge")).toHaveText("worker context");
  await page.locator('nav [data-nav="map"]').click();
  await click(page, "world:town");
  await click(page, "j-start:bolognese");
  const initial = await state(page);
  let visits = 0;
  while (!(await state(page)).adventure.journeyV1.done) {
    const s = await state(page),
      j = s.adventure.journeyV1,
      t = await page.evaluate(() =>
        V5Journey.task(
          JSON.parse(localStorage.getItem("jaxon_v3_fictional_demo_2026")),
        ),
      );
    if (j.stage === 3) {
      await expect(page.locator(".interior-market")).toBeVisible();
      await expect(page.locator(".journey-progress")).toContainText(
        "customer context",
      );
      expect(j.shoppingList).toEqual([1, 1, 2]);
    }
    if (t.kind === "basket")
      for (let i = 0; i < t.answer.length; i++)
        for (let n = 0; n < t.answer[i]; n++)
          await click(page, "j-part:" + i + ":1");
    else if (t.kind === "journey") await click(page, "j-choice:" + t.answer);
    else if (t.kind === "coins") {
      let n = t.answer;
      for (const p of [500, 200, 100, 50, 20, 10, 5, 2, 1])
        while (n >= p) {
          await click(page, "j-coin:" + p);
          n -= p;
        }
    } else
      for (let n = 0; n < t.answer / t.step; n++)
        await click(page, "j-adjust:" + t.step);
    const exact = (await state(page)).adventure.journeyV1;
    await page.reload();
    expect((await state(page)).adventure.journeyV1).toEqual(exact);
    await click(page, "j-submit");
    await expect(
      page.getByText("Ready for the next part of the journey.", {
        exact: true,
      }),
    ).toBeVisible();
    await axe(page);
    await click(page, "j-next");
    expect(++visits).toBeLessThan(10);
  }
  const final = await state(page);
  expect(final.adventure.journeyV1.cash).toBe(470);
  expect(final.adventure.journeyV1.inventory).toEqual([0, 0, 0]);
  expect(final.adventure.journeyV1.receipts).toHaveLength(2);
  expect(final.coins).toBe(initial.coins);
  expect(final.milestones).toEqual(initial.milestones);
  expect(final.checks).toEqual(initial.checks);
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "The recipe is ready." }),
  ).toBeVisible();
  await axe(page);
});
