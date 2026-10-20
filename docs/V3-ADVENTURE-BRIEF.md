# Jaxon's Maths Adventure — V3 Complete Build Brief
Status: **Approved design direction, not yet implemented**. Source of truth for the autonomous Codex redesign. Date: 20 October 2026.

## Outcome, not another quiz bank
Transform the existing free, iPad-friendly maths browser game into an original, **voxel-inspired 2D/isometric adventure**. The maths engine remains, but the dominant experience is to explore, solve interactive problems, earn progress and **visibly change the world**. Prioritise engagement, understandable navigation and real teaching over continually adding question counts.

Audience: early teens. Visual direction: green highlights, crafted block/voxel aesthetic, readable text and friendly characters; avoid babyish art, excessive confetti, stock Minecraft textures or copied game assets. Performance should be good on a typical iPad, with mouse/keyboard support for parent testing.

## Existing baseline — preserve and reuse
- 8 worlds: Number Forest, Fraction Desert, Algebra Peaks, Geometry Kingdom, Ratio Island, Statistics City, Probability Portal, Measurement Mines.
- 39 maths topics, 780 discovery questions, 10 interactive visual maths tools, guided scaffold lessons, adaptive fresh practice, separate independent checks and delayed memory checks.
- Current learner and parent separation with Supabase; progress synced through the secure cloud adapter, 4-digit learner device PIN, 6-digit parent PIN. Preserve existing user data and handle older saved records gracefully.
- Parent dashboard, world map, 40-avatar-item shop, earning coins from genuinely active learning, parent bonus coins handled by server-side rewards.
- **60-minute weekly learning goal; screen-time conversion 1:1**. Do not change these.
- Jaxon may choose any world/mission; recommendations are optional. No punitive mechanics or enforced linear unlocking of mathematical subjects.
- Existing test page `v2-game-test.html` on `main` stays untouched; live `index.html` stays untouched.
- Keep planned future ninth **Practical Maths Town** (money, time, bills, shopping, travel) in a backlog until this redesign is playable and tested.

## Product experience

### A. Three-choice home dashboard
Make the first screen immediately understandable:
1. **Continue adventure**: resume exact task/scene; one dominant call to action.
2. **Explore worlds**: choose from eight illustrated locations; show progress and optionally recommended next step.
3. **My explorer / Base Camp**: personalised avatar, home/base build, shop, achievements.

Weekly progress is compact, optional suggested practice does not overwhelm. Avoid exposing dozens of buttons at once or displaying detailed assessment analytics on the main learner screen. Give a quick onboarding tour only on first play; include Skip and Replay Tour.

### B. Adventure map and world restoration
Create an illustrated, touch-friendly map with all 8 themed worlds and clear current location.
Each world begins with an illustrative problem and **changes visibly as the learner progresses**, e.g.:
- Number Forest: repair bridges, revive trees and restore a workshop.
- Fraction Desert: open irrigation channels, fill an oasis and rebuild a temple approach.
- Algebra Peaks: power elevators, reconnect generators and open a mountain gateway.
- Geometry Kingdom: rebuild castle structures and towers.
- Ratio Island: restore supply routes and a harbour.
- Statistics City: illuminate neighbourhoods and rebuild a data observatory.
- Probability Portal: stabilise magical portals and open paths.
- Measurement Mines: restore mine carts, lights and mechanical lifts.

Restoration is deterministic from learning evidence, saved persistently, and fully viewable without repeated clicks. Show before/after states and a subtle celebration for milestones. Allow free world choice even if the story depicts new areas.

### C. One complete quest loop — Number Forest first
Implement one deeply polished, repeatable quest for Number Forest before generalising to all worlds:
1. Enter scene (brief context; optional skip).
2. Meet a friendly guide/NPC who explains a simple goal: e.g. bridge is missing three blocks.
3. Introduce skill with interactive demonstration and an easier example.
4. Solve 2–4 reusable maths-powered **puzzles** (touch/drag/tap; keyboard alternative) using the existing skill concept. Include non-punitive hints and an "I don't know" route.
5. Visibly restore one part of the world; update progress and award appropriate earned rewards only once.
6. Display a short recap, a next-step option and Save & Exit.
7. Offer a distinct fresh independent check only when appropriate; do not mark assisted work as mastered.

Game puzzles should **use maths as the interaction**, rather than adding decorative animations around quiz buttons. Start with block placement/number matching, choosing fraction parts, positioning on number lines and rotating shapes; generalise a common puzzle renderer. Reuse existing maths generators and preserve uniqueness guards.

### D. Other seven worlds
Reuse the engine and adapt puzzle skins, illustrated scenes and completion states to each world, with at least one characteristic visual interaction per world. Implement themed boss/gateway puzzles only after core quests work; bosses are optional cumulative puzzles, not stressful time-limited exams. Bosses do not award academic mastery unless independent evidence supports it.

### E. Explorer avatar and base camp
Display a consistent explorer character on the home/map/camp/quest screens and show owned/equipped cosmetics from the existing 40-item shop. Use original layered SVG/CSS sprites and avoid altering ownership records. Clear character preview, equip/unequip controls and sensible touchscreen hit targets.

Create an initially simple **Base Camp** that can gain cosmetic improvements through exploration/missions: tent, lanterns, path, workshop, garden, companion area. Unlocking must be tied to meaningful **saved learning milestones**, not rapid tapping; restoration rewards can be cosmetic and need not charge coins. Never take away already-earned items due to subsequent struggle. Keep camp progression additive and migration-safe.

### F. Engagement and rewards
Optional explorer XP/levels, progress bars, collected artefacts and achievement celebration. Derive XP from durable learning evidence or one-time milestone identifiers; prevent infinite XP and coin farming from repeated easy interactions or refreshing. Existing reward settings remain unchanged. Keep native 1:1 screen-time tracking separate from cosmetics and in-game XP. No speed pressure, shame, daily punishment, leaderboards or false urgency.

### G. Accessibility and usability
- Single-purpose screens; large, readable text; minimum ~44x44 CSS px touch targets.
- Tap-first interactions; drag alternatives via buttons/keyboard. Maintain logical focus and accessible names.
- Short copy and step-based instructions; hints are optional, and incorrect answers trigger teaching, not a reprimand.
- Sound and animation **off/on preferences** with reasonable defaults; honour `prefers-reduced-motion`; never autoplay loud audio.
- Reliable landscape and portrait iPad viewports, usable on desktop.
- Fast load, local-first game interactions, asset caching where safe, no repeated sign-ins as part of normal play.
- All state safely serialisable for existing cloud progress; define versioned migration for any new fields.

### H. Parent experience
Preserve existing secure parent authentication and parent-only reward actions. Provide a concise dashboard: weekly active time, earned screen-time, skills needing reinforcement, independently proven/mastered skills, recent genuine activity. Keep story progress separate from independent mastery.

## Build sequence (keep going without repeated user approvals)
1. Baseline: run existing tests; inspect saved schema and existing code before changing. Add tests for the new feature flags/state, migrate safely, keep current game functional.
2. Visual architecture: design tokens; reusable world scene and layered avatar assets; responsive three-choice home; navigation/onboarding.
3. Number Forest complete quest loop and visible restoration; teach/practice/independent-check separation; robust persistence.
4. Generalise to 7 remaining worlds. Add optional boss puzzles, celebrations and map transitions.
5. Base Camp, explorer progression, upgraded avatar shop preview; retain 40 items and real learner balances.
6. Accessibility, sensory options, polish and load performance.
7. Automated end-to-end QA, dedicated mock/staging environment, security/access checks, regression fixes.
8. Produce final preview URL (or local shareable build), release notes, and draft PR. Do **not** merge to main or touch production data without explicit user approval.

## Acceptance criteria
- Distinct game-like quest loop with at least one interactive maths puzzle per world, not only conventional multiple-choice cards.
- 8 worlds visibly transform from progression; state persists across reload and isolated test accounts.
- Complete Number Forest playthrough works on iPad-sized touch emulation, then all remaining worlds covered.
- Character outfit reflects equipped shop items across all scenes. Base Camp unlocks from durable milestone identifiers.
- Old V2 progress loads without data loss. Learner and parent roles remain separated. Original data untouched.
- Can save halfway through a quest and return to exact progress.
- Correct independent/review results can affect mastery; guided answers and scene clicks cannot.
- No duplicate rewards on retries, refreshes or concurrent sessions; no new unapproved production database writes.
- Main navigation understandable in seconds, clear focus/touch interaction, motion/sound controls.
- Offline unit/integration checks plus staged Playwright e2e in desktop and simulated iPad; report passes, gaps and limitations.
- One concise user acceptance session at the end, not repeated incremental sign-off.

## Delivery notes
Work as far as the available tool and usage limits allow. If Codex pauses or hits a capacity limit, leave branch commits, tests, concise NEXT_STEPS note and a draft PR instead of requiring the user to reconstruct context. Do not promise unattended unlimited/background work outside an active Codex task.
