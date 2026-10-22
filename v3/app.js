(function () {
  "use strict";
  const M = window.V3Adventure,
    U = window.V3AdventureUI,
    T = window.V3Town;
  const E = window.V3Engine,
    C = window.V3Curriculum,
    A = window.V3Art,
    $ = (id) => document.getElementById(id),
    esc = A.esc;
  const cloud = window.V3CloudContext;
  const KEY = cloud?.key || "jaxon_v3_fictional_demo_2026",
    LOCK = KEY + ":transaction";
  let storageError = false,
    pendingSaves = 0;
  function read() {
    try {
      return E.migrate(JSON.parse(localStorage.getItem(KEY)) || {});
    } catch (error) {
      storageError = error instanceof SyntaxError ? "corrupt" : "unavailable";
      return E.fresh();
    }
  }
  let s = read(),
    filter = "all",
    campPreview = null,
    venueExterior = false,
    before = false,
    activity = 0,
    lastTick = Date.now();
  function status(message) {
    $("status").textContent = message;
  }
  function persist() {
    if (storageError === "corrupt") {
      status(
        "Saved Test Camp data could not be read. This session is temporary; the saved copy has been preserved.",
      );
      return;
    }
    if (cloud) cloud.applyWallet(s);
    s.revision++;
    try {
      cloud?.onSave(s);
      localStorage.setItem(KEY, JSON.stringify(s));
      storageError = false;
      status(
        cloud
          ? "Saved on this device · waiting for staging sync"
          : "Saved on this device · offline demo",
      );
    } catch {
      storageError = true;
      status(
        "Device storage unavailable. Keep this tab open; progress is not saved.",
      );
    }
  }
  async function change(fn, { focus = false, renderPage = true } = {}) {
    if (cloud && !cloud.isUnlocked()) return;
    pendingSaves++;
    document.documentElement.setAttribute("data-saving", "");
    const transact = () => {
      if (!storageError) s = read();
      const priorView = s.view,
        focused = document.activeElement,
        kind = ["action", "act", "setting", "missionTier", "campSlot"].find(
          (key) => focused?.dataset?.[key],
        ),
        token = kind ? focused.dataset[kind] : null;
      fn();
      persist();
      if (renderPage) {
        render(focus);
        if (!focus && priorView === s.view && kind && token) {
          const target = [
            ...document.querySelectorAll(
              "[data-action],[data-act],[data-setting],[data-mission-tier],[data-camp-slot]",
            ),
          ].find(
            (el) =>
              el.dataset[kind] === token &&
              !el.disabled &&
              !el.closest("[inert]"),
          );
          target?.focus({ preventScroll: true });
        }
      }
    };
    try {
      if (navigator.locks) await navigator.locks.request(LOCK, transact);
      else {
        transact();
        status(
          "Please use one Test Camp tab: this browser cannot coordinate saves across tabs.",
        );
      }
    } finally {
      pendingSaves--;
      if (!pendingSaves)
        document.documentElement.removeAttribute("data-saving");
    }
  }
  const btn = (label, action, cls = "", disabled = false) =>
    `<button data-action="${esc(action)}" class="${cls}" ${disabled ? "disabled" : ""}>${label}</button>`;
  const bar = (n, max) =>
    `<div class="bar" role="progressbar" aria-label="Restoration progress" aria-valuemin="0" aria-valuemax="${max}" aria-valuenow="${Math.min(max, n)}"><span style="width:${Math.min(100, (n / max) * 100)}%"></span></div>`;
  const world = () => E.worlds.find((w) => w.id === s.world) || E.worlds[0];
  const skill = (id) => C.skills.find((k) => k.id === id);
  const art = (id, level = E.count(s, id)) =>
    `<div class="hero-art">${A.scene(id, M.visualLevel(s, id, level), before, M.completions(s, id).length)}</div>`;
  function header(eyebrow, title, back = "map") {
    return `<div class="section-head"><div><div class="eyebrow">${eyebrow}</div><h1>${title}</h1></div>${btn("← Back", "nav:" + back)}</div>`;
  }
  function home() {
    const w = world(),
      minutes = s.weekly[E.weekKey(Date.now())] || 0;
    return `<section class="hero"><div class="hero-copy"><div class="eyebrow">YOUR NEXT CHAPTER IS WAITING</div><h1>A little maths.<br>A big adventure.</h1><p class="muted">Build bridges. Bring worlds back to life.<br>See what your next idea can do.</p>${btn('Continue adventure <span class="arrow" aria-hidden="true">→</span>', "continue", "primary")}<p class="small muted" style="margin-top:14px">${M.current(s) ? "Resume your saved visit" : s.quest ? "Resume your saved quest" : s.learning ? "Resume your saved lesson" : w.name + " · " + w.tag}</p></div><div class="hero-art">${A.scene(w.id, M.visualLevel(s, w.id, E.count(s, w.id)), false, M.completions(s, w.id).length)}<span class="scene-caption">${esc(w.name.toUpperCase())}</span><div class="scene-bottom"><span>CHAPTER ${E.worlds.indexOf(w) + 1} / 09</span><span>${M.visualLevel(s, w.id, E.count(s, w.id))} / 3 restored</span></div></div></section><div class="eyebrow path-label">CHOOSE YOUR PATH</div><section class="choices" aria-label="Adventure choices"><article class="choice"><span class="tile-icon" aria-hidden="true">${A.icon("medal")}</span><h3>Continue adventure</h3><p class="muted">Pick up your saved trail. Your next idea can change this world.</p>${btn('Let’s go <span aria-hidden="true">→</span>', "continue", "wide")}</article><article class="choice"><span class="tile-icon" aria-hidden="true">${A.icon("forestbg")}</span><h3>Explore worlds</h3><p class="muted">Nine places to discover. Choose your own route through the adventure.</p>${btn('Open the map <span aria-hidden="true">→</span>', "nav:map", "wide")}</article><article class="choice"><span class="tile-icon" aria-hidden="true">${A.icon("rucksack")}</span><h3>My explorer & camp</h3><p class="muted">Make yourself at home. Find your look and watch your camp grow.</p>${btn('Visit Base Camp <span aria-hidden="true">→</span>', "nav:camp", "wide")}</article></section><section class="week" aria-label="Weekly learning"><span><strong>Your week</strong> <span class="small muted">${minutes.toFixed(1)} / 60 active minutes</span></span>${bar(minutes, 60)}<span class="small muted">${cloud ? window.V3Presentation.minutes(cloud.screenTime()) : minutes.toFixed(1)} minutes screen-time ${cloud ? "available" : "earned"} · 1:1</span></section>${U.suggestion(s)}${!s.tourSeen ? `<div class="notice small">New to Test Camp? Take a quick look around. <div class="actions">${btn("Show me around", "nav:tour")}${btn("Skip tour", "skip-tour")}</div></div>` : ""}`;
  }
  function map() {
    return `${header("THE ADVENTURE ATLAS", "Where will you go?", "home")}<div class="toolbar"><p class="muted">Every world is open. Follow your curiosity.</p>${A.explorer(s, true)}<span class="badge">${s.milestones.length} learning milestones</span></div><div class="world-grid">${E.worlds.map((w, i) => `<article class="world-card">${A.scene(w.id, M.visualLevel(s, w.id, E.count(s, w.id)), false, M.completions(s, w.id).length)}<div class="body"><div class="eyebrow">0${i + 1} · ${s.world === w.id ? "YOU ARE HERE" : "OPEN TO EXPLORE"}</div><h2>${w.name}</h2><p class="muted">${w.tag} · ${M.visualLevel(s, w.id, E.count(s, w.id))}/3 restored · ${M.completions(s, w.id).length} expeditions</p>${bar(M.visualLevel(s, w.id, E.count(s, w.id)), 3)}${btn("Explore " + w.name, "world:" + w.id)}</div></article>`).join("")}</div>`;
  }
  function worldPage() {
    const w = world(),
      n = M.visualLevel(s, w.id, E.count(s, w.id));
    return `${header("WORLD " + (E.worlds.indexOf(w) + 1) + " / 09", w.name)}<div class="split world-overview"><div><div class="world-route-map">${art(w.id)}${w.id !== "town" ? `<nav class="world-route-pins" aria-label="Explore ${esc(w.name)} landmarks">${M.routes(w.id).map((r,i)=>`<button data-action="scene-mission:${w.id}:${r.id}:${M.state(s).difficulty[w.id] || M.recommendation(s,w.id)}" style="left:${[39,62,49][i]}%;top:${[53,64,35][i]}%" aria-label="Visit ${esc(r.name)}"><span aria-hidden="true">${i+1}</span><span class="route-label">${esc(r.name)}</span></button>`).join("")}</nav>` : ""}</div><div class="actions">${btn(before ? "Show restored world" : "View before restoration", "before")}${w.id === "town" ? btn("Visit the supermarket →", "mission:town:market:1", "primary") : btn("Meet " + w.guide + " →", "quest:" + w.id, "primary")}</div></div><section class="panel"><span class="badge">${n}/3 LANDMARKS RESTORED</span><h2 style="margin-top:20px">${w.tag}</h2><p class="muted">${w.goal}</p><ul class="landmark-list">${w.stages.map((name, i) => `<li class="${n > i ? "done" : ""}"><span aria-hidden="true">${n > i ? "◆" : "◇"}</span>${name}</li>`).join("")}</ul><p class="small muted">Story restoration grows from solved puzzles. Independent mastery has its own fresh checks.</p>${A.explorer(s, true)}</section></div>${U.board(s, w)}${w.id === "town" ? '<details class="town-lessons"><summary>Maths lessons and independent checks · 16 skills</summary>' : ""}<h2 style="margin-top:38px">Choose a maths mission</h2><p class="muted">Explore a lesson, practise with support, then try a separate fresh check.</p><section class="skill-list">${C.skills
      .filter((k) => k.world === w.id)
      .map((k) => {
        const c = s.checks[k.id],
          old = s.skills[k.id];
        return `<article class="panel"><h3>${esc(k.name)}</h3><p class="small muted">${esc(k.description)}</p><span class="badge">${c?.stage >= 2 ? "SPACED MASTERY" : c?.stage === 1 ? "INDEPENDENTLY PRACTISED" : old?.state === "mastered" ? "EXISTING MASTERY" : "READY TO EXPLORE"}</span><div class="actions">${btn("Learn & practise", "learn:" + k.id)}${!s.discovery[k.id]?.complete ? btn("Find my starting point", "discover:" + k.id) : ""}${btn("Independent check", "check:" + k.id, "", !s.practice[k.id]?.completed || c?.reteach || c?.due > Date.now())}</div>${c?.due > Date.now() ? '<p class="small muted">Memory check due ' + esc(new Date(c.due).toLocaleDateString("en-GB", { timeZone: "Europe/London" })) + "</p>" : ""}${c?.reteach ? '<p class="small muted">Revisit the lesson before another check.</p>' : ""}</article>`;
      })
      .join("")}</section>${w.id === "town" ? "</details>" : ""}`;
  }
  function stepper(q, p, unit = "") {
    return `<div class="stepper">${btn("−", "adjust:-" + (p.step || 1), "", q.value <= (p.min || 0))}${window.V5HandsOn.numericInput({...p,unit:unit.trim()},q.value,q.amountDraft,"quest")}${btn("+", "adjust:" + (p.step || 1), "", q.value >= p.max)}</div>`;
  }
  function puzzle(q) {
    const p = E.puzzle(q.world, q.i);
    let ui = "";
    if (p.kind === "line")
      ui = `${A.worksite(q.world, "line", q.value, [], q.solved, p.min, p.max)}<p class="line-instruction">Move the explorer along the bridge · ${p.min} to ${p.max}</p><div class="numberline" role="group" aria-label="Bridge number line">${Array.from(
        { length: p.max - p.min + 1 },
        (_, i) => i + p.min,
      )
        .map(
          (v) =>
            `<button data-action="value:${v}" aria-pressed="${q.value === v}">${v}</button>`,
        )
        .join(
          "",
        )}</div><p class="small muted">All destinations are visible, in order. Tap a number, or tab to it and press Enter. Selected: ${q.value}</p>`;
    if (["fraction", "chance"].includes(p.kind))
      ui = `<div class="parts" role="group" aria-label="${p.kind === "fraction" ? "Water channels" : "Portal chance slots"}">${Array.from({ length: 4 }, (_, i) => `<button class="part" data-action="part:${i}" aria-label="${p.kind === "fraction" ? "Channel" : "Slot"} ${i + 1}" aria-pressed="${q.selected.includes(i)}">${p.kind === "fraction" ? "≈" : "◇"}</button>`).join("")}</div><p class="small muted">${q.selected.length} of 4 ${p.kind === "fraction" ? "channels open" : "slots green"}. Tap to toggle.</p>`;
    if (p.kind === "balance")
      ui = `<div class="puzzle-bars"><span style="height:${(q.value + q.i + 3) * 8}px">${q.value + q.i + 3}</span><span style="height:${(q.i + 8) * 8}px">${q.i + 8}</span></div>${stepper(q, p)}<p class="small muted">Adjust the battery value x until both sides balance.</p>`;
    if (p.kind === "rotate")
      ui = `<div class="rotate-area"><div><div class="shape" style="--turn:0deg" aria-hidden="true">⌜</div><p class="small">Start</p></div><div><div class="shape" style="--turn:${q.value}deg" aria-hidden="true">⌜</div><p class="small">Your piece: ${q.value}°</p></div></div><div class="actions">${btn("↻ Turn clockwise 90°", "rotate")}${btn("Reset rotation", "value:0")}</div>`;
    if (p.kind === "ratio")
      ui = `<p class="small">Green crates: ${p.green}</p><div class="token-row" aria-hidden="true">${'<span class="token"></span>'.repeat(p.green)}</div><p class="small">Blue crates: ${q.value}</p><div class="token-row" aria-hidden="true">${'<span class="token blue"></span>'.repeat(q.value)}</div>${stepper(q, p)}`;
    if (p.kind === "bars")
      ui = `<div class="puzzle-bars" role="img" aria-label="Left neighbourhood: ${p.values.join(" plus ")}. Right neighbourhood: two bars each ${q.value}.">${[...p.values, q.value, q.value].map((v, i) => `<span style="height:${v * 12}px;${i === 2 ? "margin-left:25px" : ""}">${v}</span>`).join("")}</div>${stepper(q, p)}<p class="small muted">Left: ${p.values.join(" + ")}. Adjust both right-hand bars together.</p>`;
    if (p.kind === "measure")
      ui = `<div class="ruler" aria-hidden="true">${[0, 100, 200, 300, 400, 500].map((v) => "<span>" + v + "</span>").join("")}</div><div style="height:14px;background:#72976c;width:${q.value / 5}%;max-width:100%"></div>${stepper(q, p, " cm")}`;
    return `<div class="puzzle"><div class="eyebrow">PUZZLE ${q.i + 1} / 3 · ${esc(E.worlds.find((w) => w.id === q.world).stages[q.i])}</div><h2>${esc(p.prompt)}</h2><div ${q.solved ? "inert" : ""}>${ui}</div></div>`;
  }
  function quest() {
    const q = s.quest,
      w = E.worlds.find((w) => w.id === q.world);
    return `${header("RESTORE THE WORLD", w.name, "world")}<div class="quest-layout world-stage stage-${w.id} ${q.solved ? "stage-restored" : ""}"><div class="stage-vista">${art(w.id).replace('viewBox="0 0 900 560"', 'viewBox="0 110 900 380" preserveAspectRatio="xMidYMid slice"')}<section class="panel guide">${A.guide(w.guide)}<div><h3>${w.guide}, your guide</h3><p>${q.intro ? esc(w.goal) : "Take your time. You can use a hint or ask me to work through it. Every idea helps."}</p></div></section><div class="toolbar" style="margin-top:18px">${A.explorer(s, true)}${btn("Save & exit", "nav:home")}</div></div><section class="panel stage-workbench">${q.intro ? `<span class="badge">A NEW CHAPTER</span><h2 style="margin-top:20px">${w.tag}</h2><p>We can restore this place with three small maths puzzles. Tap to build, move and explore.</p><p class="muted">Hints are always welcome. This is guided adventure, separate from independent checks.</p>${btn("Start building →", "begin", "primary")}` : puzzle(q) + `${q.solved ? `<div class="feedback" role="status">${esc(q.feedback)}<br><strong>${esc(w.stages[q.i])}</strong></div><div class="actions">${btn(q.i < 2 ? "Next puzzle →" : "Quest recap →", "next-quest", "primary")}</div>` : `<div class="actions">${btn("Try my solution", "solve", "primary")}${btn("Hint", "hint")}${btn("I don’t know", "skip")}</div>${q.feedback ? `<div class="feedback" role="status">${esc(q.feedback)}</div>` : ""}`}`}</section></div>`;
  }
  function learning() {
    const l = s.learning,
      k = skill(l.id),
      q = l.qs[l.i];
    if (s.view === "lesson") {
      const plan = window.JaxonTutor.plan(l.id, []);
      return `${header("LEARN AT YOUR OWN PACE", esc(k.name), "world")}<div class="split"><section class="panel"><h2>Build the idea</h2><p class="lesson-copy">${esc(k.lesson)}</p>${plan ? `<div class="feedback"><strong>${esc(plan.title || "An easier example")}</strong><p>${esc(plan.explain || "")}</p><p>${esc(plan.question || plan.prompt || "")}</p><p>${esc(plan.worked || plan.feedback || "")}</p></div>` : ""}<div class="actions">${btn("Try supported practice →", "practice", "primary")}${btn("Save & exit", "nav:home")}</div></section><div>${art(k.world)}<p class="small muted">Practice helps you learn. Only separate fresh independent checks can establish mastery.</p></div></div>`;
    }
    const handsOn=window.V5HandsOn.practiceRender(l,k);
    const tools =
      l.mode === "practice" && !["algebra_coordinates","geometry_transforms"].includes(k.id)
        ? (window.JaxonMathTools.render(k.id, k.world, {
            ...l,
            type: "mission",
            mode: "question",
          }) || "") +
          (window.JaxonMathToolsExtra.render(k.id, k.world, {
            ...l,
            type: "mission",
            mode: "question",
          }) || "").replace('<div class="math-extra-dots"','<div role="img" class="math-extra-dots"')
        : "";
    return `${header(l.mode === "check" ? "FRESH INDEPENDENT CHECK" : l.mode === "discovery" ? "FIND YOUR STARTING POINT" : "SUPPORTED PRACTICE", esc(k.name), "world")}<div class="split"><section class="panel"><span class="badge">QUESTION ${l.i + 1} / ${l.qs.length}</span><h2 style="margin-top:20px">${esc(q[0])}</h2>${handsOn}<div class="answer-grid">${q[2].map((a, i) => btn(esc(a), "answer:" + i, "", l.answered)).join("")}</div><div class="actions">${btn("Hint", "learning-hint", "", l.answered)}${btn("I don’t know", "learning-skip", "", l.answered)}${btn("Save & exit", "nav:home")}</div>${l.feedback ? `<div class="feedback" role="status">${esc(l.feedback)}</div>` : ""}${l.answered ? `<div class="actions">${btn(l.i === l.qs.length - 1 ? "See recap →" : "Next question →", "next-learning", "primary")}</div>` : ""}</section><aside><div class="panel"><h3>${l.mode === "check" ? "Your own thinking" : "Explore the idea"}</h3><p class="muted">${l.mode === "check" ? "Only the first answer without help counts as independent. Hints and “I don’t know” are always safe." : "Use the tools, take a hint, or work through an example. Practice never awards mastery."}</p>${A.explorer(s)}</div>${tools}</aside></div>`;
  }
  function townLife(j){
    const t=j.task,q={world:'town',route:j.venue,values:j.values,solved:j.solved};
    const controls=t?U.controls(q,t).replaceAll('data-action="m-','data-action="j-').replaceAll('data-action="h-','data-action="j-').replaceAll('mission-amount','journey-amount').replaceAll('mission-number-help','journey-number-help').replace('data-numeric-answer="mission"','data-numeric-answer="journey"').replace('data-mission-clock="true"','data-life-clock="true"'):'';
    return `${header(j.category+' · LEVEL '+j.tier,esc(j.name),'world')}<div class="journey-progress panel"><p>Stage ${Math.min(j.stage+1,j.steps.length)} / ${j.steps.length} · ${esc(j.context.role)} context · ${T.clock(j.time)} · pretend cash ${T.money(j.cash)} · savings plan ${T.money(j.savings)}</p><p>List: ${Object.entries(j.shoppingList).map(([k,v])=>esc(k)+' × '+v).join(' · ')||'No shopping needed yet'}</p><p>Inventory: ${Object.entries(j.inventory).map(([k,v])=>esc(k)+' × '+v).join(' · ')||'Nothing carried yet'}</p><details><summary>Receipts · ${j.receipts.length}</summary><ul>${j.receipts.map(r=>`<li>${esc(r.label)} · ${T.clock(r.time)} · paid ${T.money(r.spent)} · received ${T.money(r.earned)}${r.sale?' · customer sale '+T.money(r.sale):''}${r.saved?' · moved to savings '+T.money(r.saved):''}${Object.keys(r.items||{}).length?' · '+Object.entries(r.items).map(([k,v])=>esc(k)+' × '+v).join(', '):''}${r.choice?' · '+esc(r.choice):''}</li>`).join('')}</ul></details><p class="small">Fictional Town cash. Learning coins, mastery and parent rewards stay separate.</p></div><div class="quest-layout world-stage venue-${j.venue}"><aside class="stage-vista"><div class="hero-art">${A.location(j.venue,q)}</div><div class="panel">${A.guide('Ellis')}<p>${esc(j.context.objective)}</p></div></aside><section class="panel stage-workbench">${j.done?`<h2>Town plan complete.</h2><p>You finished ${esc(j.name)}. Your receipts and decisions are saved. Replay starts a fresh day with different values and keeps this completed day.</p><div class="actions">${btn('Try another day','j-replay:'+j.scenario,'primary')}${btn('Choose another Town plan','world:town')}</div>`:`<h2>${esc(j.title)}</h2><p class="town-task-prompt">${esc(t.prompt)}</p><p>${esc(t.teach)}</p><details><summary>An easier example</summary><p>${esc(t.example)}</p></details><div class="task-controls" ${j.solved?'inert':''}>${controls}</div>${j.feedback?`<p class="feedback" role="status">${esc(j.feedback)}</p>`:''}<div class="actions">${j.solved?btn(j.stage===j.steps.length-1?'Complete Town plan':'Continue plan','j-next','primary'):btn('Try my plan','j-submit','primary')}${btn('Hint','j-help')}${btn('I don’t know','j-skip')}${btn('Save & exit','nav:home')}${btn('Choose a different plan','world:town')}</div>`}</section></div>`;
  }
  function journey(){
    const J=window.V5Journey,j=J.model(s);if(!j)return `<section class="panel"><h1>This journey needs another look.</h1><p>The saved copy has been preserved. Other learning remains available.</p>${btn('Back home','nav:home')}</section>`;
    if(j.version===2)return townLife(j);
    const t=j.task,q={world:'town',route:j.venue,values:j.values,solved:j.solved},role=j.context.role;
    return `${header('ADVENTURE JOURNEY · '+j.recipeName,esc(j.title),'world')}<div class="journey-progress"><p>Step ${Math.min(8,j.stage+1)} of 8 · ${esc(role)} context · cash ${T.money(j.cash)}</p><p>Shopping list: ${j.shoppingList?`pasta ${j.shoppingList[0]} packs · tomatoes ${j.shoppingList[1]} tins · protein ${j.shoppingList[2]} packs`:'not prepared yet'} · Inventory: pasta ${j.inventory[0]} packs · tomatoes ${j.inventory[1]} tins · protein ${j.inventory[2]} packs</p><p class="small">Fictional journey inventory and money. Your learning coins and mastery are separate.</p></div><div class="quest-layout world-stage venue-${j.venue}"><aside class="stage-vista"><div class="hero-art">${A.location(j.venue,q)}</div><div class="panel">${A.guide('Jess')}<p>Your same Town, seen through a different role.</p></div></aside><section class="panel stage-workbench">${j.done?`<h2>The recipe is ready.</h2><p>Your shopping, change and cooking were saved together. Reopening this journey cannot repeat a payment or consume ingredients again.</p>${btn('Back to Town','world:town','primary')}`:`<h2>${esc(t.prompt)}</h2><p>${esc(t.teach)}</p><details><summary>An easier example</summary><p>${esc(t.example)}</p></details><div class="task-controls" ${j.solved?'inert':''}>${U.controls(q,t).replaceAll('data-action="m-','data-action="j-').replaceAll('mission-amount','journey-amount').replaceAll('mission-number-help','journey-number-help').replace('data-numeric-answer="mission"','data-numeric-answer="journey"')}</div>${j.feedback?`<p class="feedback" role="status">${esc(j.feedback)}</p>`:''}<div class="actions">${j.solved?btn(j.stage===7?'Prepare dinner':'Continue journey','j-next','primary'):btn('Try my plan','j-submit','primary')}${btn('Hint','j-help')}${btn('I don’t know','j-skip')}${btn('Save & exit','nav:home')}</div>`}</section></div>`;
  }
  function recap() {
    const r = s.lastResult;
    if (!r) return home();
    const w = r.world || skill(r.id)?.world || s.world;
    return `<section class="recap"><span class="badge">A CHAPTER IN YOUR JOURNEY</span><h1 style="margin-top:22px">${r.type === "expedition" ? "A visit worth remembering." : r.type === "quest" ? "Look what you restored." : r.type === "discovery" ? "Your starting point" : r.type === "check" ? "Your independent check" : "Another idea explored."}</h1><p class="muted">${r.type === "expedition" ? (r.newReward ? "A new milestone and keepsake are saved. Your maths has helped this place grow." : "A fresh visit complete. Your earlier rewards are safe; replaying does not duplicate them.") : r.type === "quest" ? "Three landmarks, brought back to life through your maths. Your progress is saved." : r.type === "discovery" ? "A starting point helps us choose suitable fresh practice. Discovery does not award mastery." : r.type === "check" ? r.correct + " / " + r.total + " first answers without help. " + (s.checks[r.id]?.stage >= 2 ? "Spaced mastery demonstrated." : s.checks[r.id]?.stage === 1 ? "Independently practised. Come back for a memory check in two days." : "Revisit the lesson before your next fresh check.") : "Guided practice complete. Your next step can be a separate fresh independent check."}</p>${art(w)}<div class="actions">${btn("Explore this world", "world:" + w, "primary")}${r.type === "practice" ? btn("Try a fresh independent check", "check:" + r.id) : r.type === "discovery" && !s.discovery[r.id]?.complete ? btn("Continue discovery", "discover:" + r.id) : ""}${r.type === "expedition" ? btn("Learn the maths behind this visit", "learn:" + (M.routes(w).find((v) => v.id === r.route)?.skills[0] || E.worlds.find((v) => v.id === w).skill)) : ""}${btn("Visit Base Camp", "nav:camp")}${btn("Save & exit", "nav:home")}</div></section>`;
  }
  const campNames = [
    "Camp foundations",
    "Lantern path",
    "Workshop",
    "Garden",
    "Companion corner",
    "Explorer lodge",
  ];
  const campThresholds = [0, 1, 3, 6, 12, 24];
  function campPlanner(progress) {
    const selected=M.campStages.find(st=>st.id===campPreview) || progress.next || progress.current;
    return `<section id="estate-planner" class="estate-planner panel" aria-label="Camp upgrade planner"><div class="section-head"><div><div class="eyebrow">A HOME BUILT THROUGH ADVENTURE</div><h2>${progress.next ? "Next: " + esc(progress.next.name) : "Your mansion estate is complete."}</h2><p>${progress.count} unique milestones · ${progress.next ? progress.remaining + " more for the next home" : "Every earned upgrade stays with you"}.</p></div><span class="badge">STAGE ${progress.current.id} / 8</span></div><p class="small muted">New homes arrive automatically at unique adventure milestones, with hints welcome. Coins and independent mastery are separate. Repeating the same milestone never moves this planner.</p><div class="estate-track" role="group" aria-label="Preview eight camp stages">${M.campStages.map(st=>`<button data-action="camp-preview:${st.id}" aria-pressed="${selected.id===st.id}"><strong>${st.id}. ${esc(st.name)}</strong><span>${st.need} unique milestones${st.id<=progress.current.id ? " · earned" : ""}</span></button>`).join("")}</div><div class="estate-plan-preview"><div>${A.camp(s,selected.id)}</div><div><span class="badge">PREVIEW ONLY · ${selected.need} MILESTONES</span><h3>${esc(selected.name)}</h3><p>${esc(selected.story)}</p><p class="small muted">Previewing never unlocks a stage, spends coins or earns learning time.</p>${progress.current.id>=6?`<div class="actions">${btn("Plan fictional water supply", "mission:measure:1:1")}${progress.current.id>=7?btn("Explore fictional power planning", "mission:statistics:1:1"):""}</div><p class="small muted">Illustrated maths models, not real machinery or electrical instructions.</p>`:""}</div></div></section>`;
  }
  function camp() {
    const progress=M.campProgress(s),n=progress.count;
    return `${header("YOUR LITTLE CORNER OF THE WORLD", "Welcome to Base Camp.", "home")}<section class="camp-overview ${progress.pending ? "estate-unveiling" : ""}">${progress.pending ? `<div class="estate-celebration" role="status"><strong>Your ${esc(progress.current.name)} is ready.</strong><span>Built through your adventures. No coins spent.</span>${btn("Enjoy the new home", "camp-celebrate")}</div>` : ""}<div class="camp-map hero-art">${A.camp(s)}<nav class="camp-hotspots" aria-label="Places at Base Camp"><a href="#camp-shelf" style="left:55%;top:68%">Home & keepsakes</a><a href="#camp-garden" style="left:69%;top:78%">Garden</a><a href="#camp-gate" style="left:43%;top:83%">Gate</a><a href="#estate-planner" style="left:84%;top:62%">Plan upgrades</a></nav><span class="scene-caption">YOUR CAMP · ${n} LANDMARKS</span></div><div class="camp-dock">${A.explorer(s)}<div><span class="badge">LEVEL ${1 + Math.floor(E.xp(s) / 400)} EXPLORER</span><h2>${esc(progress.current.name)}</h2><p class="muted">Tap a place in camp to decorate or build. Every earned upgrade stays with you.</p><p class="camp-inventory small">${campNames.filter((_,i)=>n>=campThresholds[i]).map(name=>`<span>◆ ${name}</span>`).join(" ")}</p><p><strong>${E.xp(s)} explorer XP</strong> · ${window.V3Presentation.coins(s.coins)} learning coins</p><div class="actions">${btn("Customise explorer", "nav:shop", "primary")}${btn("Explore worlds", "nav:map")}</div><p class="small muted">XP comes once per landmark. Coins come from active learning: 10 per minute. Screen-time remains 1:1.</p></div></div></section>${campPlanner(progress)}<details class="camp-journal"><summary>Your discoveries · achievement journal</summary><div class="panel achievement-grid">${[
      ["First steps", n >= 1, "Restore your first landmark."],
      [
        "Forest keeper",
        E.count(s, "number") === 3,
        "Restore all of Number Forest.",
      ],
      [
        "World wanderer",
        E.worlds.every((w) => M.visualLevel(s, w.id, E.count(s, w.id)) > 0),
        "Restore a landmark in each of the nine worlds.",
      ],
      [
        "Independent thinker",
        s.achievements.includes("independent"),
        "Pass a fresh independent check.",
      ],
      [
        "Memory maker",
        s.achievements.includes("memory"),
        "Pass a delayed memory check.",
      ],
      [
        "Original atlas keeper",
        E.worlds
          .filter((w) => w.id !== "town")
          .every((w) => E.count(s, w.id) === 3),
        "Restore the original 24 landmarks.",
      ],
      [
        "Town neighbour",
        new Set(
          M.completions(s, "town")
            .filter((r) => r.route !== "gateway")
            .map((r) => r.route),
        ).size === 8,
        "Help all eight town locations.",
      ],
      [
        "Gateway guardian",
        E.worlds.every(
          (w) =>
            M.entry(s, w.id, "gateway", 1) ||
            M.entry(s, w.id, "gateway", 2) ||
            M.entry(s, w.id, "gateway", 3),
        ),
        "Complete a gateway in each of the nine worlds.",
      ],
    ]
      .map(
        ([name, earned, desc]) =>
          `<div class="achievement"><span aria-hidden="true">${earned ? "◆" : "◇"}</span><div><strong>${name} ${earned ? "· earned" : ""}</strong><span class="small muted">${desc}</span></div></div>`,
      )
      .join("")}</div></details>${U.collection(s)}`;
  }
  function shop() {
    const slots = [...new Set(C.catalog.map((i) => i.slot))];
    return `${header("A LOOK THAT IS ALL YOURS", "Explorer wardrobe", "camp")}<div class="shop-preview">${A.explorer(s)}<div><h2>Your explorer</h2><p class="muted">${window.V3Presentation.coins(s.coins)} learning coins · ${s.bought.length} items owned</p><p class="small muted">Outfits appear in every world. ${cloud ? "Staging wallet only. Purchases are checked securely before saving." : "Only fictional demo coins are used here."}</p>${btn("Unequip all", "unequip")}</div></div><label for="shop-filter">Browse collection <select id="shop-filter"><option value="all">All 40 items</option><option value="owned" ${filter === "owned" ? "selected" : ""}>Owned</option><option value="affordable" ${filter === "affordable" ? "selected" : ""}>Affordable</option>${slots.map((x) => `<option ${filter === x ? "selected" : ""}>${x}</option>`).join("")}</select></label><div class="shop-grid">${C.catalog
      .filter(
        (i) =>
          filter === "all" ||
          (filter === "owned" && s.bought.includes(i.id)) ||
          (filter === "affordable" &&
            (s.bought.includes(i.id) || s.coins >= i.cost)) ||
          filter === i.slot,
      )
      .map(
        (i) =>
          `<article class="shop-item"><span class="ico" aria-hidden="true">${A.icon(i)}</span><h3>${i.label}</h3><p class="small muted">${i.cost} coins · ${i.slot}</p>${btn(s.equipped.includes(i.id) ? "Unequip " + i.label : s.bought.includes(i.id) ? "Equip " + i.label : "Buy " + i.label, "buy:" + i.id, s.equipped.includes(i.id) ? "primary" : "", !s.bought.includes(i.id) && s.coins < i.cost)}</article>`,
      )
      .join("")}</div>`;
  }
  function settings() {
    return `${header("PLAY YOUR WAY", "Settings", "home")}<div class="panel preferences"><h2>Comfort comes first</h2><label><input type="checkbox" data-setting="motion" ${s.settings.motion ? "checked" : ""}>Gentle scene animation (system reduced-motion preference takes priority)</label><label><input type="checkbox" data-setting="sound" ${s.settings.sound ? "checked" : ""}>Quiet restoration sound</label><p class="muted">Sound and animation start off. All puzzles work with tapping and a keyboard; dragging is optional.</p><div class="actions">${btn("Replay the welcome tour", "nav:tour")}</div>${cloud ? "<h3>Separate staging account</h3><p>Progress saves on this device and syncs to the verified staging project. Purchases need a connection. Lock or sign out on a shared device.</p>" : '<h3>Fictional Test Camp</h3><p class="small muted">This build has no cloud adapter or live account login. It uses its own device storage. Existing V2 progress is never read or changed. Cloud sync and secure parent rewards must be tested separately in staging.</p>'}</div>`;
  }
  function parent() {
    const minutes = s.weekly[E.weekKey(Date.now())] || 0;
    return `${header("FICTIONAL TEST LEARNER", "Demo parent summary", "home")}<div class="notice">Offline summary only. Real parent login, bonus awards and family data stay in the existing secure game. No production data is loaded here.</div><div class="stat-grid"><div class="stat"><strong>${minutes.toFixed(1)} / 60</strong>weekly active minutes</div><div class="stat"><strong>${minutes.toFixed(1)}</strong>screen-time minutes · 1:1</div><div class="stat"><strong>${Object.values(s.skills).filter((k) => k.state === "mastered").length}</strong>independently mastered skills</div></div><div class="split"><section class="panel"><h2>Learning evidence</h2>${
      C.skills
        .filter((k) => s.checks[k.id] || s.practice[k.id])
        .map(
          (k) =>
            `<p><strong>${k.name}</strong><br><span class="small muted">${s.checks[k.id]?.reteach ? "Needs reinforcement" : s.checks[k.id]?.stage >= 2 ? "Spaced mastery" : s.checks[k.id]?.stage === 1 ? "Independent practice passed" : "Guided practice"} · ${s.checks[k.id]?.score ?? "No independent score"}${s.checks[k.id] ? "%" : ""}</span></p>`,
        )
        .join("") ||
      '<p class="muted">Learning evidence appears after lessons and checks.</p>'
    }<p class="small muted">${s.milestones.length} story landmarks · separate from academic mastery.</p></section><section class="panel"><h2>Recent genuine activity</h2>${
      s.recent
        .slice(0, 8)
        .map(
          (r) =>
            `<p class="small"><strong>${esc(r.type === "expedition" ? E.worlds.find((w) => w.id === r.world)?.name + " · " + (M.routes(r.world).find((v) => v.id === r.route)?.name || "Gateway") + " · level " + r.tier : r.type === "restoration" ? E.worlds.find((w) => w.id === r.world)?.name : skill(r.id)?.name || r.type)}</strong> · ${esc(r.type)}${r.assisted ? " · with support" : ""}<br><span class="muted">${esc(new Date(r.date).toLocaleString("en-GB", { timeZone: "Europe/London" }))}</span></p>`,
        )
        .join("") || '<p class="muted">No learning activity yet.</p>'
    }</section></div>`;
  }
  function tour() {
    return `<section class="tour">${header("WELCOME, EXPLORER", "A world you can change.", "home")}${art("number")}<div class="panel"><h2>One idea at a time.</h2><p>Choose any of nine worlds. Meet your guide, choose a difficulty and solve hands-on tasks. Return for new expeditions, practical visits and optional gateways.</p><p>Hints are always safe. Lessons and practice help you learn; separate fresh checks show what you can do independently.</p><p>Your explorer and Base Camp grow with your adventure. Progress saves automatically on this device.</p><div class="actions">${btn("Start exploring →", "finish-tour", "primary")}${btn("Skip tour", "skip-tour")}</div></div></section>`;
  }
  function render(focus = false) {
    document.body.classList.toggle("animate", !!s.settings.motion);
    $("headerExplorer").innerHTML = A.explorer(s, true);
    const screens = {
      home,
      map,
      world: worldPage,
      quest,
      lesson: learning,
      practice: learning,
      check: learning,
      camp,
      shop,
      settings,
      parent,
      recap,
      tour,
      discovery: learning,
      adventure: () => U.play(s,venueExterior),
      journey,
    };
    $("main").innerHTML =
      cloud && s.view === "parent"
        ? "<h1>Parent account required</h1>"
        : (screens[s.view] || home)();
    document.querySelectorAll("[data-nav]").forEach((el) => {
      if (el.closest("nav")) {
        const current =
          el.dataset.nav === s.view ||
          (el.dataset.nav === "map" &&
            [
              "world",
              "quest",
              "lesson",
              "practice",
              "check",
              "discovery",
              "adventure",
            ].includes(s.view)) ||
          (el.dataset.nav === "camp" && s.view === "shop");
        if (current) el.setAttribute("aria-current", "page");
        else el.removeAttribute("aria-current");
      }
    });
    if (focus) {
      $("main").focus();
      window.scrollTo(0, 0);
    }
  }
  function sound() {
    if (!s.settings.sound) return;
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)(),
        osc = ctx.createOscillator(),
        gain = ctx.createGain();
      gain.gain.value = 0.025;
      osc.frequency.value = 440;
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
      osc.stop(ctx.currentTime + 0.3);
      osc.onended = () => ctx.close();
    } catch {}
  }
  async function dispatch(action) {
    const [name, arg] = action.split(":");
    if (cloud && !cloud.isUnlocked()) return;
    if (cloud && name === "buy" && !s.bought.includes(arg)) {
      try {
        await cloud.purchase(arg);
        s = read();
      } catch (e) {
        status(e.message);
        return;
      }
    }
    const oldView = s.view;
    let error = null,
      restored = false;
    await change(() => {
      if(name==='j-work'){const tier=Number(action.split(':')[2])||M.recommendation(s,'town');if(!window.V52TownLife.start(s,'job-'+arg,tier))error='This saved Town plan needs another look. It has been preserved.';return;}
      if(name==='j-plan'||name==='j-replay'){const tier=M.state(s).difficulty.town||M.recommendation(s,'town');if(!window.V52TownLife.start(s,arg,tier,name==='j-replay'))error='This saved Town plan needs another look. It has been preserved.';return;}
      if(name==='j-start'){M.state(s);if(!window.V5Journey.start(s,arg))error='This saved journey cannot be opened; its original data has been preserved.';return;}
      if(name.startsWith('j-')){window.V5Journey.action(s,name,arg,action);return;}
      switch (name) {
        case "nav":
          s.view = arg;
          before = false;
          break;
        case "world":
          s.world = arg;
          s.view = "world";
          before = false;
          break;
        case "continue":
          if(s.resumeView==="journey"&&window.V5Journey.state(s)){s.view="journey";}
          else if (s.resumeView === "adventure" && M.current(s)) {
            s.world = M.current(s).world;
            s.view = "adventure";
          } else if (s.resumeView === "quest" && s.quest) s.view = "quest";
          else if (
            ["lesson", "practice", "check", "discovery", "adventure"].includes(
              s.resumeView,
            ) &&
            s.learning
          )
            s.view = s.resumeView;
          else if (s.quest) s.view = "quest";
          else if (s.learning)
            s.view =
              s.learning.mode === "discovery"
                ? "discovery"
                : s.learning.mode === "check"
                  ? "check"
                  : s.learning.started
                    ? "practice"
                    : "lesson";
          else if (s.world === "town")
            M.start(s, "town", "market", M.recommendation(s, "town"));
          else E.startQuest(s, s.world);
          break;
        case "quest":
          if (arg === "town") M.start(s, "town", "market", 1);
          else E.startQuest(s, arg);
          break;
        case "scene-mission":
        case "mission": {
          const bits = action.split(":");
          venueExterior=false;
          M.start(s, bits[1], bits[2], Number(bits[3]));
          break;
        }
        case "camp-preview":
          if(M.campStages.some(st=>st.id===Number(arg))) campPreview=Number(arg);
          break;
        case "camp-celebrate":
          M.celebrateCamp(s);
          break;
        case "venue-view":
          venueExterior=arg==="exterior";
          break;
        case "camp-build":
          M.build(s, arg);
          break;
        case "m-begin":
          M.begin(s);
          break;
        case "m-value":
          M.edit(s, "amount", Number(arg));
          break;
        case "m-adjust": {
          const q = M.current(s),
            t = q?.tasks[q.i];
          if (t)
            M.edit(
              s,
              "amount",
              Math.min(
                t.max,
                Math.max(t.min || 0, (q.values.amount || 0) + Number(arg)),
              ),
            );
          break;
        }
        case "m-part": {
          const q = M.current(s),
            t = q?.tasks[q.i],
            bits = action.split(":");
          if (t) {
            const n = t.items?.length || 3,
              parts = q.values.parts || Array(n).fill(0),
              i = Number(bits[1]),
              max =
                ["blocks","array","volume"].includes(t.kind) ? 9 : t.kind === "budget" ? t.budget : 12;
            parts[i] = Math.min(
              max,
              Math.max(0, (parts[i] || 0) + Number(bits[2])),
            );
            M.edit(s, "parts", parts);
          }
          break;
        }
        case "h-pick": {
          M.edit(s,'picked',Number(arg));
          break;
        }
        case "h-clear": M.edit(s,'order',[]);break;
        case "h-place": {
          const q=M.current(s),t=q?.tasks[q.i];
          if(q&&Number.isInteger(q.values.picked)){
            const order=Array(t.items.length).fill(null).map((_,i)=>q.values.order?.[i]??null),pick=q.values.picked,slot=Number(arg);
            if(slot>=0&&slot<order.length){for(let i=0;i<order.length;i++)if(order[i]===pick)order[i]=null;order[slot]=pick;M.edit(s,'order',order);}
          }break;
        }
        case "p5-add": case "p5-value": case "p5-shade":
          window.V5HandsOn.practiceEdit(s.learning,name.slice(3),Number(arg));break;
        case "p5-submit":
          if (s.learning && window.V5HandsOn.invalidDraft(s.learning.manipulation,window.V5HandsOn.practiceSpec({id:s.learning.id},s.learning.qs[s.learning.i]))) break;
          if(s.learning?.mode==='practice'){const stamp=JSON.stringify(s.learning.manipulation||{});if(s.learning.retrying&&s.learning.lastConstructedSubmission===stamp)break;s.learning.lastConstructedSubmission=stamp;const correct=E.answerLearning(s,window.V5HandsOn.practiceValue(s.learning));if(!correct){s.learning.answered=false;s.learning.assisted=true;s.learning.retrying=true;}}break;
        case "h-shade": {
          const bits=action.split(':'),q=M.current(s);if(q){const sel=q.values.selected||[],i=Number(bits[1]),on=bits[2]==='1';if(sel.includes(i)!==on&&M.edit(s,'selected',on?[...new Set([...sel,i])]:sel.filter(x=>x!==i)))activity=Date.now();}break;
        }
        case "m-select": {
          const q = M.current(s);
          if (q) {
            const sel = q.values.selected || [],
              i = Number(arg);
            M.edit(
              s,
              "selected",
              sel.includes(i) ? sel.filter((v) => v !== i) : [...sel, i],
            );
          }
          break;
        }
        case "m-point": {
          const bits = action.split(":");
          M.edit(s, "point", [Number(bits[1]), Number(bits[2])]);
          break;
        }
        case "m-turn-back": {
          const q = M.current(s);
          if (q) M.edit(s, "amount", ((q.values.amount || 0) + 270) % 360);
          break;
        }
        case "m-turn": {
          const q = M.current(s);
          if (q) M.edit(s, "amount", ((q.values.amount || 0) + 90) % 360);
          break;
        }
        case "m-choice":
          M.edit(s, "choice", Number(arg));
          break;
        case "m-post": {
          const q = M.current(s);
          if (q && Number(arg) === (q.values.posted || 0))
            M.edit(s, "posted", Number(arg) + 1);
          break;
        }
        case "m-coin": {
          const q = M.current(s);
          if (q) {
            const coins = q.values.coins || [];
            if (arg === "clear") M.edit(s, "coins", []);
            else if (arg === "undo") M.edit(s, "coins", coins.slice(0, -1));
            else if (coins.length < 100)
              M.edit(s, "coins", [...coins, Number(arg)]);
          }
          break;
        }
        case "m-help":
          M.help(s);
          break;
        case "m-worked":
          M.help(s, true);
          break;
        case "m-submit":
          restored = M.submit(s);
          break;
        case "m-next":
          restored = M.next(s);
          break;
        case "begin":
          if (s.quest) s.quest.intro = false;
          break;
        case "value":
          if (s.quest && !s.quest.solved) {s.quest.value = Number(arg);delete s.quest.amountDraft;}
          break;
        case "adjust":
          if (s.quest && !s.quest.solved) {
            delete s.quest.amountDraft;
            const p = E.puzzle(s.quest.world, s.quest.i);
            s.quest.value = Math.min(
              p.max,
              Math.max(p.min || 0, s.quest.value + Number(arg)),
            );
          }
          break;
        case "part":
          if (s.quest && !s.quest.solved) {
            const sel = s.quest.selected;
            s.quest.selected = sel.includes(Number(arg))
              ? sel.filter((v) => v !== Number(arg))
              : [...sel, Number(arg)];
          }
          break;
        case "rotate":
          if (s.quest && !s.quest.solved)
            s.quest.value = (s.quest.value + 90) % 360;
          break;
        case "hint":
          E.help(s);
          break;
        case "solve":
          if (s.quest && window.V5HandsOn.invalidDraft(s.quest,E.puzzle(s.quest.world,s.quest.i))) break;
          restored = E.answerQuest(s);
          break;
        case "skip":
          E.answerQuest(s, true);
          break;
        case "next-quest":
          E.nextQuest(s);
          break;
        case "before":
          before = !before;
          break;
        case "learn":
          error = E.generate(s, arg, "practice", window.JaxonFreshReview, C);
          break;
        case "discover":
          error = E.startDiscovery(s, arg, C, window.V3Discovery);
          break;
        case "check":
          error = E.generate(s, arg, "check", window.JaxonFreshReview, C);
          break;
        case "practice":
          if (s.learning) {
            s.learning.started = true;
            s.view = "practice";
            s.resumeView = "practice";
          }
          break;
        case "answer":
          if (s.learning)
            E.answerLearning(s, s.learning.qs[s.learning.i][2][Number(arg)]);
          break;
        case "learning-skip":
          E.answerLearning(s, "", true);
          break;
        case "learning-hint":
          if (s.learning && !s.learning.answered) {
            s.learning.assisted = true;
            s.learning.feedback = s.learning.qs[s.learning.i][3];
          }
          break;
        case "next-learning":
          E.nextLearning(s);
          break;
        case "buy":
          if (!E.purchase(s, arg, C.catalog))
            error = "More active learning coins are needed for this item.";
          break;
        case "unequip":
          s.equipped = [];
          break;
        case "skip-tour":
          s.tourSeen = true;
          s.view = "home";
          break;
        case "finish-tour":
          s.tourSeen = true;
          s.view = "map";
          break;
        default:
          if (action.startsWith("math:") || action.startsWith("mathx:")) {
            if (s.learning) {
              s.learning.type = "mission";
              window.JaxonMathTools.update(s.learning, action);
              window.JaxonMathToolsExtra.update(s.learning, action);
            }
          }
      }
    });
    if (error) status(error);
    if (restored) sound();
    if (s.view !== oldView) {
      $("main").focus();
      window.scrollTo(0, 0);
    } else if (
      [
        "next-quest",
        "next-learning",
        "answer",
        "learning-skip",
        "hint",
        "learning-hint",
        "skip",
        "begin",
        "solve",
        "j-next", "j-submit", "j-help", "j-skip",
        "m-begin",
        "m-submit",
        "m-next",
        "m-help",
        "m-worked",
      ].includes(name)
    ) {
      $("main").focus();
    }
  }
  document.addEventListener("click", async (e) => {
    const el = e.target.closest("[data-action],[data-nav],[data-act]");
    if (!el || el.disabled) return;
    const action =
      el.dataset.action || el.dataset.act || "nav:" + el.dataset.nav;
    const name = action.split(":")[0];
    if (["m-submit","j-submit","p5-submit","solve"].includes(name)) {
      const input = document.querySelector('[data-numeric-answer][aria-invalid="true"],[data-mission-clock][aria-invalid="true"],[data-life-clock][aria-invalid="true"]');
      if(input) { input.setCustomValidity(document.getElementById(input.getAttribute('aria-describedby'))?.textContent || 'Check your answer before submitting.'); input.reportValidity(); return; }
    }
    // Only maths manipulation/answer/support controls renew the bounded learning window.
    // Navigation, focus, raw key presses, pointer movement and refresh never do.
    const meaningful =
      [
        "value",
        "adjust",
        "select",
        "part",
        "rotate",
        "h-place", "h-clear", "p5-add", "p5-value", "p5-shade", "p5-submit",
        "m-point",
        "solve",
        "hint",
        "skip",
        "answer",
        "learning-hint",
        "learning-skip",
        "m-value",
        "m-adjust",
        "m-part",
        "h-shade",
        "m-select",
        "m-coin",
        "m-choice",
        "m-post",
        "m-turn",
        "m-turn-back",
        "m-submit",
        "m-help",
        "m-worked",
      ].includes(name) || ["j-part","j-choice","j-coin","j-adjust","j-value","j-submit","j-help","j-place","j-clear","j-skip"].includes(name) || el.dataset.act;
    const evidence = () => JSON.stringify([s.quest, s.learning, M.current(s),window.V5Journey.state(s)]);
    const previous = evidence();
    await dispatch(action);
    if (!meaningful) activity = 0;
    else if (previous !== evidence()) activity = Date.now();
  });
  document.addEventListener('keydown',e=>{
    if(e.key==='Enter' && e.target.dataset.numericAnswer) {
      e.preventDefault();
      const action={mission:'m-submit',journey:'j-submit',practice:'p5-submit',quest:'solve'}[e.target.dataset.numericAnswer];
      document.querySelector(`[data-action="${action}"]`)?.click();
    }
  });
  let paint=null, suppressPaintClick=false;
  document.addEventListener('pointerdown',e=>{const b=e.target.closest('.mission-parts .part,[data-shade-group] button');if(!b)return;paint={id:e.pointerId,x:e.clientX,y:e.clientY,first:b,on:b.getAttribute('aria-pressed')!=='true',seen:new Set(),active:false};});
  document.addEventListener('pointermove',e=>{
    if(!paint||paint.id!==e.pointerId)return;
    if(!paint.active){if(Math.abs(e.clientY-paint.y)>12&&Math.abs(e.clientY-paint.y)>Math.abs(e.clientX-paint.x)){paint=null;return;}if(Math.abs(e.clientX-paint.x)<8)return;paint.active=true;}
    const hit=document.elementFromPoint(e.clientX,e.clientY)?.closest('.mission-parts .part,[data-shade-group] button');
    for(const b of [paint.first,hit])if(b&&!paint.seen.has(b.getAttribute('data-action'))){const action=b.getAttribute('data-action');paint.seen.add(action);if(action.startsWith('m-select:')){dispatch('h-shade:'+action.split(':')[1]+':'+(paint.on?1:0));}else if((b.getAttribute('aria-pressed')==='true')!==paint.on)dispatch(action);}
  });
  document.addEventListener('pointerup',()=>{if(paint?.active){suppressPaintClick=true;setTimeout(()=>suppressPaintClick=false,0);}paint=null;});
  document.addEventListener('pointercancel',()=>{paint=null;});
  document.addEventListener('click',e=>{if(suppressPaintClick){suppressPaintClick=false;e.stopImmediatePropagation();e.preventDefault();}},true);
  document.addEventListener('keydown',e=>{const b=e.target.closest('.cartesian-point');if(!b||!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))return;e.preventDefault();const x=Number(b.dataset.cx)+(e.key==='ArrowRight'?1:e.key==='ArrowLeft'?-1:0),y=Number(b.dataset.cy)+(e.key==='ArrowUp'?1:e.key==='ArrowDown'?-1:0);b.closest('.cartesian-plane').querySelector(`[data-cx="${x}"][data-cy="${y}"]`)?.focus();});
  document.addEventListener("change", async (e) => {
    if (e.target.dataset.missionTier) {
      const id = e.target.dataset.missionTier,
        value = Number(e.target.value);
      await change(() => {
        M.state(s).difficulty[id] = value;
      });
      return;
    }
    if (e.target.dataset.campSlot) {
      const slot = e.target.dataset.campSlot,
        value = e.target.value;
      await change(() => M.campPlace(s, slot, value));
      return;
    }
    if (e.target.id === "shop-filter") {
      filter = e.target.value;
      render();
      $("shop-filter")?.focus({ preventScroll: true });
      return;
    }
    if (e.target.dataset.setting) {
      const name = e.target.dataset.setting,
        value = e.target.checked;
      status("Saving preferences on this device…");
      await change(
        () => {
          s.settings[name] = value;
        },
        { renderPage: false },
      );
      document.body.classList.toggle("animate", !!s.settings.motion);
    }
  });
  document.addEventListener("input", async (e) => {
    if (e.target.dataset.numericAnswer) {
      const input = e.target, context = input.dataset.numericAnswer, raw = input.value;
      const target = () => context === 'mission' ? M.current(s) : context === 'journey' ? window.V5Journey.state(s) : context === 'quest' ? s.quest : s.learning;
      const original = target(), step = original?.i ?? original?.stage;
      const spec = () => context === 'mission' ? M.current(s)?.tasks[M.current(s).i] : context === 'journey' ? window.V5Journey.task(s) : context === 'quest' ? E.puzzle(s.quest.world,s.quest.i) : window.V5HandsOn.practiceSpec({id:s.learning?.id},s.learning?.qs[s.learning.i]);
      const t = spec();
      if (!original || !t) return;
      const scale=context==='practice' ? t.scale || 1 : 1, n = window.V5HandsOn.numericValue(raw,t,scale);
      await change(() => {
        const q = target();
        if (!q || (q.i ?? q.stage) !== step || (q.key ?? q.id) !== (original.key ?? original.id) || q.world !== original.world || q.seed !== original.seed || q.round !== original.round || q.solved || q.answered || q.intro) return;
        const values = context === 'practice' ? (q.manipulation ||= {}) : context === 'quest' ? q : q.values;
        if (n !== null) {
          if ((context === 'quest' ? q.value : values.amount) !== n) activity = Date.now();
          if (context === 'mission') M.edit(s,'amount',n);
          else if (context === 'journey') window.V5Journey.action(s,'j-value',String(n),'j-value:'+n);
          else if(context === 'quest') q.value=n;
          else window.V5HandsOn.practiceEdit(q,'value',n);
        }
        values.amountDraft = raw;
      }, {renderPage:false});
      if (!input.isConnected || input.value !== raw) return;
      const invalid = n === null;
      input.setAttribute('aria-invalid',String(invalid));
      input.setCustomValidity(invalid ? window.V5HandsOn.numericMessage(t,scale) : '');
      input.parentElement.querySelector('.numeric-help').textContent = invalid ? input.validationMessage : 'Type an answer or use the model.';
      if (!invalid) {
        const q = target();
        if(context === 'practice') {
          const template=document.createElement('template');
          template.innerHTML=window.V5HandsOn.practiceRender(q,{id:q.id});
          const model=document.querySelector('.practice-model');
          if(model) model.innerHTML=template.content.querySelector('.practice-model').innerHTML;
        }
        if(context === 'quest') {
          const template=document.createElement('template');template.innerHTML=puzzle(q);
          const current=document.querySelector('.puzzle > div:last-child'),fresh=template.content.querySelector('.puzzle > div:last-child');
          if(current&&fresh) [...fresh.children].forEach((child,i)=>{if(!child.classList.contains('stepper')) current.children[i]?.replaceWith(child.cloneNode(true));});
        } else if(context !== 'practice') {
          const template=document.createElement('template');template.innerHTML=U.controls(q,t);
          for(const selector of ['.invoice','.sale-tag']) {
            const current=input.closest('.task-controls')?.querySelector(selector),fresh=template.content.querySelector(selector);
            if(current&&fresh) current.replaceWith(fresh);
          }
        }
        const model = input.closest('.task-controls,.mission-task,.practice-manipulative')?.querySelector('.hands-on');
        if (model && context !== 'practice') {const html=window.V5HandsOn.render(q,t) || ''; model.outerHTML=context==='journey' ? html.replaceAll('data-action="m-','data-action="j-') : html;}
        const display = document.querySelector('.amount-display');
        if (display) display.textContent = t.unit === 'p' ? T.money(n) : n + ' ' + (t.unit || 'units');
        const stepper = context==='quest' ? input.closest('.stepper') : input.closest('.amount-editor')?.querySelector('.stepper');
        if(stepper) {stepper.firstElementChild.disabled=n <= (t.min ?? 0);stepper.lastElementChild.disabled=n >= t.max;}
      }
      return;
    }

    if(e.target.dataset.lifeClock){
      const input=e.target,raw=input.value,original=window.V52TownLife.state(s),id=original?.id,stage=original?.stage;
      const valid=/^([01]\d|2[0-3]):[0-5]\d$/.test(raw),[h,m]=raw.split(':').map(Number);
      await change(()=>{const j=window.V52TownLife.state(s);if(!j||j.id!==id||j.stage!==stage||j.solved)return;if(valid){if(j.values.amount!==h*60+m)activity=Date.now();window.V52TownLife.action(s,'j-value',String(h*60+m));}j.values.clockDraft=raw;},{renderPage:false});
      input.setAttribute('aria-invalid',String(!valid));input.setCustomValidity(valid?'':'Choose a complete 24-hour time.');const display=document.querySelector('.clock-display');if(display&&valid)display.textContent=T.clock(h*60+m);return;
    }

    if (e.target.dataset.missionClock) {
      const input=e.target, raw=input.value, original=M.current(s), step=original?.i;
      const valid=/^([01]\d|2[0-3]):[0-5]\d$/.test(raw);
      const [hour,minute]=raw.split(':').map(Number),value=hour*60+minute;
      await change(()=>{
        const q=M.current(s);
        if(!q || q.key!==original?.key || q.seed!==original?.seed || q.i!==step || q.solved) return;
        if(valid) {if(q.values.amount!==value) activity=Date.now();M.edit(s,'amount',value);}
        q.values.clockDraft=raw;
      },{renderPage:false});
      input.setAttribute('aria-invalid',String(!valid));
      input.setCustomValidity(valid?'':'Choose a complete 24-hour time.');
      const display=document.querySelector('.clock-display');
      if(display&&valid) display.textContent=T.clock(value);
      return;
    }

  });
  window.addEventListener("storage", (e) => {
    if (e.key === KEY) {
      s = read();
      render();
      status("Updated from another Test Camp tab.");
    }
  });
  document.addEventListener("visibilitychange", () => {
    lastTick = Date.now();
    activity = 0;
  });
  function learningEligible(now) {
    return (
      !document.hidden &&
      document.hasFocus() &&
      activity > 0 &&
      now - activity < 20000 &&
      [
        "journey",
        "quest",
        "lesson",
        "practice",
        "check",
        "discovery",
        "adventure",
      ].includes(s.view) &&
      (s.view === "journey" ? !!window.V5Journey.state(s)&&!window.V5Journey.state(s).solved&&!window.V5Journey.state(s).done : s.view === "adventure"
        ? !!M.current(s) &&
          M.current(s)?.phase !== "lesson" &&
          !M.current(s)?.solved
        : s.view === "quest"
          ? !s.quest?.intro && !s.quest?.solved
          : !s.learning?.answered)
    );
  }
  setInterval(async () => {
    const now = Date.now(),
      dt = now - lastTick;
    lastTick = now;
    const eligible = learningEligible(now);
    if (eligible)
      await change(
        () => {
          // A queued Web Lock may resolve after visibility, focus or the task changed.
          if (!learningEligible(Date.now())) return;
          E.activeTime(s, dt, true, now);
          cloud?.onActive(Math.min(dt, 5000));
        },
        {
          renderPage: false,
        },
      );
  }, 5000);
  render();
  if (storageError)
    status(
      storageError === "corrupt"
        ? "Saved Test Camp data could not be read. This session is temporary; the saved copy has been preserved."
        : "Device storage unavailable. This session is temporary.",
    );
})();
