# Phase 1 — separate synthetic test environment

19 November 2026. Implemented locally for the agreed UK family launch plan. This package prepares a separate test target and its guarded server marker; it does not provision a hosted project, apply SQL, create accounts, publish, change the live family identity or perform the separate environment rename.

## Delivered

- `v3/synthetic-environment.js`: explicit `synthetic-test` configuration and server identity/capability validation. Both known current/legacy live project references are refused. The expected project, authorised reference, HTTPS endpoint and public browser key must match; private/service-role keys are refused and unknown configuration fields are discarded.
- `scripts/build-synthetic-environment.cjs`: a separate build with a permanent visible test banner, distinct asset/config/entry names, explicit server verification on boot and separate Auth, PIN, game, request, history and verification storage namespaces. It never falls back to a family database or trusts an old offline verification marker to bypass the synthetic server check.
- `supabase/synthetic/001_environment_marker.sql`: a review-only additive marker for an empty separate project with a reviewed baseline. It refuses live references, mismatched identity, missing fingerprints, existing Auth/learner/other public records, missing receipt/reset contracts and permissive grants. It preserves the baseline's internal name and request/reset functions. The identity delegate and marker table stay private; the public identity returns only aggregate synthetic capability metadata.
- The existing family builder is now pinned to the owner-confirmed current family project, while its explicit offline fixture path remains separate. Wrong test-project settings fail before any output is written. A scratch-build comparison against release `21237873a04ce1306b8596d1097b234098300f01` found **241 family output files identical byte for byte**. Existing deployment artifacts were not overwritten.
- A dedicated CI workflow rehearses project/build guards, local database contracts and browser journeys using fictional identities and intercepted traffic.

These are environment/misconfiguration guards. They are not a replacement for server-side authorisation, proof that future data is fictional, commercial household/session implementation or a deployed security certificate. Only the operator can keep actual test accounts/data synthetic. No private configuration or real family data belongs in this package.

## Fixed configuration paths

| Purpose | Builder/output | Backend and storage |
| --- | --- | --- |
| Existing family | Existing `npm run build:staging`, `staging-dist` | Current family reference and original Auth/cache/queue keys. The historical staging name is retained. |
| New hosted synthetic target | `npm run build:synthetic`, `synthetic-test-dist` | Separately reviewed non-live reference and `esa_synthetic_*` / `esa-synthetic-*` namespaces. Requires online synthetic server verification at boot. |
| Local synthetic fixture | `node tests/prepare-synthetic.cjs`, `synthetic-fixture-dist` | Reserved fictional reference, invalid synthetic public JWT and intercepted fake server. Manifest explicitly marks it non-deployable. |
| Public demo | Existing demo builder/output | Existing offline isolation; no synthetic configuration or SDK entry added. |

The deployable synthetic builder reads only these public settings: `ESA_SYNTHETIC_PROJECT_REF`, `ESA_SYNTHETIC_AUTHORIZED_REF`, `ESA_SYNTHETIC_URL`, `ESA_SYNTHETIC_PUBLIC_KEY`. It never reads a database password or privileged service key. An opaque publishable key must be checked against the actual project by the operator; JWT decoding here checks configuration shape/project claims, not an Auth signature. Supabase and the server still validate authentication.

The two synthetic output directories are separate from all existing deployable outputs. The builder refuses to overwrite a nonempty output directory. Fixture preparation may replace only its own fictional directory. No hosting command/pipeline has been switched to the new builder.

## Server setup boundary

A hosted synthetic project does **not** exist as a result of this PR. Provisioning requires its own reviewed approval, organisation/plan/cost check, chosen project reference, separate HTTPS hosting and Auth/recovery URL configuration. Do not assume a second project is free or take a real-data clone as a shortcut.

The marker is **not a full baseline installer**. It deliberately requires a reviewed compact-receipt/reset baseline already installed in the separate project. Before installation, review its actual `pg_get_functiondef` fingerprints and grants; set `app.synthetic_setup_reviewed`, `app.synthetic_expected_project_ref`, `app.synthetic_identity_sha256` and `app.synthetic_request_sha256` in the intended owner session only after that review. Do not copy hashes blindly from another project, relax guards or infer the installed baseline from this local fixture.

The marker leaves `v3_environment.name`, current account/PIN/request/reset behaviour and the existing first-read initialisation branch intact. It wraps identity additively with `environmentKind: synthetic-test`, `syntheticOnly: true`, `syntheticContractVersion: 1`. It refuses reinstallation and rolls back all changes on failure. It creates no users or family relationships. Fictional accounts are provisioned only after the separate reviewed setup.

The local SQL rehearsal builds a representative source baseline in a network-disabled PostgreSQL instance, with fictional Auth helpers and users. A project reference is rebound only in that disposable fixture copy of the compact migration; the original project-pinned migration is unchanged. This proves the marker's guards, transactionality and interaction with those contracts. It does not claim provider Auth, email, PostgREST/JWT handling or the exact currently installed live baseline has been tested.

Once a real synthetic project is approved and configured, rehearse actual Auth/API/roles, two unrelated families, PIN/reset/recovery, retries and grants there with fictional users before commercial account rollout. Read the database environment marker as explicit metadata; do not call its existence a tenant/security audit.

## Verification

- `npm run test:synthetic`: wrong/live target and key rejection, private-field filtering, separate outputs/storage, seven network-disabled PostgreSQL groups covering baseline/ref/data/grant guards, rollback, private helper access, parent/learner PINs, two-family isolation, exact save/award/purchase retries, reset-wrapper initialisation and later disabled-history compatibility.
- `npm run test:synthetic-browser`: 16 portrait/landscape Chromium cases. Real browser sign-in/PIN/sign-out controls and interrupted Town saves are exercised against an intercepted fake API. Family storage sentinels stay unchanged; live config, wrong/missing server capability and forged offline verification fail before play.
- Existing game regressions, family build verification, lint/format/status and the combined 56-case Chromium save/recovery gate remain required. See the preparation evidence in `tests/artifacts/synthetic-environment-verification.json` and the family output comparison beside it.

Physical iPad Safari remains the grouped acceptance session near the end of the planned launch build. No repeated owner device test or backup installation is requested by this package.

## Phase 1 progress and remaining gates

Branding is released and the owner has completed current application-data recovery with a PARTIAL PASS and unchanged archive. [PR #39](https://github.com/xXxCOZ89xXx/jaxon-maths-adventure/pull/39) retains that separate recovery/storage handover; managed-service recovery limits stay explicit. This package supplies the separate synthetic build/marker/local rehearsal, independently of the live history cutover.

The active release ruleset was read on 19 November: it applies to `release/ipad`, requires pull requests and the `save-and-recovery` status, and has no bypass actors. Repository visibility was read as public; the owner's source/IP visibility decision remains open. Operator MFA/password-manager actions are not inferred from repository settings and no password workbook was opened.

Remaining Phase 1 operations are: the concrete retained-history installed-contract/recovery-limit review and separate installation/activation approval; approved synthetic project/baseline/host provisioning and actual Auth/API acceptance; remaining operator security/visibility decisions; and a transferable sales-site source handoff. The website chat and shared Notion reference have been read, but its source files are not present in this build workspace. Workspace paths alone are not a code transfer. The canonical www routing, mail records and /game, /account and /demo selections remain in the shared plan.

Current shared plan: https://app.notion.com/p/41d245cc3bb581b8b8eec6de9bb20c9b . Keep completed, prepared and live work distinct there. No merge, deployment, hosted SQL or project creation is performed by this preparation.
