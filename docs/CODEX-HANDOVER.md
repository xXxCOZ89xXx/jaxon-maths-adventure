# Codex handover — V5.1 usability and automated regression

Branch `codex/v3-adventure-build`; [Draft PR #2](https://github.com/xXxCOZ89xXx/jaxon-maths-adventure/pull/2), unmerged. Application changes: `37174f1`; additional authenticated journey test/visuals: `725e653`; valid fictional discovery history and 55-skill discovery checks: `98084e0`. V5 baseline: `2ca7639` (application `98ff388`). **The latest user request authorises all eight V5.1 priorities**, superseding the earlier Phase 1-only request. No deployment is authorised or performed; the existing owner-private site still serves V5.

## V5.1 implementation status

| Priority | Implementation and verification scope |
| --- | --- |
| 1. Typed answers | Shared strict integer validation; raw drafts saved separately from validated values; empty/malformed/fractional/out-of-range drafts cannot submit a stale answer. Enter uses the ordinary guarded submit path. Typed/tapped correction and reload preserve first-attempt evidence. Focus and caret survive model updates. |
| 2. Numeric controls | Direct entry in scalar expeditions, numeric constructed practice and original scalar quests. Text inputs prevent accidental wheel/spinner changes. Currency inputs explicitly use integer pence. Budget envelopes add £5/£10 shortcuts; bounded grouping/shading controls remain mathematical actions. |
| 3. Bill sharing | Reusable equal-share fraction bar, friend payments, fictional UK money and allocated/remainder totals. Used in café missions and supported `town_split` practice; original saved café tasks use a prompt-derived metadata fallback. Models never render during independent checks/discovery. |
| 4. Nine-world audit | Renderer contracts pass 1,107 task variants across all routes, three tiers and three seeds. Browser profile matrix samples every one of the 55 skills; representative complete practice/fresh-check journeys run in each world. |
| 5. Testing identities | Node/Playwright-only fresh contexts, four deterministic fictional progress profiles, intercepted parent/learner sessions and reset/cleanup. No app auth hook, public bypass, remote identity creation, real credentials or service-role key. Existing sign-in/PIN UI tests and real PostgreSQL permission tests stay separate. |
| 6. Expanded journeys | All 55 skills under each profile; full supported-to-independent round in each world, assistance/freshness checks, exact reloads. Existing tests retain nine-world expeditions, all venues, coins/time, shop, camp/estate, achievements and complete journey. New authenticated fixture journey checks every stage against intercepted save transport and parent review. |
| 7. Repeatable regression | Focused npm scripts, four-project CI including emulated iPad WebKit, fail-closed local networking, per-test curriculum coverage attachments, JSON summary and reset fixtures. CI timeout increased to fit the expanded matrix. |
| 8. Existing issues | Fixed blank clock drafts submitting old times, live numeric model/readout updates, and missing image roles in array/dot models. Original V2 sources remain unchanged. Final broad regression is in progress. |

Profiles are synthetic scenarios: Foundation uses the supported band-5 floor with prerequisite gaps (approximate Year 4/5 needs); Developing mixes bands/gaps; Advanced has repeated strong independent evidence; New has no history. They make no assumptions about the real learner. Browser profile coverage samples supported interfaces; complete mastery/freshness/spaced checks for **all 55 skills** also remain covered by existing pure-engine suites.

## Actual verification at this milestone

- `npm test`: passed, including new profile/isolation checks, numeric/clock validation and input audit.
- `npm run test:staging-build`: passed pinned configuration and fixture/deployable-byte isolation.
- `npm run test:security`: **14/14 real disposable PostgreSQL suites passed**, network-disabled container, fictional Auth claims ([output](../tests/artifacts/v5-1-security-results.txt)). Not hosted Supabase Auth/RLS certification.
- Initial focused input matrix: **18/18** desktop/iPad Chromium cases passed; added clock/model cases are in the current broad run.
- Authenticated fictional lentil journey: **3/3** passed, desktop and both iPad Chromium layouts (57.7s), isolated output directory. [Machine evidence](../tests/artifacts/v5-1-family-journey-results.json).
- Full local Chromium run: **249 cases in progress (166/166 desktop + portrait passed; landscape underway)**, with the three additional authenticated-journey cases reported separately. Final totals/coverage summary must replace this milestone entry.
- Final hosted CI: [run 39495120026](https://github.com/xXxCOZ89xXx/jaxon-maths-adventure/actions/runs/39495120026), `98084e0`, in progress. Earlier push/PR runs were superseded by workflow concurrency, not application failures.
- Local WebKit installation is blocked by proxy destination policy (403 on browser distribution hosts); no bypass attempted. CI installs/runs WebKit separately.
- [Renderer audit](../tests/artifacts/v5-1-input-audit.json). Reviewed equal-sharing screenshots: [desktop](../tests/visual/v51/desktop-equal-sharing.png), [portrait](../tests/visual/v51/ipad-portrait-equal-sharing.png), [landscape](../tests/visual/v51/ipad-landscape-equal-sharing.png).

Early harness failures were corrected: navigation uses the actual header `data-nav` controls; Town lessons need their visible disclosure opened; journey fixtures must include the completed-stage ledger; asynchronous Enter assertions wait for saves. Newly exercised multiplication accessibility failures were fixed in V3 rendering. An initial staging-build attempt was blocked by sandbox child-process permissions; the permitted rerun passed.

## Files and architecture

- Application: `v3/app.js`, `adventure-ui.js`, `adventure.js`, `hands-on.js`, `journey.js`, `style.css`.
- Tests: `tests/v5-hands-on.cjs`, `v5-interactions.spec.cjs`, `v51-regression.spec.cjs`, `v51-fixtures.cjs`; `tests/helpers/{profiles,identities,cloud-server}.cjs`. Existing `v3-cloud.spec.cjs` reuses the extracted fictional server.
- Regression/reporting: `scripts/{audit-v51-inputs,summarize-v51}.cjs`, `package.json`, `playwright.config.cjs`, `.github/workflows/v3-offline-qa.yml`, linked JSON/visual evidence.
- Extend the existing pure engines/renderers and versioned journey ledger. Optional `amountDraft`/`clockDraft` text does not replace validated numeric state. Taps clear stale drafts. Saves retain guided first-attempt evidence separately from independent mastery. Units remain integer pence/minutes; unsuitable practice variants retain choices.
- Preserve nine worlds/55 skills, eight Town buildings, wallet/wardrobe/estate, **60 active minutes/week, ten coins/active minute and 1:1 screen time**. No new schema, RLS, live homepage or original V2 changes.

## Remaining gates and exact resume point

Collect the full local report and final CI outcome; fix any failing case, rerun affected checks, update this handover with actual totals, then update PR #2. Do not end with an in-progress claim presented as a pass.

Physical iPad Safari scrolling, virtual keyboard/minus-key entry, gestures, performance and assistive-technology review remain outstanding. Emulation is not hardware certification. Actual hosted login/PIN/RLS, real cross-device/offline recovery and deferred recovery delivery remain unverified; the previous staging proxy CONNECT 403 must not be bypassed. Do not read/reset genuine learner records, change production Auth, apply remote migrations, merge, publish or deploy. Keep the existing private V5 preview unchanged.

Commands after `npm ci`: `npm test`; `npm run test:staging-build`; `npm run test:security`; `npm run test:answers`; prepare fixtures with `node tests/prepare-v3.cjs` before `npm run test:profiles`; full matrix `V3_WEBKIT=1 V51_REPORT=tests/artifacts/v5-1-browser-results.json npm run test:e2e`; `npm run report:v51`. Use one Playwright runner at a time, or distinct output/report paths for supplemental tests. This environment uses `/workspace/work/npm-cache`; localhost browser/server, GitHub and Docker operations need the supported network permission.

References: [AGENTS](../AGENTS.md), [V5 results](V5-TEST-REPORT.md), [V5 architecture](V5-INTERACTIVE-LEARNING.md), [test isolation](V3-TEST-ISOLATION.md), [secure staging](V3-SECURE-STAGING.md).
