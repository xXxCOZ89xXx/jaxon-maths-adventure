// Summarise completed local fictional checks. Refuse incomplete/failed browser runs.
const fs=require('node:fs'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const read=f=>fs.readFileSync(f,'utf8'),json=f=>JSON.parse(read(f));
function browser(file,count){const r=json(file);assert.equal(r.stats.expected,count,file);assert.equal(r.stats.unexpected,0,file);assert.equal(r.stats.skipped,0,file);assert.equal(r.stats.flaky,0,file);return {passed:count,failed:0,skipped:0,flaky:0,seconds:Number((r.stats.duration/1000).toFixed(1))};}
const recoveryReport=['tests/artifacts/save-recovery-browser.json','work/save-recovery-final.json'].filter(file=>fs.existsSync(file)).sort((a,b)=>Date.parse(json(b).stats.startTime)-Date.parse(json(a).stats.startTime))[0];
const curriculum=browser('work/curriculum-browser.json',81),quality=browser('work/gameplay-quality-browser.json',46),recovery=browser(recoveryReport,14);
assert(read('work/legacy-tests.log').includes('PASS V5.1 input audit: 1107'));
assert(read('work/curriculum-tests.log').includes('PASS: 12 curriculum suites; 2988 task completions'));
assert(read('work/depth-tests.log').includes('10800 generated questions'));
assert(/\n\s*14 passed \(/.test(read('work/ipad-release.log')));
const coverage=json('docs/CURRICULUM-COVERAGE.json');
const sources=['v3-adventure.html','v3/app.js','v3/adventure.js','v3/adventure-ui.js','v3/engine.js','v3/curriculum-expansion.js','v3/curriculum-activities.js','v3/curriculum-map.js','v3/curriculum-objectives.json','v3/hands-on.js','v3/style.css'];
const result={date:'2026-10-23',branch:'codex/years6-9-curriculum',base:coverage.release,scope:'Local fictional fixtures; browser contexts deny external origins. PostgreSQL containers use network=none. No production connection, account changes, release PR, merge or deployment.',coverage:{worlds:coverage.worldCount,skills:coverage.skillCount,addedSkills:coverage.addedSkillCount,missionLevels:coverage.missionLevelCount,objectiveGroups:coverage.objectiveCount,linkedPlayableGroups:coverage.playable,questionExamples:coverage.questionExamples.length},checks:[
 {command:'npm test',result:'PASS: legacy learning/discovery/economy, engine, missions, camp, hands-on, cloud transport, presentation, migration rehearsal and 1,107 renderer variants.'},
 {command:'npm run test:curriculum',result:'PASS: 12 suites; 2,988 completed mini-tasks, all 222 mission levels, objective/question/key links, fresh mastery, guided-example exclusion, independent adaptive topics, saved snapshots and save-size budget.'},
 {command:'node tests/education-depth.cjs',result:'PASS: 10,800 generated questions, fresh rounds in 50 existing banks, arithmetic oracles and historical units.'},
 {command:'npx playwright test -c playwright.curriculum.config.cjs --workers=2',result:'PASS: 81 cases across 820×1180, 1180×820 and 390×844, including 15 activity accessibility scans, interactions, pause/reload, alternate cube nets and cross-tab stale-edit protection.',browser:curriculum},
 {command:'npx playwright test -c playwright.quality.config.cjs --workers=2',result:'PASS: 46 legacy touch cases, eight original maths models, cooking/shopping/travel/worker journeys, historical Town snapshots, parent roles and offline queues.',browser:quality},
 {command:'npm run test:ipad-release',result:'PASS: local compact-receipt database integration, idempotent purchases, batching/recovery/role guards and all 14 browser cases.',browser:recovery}],
 viewports:[{width:820,height:1180,touch:true,browser:'Chromium'},{width:1180,height:820,touch:true,browser:'Chromium'},{width:390,height:844,touch:true,browser:'Chromium'}],
 remaining:['Physical iPad Safari visual/touch acceptance.','Learner-paced confirmation of estimated 5–10-minute inner missions and 20-minute world-end challenges.','Parent/educator acceptance of the proposed annual KS3 progression and teaching depth.','Long-term progress retains the existing 2,000,000-byte storage limit; no history or pending queues are truncated.'],
 sourceSha256:Object.fromEntries(sources.map(file=>[file,crypto.createHash('sha256').update(read(file)).digest('hex')]))};
fs.writeFileSync('docs/CURRICULUM-VALIDATION.json',JSON.stringify(result,null,2)+'\n');
console.log('Verified final evidence: 12 logic suites, 81 curriculum browser cases, 46 legacy touch cases and 14 save/recovery cases.');
