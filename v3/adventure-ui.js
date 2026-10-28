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
  function townPlans(s) {
    const L=window.V52TownLife,b=L.book(s),safe=b===undefined||L.validBook(b);
    return `<section class="panel town-plan-catalog" id="town-plans" tabindex="-1"><h2>Your next Town day</h2><div class="town-role-key"><p><span class="role-chip role-customer">CUSTOMER</span> Start a plan at home. Travel, shop and return.</p><p><span class="role-chip role-worker">EMPLOYEE</span> Enter a business on the map. Help customers and work out pay.</p></div><p>Start at home as a customer, or enter a business on the map to work there. Each plan keeps its own money, clock, inventory and receipts. You can leave and resume any plan.</p>${!safe?'<p role="status">An unfamiliar saved Town plan has been preserved. New plans are paused; the original journey and other worlds remain available.</p>':''}${['Cooking','Shopping','Travel','Employment','Everyday errands'].map(category=>`<details><summary>${category} · ${L.catalog.filter(c=>c.category===category).length} plans</summary><div class="town-plan-grid">${L.catalog.filter(c=>c.category===category).map(c=>{const runs=safe?Object.values(b?.runs||{}).filter(r=>r.scenario===c.id):[],last=runs.at(-1);return `<article><h3>${esc(c.name)}</h3><p class="small">${last?last.done?'Completed · try fresh values':`Saved at stage ${last.stage+1} of ${last.steps.length}`:'A new practical adventure'}</p>${button(last&&!last.done?'Resume '+c.name:last?'Replay '+c.name:'Start '+c.name,`j-${last?.done?'replay':'plan'}:${c.id}`,'',!safe)}</article>`;}).join('')}</div></details>`).join('')}</section>`;
  }
  function board(s, w) {
    const a = M.state(s),
      tier = a.difficulty[w.id] || M.recommendation(s, w.id),
      rs = M.routes(w.id);
    return `${w.id==="town"?`${townPlans(s)}<section class="panel journey-invitation"><span class="badge">A CONNECTED ADVENTURE</span><h2>From cupboard to kitchen.</h2><p>Make a shopping list, catch the bus, shop as a customer and bring the ingredients home. Map business entrances start a full worker day. The original learning visits below remain available.</p>${button(s.adventure?.journeyV1?"Continue recipe journey":"Start a Bolognese journey","j-start:bolognese","primary")}${!s.adventure?.journeyV1?button("Choose the lentil recipe","j-start:lentil"):""}</section>`:""}<section class="mission-board"><div class="section-head"><div><div class="eyebrow">${w.id === "town" ? "THE HIGH STREET" : "MORE ADVENTURES WITH " + w.guide.toUpperCase()}</div><h2>${w.id === "town" ? "A town full of possibilities." : "Optional missions to explore."}</h2><p class="muted">${w.id === "town" ? "Choose home for customer plans, or enter a business to work. Short maths visits remain available below." : esc(M.stories[w.id].intro)}</p></div><label>Mission difficulty<select data-mission-tier="${w.id}">${difficulty.map((label, i) => `<option value="${i + 1}" ${tier === i + 1 ? "selected" : ""}>${i + 1} · ${label}</option>`).join("")}</select></label></div><p class="small muted">Suggested level ${M.recommendation(s, w.id)} from discovery and independent evidence. Guided visits do not establish ability. Choose any level; a hint is always welcome. Completed missions return with fresh values.</p>${w.id === "town" ? `${window.V6SceneUI ? window.V6SceneUI.townMap(s,rs.filter(r=>!r.contentVersion),tier) : `<div class="town-explore-map">${A.townScene(M.visualLevel(s, "town"), M.completions(s, "town").length, [...new Set(M.completions(s, "town").map((r) => r.route))])}<div class="town-hotspots">${rs.map((r, i) => `<button ${r.id==='home'?'data-ui="choose-town-plan"':'data-action="'+(window.V52TownLife.jobs.some(j=>j.id===r.id)?`j-work:${r.id}:${tier}`:`mission:town:${r.id}:${tier}`)+'"'} style="left:${(A.townPlots[i].x+60)/12}%;top:${(A.townPlots[i].y+35)/9}%" aria-label="Enter ${esc(r.name)}"><span>${esc(r.name)}</span></button>`).join("")}</div></div>`}` : ""}<div class="${w.id === "town" ? "town-locations" : "expedition-grid"}">${rs
      .map((r, i) => {
        const routeTier=a.difficulty[w.id] || M.recommendation(s,w.id,r.id);
        const rec = M.entry(s, w.id, r.id, routeTier),
          suspended =
            a.active?.key === M.id(w.id, r.id, routeTier) ||
            a.suspended[M.id(w.id, r.id, routeTier)];
        return `<article class="location-card" style="--location-color:${w.color}">${w.id==='town'?`<div class="location-vista">${A.exterior(r.id)}</div>`:''}<div class="location-sign"><span aria-hidden="true">${w.id === "town" ? T.venues[i]?.icon || "◇" : "◇"}</span><span>${String(i + 1).padStart(2, "0")}</span></div><div class="location-body"><span class="badge">${rec ? "VISIT COMPLETE" : "MEET " + esc(r.guide.toUpperCase())}</span><h3>${esc(r.name)}</h3><p class="small muted">${esc(r.story)}</p><p class="small">Keepsake: ${esc(r.artefact)}${r.contentVersion?" · About 5–10 minutes; pause after any task.":""}</p><div class="tier-stars" aria-label="Completed difficulty levels">${[1, 2, 3].map((level) => `<span>${M.entry(s, w.id, r.id, level) ? "◆" : "◇"} ${level}</span>`).join("")}</div>${button(suspended ? "Resume visit →" : rec ? "Revisit with new tasks →" : "Visit " + r.name + " →", `mission:${w.id}:${r.id}:${routeTier}`, "primary wide")}</div></article>`;
      })
      .join(
        "",
      )}</div><article class="gateway panel"><div><span class="badge">OPTIONAL · NO TIMER</span><h3>${w.id === "town" ? "Town Festival Challenge" : w.name + " Gateway"}</h3><p class="muted">Bring several ideas together in about 20 minutes to earn a gateway crest. Take hints, pause or leave whenever you like. This is guided adventure, separate from academic mastery.</p></div>${button(M.entry(s, w.id, "gateway", tier) ? "Revisit gateway" : "Try the gateway", `mission:${w.id}:gateway:${tier}`)}</article></section>`;
  }
  function scalar(q, t, model=true) {
    const v = q.values.amount ?? 0;
    return `${model ? window.V5HandsOn.render(q,t)||"" : ""}<div class="amount-editor">${window.V5HandsOn.numericInput(t,v,q.values.amountDraft)}<div class="stepper">${button("−", "m-adjust:" + -(t.step || 1), "", v <= (t.min ?? 0))}${button("+", "m-adjust:" + (t.step || 1), "", v >= t.max)}</div><p class="amount-display" aria-live="polite">${t.unit === "p" ? money(v) : t.unit === "time" ? T.clock(v) : v + " " + esc(t.unit || "units")}</p></div>`;
  }
  function items(q, t) {
    const parts = q.values.parts || Array(t.items.length).fill(0),
      total = t.items.reduce(
        (sum, item, i) => sum + (parts[i] || 0) * item.price,
        0,
      );
    if(t.visualContext){
      const stock=t.visualContext==='stock',list=t.visualContext==='list';
      return `<div class="town-stock-scene ${stock?'kitchen-stock':list?'shopping-notepad':'supermarket-shelves'}"><h3>${stock?'Cupboards and fridge':list?'Your shopping notepad':'Supermarket shelves'}</h3><p>${stock?'Count what is already here. Tap each product to record one.':list?'Tap a product to add one to your list.':'Tap a shelf product to collect one. Tap its basket entry to put one back.'}</p><div class="product-shelves">${t.items.map((item,i)=>`<section class="shelf-product ${stock&&/milk|cheese|mince/i.test(item.name)?'fridge-compartment':'cupboard-compartment'}">${stock?`<details class="stock-door"><summary>Open ${/milk|cheese|mince/i.test(item.name)?'fridge':'cupboard'} · ${esc(item.name)}</summary>${window.V6AssetArt?window.V6AssetArt.img(/milk|cheese|mince/i.test(item.name)?'fridge':'pantry','storage-prop','Open storage illustration')+'<p class="small">Storage illustration. Count only the task stock below.</p>':''}<strong>${/milk|cheese|mince/i.test(item.name)?'Fridge':'Cupboard'}</strong><div class="stock-objects" aria-label="${esc(item.name)} in stock: ${t.stock?.[item.name]||0}">${Array.from({length:t.stock?.[item.name]||0},()=>`<span>${A.product(item.name,i)}</span>`).join('')||'<span>Empty</span>'}</div>`:''}<button data-action="m-part:${i}:1" class="collect-product"><span class="product-art">${A.product(item.name,i)}</span><strong>${esc(item.name)}</strong>${stock||list?'':`<span>${money(item.price)}</span>`}<span>${stock?'Record one':list?'List one':'Collect one'}</span></button>${stock?'</details>':''}</section>`).join('')}</div><div class="basket-model" role="group" aria-label="${stock?'Recorded stock':list?'Shopping list':'Shopping basket'}"><h3>${stock?'Recorded stock':list?'List quantities':'Your basket'}</h3>${t.items.map((item,i)=>`<button data-action="m-part:${i}:-1" aria-label="Remove one ${esc(item.name)}" ${parts[i]?'':'disabled'}>${esc(item.name)} × ${parts[i]||0}</button>`).join('')}</div>${stock||list?'':`<p class="receipt">Basket ${money(total)}${t.budget?' · Budget '+money(t.budget)+' · '+(total<=t.budget?money(t.budget-total)+' left':'Over budget'):''}</p>`}</div>`;
    }
    return `<div class="shop-counter">${t.items.map((item, i) => `<div class="counter-product"><div class="product-art product-${i}" aria-hidden="true">${A.product(item.name,i)}</div><strong>${esc(item.name)}</strong><span class="small muted">${money(item.price)}${item.quantity ? " / pack" : ""}</span><div class="counter-controls">${button("Put one back", "m-part:" + i + ":-1", "", !parts[i])}<output aria-label="${esc(item.name)} quantity">${parts[i] || 0}</output>${button("Collect one", "m-part:" + i + ":1", "collect-product", (parts[i] || 0) >= 12)}</div></div>`).join("")}</div><div class="receipt"><strong>Basket total ${money(total)}</strong>${t.budget ? `<span>Budget ${money(t.budget)} · ${total <= t.budget ? money(t.budget - total) + " left" : "over budget — adjust your order"}</span>` : `<span>${t.need===undefined ? "Check each quantity against your list or inventory." : t.items.reduce((sum, item, i) => sum + (parts[i] || 0) * (item.quantity||1), 0)+" items · need at least "+t.need}</span>`}</div>`;
  }
  function recipe(card){if(!card)return '';return `<details class="recipe-card"><summary>Open recipe card · ${esc(card.name)}</summary><p>Recipe for ${card.basePortions} portions · making ${card.portions} portions</p><table><caption>Ingredients</caption><thead><tr><th>Ingredient</th><th>For 2 portions</th></tr></thead><tbody>${card.ingredients.map(i=>`<tr><td>${esc(i.name)}</td><td>${i.base}</td></tr>`).join('')}</tbody></table><ol>${card.prep.map(p=>`<li>${esc(p)}</li>`).join('')}</ol><p>${card.prepMinutes?'Allow '+card.prepMinutes+' minutes of preparation. ':''}Measure ${card.ml} ml of ${esc(card.liquid)}. Use the ${esc(card.method)} at the supplied ${card.temperature} °C for ${card.minutes} minutes.</p><p class="small">${esc(card.safety)}</p></details>`;}
  function controls(q, t) {
    if(t.direct)return window.V9Touch.render(t.direct,q.values,"d9-m");
    if(t.kind === "curriculum")return window.V8Activities.render(t,q.values);
    let html = "";
    const v = q.values.amount || 0;
    const custom=window.V5HandsOn.render(q,t);
    if(custom && !['bank','bill','payslip','timesheet','discount'].includes(t.kind))
      return custom;
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
        html = `<div class="envelopes">${labels.map((label, i) => `<section><strong>${esc(label)}</strong><output>${t.kind === "budget" ? money(parts[i] || 0) : parts[i] || 0}</output><div class="counter-controls">${button("−", `m-part:${i}:${t.kind === "budget" ? -(t.step||100) : -1}`, "", !parts[i])}${button("+", `m-part:${i}:${t.kind === "budget" ? (t.step||100) : 1}`, "", (parts[i] || 0) >= (t.kind === "budget" ? t.budget : 9))}${t.kind === "budget" ? (t.step<100?button("+ £1",`m-part:${i}:100`, "",(parts[i] || 0)>=t.budget):"")+button("+ £5",`m-part:${i}:500`, "",(parts[i] || 0)>=t.budget)+button("+ £10",`m-part:${i}:1000`, "",(parts[i] || 0)>=t.budget) : ""}</div></section>`).join("")}</div><p class="receipt">${t.kind === "budget" ? "Allocated " + money(parts.reduce((a, b) => a + b, 0)) + " of " + money(t.budget) : "Packed " + ((parts[0] || 0) * 100 + (parts[1] || 0) * 10 + (parts[2] || 0)) + " units"}</p>`;
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
      case "choice":
        if(t.visualContext==='temperature') {
          html=`<div class="cooking-equipment" data-mechanic="temperature-dial"><h3>${esc(t.equipment)} controls</h3><div class="cooker-window" aria-live="polite"><span aria-hidden="true">▤</span><output>${q.values.choice==null?'Temperature not set':esc(t.options[q.values.choice].name)}</output></div><p>Tap a temperature mark to set the cooking control.</p><div class="temperature-dial" role="group" aria-label="Cooking temperature control">${t.options.map((o,i)=>`<button data-action="m-choice:${i}" aria-pressed="${q.values.choice===i}">${esc(o.name)}</button>`).join('')}</div></div>`;break;
        }
        html = `<div class="timetable" role="group" aria-label="Choose an option">${t.options.map((r,i)=>`<button class="journey-option" data-action="m-choice:${i}" aria-pressed="${q.values.choice===i}"><strong>${esc(r.name)}</strong>${r.detail?`<span>${esc(r.detail)}</span>`:""}${r.price?`<span>${money(r.price)}</span>`:""}</button>`).join('')}</div>`;
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
        html = `<div class="planning-clock"><strong class="clock-display">${T.clock(v)}</strong><span>${t.unit==="minutes"?"Duration in hours and minutes":"24-hour time"}</span></div><label for="arrival-time">Set ${t.unit==="minutes"?"the duration":"the time"}</label><input id="arrival-time" data-mission-clock="true" type="time" value="${esc(q.values.clockDraft ?? T.clock(v))}" aria-invalid="${window.V5HandsOn.invalidDraft(q.values,t)}" aria-describedby="clock-help" step="60"><p id="clock-help" class="small">Choose a complete 24-hour time before submitting.</p><div class="actions">${button("− 1 hour", "m-adjust:-60")}${button("+ 1 hour", "m-adjust:60")}${button("− 5 minutes", "m-adjust:-5")}${button("+ 5 minutes", "m-adjust:5")}${button("− 1 minute", "m-adjust:-1")}${button("+ 1 minute", "m-adjust:1")}</div>`;
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
      r = q.restoration?{name:`Restore ${w.name} · stage ${q.restoration.stage+1}`,story:"Apply your assessed objectives. About 15–20 minutes, no timer. Pause after any task; this is not a mastery check."}:M.routes(q.world).find((r) => r.id === q.route),
      t = q.tasks[q.i];
    return `<div class="section-head"><div><div class="eyebrow">${esc(w.name)} · LEVEL ${q.tier}</div><h1>${esc(r?.name || "Gateway challenge")}</h1></div>${button("Save & exit", "nav:home")}</div><div class="quest-layout world-stage stage-${q.world} venue-${q.route} ${q.solved ? "stage-restored" : ""}"><aside class="stage-vista">${q.world==="town" && q.route!=="gateway" && !q.restoration ? `<div class="venue-view-controls"><span>${exterior ? "OUTSIDE" : "INSIDE"} · ${esc(r.name)}</span>${button(exterior?"Go inside":"View exterior",exterior?"venue-view:interior":"venue-view:exterior")}</div>` : ""}<div class="hero-art">${q.world === "town" && q.route !== "gateway" && !q.restoration ? (q.contentVersion===8 && q.route.startsWith("curr-") ? A.location("home",q) : exterior ? A.exterior(q.route) : A.location(q.route,q)) : A.scene(q.world, M.visualLevel(s, q.world, E.count(s, q.world))).replace('viewBox="0 0 900 560"', 'viewBox="0 110 900 380" preserveAspectRatio="xMidYMid slice"')}</div><div class="panel guide" style="margin-top:18px">${A.guide(r?.guide || w.guide)}<div><h3>${esc(r?.guide || w.guide)}, your guide</h3><p>${q.world==="town"?`<span class="badge">${esc(q.context?.role || "worker")} context</span>`:""}${esc(q.route === "gateway" ? "Connected challenges. About 20 minutes; pause after any task. No timer." : r.story)}</p></div></div><div class="toolbar" style="margin-top:18px">${A.explorer(s, true)}<span class="badge">TASK ${q.i + 1} / ${q.tasks.length}</span></div><p class="small muted">Adventure progress is saved separately from independent maths mastery.</p></aside><section class="panel mission-task stage-workbench"><p class="small">Task ${q.i + 1} of ${q.tasks.length} · Pause whenever you need.</p><div class="eyebrow">${q.phase === "lesson" ? "FIRST, BUILD THE IDEA" : "YOUR PLAN IN ACTION"}</div><h2>${esc(t.prompt)}</h2>${q.phase === "lesson" ? `${q.feedback ? `<p class="feedback" role="status">${esc(q.feedback)}</p>` : ""}<p class="lesson-copy">${esc(t.teach)}</p><div class="feedback"><strong>An easier example</strong><p>${esc(t.example)}</p></div><div class="actions">${button("Try this task →", "m-begin", "primary")}</div>` : `<div class="task-controls" ${q.solved ? "inert" : ""}>${controls(q, t)}</div>${q.solved ? `<div class="feedback" role="status">${esc(q.feedback)}</div><div class="actions">${button(q.i < q.tasks.length - 1 ? "Next task →" : "Complete visit →", "m-next", "primary")}</div>` : `<div class="actions">${button("Check answer", "m-submit", "primary")}${button("Hint", "m-help")}${button("I don’t know", "m-worked")}</div>${q.feedback ? `<div class="feedback" role="status">${esc(q.feedback)}</div>` : ""}<details><summary>See the easier example again</summary><p>${esc(t.example)}</p></details>`}`}</section></div>`;
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
  window.V3AdventureUI = { board, play, collection, suggestion, controls, recipe };
})();
