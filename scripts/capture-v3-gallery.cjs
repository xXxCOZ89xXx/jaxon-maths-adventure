// Fictional-only visual capture. Every non-loopback request is blocked and fails QA.
const fs = require("node:fs"),
  path = require("node:path");
const { chromium } = require("playwright");
const root = path.resolve(__dirname, ".."),
  out = path.join(root, "tests/visual");
const layouts = [
  ["desktop", { width: 1440, height: 1000 }],
  ["ipad-portrait", { width: 820, height: 1180 }],
  ["ipad-landscape", { width: 1180, height: 820 }],
];
const manifest = [];
(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.V3_CHROMIUM_EXECUTABLE || "/usr/bin/chromium",
    args: ["--no-sandbox"],
  });
  try {
    for (const [layout, viewport] of layouts) {
      const context = await browser.newContext({
        viewport,
        hasTouch: layout !== "desktop",
        isMobile: layout !== "desktop",
        reducedMotion: "reduce",
      });
      const page = await context.newPage(),
        errors = [];
      await context.route("**/*", (route) => {
        const u = new URL(route.request().url());
        if (u.hostname === "127.0.0.1") return route.continue();
        errors.push("Unexpected external origin");
        return route.abort();
      });
      page.on("pageerror", (e) => errors.push(e.message));
      page.on("console", (m) => {
        if (m.type() === "error") errors.push(m.text());
      });
      await page.goto("http://127.0.0.1:4173/v3-adventure.html");
      async function shot(name, title, group, state = {}, fullPage = false) {
        await page.evaluate((state) => {
          let s = V3Engine.fresh();
          s.tourSeen = true;
          s.settings.motion = false;
          s.settings.sound = false;
          if (state.restored) {
            for (const w of V3Engine.worlds)
              for (let i = 0; i < 3; i++) s.milestones.push(w.id + ":" + i);
          }
          if (state.upgraded) {
            const a = V3Adventure.state(s);
            a.campProjects = {
              greenhouse: true,
              lookout: true,
              noticeboard: true,
            };
            for (const w of V3Engine.worlds)
              for (const r of V3Adventure.routes(w.id)) {
                a.records[w.id + "|" + r.id + "|1"] = {
                  world: w.id,
                  route: r.id,
                  tier: 1,
                  unassisted: 3,
                  lastUnassisted: 3,
                  completedAt: "2026-10-20T12:00:00Z",
                };
              }
            const cs = V3Adventure.collections(s);
            ["shelf", "garden", "gate"].forEach(
              (slot, i) => (a.camp[slot] = cs[i]?.id || ""),
            );
          }
          if (state.campStage || state.view === "camp") {
            const stage=state.campStage || 8;
            s.milestones=V3Adventure.campMilestoneIds().slice(0,V3Adventure.campStages[stage-1].need);
            delete s.adventure?.campEstate;
          }
          if (state.dressed) {
            s.bought = [
              "cap",
              "jacket",
              "rucksack",
              "glasses",
              "fox",
              "forestbg",
            ];
            s.equipped = [...s.bought];
            s.coins = 136.1545871667;
          }
          s.world = state.world || "number";
          s.view = state.view || "home";
          if (state.route) {
            V3Adventure.start(s, s.world, state.route, 1);
            V3Adventure.begin(s);
          }
          if (state.quest) {
            V3Engine.startQuest(s, "number");
            s.quest.intro = false;
            s.quest.value = 1;
          }
          if (state.recap) {
            s.view = "recap";
            s.lastResult = { type: "quest", world: "number" };
          }
          localStorage.setItem(
            "jaxon_v3_fictional_demo_2026",
            JSON.stringify(s),
          );
        }, state);
        const start = Date.now();
        await page.reload();
        await page.waitForFunction(() => document.querySelector("#main h1"));
        await page.evaluate(
          () =>
            new Promise((r) =>
              requestAnimationFrame(() => requestAnimationFrame(r)),
            ),
        );
        if(state.exterior) await page.locator('[data-action="venue-view:exterior"]').click();
        await page.waitForFunction(()=>!document.documentElement.hasAttribute("data-saving"));
        await page.evaluate(() => document.activeElement?.blur());
        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth > innerWidth + 1,
        );
        if (overflow)
          throw Error("Horizontal overflow: " + layout + " " + name);
        const file = "after/" + layout + "-" + name + ".jpg";
        fs.mkdirSync(path.join(out, "after"), { recursive: true });
        const target=state.scenery ? page.locator(".camp-map") : state.exterior ? page.locator(".exterior-scene") : state.townOverview ? page.locator(".town-explore-map") : page;
        await target.screenshot({
          path: path.join(out, file),
          ...(target===page?{fullPage}:{}),
          type: "jpeg",
          quality: 78,
        });
        const metrics = await page.evaluate(() => ({
          svgNodes: document.querySelectorAll("svg *").length,
          domNodes: document.querySelectorAll("*").length,
        }));
        manifest.push({
          file,
          title,
          group,
          layout,
          loadAndCaptureMs: Date.now() - start,
          ...metrics,
        });
      }
      await shot("home", "Home · forest trail", "Navigation", {});
      await shot(
        "map",
        "The nine-world atlas",
        "Navigation",
        { view: "map", dressed: true },
        true,
      );
      await shot(
        "camp",
        "Base Camp · upgraded",
        "Explorer & rewards",
        { view: "camp", restored: true, upgraded: true, dressed: true },
        true,
      );
      await shot(
        "wardrobe",
        "Explorer wardrobe · original SVG gear",
        "Explorer & rewards",
        { view: "shop", restored: true, dressed: true },
        true,
      );
      await shot(
        "quest",
        "Bridge repair · interactive quest",
        "Interactive learning",
        { quest: true, dressed: true },
        true,
      );
      await shot("celebration", "Restoration recap", "Explorer & rewards", {
        restored: true,
        recap: true,
      });
      const worlds = await page.evaluate(() =>
        V3Engine.worlds.map((w) => ({ id: w.id, name: w.name })),
      );
      if (layout === "desktop")
        for (const w of worlds) {
          await shot(
            w.id + "-before",
            w.name + " · before restoration",
            "World restoration",
            { view: "world", world: w.id },
          );
          await shot(
            w.id + "-after",
            w.name + " · restored",
            "World restoration",
            { view: "world", world: w.id, restored: true, upgraded: true },
          );
        }
      if (layout !== "ipad-landscape") {
        const venues = await page.evaluate(() =>
          V3Town.venues.map((v) => ({ id: v.id, name: v.name })),
        );
        for (const v of venues)
          await shot(
            "town-" + v.id,
            v.name + " · hands-on visit",
            "Practical Maths Town",
            { world: "town", route: v.id, dressed: true, restored: true },
            true,
          );
      }
      await shot("town-overview","Town overview · eight purpose-built venues","Town architecture",{view:"world",world:"town",restored:true,townOverview:true});
      if(layout==="desktop") {
        const stages=await page.evaluate(()=>V3Adventure.campStages);
        for(const st of stages) await shot("camp-stage-"+st.id,st.id+". "+st.name+" · "+st.need+" milestones","Camp progression",{view:"camp",campStage:st.id,scenery:true});
        const venues=await page.evaluate(()=>V3Town.venues.map(v=>({id:v.id,name:v.name})));
        for(const v of venues)await shot("exterior-"+v.id,v.name+" · exterior","Town exteriors",{world:"town",route:v.id,exterior:true});
      }
      if(layout==="ipad-landscape")for(const id of ["market","station","work"])await shot("town-"+id,id+" · activity in landscape","Practical Maths Town",{world:"town",route:id,dressed:true,restored:true},true);
      if (errors.length)
        throw Error(
          "Rendering/network errors in " +
            layout +
            ": " +
            errors.slice(0, 4).join("; "),
        );
      await context.close();
    }
    fs.writeFileSync(
      path.join(out, "manifest.json"),
      JSON.stringify(manifest, null, 2) + "\n",
    );
    console.log(
      "PASS visual captures:",
      manifest.length,
      "fictional screens; desktop/iPad; no overflow, external requests or console errors",
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e.message);
  process.exitCode = 1;
});
