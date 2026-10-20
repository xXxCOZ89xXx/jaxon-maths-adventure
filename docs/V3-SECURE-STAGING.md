# V3 secure staging integration and setup

Status: implementation and isolated tests; **no hosted staging project has been connected or migrated**. Continue on `codex/v3-adventure-build`, draft PR #2. No production release is authorised.

## What is implemented

`v3/staging-app.js` uses the official bundled Supabase client for separate account-password authentication, persistent account sessions/refresh, PKCE email recovery and account-password changes. It recognises the family role from a database relationship, not editable user metadata. Each linked learner has a four-digit PIN; each linked parent has a six-digit PIN. PINs are verified in PostgreSQL using bcrypt, with five failed attempts followed by a five-minute cooldown. Incorrect attempts return a result rather than raising an exception that would roll back the counter.

An account password is required before setting/recovering a PIN: the server checks signed Auth `amr` password authentication within five minutes. PIN recovery invalidates all that account's game unlocks. An unlock is a random 256-bit capability, stored hashed in the database, bound to the authenticated user and PIN generation, and checked on **every** progress/reward RPC. Parent unlocks expire after 15 minutes; learner unlocks after 12 hours. Refreshing a tab preserves its unlock; a new browser session needs the PIN again. Lock/sign-out hides the game immediately and revokes the current capability where a connection is available. A disconnected device cannot remotely revoke a token until reconnecting; expiry remains enforced server-side.

All sensitive tables enable RLS and deny direct client grants. Only narrowly scoped security-definer RPCs can access progress, PINs, wallets and transactions. Learners cannot award/redeem rewards or choose a target child; parents cannot save learner progress or purchase cosmetics. Every call resolves the child from the authenticated family relationship. Ambiguous, unlinked and mixed-role accounts fail closed. This first integration supports one child per parent account; a multiple-child selector requires additional work.

Progress uses compare-and-swap revisions and durable, immutable retry requests. A lost response retries the same request ID and contents; later edits wait behind that request. A conflicting device cannot silently overwrite another device. The modal offers an explicit choice of complete versions and archives both locally, including unfinished quests and independent checks. No unsafe field-wise assessment merger is used. Online polling retrieves other-device changes. One writing tab per learner account is allowed per browser; separate devices are coordinated by server revisions.

The database serializes wallet operations on a per-learner row, validates prices against all 40 catalogue items, rejects unaffordable/duplicate ownership, and makes reward/purchase requests idempotent. Parent awards are whole amounts from 1 to 60. A parent may also explicitly confirm reported offline minutes after reviewing learning evidence; the server caps confirmation to saved uncredited time, then credits 10 coins and one screen-time minute per confirmed minute, idempotently. Browser transaction intents survive a lost response and reload. Client-supplied `coins` and `bought` fields cannot change the authoritative wallet. Parent screens read actual saved practice/check/recent evidence from their linked learner; guided learning, story milestones and fresh/spaced checks stay distinct.

The existing nine worlds, 55 skills, 60-minute weekly goal, teaching/mastery rules and 1:1 conversion are retained. V2-shaped progress and unknown fields survive migration. A privileged, one-time fixture importer preserves existing coins, owned IDs and active minutes without accepting untrusted browser imports or overwriting an existing V3 record.

## Important limits before release

- No real Supabase Auth, email delivery, PostgREST integration, token refresh/revocation behaviour, hosted RLS or cross-device connection has been verified. SQL tests use actual PostgreSQL/pgcrypto with simulated signed-claim context; browser tests intercept all cloud traffic with fictional responses. Neither is a real staging acceptance result.
- Saved learning evidence is client-observed evidence, not cryptographically proven assessment results. Connected activity credit is capped against a shared server clock and a maximum 15 seconds per request. This prevents duplicate/concurrent credit but cannot prove a person was learning. Stronger anti-cheat would require server-side assessment/activity validation.
- Offline quest and assessment changes queue on the device. **Offline time is retained in reported learning progress, but is not automatically minted into server coins or redeemable screen time.** The conversion of credited active minutes is still 1:1. Instead, a parent can review the saved evidence and use **Confirm reported offline learning minutes**. This server-authorised action reconciles whole minutes once, without allowing a learner to mint rewards from an untrusted snapshot. The dashboard shows the time awaiting review.
- Warm offline use preserves the learner's current unlocked game. There is no service worker: cold offline navigation cannot be guaranteed. Offline parent rewards/purchases are blocked. Device storage must remain available; clearing browser data removes unsynced changes and local conflict archives. Storage errors preserve existing bytes and show a warning.
- A PIN locks server actions and the app UI, but is not encryption of the local cache. A person with developer tools/device access can inspect device-local fictional data. Use a private device/profile for staging; do not store real learner data during QA.
- Physical iPad Safari, actual Auth recovery emails, and the consolidated family acceptance remain required. Existing production/V2 identity layout must be reviewed separately before any future release migration; no production-data export/import is part of this task.

## Exact staging setup (owner actions)

1. Create a **new**, empty Supabase project named **`jaxon-maths-v3-staging`**. Do not reuse, branch into, or use credentials from the live project. Record its project ref and URL from the dashboard. Confirm the dashboard project name, project ref in the URL, and database connection target all describe this new project. A manually written environment marker alone does not prove the physical project's identity.
2. Explicitly authorise applying the three new migrations **to that verified project only**. No tool in this repository applies remote migrations automatically. The project/credentials are unavailable to this task, so no remote SQL has run. Do not run the old `supabase/setup.sql` or `v2-bonus-shop-migration.sql` for this standalone staging schema.
3. In that project's SQL Editor, prepend the following settings to **001_secure_core.sql**, replacing the placeholder with the verified 20-letter project ref. Execute 001, then 002_catalog.sql, then 003_import_compatibility.sql, once each. Each migration is transactional; do not rerun or reset schemas to work around an error.

   ```sql
   set app.v3.staging_authorized = 'yes';
   set app.v3.staging_ref = '<verified-staging-project-ref>';
   ```

   The SQL requires pgcrypto in the `extensions` schema (Supabase's normal setup). New public tables have RLS enabled and no browser table grants. Do not add permissive direct-write policies. Migration 003's importer is administrator-only.
4. Disable public sign-ups for this private staging project. In **Authentication → Users**, create four fictional, email-confirmed users: `test-parent-a`, `test-learner-a`, `test-parent-b`, `test-learner-b`, with privately managed test email addresses and strong account passwords. Do not use real family email addresses or learner IDs, and do not publish passwords/PINs. Link two independent families in the SQL Editor:

   ```sql
   insert into public.maths_families(child_user_id,parent_user_id) values
     ('<test-learner-a Auth UUID>', '<test-parent-a Auth UUID>'),
     ('<test-learner-b Auth UUID>', '<test-parent-b Auth UUID>');
   ```

   For a synthetic V2 compatibility trial, call `public.v3_admin_import` with a reviewed **fictional** progress object before the first V3 sign-in/read. The importer rejects a second import. Do not upload a personal learner backup for QA.
5. In a private local shell/CI environment, set these variables (the public anon/publishable key is intended for browsers; never supply a service-role/secret key):

   ```text
   V3_STAGING_PROJECT_REF=<verified-staging-project-ref>
   V3_STAGING_AUTHORIZED_REF=<same-ref-after-explicit-authorisation>
   V3_STAGING_URL=https://<verified-staging-project-ref>.supabase.co
   V3_STAGING_ANON_KEY=<that-projects-public-anon-or-publishable-key>
   ```

   Run `npm ci --ignore-scripts`, then `npm run build:staging`. Missing/mismatched configuration, secret keys, malformed URLs and known live-page project refs fail the build. There is no production fallback. Generated `staging-dist/` and `.env*` files are ignored by Git; only the public browser configuration is emitted. Do not use `tests/prepare-v3.cjs` for an actual staging deployment: it deliberately builds a non-working fictional endpoint for intercepted QA.
6. Put **only `staging-dist/`** on a separate private HTTPS static origin of your choice, after reviewing that host/access settings. No hosting account is configured by this task. Do not change the existing GitHub Pages source, custom domain or homepage. Configure the exact staging origin/path in Supabase Auth Site URL and redirect allowlist. Recovery uses PKCE: request and open the recovery link in the same browser. Configure/rate-limit private test email delivery as appropriate.
7. Sign in separately as each test account using its account password and create the appropriate PIN. If PIN enrollment says fresh password authentication is required, sign out and sign in with the password again; do not weaken the database check. Verify real staging Auth supplies the expected password `amr` claim before proceeding.
8. Run the single consolidated acceptance below on the private staging origin. Keep the second family's accounts private to the owner and use them for the negative isolation checks. Record real staging results separately from the automated mock/PostgreSQL report. No production migration, merge, deployment or real-data import is authorised here.

## One consolidated acceptance session (30–40 minutes)

Begin with the downloadable offline preview from the successful PR Actions run: open all nine worlds, complete a supermarket task and one gateway, restore a landmark, equip an outfit, and place a Base Camp collectible. Check iPad portrait/landscape, touch targets, keyboard/focus, sound off and reduced motion.

On the verified private staging origin, sign in as fictional learner A, enter an incorrect PIN, then unlock with the correct PIN. Teach/practise a skill, use a hint and verify this does not create independent mastery. Begin a fresh independent check and save halfway through a quest. Refresh and reopen: confirm the exact answers, hint status and outfit survive. A fresh browser session should retain the account sign-in but require the PIN.

Disconnect during a save, make a supported quest change, reconnect and verify one saved outcome. Use two devices to make different edits before either syncs; choose one version and confirm the other is archived, without combining assessment answers. Confirm the UI explicitly distinguishes reported offline learning time from server reward credit. As the parent, review and confirm one uncredited offline minute, then retry the same interrupted request: the wallet should gain exactly 10 coins and one redeemable screen-time minute.

As parent A, verify weekly reported evidence, independent/support labels and server credit. Award bonus coins, retry an interrupted award, and buy an affordable item as learner A; confirm each transaction occurs once and an unaffordable item is rejected. Learner A must be denied parent awards even by a direct RPC call; parent B/learner B must see only their own family. Check the second browser-tab warning and PIN lock/expiry. Use password recovery and PIN reset with the privately managed staging email account; confirm old unlocks stop working.

Record all findings once, including physical Safari behaviour. Only after fixes, a green automated report and successful real staging acceptance should a separate production migration/release proposal be prepared. Do not merge PR #2 or replace the live homepage during this walkthrough.
