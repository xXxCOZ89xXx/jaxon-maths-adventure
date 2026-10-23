# V5.1 production discovery and release hold — 20 October 2026

The owner authorises replacing the live game and accepts resetting learning progress where necessary. This supersedes earlier deployment prohibitions, but does not authorise removing accounts/PINs, weakening security or exposing fictional identities. **No cutover, merge, production SQL or data reset was performed.** Release is blocked by production backend compatibility/access and unverified live authentication, not missing permission to replace the website.

## Actual hosting and versions

GitHub Pages API reports the public production origin as **https://xxxcoz89xxx.github.io/jaxon-maths-adventure/**. It uses legacy branch deployment, `main`, root `/`, HTTPS enforced, no custom domain. Latest successful Pages build `1300525156` serves **`0d0b0265d75f26efeaaaf9bfeea0f061ded2a5a0`**, completed `2026-10-20T18:26:42Z`. A change to `main` is the existing deployment trigger; the PR QA workflow is not a production deployer.

The deployed homepage is titled “Jaxon's Maths Adventure · Prototype”. Its source uses password-based Supabase Auth and account-owned `learning_progress` JSON, with a shared family account UI. It explicitly says parent buttons are not separately secured; coins are calculated in client state. There is no role PIN flow on this homepage. These are source findings, not authenticated exploit results. The separately deployed `/v2-game-test.html` includes `v2-secure-cloud.js`, whose family/reward adapter expects `maths_families`, `maths_learning`, reward tables and older RPCs. Which route the family has bookmarked is not established by hosting metadata. Neither route establishes the actual database definitions or current hosted permissions.

Both original pages configure `https://mbdelspbjusarbwlltol.supabase.co` with a browser publishable key and the Supabase SDK. No service-role key was found in the inspected entry points. Public browser keys are not administrative credentials and cannot provide a schema backup or grant deployment access to the database.

The separate owner-private Site remains **V5, version 5**, at https://jaxon-maths-v3-private-staging.orion-shared-7254.chatgpt.site. Its project is `appgprj_6ad746f124fc8191b3f3845f9dff577b`; it uses separate staging Supabase `sfogrvedypgtxfvecmbx`. It was not republished or made public.

V5.1 candidate source is `54b5cf3dd36a1eb2a59b906de7751cf942d513f1` before these release notes: application `2f30f72`, final harness `a0da7d4`; Draft PR #2 remains unmerged. No production V5.1 URL exists yet.

## Rollback preserved

- Durable GitHub tag **`rollback/production-before-v51-0d0b026`** points to the complete original production source. Pushing this tag did not change the Pages source or deploy a replacement.
- Restricted workspace backup `/workspace/work/v51-production-rollback/` contains a verified complete-history `production.bundle`, `production-source.tar.gz`, and `rollback-manifest.json` recording Pages configuration/build and checksums. Directory mode is 0700 and files 0600. Source archive SHA-256: `02c53ae4c6e0ac8b147fae4ce45105b34fdb44cfc37c7027c359c9c42247d82f`.
- The workspace backup is session-local; the remote rollback tag is the durable code recovery reference. Do not publish a future database export in GitHub or CI artifacts.
- No personal records were downloaded and no database backup was possible with available access. No data was altered, so there are no data changes to restore. A private database backup remains mandatory before any future migration; accepting a learning reset does not waive preservation of accounts, PIN hashes, relationships and authoritative reward records.
- For an asset-only rollback after future cutover, use a reviewed revert/restoration commit on `main` restoring the complete tagged tree, retain Pages `main:/`, and verify the new Pages build and original login/save behaviour. Avoid force-pushing history. If backend changes have occurred, freeze new writes and reconcile post-cutover records before restoring compatible server behaviour; an asset rollback alone cannot undo database changes safely.

## Database and security release blocker

V5.1 input/draft fixes themselves only add optional JSON progress fields. However, the connected adventure requires the **different V3 backend contract**: `v3_identity`, `v3_role`, `v3_set_pin`, `v3_unlock`, `v3_request`, server PIN/unlock tables, CAS progress and authoritative wallet/transaction tables. Its configuration is explicitly staging-only and verifies the staging identity before login. The staging builder intentionally rejects production project refs found in the original pages.

There is no reviewed production builder/configuration or verified production schema/migration. The existing `supabase/v3-staging/` SQL must not simply be run on production: its family table may conflict with existing definitions, and its PIN and wallet stores are different. Repointing the staging build, removing its identity guard or publishing the offline demo would not satisfy normal production authentication.

Test identities and auth interception live only in Node/Playwright helpers; no application test-auth flag or public fictional user was added. The actual staging build replaces the offline demo entry point with the normal authenticated adapter. Isolated PostgreSQL verifies parent/learner denials, direct-table restrictions, cross-family isolation, server wallet authority, PINs and immutable retries. These results do not certify production policies. Existing hosted security definitions remain unknown and unchanged.

## Checks completed and live limits

- Reconfirmed hosted [run 39502533251](https://github.com/xXxCOZ89xXx/jaxon-maths-adventure/actions/runs/39502533251): successful at exact source `a0da7d44c99a606ce442263df5f9cc8b77f9c0dc`, all workflow steps successful. Evidence records **344 browser passes**, 86 per Chromium/WebKit project, nine worlds, 55 skills, four fictional profiles. Candidate application/build/test sources are byte-identical to that run; subsequent commits were documentation only.
- Fresh release checks: `npm test`, configured `npm run build:staging`, `npm run verify:staging`, `npm run test:staging-build`, and **14/14** disposable, network-disabled PostgreSQL security suites passed. This is a validated staging build, **not a production build**. Deployable build remains ignored locally; no credentials were committed. The latest typed-answer, persistence, clock, stale-edit, pounds/pence, bill-sharing and touch-layout fixes are present.
- Responsive Chromium portrait/landscape and hosted iPad WebKit results stand. They establish emulated coverage, not physical Safari/keyboard/gesture compatibility.
- Read-only HTTPS probes of production origin and production Supabase `/auth/v1/health` each failed at **proxy CONNECT HTTP 403**, before either origin received a request. The enforced environment allowlist omits both hosts. The earlier staging proxy problem therefore also affects production verification from this environment; this does not prove an ordinary iPad browser is blocked.
- Normal learner/parent login, PIN entry, live role boundaries, save/reload, reward tampering rejection and recovery are **blocked/unverified**. No account/password/PIN request or destructive live test was attempted. Only staging public configuration is supplied in this environment; there are no authorised production fictional-account sessions or database administration bindings.

## Exact owner involvement needed for continuation

1. In the supported Cloud environment configuration, allow `xxxcoz89xxx.github.io` and `mbdelspbjusarbwlltol.supabase.co`; also allow `sfogrvedypgtxfvecmbx.supabase.co` for the existing fictional staging acceptance. Apply/restart the environment as required. Do not bypass the proxy or expose the private Site. These are network settings, not website audience changes.
2. Supply a trusted read-only production schema access path or private **schema-only** export covering tables, functions, grants, policies and extensions. Provide it through private workspace/secure integration, without personal row data or secrets in chat/GitHub. Confirm the family's bookmarked route. This enables preparation of the exact production integration and migration instead of guessing from draft SQL.
3. After that audit, review the concrete account/family/PIN compatibility proposal before any incompatible authentication change. Preserve existing Auth identities and PIN configuration; do not recreate identities or enroll replacement PINs merely to reset progress. Existing production uses cannot be inferred from the staging model. No blanket staging SQL application is proposed.
4. Before production database writes, enable an owner-controlled private backup/restore mechanism. Bind dedicated fictional parent/learner credentials securely for real authentication verification; do not reuse Jaxon's session or publish test passwords/PINs. If no such production family exists, its protected provisioning needs owner involvement through the trusted administrator path.

Once access is available: inspect schema and current Auth relationships, prepare a reviewed production build and compatible server migration, rehearse against a private clone, verify normal fictional hosted Auth/PIN/RLS and saves, take the private backup, then cut over through the existing Pages workflow with rollback monitoring. The owner has already authorised website replacement; repeating that general permission request is unnecessary.

## Physical iPad acceptance — pending

Run once V5.1 is actually live, using authorised fictional accounts for resets and reward checks. Record pass/fail/blocked and symptoms without credentials or personal records.

| Check | Expected result |
| --- | --- |
| Safari login and PINs | Normal learner and parent password login; four-/six-digit PINs where the reviewed backend requires them, incorrect PIN denied, lock/sign-out effective. Learner cannot open parent controls. |
| World map | All nine worlds open in portrait and landscape; map, camp and Back controls remain reachable. |
| Typed answers | Keyboard stays focused; integer/decimal entry matches the displayed unit; blank/invalid input cannot submit an old answer; Enter and Submit behave consistently. |
| Maths objects | Tap and drag supported blocks, groups and money; alternatives remain usable; dragging does not trap normal page scrolling. |
| Split the bill | Friend shares, total and remainder are readable; change amount, answer, save and reload. |
| Fractions and coordinates | Shade/unshade by tap and horizontal gesture; read axes and choose points; rotate device without losing selections. |
| Hints and teaching | Incorrect answers and “I don't know” lead to support; supported work is distinct from independent mastery. |
| Save/resume | Save midway, reload, background Safari and return; resume exact draft, answer, hints and task. Test reconnect and a second device without deleting unsynced storage. |
| Shopping and cooking | Start recipe, collect ingredients, pay/change, finish cooking and reload. Basket, budget and receipts persist; payment/ingredients are not consumed twice. |
| Parent rewards | Parent alone awards/redeems; learner purchase charges once; unaffordable purchase fails. Confirm 60 minutes/week, ten coins per active minute, 1:1 screen time. |

Physical iPad testing has **not** been performed. Next development priority is the production integration and real hosted security acceptance, followed by this single device walkthrough; further content expansion is secondary.
