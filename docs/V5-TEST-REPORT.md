> **Owner-confirmed project correction, 29 October 2026:** `sfogrvedypgtxfvecmbx` is **Jaxon’s Maths Adventure - Main**, never a staging target. `mbdelspbjusarbwlltol` was deleted. No hosted staging project currently exists. Earlier labels/instructions below are historical and must not be used to access either ref. Use [the current isolation handoff](STAGING-ISOLATION-STATUS.md) and [working setup guide](SINGLE-CHILD-SETUP.md); never run old commands against Main.

# V5 interactive expansion — verified QA and private preview

Final application tree: `98ff3886738f1e87f90b662419e81609bdd93789` on `codex/v3-adventure-build`, draft PR #2. [World/55-skill coverage, complete journey and limits](V5-INTERACTIVE-LEARNING.md) · [V4/V5 coordinate comparison](https://jaxon-maths-v3-private-staging.orion-shared-7254.chatgpt.site/review/coordinates.html).

| Check | Actual result and scope |
| --- | --- |
| Logic and compatibility | All three V2 regression scripts, 42 V3/V4/V5 engine/expedition/estate/cloud model suites, presentation checks and synthetic migration/rollback rehearsal pass. This includes 13 new V5 suites and 1,107 generated task steps across every route, three tiers and three seeds |
| Constructed practice | 2,073 supported responses validate across all 55 skills, all five bands and three round seeds. Unsupported/out-of-range variants use conventional answers. Pence/pounds/minutes are separate; improper fractions unsupported by one-whole shading do not get that widget. Two duplicate generator rounds are safely skipped by the freshness loop |
| Local integration browsers | **111/111 passed**, no skipped/unexpected/flaky cases, desktop and both iPad Chromium layouts; this broad run preceded the final unit-mapping/label refinements |
| Latest V5 browser cases | **21/21 passed** across the same three layouts after unit mappings and shuffled labels, covering real model operations, wrong-first evidence, retries, exact reloads, axes, touch painting, ruler/volume, money/time units and complete journey. Final two label corrections are covered by hosted QA |
| Hosted Chromium/WebKit | **152/152 cases passed**, including iPad WebKit; [run 39487130881](https://github.com/xXxCOZ89xXx/jaxon-maths-adventure/actions/runs/39487130881), exact application tree `98ff388`. Decoded logs report 152 passed (11.8m), 13 V5 suites and 14 PostgreSQL suites; all logic/build/preview-packaging steps passed |
| Database security | **14 real disposable PostgreSQL suites pass**, network-disabled container with fictional Auth claims; not hosted Supabase authentication or RLS certification |
| Visual QA | **125 fresh game captures**: 74 refreshed existing views plus 51 V5 views. Four actual V4 references and earlier history bring the album to **147 images**. Captures pass console/rendering, invalid-readout, overflow and denied-external-network checks |
| Packaged gallery | All nine pages decode: index 147, worlds 18, Town 19, earlier comparison 14, estates 8, estate comparison 5, architecture 17, V5 interactive 55, Cartesian comparison 2. No broken images, console errors or external requests; new pages fit desktop and both tablet orientations |
| Staging build | Configured project/URL/key guard, complete sign-in/PIN entry, nine worlds, 55 skills, 40 catalogue items and new modules pass. Fictional preparation preserves every deployable byte; standalone offline preview builds without cloud networking |
| Preservation | All five original live/V2/SQL hashes match their baseline. The configured publishable key is absent from tracked GitHub files. Existing balances, equipment, projects, exact tasks, milestones, mastery evidence and unknown historical fields are retained |
| Private Site | **Version 5 deployed successfully** at the same [owner-private HTTPS site](https://jaxon-maths-v3-private-staging.orion-shared-7254.chatgpt.site/). Rechecked after deployment: one owner, no groups or external visitors; existing fictional staging accounts/progress retained |

The initial broad local run passed all gameplay assertions but one teardown failed when two Playwright commands shared the same `test-results` directory and removed a trace file. The clean matrix was rerun on its own and passed 111/111. Future local matrices must use one Playwright runner at a time or separate output/report directories. This was not a live-game failure.

Review also corrected a missing journey view in legacy loading, retained completed supported-practice attempts after recap, bounded retries per question, incorrect monetary/time response units, unrepresentable model answers, repeated answer-slot patterns, explicit placement placeholders and sample-space accessibility copy. A rejected duplicate question round now advances to the next deterministic fresh set rather than surfacing a browser error. No curriculum bank was replaced.

## Actual staging network result

All four environment values validate against `sfogrvedypgtxfvecmbx` / `https://sfogrvedypgtxfvecmbx.supabase.co`, with the public key redacted. The read-only `v3_identity` request remains blocked by **proxy CONNECT 403 before contacting Supabase**. No live identity/table-denial or authenticated success is claimed. No account credentials or fictional staging learner records were requested, read or reset. Browser cloud calls use intercepted fictional APIs; SQL uses fictional claims. Owner-reported earlier hosted account/PIN/save/reward/family checks remain separate evidence.

## Private deployment provenance

The native deployment succeeded as **version 5**. Pushed Site source: `bf5db63681e57de429b96dded98dc8744c2a48e7`; deployment: `appgdep_6ad7c9f6aa848191b85d0dfefeb99428`; saved version: `appgprj_6ad746f124fc8191b3f3845f9dff577b~appgver_a6580019b03081919234d0e27b0d4998`. Native saved-version provenance matches the pushed source.

All **183 application files** in the supplied archive match the validated build byte for byte. Local tar SHA-256: `179d63a08aa707a1a7459aad2b7f61af7404d5ba0e3d53e325fbd1fe33c5bf74` (22,210,560 bytes). Native storage reports **184 files** including the hosting manifest and content hash `sha256:5d660395c07761c60d3b9582ecb7b291c437b7779056a75bda2803f7b6363c96` (22,200,320 bytes). Native content hash and supplied raw tar SHA-256 are recorded separately. The post-deployment audience is still one owner, no groups, no external visitors.

Native source/deployment/audience checks are distinguished from remote-byte comparison. The complete local archive is compared byte for byte against the verified build; independent native stored-archive download is unavailable. Packaged pages are browser-tested locally. The Site is not publicly published.

Machine evidence: `tests/artifacts/v5-results.json`, `v5-interaction-coverage.json`, `v5-practice-model-validation.json`, `v5-gallery-results.json` and `v5-gallery-layout.json`. The main JSON retains all 111 integration case names/statuses and the final 21-case evidence. Full final hosted browser reports/traces belong to the linked Actions run. Older generic `tests/artifacts/v3-browser-results.json` and generic PNGs remain historical; current visual deliverables are `tests/visual/after/`, `tests/visual/v5/` and `tests/visual/v4-baseline/`.

## Remaining limits and external gates

All 55 skills remain accessible, but not every question has a bespoke manipulative. Four sampled practice areas remain conventional, unsuitable variants use their existing answers, and most placement uses tap/select/place. The two recipe variants share quantities; more recipes and journeys are future work. Discoveries are specified only, not implemented.

Physical iPad Safari/native scrolling and gestures/performance, actual cross-device/offline recovery, direct hosted API enforcement and deferred email recovery delivery remain in the existing combined session. Emulated WebKit is not physical-device certification. No additional manual acceptance session is requested now. Production, real learner records, main, live homepage and GitHub Pages are unchanged; PR #2 remains draft and unmerged.
