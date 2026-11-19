const { test, expect } = require("./helpers/identities.cjs");
async function settled(p) {
  await p.waitForFunction(
    () => !document.documentElement.hasAttribute("data-saving"),
  );
}
for (const [name, answer, input, unit] of [
  ["rounded fraction", "1/12", "0.0833", ""],
  ["mixed number", "39.166667", "39 1/6", ""],
  ["currency", "12.5", "£12.50", "pounds"],
])
  test(`Phase 3 marking: ${name} is accepted through the real practice controls`, async ({
    camp,
  }) => {
    const { page: p, key, read } = camp;
    await p.evaluate(
      ({ key, answer, unit }) => {
        const s = {
          ...V3Engine.fresh(),
          startingProfile: window.FictionalStartingProfile,
        };
        s.tourSeen = true;
        const q = V3Content.rows(
          "written_methods",
          [
            [
              `Give the result${unit ? " in " + unit : ""}.`,
              answer,
              [],
              null,
              "Use the supplied quantities.",
              { contentVersion: 8, unit, activity: { kind: "number" } },
            ],
          ],
          { band: 6, round: 1 },
        )[0];
        s.learning = {
          id: "written_methods",
          mode: "practice",
          policyVersion: 3,
          qs: [q],
          i: 0,
          round: 1,
          correct: 0,
          assisted: false,
          started: true,
          answered: false,
        };
        s.view = s.resumeView = "practice";
        localStorage.setItem(key, JSON.stringify(s));
      },
      { key, answer, unit },
    );
    await p.reload();
    await settled(p);
    await p.locator("[data-c8-input]").fill(input);
    await settled(p);
    await p.locator('[data-action="c8-check"]').click();
    await settled(p);
    const state = await read();
    expect(state.learning.answered).toBe(true);
    expect(state.learning.responses[0].correct).toBe(true);
    expect(state.learning.responses[0].firstIndependent).toBe(false);
    expect(state.skills).toEqual({});
  });
test("Phase 3 marking: an old paused fraction question retains its original validator", async ({
  camp,
}) => {
  const { page: p, key, read } = camp;
  await p.evaluate((key) => {
    const s = {
      ...V3Engine.fresh(),
      startingProfile: window.FictionalStartingProfile,
    };
    s.tourSeen = true;
    s.learning = {
      id: "written_methods",
      mode: "practice",
      policyVersion: 2,
      qs: [
        [
          "Give the fraction as a decimal.",
          "0.0833333333",
          [],
          null,
          "Divide 1 by 12.",
          { contentVersion: 8 },
        ],
      ],
      i: 0,
      round: 1,
      correct: 0,
      assisted: false,
      started: true,
      answered: false,
    };
    s.view = s.resumeView = "practice";
    localStorage.setItem(key, JSON.stringify(s));
  }, key);
  await p.reload();
  await settled(p);
  const before = (await read()).learning.qs;
  await p.locator("[data-c8-input]").fill("0.0833");
  await settled(p);
  await p.locator('[data-action="c8-check"]').click();
  await settled(p);
  expect((await read()).learning.answered).toBe(false);
  expect((await read()).learning.qs).toEqual(before);
  await p.locator("[data-c8-input]").fill("1/12");
  await settled(p);
  await p.locator('[data-action="c8-check"]').click();
  await settled(p);
  expect((await read()).learning.answered).toBe(true);
  expect((await read()).learning.correct).toBe(0);
  expect((await read()).skills).toEqual({});
});
