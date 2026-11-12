# Base Camp artwork and parent reset review — 12 November 2026

Continued on `codex/base-camp-progression-refresh` from verified local and remote head `31769e2e220ca66d1b7161171d22d83c0908680b`. Its merge base is the current `release/ipad` head `f1b88c95326e6ba5145e8abd97306df0431b3a1a`. The starting working tree was clean; the earlier progression/build changes are retained. No PR, merge, deployment, live schema change or real learner reset was performed.

[Before/after and reset gallery](index.html) · [Artwork mapping](ARTWORK-MAPPING.md) · [Exact asset manifest](../../../v3/assets/base-camp/manifest.json) · [Reset server design](../../../supabase/base-camp/README.md) · [Validation results](validation.json)

## Artwork integrated

The original main pack remains integrated at all **54** proposed paths. The two supplemental packs replace exactly **nine** exports: the three planned project cards, the three display backgrounds, and Copper compass (`number|0`), Oasis seed (`fractions|0`) and Generator cog (`algebra|0`). The other 45 files, including completed cards and camp props, are unchanged from `31769e2`. The manifest records all three source packs, source/output hashes, full-source replacement bounds, output dimensions and alpha. Source README files are retained as provenance and art guidance; they do not change the user's restrictions.

The new display scenes retain their full 2172×724 proportions in a 3:1 layout. Unfinished project sources fit into 768×576 transparent cards; detailed keepsakes fit into 512×512 transparent canvases. No stretching, background removal, generation or flattening of supplied object transparency is used. The same detailed keepsake export is rendered in both sections. Pixel comparison confirms that all nine outputs exactly match the full supplied source after proportional fitting, including alpha and shadows. Dead procedural fallbacks were removed, and rendered-page checks verify that these three sections contain supplied images with no SVG/canvas substitutes, missing images or overflow.
“Your adventures on display” now uses the supplied shelf, garden and gate surfaces with separately placed earned keepsakes. The collection uses the supplied collection surface and the same identity-specific keepsake files. Project cards use distinct planned/completed artwork. A project appears as a camp prop only when `campProjects[id] === true` is actually saved. The older higher-tier backgrounds also contain fixed project buildings, so those backgrounds (and previews) are gated by their depicted projects too. An existing simpler approved background is used until those projects are built, with a live explanatory caption; logical levels stay unchanged. Clean project-free higher-tier backgrounds remain an art dependency for showing every architectural upgrade independently of project completion. Titles, item names, milestone counts, status labels, selectors, Build buttons and reset controls remain accessible live HTML.

The previous name-substring art mismatch is removed: `number|0` gets the supplied copper compass even if its displayed name changes. The art also works in retained SVG scenes via SVG image elements. Production, the isolated public demo and the standalone offline preview package the crops; the demo gains no account, parent portal or reset capability.

No new art was generated. Source alpha, proportions and contact shadows are retained. Some supplied sheets include translucent coloured/white halo or matte pixels, especially Town keepsakes and projects; those pixels remain as supplied. Cleaner source transparency would require a separate art revision.

## Progression retained

New/reset games start at **Base Camp Level 1**, with **zero completed builds**, no earned keepsakes and no milestones. Later levels require the earned, sequential upgrade action. Merely entering camp does not grant levels, builds, coins or rewards. Home thresholds remain `0, 4, 10, 18, 30, 45, 65, 85`; project thresholds remain `12, 30, 60`. Completed builds save and resume. Existing progress stays intact unless a parent explicitly confirms the new total reset.

## Parent total game reset

The connected parent portal has a distinct **Reset all game progress** control. Its dialog lists what will be cleared and preserved, requires typing `RESET ALL GAME PROGRESS`, and offers Cancel. It does not run automatically or queue a reset to replay on startup. A lost response can be retried in that dialog with the same request UUID and unchanged payload; the server acknowledges the original reset without erasing newer play again.

The server uses the existing signed-in identity, unambiguous family relationship and PIN unlock to authorize the operation. It derives the learner from the family link and accepts no target learner ID. Learner, anonymous, expired-unlock and cross-family-token attempts are refused. Revision and generation checks reject stale confirmations. The reset is one atomic transaction under the existing per-learner wallet lock.

Cleared active state includes the entire authoritative progress JSON: learning and independent mastery, starting-point answers/history, Base Camp levels/builds/keepsakes, avatar selection/ownership/equipment, activity/session snapshots and paused/resumable work, weekly/active learning totals, coins and reward progress. The authoritative wallet also clears learning/bonus coins, ownership and active/opening/redeemed reward entitlements. Account identities/passwords, complete PIN records, family links and parent/access configuration remain unchanged. Financial/reset audit records and frozen legacy records are retained as audit history, not restored into gameplay; this is not a backup-erasure feature.

The game generation advances and learner unlocks are revoked. Old saves, conflict choices, heartbeat/purchase/reward requests and transaction IDs cannot cross that boundary. New clients isolate game caches, save/conflict queues and financial intents by the verified generation. Old local bytes are quarantined rather than replayed into the fresh game. Stale active learner tabs stop on server refusal and must unlock again. Disconnected devices cannot be remotely erased; their old writes are refused when they reconnect.

**The server migration is a review draft and has not been applied remotely.** Installation itself executes no reset. This task did not query the live database to inspect migration state. On a server without that upgrade, the reset control stays disabled and normal generation-zero play/saves remain compatible. Jaxon’s live data has not been read or reset. After a separately approved release and deliberate parent reset, his next unlock will start the fresh Level 1 game; deployment alone will not reset it.

## Evidence and results

All fixtures are fictional. Browser cloud requests are intercepted in memory; SQL checks run in disposable PostgreSQL containers with networking disabled. Original before/after progression evidence is retained. Before-supplement captures at `31769e2` are under `before-supplements/`; current exact-section and functional captures are under `refined/`. Earlier progression and main-pack integration galleries remain available; parent confirmation, post-reset parent view and fresh learner captures are under `reset/`. The gallery groups all four layouts: desktop 1440×1000, iPad portrait 820×1180, iPad landscape 1180×820 and small touch 360×800.

| Check | Result |
| --- | --- |
| Baseline `npm test` | Passed |
| Base Camp logic, art integrity and browser checks | Passed: 8 camp logic groups, 54 hashed mapped assets / 41 stable IDs, and 12 layout/browser cases |
| Reset authorization/recovery SQL | Passed against both production-shaped and compact-receipt staging schemas; includes role/family/token refusal, stale queues/receipts, idempotency, atomic rollback, unchanged account/PIN/family/config records, and legacy-write fencing |
| Reset browser checks | 12 passed across all four layouts, including cancellation, lost response retry, fresh game and quarantined stale queue |
| `npm run test:ipad-release` | Passed: cloud/save logic, 10 compact-receipt database checks and all 14 browser cases |
| Production browser regression | 24 passed; ordinary auth, PIN enrollment, recovery, rewards, save loss and release-cache isolation remain compatible |
| Production/staging build checks | Passed; local artifacts only |
| Demo build/allowlist/source-sync checks | Passed; the new asset manifest is included in the isolated rebuild fixture |
| Demo standalone browser audit | Passed on desktop and both iPad orientations; all packaged assets are accessible locally, no backend/parent entry points |
| Demo shared activity checks | 18 passed |
| Targeted existing recipe checks | The same six assertions still fail; see below |

The six recipe checks for curry, soup and pancakes, in both iPad orientations, still expect `undefined °C` for hob recipes. They reproduce the previously documented baseline failure; neither those tests nor their recipe/gameplay code was changed. The whole 48-case gameplay-quality browser suite was not rerun for this continuation; its six known failures were rerun directly, alongside the focused gameplay/demo/production/save checks above. No additional unresolved failures remain in the requested focused checks.

During this continuation, a new artwork assertion initially selected all three display panels instead of its one slot; its locator was corrected. An overlapping local screenshot run also caused a Playwright trace-artifact collision. The final isolated Base Camp run verifies the corrected checks; these were test-harness issues, with no gameplay or server changes needed.

Physical iPad Safari and real hosted integration remain untested. A separately reviewed server migration and application release are required before the live reset control can be enabled. Review this branch first; no release action or live reset is requested or performed here.
