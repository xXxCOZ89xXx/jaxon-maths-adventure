# Town plan safety — M7

18 November 2026. Validation now separates the Town book's container from the selected plan. An unrelated damaged/future-format run or counter no longer hides a healthy run. Selecting the damaged plan still refuses it without rewriting its bytes, creating a replacement or changing which plan is active. Original recipe runs use the same isolation.

Continue computes cash, time, inventory, shopping lists, savings, envelopes, receipts, branch replacement and completion in a candidate copy. It validates the complete candidate before applying it. Missing/malformed branches and invalid effects cannot partly apply a receipt or debit. A refused step explains what prevented continuing and offers another Town plan; an unreadable saved plan also has a direct route back to the Town chooser. Existing snapshot formats, fractional ingredient quantities, legacy journeys, rewards and mastery semantics are preserved.

Validation: 2,235 Town stages, 594 navigation tasks, 741 recipe stages and skipped-milestone compatibility checks passed. New tests prove independent corrupt-plan/counter handling and atomic refusal for missing/malformed branches, cash, time, stock and invalid effects. Two intercepted/offline iPad-layout browser cases passed. Full combined Phase 2 checks are recorded in the PR. Physical iPad Safari remains untested; no learner or hosted service was used.
