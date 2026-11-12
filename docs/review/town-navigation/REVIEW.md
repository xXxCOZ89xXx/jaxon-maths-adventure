# Town navigation highlight

Started from verified `release/ipad` head `8d597cf11e67f8911e01ade2b396c4dde615a765` on a clean working tree. Work is isolated on `codex/town-navigation-highlight`.

## Cause and change

Town uses the existing `world:town` action and displays `view="world"`, `world="town"`. The old renderer only marked buttons with `data-nav`, and treated every world page as part of Worlds. Town's action button was skipped. Town and How to play are inserted late in rendering, so their selected state also needs to be applied after those buttons exist on a refreshed page.

The fix derives the selected section from the displayed view and world, then updates `aria-current="page"` for both navigation and action buttons after navigation creation. Town pages and resumed Town activities select Town; the subject atlas and subject-world activities select Worlds. Other sections retain their existing mappings, including the wardrobe under My explorer. How to play participates in the same update. Existing CSS renders the highlight; no CSS, routes, labels, click actions, access controls, storage formats or gameplay rules changed.

## Evidence and verification

[Before/after gallery](index.html). Before captures use the unchanged release renderer; after captures use the fix. All screenshots use fictional intercepted production-build fixtures, with the pointer moved away from buttons so hover does not masquerade as selection. Desktop 1440×1000, iPad portrait 820×1180 and iPad landscape 1180×820 are covered.

The regression checks both the real production builder with mocked sign-in/PIN/server traffic and the offline app. It reproduces the old Town/Worlds mismatch, then checks exactly one selected button, correct headings, all six top navigation options, refresh, Town-to-Worlds with Town still the last selected world, subject-world pages, and paused/resumed Town plans and subject missions. It also checks unchanged learner progress, ownership, balances and settings, console errors, external request denial and horizontal overflow.

Section clicks use saved application views, not URL routes; they do not create browser history entries. This behavior is preserved. Actual document navigation and back/forward are checked separately: the latest saved Town view resumes and Town remains selected.

| Check | Result |
| --- | --- |
| Unchanged-release reproduction | 3 passed: expected faulty Worlds selection while Town is displayed, one per layout |
| `npm run test:navigation` | 6 passed, zero failures/skips/flaky cases: production and offline × three layouts |
| `npm test` | Passed: existing learning, progression, economy, navigation, cloud, Home and recipe logic suites |
| `npm run test:production-browser` | 24 passed: auth/PIN, parent roles, reward separation, lost-save recovery and release-cache isolation |
| `npm run test:production-build` | Passed |
| `npm run test:staging-build` | Passed, including build isolation |
| `npm run build:demo` and `node demo/test-sync.cjs` | Passed: allowlist, source parity and isolated rebuild checks |

The initial navigation regression run exposed the refresh ordering issue described above; the final run passes after moving selection updates after button creation. No unresolved failures remain in the checks listed here. The full gameplay-quality browser suite was not rerun for this presentation-only fix.

 Physical iPad Safari remains untested; these iPad checks use Chromium with touch emulation. No real accounts or learner data were accessed, no remote schema or access settings changed, and no PR, merge or deployment was performed.
