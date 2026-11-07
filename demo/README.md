# Public fictional demo

Separate static Cloudflare Pages project: `jaxons-maths-adventure-demo`.
Feature branch: `codex/public-offline-demo`, based on released commit `e3550ec202d30c407b1d5653f06c081eba014938`.

Build: `node demo/build.cjs && node demo/check.cjs`
Output directory: `demo-dist`
No install, environment variables, credentials, bindings, Functions or SDKs are required.
The build reads only repository files; it does not read environment configuration.
Never deploy the repository root, staging-dist or production-dist to the demo project.

Tests: `npm test`, then build/check above, then `node demo/test-browser.cjs` with Playwright installed (`npm ci` supplies it). Chromium defaults to `/usr/bin/chromium`. Set `DEMO_URL=https://jaxons-maths-adventure-demo.pages.dev/` for the same checks on the public deployment. `DEMO_ENGINE=webkit` selects installed WebKit. Reports and screenshots are in ignored `work/public-demo/`.

## Dependency audit before implementation

The existing `v3-adventure.html` Test Camp was inspected at the baseline commit. Its full dependency list and SHA256 hashes are in `demo/dependencies.json`: 38 local scripts, three local stylesheets, icon.svg, and 63 WebP assets. The image dependency families are checkpoint (scene/props), rollout (worlds/avatar/wardrobe), and world-guide-portraits-preview (nine guides). Dynamic asset paths in asset-checkpoint.js, world-art.js, avatar-art.js and guide-portraits.js were traced to these families. Stylesheets have no imports, URLs or external fonts. Generated SVG is inline markup. Audio is synthesised locally with Web Audio. No service worker is registered.

The only storage reads/writes in the loaded graph are in app.js, using the fictional key `jaxon_v3_fictional_demo_2026`; no V2/private caches are read. There is no fetch, XHR, WebSocket, EventSource, beacon or dynamic import in the loaded script graph. Education/curriculum metadata contains a gov.uk curriculum citation as a string, not a downloaded dependency. No backend SDK, config, authentication, cloud or staging entry point is loaded. The original CSP already says `connect-src 'none'`. Thus this entry point genuinely operates offline once its static files are available. It still requires downloading its local static dependencies on first hosted load; we do not claim it is a precached offline PWA.

Two navigation surfaces required changing for public distribution: the fictional parent-summary screen and the developer touch-preview link. The demo build removes the parent renderer, screen registration, footer button and developer link; it rejects parent navigation and hardcodes the cloud adapter to undefined. The original shared source is untouched. The public build has the required device-only notice, root/fragment links only, an independent `jaxon_public_demo_v1` storage key and the separate Pages origin. A real 404 page prevents SPA fallback for private-looking paths. Only the audited dependencies are published; source/backend configuration, SQL, docs, manifests with generation metadata, credentials and private entry points are excluded.

## Isolation and verification

- Hash-pinned source dependencies fail the build if shared files change without a fresh audit. The generated inventory lists every published path, size and SHA256.
- Build checks reject backend code, identities, credential patterns, external navigation, request APIs and unexpected output files.
- Both meta and HTTP CSP disable all connection APIs, workers, frames, forms and media loads. There are no report endpoints, analytics or remote fonts.
- Browser tests start with clean unauthenticated contexts on desktop 1440×1000, iPad portrait 810×1080 and landscape 1080×810. They intercept and fail unexpected external requests, check all public assets, complete the nine fictional starting samples through the UI, visit all worlds, open/pause a lesson, verify reload persistence and settings, probe the removed parent route, and check for console errors, cookies, overflow and navigation touch targets.
- Storage instrumentation checks every app storage operation uses only the demo key in localStorage; sessionStorage is empty. A clean second visitor cannot see the first visitor’s save. A second origin in the same context cannot read or overwrite the first origin’s save. No live origin or live browser profile is opened for isolation tests.
- Physical iPad Safari is not tested. Chromium touch emulation is not a physical-device or WebKit acceptance result. WebKit installation was attempted but the environment denied its download domains.

## Hosting boundary

Create only the new `jaxons-maths-adventure-demo` project, selecting this feature branch as that project's production branch, build command above and `demo-dist` output. Leave environment variables and resource bindings empty, analytics off, and preview deployments disabled. Never add a custom domain shared with the private game, change an Access policy, or make an Access bypass. No merge to `release/ipad` or `main` is part of this task.

The existing private Git Pages project deploys `release/ipad` and explicitly allows only `preview/save-recovery-2cc3d57` for previews. This demo branch does not match either, so pushing it does not trigger a private deployment. Existing Access policies and the canonical private deployment are compared before/after, using read-only metadata. No Supabase requests, accounts, learner records or production credentials are used.
