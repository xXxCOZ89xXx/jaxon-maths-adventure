"use strict";
const { test, expect } = require("./helpers/identities.cjs");
const AxeBuilder = require("@axe-core/playwright").default;
for (const id of ["job-market", "job-work"])
  test(`G28 ${id}: new employee guide and old snapshots`, async ({
    camp,
  }, info) => {
    const { page, key, read } = camp;
    await page.evaluate(
      ({ key, id }) => {
        const s = JSON.parse(localStorage.getItem(key));
        window.V52TownLife.start(s, id, 1);
        localStorage.setItem(key, JSON.stringify(s));
      },
      { key, id },
    );
    await page.reload();
    const guide = page.locator(".town-job-induction");
    await expect(guide).toHaveCount(1);
    const before = await read();
    const run =
      before.adventure.townLifeV2.runs[before.adventure.townLifeV2.active];
    await guide.locator("summary").first().focus();
    await page.keyboard.press("Enter");
    await expect(
      guide.getByRole("heading", { name: "Before your first shift" }),
    ).toBeVisible();
    await guide.locator("details summary").focus();
    await page.keyboard.press("Enter");
    await expect(guide.getByText(/Net pay is £14/)).toBeVisible();
    expect((await read()).adventure.townLifeV2.runs[run.id]).toEqual(run);
    expect((await read()).checks).toEqual(before.checks);
    expect((await read()).milestones).toEqual(before.milestones);
    expect(
      (
        await new AxeBuilder({ page })
          .include(".town-job-induction")
          .withTags(["wcag2a", "wcag2aa"])
          .analyze()
      ).violations,
    ).toEqual([]);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
    ).toBe(true);
    await page.screenshot({
      path: `local-evidence/g28-town/${info.project.name}-${id}.png`,
      fullPage: true,
    });
    await page.reload();
    await expect(page.locator(".town-job-induction")).toHaveCount(1);
    await page.evaluate((key) => {
      const s = JSON.parse(localStorage.getItem(key)),
        j = window.V52TownLife.state(s);
      delete j.employmentInduction;
      j.steps[0].teach = "Historical saved shift teaching";
      j.steps[0].example = "Historical example";
      j.steps[0].questionKey = "saved:shift:0042";
      j.values = { choice: 1 };
      localStorage.setItem(key, JSON.stringify(s));
    }, key);
    const historical = await read();
    await page.reload();
    await expect(page.locator(".town-job-induction")).toHaveCount(0);
    const after = await read();
    expect(after.adventure.townLifeV2.runs[run.id]).toEqual(
      historical.adventure.townLifeV2.runs[run.id],
    );
  });
