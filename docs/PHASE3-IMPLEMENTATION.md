# Phase 3 and retained history

Owner instruction: 18 November 2026, “ok do that plan”. Development order is content identities/registry, retained-history storage, then the remaining Claude Phase 3 recommendations. Automated fictional checks continue during development; one manual iPad Safari acceptance is deferred until the combined work is ready. No content expansion or Phase 2b artwork/touch overhaul is included.

## Delivery sequence

1. Stable, additive question keys and a shared registry for all skills, definitions and prerequisites. Preserve original generator IDs, prompt exclusions, stored evidence and paused snapshots.
2. Implement the reviewed storage design as an additive, capability-gated package: immutable content-addressed history, bounded current documents, paged transport, old-client/refusal and exact-retry compatibility, local recovery and reset-generation fencing. Rehearse against network-disabled PostgreSQL and fictional browser fixtures. Hosted installation/cutover remains a separate concrete review after a verified encrypted backup; none is performed as development QA.
3. Shared numeric marking with explicit precision/unit contracts for newly generated questions; preserve old saved validators. Question-specific worked steps and meaningful wrong choices. Version the new five-of-six mastery rule and one-stage demotion so historical results are not reinterpreted.
4. Consolidate current status/instructions, add lint/format tooling in one dedicated commit, move review screenshots to a verified workspace archive, and document multi-learner boundaries without changing accounts or enabling child switching.
5. Run the combined automated gate and prepare the single manual acceptance walkthrough. Publish through normal PRs only after applicable release/cutover approval; never modify hosting or branch protections.

## Storage contract decisions

The implementation will use SHA-256-addressed immutable JSON tree nodes. Bounded leaves and fan-out keep a reference constant-sized as history grows. Current documents retain active/paused snapshots inline; completed evidence, finished runs, prior estimates and question exclusion history are restored from verified roots before learning decisions are made. A missing page is an error, never empty history.

Installation does not advertise capability automatically. V1 pending requests drain with their original request IDs and payloads; V2 is selected only for newly created requests after capability verification. Financial requests keep the existing receipt contract. Old clients must never read a partial projection or overwrite an archived generation. Unknown fields and existing history are retained, not trimmed or regenerated.

History references do not authorise access: the server derives the learner from the existing authenticated family role and enforces its game epoch. No client-supplied learner selector is accepted. Multi-learner support is design only in this phase.
