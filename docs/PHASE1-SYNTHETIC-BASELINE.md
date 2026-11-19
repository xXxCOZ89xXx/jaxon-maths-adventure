# Phase 1 — fresh synthetic database baseline

19 November 2026. **Prepared package; no hosted SQL executed.** The owner supplied the separate test-project URL `https://vyxvemtevkxlwqzelghj.supabase.co`. Existing game/demo release PRs #39/#40 are complete. This package is the next foundation step, not a commercial account rollout.

## Owner-run installation handoff

The owner authorised this test baseline and clarified that further setup/fixes/testing in the new test project need no repeated approval; live game/demo updates still need approval. That supersedes the earlier test-project approval wording below.

Use the complete `supabase/synthetic/fresh-baseline/RUN-IN-TEST-PROJECT.sql` in one new query after selecting the test project in the dashboard. It includes both session settings followed by the exact unchanged reviewed installer. Copy the whole file, clear any partial editor selection and run once. No manually combined fragments or separate settings query are needed. The manifest hashes both the original reviewed SQL and this complete operator file. The tests execute that complete file for the successful installation case.

An owner run returned no rows, then `v3_identity()` was absent. Installation is not verified; only part of the query may have run. No cleanup or guard bypass is authorised as a shortcut. If the complete file finds existing objects, inspect the error before continuing. The expected final result is one `synthetic_identity` row.

## Exact target and scope

Only `vyxvemtevkxlwqzelghj` is accepted by `scripts/prepare-synthetic-baseline.cjs`. Both known live references and all other references are rejected. This is an offline SQL/package generator: it opens no connections, reads no keys/passwords, creates no accounts and executes no SQL. The actual project name/plan/region/emptiness still require dashboard verification. The supplied URL confirms the owner's chosen reference, not those other settings.

The output assembles five SHA-256-pinned, unchanged source files: the secure V3 core, original 40-item catalogue, compact receipts, parent reset wrapper and synthetic identity marker. Only the generated compact-migration target copy is rebound; the original Main-pinned migration is untouched. The generated SQL uses one transaction, including its postconditions, so an error before commit rolls back the baseline and permission changes together. It leaves the internal staging name in place because reset initialization depends on it. Retained-history installation and live environment rename are separate operations.

The installer refuses missing owner-review/dashboard-reference flags, a non-postgres caller, missing managed Auth primitives, existing Auth users/identities, Storage buckets/uploads, an existing synthetic marker and any non-extension public relations, functions or types. Empty old application tables also cause refusal. No cleanup/drop/reset path is offered. Extension-owned objects are not treated as application data or stripped of their grants; an incompatible pgcrypto schema stops installation.

The synthetic marker fingerprints the exact functions freshly created from reviewed source in this transaction. It does not bless unknown pre-existing functions: the empty-schema guard runs first. Final permissions close inherited/default browser and service-role access to all created application tables and helper functions. Only identity is anonymous; the existing role/PIN/request RPCs require authenticated credentials. Public schema creation is revoked from browser/service roles.

**Target-verification boundary:** a project reference supplied as a session setting cannot independently prove which hosted cluster the SQL editor is connected to. The owner must verify the dashboard project/reference before running the exact reviewed package. Existing-data refusal is an additional safeguard, not a substitute for that check. Local tests use simulated Auth helpers and permissive provider default grants; actual Supabase Auth, email and PostgREST remain unverified until hosted acceptance.

## Reproduce the review package

From this exact reviewed source checkout:

```sh
npm run prepare:synthetic-baseline -- --out /a/new/review-directory
```

The destination must not already exist. The command writes `INSTALL-REVIEW.sql` and `MANIFEST.json`, including the target, all input hashes and output SQL hash. No database command is issued. The exact generated review SQL and manifest are also committed under `supabase/synthetic/fresh-baseline/` so owner review needs no Node installation; the test suite checks both against the generator byte for byte. Retain the reviewed output; do not overwrite it or edit its target/hashes by hand. Changed source dependencies require a new review. The generated SQL is deliberately not included in either game/demo deployable build.

## Installation review — not an instruction to run now

Before specific hosted installation approval:

1. Confirm the owner-created project's dashboard reference is exactly `vyxvemtevkxlwqzelghj`, its selected plan has no unapproved cost and it is still unused. Never select Main, a NYN project or a live-data clone.
2. The committed `supabase/synthetic/fresh-baseline/PRECHECK.sql` provides a read-only aggregate inventory after dashboard selection; it returns no records or secrets and does not identify the physical project independently. Review the PR, source-hash manifest and exact generated SQL; verify its SHA-256. Preserve the existing current-game backup checkpoint; this empty-project operation does not require repeating that restore.
3. Review the concrete SQL-editor session flags `app.synthetic_fresh_install_reviewed=yes` and `app.synthetic_dashboard_ref=vyxvemtevkxlwqzelghj` together with that exact package. They are acknowledgements, not secrets or physical-host attestation. No flags are set on a remote service by this preparation.
4. After specific approval, install the reviewed package in the separate project and inspect only its aggregate identity/capability result. A refusal means stop and review; do not delete existing records or bypass guards. Reinstallation is intentionally refused.
5. Separately review provider password minimum 12, closed signup/invite restrictions, exact Auth/recovery callbacks, fictional operator-controlled test accounts and restricted HTTPS test hosting. Noindex alone is not access control. No real learner data or public fixture password belongs there.
6. Verify actual Auth/PostgREST, PIN/roles, unrelated-family isolation, retry/reset behaviour and browser configuration before moving on to household/session implementation. Preserve existing family/demo hosting, IONOS mail and future /game routing boundaries.

No setup flags, accounts, family links, uploads or API calls have been applied to the hosted project by this work. The baseline retains the current one-linked-child RPC model; the planned three-child household architecture belongs to Phase 2.

## Verification evidence

`npm run test:synthetic-baseline` uses a network-disabled PostgreSQL container. Eight groups cover deterministic/hash-bound packaging and non-overwrite; missing approval, wrong target and caller refusal; preservation of Auth/Storage/unrelated records and objects; late-error atomic rollback; successful baseline and rerun refusal; restrictive grants despite permissive defaults; two-family PIN/save/financial retry and compact receipt behaviour; and reset-generation fencing. The aggregate artifact is `tests/artifacts/synthetic-baseline-verification.json`.

The synthetic CI workflow runs this suite alongside existing environment contracts and intercepted-browser checks. Local game regression/lint/format/status and the required save/recovery gate remain applicable. Physical iPad Safari remains the single grouped acceptance near the end, not a requirement to repeat now.
