"use strict";
const { test, expect } = require("./helpers/identities.cjs"),
  { fixture } = require("./helpers/town-mass-example.cjs");
for (const id of ["cook-pizza", "cook-soup"])
  test(
    "Gram teaching " + id + ": correct units are visible and survive reload",
    async ({ camp }, info) => {
      const { page: p, key, read } = camp,
        state = fixture(id);
      await p.evaluate(
        ({ key, state }) => localStorage.setItem(key, JSON.stringify(state)),
        { key, state },
      );
      await p.reload();
      async function open() {
        await p.locator('.scene-dock [data-scene-open="task"]').click();
        const d = p.locator(".scene-dialog[open]");
        await d
          .getByText("Teaching and an easier example", { exact: true })
          .click();
        await expect(
          d.getByText(
            "A different ingredient needs 150 g. On a scale with 25 g marks, six marks make 150 g: 6 × 25 g = 150 g.",
            { exact: true },
          ),
        ).toBeVisible();
        await expect(
          d.getByText(
            "Read the kitchen scale in grams (g). Start at 0 g and move the marker to the mass the recipe asks for.",
            { exact: true },
          ),
        ).toBeVisible();
        return d;
      }
      const before = await read(),
        d = await open();
      await d.screenshot({
        path:
          "local-evidence/town-mass-examples-20261128/" +
          info.project.name +
          "-" +
          id +
          ".png",
      });
      await p.reload();
      await open();
      const after = await read();
      expect(after.adventure.townLifeV2).toEqual(before.adventure.townLifeV2);
      expect(after.coins).toEqual(before.coins);
      expect(
        await p.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
      ).toBe(true);
    },
  );
