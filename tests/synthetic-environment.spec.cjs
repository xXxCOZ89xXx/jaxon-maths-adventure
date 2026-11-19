const { test, expect } = require("@playwright/test");
const { fixture, mock, uid } = require("./helpers/cloud-server.cjs");
const {
  config,
  identity,
  publicKey,
} = require("./helpers/synthetic-project.cjs");
const Contract = require("../v3/synthetic-environment.js");
const ref = config.projectRef;
const legacyKeys = [
  `jaxon_v3_staging_auth:${ref}`,
  `jaxon_v3_staging:${ref}:${uid}:game`,
  `v3-intent:${ref}:${uid}`,
  `jaxon_v3_staging_auth:${Contract.forbiddenRefs[0]}`,
];
async function seedLegacy(page) {
  await page.addInitScript((keys) => {
    for (const key of keys)
      if (localStorage.getItem(key) === null)
        localStorage.setItem(key, "untouched fictional family sentinel");
  }, legacyKeys);
}
async function assertLegacy(page) {
  expect(
    await page.evaluate(
      (keys) => keys.map((k) => localStorage.getItem(k)),
      legacyKeys,
    ),
  ).toEqual(legacyKeys.map(() => "untouched fictional family sentinel"));
}
async function login(page) {
  await expect(
    page.getByRole("heading", { name: "Synthetic test sign-in", exact: true }),
  ).toBeVisible();
  await page.locator("#email").fill("learner@fictional.invalid");
  await page.locator("#password").fill("fictional-password-only-123");
  await page.locator("#cloud-form button.primary").click();
  await page.locator("#pin").fill("1234");
  await page.locator("#cloud-form button.primary").click();
  await expect(
    page.getByRole("heading", { name: "Base Camp", exact: true }),
  ).toBeVisible();
}
async function tap(page, action) {
  const dialog = page.locator("dialog[open]");
  await ((await dialog.count()) ? dialog : page)
    .locator(`[data-action="${action}"]`)
    .first()
    .tap();
  await page.waitForFunction(
    () => !document.documentElement.hasAttribute("data-saving"),
  );
}
test("synthetic sign-in, PIN and sign-out use isolated storage and preserve family sentinels", async ({
  page,
}) => {
  const server = fixture(),
    errors = await mock(page, server, { identity });
  await seedLegacy(page);
  await page.goto("/synthetic-fixture-dist/");
  await expect(page.getByLabel("Test environment")).toContainText(
    "SYNTHETIC TEST ENVIRONMENT",
  );
  await login(page);
  await assertLegacy(page);
  expect(
    await page.evaluate(
      (ref) => !!localStorage.getItem("esa_synthetic_auth:" + ref),
      ref,
    ),
  ).toBe(true);
  await page.locator("#cloud-signout").click();
  await expect(
    page.getByRole("heading", { name: "Synthetic test sign-in", exact: true }),
  ).toBeVisible();
  await assertLegacy(page);
  expect(errors).toEqual([]);
});
test("synthetic queued Town edit survives lost acknowledgement and reload without using family queues", async ({
  page,
}) => {
  const server = fixture(),
    errors = await mock(page, server, { identity });
  await seedLegacy(page);
  await page.goto("/synthetic-fixture-dist/");
  await login(page);
  if (await page.locator('[data-action="skip-tour"]').count())
    await tap(page, "skip-tour");
  await page.locator('nav [data-nav="map"]').tap();
  await tap(page, "world:town");
  await tap(page, "j-start:bolognese");
  await page.locator('[data-scene-open="pantry"]').first().tap();
  server.loseSave = true;
  await tap(page, "j-part:0:1");
  await page.evaluate(() => window.dispatchEvent(new Event("online")));
  const key = `esa_synthetic_game:${ref}:${uid}:game`,
    queue = key + ":queue";
  await expect
    .poll(() =>
      page.evaluate(
        (k) => JSON.parse(localStorage.getItem(k))?.pending?.requestId,
        queue,
      ),
    )
    .toBeTruthy();
  const requestId = await page.evaluate(
    (k) => JSON.parse(localStorage.getItem(k)).pending.requestId,
    queue,
  );
  await page.reload();
  await expect
    .poll(() =>
      page.evaluate((k) => JSON.parse(localStorage.getItem(k))?.pending, queue),
    )
    .toBeNull();
  const calls = server.calls.filter(
    (c) =>
      c.body?.p_operation === "save" && c.body.p_args.requestId === requestId,
  );
  expect(calls.length).toBeGreaterThanOrEqual(2);
  expect(server.progress.adventure.townLifeV2).toBeTruthy();
  await assertLegacy(page);
  expect(errors).toEqual([]);
});
for (const wrong of [
  { syntheticOnly: false },
  { environmentKind: "family" },
  { syntheticContractVersion: 2 },
  { projectRef: Contract.forbiddenRefs[0] },
])
  test(
    "synthetic server refuses wrong capability " + Object.keys(wrong)[0],
    async ({ page }) => {
      const server = fixture(),
        errors = await mock(page, server, {
          identity: { ...identity, ...wrong },
        });
      await seedLegacy(page);
      await page.goto("/synthetic-fixture-dist/");
      await expect(
        page.getByRole("heading", {
          name: "Synthetic tests are unavailable",
          exact: true,
        }),
      ).toBeVisible();
      expect(
        server.calls.every((c) => c.path === "/rest/v1/rpc/v3_identity"),
      ).toBe(true);
      await assertLegacy(page);
      expect(errors).toEqual([]);
    },
  );
test("cached synthetic verification cannot bypass an unavailable identity server", async ({
  page,
}) => {
  const server = fixture(),
    errors = await mock(page, server, { identity });
  await page.addInitScript((ref) => {
    sessionStorage.setItem("esa-synthetic-verified:" + ref, ref);
    sessionStorage.setItem("esa-synthetic-receipts:" + ref, "1");
    Object.defineProperty(navigator, "onLine", { get: () => false });
  }, ref);
  await page.route("**/rest/v1/rpc/v3_identity", (route) => route.abort());
  await seedLegacy(page);
  await page.goto("/synthetic-fixture-dist/");
  await expect(
    page.getByRole("heading", {
      name: "Synthetic tests are unavailable",
      exact: true,
    }),
  ).toBeVisible();
  await expect(page.locator("#main")).toContainText(
    "Reconnect to verify the synthetic server",
  );
  await assertLegacy(page);
  expect(errors).toEqual([]);
});
test("live database configuration is refused before any backend request", async ({
  page,
}) => {
  const server = fixture(),
    errors = await mock(page, server, { identity });
  const live = Contract.forbiddenRefs[0];
  await page.route("**/synthetic-config.js", (route) =>
    route.fulfill({
      contentType: "application/javascript",
      body:
        "window.ESASyntheticConfig=" +
        JSON.stringify({
          ...config,
          projectRef: live,
          authorizedRef: live,
          url: `https://${live}.supabase.co`,
          anonKey: publicKey(live),
        }) +
        ";",
    }),
  );
  await seedLegacy(page);
  await page.goto("/synthetic-fixture-dist/");
  await expect(
    page.getByRole("heading", {
      name: "Synthetic tests are unavailable",
      exact: true,
    }),
  ).toBeVisible();
  expect(server.calls).toEqual([]);
  await assertLegacy(page);
  expect(errors).toEqual([]);
});
