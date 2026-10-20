# Codex handover — V5.1 usability and automated regression

## Latest continuation: production discovery and release hold

The owner now authorises replacing production and accepts resetting learning progress where necessary, while preserving accounts, PINs and security. This supersedes the earlier deployment restrictions below. **No V5.1 cutover occurred.** The remaining block is production backend compatibility/access and live authentication verification, not general release permission.

- **Actual production:** https://xxxcoz89xxx.github.io/jaxon-maths-adventure/ — GitHub Pages legacy `main:/`, HTTPS enforced, no custom domain; successful build `1300525156`, commit **`0d0b0265d75f26efeaaaf9bfeea0f061ded2a5a0`**. The original homepage is the older shared-account prototype; deployed V2 routes also exist. The family's bookmarked route needs confirming.
- **Rollback:** pushed tag `rollback/production-before-v51-0d0b026`; verified complete Git bundle, original source archive and Pages configuration manifest under restricted `/workspace/work/v51-production-rollback/`. No data writes/downloads occurred; a private database backup is still required before any future schema/data change.
- **Production Supabase:** `mbdelspbjusarbwlltol`. The original homepage uses account-owned `learning_progress` and explicitly says parent buttons are not separately secured. The V2 adapter expects different family/reward APIs; actual hosted schema and policies remain unknown. Do not treat either source as proof of live permissions.
- **V5.1 backend gap:** answer-saving fixes need no new JSON schema, but the adventure's connected adapter requires V3 server PIN/unlock, role, CAS and wallet APIs and a pinned staging identity. There is no reviewed production configuration/migration. Do not repoint staging or deploy offline Test Camp as production.
- **Verification:** reconfirmed the exact green hosted 344-case source and byte-identical application/harness. Fresh `npm test`, configured staging build/verification, build isolation and all 14 disposable PostgreSQL suites passed. A production build is not available or certified. Latest interaction fixes, nine worlds and 55 skills are present.
- **Live Auth:** production page and production Supabase health probes both stopped at proxy CONNECT **HTTP 403**. No identity/login/PIN request reached production. Normal parent/learner Auth, PINs, role restrictions, live saves and reward denials remain blocked/unverified. No genuine learner identity was used.
- **Private preview:** unchanged, owner-private V5 version 5, not the production game. PR #2 remains draft/unmerged. No Auth accounts, PINs, grants, policies or records were altered.
- **Owner involvement:** permit the exact website/production/staging Supabase hosts through supported environment configuration; provide trusted read-only production schema access or a private schema-only export and confirm the bookmarked route. Then review a concrete compatibility proposal for existing identities/PINs, enable private backup/restore, and securely bind dedicated fictional accounts for hosted checks. No passwords/PINs or exports in GitHub/chat. Replacement authorisation is already granted.
- **Physical iPad:** not performed. The concise Safari/PIN/map/input/gesture/bill/fraction/coordinate/hint/save/shopping-cooking checklist and exact deployment/rollback procedure are in [V5.1 live release record](V51-LIVE-RELEASE.md). Next priority is production integration and hosted security verification, then that single device session.

The rest of this handover records the completed V5.1 development milestone. Its earlier “no deployment authorised” language is historical and superseded by this continuation.

Branch `codex/v3-adventure-build`; [Draft PR #2](https://github.com/xXxCOZ89xXx/jaxon-maths-adventure/pull/2), unmerged. **Application: `2f30f72`; final QA harness: `a0da7d4`**; V5 baseline: `2ca7639`. The latest user request authorises all eight V5.1 priorities and supersedes the earlier Phase 1-only request. All eight priorities are implemented and the final hosted regression is green. No deployment occurred: the owner-private site still serves V5.

## Priority status

| Priority | Completed work |
| --- | --- |
| 1. Typed answers | Shared validation, persistent raw drafts, clear invalid feedback and guarded Enter submission. Empty/invalid edits cannot submit an older value. Model/readout updates preserve focus/caret. Queued edits must still match world, mission seed, practice round and question; they cannot overwrite a replacement/completed task. |
| 2. Slow controls | Direct entry in scalar expeditions, numeric supported practice and original scalar quests. Text inputs prevent wheel/spinner changes. Mission money uses integer pence; practice entry matches the question's pounds/pence unit, with exact two-decimal pounds conversion into model pence. Budget envelopes have £5/£10 shortcuts and wrapping touch controls. |
| 3. Bill sharing | Reusable equal-share fraction bar, per-friend fictional UK money, and allocated/remainder totals. Shared by café missions and supported `town_split` practice. Old saved café tasks use a prompt-derived metadata fallback. No models during independent checks/discovery. |
| 4. Nine-world audit | Renderer contracts cover 1,107 task variants: every route, three tiers and three seeds. Browser profiles sample all 55 skills; bounded shading/grouping controls remain mathematical actions. |
| 5. Isolated identities | Node/Playwright-only fresh contexts, four deterministic progress profiles, intercepted parent/learner sessions, reset and cleanup. No app auth hook, public bypass, remote account creation or service-role key. Existing sign-in/PIN UI tests and real PostgreSQL permissions tests remain separate. |
| 6. Expanded journeys | All 55 skills under four profiles; complete supported-to-independent rounds in each world; assistance/freshness, exact reloads and role checks. Authenticated fixture recipe journey verifies every stage against save transport and parent review. Existing all-world/venue, coins/time, shop, estate, achievements and recovery tests remain. |
| 7. Repeatable regression | Focused npm commands, four-project CI including iPad WebKit, isolated networking, coverage attachments and JSON summary. CI uses two workers; local default remains one. Separate output/report paths are required for supplemental runners. |
| 8. Existing issues | Fixed blank clocks submitting older times, stale queued edits crossing quests, pounds/pence entry mismatch, live model/readout updates, dot/array accessibility roles and cramped budget controls. Original V2 files are unchanged. |

Foundation uses the supported band-5 floor plus prerequisite gaps (approximate Year 4/5 needs); Developing mixes evidence/gaps; Advanced has repeated strong independent evidence; New has no history. These synthetic profiles make no assumptions about the real learner. Seeded discovery histories are complete, valid records. New-learner discovery rounds are exercised across all 55 skills in pure-engine checks. Existing engine suites also cover full practice/fresh/spaced mastery for all skills; browser profiles sample each skill and complete representative rounds in every world.

## Actual verification

- **258 distinct local browser cases passed**, zero failed/skipped/flaky: desktop and both iPad Chromium layouts. The 249-case broad run passed in 30.3 minutes; subsequent focused results replace overlapping earlier cases rather than inflating totals.
- Final focused input run: **27/27 passed**, including decimal pounds, invalid drafts, exact reloads, wrong-first evidence, clocks, cross-tab save-lock races and budget touch layout.
- Final monetary profile recheck: **36/36 passed** across affected Fraction Desert, Ratio Island and Town skills, all four profiles and three layouts.
- Authenticated fictional lentil journey: **3/3 passed**, including transport saves, reloads, finite receipts and parent review.
- Browser coverage: **nine worlds, 55 skills, four profiles, 660 skill visits and 108 complete independent rounds**. [Summary](../tests/artifacts/v5-1-summary.json) · [Combined actual results](../tests/artifacts/v5-1-browser-results.json) · [Verification scope](../tests/artifacts/v5-1-verification.json). Raw broad/focused sources are named in the combined report.
- `npm test` passed, including all existing compatibility/model suites, 14 V5 model suites, valid/resettable profile/discovery checks and the [1,107-variant renderer audit](../tests/artifacts/v5-1-input-audit.json).
- `npm run test:staging-build` passed pinned configuration and fixture/deployable-byte isolation.
- `npm run test:security`: **14/14 real disposable PostgreSQL suites passed**, network disabled and fictional Auth claims. [Output](../tests/artifacts/v5-1-security-results.txt). This is not hosted Supabase Auth/RLS certification.
- Hosted CI: [run 39502533251](https://github.com/xXxCOZ89xXx/jaxon-maths-adventure/actions/runs/39502533251), exact QA source `a0da7d4`, **344/344 cases passed (22.2 minutes), zero failures/skips/flaky cases**; 86 per browser project, including iPad WebKit. Hosted coverage: **880 skill visits and 144 complete independent rounds**, all nine worlds/55 skills/four profiles ([decoded evidence](../tests/artifacts/v5-1-hosted-results.txt)). The first complete hosted run had one legacy WebKit walkthrough timeout while repeating arrows. Its helper now uses direct entry; only this 24-puzzle + accessibility walkthrough gets a 120-second total budget (per-action limits remain 15 seconds). The revised journey/save/concurrency checks passed **9/9 locally**. HTTP error logging remains; routine asset logs are suppressed by `tests/serve-preview.py` so full CI results fit decoded log limits. Local WebKit downloads were blocked by proxy policy; hosted WebKit is now verified. Superseded runs were cancelled by workflow concurrency and are not presented as passes.
- Reviewed captures: [desktop](../tests/visual/v51/desktop-equal-sharing.png), [portrait](../tests/visual/v51/ipad-portrait-equal-sharing.png), [landscape](../tests/visual/v51/ipad-landscape-equal-sharing.png).

The queued-input defect was reproduced before fixing: a blocked measurement edit wrote `123` into another tab's new algebra quest (expected `0`). Its regression now passes on all three Chromium layouts. Early harness issues—header navigation/disclosures, incomplete journey fixture ledgers, asynchronous save assertions and discovery fixture schema—were corrected. No unresolved failure remains in the local matrix.

## Files and architectural constraints

- Application: `v3/{app,adventure-ui,adventure,hands-on,journey}.js`, `v3/style.css`.
- Tests: `tests/v3-browser.spec.cjs`, `tests/serve-preview.py`, `tests/v5-{hands-on.cjs,interactions.spec.cjs}`, `v51-regression.spec.cjs`, `v51-fixtures.cjs`, `helpers/{profiles,identities,cloud-server}.cjs`; existing `v3-cloud.spec.cjs` reuses the extracted fictional server.
- Process/evidence: `scripts/{audit-v51-inputs,summarize-v51}.cjs`, `package.json`, `playwright.config.cjs`, `.github/workflows/v3-offline-qa.yml`, linked JSON/visual files.
- Extend existing pure engines/renderers and the versioned journey ledger. Optional `amountDraft`/`clockDraft` text stays separate from validated numeric state. Taps clear stale drafts; only a current, unsolved question accepts a queued edit. Practice pounds convert into integer model pence; submitted practice values remain in the original question unit.
- Preserve first-attempt/assisted evidence separately from independent mastery; no schema change was required. Preserve nine worlds/55 skills, eight venues, journey inventory, wallet/wardrobe/estate, **60 minutes/week, ten coins per active minute and 1:1 screen time**.
- This session changed no production Auth, Supabase SQL/RLS, original live homepage or original V2 source. Test identities exist only in isolated fixture contexts and mocked APIs. No genuine learner records were requested, read or reset; no release was merged, published or deployed.

## Exact resume point and remaining gates

All eight implementation priorities and automated regression are complete. Start a new session with `AGENTS.md` and this handover, then resume the existing consolidated physical-device and verified fictional-staging acceptance work. Do not recreate the test profiles, restart the game or treat Phase 2 from the earlier handover as unfinished. PR #2 remains draft and unmerged.

The latest production continuation above now governs release work. Physical Safari scrolling, virtual keyboard/minus/decimal entry, gestures, performance and assistive-technology review remain outstanding. Actual hosted login/PIN/RLS, genuine cross-device/offline recovery and deferred recovery delivery remain unverified. The proxy CONNECT 403 must not be bypassed. Production replacement is authorised subject to the security checks; incompatible authentication/schema decisions and missing access remain blockers. See [the concrete release hold and next steps](V51-LIVE-RELEASE.md).

## Commands

After `npm ci`: `npm test`; `npm run test:staging-build`; `npm run test:security`; `npm run test:answers`. Prepare fixtures with `node tests/prepare-v3.cjs` before `npm run test:profiles`. Full hosted-equivalent matrix: `V3_WEBKIT=1 V51_REPORT=tests/artifacts/v5-1-browser-results.json npm run test:e2e`; summary: `npm run report:v51`.

In this managed environment npm cache is `/workspace/work/npm-cache`; localhost browser/server, GitHub and Docker operations need the supported network permission. Local WebKit is blocked by policy. Use one local Playwright runner or distinct output/report paths; fixtures reset by closing their private browser contexts.

References: [AGENTS](../AGENTS.md), [V5 baseline evidence](V5-TEST-REPORT.md), [V5 architecture](V5-INTERACTIVE-LEARNING.md), [test isolation](V3-TEST-ISOLATION.md), [secure staging](V3-SECURE-STAGING.md).
