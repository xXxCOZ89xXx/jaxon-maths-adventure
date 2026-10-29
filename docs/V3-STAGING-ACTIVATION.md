> **Owner-confirmed project correction, 29 October 2026:** `sfogrvedypgtxfvecmbx` is **Jaxon’s Maths Adventure - Main**, never a staging target. `mbdelspbjusarbwlltol` was deleted. No hosted staging project currently exists. Earlier labels/instructions below are historical and must not be used to access either ref. Use [the current isolation handoff](STAGING-ISOLATION-STATUS.md) and [working setup guide](SINGLE-CHILD-SETUP.md); never run old commands against Main.

# V5 continuation of the existing combined acceptance session

No additional session is requested now. When the owner chooses to run the already-planned family/iPad session, include the V5 checks below in that same session. Use the existing fictional families privately inside the app; never send credentials or PINs in chat or documents.

- Start a recipe journey with Family A, prepare the missing-ingredient list and save at checkout. Resume on the physical iPad and verify the exact basket, cash and current step.
- Compare a direct supermarket worker visit with the journey's customer visit in the same building. Finish payment/change and cooking, reload the completed journey, and confirm there is no repeated payment or ingredient consumption.
- In portrait and landscape Safari, read the Cartesian axes and select a point, shade and unshade fractions by tap and horizontal painting, scroll vertically past the model, and check that every control remains reachable. Check practical response builders distinguish pence from pounds and minutes.
- Retain the existing learner/parent PIN, lock, parent bonus, purchase, family separation, cloud/offline recovery and returning-from-background checks in the original plan below. Include preservation of wardrobe, estate stage and earlier learning evidence.

These are **pending physical/live checks**, not automated or hosted results claimed by the agent. The current implementation, actual automated evidence and private deployment are [V5 scope](V5-INTERACTIVE-LEARNING.md) and [V5 QA](V5-TEST-REPORT.md). Older setup and acceptance detail follows.

---

Visual continuation: [immersive stages and camp](V3-IMMERSIVE-ADVENTURE.md). During the existing later combined session below, include the portrait bridge’s first/last destinations, landscape expedition entrances, camp place links, keepsake placement, building project and reduced-motion restoration. This extends the same session; no new passwords/PINs or separate manual tests are requested.

# Private staging activation — 20 October 2026

**Private HTTPS test site:** https://jaxon-maths-v3-private-staging.orion-shared-7254.chatgpt.site

The separate Site deployed successfully as version 1. Its access policy is custom, with only the owner, no groups, no other viewers and no external visitors. Sign into the outer site with the owning ChatGPT account on both laptop and iPad; then use the fictional Supabase accounts inside the game. No additional hosting subscription, local server or GitHub Pages change is needed. This is a private test deployment, not a release of the live game.

## Evidence and limits

| Item | Actual result |
| --- | --- |
| Four Cloud variables | Read in memory; both refs equal `sfogrvedypgtxfvecmbx`; URL equals `https://sfogrvedypgtxfvecmbx.supabase.co`; public browser key present and accepted by the build validator, never printed |
| Database setup | Owner confirms all three migrations, eight RLS-protected tables without client grants, 40 catalogue items, two fictional families/four users, and restricted importer installed |
| Live `v3_identity` request | Attempted against only the specified staging project; proxy CONNECT rejected with HTTP 403; no Supabase response obtained |
| Live unauthenticated restrictions | Unverified: after the identity request was blocked, the audit did not probe further endpoints |
| Live authenticated tests | Not attempted; no test-account passwords, PINs, service-role keys or database secrets requested or used |
| Build | `scripts/build-v3-staging.cjs` produces complete `staging-dist/`; asset/syntax checks, sign-in/PIN entry, nine worlds and 40 items verified |
| Private hosting | Native deployment reports success; owner-only access verified separately. Device-side login, staging RPC and recovery still require acceptance |

`npm run check:staging` is a reproducible password-free, read-only audit. It uses the inherited proxy and CA, pins the exact owner-confirmed project, logs no response bodies or keys, and writes `tests/artifacts/v3-live-staging.json`. It exits nonzero when blocked/unverified. Once identity succeeds, it tries only zero-row table reads and the read-only role RPC; authenticated restrictions still require the fictional account session. An HTTP error from the environment proxy is **not evidence that Supabase RLS works**.

The environment network allowlist currently omits `sfogrvedypgtxfvecmbx.supabase.co`. To allow a future Cloud live audit, add only that host to the Cloud environment network settings and restart/recreate the environment to apply it. No secret values need changing. This is optional for opening the private site from an ordinary laptop/iPad browser, whose network is separate. No attempt was made to bypass the denied host.

## Automated QA

Current-run details are in `V3-TEST-REPORT.md` and `tests/artifacts/v3-staging-activation-results.json`. PostgreSQL tests use a disposable network-disabled container and fictional signed-claim context. Browser cloud tests intercept fictional responses; they do not prove hosted Auth/PostgREST/RLS. Local WebKit download is denied by the environment proxy; the current [GitHub QA run](https://github.com/xXxCOZ89xXx/jaxon-maths-adventure/actions/runs/39411280360) passed all 88 Chromium/WebKit browser cases, all 14 PostgreSQL security suites, 24 V3 logic/sync suites, three V2 scripts and the new build checks. These are automated fictional-account tests. Physical iPad Safari remains part of the session below.

Fixed a deployment hazard: `tests/prepare-v3.cjs` previously replaced `staging-dist/` with fictional credentials. It now writes only `staging-fixture-dist/`, and the builder refuses real configuration for that fixture output. A regression test verifies that every existing deployable file remains byte-for-byte intact. The offline game still has `connect-src 'none'`; the staging game permits only its own origin and this staging Supabase URL.

## Minimum owner setup before the single session

1. Open the private link on laptop and iPad using the owning ChatGPT account. The first game screen should be **Staging account sign-in**. If it reports identity verification unavailable, record that message and check that this staging project is running; do not substitute production settings.
2. In **jaxon-maths-v3-staging only**, open Authentication → URL Configuration. Set Site URL and add the exact redirect URL `https://jaxon-maths-v3-private-staging.orion-shared-7254.chatgpt.site/`. This enables the existing same-browser PKCE recovery flow. Existing account-password sign-in does not need a recovery redirect. Do not edit production Auth or GitHub Pages.
3. Keep the four existing fictional account credentials privately in your password manager. Use confirmed fictional email inboxes if testing actual recovery delivery. Do not send passwords/PINs in chat, screenshots, PRs or feedback. Do not rerun migrations, import personal backups or recreate accounts.

## One combined family/laptop/iPad session (about 40 minutes)

Record **pass / fail / blocked** once per row, with a short symptom only. Leave recovery email addresses, account IDs, passwords, PINs, tokens and keys out of feedback. Use learner A on physical iPad Safari, parent A on laptop; use separate browser profiles for family B and a second learner-A device. Keep all test data fictional. PINs belong to each account, not each device.

| Step | Action and expected result |
| --- | --- |
| 1. Two families / role PINs | Sign into all four fictional accounts privately. Enrol/unlock learners with four digits and parents with six. A wrong PIN must fail. A wrong-length PIN must fail; never put a real PIN in feedback. If enrollment needs fresh password authentication, sign out/in and set it promptly; do not weaken the server check. Parent accounts show their own family dashboard; learners enter the game. |
| 2. iPad gameplay and evidence | In Safari portrait and landscape, open the nine-world map. Complete a Number Forest task and a Town supermarket task; use a hint and verify supported work stays distinct from independent mastery. Begin a fresh independent check when eligible. Inspect readability, tap/keyboard alternatives, focus, sound off, reduced motion, outfit and Base Camp. Fictional exercise money must not become wallet coins. |
| 3. Cloud save and session | Save midway through a quest/check, noting selections and hint state. Reload the same tab: exact progress and unlock should return. Open a fresh independent browser session/profile and sign in: PIN is required. Lock the first session: game disappears and PIN is required; sign out must remove access. A same-browser second writing tab should warn rather than race. |
| 4. Family isolation | Parent A sees A's saved evidence; parent B sees B only. Give B a distinct fictional activity/outfit and confirm it never appears for A. Learner screens must not offer parent awards; parents must not be able to play/save learner progress or buy cosmetics. Server rejection of direct restricted RPCs is covered locally; real authenticated API enforcement is still a separate verification gap unless observed during this session. |
| 5. Rewards and shop | Parent A awards a small bonus; learner A's open shop receives it without overwriting progress. Buy an affordable item, equip it and reload: one charge and one ownership entry. Reject an unaffordable purchase. Repeat for family B and check A's balance/ownership is unaffected. No production accounts or real records. |
| 6. Offline and conflicting devices | On learner A, disconnect after loading/unlocking, change an unfinished task and reconnect: queued learning saves once. Preserve browser storage. Cold offline loading is not supported. On laptop and iPad make different offline edits before either syncs; reconnect and resolve the conflict deliberately. Confirm the unchosen complete version remains archived locally and assessment answers were not combined. |
| 7. Offline-time review and retries | Parent A reviews reported learning/evidence and confirms one available uncredited minute: exactly 10 coins and one screen-time minute. Retry an interrupted transaction through its existing Retry control, never create a new award as a substitute: credit once only. If no whole uncredited minute exists, perform genuine fictional offline learning first. Weekly goal stays 60 minutes and credited screen time stays 1:1. |
| 8. Cooldown / recovery | In a fictional account, five incorrect PIN attempts should impose five minutes' cooldown. Continue other-family checks during the wait; then verify valid unlock resumes. Test account-password recovery using a privately controlled fictional inbox, requesting and opening the link in the same browser. Set/reset PIN after fresh password sign-in; old unlocks must fail on the server. Browser UI may take its next poll/action to observe revocation. Parent unlock lasts 15 minutes; learner unlock 12 hours (long expiry is SQL-tested, need not wait 12 hours). |
| 9. Finish | Return to A on physical Safari, verify quest, check evidence, coins, ownership and world restoration are preserved. Submit one consolidated feedback list; leave fictional test progress in place for diagnosis. Do not clear unsynced storage. |

Actual Auth refresh, signed password AMR claims, recovery delivery, hosted RLS/cross-family denial and physical Safari are not certified until observed. The previous automated WebKit run and current local simulations do not replace that evidence. Keep PR #2 draft. Any future merge, production schema change, live-homepage replacement or public publication requires separate approval.

## Hosting identity for continuation

- Site project: `appgprj_6ad746f124fc8191b3f3845f9dff577b` (reuse; do not create a duplicate).
- Saved version: `appgprj_6ad746f124fc8191b3f3845f9dff577b~appgver_ec418239ed0c8191983a007349ae625c`.
- Successful deployment: `appgdep_6ad747703b908191935bf34624c65329`.
- Pushed private Site source: `b2527491a33a9894f663df1af90615390a719ccb`; its static assets match the verified deployable build.
- Site source is separate from the GitHub game repository. Local staging bundle is never committed to the GitHub PR. No credentials are retained in this document.
