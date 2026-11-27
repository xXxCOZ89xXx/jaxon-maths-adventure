"use strict";
// Browser check of the configurable demo sample, maths artwork and isolation.
// Fictional visitor only. Every request outside the local demo origin is refused.
const assert = require("node:assert/strict"),
  fs = require("node:fs"),
  path = require("node:path");
const { chromium } = require("playwright");
const { createServer } = require("./server.cjs");
const root = path.resolve(__dirname, ".."),
  KEY = "jaxon_public_demo_v1",
  out = path.join(root, "work/public-demo/sample"),
  cfg = JSON.parse(
    fs.readFileSync(path.join(__dirname, "sample.json"), "utf8"),
  ),
  info = JSON.parse(
    fs.readFileSync(path.join(root, "demo-dist/build-info.json"), "utf8"),
  );
assert.equal(info.demoSample?.id, cfg.id, "Rebuild the demo with this sample");
fs.mkdirSync(out, { recursive: true });
const edge = "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
const exe =
  process.env.V3_CHROMIUM_EXECUTABLE ||
  (fs.existsSync(edge) ? edge : chromium.executablePath());
const report = { sample: cfg.id, layouts: [] };
async function settled(p) {
  await p.waitForFunction(
    () => !document.documentElement.hasAttribute("data-saving"),
  );
}
const state = async (p) => {
  await settled(p);
  return p.evaluate((k) => JSON.parse(localStorage.getItem(k)), KEY);
};
// Click through the real UI. Hidden buttons (closed details) use the element's own click.
async function act(p, action) {
  if (
    action.startsWith("world:") &&
    !(await p.locator(`#main [data-action="${action}"]`).count())
  ) {
    await p.locator('[data-nav="map"]').click();
    await settled(p);
  }
  const el = p.locator(`#main [data-action="${action}"]`).first();
  assert(await el.count(), "Missing button " + action);
  if (await el.isVisible()) await el.click();
  else await el.evaluate((b) => b.click());
  await settled(p);
}
async function pause(p) {
  const b = p.locator(
    'dialog[open] [data-action="pause-explore"], #main [data-action="pause-explore"]',
  );
  if (await b.count()) {
    await b.first().evaluate((x) => x.click());
    await settled(p);
  }
}
const noOverflow = (p) =>
  p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1);
(async () => {
  const server = createServer();
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const base = "http://127.0.0.1:" + server.address().port + "/",
    origin = new URL(base).origin;
  const browser = await chromium.launch({
    executablePath: exe,
    headless: true,
  });
  try {
    for (const layout of [
      {
        name: "phone",
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
      },
      {
        name: "tablet",
        viewport: { width: 820, height: 1180 },
        isMobile: true,
        hasTouch: true,
      },
      {
        name: "landscape",
        viewport: { width: 1180, height: 820 },
        isMobile: true,
        hasTouch: true,
      },
    ]) {
      const ctx = await browser.newContext({
          ...layout,
          serviceWorkers: "block",
        }),
        p = await ctx.newPage(),
        external = [],
        errors = [],
        images = new Map();
      await ctx.route("**/*", (route) => {
        const url = route.request().url();
        if (new URL(url).origin !== origin) {
          external.push(url);
          return route.abort();
        }
        return route.continue();
      });
      p.on("response", (r) => {
        if (r.url().includes("/maths-tools/"))
          images.set(r.url().split("/").pop(), r.status());
      });
      p.on("pageerror", (e) => errors.push(e.message));
      p.on("console", (m) => m.type() === "error" && errors.push(m.text()));
      await p.goto(base);
      await act(p, "skip-tour");
      const shot = (n) =>
        p.screenshot({
          path: path.join(out, `${layout.name}-${n}.png`),
          fullPage: true,
        });
      // Progress banner on Base Camp.
      const banner = p.locator("#main .demo-sample-note");
      await banner.waitFor();
      assert.equal(
        (await banner.innerText()).trim(),
        cfg.messages.progress
          .replace("{used}", 0)
          .replace("{total}", cfg.stop.activities),
      );
      assert(await noOverflow(p), "Home overflow");
      await shot("1-home");
      // Number world: sampled lesson open, unsampled lesson disabled with a reason.
      await act(p, "world:number");
      assert(await noOverflow(p), "World overflow");
      const open = p.locator('#main [data-action="learn:place"]').first();
      assert(
        (await open.count()) && !(await open.isDisabled()),
        "Sampled lesson open",
      );
      const closed = p.locator('#main [data-action="learn:powers"]').first();
      assert(await closed.count(), "Unsampled lesson still shown");
      assert(await closed.isDisabled(), "Unsampled lesson disabled");
      assert.equal(
        await closed.getAttribute("title"),
        cfg.messages.notInSample,
      );
      await shot("2-number-world");
      // Rounding lesson renders the cleaned number-line artwork.
      await act(p, "learn:place");
      const practice = p.locator('#main [data-action="practice"]');
      if (await practice.count()) await act(p, "practice");
      await p
        .locator(".d9-line-surface image")
        .first()
        .waitFor({ timeout: 10000 });
      assert(await noOverflow(p), "Lesson overflow");
      await shot("3-number-line");
      await pause(p);
      // Fractions lesson renders the CSS tray/tile artwork.
      await act(p, "world:fractions");
      await act(p, "learn:fractions");
      if (await p.locator('#main [data-action="practice"]').count())
        await act(p, "practice");
      await p.waitForTimeout(400);
      await shot("4-fractions");
      await pause(p);
      // Use up the sample through ordinary starts; pause each one.
      let s = await state(p);
      const order = cfg.lessons.filter(
        (id) => !["place", "fractions"].includes(id),
      );
      const worldOf = Object.fromEntries(
        await p.evaluate(() => V3Curriculum.skills.map((k) => [k.id, k.world])),
      );
      for (const id of order) {
        if (
          Object.keys(s.demoSample.samples[cfg.id].used).length >=
          cfg.stop.activities
        )
          break;
        await act(p, "world:" + worldOf[id]);
        await act(p, "learn:" + id);
        await pause(p);
        s = await state(p);
      }
      const used = Object.keys(s.demoSample.samples[cfg.id].used);
      assert.equal(used.length, cfg.stop.activities, JSON.stringify(used));
      // The end of the sample: banner, end link, blocked new starts, saved work intact.
      await p.locator('[data-nav="home"]').click();
      await settled(p);
      assert.equal(
        (await banner.locator("p").innerText()).trim(),
        cfg.messages.ended,
      );
      assert.equal(
        await banner.locator("a").getAttribute("href"),
        cfg.endLink.href,
      );
      await shot("5-end");
      await act(p, "world:town");
      const plan = p.locator('#main [data-action="j-plan:cook-pasta"]').first();
      assert(await plan.isDisabled(), "New plan blocked after the end");
      assert.equal(await plan.getAttribute("title"), cfg.messages.ended);
      const before = await state(p);
      await p.reload();
      const after = await state(p);
      assert.deepEqual(
        after.demoSample,
        before.demoSample,
        "Sample book survives reload",
      );
      assert.equal(after.coins, before.coins, "No coins from blocked starts");
      // Paused learning can still be resumed after the end.
      if (after.pausedLearning) {
        await p.locator('[data-nav="home"]').click();
        await settled(p);
        const resume = p
          .locator(
            '#main [data-action^="resume-saved"], #main [data-action="continue"]',
          )
          .first();
        if (await resume.count())
          assert(!(await resume.isDisabled()), "Resume stays open");
      }
      // Runtime maths images served, reference-only balance never requested.
      for (const [file, status] of images) assert.equal(status, 200, file);
      assert(images.has("number-line-surround.png"), "Number-line art loaded");
      assert(
        !images.has("empty-balance.png"),
        "Reference-only art not requested",
      );
      assert.deepEqual(external, []);
      assert.deepEqual(errors, []);
      assert.deepEqual(await p.evaluate(() => Object.keys(localStorage)), [
        KEY,
      ]);
      assert.equal((await ctx.cookies()).length, 0);
      report.layouts.push({
        layout: layout.name,
        used: used.length,
        mathsImages: Object.fromEntries(images),
        externalRequests: external.length,
        errors: errors.length,
        passed: true,
      });
      await ctx.close();
      console.log("PASS " + layout.name);
    }
  } finally {
    await browser.close();
    server.close();
  }
  fs.writeFileSync(
    path.join(out, "results.json"),
    JSON.stringify(report, null, 2) + "\n",
  );
  console.log(
    "PASS demo sample browser check, " + report.layouts.length + " layouts",
  );
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
