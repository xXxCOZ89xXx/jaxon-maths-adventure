const fs = require("fs"),
  { chromium } = require("playwright");
const scenarios = [
  ["number-array", "Number Forest · construct equal arrays", "number", "2", 1],
  [
    "fraction-shading",
    "Fraction Desert · shade equal parts",
    "fractions",
    "0",
    0,
  ],
  ["algebra-tiles", "Algebra Peaks · balance batteries", "algebra", "0", 0],
  [
    "cartesian",
    "Algebra Peaks · Cartesian intersections",
    "algebra",
    "2",
    0,
  ],
  ["geometry-cartesian", "Geometry Kingdom · place a bridge support", "geometry", "2", 0],
  [
    "ratio-matching",
    "Ratio Island · match scaled recipe quantities",
    "ratio",
    "1",
    1,
  ],
  ["chart", "Statistics City · construct a chart", "statistics", "0", 0],
  ["spinner", "Probability Portal · build a spinner", "probability", "2", 0],
  ["ruler", "Measurement Mines · measure the rail", "measure", "0", 0],
  ["price-matching", "Town · match clothing prices", "town", "shops", 1],
  ["volume", "Measurement Mines · build volume layers", "measure", "2", 1],
  [
    "fraction-match",
    "Fraction Desert · equivalent representations",
    "fractions",
    "1",
    2,
  ],
  ["practice", "Supported practice · construct an answer", null],
  ["journey-list", "Journey · missing ingredients", null, 1],
  ["journey-bus", "Journey · read the bus timetable", null, 2],
  ["journey-customer", "Journey · customer supermarket", null, 3],
  ["journey-kitchen", "Journey · cook with purchased ingredients", null, 7],
];
(async () => {
  const b = await chromium.launch({
    executablePath: "/usr/bin/chromium",
    args: ["--no-sandbox"],
  });
  const manifest = [],
    failures = [];
  for (const [layout, width, height] of [
    ["desktop", 1440, 1000],
    ["ipad-portrait", 820, 1180],
    ["ipad-landscape", 1180, 820],
  ]) {
    const context = await b.newContext({
      viewport: { width, height },
      hasTouch: true,
      reducedMotion: "reduce",
    });
    await context.route("**/*", (r) => {
      if (new URL(r.request().url()).hostname === "127.0.0.1")
        return r.continue();
      failures.push("Unexpected external request");
      return r.abort();
    });
    const p = await context.newPage();
    p.on("pageerror", (e) => failures.push(e.message));
    p.on("console", (m) => {
      if (m.type() === "error") failures.push(m.text());
    });
    await p.goto("http://127.0.0.1:4173/v3-adventure.html");
    for (const [id, title, world, route, step = 0] of scenarios) {
      await p.evaluate(
        ({ id, world, route, step }) => {
          const s = V3Engine.fresh();
          s.tourSeen = true;
          if (world) {
            V3Adventure.start(s, world, route, 2);
            s.adventure.active.i = step;
            V3Adventure.begin(s);
            const t = s.adventure.active.tasks[step];
            if (t.kind === "array") s.adventure.active.values.parts = [2, 3, 0];
            if (t.kind === "volume")
              s.adventure.active.values.parts = [2, 3, 2];
            if (t.kind === "fraction")
              s.adventure.active.values.selected = [0, 1];
            if (t.kind === "balance") s.adventure.active.values.amount = 3;
            if (t.kind === "chart") s.adventure.active.values.parts = [2, 3, 1];
            if (t.kind === "chance")
              s.adventure.active.values.selected = [0, 2];
            if (t.kind === "measure") s.adventure.active.values.amount = 200;
          } else if (id === "practice") {
            V3Engine.generate(
              s,
              "operations",
              "practice",
              JaxonFreshReview,
              V3Curriculum,
            );
            s.learning.started = true;
            s.learning.manipulation = { amount: 234 };
            s.view = "practice";
          } else {
            V3Adventure.state(s);
            V5Journey.start(s);
            const target = Number(route);
            while (V5Journey.state(s).stage < target) {
              const j = V5Journey.state(s),
                t = V5Journey.task(s);
              if (t.kind === "basket") j.values.parts = [...t.answer];
              else if (t.kind === "journey") j.values.choice = t.answer;
              else if (t.kind === "coins") {
                j.values.coins = [];
                let n = t.answer;
                for (const p of [500, 200, 100, 50, 20, 10, 5, 2, 1])
                  while (n >= p) {
                    j.values.coins.push(p);
                    n -= p;
                  }
              } else j.values.amount = t.answer;
              if (!V5Journey.action(s, "j-submit", "", "j-submit"))
                throw Error("Invalid capture fixture");
              V5Journey.next(s);
            }
            if (target === 3) V5Journey.state(s).values.parts = [1, 1, 1];
            if (target === 7) V5Journey.state(s).values.amount = 150;
          }
          localStorage.setItem(
            "jaxon_v3_fictional_demo_2026",
            JSON.stringify(s),
          );
        },
        { id, world, route, step },
      );
      await p.reload();
      await p.locator("h1").waitFor();
      if (
        await p.evaluate(
          () => document.documentElement.scrollWidth > innerWidth + 1,
        )
      )
        throw Error("Overflow " + id + " " + layout);
      if (
        await p
          .locator("body")
          .innerText()
          .then((s) => /NaN|undefined/.test(s))
      )
        throw Error("Invalid readout " + id);
      const file = "v5/" + layout + "-" + id + ".jpg";
      fs.mkdirSync("tests/visual/v5", { recursive: true });
      await p.screenshot({
        path: "tests/visual/" + file,
        type: "jpeg",
        quality: 80,
        fullPage: true,
        animations: "disabled",
      });
      manifest.push({
        file,
        title,
        group: "V5 interactive learning and connected journey",
        layout,
      });
    }
    await context.close();
  }
  // Real V4 reference code, fictional state, same viewport and task.
  const p = await b.newPage({ viewport: { width: 820, height: 1180 } });
  await p.route("**/*", (r) =>
    new URL(r.request().url()).hostname === "127.0.0.1"
      ? r.continue()
      : r.abort(),
  );
  await p.goto("http://127.0.0.1:4175/v3-adventure.html");
  await p.evaluate(() => {
    const s = V3Engine.fresh();
    s.tourSeen = true;
    V3Adventure.start(s, "geometry", "2", 2); // V4 geometry has no coordinate route; use its actual algebra board.
    V3Adventure.start(s, "algebra", "2", 2);
    V3Adventure.begin(s);
    localStorage.setItem("jaxon_v3_fictional_demo_2026", JSON.stringify(s));
  });
  await p.reload();
  await p.screenshot({
    path: "tests/visual/v4-baseline/ipad-portrait-coordinate.jpg",
    type: "jpeg",
    quality: 80,
    fullPage: true,
  });
  await b.close();
  if (failures.length) throw Error(failures.join("\n"));
  fs.writeFileSync(
    "tests/visual/v5-manifest.json",
    JSON.stringify(manifest, null, 2) + "\n",
  );
  console.log(
    `PASS ${manifest.length} new V5 screenshots plus actual V4 coordinate baseline; no page overflow, invalid readouts, console errors or nonlocal requests.`,
  );
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
