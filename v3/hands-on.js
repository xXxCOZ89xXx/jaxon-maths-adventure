/* Versioned, data-driven manipulatives. State is plain JSON; no network or rewards. */
(function (root) {
  "use strict";
  const esc = (x) =>
    String(x ?? "").replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c],
    );
  const btn = (label, action, extra = "") =>
    `<button data-action="${esc(action)}" ${extra}>${label}</button>`;
  const money = (n) => "£" + (n / 100).toFixed(2),
    coins = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000];
  function enrich(t, world, route, tier, seed, stage) {
    t = { ...t };
    const n = seed * 7 + stage * 3 + Number(route || 0),
      base = {
        teach:
          "Move the objects to model the quantities. Check each part before trying your plan.",
        example:
          "Use small quantities first, then apply the same method to the task.",
        hint: "Check the quantities and their positions.",
      };
    const order = (items, values, prompt) => ({
      ...base,
      kind: "order",
      skill: t.skill,
      items,
      answer: values.map((v, i) => i).sort((a, b) => values[a] - values[b]),
      prompt,
      worked: "Compare each value and arrange them from smallest to largest.",
      max: 50,
    });
    if (world === "number" && route === "2" && stage === 0)
      t = order(
        [n + 9, n - 2, n + 3].map(String),
        [n + 9, n - 2, n + 3],
        "Arrange the supply labels from smallest to largest.",
      );
    if (world === "number" && route === "2" && stage === 1) {
      const rows = 2 + tier,
        cols = 2 + (seed % 4);
      t = {
        ...base,
        kind: "array",
        skill: "multiply",
        prompt: `Build ${rows} rows with ${cols} crates in each row.`,
        answer: [rows, cols, 0],
        rows,
        cols,
        max: 9,
        worked: `${rows} rows of ${cols} make ${rows * cols} crates.`,
      };
    }
    if (world === "algebra" && route === "1" && stage === 1)
      t = order(
        [t.values[2], t.values[0], t.answer, t.values[1]].map(String),
        [t.values[2], t.values[0], t.answer, t.values[1]],
        "Reconnect the numbered carriages in increasing sequence order.",
      );
    if (world === "fractions" && route === "1" && stage === 1) {
      const den = 4 + 2 * (seed % 3),
        nums = [den - 1, den / 2, 1];
      t = order(
        nums.map((x) => x + "/" + den),
        nums.map((x) => x / den),
        "Arrange these fraction bars from smallest to largest.",
      );
    }
    if (world === "fractions" && route === "1" && stage === 2) {
      const items =
          tier === 1 ? ["1/2", "1/4", "3/4"] : ["2/10", "4/10", "8/10"],
        v = tier === 1 ? [0.5, 0.25, 0.75] : [0.2, 0.4, 0.8],
        f = (n) => (seed % 2 ? String(n) : Math.round(n * 100) + "%");
      t = {
        ...base,
        kind: "match",
        skill: "decimals",
        items,
        labels: [f(v[2]), f(v[0]), f(v[1])],
        answer: [1, 2, 0],
        prompt:
          "Match each fraction with its equivalent decimal or percentage.",
        worked: items.map((x, i) => x + " = " + f(v[i])).join("; "),
        max: 9,
      };
    }
    if (world === "geometry" && route === "2" && stage === 0) {
      const minCoord = 1 - tier,
        x = minCoord + (seed % 5),
        y = minCoord + ((seed * 3) % 5);
      t = {
        ...base,
        kind: "coordinate",
        skill: "algebra_coordinates",
        prompt: `Place the bridge support at (${x}, ${y}). Read across, then up or down.`,
        answer: [x, y],
        minCoord,
        maxCoord: minCoord + 4,
        worked: `Go to x=${x}, then y=${y}.`,
      };
    }
    if (world === "geometry" && route === "2" && stage === 1) {
      const answer = 30 + ((seed + tier) % 5) * 20;
      t = {
        ...base,
        kind: "angle",
        skill: "geometry_angles",
        prompt: `Construct an angle of ${answer}° from the horizontal baseline.`,
        answer,
        min: 0,
        max: 180,
        step: 10,
        worked: `Read the protractor from zero on the right and move the ray to ${answer}°.`,
      };
    }
    if (world === "measure" && route === "2" && stage === 1) {
      const dims = [2 + tier, 2 + (seed % 3), 1 + (seed % 3)];
      t = {
        ...base,
        kind: "volume",
        skill: "measure_volume",
        prompt: `Build a cuboid with ${dims[0]} rows, ${dims[1]} columns and ${dims[2]} layers of unit cubes.`,
        answer: dims,
        max: 9,
        worked: `Rows × columns × layers: ${dims.join(" × ")} = ${dims.reduce((a, b) => a * b, 1)} cubic units.`,
        teach:
          "Each layer is an equal rectangular array. Multiplying its rows and columns gives cubes per layer; multiply again by the number of layers.",
        example: "Two layers of a 2 by 3 array contain 12 unit cubes.",
      };
    }
    if (world === "ratio" && route === "1" && stage === 1) {
      const g = 1 + tier + (seed % 3);
      t = {
        ...base,
        kind: "match",
        skill: "ratio_proportion",
        items: [
          "Flour: 2 scoops per batch",
          "Water: 3 cups per batch",
          "Herbs: 1 spoon per batch",
        ],
        labels: [`${g} spoons`, `${2 * g} scoops`, `${3 * g} cups`],
        answer: [1, 2, 0],
        prompt: `Match the ingredient quantities for ${g} batches.`,
        worked: `Multiply every per-batch quantity by ${g}.`,
        max: 9,
      };
    }
    if (world === "statistics" && route === "0" && stage === 0) {
      const values = [2 + (seed % 4), 3 + tier, 5 + (seed % 3)];
      t = {
        ...base,
        kind: "chart",
        skill: "stats_tables",
        labels: ["Red", "Blue", "Green"],
        answer: values,
        values,
        prompt: `Build a bar chart for the survey: Red ${values[0]}, Blue ${values[1]}, Green ${values[2]}.`,
        max: 12,
        worked:
          "Use the labelled vertical scale to give each category its recorded height.",
      };
    }
    if (world === "statistics" && route === "1" && stage === 1) {
      const x = 1 + (seed % 4),
        y = 1 + ((seed + tier) % 4);
      t = {
        ...base,
        kind: "coordinate",
        skill: "stats_tables",
        prompt: `Plot the observation: day ${x}, count ${y}.`,
        answer: [x, y],
        minCoord: 0,
        maxCoord: 4,
        worked: `Read day ${x} across and count ${y} vertically.`,
      };
    }
    if (world === "statistics" && route === "2" && stage === 1)
      t = order(
        [n + 6, n - 2, n + 2].map(String),
        [n + 6, n - 2, n + 2],
        "Arrange the survey counts in ascending order before comparing them.",
      );
    if (world === "probability" && route === "1" && stage === 1)
      t = {
        ...base,
        kind: "grid",
        skill: "prob_events",
        sample: true,
        labels: ["1", "2", "3", "4", "5", "6"],
        answer: [1, 3, 5],
        prompt:
          "A fair die has six equally likely outcomes. Mark every even outcome in the sample space.",
        worked:
          "Even outcomes can be shared into pairs without a remainder: 2, 4 and 6.",
        max: 6,
      };
    if (world === "town" && route === "shops" && stage === 1) {
      const price = 200 + ((50 * seed) % 400);
      t = {
        ...base,
        kind: "match",
        skill: "town_discounts",
        items: [
          `${money(price)} · half price`,
          `${money(price * 2)} · half price`,
          `${money(price * 4)} · half price`,
        ],
        labels: [money(price * 2), money(price / 2), money(price)],
        answer: [1, 2, 0],
        prompt: "Put the correct half-price label on each clothing rail.",
        worked:
          "Divide each original price by two. Match each resulting price to its rail.",
        max: 9,
      };
    }
    // Vary supply positions without changing the maths, and serialize the exact permutation.
    if (["order","match"].includes(t.kind)) {
      const supplied=t.kind==="order"?t.items:t.labels,permutation=supplied.map((_,i)=>i),originalAnswer=[...t.answer];
      let random=(Math.imul(seed,2654435761)+tier*97+stage*101+String(route).charCodeAt(0))>>>0;
      for(let i=permutation.length-1;i>0;i--){random=(Math.imul(random,1664525)+1013904223)>>>0;const j=random%(i+1);[permutation[i],permutation[j]]=[permutation[j],permutation[i]];}
      if(t.kind==="order")t.items=permutation.map(i=>supplied[i]);else t.labels=permutation.map(i=>supplied[i]);
      t.answer=originalAnswer.map(i=>permutation.indexOf(i));
    }
    if (t.kind === "order") {
      t.teach = world==='fractions'?'Compare equal-sized wholes using common denominators or equivalent fraction bars.':'Compare the numbers. Place the smallest first, then compare the remaining numbers.';
      t.example = world==='fractions'?'For a different set: 2/7 is smaller than 5/7 because 2 is smaller than 5.':'For a different set: 101, 104, 103 becomes 101, 103, 104.';
      t.worked =
        "From smallest: " + t.answer.map((i) => t.items[i]).join(", ") + ".";
    }
    if (t.kind === "match") {
      t.teach =
        world === "fractions"
          ? "Fractions, decimals and percentages can describe the same share of one whole. Divide the numerator by the denominator for a decimal; multiply by 100 for a percentage."
          : world === "ratio"
            ? "Multiply each per-batch quantity by the same number of batches. Match quantities with their units."
            : "Half price means divide the original price by two. Work in pence and match the calculated price to each rail.";
      t.example =
        world === "fractions"
          ? "For a different fraction: 3/8 = 0.375 = 37.5 percent."
          : world === "ratio"
            ? "Five batches using seven scoops each need 35 scoops."
            : "Half of £23.50 is £11.75.";
      t.worked=t.items.map((item,i)=>item+' → '+t.labels[t.answer[i]]).join('; ')+'.';
    }
    if (t.kind === "array") {
      t.teach =
        "An array has equal-length rows. Number of rows times crates per row gives the total.";
      t.example = "One row of seven crates shows 1 × 7 = 7.";
    }
    if (t.kind === "chart") {
      t.teach =
        "The horizontal labels identify categories. Each vertical tick is one observation. Set each bar to the recorded count.";
      t.example = "On a separate survey, 13 responses would need a bar reaching 13.";
    }
    if (t.kind === "coordinate") {
      t.teach =
        "The x-axis runs horizontally and the y-axis vertically. Start at the origin. Negative x moves left; negative y moves down.";
      t.example = "For a separate grid, (7, 6) is seven steps right and six steps up.";
    }
    if (t.kind === "angle") {
      t.teach =
        "Read degrees from zero on the right-hand baseline. A right angle is 90 degrees and a straight angle is 180.";
      t.example = "A separate example: 25 degrees is just over one quarter of a right angle.";
    }
    if (world === "probability" && route === "1" && stage === 1) {
      const labels =
        tier === 1
          ? ["1", "2", "3", "4", "5", "6"]
          : tier === 2
            ? ["H,1", "H,2", "T,1", "T,2"]
            : Array.from(
                { length: 9 },
                (_, i) => `${1 + Math.floor(i / 3)},${1 + (i % 3)}`,
              );
      const test =
        tier === 1
          ? (l) => Number(l) % 2 === seed % 2
          : tier === 2
            ? (l) => l.startsWith(seed % 2 ? "H" : "T")
            : (l) =>
                l
                  .split(",")
                  .map(Number)
                  .reduce((a, b) => a + b, 0) %
                  2 ===
                seed % 2;
      t = {
        ...t,
        labels,
        answer: labels.map((_, i) => i).filter((i) => test(labels[i])),
        prompt:
          tier === 1
            ? `Mark every ${seed % 2 ? "odd" : "even"} fair-die outcome.`
            : tier === 2
              ? `A fair coin and a fair two-section spinner form four equally likely pairs. Mark every pair with ${seed % 2 ? "heads" : "tails"}.`
              : `Two independent fair spinners each show 1, 2 or 3. Mark every pair with an ${seed % 2 ? "odd" : "even"} sum.`,
        teach:
          "List every equally likely outcome once. For two independent devices, pair each outcome of the first with every outcome of the second.",
        example:
          "A coin and a two-section spinner give H1, H2, T1 and T2: four equally likely pairs.",
        worked: "Favourable outcomes: "+labels.filter(test).join("; ")+". Each listed outcome is equally likely.",
      };
    }
    t.hint = t.teach;
    if(t.kind==='sequence')t.example='A separate train: 51, 54, 57. Each carriage adds 3, so connect 60 next.';
    if(t.kind==='balance')t.example='A separate balance: 2x + 3 = 29. Remove 3, then share 26 between 2 boxes: x = 13.';
    if(t.hint===t.teach)t.hint='Start with the known quantities and units. Which operation or placement does the task need?';
    t.interactionVersion = 1;
    return t;
  }
  function mechanic(t, world, route) {
    if (t.kind === "measure") return t.unit === "ml" ? "pour" : "ruler";
    if (t.kind === "chance")
      return route === "2" ? "spinner" : "probability-pool";
    if (t.kind === "grid") return t.sample ? "sample-space" : "area-tiles";
    if (t.kind === "order") return "ordering";
    if (t.kind === "match") return "matching";
    if (t.kind === "coordinate") return "cartesian";
    if (t.kind === "array") return "arrays";
    if (t.kind === "volume") return "volume-blocks";
    if (t.kind === "balance") return "algebra-tiles";
    if (t.kind === "ratio") return "ratio-groups";
    if (t.kind === "sequence") return "sequence-rail";
    if (t.kind === "bars" || t.kind === "chart") return "bar-chart";
    if (t.kind === "fraction") return "fraction-shading";
    if (t.kind === "blocks") return "place-value";
    if (t.kind === "line") return "number-line";
    if (t.kind === "rotate") return "rotation";
    if (t.kind === "angle") return "protractor";
    if (
      [
        "coins",
        "amount",
        "discount",
        "bill",
        "bank",
        "payslip",
        "timesheet",
      ].includes(t.kind) &&
      t.unit === "p"
    )
      return "money";
    if (t.kind === "basket" || t.kind === "offers") return "basket";
    if (t.kind === "budget") return "budget";
    if (t.kind === "clock") return "clock";
    return null;
  }
  function cartesian(t, point, act = "m-point") {
    const min = t.minCoord ?? 0,
      max = t.maxCoord ?? 4,
      span = max - min,
      size = 440,
      pad = 55,
      step = (size - 2 * pad) / span;
    const x = (n) => pad + (n - min) * step,
      y = (n) => size - pad - (n - min) * step;
    const lines = Array.from({ length: span + 1 }, (_, i) => {
      const n = min + i;
      return `<path d="M${x(n)} ${pad}V${size - pad}M${pad} ${y(n)}H${size - pad}" stroke="#b2c3ae"/><text x="${x(n)}" y="${y(0) + 24}" text-anchor="middle">${n}</text>${n ? `<text x="${x(0) - 18}" y="${y(n) + 5}" text-anchor="end">${n}</text>` : ""}`;
    }).join("");
    return `<div class="cartesian-plane" role="group" aria-label="Cartesian coordinate plane"><p>Read x across, then y vertically. Select an intersection; arrow keys move between points.</p><div class="cartesian-plot"><svg viewBox="0 0 440 440" aria-hidden="true">${lines}<path d="M${pad - 20} ${y(0)}H${size - pad + 25}m-10-5 10 5-10 5M${x(0)} ${size - pad + 20}V${pad - 25}m-5 10 5-10 5 10" fill="none" stroke="#214b39" stroke-width="3"/><text x="420" y="${y(0) - 12}">x</text><text x="${x(0) + 12}" y="22">y</text></svg>${Array.from(
      { length: (span + 1) ** 2 },
      (_, i) => {
        const a = min + (i % (span + 1)),
          b = max - Math.floor(i / (span + 1));
        return btn(
          '<span aria-hidden="true">•</span>',
          `${act}:${a}:${b}`,
          `class="cartesian-point" data-cx="${a}" data-cy="${b}" style="left:${x(a) / 4.4}%;top:${y(b) / 4.4}%" aria-label="Intersection x ${a}, y ${b}" aria-pressed="${point?.[0] === a && point?.[1] === b}"`,
        );
      },
    ).join(
      "",
    )}</div><output aria-live="polite">${point?.length === 2 ? "Selected point: (" + point.join(", ") + ")" : "No point selected yet"}</output></div>`;
  }
  function bars(parts, labels, max, act = "m-part") {
    return `<div class="construct-chart" role="group" aria-label="Build the chart"><div class="chart-scale" aria-hidden="true">${Array.from({ length: max + 1 }, (_, i) => `<span style="bottom:${(i / max) * 100}%">${i}</span>`).join("")}</div>${labels.map((label, i) => `<section><div class="chart-track"><div style="height:${((parts[i] || 0) / max) * 100}%"></div></div><strong>${esc(label)}: ${parts[i] || 0}</strong><div>${btn("−", `${act}:${i}:-1`, `aria-label="Remove one ${esc(label)}"`)}${btn("+", `${act}:${i}:1`, `aria-label="Add one ${esc(label)}"`)}</div></section>`).join("")}</div>`;
  }
  function visualTool(q,t) {
    const v=q.values.amount||0,parts=q.values.parts||[0,0,0];
    const slider=(max,step=1,unit='')=>`<label class="model-slider">Move the ${t.kind==='measure'?'scale marker':'pointer'}<input type="range" min="${t.min||0}" max="${max}" step="${step}" value="${v}" data-model-range="m-value" aria-label="Set ${esc(unit||t.unit||'value')}" /><output>${v} ${esc(unit||t.unit||'')}</output></label>`;
    if(t.kind==='clock') {
      const hour=Math.floor(v/60),minute=v%60;
      return `<div class="hands-on clock-workbench" data-mechanic="clock"><p>Tap an hour, then a minute mark. This clock uses 24-hour time.</p><div class="clock-face"><svg viewBox="0 0 260 260" role="img" aria-label="Clock showing ${String(hour).padStart(2,'0')}:${String(minute).padStart(2,'0')}"><circle cx="130" cy="130" r="112" fill="#f4efd9" stroke="#3a6040" stroke-width="6"/>${Array.from({length:12},(_,i)=>{const r=(i+1)*Math.PI/6;return `<text x="${130+91*Math.sin(r)}" y="${137-91*Math.cos(r)}" text-anchor="middle">${i+1}</text>`;}).join('')}<path d="M130 130l${52*Math.sin((hour%12+minute/60)*Math.PI/6)} ${-52*Math.cos((hour%12+minute/60)*Math.PI/6)}" stroke="#35543c" stroke-width="7"/><path d="M130 130l${78*Math.sin(minute*Math.PI/30)} ${-78*Math.cos(minute*Math.PI/30)}" stroke="#7b5830" stroke-width="4"/></svg><strong>${String(hour).padStart(2,'0')}:${String(minute).padStart(2,'0')}</strong></div><fieldset><legend>Hour</legend><div class="clock-marks">${Array.from({length:24},(_,h)=>btn(String(h).padStart(2,'0'),`m-value:${h*60+minute}`,`aria-label="Set hour ${h}" aria-pressed="${h===hour}"`)).join('')}</div></fieldset><fieldset><legend>Minute</legend><div class="clock-marks">${Array.from({length:12},(_,i)=>i*5).map(m=>btn(String(m).padStart(2,'0'),`m-value:${hour*60+m}`,`aria-label="Set minute ${m}" aria-pressed="${m===minute}"`)).join('')}</div></fieldset><div class="actions">${btn('One minute earlier',`m-value:${Math.max(0,v-1)}`)}${btn('One minute later',`m-value:${Math.min(1439,v+1)}`)}</div></div>`;
    }
    if(t.kind==='amount'&&t.unit&&t.unit!=='p')return `<div class="hands-on" data-mechanic="quantity-scale"><p>Move the marker to build your quantity in ${esc(t.unit)}.</p>${slider(Math.max(t.answer+10,Math.ceil(t.answer*1.5)),1,t.unit)}</div>`;
    if(t.kind==='sequence') {
      const choices=[...new Set([t.answer,...[-2,-1,1,2].map(n=>Math.max(0,Math.min(t.max,t.answer+n)))])];
      const sorted=choices.map((n,i)=>({n,key:Math.sin(n*17+t.values[0]*13+i)*100})).sort((a,b)=>a.key-b.key);
      return `<div class="hands-on train-yard" data-mechanic="sequence-rail"><p>Choose a loose carriage. Tap it to connect it at the end of the train.</p><div class="connected-train" aria-label="Connected train"><span class="train-engine" aria-hidden="true"><svg viewBox="0 0 90 70"><path d="M7 22h37v32H7ZM45 7h29v47H45ZM15 10h12v12H15Z" fill="#4b7744" stroke="#294d31" stroke-width="3"/><path d="M50 13h18v18H50Z" fill="#dce5bf"/><path d="M2 54h80l6 8H2Z" fill="#ad8c53"/><circle cx="20" cy="61" r="7" fill="#294336"/><circle cx="61" cy="61" r="7" fill="#294336"/></svg></span>${t.values.map(n=>`<span class="train-cart">${n}</span>`).join('')}<span class="train-cart train-slot" aria-label="Last connected carriage">${q.values.amount==null?'?':v}</span></div><div class="loose-carriages" role="group" aria-label="Loose train carriages">${sorted.map(({n})=>btn(`<span class="cart-body">${n}</span><span class="cart-wheels" aria-hidden="true">● &nbsp; ●</span>`,`m-value:${n}`,`class="train-cart" aria-pressed="${q.values.amount===n}" aria-label="Connect carriage ${n}"`)).join('')}</div></div>`;
    }
    if(t.kind==='array'||t.kind==='volume')return `<div class="hands-on" data-mechanic="${t.kind==='array'?'crate-array':'volume-layers'}"><p>Tap the far corner of your rectangle to build its rows and columns.</p><div class="build-array" role="group" aria-label="Build rows and columns">${Array.from({length:81},(_,i)=>{const r=Math.floor(i/9)+1,c=i%9+1;return btn('▣',`m-array:${r}:${c}`,`aria-label="Build ${r} rows and ${c} columns" aria-pressed="${r<=parts[0]&&c<=parts[1]}"`);}).join('')}</div>${t.kind==='volume'?`<p>Choose the number of layers.</p><div class="layer-rack">${Array.from({length:9},(_,i)=>btn(`${i+1} layers`,`m-layer:${i+1}`,`aria-pressed="${parts[2]===i+1}"`)).join('')}</div>`:''}<output>${parts[0]||0} rows × ${parts[1]||0} columns${t.kind==='volume'?' × '+(parts[2]||0)+' layers':''} = ${(parts[0]||0)*(parts[1]||0)*(t.kind==='volume'?parts[2]||0:1)} unit blocks</output></div>`;
    if(t.kind==='chart')return `<div class="hands-on" data-mechanic="bar-chart"><p>Tap a height in each column to construct the chart.</p><div class="tap-chart" role="group" aria-label="Construct a bar chart">${t.labels.map((label,i)=>`<section><strong>${esc(label)}</strong><div class="tap-chart-column">${Array.from({length:t.max+1},(_,n)=>t.max-n).map(n=>btn(String(n),`m-chart:${i}:${n}`,`aria-label="Set ${esc(label)} to ${n}" aria-pressed="${(parts[i]||0)>=n}"`)).join('')}</div></section>`).join('')}</div></div>`;
    if(t.kind==='measure')return `<div class="hands-on" data-mechanic="${t.unit==='ml'?'pouring':'ruler'}"><p>${t.unit==='ml'?'Move the marker to fill the jug.':'Move the marker to set the end of the measured strip.'}</p>${t.unit==='ml'?`<div class="pour-model"><div class="pour-vessel" role="img" aria-label="Jug contains ${v} ml"><div style="height:${v/t.max*100}%"></div>${[0,1,2,3,4].map(i=>`<span style="bottom:${i*24}%">${Math.round(i*t.max/4)} ml</span>`).join('')}</div></div>`:`<div class="touch-ruler" role="img" aria-label="Strip length ${v} ${esc(t.unit)}"><div style="width:${v/t.max*100}%"></div>${[0,1,2,3,4].map(i=>`<span>${i*t.max/4}</span>`).join('')}</div>`}${slider(t.max,t.step||1,t.unit)}<div class="scale-stops">${Array.from({length:5},(_,i)=>Math.round(t.max*i/4/(t.step||1))*(t.step||1)).filter((n,i,a)=>a.indexOf(n)===i&&n<=t.max).map(n=>btn(n+' '+esc(t.unit),`m-value:${n}`)).join('')}</div></div>`;
    if(t.kind==='balance')return `<div class="hands-on" data-mechanic="tile-balance"><p>Select a unit bundle to place in every x box. Make the two pans equal.</p><div class="physical-balance"><div class="balance-pan">${Array.from({length:t.coefficient},()=>`<span class="unit-bundle">${'▪'.repeat(v)}<b>x = ${v}</b></span>`).join('')}<span>+ ${t.add} fixed units</span></div><span class="balance-beam" aria-hidden="true">⚖</span><div class="balance-pan">${t.total} units</div></div><div class="bundle-rack" role="group" aria-label="Unit bundles">${Array.from({length:(t.max??12)+1},(_,n)=>btn(`<span aria-hidden="true">${'▪'.repeat(n)||'□'}</span><b>${n} units</b>`,`m-value:${n}`,`aria-pressed="${q.values.amount===n}" aria-label="Place bundle of ${n} units"`)).join('')}</div></div>`;
    if(t.kind==='ratio')return `<div class="hands-on" data-mechanic="ratio-packs"><p>Tap a blue supply position to build that many blue crates. Compare them with the green supplies.</p><div class="ratio-packs"><section><strong>Green supplies: ${t.green}</strong><div>${'<i>▣</i>'.repeat(t.green)}</div></section><section><strong>Blue supplies: ${v}</strong><div class="crate-tray">${Array.from({length:t.max||30},(_,i)=>btn('▣',`m-value:${i+1}`,`aria-label="Place ${i+1} blue crates" aria-pressed="${i<v}"`)).join('')}</div>${btn('Empty blue tray','m-value:0')}</section></div></div>`;
    if(t.kind==='bars')return `<div class="hands-on" data-mechanic="bar-chart"><p>Build one equal-height mean bar from the recorded counts.</p><div class="puzzle-bars" role="img" aria-label="Recorded counts ${t.values.join(', ')} and your mean ${v}">${[...t.values,v].map(n=>`<span style="height:${Math.max(24,n*8)}px">${n}</span>`).join('')}</div>${slider(t.max,1,'units')}</div>`;
    if(t.kind==='angle')return `<div class="hands-on" data-mechanic="protractor"><svg viewBox="0 0 400 230" role="img" aria-label="Angle ${v} degrees"><path d="M30 200a170 170 0 0 1 340 0H30" fill="#e5ebd5" stroke="#36573e"/><path d="M370 200H200l${160*Math.cos(v*Math.PI/180)} ${-160*Math.sin(v*Math.PI/180)}" fill="none" stroke="#34563e" stroke-width="5"/><text x="200" y="70">${v}°</text></svg>${slider(180,1,'degrees')}</div>`;
    return null;
  }
  function render(q, t) {
    const v = q.values.amount || 0,
      parts = q.values.parts || [0, 0, 0],
      kind = mechanic(t, q.world, q.route);
    let body = "";
    const tool=visualTool(q,t);if(tool)return tool;
    if (t.kind === "coordinate")
      return (
        '<div class="hands-on" data-mechanic="cartesian">' +
        cartesian(t, q.values.point) +
        "</div>"
      );
    if (t.kind === "blocks") {
      body = `<div class="base-ten-model">${[100, 10, 1].map((unit, i) => `<section><strong>${["Hundreds", "Tens", "Ones"][i]}: ${parts[i] || 0}</strong><div class="base-ten-tray">${Array.from({ length: parts[i] || 0 }, () => `<span class="base-ten base-${unit}" aria-hidden="true">${unit === 100 ? "▦" : unit === 10 ? "▥" : "▪"}</span>`).join("")}</div>${btn("−", `m-part:${i}:-1`, `aria-label="Remove one ${["hundred", "ten", "one"][i]}"`)}${btn("+", `m-part:${i}:1`, `aria-label="Add one ${["hundred", "ten", "one"][i]}"`)}</section>`).join("")}</div><output>${(parts[0] || 0) * 100 + (parts[1] || 0) * 10 + (parts[2] || 0)} units</output>`;
    } else if (t.kind === "order" || t.kind === "match") {
      const order = q.values.order || [],
        picked = q.values.picked;
      const labels=t.labels||t.items,display=labels.map((_,i)=>i).sort((a,b)=>Math.sin((a+1)*73+t.prompt.length)-Math.sin((b+1)*73+t.prompt.length));
      if(display.every((x,i)=>x===t.answer[i]))display.push(display.shift());
      body = `<p>${esc(t.instruction || (t.kind === "order" ? "Tap a label, then a position. Order from smallest to largest." : "Tap a price or quantity, then its matching destination."))} Every label is used once.</p><div class="label-supply">${display.map((i) => {const label=labels[i];return btn(esc(label) + (/^\d+\/\d+$/.test(label) ? `<span class="fraction-mini" aria-hidden="true"><i style="width:${(label.split("/")[0] / label.split("/")[1]) * 100}%"></i></span>` : ""), `h-pick:${i}`, `aria-pressed="${picked === i}" class="movable-label"`);}).join("")}</div><div class="label-destinations">${t.items.map((label, i) => `<section><strong>${t.kind === "match" ? esc(label) : "Position " + (i + 1)}</strong>${btn(order[i] == null ? "Place selected label" : esc((t.labels || t.items)[order[i]]), `h-place:${i}`, `aria-label="Place label in position ${i + 1}" data-placed="${order[i]!=null}"`)}</section>`).join("")}</div>${btn("Clear placements", "h-clear")}`;
    } else if (t.kind === "array" || t.kind === "volume") {
      body = `<p>Build rows and columns; the total follows your arrangement.</p><div class="array-controls">${(t.kind === "volume" ? ["Rows", "Columns", "Layers"] : ["Rows", "Columns"]).map((x, i) => `<div><strong>${x}: ${parts[i] || 0}</strong>${btn("−", `m-part:${i}:-1`, `aria-label="Remove one ${x.toLowerCase()}"`)}${btn("+", `m-part:${i}:1`, `aria-label="Add one ${x.toLowerCase()}"`)}</div>`).join("")}</div>${t.kind === "volume" ? "<p class=small>Footprint of one layer</p>" : ""}<div class="crate-array" role="img" style="grid-template-columns:repeat(${Math.max(1, parts[1] || 0)},26px)" aria-label="${parts[0] || 0} rows of ${parts[1] || 0} crates">${"<span>▣</span>".repeat((parts[0] || 0) * (parts[1] || 0))}</div>${t.kind === "volume" ? `<div class="volume-layers">${Array.from({ length: parts[2] || 0 }, (_, i) => `<section><strong>Layer ${i + 1}</strong><div class="crate-array" style="grid-template-columns:repeat(${Math.max(1, parts[1] || 0)},20px)">${"<span>▣</span>".repeat((parts[0] || 0) * (parts[1] || 0))}</div></section>`).join("")}</div>` : ""}<p>Total: ${(parts[0] || 0) * (parts[1] || 0) * (t.kind === "volume" ? parts[2] || 0 : 1)} ${t.kind === "volume" ? "cubic units" : "crates"}.</p>`;
    } else if (t.kind === "chart") body = bars(parts, t.labels, t.max);
    else if (t.kind === "grid" && t.sample)
      body = `<div class="sample-space" role="group" aria-label="Equally likely sample space">${t.labels.map((l, i) => btn(esc(l), `m-select:${i}`, `aria-label="Outcome ${esc(l)}" aria-pressed="${(q.values.selected || []).includes(i)}"`)).join("")}</div>`;
    else if (t.kind === "chance" && q.route === "2") {
      body = `<p>Build a fair spinner by colouring equally sized sectors green. The needle is illustrative; there is no random reward.</p><div class="model-spinner" style="--sectors:${t.total};background:conic-gradient(from -90deg,${Array.from({ length: t.total }, (_, i) => `${(q.values.selected || []).includes(i) ? "#4e7653" : "#e6ddb8"} ${(i * 360) / t.total}deg ${((i + 1) * 360) / t.total}deg`).join(",")})" role="group" aria-label="Build probability spinner">${Array.from({ length: t.total }, (_, i) => btn(String(i + 1), `m-select:${i}`, `style="--angle:${((i + 0.5) * 360) / t.total - 90}deg" aria-label="Spinner sector ${i + 1}" aria-pressed="${(q.values.selected || []).includes(i)}"`)).join("")}</div><p>${(q.values.selected || []).length} green sectors of ${t.total}.</p>`;
    } else if (
      ["measure", "angle", "balance", "ratio", "sequence", "bars"].includes(
        t.kind,
      )
    ) {
      if (t.kind === "measure" && t.unit === "ml")
        body = `<div class="pour-model"><div class="pour-vessel" aria-label="Filled ${v} millilitres"><div style="height:${(v / t.max) * 100}%"></div>${Array.from({ length: 5 }, (_, i) => `<span style="bottom:${i * 25}%">${(i * t.max) / 4} ml</span>`).join("")}</div><p>Container: ${v} ml</p></div>`;
      else if (t.kind === "measure")
        body = `<div class="measure-ruler-scroll"><div class="interactive-ruler" role="group" aria-label="Measuring ruler">${Array.from({ length: 11 }, (_, i) => btn(String((i * t.max) / 10), `m-value:${(i * t.max) / 10}`, `style="left:${i * 10}%" aria-label="Ruler mark ${(i * t.max) / 10} ${esc(t.unit)}"`)).join("")}<div class="ruler-rail" style="width:${(v / t.max) * 100}%"></div></div></div><p>Slide the ruler sideways if needed. Rail length: ${v} ${esc(t.unit)}</p>`;
      else if (t.kind === "balance")
        body = `<div class="tile-balance" role="img" aria-label="Your left side has ${t.coefficient} groups of ${v} and ${t.add} units; right side has ${t.total}"><div>${Array.from({ length: t.coefficient }, () => `<div class="tile-battery">${"<i>▣</i>".repeat(v)}<small>x = ${v}</small></div>`).join("")} + ${t.add}</div><strong>⚖</strong><div>${t.total} units</div></div><p>Keep both sides equal. Add or remove one unit from every x battery.</p>`;
      else if (t.kind === "ratio")
        body = `<div class="ratio-packs"><section>Green supplies ${t.green}<div>${"<i>▣</i>".repeat(t.green)}</div></section><section>Blue supplies ${v}<div>${"<i>▣</i>".repeat(v)}</div></section></div>`;
      else if (t.kind === "bars")
        body = `<div class="puzzle-bars" role="img" aria-label="Data ${t.values.join(", ")}; your mean bar ${v}">${[...t.values, v].map((n) => `<span style="height:${Math.max(18, n * 8)}px">${n}</span>`).join("")}</div><p>Redistribute the total equally; build the mean bar.</p>`;
      else if (t.kind === "sequence")
        body = `<div class="sequence-rail">${t.values.map((n) => `<span>${n}</span>`).join("")}<span>${v}</span></div><p>Build the next carriage number by adding or removing units.</p>`;
      else
        body = `<div class="protractor"><svg viewBox="0 0 400 230" role="img" aria-label="Constructed angle ${v} degrees"><path d="M30 200a170 170 0 0 1 340 0H30" fill="#e5ebd5" stroke="#36573e"/>${Array.from(
          { length: 19 },
          (_, i) => {
            const a = (i * Math.PI) / 18;
            return `<text x="${200 + 150 * Math.cos(a)}" y="${200 - 150 * Math.sin(a)}" text-anchor="middle">${i * 10}</text>`;
          },
        ).join(
          "",
        )}<path d="M370 200H200l${160 * Math.cos((v * Math.PI) / 180)} ${-160 * Math.sin((v * Math.PI) / 180)}" fill="none" stroke="#8e402e" stroke-width="4"/></svg></div>`;
      const step = t.kind === "angle" ? 10 : t.kind === "measure" ? t.step : 1;
      body += `<div class="manipulate-actions">${btn("− " + step, `m-adjust:${-step}`, `aria-label="Remove ${step} ${esc(t.unit || "units")}"`)}${btn("+ " + step, `m-adjust:${step}`, `aria-label="Add ${step} ${esc(t.unit || "units")}"`)}</div>`;
    } else if (kind === "money" && t.kind !== "coins") {
      let rest = v;
      const tokens = [];
      for (const coin of [...coins].reverse()) {
        const n = Math.floor(rest / coin);
        rest %= coin;
        if (n) tokens.push(`${n} × ${coin < 100 ? coin + "p" : money(coin)}`);
      }
      body = sharing(t, v) + `<div class="money-construction"><p>Build the amount using fictional UK money. ${t.kind === "bank" ? "Post every transaction above before checking." : ""}</p><div class="money-tray">${coins.map((c) => btn(c < 100 ? c + "p" : money(c), `m-adjust:${c}`, `aria-label="Add ${c} pence" class="money-button"`)).join("")}</div><div class="payment-objects">${tokens.map((x) => `<span>${x}</span>`).join("")}</div><output>${money(v)}</output><div>${btn("Remove 1p", "m-adjust:-1")}${btn("Remove £1", "m-adjust:-100")}${btn("Clear money", "m-value:0")}</div></div>`;
    } else return null;
    return `<div class="hands-on" data-mechanic="${kind}">${body}</div>`;
  }
  function practiceSpec(skill, q) {
    const text = String(q[1]).trim();
    let t = null;
    if (/^-?\d+$/.test(text) && Math.abs(Number(text)) <= 9999) {
      const n = Number(text);
      if (
        /geometry_angles|geometry_triangles|stats_pie/.test(skill.id) &&
        n >= 0 &&
        n <= 180
      )
        t = { kind: "angle", min: 0, max: 180, step: 1 };
      else if (
        /negative|geometry_transforms|algebra_coordinates/.test(skill.id) &&
        n >= -20 &&
        n <= 20
      )
        t = { kind: "line", min: -20, max: 20 };
      else if (["town_timetable","town_time"].includes(skill.id))
        t = {kind:"blocks",unit:"minutes",min:0,max:9999};
      else if (["town_money","town_totals","town_menu","town_value","town_travel","town_bills","town_wages","town_split","town_balance","town_interest","town_discounts","town_household","town_tickets","town_payslip","percent_change","ratio_rates"].includes(skill.id)) {
        const pence=["town_money","town_totals","town_menu","town_value","town_travel","town_bills","town_wages"].includes(skill.id);
        t = {kind:"amount",unit:"p",responseUnit:pence?"pence":"pounds",min:0,max:100000,scale:pence?1:100};
      }
      else if (
        /place|operations|multiply|priority|powers|factors|algebra_|stats_|ratio_|measure_|fraction_mixed/.test(
          skill.id,
        )
      )
        t = { kind: "blocks", min: 0, max: 9999 };
    }
    if (/^\d+\/\d+$/.test(text)) {
      const den = Number(text.split("/")[1]);
      if (den > 0 && den <= 12 && Number(text.split("/")[0])<=den) t = { kind: "fraction", total: den, min: 0, max: den };
    }
    if (t && skill.id === "town_split") {
      const match = String(q[0]).match(/£(\d+) café bill is shared equally by (\d+) people/);
      if(match) {t.people=Number(match[2]);t.shareTotal=Number(match[1])*100;}
    }
    if(t&&t.kind!=="fraction"){const required=Number(text)*(t.scale||1);if(required<t.min||required>t.max)return null;}
    return t ? { ...t, skill: skill.id, format: text, practice: true } : null;
  }
  // A draft is kept separately: an empty or invalid edit must never submit an older value.
  function numericValue(raw, t, scale = 1) {
    if (!t || !(scale === 1 || scale === 100)) return null;
    const pattern = scale === 100 ? /^-?\d+(?:\.\d{1,2})?$/ : /^-?\d+$/;
    if (!pattern.test(String(raw))) return null;
    const n = Math.round(Number(raw) * scale);
    return Number.isSafeInteger(n) && n >= (t.min ?? 0) && n <= t.max ? n : null;
  }
  function numericMessage(t, scale = 1) {
    return scale === 100
      ? `Enter pounds from ${(t.min ?? 0)/scale} to ${t.max/scale}, using at most two decimal places.`
      : `Enter a whole number from ${t.min ?? 0} to ${t.max}.`;
  }
  function numericInput(t, value, draft, context = "mission") {
    const scale = t.practice ? t.scale || 1 : 1;
    const raw = draft ?? String(value/scale), invalid = numericValue(raw, t, scale) === null;
    const label = scale === 100 ? "Amount in pounds (£)" : t.unit === "p" ? "Amount in pence (100p = £1)" : "Answer" + (t.unit ? " in " + t.unit : "");
    return `<div class="numeric-answer"><label for="${context}-amount">${label}</label><input id="${context}-amount" data-numeric-answer="${context}" type="text" inputmode="${(t.min ?? 0) < 0 ? 'text' : scale === 100 ? 'decimal' : 'numeric'}" enterkeyhint="done" autocomplete="off" value="${esc(raw)}" aria-invalid="${invalid}" aria-describedby="${context}-number-help"><p id="${context}-number-help" class="small numeric-help" aria-live="polite">${invalid ? numericMessage(t,scale) : 'Type an answer or use the model.'}</p></div>`;
  }
  function invalidDraft(values, t) {
    if(values?.clockDraft !== undefined && !/^([01]\d|2[0-3]):[0-5]\d$/.test(values.clockDraft)) return true;
    return values?.amountDraft !== undefined && numericValue(values.amountDraft, t, t?.practice ? t.scale || 1 : 1) === null;
  }
  function sharing(t, amount) {
    const saved = String(t.prompt || "").match(/Share a £([\d.]+) café bill equally between (\d+) friends/);
    const people = t.people ?? (saved ? Number(saved[2]) : undefined);
    if (!Number.isInteger(people) || people < 2 || people > 12) return "";
    const total = t.shareTotal ?? Math.round(Number(saved?.[1])*100), allocated = people * amount;
    return `<div class="equal-sharing"><h3>Share the whole bill equally</h3><p>Fictional café bill: ${money(total)}. Each friend pays 1/${people} of the whole.</p><div class="share-bar" role="img" aria-label="The whole bill divided into ${people} equal shares">${Array.from({length:people}, (_,i)=>`<span>1/${people}</span>`).join('')}</div><div class="share-people">${Array.from({length:people}, (_,i)=>`<section><strong>Friend ${i+1}</strong><p>${money(amount)}</p><span class="small">${Math.floor(amount/100)} × £1 + ${amount%100}p</span></section>`).join('')}</div><p role="status">${people} × ${money(amount)} = ${money(allocated)} · ${allocated <= total ? money(total-allocated)+' left to share' : money(allocated-total)+' over the bill'}</p><p>Change one payment below; every friend receives the same share.</p></div>`;
  }
  function practiceRender(l, k) {
    const t = practiceSpec(k, l.qs[l.i]);
    if (!t || l.mode !== "practice" || l.answered) return "";
    const v = l.manipulation || {},
      a = v.amount || 0;
    let body = "";
    if (t.kind === "fraction")
      body = `<p>Shade the fraction you want to submit. These are equal parts.</p><div class="parts" data-shade-group="practice">${Array.from({ length: t.total }, (_, i) => btn("▧", `p5-shade:${i}`, `data-shade-index="${i}" aria-label="Fraction part ${i + 1}" aria-pressed="${(v.selected || []).includes(i)}"`)).join("")}</div><output>${(v.selected || []).length}/${t.total}</output>`;
    else if (t.kind === "line")
      body = `<p>Place your answer on the number line.</p><div class="numberline">${Array.from({ length: 41 }, (_, i) => btn(String(i - 20), `p5-value:${i - 20}`, `aria-pressed="${a === i - 20}"`)).join("")}</div>`;
    else if (t.kind === "blocks")
      body = `<p>Build your answer${t.unit?" in "+t.unit:""} from place-value blocks.</p><div class="envelopes">${[1000, 100, 10, 1].map((n) => `<section><strong>${n}s</strong><div class="practice-blocks">${"<i>▣</i>".repeat(Math.floor(a / n) % 10)}</div>${btn("−", `p5-add:${-n}`, `aria-label="Remove ${n}"`)}${btn("+", `p5-add:${n}`, `aria-label="Add ${n}"`)}</section>`).join("")}</div><output>${a}</output>`;
    else if (t.kind === "angle")
      body = `<svg viewBox="0 0 400 220" role="img" aria-label="Your angle ${a} degrees"><path d="M370 200H200l${160 * Math.cos((a * Math.PI) / 180)} ${-160 * Math.sin((a * Math.PI) / 180)}" fill="none" stroke="#34563e" stroke-width="5"/><text x="200" y="80">${a}°</text></svg><div>${[-10, -1, 1, 10].map((n) => btn((n > 0 ? "+" : "") + n + "°", `p5-add:${n}`)).join("")}</div>`;
    else
      body = sharing(t,a) + `<p>Construct the answer in ${t.responseUnit} using fictional money. 100p = £1.</p><div class="money-tray">${coins.map((n) => btn(money(n), `p5-add:${n}`, `aria-label="Add ${n} pence"`)).join("")}</div>${btn("Remove 1p", "p5-add:-1")}${btn("Clear", "p5-value:0")}<output>${money(a)}${t.responseUnit==="pence"?" · "+a+"p":""}</output>`;
    return `<section class="hands-on practice-manipulative" data-mechanic="${mechanic(t)}"><h3>Build your answer</h3><div class="practice-model">${body}</div>${t.kind !== "fraction" ? numericInput(t,a,v.amountDraft,"practice") : ""}<div>${btn("Try constructed answer", "p5-submit", 'class="primary"')}</div><p class="small">You may also use the answer choices. Supported practice never awards mastery.</p></section>`;
  }
  function practiceEdit(l, action, n) {
    if (!l || l.mode !== "practice" || l.answered) return false;
    const t = practiceSpec({ id: l.id }, l.qs[l.i]);
    if (!t) return false;
    const v = l.manipulation || (l.manipulation = {});
    if (action === "shade") {
      if (!Number.isInteger(n) || n < 0 || n >= t.total) return false;
      const selected = v.selected || [];
      v.selected = selected.includes(n)
        ? selected.filter((x) => x !== n)
        : [...selected, n];
      return true;
    }
    const a = action === "add" ? (v.amount || 0) + n : n;
    if (!Number.isInteger(a) || a < t.min || a > t.max) return false;
    v.amount = a;
    delete v.amountDraft;
    return true;
  }
  function practiceValue(l) {
    const t = practiceSpec({ id: l.id }, l.qs[l.i]),
      v = l.manipulation || {};
    if (!t) return "";
    if (t.kind === "fraction") return (v.selected || []).length + "/" + t.total;
    if (t.scale) return String((v.amount || 0) / t.scale);
    return String(v.amount || 0);
  }
  const isHandsOn = (t, w, r) => {
    const m = mechanic(t, w, r);
    return !!m && !["clock", "budget"].includes(m);
  };
  root.V5HandsOn = {
    numericValue, numericMessage, numericInput, invalidDraft, sharing, visualTool,
    isHandsOn,
    enrich,
    mechanic,
    render,
    cartesian,
    practiceSpec,
    practiceRender,
    practiceEdit,
    practiceValue,
  };
  if (typeof module !== "undefined")
    module.exports = { V5HandsOn: root.V5HandsOn };
})(typeof window !== "undefined" ? window : globalThis);
