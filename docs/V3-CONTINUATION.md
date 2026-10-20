# Nine-world continuation

Current visual/reliability continuation: original isometric world/venue/camp artwork, SVG wardrobe/guide/keepsake art, 60-screen private review album, bounded meaningful-interaction reward timing, exact wallet/display separation, safe parent defaults and immutable retries, recovery-429 handling, synthetic migration/rollback rehearsal and a prepared production plan. See `V3-VISUAL-REVIEW.md`, `V3-TEST-REPORT.md` and `V3-OUTSTANDING-ISSUES.md`. No more manual tests are requested now; production remains unapproved.

The 20 October user approval makes Practical Maths Town part of the current build. This continues draft PR #2 on `codex/v3-adventure-build`. No production account or database is involved.

## What is playable

- Nine worlds, including eight Town locations: Supermarket, Corner Café, Community Bank, Shopping Centre, Bus & Train Station, Neighbourhood Home, Cinema & Leisure, and Workshop Workplace.
- Sixteen new Town skills extend the original 39 to **55 skills**. Guided explanations, easier examples, adaptive starting-point discovery, fresh practice, separate independent checks and delayed revision are available. There are 1,100 discovery questions; the original 780 are retained.
- Original worlds each have three themed expedition routes at three difficulty levels, plus an optional gateway at each level. Town has eight location routes at three levels plus three gateways. That makes **123 mission/level combinations**, each with three taught tasks, alongside the original 24 restoration puzzles.
- Revisited missions generate new values from a saved attempt seed. They are not an unlimited source of XP: completing a route/level adds one durable milestone, once. A route contributes one keepsake across all three levels. There are 41 possible keepsakes across the nine worlds.
- Original-world missions use number lines, place-value supplies, irrigation fractions, water measures, algebra balances, pattern rails, coordinate lifts, rotating stonework, courtyard tiling, supply ratios, data bars and probability pools. Gateways mix ideas without timers or mastery awards.
- Town uses order baskets, pack comparisons, UK denomination change trays, fictional account ledgers, sale-price labels, budget envelopes, timetable planning, 24-hour arrival clocks, meter bills, measuring jugs and simplified timesheets/payslips. Fictional exercise money never changes learning coins or any real balance.
- The Town’s map has eight tap/keyboard location entrances. Distinct venues restore its High Street, neighbourhood and festival. Other worlds gain additional settlement artwork from expedition completions.
- Camp has an earned keepsake journal, three decoration slots, and greenhouse/lookout/noticeboard projects gated by durable milestone counts. Decorating and building do not grant XP or coins. Existing avatar ownership and all 40 catalogue IDs stay compatible.

## Learning boundaries

Every mission task shows teaching and an easier example before its controls. Wrong solutions lead to worked support, and the task stays editable. Assisted or guided missions cannot set academic mastery, even when the solution is correct. Independent checks require a completed lesson/practice flow and unseen questions; successful retakes wait for delayed review and failed checks require reteaching.

Mission difficulty suggestions use recent unassisted or supported mission outcomes; they are gameplay recommendations, not independent assessment labels. All three levels stay selectable. Fresh curriculum practice also responds to discovery bands and previous independent struggle. Home optionally suggests a due memory check or a lesson needing reinforcement.

## State and integrity

The existing V3 save namespace and version-3 envelope are retained, with a versioned `adventure` extension. V2 and earlier V3 fields, currencies, ownership, skill evidence and original quest state survive migration. Active mission task specs, seed, selections and help state serialize exactly; other unfinished visits are suspended by world/route/level. Continue resumes the last activity. Web Locks serialize same-origin tab writes.

The 60-minute weekly target, ten learning coins per active minute and 1:1 screen-time conversion remain. Completion rewards are finite milestone IDs, not scene clicks or fictional exercise payments. No new Supabase adapter, credentials, Auth identities, schema or production calls are introduced.

## Remaining release work

The local gameplay expansion is separate from real cloud integration. The owner has now provisioned the separate staging database and fictional families, and a configured owner-private HTTPS site is deployed; see `V3-STAGING-ACTIVATION.md`. Live Auth/PIN, sync, hosted family isolation, rewards and physical iPad Safari acceptance remain outstanding: the Cloud proxy blocks staging RPC access. Do not merge, publish the replacement homepage or change production without explicit approval.

Higher-level expeditions include negative lift coordinates and anticlockwise/composed tower turns. Generated tasks within each visit are checked for distinct mathematical content across all route/level combinations.
