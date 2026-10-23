# V5.2 staging preservation readiness — 22 October 2026

**Prepared for review; not applied or published.** Importer permission correction is complete by owner verification: service_role/anon/authenticated=false, postgres=true. Four existing Auth accounts, two independent families and known PINs are reused.

## Actual new verification

- Six focused suites passed in a disposable **network-disabled PostgreSQL 17** container with fictional accounts/data: target/importer prerequisite; pause plus late-error atomic rollback; exact original-column/PIN/unlock preservation; historical retry/new validation/CAS; cumulative wallet/purchases and side-effect-free reads; freeze/rollback retaining later activity.
- Four offline client/build suites passed: staging version/isolation and unchanged storage namespaces; exact pre-upgrade transaction retry plus retained rejection bytes; retained save queues/archives; unpublished staging-only artifact with unchanged gameplay bytes and refusal to overwrite an artifact.
- Configured private staging artifact and SQL/site hash package built successfully using existing browser-public bindings, without printing the key or making a Supabase request. Production/offline/root source files are unchanged.

Evidence: [database results](../tests/artifacts/v52-staging-preserve-db.json) and [client/build results](../tests/artifacts/v52-staging-preserve-client.json). These are focused local results, not hosted Auth/SQL or browser/device certification. Historical broad audits/security/gameplay matrices were not repeated.

## Review outcome and remaining limits

The [source review](V52-STAGING-PRESERVE-REVIEW.md) covers isolation, server role/PIN boundaries, data/queue preservation, immutable replay ordering, private metadata and rollback scope. The [runbook](V52-STAGING-PRESERVE-RELEASE.md) defines complete owner-only phases and acceptance checks. No data-reset/import/production activation path is used.

SQL guards still need to run against staging **only after approval**. Actual active Auth/API configuration, provider/private staging recovery coverage, real JWT/AMR/refresh and physical iPad behaviour remain owner-controlled gates. A SQL acknowledgement is not evidence that a backup or service configuration exists.

The intended next approval is the exact hashed staging maintenance/pause → additive install → verification → resume package, after current private staging recovery coverage and source/file hashes are reviewed. Publishing the private artifact and running hosted operations require separate scope. No migration was executed on Supabase, accounts/PINs changed, V5.2 activated, site published, merge or deployment performed.
