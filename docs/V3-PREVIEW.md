# Nine-world V3 Test Camp

Current owner-private HTTPS staging: https://jaxon-maths-v3-private-staging.orion-shared-7254.chatgpt.site . Sign in with the owning ChatGPT account, then a fictional staging account. The owner has completed the separate database setup. See [activation status and one combined family/iPad session](V3-STAGING-ACTIVATION.md); live Auth/RLS acceptance is unverified because the Cloud proxy blocks the staging host. The local/offline preview below remains separate.

This is a playable fictional **offline development build**, continuing draft PR #2. It includes Practical Maths Town now; Town is not backlogged.

Run from the repository root or extracted preview folder:

```sh
python3 -m http.server 4173 --bind 127.0.0.1
```

Open `http://localhost:4173/v3-adventure.html`. No installation, login, PIN or Supabase configuration is needed to play. Use a current browser with Web Locks support and device storage enabled. Existing V3 Test Camp saves continue to work. The app never reads the live game's storage keys or real learner history.

The nine worlds are freely selectable. Each original world retains its introductory restoration quest and now has three expedition routes across three difficulty levels, plus optional gateways. Practical Maths Town has eight explorable locations and three levels. Every task teaches the idea and gives an easier example before its hands-on controls. Completed visits return with different generated values, while XP and keepsakes remain finite.

The 55-skill curriculum includes the original 39 skills and 16 new everyday skills. Guided missions, practice and academic mastery stay separate. Expand **Maths lessons and independent checks** in Town to see its curriculum; the town tasks themselves teach their own skills as you play.

## One consolidated acceptance session (25–30 minutes)

Use a fresh browser profile/private window with fictional data. Do not use real family credentials, backups, bank details or bills. All prices, balances, jobs and payslips are fictional.

1. **Home and map (2 min):** skip/replay the tour, open Worlds and confirm all nine worlds are available. Enter Practical Maths Town.
2. **Supermarket (5 min):** tap the market building. Read the lesson/easier example, pack the shopping list, compare apple packs, then return exact change using UK denomination tokens. Try a wrong plan and I don't know; adjust the same task without punishment.
3. **Save and difficulty (3 min):** start another venue at any level. Make a selection, take a hint, Save & exit and reload. Continue must restore that exact task and help state. Visit another world and return; the unfinished visit should remain. Level suggestions are optional.
4. **Practical independence (6 min):** choose two other locations. Suggested pairs: Station + Home (timetable, walking allowance, 24-hour clock, meter bill) or Bank + Workplace (deposit/withdrawal ledger, savings, paid hours, net pay). Fictional exercise money must never alter learning coins or any real account.
5. **Return adventures (4 min):** revisit Number Forest or another restored world and choose an expedition or optional gateway. Try place-value supplies, coordinate lifts, courtyard tiles or scaled quantities. Observe extra settlement scenery and earned keepsakes. Replaying should not duplicate completion XP.
6. **Camp and explorer (4 min):** view the keepsake journal, place an earned keepsake at the shelf/garden/gate and reload. Check project requirements and build an available project. Browse all 40 wardrobe items, equip an owned item and inspect the character across screens.
7. **Learning and comfort (3 min):** open a Town lesson, practise with support and inspect the separate fresh-check entry. Assisted work must not say Mastered. Check sound/reduced-motion options, keyboard focus, portrait/landscape readability and Demo parent summary. The weekly goal remains 60 active minutes, with 1:1 screen-time conversion.

Collect feedback once: navigation, explanations, practical usefulness, task controls, save/resume, difficulty, visual clarity and iPad comfort. For a bug, record the venue/world, level, task, browser and what happened.

## Isolation and limits

This build has no V3 cloud adapter or real account login. CSP blocks script connections (`connect-src 'none'`); scripts, styles and original SVG art load locally. Storage uses `jaxon_v3_fictional_demo_2026`. The original homepage, V2 game, secure adapter and Supabase files are unchanged.

The parent summary shows this fictional explorer and has no privileged reward/account actions. Device data can be discarded by clearing only the preview's Test Camp storage. An already-loaded game works without network, but a cold offline launch is not cached by a service worker.

Physical iPad Safari is still needed: WebKit installation was blocked by the managed network policy. Real cloud login/PIN, sync, family isolation and server rewards require a **separate staging Supabase project** before release. Nothing is merged or deployed by running this preview.

## Developer checks

```sh
npm ci --cache /tmp/jaxon-npm-cache
npm test
npm run test:e2e
```

Browser tests use `/usr/bin/chromium`, clean contexts, synthetic fixtures and fail-closed nonlocal request blocking. Set `V3_CHROMIUM_EXECUTABLE` for another local installation. CI uses Playwright’s installed Chromium. Reports and screenshots are under `tests/artifacts/`.

## Secure-integration continuation: easier download

The Actions workflow now builds a separate **`v3-offline-playable-preview`** artifact containing `PLAY-V3.html` and a README. Download it from the successful PR #2 Actions run, extract the ZIP and open the HTML in a normal desktop browser. Everything needed is embedded; `connect-src 'none'` still prohibits cloud traffic. Managed Chromium in this workspace blocks `file://` navigation by administrator policy, so automated QA loads that same single HTML over localhost and verifies it needs no additional assets or cloud requests. Actual local-file opening remains a manual/browser-policy check. On iPad, Files may display a document preview rather than execute the game; use a browser/local-server method if necessary.

No production hosting settings were changed. A public hosted preview would require a separate hosting target; the Actions download works without selecting one. The separate staging app is built only with explicit environment configuration and is never included in the offline artifact. See `V3-SECURE-STAGING.md` for the combined acceptance session, secure setup and remaining release gates; that walkthrough supersedes the earlier offline-only acceptance session.

Latest verified build: [download the offline playable preview](https://github.com/xXxCOZ89xXx/jaxon-maths-adventure/actions/runs/39385393158/artifacts/12247702744) from [the green 88-case Chromium/WebKit run](https://github.com/xXxCOZ89xXx/jaxon-maths-adventure/actions/runs/39385393158). Extract the artifact and open `PLAY-V3.html`; actual local-file execution remains subject to browser/device policy as described above. Artifacts are retained for 30 days and can be rebuilt with `npm run build:preview`.
