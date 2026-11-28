"use strict";
const { test, expect } = require("./helpers/identities.cjs"),
  AxeBuilder = require("@axe-core/playwright").default;
const withoutPractice = (j) => {
  const x = JSON.parse(JSON.stringify(j));
  delete x.employmentInduction.progress;
  return x;
};
for (const build of ["game", "demo"])
  for (const id of ["job-market", "job-work"])
    test(
      "Interactive induction " +
        build +
        " " +
        id +
        ": retry, saved drafts, no rewards and a separate real shift",
      async ({ camp }, info) => {
        const { page: p } = camp;
        const key = build === "demo" ? "jaxon_public_demo_v1" : camp.key;
        const read = () =>
          p.evaluate((k) => JSON.parse(localStorage.getItem(k)), key);
        if (build === "demo") {
          const initial = await camp.read();
          await p.goto("/demo-dist/");
          await p.evaluate(
            ({ key, initial }) =>
              localStorage.setItem(key, JSON.stringify(initial)),
            { key, initial },
          );
        }
        await p.evaluate(
          ({ key, id }) => {
            const s = JSON.parse(localStorage.getItem(key));
            window.V52TownLife.start(s, id, 1);
            localStorage.setItem(key, JSON.stringify(s));
          },
          { key, id },
        );
        await p.reload();
        const guide = p.locator(".town-job-induction"),
          before = await read(),
          run =
            before.adventure.townLifeV2.runs[
              before.adventure.townLifeV2.active
            ];
        await guide.locator("summary").first().click();
        await guide
          .getByRole("button", { name: "Check practice", exact: true })
          .click();
        await expect(guide.locator('[role="status"]')).toContainText(
          "Enter both amounts",
        );
        await guide.getByLabel("Gross pay (£)", { exact: true }).fill("13");
        await guide.getByLabel("Net pay (£)", { exact: true }).fill("11");
        await guide
          .getByRole("button", { name: "Check practice", exact: true })
          .click();
        await expect(guide.locator('[role="status"]')).toContainText(
          "Have another try",
        );
        await expect(
          guide.getByLabel("Net pay (£)", { exact: true }),
        ).toHaveAttribute("aria-invalid", "true");
        await p.reload();
        await expect(
          guide.getByLabel("Gross pay (£)", { exact: true }),
        ).toHaveValue("13");
        await expect(
          guide.getByLabel("Net pay (£)", { exact: true }),
        ).toHaveValue("11");
        await expect(guide.locator('[role="status"]')).toContainText(
          "Have another try",
        );
        await guide.getByLabel("Gross pay (£)", { exact: true }).fill("14.00");
        await guide.getByLabel("Net pay (£)", { exact: true }).fill("12.00");
        await guide.getByLabel("Net pay (£)", { exact: true }).press("Enter");
        await expect(guide.locator('[role="status"]')).toContainText(
          "That’s right",
        );
        await expect(guide.locator('[role="status"]')).toBeFocused();
        await p.clock.install();
        await p.clock.runFor(65000);
        const after = await read(),
          current = after.adventure.townLifeV2.runs[run.id];
        expect(withoutPractice(current)).toEqual(withoutPractice(run));
        for (const field of [
          "coins",
          "earned",
          "minutes",
          "weekly",
          "bonus",
          "activeSeconds",
          "played",
          "screenTime",
          "skills",
          "checks",
          "milestones",
          "history",
          "bought",
          "equipped",
          "startingProfile",
        ])
          expect(after[field], field).toEqual(before[field]);
        expect(current.employmentInduction.progress.attempts).toBe(2);
        expect(current.evidence).toEqual([]);
        expect(current.stage).toBe(0);
        expect(
          (
            await new AxeBuilder({ page: p })
              .include(".town-job-induction")
              .withTags(["wcag2a", "wcag2aa"])
              .analyze()
          ).violations,
        ).toEqual([]);
        expect(
          await p.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth + 1,
          ),
        ).toBe(true);
        await guide.screenshot({
          path:
            "local-evidence/town-teaching-next-20261128/" +
            info.project.name +
            "-" +
            id +
            "-interactive.png",
        });
        await p.reload();
        await expect(
          guide.getByRole("button", { name: "Start your shift", exact: true }),
        ).toBeVisible();
        await guide
          .getByRole("button", { name: "Start your shift", exact: true })
          .click();
        await expect(
          guide.getByLabel("Gross pay (£)", { exact: true }),
        ).not.toBeVisible();
        expect((await read()).adventure.townLifeV2.runs[run.id].stage).toBe(0);
        // A previously saved version-1 guide remains a read-only historical snapshot.
        await p.evaluate((key) => {
          const s = JSON.parse(localStorage.getItem(key)),
            j = window.V52TownLife.state(s);
          j.employmentInduction.version = 1;
          delete j.employmentInduction.progress;
          delete j.employmentInduction.exercise;
          j.futureField = { keep: "exactly" };
          localStorage.setItem(key, JSON.stringify(s));
        }, key);
        const old = await read();
        await p.reload();
        await expect(guide.locator("[data-induction-field]")).toHaveCount(0);
        expect((await read()).adventure.townLifeV2.runs[run.id]).toEqual(
          old.adventure.townLifeV2.runs[run.id],
        );
      },
    );
