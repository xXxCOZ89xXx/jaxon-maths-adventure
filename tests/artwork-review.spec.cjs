const { test, expect } = require("@playwright/test"),
  fs = require("fs"),
  path = require("path");
const F = require("./helpers/guided-progression.cjs"),
  E = F.E;
const out = path.resolve("local-evidence/artwork-20261128");
const ready = async (p) => {
  await p.waitForFunction(
    () => !document.documentElement.hasAttribute("data-saving"),
  );
  await p.evaluate(() =>
    Promise.all([...document.images].map((i) => i.decode().catch(() => {}))),
  );
};
async function seed(p, s, key, url) {
  await p.goto(url);
  await p.evaluate(
    ({ s, key }) => localStorage.setItem(key, JSON.stringify(s)),
    { s, key },
  );
  await p.reload();
  await ready(p);
}
for (const demo of [false, true]) {
  const key = demo ? "jaxon_public_demo_v1" : "jaxon_v3_fictional_demo_2026",
    url = demo ? "/demo-dist/" : "/v3-adventure.html",
    kind = demo ? "demo" : "game";
  test.describe(kind, () => {
    test.beforeEach(async ({ page: p }) => {
      p.errors = [];
      p.external = [];
      p.on("pageerror", (e) => p.errors.push(e.message));
      await p.route("**/*", (r) => {
        if (new URL(r.request().url()).origin === "http://127.0.0.1:4173")
          return r.continue();
        p.external.push(r.request().url());
        return r.abort();
      });
      await p.emulateMedia({ reducedMotion: "reduce" });
    });
    test.afterEach(async ({ page: p }) => {
      expect(p.errors).toEqual([]);
      expect(p.external).toEqual([]);
    });
    test("all 52 active wardrobe images fit both explorers and rendering preserves the complete save", async ({
      page: p,
    }, info) => {
      const s = F.fresh();
      s.view = "shop";
      s.bought = [
        ...require("../v3/curriculum").V3Curriculum.catalog.map((i) => i.id),
        ...E.colourCatalog.map((i) => i.id),
      ];
      s.equipped = ["cap", "hoodie", "wings", "glasses", "fox"];
      s.coins = 123;
      s.settings.avatarCharacter = "boy";
      s.customFuture = { retained: "exactly" };
      await seed(p, s, key, url);
      const result = await p.evaluate(() => {
        const A = window.V3Art,
          E = window.V3Engine,
          C = window.V3Curriculum,
          rows = [];
        const original = JSON.stringify(window.V7Avatar.state);
        for (const character of ["boy", "girl"])
          for (const item of C.catalog.filter(
            (i) =>
              window.V7Avatar.isActiveItem(i) &&
              !["Backgrounds"].includes(i.slot),
          )) {
            const variants = E.wardrobeColours.find((w) => w.item === item.id)
              ?.colours || [null];
            for (const c of variants) {
              const s = structuredClone(window.V7Avatar.state);
              s.settings.avatarCharacter = character;
              s.equipped = [item.id];
              if (c) s.colours = { [item.id]: c.n };
              const before = JSON.stringify(s);
              rows.push({
                character,
                id: item.id,
                colour: c?.n || 1,
                slot: item.slot,
                html: A.explorer(s),
                unchanged: before === JSON.stringify(s),
              });
            }
          }
        return {
          rows,
          unchanged: original === JSON.stringify(window.V7Avatar.state),
        };
      });
      expect(result.unchanged).toBe(true);
      expect(result.rows).toHaveLength(104);
      expect(result.rows.every((r) => r.unchanged)).toBe(true);
      const beforeRetired = await p.evaluate(
        (k) => localStorage.getItem(k),
        key,
      );
      await p.evaluate(() => {
        const b = document.createElement("button");
        b.id = "retired-colour-test";
        b.dataset.action = "colour-wear:colour-headphones-2";
        document.body.append(b);
      });
      await p.locator("#retired-colour-test").evaluate((b) => b.click());
      await p.locator("#retired-colour-test").evaluate((e) => e.remove());
      expect(await p.evaluate((k) => localStorage.getItem(k), key)).toBe(
        beforeRetired,
      );
      const legacy = await p.evaluate(() => {
        const s = structuredClone(window.V7Avatar.state);
        s.bought = ["cap"];
        s.equipped = ["cap"];
        s.colours = { cap: 3 };
        const before = JSON.stringify(s),
          html = window.V3Art.explorer(s);
        return {
          unchanged: before === JSON.stringify(s),
          fallback: html.includes('data-supplied-art="colour-cap-1"'),
        };
      });
      expect(legacy).toEqual({ unchanged: true, fallback: true });
      // Headphones remain in legacy saves, but never in current options or rendering.
      await expect(
        p.locator(
          '[data-action="buy:headphones"], [data-colour-item="headphones"]',
        ),
      ).toHaveCount(0);
      const retired = await p.evaluate(() => {
        const s = structuredClone(window.V7Avatar.state);
        s.equipped = ["headphones"];
        const before = JSON.stringify(s);
        return {
          html: window.V3Art.explorer(s),
          same: before === JSON.stringify(s),
        };
      });
      expect(retired.same).toBe(true);
      expect(retired.html).not.toContain('data-worn="headphones"');
      for (const group of ["Headwear", "Outfits", "Extras"]) {
        const rows = result.rows.filter((r) =>
          group === "Extras"
            ? !["Headwear", "Outfits"].includes(r.slot)
            : r.slot === group,
        );
        await p.evaluate(
          ({ rows, group }) => {
            let g = document.getElementById("art-fit-gallery");
            g?.remove();
            g = document.createElement("section");
            g.id = "art-fit-gallery";
            g.style =
              "background:#e9efdf;padding:24px;display:grid;grid-template-columns:repeat(6,180px);gap:12px;width:1200px;position:relative;z-index:100";
            g.innerHTML =
              '<h1 style="grid-column:1/-1">' +
              group +
              " · both explorers</h1>" +
              rows
                .map(
                  (r) =>
                    '<article style="background:#d3dec8;border-radius:12px;text-align:center;padding:10px"><strong>' +
                    r.character +
                    " · " +
                    r.id +
                    " · " +
                    r.colour +
                    '</strong><div style="height:270px;display:flex;align-items:center;justify-content:center">' +
                    r.html.replace(
                      'class="explorer',
                      'style="width:160px;height:240px" class="explorer',
                    ) +
                    "</div></article>",
                )
                .join("");
            document.body.append(g);
          },
          { rows, group },
        );
        await ready(p);
        const gallery = p.locator("#art-fit-gallery");
        expect(await gallery.locator("[data-supplied-art]").count()).toBe(
          rows.length,
        );
        const bounds = await gallery
          .locator(".supplied-attachment")
          .evaluateAll((es) =>
            es.map((e) => {
              const r = e.getBoundingClientRect(),
                b = e.parentElement.getBoundingClientRect(),
                i = e.querySelector("img");
              return {
                id: e.dataset.worn,
                visible: i.complete && i.naturalWidth > 0,
                inside:
                  r.left >= b.left - 1 &&
                  r.right <= b.right + 1 &&
                  r.top >= b.top - 1 &&
                  r.bottom <= b.bottom + 1,
              };
            }),
          );
        expect(bounds.filter((b) => !b.visible || !b.inside)).toEqual([]);
        if (group === "Headwear") {
          const hats = await gallery.locator(".explorer").evaluateAll((es) =>
            es.map((e) => {
              const head = e.querySelector(".avatar-base:not(.avatar-skin)"),
                front = e.querySelector('[data-hat-layer="front"]'),
                back = e.querySelector('[data-hat-layer="back"]');
              return {
                head: Number(getComputedStyle(head).zIndex),
                front: Number(getComputedStyle(front).zIndex),
                back: Number(getComputedStyle(back).zIndex),
                mask: getComputedStyle(front).maskImage,
              };
            }),
          );
          for (const h of hats) {
            expect(h.back).toBeLessThan(h.head);
            expect(h.front).toBeGreaterThan(h.head);
            expect(h.mask).toContain("data:image/svg+xml");
          }
        }
        if (group === "Outfits") {
          const layers = await gallery.locator(".explorer").evaluateAll((es) =>
            es.map((e) => ({
              character: e.dataset.avatarCharacter,
              head: Number(
                getComputedStyle(
                  e.querySelector(".avatar-base:not(.avatar-skin)"),
                ).zIndex,
              ),
              neck: Number(
                getComputedStyle(e.querySelector(".avatar-neck")).zIndex,
              ),
              outfit: Number(
                getComputedStyle(
                  e.querySelector('[data-attachment-category="outfit"]'),
                ).zIndex,
              ),
            })),
          );
          for (const layer of layers) {
            expect(
              layer.head,
              layer.character + " head must be in front of the hood",
            ).toBeGreaterThan(layer.outfit);
            expect(
              layer.neck,
              layer.character + " neck must be in front of the collar back",
            ).toBeGreaterThan(layer.outfit);
          }
        }

        if (info.project.name === "desktop-chromium") {
          fs.mkdirSync(out, { recursive: true });
          await gallery.screenshot({
            path: path.join(out, kind + "-" + group.toLowerCase() + ".png"),
          });
          if (group === "Headwear") {
            await p.evaluate(() => {
              const g = document.querySelector("#art-fit-gallery");
              for (const a of g.querySelectorAll(".explorer")) {
                a.style.width = "160px";
                a.style.height = "240px";
                a.style.position = "absolute";
                a.style.left = "10px";
                a.style.transform = "scale(1.5)";
                a.style.transformOrigin = "50% 0";
                a.style.top = "0";
                a.parentElement.style =
                  "height:135px;width:180px;position:relative;overflow:hidden";
              }
              g.style.gridTemplateColumns = "repeat(6,180px)";
            });
            await gallery.screenshot({
              path: path.join(out, kind + "-headwear-close-up.png"),
            });
          }
        }
      }
      await p.locator("#art-fit-gallery").evaluate((e) => e.remove());
      if (info.project.name === "desktop-chromium") {
        await p.evaluate(() => {
          const g = document.createElement("section");
          g.id = "both-explorers";
          g.style =
            "display:flex;justify-content:center;gap:50px;background:#e9efdf;padding:30px;width:640px;border-radius:14px";
          for (const character of ["boy", "girl"]) {
            const s = structuredClone(window.V7Avatar.state);
            s.settings.avatarCharacter = character;
            s.equipped = ["cap", "hoodie", "fox"];
            s.colours = {
              cap: character === "boy" ? 1 : 2,
              hoodie: character === "boy" ? 1 : 3,
            };
            const a = document.createElement("div");
            a.style = "text-align:center";
            a.innerHTML =
              "<h2>" + character + " explorer</h2>" + window.V3Art.explorer(s);
            g.append(a);
          }
          document.body.append(g);
        });
        await ready(p);
        await p
          .locator("#both-explorers")
          .screenshot({ path: path.join(out, kind + "-both-explorers.png") });
        await p.locator("#both-explorers").evaluate((e) => e.remove());
      }

      await expect(
        p.locator('#wardrobe-preview [data-supplied-art="colour-cap-1"]'),
      ).toHaveCount(1);
      const before = await p.evaluate(
        (k) => JSON.parse(localStorage.getItem(k)),
        key,
      );
      await p
        .locator(
          '[data-colour-item="cap"] button[data-action="colour-wear:colour-cap-2"]',
        )
        .click();
      await ready(p);
      await expect(
        p.locator('#wardrobe-preview [data-supplied-art="colour-cap-2"]'),
      ).toHaveCount(1);
      await p.locator("[data-character-choice]").selectOption("girl");
      await ready(p);
      await p.reload();
      await ready(p);
      await expect(p.locator("#wardrobe-preview .explorer")).toHaveAttribute(
        "data-avatar-character",
        "girl",
      );
      await expect(
        p.locator('#wardrobe-preview [data-supplied-art="colour-cap-2"]'),
      ).toHaveCount(1);
      const after = await p.evaluate(
        (k) => JSON.parse(localStorage.getItem(k)),
        key,
      );
      for (const f of [
        "coins",
        "bought",
        "earned",
        "minutes",
        "equipped",
        "skills",
        "checks",
        "milestones",
        "customFuture",
      ])
        expect(after[f]).toEqual(before[f]);
      await expect(
        p.locator("#wardrobe-preview .supplied-attachment"),
      ).toHaveCount(5);
      fs.mkdirSync(out, { recursive: true });
      await p.locator("#wardrobe-preview").screenshot({
        path: path.join(out, kind + "-" + info.project.name + "-wardrobe.png"),
      });
      expect(
        await p.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
      ).toBe(true);
    });
    test("Town pictures change only at the saved target, survive reload and never charge twice", async ({
      page: p,
    }, info) => {
      const s = F.fresh();
      s.view = "world";
      s.world = "town";
      s.coins = 500;
      s.bought = [];
      for (const project of E.townProjects)
        s.bought.push(...project.parts.slice(0, -1));
      await seed(p, s, key, url);
      const panel = p.locator("#town-projects");
      await expect(panel).toBeVisible();
      await expect(
        panel.locator('[data-project-state="in-progress"]'),
      ).toHaveCount(3);
      fs.mkdirSync(out, { recursive: true });
      await panel.screenshot({
        path: path.join(
          out,
          kind + "-" + info.project.name + "-town-in-progress.png",
        ),
      });
      const before = await p.evaluate(
        (k) => JSON.parse(localStorage.getItem(k)),
        key,
      );
      for (const project of E.townProjects) {
        const card = panel.locator('[data-town-project="' + project.id + '"]');
        await card
          .locator('[data-action="town-add:' + project.id + '"]')
          .click();
        await p
          .locator('#town-confirmation [data-action^="town-confirm:"]')
          .click();
        await ready(p);
        await expect(
          card.locator('[data-project-state="finished"]'),
        ).toHaveCount(1);
      }
      await p.reload();
      await ready(p);
      await expect(
        panel.locator('[data-project-state="finished"]'),
      ).toHaveCount(3);
      await expect(panel.locator('[data-action^="town-add:"]')).toHaveCount(0);
      const after = await p.evaluate(
        (k) => JSON.parse(localStorage.getItem(k)),
        key,
      );
      expect(after.coins).toBe(before.coins - 150);
      for (const f of [
        "earned",
        "minutes",
        "equipped",
        "skills",
        "checks",
        "milestones",
        "customFuture",
      ])
        expect(after[f]).toEqual(before[f]);
      await panel.screenshot({
        path: path.join(
          out,
          kind + "-" + info.project.name + "-town-finished.png",
        ),
      });
      expect(
        await panel
          .locator("img")
          .evaluateAll((es) =>
            es.every((i) => i.complete && i.naturalWidth > 0),
          ),
      ).toBe(true);
      expect(
        await p.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
      ).toBe(true);
    });
    test("all eight standalone decoration cards load and the camp map stays clear", async ({
      page: p,
    }, info) => {
      const s = F.fresh();
      s.view = "camp";
      s.bought = ["cap"];
      await seed(p, s, key, url);
      await expect(p.locator(".camp-owned-decoration")).toHaveCount(0);
      await expect(p.locator(".camp-exterior [data-supplied-art]")).toHaveCount(
        0,
      );
      await expect(
        p.locator("#camp-decorations img[data-supplied-art]"),
      ).toHaveCount(8);
      await p.locator('[data-action="deco-buy:deco-plant"]').click();
      await p.locator('[data-action="deco-confirm:deco-plant"]').click();
      await ready(p);
      await expect(
        p.locator('[data-decoration="deco-plant"].owned'),
      ).toHaveCount(1);
      const owned = F.fresh();
      owned.view = "camp";
      owned.bought = ["cap", ...E.decorations.map((d) => d.id)];
      await seed(p, owned, key, url);
      await expect(p.locator(".camp-owned-decoration")).toHaveCount(0);
      expect(
        await p
          .locator("#camp-decorations img")
          .evaluateAll((es) =>
            es.every((i) => i.complete && i.naturalWidth > 0),
          ),
      ).toBe(true);
      fs.mkdirSync(out, { recursive: true });
      await p
        .locator(".camp-exterior")
        .first()
        .screenshot({
          path: path.join(out, kind + "-" + info.project.name + "-camp.png"),
        });
      await p.locator("#camp-decorations").screenshot({
        path: path.join(
          out,
          kind + "-" + info.project.name + "-decorations.png",
        ),
      });
      expect(
        await p.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
      ).toBe(true);
    });
  });
}
