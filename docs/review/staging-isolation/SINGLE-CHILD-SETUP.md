> **Current project inventory:** Main = `sfogrvedypgtxfvecmbx` (untouched); deleted = `mbdelspbjusarbwlltol`; new staging = **not provisioned**. Earlier staging labels were incorrect. Hosted acceptance has not run.

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

## Dedicated hosted staging: owner-confirmed status and exact setup

**No staging project exists yet.** The only existing Supabase project is **Jaxon’s Maths Adventure - Main**, ref `sfogrvedypgtxfvecmbx`. It is protected and must never be connected to, queried, migrated, copied or used for this work. Ref `mbdelspbjusarbwlltol` was deleted. Earlier documents mislabelled both projects; those claims are superseded. The existing `V3_STAGING_*` bindings point to Main and are quarantined by configuration guards before any network access. They must not be reused.

The local fixture now uses `abcdefghijklmnopqrst`, an explicitly fictional marker inside loopback-only Docker services. It is not a Supabase project or an endpoint to probe. Existing local fictional accounts/saves are retained. Hosted guards reject the local marker as well as Main/deleted refs.

The environment has **no Supabase management token/login, authenticated Supabase identity, organization information, approved secret-store writer or project-creation tool**. No management API request was attempted; organization, free quota and pricing cannot be established. Project creation is therefore blocked under the owner's conditions. No remote database password was generated or stored, and no remote project, network rule, billing, Main setting or data was changed. The available environment status tool is read-only; a new-host allowlist cannot be configured before the project/ref exists.

### One remaining owner action

**Provision a separate staging project and attach it through the platform's secure environment setup.** In the Supabase dashboard, use the intended existing organization, choose a clearly named staging project and a UK region if available, verify that creation is within the existing free allowance with no upgrade/unexpected charge, and generate/store its strong database password in an approved password/secret manager. If any condition cannot be met, do not create it. In the same secure handoff, supply the new staging ref/public configuration and server secret bindings below, and permit only its new hostname through the approved network policy. **Do not paste passwords, keys or PINs into chat, screenshots, URLs or ZIPs.** Main must remain untouched. No production credential is required.

After that secure handoff, the prepared staging-only installation is:

1. Independently verify the new project name/ref in the dashboard and the new database connection. Confirm it differs from Main, deleted ref and the local fixture. Select the exact new HTTPS origin and verify SMTP/redirect support. Never use a marker row as the sole proof of physical project identity.
2. On the **new empty staging database only**, review/apply `supabase/v3-staging/001_secure_core.sql` with `app.v3.staging_authorized='yes'` and `app.v3.staging_ref='<NEW_STAGING_REF>'`. Apply `002_catalog.sql`; it requires one matching safe staging marker. Do not import or copy any Main data.
3. Apply `004_compact_save_receipts.sql` with `app.v3.staging_ref` set to that same new ref. It still checks exact reviewed routine bodies, ownership, security context and schema preconditions. The removed hard-coded Main allow-target is replaced by an explicit target setting and a denylist for both protected refs. Run `004_verify_receipts.sql` with the same setting. No broad receipt/grant/assertion weakening is permitted.
4. Apply `supabase/single-child-draft/001_pairing_foundation.sql` with `app.v12.foundation_reviewed='yes'` and `app.v12.target_ref='<NEW_STAGING_REF>'`; then `002_identity_bridge.sql` with `app.v13.bridge_reviewed='yes'` and the same target ref. Review grants/RLS, foreign keys, rollback and exact source fingerprints first. Every applicable guard rejects Main and the deleted ref. Schema reload notification is included. No script automatically executes remote SQL.
5. Enable required parent-email verification and actual delivery in the staging Auth provider, PKCE/recovery and the separate review origin in allowed redirects. Disable anonymous Auth. Review signup/login/email/session abuse controls. Use only fictional parents in two unrelated families. Do not copy the local captured-mail/high-limit test settings into hosted policy.
6. Bind server secrets privately as listed below; build with public variables only using `node scripts/single-child/build.cjs --staging`. Prepare the HTTPS gateway with valid certificates and reviewed ingress/trusted-address handling. Do not expose secret files or copy server bindings into browser output. Gateway hosting/SMTP/secret storage/allowlist availability remain unverified, so this is a preparation checklist, not a hosted deployment claim or authorization to publish during this task.
7. Test real staging verification/pairing, both PIN flows, code expiry/reissue/replay/limits, revocation, exact same-child progress recovery and cross-family/parent-only denials. Verify actual table/view/RPC grants, signed claims, session expiry/refresh/disabled-user behaviour and cookies. **Never run local fixture reset, cleanup or expiry SQL against hosted records.** Use separately reviewed staging-safe fixtures. Record physical iPad Safari/VoiceOver acceptance separately; it remains untested.

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
