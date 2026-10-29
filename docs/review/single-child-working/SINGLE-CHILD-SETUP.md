# Working one-parent, one-child setup — local and staging review

29 October 2026. Continues `codex/single-child-readiness` from `b7fb87d`. **No production migration, release PR, merge, deployment, production credentials or real learner records.** The previous foundation-only identity blocker is resolved in this branch's local/staging implementation. Hosted staging remains unverified.

## What works locally

The review runs real Supabase **GoTrue v2.197.0**, **PostgREST v14.18**, PostgreSQL 17 and captured Mailpit email. Auth/PostgREST versions were checked against Supabase's current reference `docker/docker-compose.yml`. This is a minimal local Supabase component stack, not a mocked Auth service and not the full CLI/Studio stack. Tests use actual email verification, password authentication, signed JWTs and PostgREST/database permissions. A separate network-disabled PostgreSQL suite rehearses migration/legacy compatibility with fictional existing records.

The parent registers their own email, opens the locally captured verification email, signs in with their password, and creates one nickname profile. A four-digit learner PIN and one-use code connect a separate child's browser. **No child Auth user, child email, anonymous Auth account or shared parent session is created.** The paired device enters the existing learner PIN screen, then the existing game with cloud-sync, Base Camp, assessment gates and exact activity resume. Parent progress still uses the existing six-digit parent PIN and keeps provisional starting estimates separate from independent mastery.

The parent can reset the learner PIN, replace/cancel a code, revoke one device and reconnect a replacement to the **same child ID and saved work**. Reset revokes that child's grants and unused codes; for a legacy Auth child it also resets/revokes that child's existing PIN capabilities. Revocation targets one device and cancels unused codes; other devices and completed progress remain. A lost device's unsent local changes cannot be recovered remotely. Local device caches are not encrypted by a PIN and cannot be remotely wiped.

## Identity and transaction integration

`002_identity_bridge.sql` creates a private canonical child registry. Existing children retain the **same UUID** and legacy Auth reference. Only the four relevant child foreign keys (families, V3 progress, wallet, transactions) move to that registry. One child per parent is database-enforced. Existing progress, purchases, evidence, wallet values, PINs, unlocks and receipts are preserved; no Auth record or save is rekeyed. Existing parents can adopt their original child with a nickname without creating a duplicate. Existing Auth learners keep their original role/PIN/request path.

The business core is generated from the existing strict production rules plus compact-receipt compatibility. Both the original authenticated `v3_request` wrapper and new service-only `v13_device_request` call this **private** core. The browser cannot call it or supply its family scope. Legacy requests retain their Auth-user/PIN-generation checks. Device requests resolve a hashed grant → device → canonical child → parent on the server, validate expiry/revocation/generation and parent active status, and hold the profile lock through the complete transaction. Parent reset/revocation holds the conflicting lock, so an already authorised operation completes before revocation returns; subsequent requests are denied. Disabled/deleted parents are denied setup and their device game requests fail even with a still-signed JWT.

The original per-child wallet lock, CAS revisions, exact request-ID/content binding, compact receipts, independent-evidence meaning and server wallet authority remain. Client coin snapshots cannot mint coins; devices cannot award/redeem as parents or choose a different child. No new curriculum, worlds, missions, rewards, artwork or save IDs were introduced.

The HTTPS gateway stores device/grant credentials only in host-only Secure/HttpOnly/SameSite=Strict cookies. No pairing code is put in a URL, log or browser credential store. Parent JWTs are forwarded only to parent-authorised RPCs. Child device mode never receives a parent JWT or Supabase user session. Client-only identity objects identify a **paired-device principal**, not an invented Auth account; server cookies, not those objects or the UI's non-secret session marker, authorise every request. The gateway rejects unapproved origins and payload fields; private service credentials never enter browser artifacts. The runtime fails closed unless the bridge's backend capability is installed.

Pairing remains 128 random bits, SHA-256 at rest, ten minutes, one use, five generations per parent per fifteen minutes and ten guesses per trusted-address bucket per fifteen minutes. Device credentials are 256 bits and expire after thirty days. Learner PINs use bcrypt, five failures per child then five-minute cooldown, plus twenty unlock requests per trusted-address bucket per fifteen minutes. Grants last no more than twelve hours or device expiry. Address buckets are server-secret HMACs; callers cannot choose them. Parent setup requires confirmed non-anonymous Auth and password AMR within five minutes. The local test Auth's generous email/signup limits are **fictional test settings**, not suggested hosted policy.

## Run the working local review

Requirements: Node 24, local Docker engine at `/var/run/docker.sock`, OpenSSL, access to pull the pinned public images, and a desktop browser. The bootstrap explicitly clears Docker endpoint/context/TLS selectors so it cannot accidentally run against a remote Docker daemon. It refuses remote/production URLs. Local containers share a dedicated **internal** network, with loopback-only HTTP forwarding for Auth, PostgREST and captured email. Nothing is publicly hosted.

From a checkout, or the downloaded code package after extracting BOTH art ZIPs first:

```sh
npm ci --ignore-scripts
# Use a writable npm cache if the environment's default cache is read-only:
# npm ci --ignore-scripts --cache /tmp/jaxon-npm

env -u DOCKER_HOST -u DOCKER_CONTEXT -u DOCKER_TLS -u DOCKER_TLS_VERIFY -u DOCKER_CERT_PATH docker --host=unix:///var/run/docker.sock pull postgres:17-alpine
env -u DOCKER_HOST -u DOCKER_CONTEXT -u DOCKER_TLS -u DOCKER_TLS_VERIFY -u DOCKER_CERT_PATH docker --host=unix:///var/run/docker.sock pull supabase/gotrue:v2.197.0
env -u DOCKER_HOST -u DOCKER_CONTEXT -u DOCKER_TLS -u DOCKER_TLS_VERIFY -u DOCKER_CERT_PATH docker --host=unix:///var/run/docker.sock pull postgrest/postgrest:v14.18
env -u DOCKER_HOST -u DOCKER_CONTEXT -u DOCKER_TLS -u DOCKER_TLS_VERIFY -u DOCKER_CERT_PATH docker --host=unix:///var/run/docker.sock pull axllent/mailpit:v1.27.1

node scripts/single-child/local-stack.cjs
node scripts/single-child/build.cjs
openssl req -x509 -newkey rsa:2048 -nodes -keyout work/single-child-integration/localhost-key.pem -out work/single-child-integration/localhost-cert.pem -days 7 -subj '/CN=127.0.0.1' -addext 'subjectAltName=IP:127.0.0.1'
node server/single-child-server.cjs --local
```

Open **https://127.0.0.1:4443** and accept the self-signed certificate **for this local fictional review only**. The private local keys/config are generated under ignored `work/single-child-integration/`, never packaged or committed. Captured mail is **http://127.0.0.1:54324**. Use a fictional parent email such as `parent-review@fictional.invalid`; open its captured confirmation link in the same browser, then sign in again. Use a second browser profile/private window for the child. New setup is genuinely backed by the local database; refreshing does not reset it. Do not enter real family information.

The bootstrap preserves an already installed local fixture. It does not automatically delete/recreate databases, rewrite existing saves or apply a migration twice. A changed installed bridge needs a fresh disposable fixture or explicit local upgrade review; never remove a migration guard to force it through. Ports 4443/54321/54322/54324 and the `jaxon-local-*` names must be free or belong to this review. The mail/forwarding services remain local processes/containers; stop them after review. No public forwarding or hosting deployment is included.

To execute tests after startup (Playwright's Chromium must be installed):

```sh
node tests/single-child-bridge.cjs
node tests/single-child-live-local.cjs
npx playwright test -c playwright.single-child-local.config.cjs
```

Browser tests use fresh fictional accounts and reset **only the isolated local gateway rate-counter fixtures** between serial cases. Application rate limits remain unchanged and are tested separately through the real API. No runtime bypass header or test-user shortcut exists. Browser traces are disabled and screenshots mask passwords and live temporary codes.

## Dedicated hosted staging: current configuration and exact missing setup

The existing `V3_STAGING_PROJECT_REF`, `V3_STAGING_AUTHORIZED_REF`, `V3_STAGING_URL` and `V3_STAGING_ANON_KEY` are present, internally consistent and point to the distinct historical fictional staging project. The enforced network policy does not allow that staging host; only the production Supabase hostname is present. There is no configured private server credential. **No staging or production Auth/SQL/API request was made to compensate.** Public-key readiness does not establish hosted security or migration authority.

Only after the owner verifies the dedicated fictional project and permits staging setup:

1. Allow that **staging** hostname in the environment policy. Verify project identity separately in its dashboard/database connection; never use the production ref `mbdelspbjusarbwlltol` or production credentials.
2. Verify the existing staging core/catalog/compact-receipt schema. The current compact migration pins the historical staging ref `sfogrvedypgtxfvecmbx`; a different new project or changed RPC requires a separate reviewed baseline adaptation, not search-and-replace guard removal. The bridge compares the exact reviewed compact RPC body and aborts on drift, ambiguous families, missing review or the known production target.
3. In the staging SQL owner's session, apply foundation 001 only if absent, with `app.v12.foundation_reviewed='yes'` and `app.v12.target_ref='<verified-staging-ref>'`. Then apply bridge 002 once with `app.v13.bridge_reviewed='yes'` and the same target setting. Keep a restricted backup and review the foreign-key/grant verification first. `NOTIFY pgrst, 'reload schema'` is included; do not omit it. No source script automatically applies either migration remotely.
4. Configure **parent email signup with required email confirmation**, verified SMTP/delivery, the review origin in allowed Auth redirects, PKCE/recovery, and appropriate server signup/login/email abuse policies. Disable anonymous Auth. Use only fictional parent accounts in two unrelated families. Confirm that unverified sign-in is refused through the actual service. Local captured-mail settings must not be copied as hosted policy.
5. Privately bind the server-only secrets below and serve the gateway behind HTTPS at a separate review origin. Keep the listener loopback behind a reviewed reverse proxy. It uses the socket address, never an untrusted forwarded-address header; a proxy currently creates a conservative shared rate bucket. Review trusted ingress/address handling before wider use. Use a valid TLS certificate. Do not change live Pages or backend settings.
6. Build with public variables only using `node scripts/single-child/build.cjs --staging`. Run the server with `node server/single-child-server.cjs` in the private staging environment. This prepares staging; it is not permission to deploy it during this task. The server rejects the known production target and mismatched service-key project references. Do not pass secrets in command lines, URLs or browser files.
7. Repeat the direct Auth/PostgREST/API/browser tests with explicitly configured fictional staging identities and safely scoped test fixtures. **Do not run local fixture reset/expiry SQL against hosted records.** Verify two-device PIN/reset/revoke/expiry, cookies, actual headers, Auth refresh/logout/disabled-user behaviour and the physical checklist. Obtain owner review before any release action.

| Binding | Where | Meaning |
| --- | --- | --- |
| `V13_STAGING_PROJECT_REF` | Build/server public configuration | Verified fictional staging ref, never production |
| `V13_AUTHORIZED_STAGING_REF` | Build/server public configuration | Exact matching reviewed ref |
| `V13_STAGING_URL` | Build/server public configuration | `https://<verified-staging-ref>.supabase.co` |
| `V13_STAGING_ANON_KEY` | Build/browser/server public configuration | That staging project's browser-public anon/publishable key; validated before packaging |
| `V13_REVIEW_ORIGIN` | Build/server public configuration | Separate HTTPS review origin, no path; not the live game |
| **`V13_STAGING_SERVICE_ROLE_KEY`** | **Server secret only** | Staging service-role JWT with matching `ref`/role. Required to call narrowly granted device RPCs; never a parent/child credential |
| **`V13_PAIRING_RATE_SECRET`** | **Server secret only** | Independent cryptographically random 32 bytes encoded as 64 hex characters for rate-bucket HMACs |
| **`V13_TLS_KEY_FILE`** | **Server secret-file binding** | HTTPS private-key file path, never content in logs |
| `V13_TLS_CERT_FILE` | Server file binding | Corresponding public certificate chain file path |

This task does not need a production database URL, production anon key, production service key, real learner login, SMTP password or parent PIN. No such credential is requested.

## Evidence and remaining limits

See the working review gallery and its verification JSON. Actual local API tests cover verification, one child, no child Auth rows, expiry, replay, concurrency, persistent guessing/generation/PIN limits, wrong-parent and cross-family denial, denied direct tables/functions, exact CAS/receipts, parent PIN/progress, disabled parent, grant expiry, same-child recovery and in-flight save/revocation. Separate migration tests cover atomic refusal/rollback and unchanged legacy records/PINs/unlocks/access. Four browser layouts cover registration through real captured mail to real learner play, parent progress, exact draft resume, reset/revoke/replacement and accessible entry/setup states.

Local success is **not hosted acceptance**. SMTP/redirects, hosted Auth settings, disabled-user/session refresh policies, real network proxy/cookies, catalogue/grant drift and actual iPad Safari/VoiceOver need dedicated staging/physical verification. Child suitability, small diagnostic confidence and offline-cache privacy limits remain as documented. Retention/export/deletion, support/account-removal procedure and privacy/DPIA decisions remain separate readiness work; no legal-compliance claim is made.
