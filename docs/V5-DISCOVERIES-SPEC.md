# Optional world discoveries — future specification only

This is a future feature brief, not implemented gameplay. Secrets mean hidden passages, characters and surprising discoveries, not literal Easter eggs. They remain separate from maths, academic mastery, estate milestones, weekly targets and screen-time rewards.

| Stable discovery ID | World | Optional discovery concept |
| --- | --- | --- |
| secret:number:lantern-door | Number Forest | A lantern pattern reveals a tiny woodland archive |
| secret:fractions:buried-mosaic | Fraction Desert | A restored channel uncovers a forgotten mosaic |
| secret:algebra:echo-cabin | Algebra Peaks | A railway whistle leads to an unusual mountain visitor |
| secret:geometry:turning-library | Geometry Kingdom | A rotating wall reveals a quiet map library |
| secret:ratio:tide-cave | Ratio Island | A harbour trail leads to a hidden tide cave |
| secret:statistics:rooftop-garden | Statistics City | A neighbourhood notice reveals a rooftop garden |
| secret:probability:sideways-portal | Probability Portal | An unexpected portal opens a harmless secret room |
| secret:measure:crystal-workbench | Measurement Mines | An old ruler points towards a crystal craft bench |
| secret:town:festival-cellar | Practical Maths Town | A shopkeeper tells the story of a hidden festival cellar |

Proposed additive state: `adventure.discoveriesV1 = {version:1, found:{[id]:{foundAt, hintLevel}}, hints:{[id]:level}}`. IDs come from a validated catalogue. Unknown historical IDs are retained but do not grant progress. First discovery adds a journal collectible once; rediscovery never changes coins, minutes, screen time, academic mastery or estate counts. Do not add secret IDs to `s.milestones`.

Each discovery needs a visible keyboard/screen-reader alternative such as an optional “Inspect surroundings” list. Avoid tiny pixel hunting, sound-only clues, colour-only hints, time limits or reaction tests. Optional hints progress from region to landmark to direct instruction; taking hints has no penalty. Reduced motion reveals the same content without transitions.

Future implementation tests must cover deduplicated discovery, refresh/resume, catalogue/version validation, retained unknown history, no reward-farming, all nine accessible alternatives, hints, sound-off and reduced motion. Add no real-data telemetry or production writes. Build and review separately after the current learning and connected-journey work.
