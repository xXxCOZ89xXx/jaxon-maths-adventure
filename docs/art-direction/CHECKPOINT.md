> Historical checkpoint `63f787f`, not approved. The current revision is [REVISED-CHECKPOINT.md](REVISED-CHECKPOINT.md).

# Playable original-asset checkpoint

This is a development review sample, not a live release. `release/ipad` remains at `2e84e74`; hosting, Supabase, accounts and personal progress were not accessed or changed.

Open the generated fictional offline game at `preview-dist/PLAY-V3.html` (a local build artifact, not committed), or serve the repository locally and open `v3-adventure.html`. The single HTML artifact embeds its assets and denies cloud networking. It saves fictional demo progress in the existing demo namespace; it never imports hosted progress. To regenerate it: `node scripts/build-v3-preview.cjs`.

1. Skip the welcome tour if shown. Choose **My explorer** for the new Camp room. Try Explore worlds, Avatar shop and Trophy journal. Continue resumes the existing saved task; Rest returns to Home.
2. Worlds → Practical Maths Town → **Start a Bolognese journey**. Open storage and record the task stock, make the list, choose the bus, collect shelf items, pay and return to cook. The same pretend cash, clock, stock, list and receipts travel with you. Save & exit, then Continue resumes the same snapshot.
3. Worlds → Algebra Peaks → **Mountain railway**. Tap a wagon to connect it; the next stage selects and places wagons into ordered bays. Try a wrong answer and hint; choices remain replaceable before checking.

All recipe quantities, supplied times, prices, timetables, money denominations, inventory counts and mathematical plates remain live code-rendered text. There are no mathematical values baked into the new art. The storage illustration is decorative; only the separate task-stock objects below it represent countable stock. Fractions, rulers, jugs and similar mathematical diagrams still use the existing functional models.

## Actual iPad-size renders

Each pair was captured from the running game at **820 × 1180** portrait and **1180 × 820** landscape (full-page where needed). These are browser captures, not concept illustrations or marketing mockups.

| Screen | Portrait | Landscape |
| --- | --- | --- |
| Camp | [View](screenshots/camp-820.jpg) | [View](screenshots/camp-1180.jpg) |
| Town | [View](screenshots/town-820.jpg) | [View](screenshots/town-1180.jpg) |
| Kitchen / open storage | [View](screenshots/kitchen-820.jpg) | [View](screenshots/kitchen-1180.jpg) |
| Supermarket / basket | [View](screenshots/market-820.jpg) | [View](screenshots/market-1180.jpg) |
| Bus stop | [View](screenshots/bus-820.jpg) | [View](screenshots/bus-1180.jpg) |
| Industrial freight | [View](screenshots/freight-820.jpg) | [View](screenshots/freight-1180.jpg) |

## Scope and verification

Fourteen original assets: six separately generated full scene backgrounds and eight transparent props (explorer, pantry, fridge, locomotive, freight wagon, spaghetti packet, tomato tin, mince tray). Runtime WebP payload totals approximately 2.9 MB. The portable static renderer uses existing validated actions; the mathematical/learning engines, saved formats, pending requests and reward rules are unchanged. Ingredient substitutions only cover the representative meal; other product art stays as before.

Focused checkpoint checks: ten passing Chromium-touch cases across both iPad orientations, covering Camp navigation/target separation, open storage, shelves, complete meal effects and exact save/reopen at every stage, freight wrong/hint/connect/order/reopen, nine map destinations, embedded offline images, keyboard navigation and reduced motion. Four further existing full-touch Bolognese and mocked immutable pending-save cases passed across both orientations. Total: 14 focused passing browser cases. All use fictional state and blocked/intercepted external connections. This is not a physical Safari result or a full nine-world regression claim.

The other world/venue art, Camp exterior upgrade appearances, avatar poses/wearable layers, remaining product props and further educational-bank expansion are **pending**. The scene explorer is a fixed neutral companion; existing saved cosmetic-aware avatars remain visible in their existing locations. Camp retains eight logical progression stages and the current exterior preview renderer until the four approved art tiers are produced. Home exterior meters, recycling and post remain later work; no car, driveway or garden task was added.

**Next action:** owner reviews these rendered screens and playable sample for visual-direction approval. The adopted [implementation prompt](CODEX_IMPLEMENTATION_PROMPT.md) explicitly requires “Owner approval required for rendered sample” before Phase 3. No full rollout or publication is authorised by passing this checkpoint alone.
