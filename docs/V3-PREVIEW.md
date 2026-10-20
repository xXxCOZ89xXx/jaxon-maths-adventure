# V3 Test Camp preview

Open `http://localhost:4173/v3-adventure.html` after running:

```sh
python3 -m http.server 4173 --bind 127.0.0.1
```

Run the command from the repository root or the extracted preview folder. No install, login, PIN or Supabase setup is needed to play. Use a modern browser with Web Locks support (current Safari, Chrome, Edge or Firefox). Allow local device storage to retain progress. For reliable concurrent-tab saves, use localhost or an HTTPS preview origin.

This is a fictional offline test explorer. The app has no cloud adapter; its Content Security Policy blocks all network connections from script. It loads local scripts and SVG artwork only. Storage uses `jaxon_v3_fictional_demo_2026` and never reads V2/production keys. The original homepage and V2 test page are unchanged.

The demo parent summary shows the same fictional explorer's activity. It is not an authenticated parent portal and has no reward-award or account-management actions. Existing secure family authentication and server-side parent rewards remain in the V2 build. Real cloud integration requires a separate staging project before any release.

## One consolidated acceptance session (20–30 minutes)

Use a fresh browser profile or private window. All test data is fictional and can be discarded by clearing only this preview origin's Test Camp storage. No real credentials are required.

1. **Home and tour (2 min):** choose Show me around or Skip. Confirm the three main choices are clear. Return home and use Continue adventure.
2. **Number Forest (5 min):** meet Rowan, start building, try a wrong number, Hint and I don't know. Place the marker on 2, restore the bridge, then begin puzzle two. Save & exit, reload and Continue; confirm the exact puzzle and marker remain. Finish all three puzzles and inspect before/restored views.
3. **Worlds (4 min):** choose a world freely from all eight. Try fraction channels, tower rotation or the measurement rail. Confirm wrong answers remain safe, and restoration remains visible after reloading.
4. **Learning evidence (5 min):** open a maths mission. Optionally Find my starting point. Complete supported practice with help, then try the separate independent check. Verify practice alone never says Mastered. A failed check requests reteaching; a successful check schedules a delayed memory check.
5. **Explorer and camp (4 min):** visit Base Camp. Confirm milestone upgrades and achievements. Browse all 40 wardrobe items. Spend fictional learning coins when affordable; equip/unequip an item and check that it appears in the header, map, camp and quest. Coins accrue from active learning, not navigation clicks.
6. **Comfort and summary (3 min):** toggle gentle motion and quiet sound. Test tapping and keyboard controls in portrait and landscape. Open Demo parent summary: inspect active time, 60-minute weekly target, 1:1 screen-time, recent activity and independent evidence.

Collect feedback once: navigation clarity, maths explanation, puzzle usability, visual appeal, save/resume, readability on iPad, and any unexpected behaviour. Include the world/puzzle and browser for a defect. Do not use the live learner account for this session.

## Developer verification

```sh
npm ci --cache /tmp/jaxon-npm-cache
npm test
npm run test:e2e
```

Browser tests use the system Chromium at `/usr/bin/chromium`, separate clean browser contexts and a fail-closed nonlocal network route. The server runs on port 4173. Edit the test launch configuration if Chromium has another local installation path. Screenshots and the machine-readable browser report are in `tests/artifacts/`.
