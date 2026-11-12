# Avatar equipment review

Base: `release/ipad` at `fb0b89441651ed87c486bc3b7cf04ed720c65df8`, verified against the remote before branching. Repository: `xXxCOZ89xXx/jaxon-maths-adventure`; initial checkout was clean on `work` at `0d0b0265d75f26efeaaaf9bfeea0f061ded2a5a0`. Review branch: `codex/avatar-multi-slot-equipment`.

The existing V3 catalogue already defines six independent slots, and the original purchase and layered-art paths already support combinations. This change makes that behaviour explicit in the wardrobe, adds individual removal controls, consistently normalises equipment at load/render time, and adds regression coverage. It does not replace the avatar art or change its sizing.

| Learner-facing category | Existing catalogue slot |
| --- | --- |
| Pet or companion | Companions |
| Background | Backgrounds |
| Hat | Headwear |
| Clothing | Outfits |
| Back items | Back items |
| Accessories | Accessories |

The wardrobe lists the currently equipped item in every active category. Native buttons support keyboard and touch, with a minimum 44px height. Removing a slot moves focus to the equipment section and announces the result. Equipping an item ends an unsaved preview so the combined appearance matches the saved selection. Existing item-card Equip/Unequip controls remain available.

## Save compatibility

Keep `equipped` as an array of catalogue IDs, alongside the existing `bought` ownership array. There is no new save schema, database migration or storage namespace. Existing valid equipment arrays retain their selections. Defensive loading also accepts a single string ID, treats missing/invalid values as empty, and resolves conflicting entries in one slot in favour of the last selection. Unknown IDs are retained for recovery; known retired items retain the existing presentation policy. Ownership, catalogue IDs, prices, unlocks, wallets and rewards are unchanged. Normalisation does not mutate the input save or historical pending request snapshots.

## Screenshots

All captures use the same fictional owned inventory and the same four-item combination: Forest fox, Forest camp, Forest cap and Emerald hoodie. Before captures serve the four original application files directly from the verified release commit. After captures use the changed application. Both intentionally show the same artwork; the visible change is the category controls.

| Layout | Before | After |
| --- | --- | --- |
| Desktop 1440 × 1000 | [Before](before/desktop-chromium.png) | [After](after/desktop-chromium.png) |
| iPad portrait 820 × 1180 | [Before](before/ipad-portrait-chromium.png) | [After](after/ipad-portrait-chromium.png) |
| iPad landscape 1180 × 820 | [Before](before/ipad-landscape-chromium.png) | [After](after/ipad-landscape-chromium.png) |
| Small touch 390 × 844 | [Before](before/small-touch.png) | [After](after/small-touch.png) |

Reproduce the focused checks with `npm run test:avatar-equipment`. Capture the baseline with `EQUIPMENT_BEFORE=1 npx playwright test -c playwright.avatar-equipment.config.cjs`; cloud cases are skipped during baseline capture.

## Scope and limitations

All browser backend calls are intercepted or external origins are denied. Database checks use a disposable local PostgreSQL container with networking disabled. No live learner data, accounts, account settings or Cloudflare Access settings are used or changed. No PR, merge or deployment is part of this handoff. iPad checks emulate viewport and touch in Chromium; physical iPad Safari and live cloud acceptance are not tested.

## Validation

| Check | Result |
| --- | --- |
| `npm test` | Passed baseline logic regressions |
| `node tests/avatar-equipment.cjs` | Passed four/six-slot combinations, independent changes, JSON round trips, old saves, malformed inputs, idempotent migration and wallet preservation |
| Equipment browser suite | 8 passed across desktop, iPad portrait/landscape and small touch, including intercepted cloud save/reload |
| Existing avatar-fit cases (active ownership/equip, scaling, unowned preview, legacy appearances) | 12 passed on iPad portrait/landscape and small touch |
| `npm run test:production-build` | Passed isolated static build/configuration checks |
| `npm run test:production-browser` | 24 passed |
| `npm run test:ipad-release` | Passed sync/recovery, release gate, 10 isolated receipt checks, Town/hands-on logic and 14 browser cases |
| `npm run build:demo` and `npm run test:demo` | Passed allowlist/isolation, shared source parity, three-layout browser smoke and 18 activity browser cases |

[Machine-readable results](results.json). Run suites sequentially because build preparation replaces shared fixture directories and several browser configurations share a local server port.
