const { test, expect, installSession } = require("./helpers/identities.cjs"),
  { fixture, mock, ref, uid } = require("./helpers/cloud-server.cjs"),
  { V3HistoryStorage: H } = require("../v3/history-storage.js");
const key = `jaxon_v3_staging:${ref}:${uid}:game`,
  queue = key + ":queue";
async function open(browser, use, server, prepare) {
  const context = await browser.newContext(use),
    page = await context.newPage(),
    errors = await mock(page, server);
  await installSession(page, server, "learner");
  if (prepare) await prepare(page);
  await page.goto("/staging-fixture-dist/");
  await expect(
    page.getByRole("heading", { name: "Base Camp", exact: true }),
  ).toBeVisible();
  return { context, page, errors };
}
async function settled(p) {
  await p.waitForFunction(
    () => !document.documentElement.hasAttribute("data-saving"),
  );
}
test("Retained history: large save survives lost acknowledgement and reload with bounded requests", async ({
  browser,
}, info) => {
  const server = fixture();
  server.historyVersion = 2;
  server.resetSupported = true;
  server.progress.skills = {
    place: {
      independentEvidence: Array.from({ length: 140 }, (_, i) => ({
        at: i,
        original: "history " + i,
        unknown: "x".repeat(16000),
      })),
    },
  };
  const original = JSON.parse(JSON.stringify(server.progress)),
    {
      context,
      page: p,
      errors,
    } = await open(browser, info.project.use, server);
  try {
    server.loseHistorySave = true;
    await p.locator('[data-nav="map"]').click();
    await settled(p);
    await p.locator('[data-nav="home"]').click();
    await settled(p);
    await expect
      .poll(
        () =>
          server.calls.filter((c) => c.body.p_operation === "save_v2").length,
        { timeout: 20000 },
      )
      .toBeGreaterThan(0);
    expect(Buffer.byteLength(JSON.stringify(server.progress))).toBeLessThan(
      500000,
    );
    expect(server.progress._historyV2).toBeTruthy();
    const revision = server.revision;
    await p.reload();
    await expect(
      p.getByRole("heading", { name: "Base Camp", exact: true }),
    ).toBeVisible();
    await expect.poll(() => server.revision, { timeout: 15000 }).toBe(revision);
    const restored = await p.evaluate(
      (key) => JSON.parse(V3CloudContext.storage.getItem(key)),
      key,
    );
    expect(restored.skills.place.independentEvidence).toEqual(
      original.skills.place.independentEvidence,
    );
    expect(await p.evaluate((key) => localStorage.getItem(key), key)).toMatch(
      /^HISTORY-V2:/,
    );
    await expect
      .poll(
        () =>
          p.evaluate(
            (queue) =>
              JSON.parse(V3CloudContext.storage.getItem(queue)).pending,
            queue,
          ),
        { timeout: 15000 },
      )
      .toBeNull();
  } finally {
    await context.close();
    expect(errors).toEqual([]);
  }
});
test("Retained history: delayed V1 request is preserved until an explicit conflict choice", async ({
  browser,
}, info) => {
  const server = fixture();
  server.historyVersion = 2;
  server.resetSupported = true;
  const original = JSON.parse(JSON.stringify(server.progress));
  original.unknownRemote = { retained: true };
  const packed = await H.pack(original);
  server.progress = packed.progress;
  server.revision = 2;
  server.historyNodes = new Map(packed.nodes.map((n) => [n.id, n.body]));
  const local = { ...original, unknownLocal: { retained: true } },
    pending = {
      requestId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      revision: 0,
      progress: local,
    },
    raw = JSON.stringify({
      version: 1,
      revision: 0,
      pending,
      latest: null,
      conflict: null,
      archives: [],
    });
  const {
    context,
    page: p,
    errors,
  } = await open(browser, info.project.use, server, async (page) =>
    page.addInitScript(
      ({ queue, raw }) => {
        if (!sessionStorage.getItem("legacy-history-seeded")) {
          localStorage.setItem(queue, raw);
          sessionStorage.setItem("legacy-history-seeded", "1");
        }
      },
      { queue, raw },
    ),
  );
  try {
    await expect(p.locator("#sync-conflict")).toBeVisible();
    const before = await p.evaluate(
      (queue) => JSON.parse(V3CloudContext.storage.getItem(queue)),
      queue,
    );
    expect(before.pending).toEqual(pending);
    await p.locator("#keep-remote").click();
    await expect(p.locator("#sync-conflict")).toHaveCount(0);
    const after = await p.evaluate(
      (queue) => JSON.parse(V3CloudContext.storage.getItem(queue)),
      queue,
    );
    expect(after.pending).toBeNull();
    expect(after.archives.at(-1).pending).toEqual(pending);
    expect(after.archives.at(-1).local.unknownLocal).toEqual({
      retained: true,
    });
    const bytes = await p.evaluate(
      async ({ queue, ref, uid }) => {
        const H = V3HistoryStorage,
          b = H.indexedDBBackend(`v3-history:${ref}:${uid}`);
        return (
          await H.restore(await b.get(queue + ":original-legacy"), (id) =>
            b.node(id),
          )
        ).raw;
      },
      { queue, ref, uid },
    );
    expect(bytes).toBe(raw);
    expect(server.revision).toBe(2);
  } finally {
    await context.close();
    expect(errors).toEqual([]);
  }
});
