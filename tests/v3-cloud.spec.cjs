const { test, expect } = require("@playwright/test"),
  path = require("node:path"),
  AxeBuilder = require("@axe-core/playwright").default;
const {fixture,mock,ref,url,uid,parentUid} = require("./helpers/cloud-server.cjs");
async function login(page, parent = false) {
  await page.goto("/staging-fixture-dist/");
  await page
    .getByLabel("Email", { exact: true })
    .fill((parent ? "parent" : "learner") + "@fictional.invalid");
  await page
    .getByLabel("Account password", { exact: true })
    .fill("fictional-only-password");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page
    .getByLabel("PIN", { exact: true })
    .fill(parent ? "654321" : "1234");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(
    page.getByRole("heading", {
      name: parent
        ? "Staging parent dashboard"
        : "A little maths. A big adventure.",
    }),
  ).toBeVisible();
}

test("staging fails closed before sign-in when configuration is absent", async ({
  page,
}) => {
  const server = fixture(),
    errors = await mock(page, server);
  await page.route("**/staging-config.js", (r) =>
    r.fulfill({
      contentType: "application/javascript",
      body: "window.V3StagingConfig={};",
    }),
  );
  await page.goto("/staging-fixture-dist/");
  await expect(
    page.getByRole("heading", { name: "Staging is unavailable" }),
  ).toBeVisible();
  expect(server.calls.length).toBe(0);
  expect(errors).toEqual([]);
});
test("learner sign-in, incorrect PIN, unfinished quest, response loss, refresh and lock", async ({
  page,
}) => {
  const server = fixture(),
    errors = await mock(page, server);
  await page.goto("/staging-fixture-dist/");
  await page
    .getByLabel("Email", { exact: true })
    .fill("learner@fictional.invalid");
  await page.getByLabel("Account password", { exact: true }).fill("wrong");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Sign-in failed");
  await page
    .getByLabel("Account password", { exact: true })
    .fill("fictional-only-password");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByLabel("PIN", { exact: true }).fill("0000");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(page.getByRole("status")).toContainText(
    "PIN was not recognised",
  );
  expect(server.pinAttempts).toBe(1);
  await page.getByLabel("PIN", { exact: true }).fill("1234");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page
    .getByRole("button", { name: "Continue adventure", exact: false })
    .first()
    .click();
  await page
    .getByRole("button", { name: "Start building", exact: false })
    .click();
  server.loseSave = true;
  await page.getByRole("button", { name: "Hint", exact: true }).click();
  await expect.poll(() => server.progress.quest?.assisted).toBe(true);
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Try my solution" }),
  ).toBeVisible();
  await expect.poll(() => server.revision).toBeGreaterThan(0);
  await page.getByRole("button", { name: "Lock account", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Unlock your learner account" }),
  ).toBeVisible();
  expect(
    server.calls.some((c) =>
      ["award", "confirm_offline"].includes(c.body.p_operation),
    ),
  ).toBe(false);
  expect(errors).toEqual([]);
});
test("parent evidence and server reward path remain separate from learner gameplay", async ({
  page,
}, testInfo) => {
  const server = fixture();
  server.progress = {
    minutes: 2,
    practice: { place: { completed: true } },
    checks: {
      operations: { stage: 1, score: 100 },
      negative: { reteach: true, score: 33 },
    },
    recent: [
      {
        type: "check",
        id: "negative",
        date: "2026-10-20T06:00:00Z",
        assisted: true,
      },
    ],
  };
  server.wallet.coins = 13.154587166666667;
  const errors = await mock(page, server);
  await login(page, true);
  await expect(page.locator(".wallet-card").first()).toContainText("13.15");
  await page.evaluate(() => document.activeElement?.blur());
  await page.screenshot({
    path: `tests/visual/after/${testInfo.project.name}-parent.jpg`,
    fullPage: true,
    type: "jpeg",
    quality: 80,
  });
  await expect(page.getByText(/Place value: Guided practice/)).toBeVisible();
  await expect(
    page.getByText(/Addition and subtraction: Fresh independent check passed/),
  ).toBeVisible();
  await expect(
    page.getByText(/Negative numbers: Revisit teaching/),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Explore worlds" }),
  ).toHaveCount(0);
  await expect(page.getByLabel("Action", { exact: true })).toHaveValue("");
  await expect(
    page.getByLabel("Amount (1 to 60)", { exact: true }),
  ).toHaveValue("");
  await page.getByLabel("Action", { exact: true }).selectOption("award");
  await page.getByLabel("Amount (1 to 60)", { exact: true }).fill("10");
  await page.getByRole("button", { name: "Submit parent reward" }).click();
  await expect(page.getByRole("status")).toContainText("saved once");
  expect(server.wallet.bonus).toBe(10);
  await page
    .getByLabel("Action", { exact: true })
    .selectOption("confirm_offline");
  await page.getByLabel("Amount (1 to 60)", { exact: true }).fill("1");
  await page.getByRole("button", { name: "Submit parent reward" }).click();
  await expect.poll(() => server.wallet.active_seconds).toBe(60);

  const axe = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa"])
    .analyze();
  expect(axe.violations).toEqual([]);
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Staging parent dashboard" }),
  ).toBeVisible();
  expect(server.wallet.bonus).toBe(10);
  expect(errors).toEqual([]);
});
test("offline edit and reconnect, competing-device conflict and server shop ownership", async ({
  page,
  context,
}) => {
  const server = fixture(),
    errors = await mock(page, server);
  await login(page);
  await page
    .getByRole("button", { name: "Continue adventure", exact: false })
    .first()
    .click();
  await page
    .getByRole("button", { name: "Start building", exact: false })
    .click();
  await expect.poll(() => server.progress.quest?.intro).toBe(false);
  // Simulate a competing device commit before this tab sends its next change.
  server.progress = { ...server.progress, world: "geometry", view: "home" };
  server.revision++;
  await context.setOffline(true);
  await page.getByRole("button", { name: "Hint", exact: true }).click();
  await expect
    .poll(() =>
      page.evaluate(() =>
        Object.keys(localStorage).some(
          (k) =>
            (k.endsWith(":queue") &&
              JSON.parse(localStorage[k]).latest?.quest?.assisted) ||
            (k.endsWith(":queue") &&
              JSON.parse(localStorage[k]).pending?.progress?.quest?.assisted),
        ),
      ),
    )
    .toBe(true);
  await context.setOffline(false);
  await page.evaluate(() => window.dispatchEvent(new Event("online")));
  await expect(page.getByRole("dialog")).toBeVisible();
  await page
    .getByRole("button", { name: "Continue this device’s copy" })
    .click();
  await expect.poll(() => server.progress.quest?.assisted).toBe(true);
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.getByRole("button", { name: "My explorer", exact: true }).click();
  await page
    .getByRole("button", { name: "Customise explorer", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Buy Forest cap", exact: true })
    .click();
  await expect.poll(() => server.wallet.owned.includes("cap")).toBe(true);
  expect(server.wallet.coins).toBe(155);
  expect(errors).toEqual([]);
});
test("standalone downloadable preview loads as one HTML with no asset or cloud requests", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("request", (req) => {
    if (
      !req.url().endsWith("/preview-dist/PLAY-V3.html") &&
      !req.url().startsWith("data:")
    )
      errors.push("Unexpected request " + req.url());
  });
  await page.goto("/preview-dist/PLAY-V3.html");
  await page
    .getByRole("button", { name: "Open the map", exact: false })
    .click();
  await expect(
    page.getByRole("button", {
      name: "Explore Practical Maths Town",
      exact: true,
    }),
  ).toBeVisible();
  expect(await page.evaluate(() => !!window.V3CloudContext)).toBe(false);
  expect(errors).toEqual([]);
});

test("a parent award reaches an open learner shop without a progress revision", async ({
  page,
}) => {
  const server = fixture();
  server.wallet.coins = 0;
  const errors = await mock(page, server);
  await page.clock.install();
  await login(page);
  await page.getByRole("button", { name: "My explorer", exact: true }).click();
  await page
    .getByRole("button", { name: "Customise explorer", exact: true })
    .click();
  const cap = page.getByRole("button", { name: "Buy Forest cap", exact: true });
  await expect(cap).toBeDisabled();
  await expect.poll(() => server.revision).toBeGreaterThan(0);
  const before = server.revision;
  server.wallet.bonus = 60;
  await page.clock.fastForward(11000);
  await expect(cap).toBeEnabled();
  expect(server.revision).toBe(before);
  expect(errors).toEqual([]);
});

test("private account recovery uses PKCE, changes the password and returns to sign-in", async ({
  page,
}) => {
  const server = fixture(),
    errors = await mock(page, server);
  await page.goto("/staging-fixture-dist/");
  await page
    .getByLabel("Email", { exact: true })
    .fill("learner@fictional.invalid");
  await page
    .getByRole("button", { name: "Forgot account password", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("private recovery link");
  const recover = server.calls.find((c) => c.path === "/auth/v1/recover");
  expect(recover.body.email).toBe("learner@fictional.invalid");
  expect(recover.body.code_challenge).toBeTruthy();
  await page.goto("/staging-fixture-dist/?code=fictional-recovery-code");
  await page
    .getByLabel("New password", { exact: true })
    .fill("fictional-recovered-password");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Staging account sign-in" }),
  ).toBeVisible();
  expect(
    server.calls.some(
      (c) =>
        c.path === "/auth/v1/user" &&
        c.body.password === "fictional-recovered-password",
    ),
  ).toBe(true);
  expect(
    server.calls.some(
      (c) =>
        c.path === "/auth/v1/token" &&
        c.body.auth_code === "fictional-recovery-code",
    ),
  ).toBe(true);
  expect(errors).toEqual([]);
});

test("recovery rate limits show useful copy and never auto-retry", async ({
  page,
}) => {
  const server = fixture(),
    errors = await mock(page, server);
  let requests = 0;
  await page.route("**/auth/v1/recover*", async (route) => {
    requests++;
    await route.fulfill({
      status: 429,
      contentType: "application/json",
      body: JSON.stringify({
        code: "over_email_send_rate_limit",
        msg: "Rate limited",
      }),
    });
  });
  await page.goto("/staging-fixture-dist/");
  await page
    .getByLabel("Email", { exact: true })
    .fill("fictional@fictional.invalid");
  await page.getByRole("button", { name: "Forgot account password" }).click();
  await expect(page.getByRole("status")).toContainText(
    "Too many recovery requests",
  );
  await expect(
    page.getByRole("button", { name: "Forgot account password" }),
  ).toBeDisabled();
  await page.waitForTimeout(250);
  expect(requests).toBe(1);
  expect(errors).toEqual([]);
});

test("lost parent award restores the same immutable retry after refresh", async ({
  page,
}) => {
  const server = fixture(),
    errors = await mock(page, server);
  await login(page, true);
  await page.getByLabel("Action", { exact: true }).selectOption("award");
  await page.getByLabel("Amount (1 to 60)", { exact: true }).fill("7");
  server.loseAward = true;
  await page.getByRole("button", { name: "Submit parent reward" }).click();
  await expect.poll(() => server.wallet.bonus).toBe(7);
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Retry saved parent transaction" }),
  ).toBeVisible();
  await expect(
    page.getByLabel("Amount (1 to 60)", { exact: true }),
  ).toHaveValue("7");
  await page
    .getByRole("button", { name: "Retry saved parent transaction" })
    .click();
  await expect(page.getByRole("status")).toContainText("saved once");
  expect(server.wallet.bonus).toBe(7);
  const awards = server.calls.filter((c) => c.body.p_operation === "award");
  expect(awards).toHaveLength(2);
  expect(awards[0].body.p_args).toEqual(awards[1].body.p_args);
  expect(errors).toEqual([]);
});
