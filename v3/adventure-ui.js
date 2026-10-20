/* Tap-first mission screens. All actions also work with keyboard activation. */
(function () {
  "use strict";
  const M = window.V3Adventure,
    T = window.V3Town,
    A = window.V3Art,
    E = window.V3Engine,
    esc = A.esc,
    money = T.money;
  const button = (label, act, cls = "", disabled = false) =>
    `<button data-action="${esc(act)}" class="${cls}" ${disabled ? "disabled" : ""}>${label}</button>`;
  const difficulty = [
    "Getting started",
    "Finding your feet",
    "Ready for a challenge",
  ];
  function board(s, w) {
    const a = M.state(s),
      tier = a.difficulty[w.id] || M.recommendation(s, w.id),
      rs = M.routes(w.id);
    return `<section class="mission-board"><div class="section-head"><div><div class="eyebrow">${w.id === "town" ? "THE HIGH STREET" : "MORE ADVENTURES WITH " + w.guide.toUpperCase()}</div><h2>${w.id === "town" ? "A town full of possibilities." : "The story keeps growing."}</h2><p class="muted">${w.id === "town" ? "Choose a place to visit. Each visit has three hands-on tasks, with teaching first." : esc(M.stories[w.id].intro)}</p></div><label>Mission difficulty<select data-mission-tier="${w.id}">${difficulty.map((label, i) => `<option value="${i + 1}" ${tier === i + 1 ? "selected" : ""}>${i + 1} · ${label}</option>`).join("")}</select></label></div><p class="small muted">Suggested level ${M.recommendation(s, w.id)} from your recent missions. Choose any level; a hint is always welcome. Completed missions return with fresh values.</p>${w.id === "town" ? `<div class="town-explore-map">${A.townScene(M.visualLevel(s, "town"), M.completions(s, "town").length, [...new Set(M.completions(s, "town").map((r) => r.route))])}<div class="town-hotspots">${rs.map((r, i) => `<button data-action="mission:town:${r.id}:${tier}" style="left:${(A.townPlots[i].x+60)/12}%;top:${(A.townPlots[i].y+35)/9}%" aria-label="Enter ${esc(r.name)}"><span aria-hidden="true">${i+1}</span><span class="sr-only">${esc(r.name)}</span></button>`).join("")}</div></div>` : ""}<div class="${w.id === "town" ? "town-locations" : "expedition-grid"}">${rs
      .map((r, i) => {
        const rec = M.entry(s, w.id, r.id, tier),
          suspended =
            a.active?.key === M.id(w.id, r.id, tier) ||
            a.suspended[M.id(w.id, r.id, tier)];
        return `<article class="location-card" style="--location-color:${w.color}"><div class="location-sign"><span aria-hidden="true">${w.id === "town" ? T.venues[i].icon : "◇"}</span><span>${String(i + 1).padStart(2, "0")}</span></div><div class="location-body"><span class="badge">${rec ? "LANDMARK RESTORED" : "MEET " + esc(r.guide.toUpperCase())}</span><h3>${esc(r.name)}</h3><p class="small muted">${esc(r.story)}</p><p class="small">Keepsake: ${esc(r.artefact)}</p><div class="tier-stars" aria-label="Completed difficulty levels">${[1, 2, 3].map((level) => `<span>${M.entry(s, w.id, r.id, level) ? "◆" : "◇"} ${level}</span>`).join("")}</div>${button(suspended ? "Resume visit →" : rec ? "Revisit with new tasks →" : "Visit " + r.name + " →", `mission:${w.id}:${r.id}:${tier}`, "primary wide")}</div></article>`;
      })
      .join(
        "",
      )}</div><article class="gateway panel"><div><span class="badge">OPTIONAL · NO TIMER</span><h3>${w.id === "town" ? "Town Festival Challenge" : w.name + " Gateway"}</h3><p class="muted">Bring three ideas together to earn a gateway crest. Take hints, pause or leave whenever you like. This is guided adventure, separate from academic mastery.</p></div>${button(M.entry(s, w.id, "gateway", tier) ? "Revisit gateway" : "Try the gateway", `mission:${w.id}:gateway:${tier}`)}</article></section>`;
  }
  function scalar(q, t) {
    const v = q.values.amount ?? 0;
    return `<div class="amount-editor"><label for="mission-amount">${t.unit === "time" ? "Minutes after midnight (clock below)" : t.unit === "p" ? "Amount in pence (100p = £1)" : "Value in " + (t.unit || "units")}</label><div class="stepper">${button("−", "m-adjust:" + -t.step, "", v <= (t.min || 0))}<input id="mission-amount" data-mission-input="amount" type="number" inputmode="numeric" min="${t.min || 0}" max="${t.max}" step="1" value="${v}" aria-label="${t.unit === "p" ? "Amount in pence" : "Task value"}">${button("+", "m-adjust:" + t.step, "", v >= t.max)}</div><p class="amount-display" aria-live="polite">${t.unit === "p" ? money(v) : t.unit === "time" ? T.clock(v) : v + " " + esc(t.unit || "units")}</p></div>`;
  }
  function items(q, t) {
    const parts = q.values.parts || Array(t.items.length).fill(0),
      total = t.items.reduce(
        (sum, item, i) => sum + (parts[i] || 0) * item.price,
        0,
      );
    return `<div class="shop-counter">${t.items.map((item, i) => `<div class="counter-product"><div class="product-art product-${i}" aria-hidden="true">${A.product(item.name,i)}</div><strong>${esc(item.name)}</strong><span class="small muted">${money(item.price)}${item.quantity ? " / pack" : ""}</span><div class="counter-controls">${button("−", "m-part:" + i + ":-1", "", !parts[i])}<output aria-label="${esc(item.name)} quantity">${parts[i] || 0}</output>${button("+", "m-part:" + i + ":1", "", (parts[i] || 0) >= 12)}</div></div>`).join("")}</div><div class="receipt"><strong>Basket total ${money(total)}</strong>${t.budget ? `<span>Budget ${money(t.budget)} · ${total <= t.budget ? money(t.budget - total) + " left" : "over budget — adjust your order"}</span>` : `<span>${t.items.reduce((sum, item, i) => sum + (parts[i] || 0) * item.quantity, 0)} items · need at least ${t.need}</span>`}</div>`;
  }
  function controls(q, t) {
    let html = "";
    const v = q.values.amount || 0;
    switch (t.kind) {
      case "basket":
      case "offers":
        html = items(q, t);
        break;
      case "coins": {
        const coins = q.values.coins || [],
          total = coins.reduce((a, b) => a + b, 0);
        html = `<div class="money-tray" aria-label="UK money denominations">${[1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000].map((p) => button(`<span class="${p < 500 ? "coin" : "note"}">${p < 100 ? p + "p" : "£" + p / 100}</span>`, "m-coin:" + p, "money-button")).join("")}</div><p class="small muted">Original teaching tokens show UK denomination values; these are not banknote replicas.</p><div class="receipt"><strong>Change tray: ${money(total)}</strong><span>${coins.length} coins / notes selected</span></div><div class="actions">${button("Remove last", "m-coin:undo", "", !coins.length)}${button("Clear tray", "m-coin:clear", "", !coins.length)}</div>`;
        break;
      }
      case "budget":
      case "blocks": {
        const parts = q.values.parts || [0, 0, 0],
          labels =
            t.kind === "blocks" ? ["Hundreds", "Tens", "Ones"] : t.labels;
        html = `<div class="envelopes">${labels.map((label, i) => `<section><strong>${esc(label)}</strong><output>${t.kind === "budget" ? money(parts[i] || 0) : parts[i] || 0}</output><div class="counter-controls">${button("−", `m-part:${i}:${t.kind === "budget" ? -100 : -1}`, "", !parts[i])}${button("+", `m-part:${i}:${t.kind === "budget" ? 100 : 1}`, "", (parts[i] || 0) >= (t.kind === "budget" ? t.budget : 9))}</div></section>`).join("")}</div><p class="receipt">${t.kind === "budget" ? "Allocated " + money(parts.reduce((a, b) => a + b, 0)) + " of " + money(t.budget) : "Packed " + ((parts[0] || 0) * 100 + (parts[1] || 0) * 10 + (parts[2] || 0)) + " units"}</p>`;
        break;
      }
      case "line":
        html = `${A.worksite(q.world, "line", v, [], q.solved, t.min, t.max)}<p class="line-instruction">All destinations · ${t.min} to ${t.max} · choose a numbered stop below</p><div class="numberline" role="group" aria-label="Courier destinations">${Array.from(
          { length: t.max - t.min + 1 },
          (_, i) => i + t.min,
        )
          .map(
            (n) =>
              `<button data-action="m-value:${n}" aria-pressed="${v === n}">${n}</button>`,
          )
          .join("")}</div><p class="small">Destination marker: ${v}</p>`;
        break;
      case "fraction":
      case "chance":
        html = `<div class="parts mission-parts ${t.kind === "chance" ? "portal-pool" : "water-channels"}" role="group" aria-label="${t.kind === "fraction" ? "Irrigation channels" : "Equally likely portal slots"}">${Array.from({ length: t.total }, (_, i) => `<button class="part" data-action="m-select:${i}" aria-pressed="${(q.values.selected || []).includes(i)}" aria-label="${t.kind === "fraction" ? "Channel" : "Slot"} ${i + 1}">${t.kind === "fraction" ? "≈" : "◇"}</button>`).join("")}</div><p>${(q.values.selected || []).length} / ${t.total} selected</p>`;
        break;
      case "grid":
        html = `<div class="courtyard-grid" role="group" aria-label="Courtyard tiles, rows from top to bottom">${Array.from({ length: 25 }, (_, i) => `<button data-action="m-select:${i}" aria-label="Row ${Math.floor(i / 5) + 1}, column ${(i % 5) + 1}" aria-pressed="${(q.values.selected || []).includes(i)}">${(q.values.selected || []).includes(i) ? "▣" : "·"}</button>`).join("")}</div><p class="small">${(q.values.selected || []).length} square tiles laid</p>`;
        break;
      case "coordinate":
        html = `<div class="courtyard-grid coordinate-board" role="group" aria-label="Lift coordinates"><span class="sr-only">Rows run from y=${t.maxCoord ?? 4} at the top to y=${t.minCoord ?? 0} at the bottom.</span>${Array.from(
          { length: 25 },
          (_, i) => {
            const x = (t.minCoord ?? 0) + (i % 5),
              y = (t.maxCoord ?? 4) - Math.floor(i / 5);
            return `<button data-action="m-point:${x}:${y}" aria-label="Point (${x}, ${y})" aria-pressed="${q.values.point?.[0] === x && q.values.point?.[1] === y}">${x},${y}</button>`;
          },
        ).join("")}</div>`;
        break;
      case "rotate":
        html = `<div class="rotate-area"><div><div class="shape" style="--turn:0deg" aria-hidden="true">⌜</div><p>Start</p></div><div><div class="shape" style="--turn:${v}deg" aria-hidden="true">⌜</div><p>Turned ${v}°</p></div></div><div class="actions">${button("↻ Turn clockwise 90°", "m-turn")}${button("↺ Turn anticlockwise 90°", "m-turn-back")}${button("Reset piece", "m-value:0")}</div>`;
        break;
      case "journey":
        html = `<div class="timetable" role="group" aria-label="Choose a journey">${t.options.map((r, i) => `<button class="journey-option" data-action="m-choice:${i}" aria-pressed="${q.values.choice === i}"><strong>${r.name}</strong><span>${T.clock(r.depart)} → ${T.clock(r.arrive)}</span><span>${money(r.price)}</span></button>`).join("")}</div><p class="small">Arrival deadline ${T.clock(t.deadline)} including a ${t.walk}-minute walk.</p>`;
        break;
      case "bank":
        html = `<div class="bank-ledger"><div>Starting balance <strong>${money(t.balance)}</strong></div>${t.transactions.map((r, i) => `<div class="transaction"><span>${r.name} ${money(Math.abs(r.amount))}</span>${button((q.values.posted || 0) > i ? "Posted" : "Post transaction", "m-post:" + i, "", (q.values.posted || 0) !== i)}</div>`).join("")}</div>${scalar(q, t)}`;
        break;
      case "bill":
        html = `<div class="invoice"><h3>Community House · fictional bill</h3><dl><dt>Previous reading</dt><dd>${t.previous} kWh</dd><dt>Current reading</dt><dd>${t.current} kWh</dd><dt>Unit price</dt><dd>${t.rate}p / kWh</dd><dt>Standing charge</dt><dd>${t.standing}p for one day</dd></dl></div>${scalar(q, t)}`;
        break;
      case "payslip":
        html = `<div class="invoice"><h3>Workshop · fictional payslip</h3><dl><dt>Gross pay</dt><dd>${money(t.gross)}</dd><dt>Supplied deduction</dt><dd>${money(t.deduction)}</dd><dt>Net pay</dt><dd>${money(v)}</dd></dl><p class="small muted">The deduction is supplied for this exercise. It is not a tax calculation.</p></div>${scalar(q, t)}`;
        break;
      case "timesheet":
        html = `<div class="invoice"><h3>Your timesheet</h3><p>${T.clock(t.start)} → ${T.clock(t.finish)} · unpaid break ${t.breakMinutes} minutes</p><p>${money(t.rate)} per paid hour</p></div>${scalar(q, t)}`;
        break;
      case "discount":
        html = `<div class="sale-tag"><span>ORIGINAL ${money(t.original)}</span><strong>${t.rate}% OFF</strong><span>Your label: ${money(v)}</span></div>${scalar(q, t)}`;
        break;
      case "balance":
        html = `<div class="balance-scene" role="img" aria-label="Left balance ${t.coefficient} times ${v} plus ${t.add}; right ${t.total}"><div>${t.coefficient} × <strong>${v}</strong> + ${t.add}</div><span>⚖</span><div>${t.total}</div></div>${scalar(q, t)}`;
        break;
      case "bars":
        html = `<div class="puzzle-bars" role="img" aria-label="Neighbourhood data ${t.values.join(", ")}. Mean bar ${v}">${[...t.values, v].map((n, i) => `<span style="height:${Math.max(16, n * 7)}px;${i === 3 ? "background:#d5b572" : ""}">${n}</span>`).join("")}</div>${scalar(q, t)}`;
        break;
      case "ratio":
        html = `<p>Green crates: ${t.green}</p><div class="token-row" aria-hidden="true">${'<span class="token"></span>'.repeat(t.green)}${'<span class="token blue"></span>'.repeat(v)}</div><p>Blue crates: ${v}</p>${scalar(q, t)}`;
        break;
      case "sequence":
        html = `<div class="sequence-rail">${t.values.map((n) => "<span>" + n + "</span>").join("")}<span class="new-carriage">${v}</span></div>${scalar(q, t)}`;
        break;
      case "clock":
        html = `<div class="planning-clock"><strong class="clock-display">${T.clock(v)}</strong><span>24-hour arrival time</span></div><label for="arrival-time">Set your arrival time</label><input id="arrival-time" data-mission-clock="true" type="time" value="${T.clock(v)}" step="60"><div class="actions">${button("− 1 hour", "m-adjust:-60")}${button("+ 1 hour", "m-adjust:60")}${button("+ 5 minutes", "m-adjust:5")}</div>`;
        break;
      case "measure":
        html = `<div class="measuring-jug" role="img" aria-label="Container ${v} ${esc(t.unit)} out of ${t.max}"><div style="height:${Math.min(100, (v / t.max) * 100)}%"></div><span>${v} ${esc(t.unit)}</span></div>${scalar(q, t)}`;
        break;
      default:
        html = scalar(q, t);
    }
    return html;
  }
  function play(s,exterior=false) {
    const q = M.current(s),
      w = E.worlds.find((w) => w.id === q.world),
      r = M.routes(q.world).find((r) => r.id === q.route),
      t = q.tasks[q.i];
    return `<div class="section-head"><div><div class="eyebrow">${esc(w.name)} · LEVEL ${q.tier}</div><h1>${esc(r?.name || "Gateway challenge")}</h1></div>${button("Save & exit", "nav:home")}</div><div class="quest-layout world-stage stage-${q.world} venue-${q.route} ${q.solved ? "stage-restored" : ""}"><aside class="stage-vista">${q.world==="town" && q.route!=="gateway" ? `<div class="venue-view-controls"><span>${exterior ? "OUTSIDE" : "INSIDE"} · ${esc(r.name)}</span>${button(exterior?"Go inside":"View exterior",exterior?"venue-view:interior":"venue-view:exterior")}</div>` : ""}<div class="hero-art">${q.world === "town" && q.route !== "gateway" ? (exterior ? A.exterior(q.route) : A.location(q.route,q)) : A.scene(q.world, M.visualLevel(s, q.world, E.count(s, q.world))).replace('viewBox="0 0 900 560"', 'viewBox="0 110 900 380" preserveAspectRatio="xMidYMid slice"')}</div><div class="panel guide" style="margin-top:18px">${A.guide(r?.guide || w.guide)}<div><h3>${esc(r?.guide || w.guide)}, your guide</h3><p>${esc(q.route === "gateway" ? "Three connected challenges. No timer, no pressure." : r.story)}</p></div></div><div class="toolbar" style="margin-top:18px">${A.explorer(s, true)}<span class="badge">TASK ${q.i + 1} / 3</span></div><p class="small muted">Adventure progress is saved separately from independent maths mastery.</p></aside><section class="panel mission-task stage-workbench"><div class="eyebrow">${q.phase === "lesson" ? "FIRST, BUILD THE IDEA" : "YOUR PLAN IN ACTION"}</div><h2>${esc(t.prompt)}</h2>${q.phase === "lesson" ? `<p class="lesson-copy">${esc(t.teach)}</p><div class="feedback"><strong>An easier example</strong><p>${esc(t.example)}</p></div><div class="actions">${button("Try this task →", "m-begin", "primary")}</div>` : `<div class="task-controls" ${q.solved ? "inert" : ""}>${controls(q, t)}</div>${q.solved ? `<div class="feedback" role="status">${esc(q.feedback)}</div><div class="actions">${button(q.i < 2 ? "Next task →" : "Complete visit →", "m-next", "primary")}</div>` : `<div class="actions">${button("Try my plan", "m-submit", "primary")}${button("Hint", "m-help")}${button("I don’t know", "m-worked")}</div>${q.feedback ? `<div class="feedback" role="status">${esc(q.feedback)}</div>` : ""}<details><summary>See the easier example again</summary><p>${esc(t.example)}</p></details>`}`}</section></div>`;
  }
  function collection(s) {
    const cs = M.collections(s),
      a = M.state(s), estate = M.campProgress(s),
      projectBuilt = p => !!a.campProjects[p.id] || (p.id === "greenhouse" && estate.current.id >= 5);
    return `<section class="camp-workshop" aria-label="Camp workshop"><div class="camp-designer"><div class="section-head"><div><div class="eyebrow">PUT YOUR ADVENTURES ON DISPLAY</div><h2>Choose what belongs here.</h2></div><span class="badge">${cs.length} keepsakes found</span></div><div class="camp-placements">${["shelf", "garden", "gate"].map((slot,i) => {const c=cs.find(c=>c.id===a.camp[slot]);return `<section class="placement-site" id="camp-${slot}" tabindex="-1"><div class="display-plinth">${c ? A.keepsake(c) : '<span aria-hidden="true">◇</span>'}</div><label>${["Home shelf", "Camp garden", "Welcome gate"][i]}<select data-camp-slot="${slot}"><option value="">Leave empty</option>${cs.map((c) => `<option value="${esc(c.id)}" ${a.camp[slot] === c.id ? "selected" : ""}>${esc(c.name)}</option>`).join("")}</select></label><p class="small muted">${c ? esc(c.name) + " · brought home from " + esc(E.worlds.find(w=>w.id===c.world)?.name) : "Choose an earned keepsake to display here."}</p></section>`;}).join("")}</div><p class="small muted">Move keepsakes freely. Decorating never spends coins or awards XP.</p></div><section id="camp-projects" tabindex="-1"><div class="section-head"><div><div class="eyebrow">THE NEXT CHAPTER AT HOME</div><h2>Build something that stays.</h2></div></div><div class="expedition-grid camp-projects">${M.projects.map((p,i) => `<article class="panel project-site"><div class="project-art" aria-hidden="true">${A.project(p.id,!!projectBuilt(p))}</div><span class="badge">${projectBuilt(p) ? "BUILT · PART OF YOUR CAMP" : Math.min(M.campMilestones(s).length,p.need) + " / " + p.need + " LANDMARKS"}</span><h3>${esc(p.name)}</h3><p class="small muted">${esc(p.story)} Requires ${p.need} learning milestones.</p><div class="bar" aria-hidden="true"><span style="width:${projectBuilt(p) ? 100 : Math.min(100,M.campMilestones(s).length/p.need*100)}%"></span></div>${button(projectBuilt(p) ? (p.id === "greenhouse" && !a.campProjects[p.id] ? "Included with homestead" : "Built at camp") : M.campMilestones(s).length >= p.need ? "Build " + p.name : "Keep exploring", "camp-build:" + p.id, "", projectBuilt(p) || M.campMilestones(s).length < p.need)}</article>`).join("")}</div></section><details class="camp-journal"><summary>Open your keepsake collection · ${cs.length} discoveries</summary><p class="muted">Keepsakes come from complete three-task visits. Repeated clicks cannot create more.</p>${cs.length ? `<div class="collection-grid">${cs.map((c) => `<article class="keepsake">${A.keepsake(c)}<strong>${esc(c.name)}</strong><p class="small muted">${esc(E.worlds.find((w) => w.id === c.world)?.name)}</p></article>`).join("")}</div>` : '<p class="muted">Your first keepsake will arrive after a complete expedition or town visit.</p>'}</details></section>`;
  }

  function suggestion(s) {
    const k =
      window.V3Curriculum.skills.find((k) => s.checks[k.id]?.reteach) ||
      window.V3Curriculum.skills.find(
        (k) => s.checks[k.id]?.due && s.checks[k.id].due <= Date.now(),
      );
    if (!k) return "";
    const reteach = s.checks[k.id].reteach;
    return `<details class="practice-suggestion"><summary>A little practice you might like</summary><p class="small muted">${esc(k.name)} · ${reteach ? "Rebuild the idea with a lesson and easier example." : "Your memory check is ready when you are."}</p>${button(reteach ? "Revisit the lesson" : "Try a memory check", (reteach ? "learn:" : "check:") + k.id)}</details>`;
  }
  window.V3AdventureUI = { board, play, collection, suggestion };
})();
