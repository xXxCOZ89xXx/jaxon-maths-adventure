const { test, expect } = require("@playwright/test"),
  fs = require("fs"),
  path = require("path");
const F = require("./helpers/guided-progression.cjs"),
  C = require("../v3/curriculum").V3Curriculum,
  E = F.E;
const out = path.resolve("local-evidence/artwork-20261128/launch-clothing");
const heads = [
  "helmet",
  "cap",
  "crown",
  "wizardhat",
  "hardhat",
  "headphones",
  "tophat",
];
async function ready(p) {
  await p.waitForFunction(
    () => !document.documentElement.hasAttribute("data-saving"),
  );
  await p.evaluate(() =>
    Promise.all([...document.images].map((i) => i.decode().catch(() => {}))),
  );
}
async function seed(p, state, key, url) {
  await p.goto(url);
  await p.evaluate(
    ({ state, key }) => localStorage.setItem(key, JSON.stringify(state)),
    { state, key },
  );
  await p.reload();
  await ready(p);
}
for (const demo of [false, true]) {
  const kind = demo ? "demo" : "game",
    url = demo ? "/demo-dist/" : "/v3-adventure.html",
    key = demo ? "jaxon_public_demo_v1" : "jaxon_v3_fictional_demo_2026";
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
    test("every outfit colour joins real neck skin on both original head positions; all headwear stays hidden", async ({
      page: p,
    }, info) => {
      const s = F.fresh();
      s.view = "shop";
      s.bought = [
        ...C.catalog.map((i) => i.id),
        ...E.colourCatalog.map((i) => i.id),
      ];
      s.equipped = ["cap", "hoodie", "fox"];
      s.colours = { cap: 2 };
      await seed(p, s, key, url);
      for (const id of heads)
        await expect(
          p.locator(
            '[data-action="buy:' + id + '"],[data-colour-item="' + id + '"]',
          ),
        ).toHaveCount(0);
      await expect(
        p.locator(
          '#shop-filter option[value="Headwear"], [data-action="remove-slot:Headwear"]',
        ),
      ).toHaveCount(0);
      const result = await p.evaluate(() => {
        const rows = [],
          source = JSON.stringify(window.V7Avatar.state);
        for (const character of ["boy", "girl"])
          for (const w of window.V3Engine.wardrobeColours.filter(
            (w) =>
              window.V3Curriculum.catalog.find((i) => i.id === w.item)?.slot ===
              "Outfits",
          ))
            for (const colour of w.colours) {
              const s = structuredClone(window.V7Avatar.state);
              s.settings.avatarCharacter = character;
              s.equipped = [w.item, "cap"];
              s.colours = { cap: 2, [w.item]: colour.n };
              const before = JSON.stringify(s),
                html = window.V3Art.explorer(s);
              rows.push({
                id: w.item,
                colour: colour.n,
                character,
                html,
                unchanged: before === JSON.stringify(s),
              });
            }
        return {
          rows,
          unchanged: source === JSON.stringify(window.V7Avatar.state),
        };
      });
      expect(result.rows).toHaveLength(42);
      expect(result.unchanged && result.rows.every((r) => r.unchanged)).toBe(
        true,
      );
      await p.evaluate((rows) => {
        const g = document.createElement("section");
        g.id = "launch-clothing-gallery";
        g.style =
          "width:1200px;display:grid;grid-template-columns:repeat(6,180px);gap:12px;padding:24px;background:#e9efdf;color:#213f35;position:relative;z-index:100";
        g.innerHTML =
          '<h1 style="grid-column:1/-1">Launch clothing · both explorers</h1>' +
          rows
            .map(
              (r) =>
                '<article style="background:#d3dec8;border-radius:12px;text-align:center;padding:8px"><strong>' +
                r.character +
                " · " +
                r.id +
                " · " +
                r.colour +
                '</strong><div class="launch-clothing-frame" style="height:300px;display:flex;align-items:center;justify-content:center">' +
                r.html.replace(
                  'style="--outfit-head-top:',
                  'style="width:180px;height:270px;--outfit-head-top:',
                ) +
                "</div></article>",
            )
            .join("");
        document.body.prepend(g);
      }, result.rows);
      await ready(p);
      const g = p.locator("#launch-clothing-gallery");
      await expect(g.locator(".outfit-front")).toHaveCount(42);
      await expect(g.locator(".avatar-neck-bridge")).toHaveCount(42);
      await expect(g.locator("[data-hat-layer]")).toHaveCount(0);
      fs.mkdirSync(out, { recursive: true });
      const buffer = await g.screenshot({
        path: path.join(
          out,
          kind + "-" + info.project.name + "-all-outfits.png",
        ),
        scale: "css",
      });
      const box = await g.boundingBox();
      const poses = await g.locator(".explorer").evaluateAll((es) =>
        es.map((e) => ({
          adjustment: Number(e.dataset.headAdjust),
          character: e.dataset.avatarCharacter,
          item: e.dataset.avatarItems.split(" ")[0],
          headTop:
            (parseFloat(
              getComputedStyle(
                e.querySelector(".avatar-base:not(.avatar-skin)"),
              ).top,
            ) /
              e.getBoundingClientRect().height) *
            100,
          head: getComputedStyle(
            e.querySelector(".avatar-base:not(.avatar-skin)"),
          ).transform,
          headZ: Number(
            getComputedStyle(e.querySelector(".avatar-base:not(.avatar-skin)"))
              .zIndex,
          ),
          neckZ: Number(
            getComputedStyle(e.querySelector(".avatar-neck")).zIndex,
          ),
          frontZ: Number(
            getComputedStyle(e.querySelector(".outfit-front")).zIndex,
          ),
          x: e.getBoundingClientRect().x,
          y: e.getBoundingClientRect().y,
          w: e.getBoundingClientRect().width,
          h: e.getBoundingClientRect().height,
        })),
      );
      for (const r of poses) {
        const expected = {
          boy: {
            jacket: -1.6,
            hoodie: -0.6,
            armour: -1.6,
            cape: -1.6,
            spacesuit: -0.2,
            ninja: -2.4,
          },
          girl: { armour: -1.4, cape: -1.4, ninja: -2.7, suit: 1 },
        };
        expect(r.adjustment).toBe(expected[r.character][r.item] || 0);
        expect(r.headTop).toBeCloseTo(8 + r.adjustment, 1);
        expect(r.head).toBe("none");
        expect(r.headZ).toBeGreaterThan(r.frontZ);
        expect(r.neckZ).toBeLessThan(r.frontZ);
      }
      const samples = await p.evaluate(
        async ({ data, poses, box }) => {
          const i = new Image();
          i.src = data;
          await i.decode();
          const c = document.createElement("canvas");
          c.width = i.width;
          c.height = i.height;
          const x = c.getContext("2d");
          x.drawImage(i, 0, 0);
          return poses.flatMap((r, n) =>
            [0.27, 0.28, 0.29].map((f) => {
              const xx = Math.round(
                  ((r.x - box.x + r.w * 0.4893) * i.width) / box.width,
                ),
                yy = Math.round(
                  ((r.y - box.y + r.h * f) * i.height) / box.height,
                ),
                [red, green, blue, alpha] = x.getImageData(xx, yy, 1, 1).data;
              return {
                n,
                f,
                rgb: [red, green, blue, alpha],
                skin:
                  alpha > 200 &&
                  red > 145 &&
                  green > 75 &&
                  blue > 30 &&
                  red > green * 1.08 &&
                  green > blue * 1.08,
              };
            }),
          );
        },
        {
          data: "data:image/png;base64," + buffer.toString("base64"),
          poses,
          box,
        },
      );
      expect(
        samples.filter((s) => !s.skin),
        "Every rendered neckline must show skin, rather than a dark interior or the page background",
      ).toEqual([]);
      fs.writeFileSync(
        path.join(out, kind + "-" + info.project.name + "-neck-pixels.json"),
        JSON.stringify(samples, null, 2),
      );
      if (info.project.name === "desktop-chromium") {
        await g.evaluate((g) => {
          for (const e of g.querySelectorAll(".explorer")) {
            e.style.position = "absolute";
            e.style.left = "0";
            e.style.top = "0";
            e.style.transform = "scale(1.5)";
            e.style.transformOrigin = "50% 0";
            e.parentElement.style =
              "width:180px;height:140px;position:relative;overflow:hidden";
          }
        });
        await g.screenshot({
          path: path.join(out, kind + "-neck-close-ups.png"),
          scale: "css",
        });
      }
      await g.evaluate((e) => e.remove());
      const raw = await p.evaluate((k) => localStorage.getItem(k), key);
      await p.evaluate((heads) => {
        for (const id of heads)
          for (const action of [
            "buy:" + id,
            "colour-buy:colour-" + id + "-2",
            "colour-wear:colour-" + id + "-2",
          ]) {
            const b = document.createElement("button");
            b.dataset.action = action;
            document.body.append(b);
            b.click();
            b.remove();
          }
      }, heads);
      expect(await p.evaluate((k) => localStorage.getItem(k), key)).toBe(raw);
      expect(
        await p.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
      ).toBe(true);
      if (info.project.name === "desktop-chromium") {
        await p.evaluate(() => {
          const g = document.createElement("section");
          g.id = "launch-both-explorers";
          g.style =
            "display:flex;gap:50px;justify-content:center;width:640px;padding:30px;background:#e9efdf;color:#213f35";
          for (const character of ["boy", "girl"]) {
            const s = structuredClone(window.V7Avatar.state);
            s.settings.avatarCharacter = character;
            s.equipped = ["hoodie", "fox"];
            s.colours = { hoodie: character === "boy" ? 1 : 3 };
            const d = document.createElement("div");
            d.style = "text-align:center";
            d.innerHTML =
              "<h2>" + character + " explorer</h2>" + window.V3Art.explorer(s);
            g.append(d);
          }
          document.body.prepend(g);
        });
        await ready(p);
        await p
          .locator("#launch-both-explorers")
          .screenshot({ path: path.join(out, kind + "-both-explorers.png") });
        await p.locator("#launch-both-explorers").evaluate((e) => e.remove());
      }
    });
    test("clothing purchase, colour choice and character switch preserve old headwear records, wallet arithmetic and progress", async ({
      page: p,
    }, info) => {
      const s = F.fresh();
      s.view = "shop";
      s.coins = 1000;
      s.earned = 1000;
      s.bought = ["cap", "colour-cap-2", "hoodie", "fox"];
      s.equipped = ["cap", "hoodie", "fox"];
      s.colours = { cap: 2 };
      s.customFuture = {
        keep: "all of this",
        pending: {
          uuid: "fictional-pending-unchanged",
          bytes: "original fictional request",
        },
      };
      await seed(p, s, key, url);
      const before = await p.evaluate(
          (k) => JSON.parse(localStorage.getItem(k)),
          key,
        ),
        cost = C.catalog.find((i) => i.id === "jacket").cost;
      await p.locator('[data-action="buy:jacket"]').click();
      await p
        .locator('#purchase-confirmation [data-action="buy-confirm:jacket"]')
        .click();
      await ready(p);
      await expect(
        p.locator('#wardrobe-preview [data-worn="jacket"]'),
      ).toHaveCount(1);
      await p.locator('[data-action="buy:hoodie"]').click();
      await ready(p);
      await p
        .locator(
          '[data-colour-item="hoodie"] [data-action="colour-buy:colour-hoodie-2"]',
        )
        .click();
      await p
        .locator('#colour-confirmation [data-action="colour-cancel"]')
        .click();
      await ready(p);
      expect(
        (await p.evaluate((k) => JSON.parse(localStorage.getItem(k)), key))
          .coins,
      ).toBe(before.coins - cost);
      await p
        .locator(
          '[data-colour-item="hoodie"] [data-action="colour-buy:colour-hoodie-2"]',
        )
        .click();
      await p
        .locator(
          '#colour-confirmation [data-action="colour-confirm:colour-hoodie-2"]',
        )
        .click();
      await ready(p);
      await p.locator("[data-character-choice]").selectOption("girl");
      await ready(p);
      await p.reload();
      await ready(p);
      await expect(
        p.locator('#wardrobe-preview [data-supplied-art="colour-hoodie-2"]'),
      ).toHaveCount(1);
      await expect(p.locator("#wardrobe-preview .explorer")).toHaveAttribute(
        "data-avatar-character",
        "girl",
      );
      const after = await p.evaluate(
        (k) => JSON.parse(localStorage.getItem(k)),
        key,
      );
      expect(after.coins).toBe(before.coins - cost - 50);
      expect(after.bought).toEqual([
        ...before.bought,
        "jacket",
        "colour-hoodie-2",
      ]);
      expect(after.equipped).toContain("cap");
      expect(after.colours).toEqual({ cap: 2, hoodie: 2 });
      for (const k of [
        "earned",
        "minutes",
        "skills",
        "checks",
        "milestones",
        "startingProfile",
        "customFuture",
      ])
        expect(after[k]).toEqual(before[k]);
      for (const view of ["home", "camp", "map", "shop"]) {
        await p.evaluate(
          ({ key, view }) => {
            const s = JSON.parse(localStorage.getItem(key));
            s.view = view;
            localStorage.setItem(key, JSON.stringify(s));
          },
          { key, view },
        );
        await p.reload();
        await ready(p);
        for (const id of heads)
          await expect(
            p.locator('.explorer [data-worn="' + id + '"]'),
          ).toHaveCount(0);
      }
      await p.locator("#wardrobe-preview").screenshot({
        path: path.join(out, kind + "-" + info.project.name + "-wardrobe.png"),
      });
      expect(
        await p.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
      ).toBe(true);
    });
  });
}
