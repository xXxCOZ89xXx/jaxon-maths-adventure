# One consolidated outstanding-issues list

Updated 20 October 2026. The [Town architecture and eight-stage mansion estate](V3-TOWN-ESTATE-EXPANSION.md) are implemented with automatic unique-milestone upgrades and preserved historical camp projects. Current automated/deployment evidence is at the top of [the QA report](V3-TEST-REPORT.md). No additional manual testing is requested now. Use this list for one later family acceptance session, after automated QA and visual review. Keep PR #2 draft until a separate release decision.

## Owner-reported real staging checks already completed

Learner and parent sign-in, four-/six-digit PINs, locking, incorrect PIN rejection, saved activity after refresh, parent bonus coins, shop purchases and visible separation of two fictional families work according to the owner's initial tests. This is genuine hosted evidence reported by the owner, not a result independently reproduced by the agent. Existing staging families/progress have not been reset or read by this development task.

## Remaining combined acceptance / external gates

| Topic | What remains | Status |
| --- | --- | --- |
| Physical iPad Safari | Actual touch, portrait/landscape, keyboard/focus, memory/performance, returning after background/lock, and visual comfort on the physical device | Pending later acceptance; emulated Chromium/WebKit are complementary |
| Cross-device sync | Same fictional learner on laptop/iPad, exact mid-task save, stale revision, passive updates and account expiry | Pending later live acceptance; automated CAS/retry tests use fixtures |
| Offline conflict recovery | Warm offline edits, reconnect, explicit version choice, locally retained archive, no duplicate rewards; do not clear unsynced browser data | Pending later live acceptance; mocked browser and isolated logic pass |
| Direct hosted family/API security | Authenticated attempts to cross family boundaries, direct table/RPC denials, token binding and parent-only actions against actual staging PostgREST | Pending; visible family separation is owner-confirmed, direct API enforcement is not independently certified |
| Email recovery delivery | Owner-deferred Supabase email/SMTP configuration and eventual same-browser recovery link delivery | External configuration pending; 429 handling is automated; no SMTP/rate-limit changes or repeated live requests performed |
| Final learner feedback | One grouped review of artwork, readable text, navigation, teaching and controls using the private screenshot album and later play session | Pending; no feedback requested during this task |
| Production schema/identity reconciliation | Actual V2 schema, Auth/family mapping, redemption/bonus ledgers, verified restricted backup and cutover write ownership | Requires separate explicit real-data authorisation; synthetic rehearsal only completed here |

## Known implementation limits to carry into the release decision

- Learning rewards are client-observed. UI credit now requires a changed maths interaction and expires after 20 seconds; generic motion, menus, unchanged controls, refresh and hidden tabs cannot extend it. The server caps clock credit and enforces roles, not human cognition. An authenticated client modified through developer tools could still submit bounded fake activity. Server-validated assessment/activity would be a separate hardening project if that threat must be prevented before release.
- The activity window deliberately favours conservative credit. Passive reading before the first maths interaction does not earn; the 10-coins-per-active-minute rate, 60-minute weekly goal and 1:1 credited screen-time rule remain unchanged.
- No cold-offline service worker; warm unlocked learning queues locally. Offline wallet transactions are blocked; reviewed uncredited time requires a parent confirmation. Device storage must remain available.
- PINs protect server operations and the UI, not encryption of device-local fictional cache. A device/profile owner can inspect local data. Unlock revocation is enforced on the next server action; a disconnected device can only clear its local view until reconnect/expiry.
- One child per parent account is supported. Mixed/ambiguous family roles fail closed. This must be reconciled with production relationships before migration.
- The scenes are original 2D isometric dioramas and task workbenches, not a free-roaming 3D game. Optional bespoke guide poses, world title art and unique keepsake illustrations could add personality; concrete briefs are in `V3-VISUAL-REVIEW.md`. No external asset is required to play.

## Release rule

Do not merge, publicly publish staging, change GitHub Pages, replace the live homepage, migrate/export real records, or touch production Supabase. The current production plan is preparation only; see `V3-PRODUCTION-RELEASE-PLAN.md`. Report consolidated feedback once when the owner chooses to start final acceptance.
