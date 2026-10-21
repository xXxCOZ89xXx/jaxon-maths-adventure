# Latest game: private iPad readiness
22 October 2026. Gameplay inspected at `76d24d59b7a8b11cb33857e9af6642b1114d6ca6` on `codex/v3-adventure-build`. This continuation changes focused tests and documentation only; gameplay already exists.

## Actual playable features
COMPLETE below means implemented and locally playable. It does not certify the hosted service or a physical iPad.

| Requested feature | Status | Actual implementation and scope |
| --- | --- | --- |
| All nine maths worlds | COMPLETE | Number Forest, Fraction Desert, Algebra Peaks, Geometry Kingdom, Ratio Island, Statistics City, Probability Portal, Measurement Mines and Practical Maths Town. Visible map entry, mission controls and reload checked for every world. 55 accessible skills. |
| Mixed hands-on maths | COMPLETE | Number lines, place-value blocks, arrays, ordering, matching, fraction shading, coordinates, rotations, area tiles, ratios, charts, probability pools/spinners, rulers, volume models, baskets and money. Finger dragging paints shading; sorting/matching use tap-label then tap-position. No claim of drag-and-drop sorting. |
| Town customer journey | COMPLETE — guided basic journey | Eight connected stages: inspect cupboards, create missing-quantity list, choose/pay bus fare, select shopping, tender payment, calculate change, check returned inventory, measure recipe water and prepare dinner. Bolognese/lentil variants. Cooking is one measurement task and recipe completion, rather than a multi-step cooking simulation. Inventory, cash, receipts and each intermediate state persist; duplicate completion does not charge again. |
| Direct employee journey | COMPLETE | Enter workplace hotspot directly from Town map, without starting customer journey. Worker context and three tasks: paid shift/gross wages, simplified net-pay payslip, saving for tools. Full visible-control completion and per-task reload checked. Other venues also have direct worker contexts, though several prompts share everyday/customer maths. |
| Adaptive difficulty, teaching and hints | COMPLETE | Discovery/repeated independent evidence and prerequisites inform question bands and suggested mission tiers; learner may override the three mission tiers. Teaching, examples, hints and safe retry exist. Assisted play does not establish independent mastery. |
| Avatar upgrades, coins and parent rewards | COMPLETE in code | Shop/equip and 40-item catalogue; earned learning coins, milestones/camp upgrades; server-owned staging purchases and parent-only reward actions. 60-minute weekly learning goal and 1:1 screen-time rewards. Customer-journey pretend cash remains separate from learning coins. |
| Progress saving | COMPLETE in code; hosted iPad acceptance PARTIAL | Local snapshots plus existing staging Auth/PIN, queued revision-checked cloud saves, retry/conflict handling and parent review. Latest customer journey saved/reloaded at every stage with the original staging adapter against an intercepted fictional server. Actual hosted Safari sign-in/save/reload still needs the owner's single acceptance session. |

No requested journey is missing, so no replacement implementation or older gameplay fallback is needed.

Source evidence: [worlds/state](../v3/engine.js), [Town](../v3/town.js), [mission tasks](../v3/adventure.js), [interactive models](../v3/hands-on.js), [customer ledger](../v3/journey.js), [adaptive suggestions](../v3/adaptive.js), [visible UI](../v3/app.js), [map/controls](../v3/adventure-ui.js), [existing staging adapter](../v3/staging-app.js).

## Focused verification actually run
- `node tests/v5-hands-on.cjs`: 14 logic groups passed, covering 1,107 generated task steps, all worlds/tiers, adaptive evidence and journey preservation.
- Four existing interaction/journey browser cases in both iPad portrait and landscape Chromium: **8 passed**. Includes pointer shading, ordering/matching/arrays/charts, spinner/ruler and full eight-stage customer journey with exact reload.
- New `playwright.ipad-priority.config.cjs`: **4 passed**, two cases in both orientations: visible map entry for nine worlds, and complete direct employee visit.
- Two targeted existing staging-fixture cases, iPad portrait: **2 passed** — complete lentil journey with cloud-fixture saves/parent review; offline reconnect, competing-device conflict and server shop ownership.
- `node scripts/build-v3-staging.cjs` and `node scripts/verify-v3-staging.cjs`: configured unpublished build passed. Latest gameplay copied into `staging-dist/`; existing staging project binding retained without printing its public key.

Total **14 focused browser cases passed**. Tests used synthetic browser contexts and an intercepted in-memory server; unexpected external requests were blocked. No Supabase requests, hosted SQL, real-account tests, account/PIN changes, publication or deployment. Chromium iPad dimensions are not physical Safari certification. No broad security audit, database test suite or backup work was repeated.

## Shortest route to the iPad
Use the original **staging adapter with the newest gameplay**, built by `scripts/build-v3-staging.cjs`. Its historical V3 filename describes the adapter/build entry, not an older game: it copies today's `v3/` modules, including V5 interactions, V5.1 input fixes and both Town journeys.

The adapter uses the already installed `v3_identity`, `v3_role`, `v3_unlock`, `v3_request` contract. Progress is a JSON object, including the journey/adventure state; no new table or activation marker is needed to save these features. Keep existing origin and project/account-specific game, auth, queue, request-ID and intent keys. Do not clear browser storage, discard unresolved queues, automatically reload an active game, or change the existing accounts/PINs. Before an approved site update, let an open learner finish syncing, close its game tab, then reopen after the asset update; if offline work/conflict remains, resolve it through the current UI before switching assets. No data export or backup inventory is requested.

Keep `v52-staging-dist/` and the preservation SQL package parked: that alternative build requires an unapplied database marker and is unnecessary for this gameplay goal. No production installer, schema update or V5.2 activation is on the critical path.

The existing Site was checked read-only using Sites: project `appgprj_6ad746f124fc8191b3f3845f9dff577b`, active, owner-only custom access, no external viewers. Latest saved Site version is 5. Its source-repository commit is a separate history; no byte-equivalence claim to current GitHub gameplay is made.

Existing private address: https://jaxon-maths-v3-private-staging.orion-shared-7254.chatgpt.site

1. Owner approves updating **only this existing owner-private Site's assets** with the freshly built current-branch `staging-dist/`, retaining the current audience, backend, account/PIN/storage namespaces and data. On approval, use the Sites source workflow to package exactly that artifact and publish privately. No merge or database step.
2. Owner opens that URL in current Safari on Jaxon's iPad, passes the existing owner-only Site gate, then signs in with an existing fictional staging learner account/PIN. Keep the parent account for parent actions. No real production identity or history is imported.
3. In one acceptance session, open a world, try an interactive task, run the cupboard-to-kitchen journey, enter the workplace directly, then close/reopen and confirm progress. Check the existing parent reward screen as parent; any reward submission is an explicit ordinary parent action.

This gives Jaxon the latest game using the existing private staging learner's saved progress. Moving an existing production learner's history or creating a new personal account would be a separate request, not a prerequisite for this route.

**Minimum next owner action:** approve the assets-only update of the existing owner-private staging Site using the newest gameplay and the existing staging adapter. No SQL is needed.

