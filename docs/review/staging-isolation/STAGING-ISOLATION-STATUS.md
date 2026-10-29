# Staging isolation and owner handoff

29 October 2026. Repository `xXxCOZ89xXx/jaxon-maths-adventure`, branch `codex/single-child-readiness`, continued from verified clean head `1615476`. No Main/production query, migration, data copy, settings change, release PR, merge or deployment.

| Project | Ref | Current treatment |
| --- | --- | --- |
| Jaxon’s Maths Adventure - Main | `sfogrvedypgtxfvecmbx` | Owner-confirmed only existing project. Completely excluded from staging configuration, audits, servers and migrations |
| Deleted former project | `mbdelspbjusarbwlltol` | Rejected; no probe or reconnection |
| Isolated hosted staging | Not provisioned | No ref, organization, region or billing choice guessed |
| Local fictional fixture | `abcdefghijklmnopqrst` | Loopback-only Docker Auth/PostgREST/database; not a hosted project. Existing synthetic records preserved |

## Why the remote step stopped

The environment's current observations show only legacy `V3_STAGING_*` public variables, no configured secrets, no outbound Supabase identity and no capabilities. A presence-only check found no Supabase management token binding or CLI login. Tool discovery found no Supabase management/project-creation tool or suitable secure secret-store writer. The status tool cannot mutate its network allowlist. Sites production environment-variable tools are not an appropriate vault for an unrelated Supabase project and were not used.

Consequently Codex cannot identify the correct organization, establish free-project allowance/charges, create a project or securely store its generated database password. No remote password was generated; no billing, account or project action was attempted. No management API call or request to Main/deleted host was made. The old allowlist's deleted hostname is not evidence of a current staging project, and existing variables pointing to Main are unsafe, not usable staging access.

## Completed repository preparation

- Main/deleted denials in the shared policy, staging config, browser review config, preservation config, direct HTTPS gateway construction, audit and build entry points. Tests exercise both forbidden refs before network calls, including matching forged markers/keys.
- Removed Main as the default local/preservation/staging identity. No hosted staging default is assigned. Local services use the explicit fictional marker with loopback checks; existing fixture accounts/saves remain intact.
- Staging core/catalog/import/receipt/verification and one-child migration guards reject both protected refs. Receipt upgrades now use an explicit independently verified new target setting and retain the exact routine fingerprints, role/grant checks and rollback behaviour. Legacy preservation/diagnostic SQL is also fenced; old plans are historical, not instructions to access Main.
- Current setup/security guides state the owner-confirmed inventory and exact target settings, public bindings and server secret **names**, without values. Historical screenshot/test artifacts remain as historical evidence; their old labels and previously downloaded ZIPs are superseded and must never guide hosted access.
- Existing one-child runtime is reused. No new gameplay/account model, sibling feature, production entry configuration, original artwork or learner data change.

## Single owner action

**Provision the separate staging project in the correct Supabase dashboard organization and attach it through secure environment setup.** Confirm existing free allowance/no upgrade/no unexpected charge; choose a UK region if available; store the strong generated database password in an approved secret manager; hand off only the new staging configuration and private bindings through secure platform controls, with an approved allowlist entry for its new hostname. Do not paste credentials into chat. If any condition is unavailable, stop rather than guessing.

The exact staged migration order, flags and configuration are in [SINGLE-CHILD-SETUP.md](SINGLE-CHILD-SETUP.md). Required private bindings include `V13_STAGING_SERVICE_ROLE_KEY`, `V13_PAIRING_RATE_SECRET` and `V13_TLS_KEY_FILE`; public configuration includes matching new/authorized refs, staging URL/public key, review origin and certificate file path. SMTP, HTTPS gateway hosting and secure storage/ingress must be reviewed before hosted acceptance. No production credential is required.

## Evidence boundaries

Local tests use fictional data, real local GoTrue/PostgREST/PostgreSQL and intercepted production-build fixtures. Hosted staging does not exist and remains **unverified**. No result here certifies Main, a hosted API, actual SMTP/redirects, billing or legal compliance. Physical iPad Safari/VoiceOver remains untested. The review package includes corrected source, setup instructions, reports and screenshots; it contains no current credentials or database dumps.

### Local results for this update

Passed: denylist/no-network regression; 9 foundation, 5 identity-bridge, 10 local Auth/API, 10 receipt, 14 core-security, 6 preservation-database and 18 production-security groups; full logic and production/staging builds; 14 save/recovery, 16 setup/accessibility/production-entry and 24 intercepted production browser cases; 4 complete one-child browser flows (desktop, both iPad layouts and small touch); bounded secret scan (zero findings). These are fictional local/intercepted checks, not hosted acceptance.

One archived check remains failed: `npm run test:staging-preserve` expects an obsolete `staging-app.js` source shape (`if (check.error)`). The same builder assertion fails when loaded from starting commit `1615476`; it is not the current one-child builder. Its database preservation checks pass. No assertion was disabled or weakened. The current one-child build and production build pass. Historical production configuration and intercepted tests still contain the deleted ref; they were not redirected to Main or contacted.

The first broad production-browser run had one desktop reload timeout while another suite rebuilt the same production fixture directory. The complete isolated rerun passed all 24 without test or runtime changes. Both run logs are retained; no hosted network or real profile was used.
