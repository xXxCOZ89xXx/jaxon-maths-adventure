/* Pure, serialisable learning state. The offline demo never reads production storage. */
(function (root) {
  "use strict";
  const M =
    typeof module !== "undefined"
      ? require("./adventure").V3Adventure
      : root.V3Adventure;
  const T =
    typeof module !== "undefined" ? require("./town").V3Town : root.V3Town;
  const worlds = [
    {
      id: "number",
      name: "Number Forest",
      tag: "The broken crossing",
      guide: "Rowan",
      color: "#75c993",
      sky: "#c8e3cf",
      ground: "#4e8662",
      skill: "negative",
      kind: "line",
      goal: "Repair the bridge, revive the grove and reopen the workshop.",
      stages: ["Bridge repaired", "Grove revived", "Workshop reopened"],
    },
    {
      id: "fractions",
      name: "Fraction Desert",
      tag: "Water for the oasis",
      guide: "Saff",
      color: "#e7bf73",
      sky: "#f1d7ac",
      ground: "#bf9257",
      skill: "fractions",
      kind: "fraction",
      goal: "Share the water equally to bring the oasis back to life.",
      stages: ["Canal opened", "Oasis filled", "Temple restored"],
    },
    {
      id: "algebra",
      name: "Algebra Peaks",
      tag: "The sleeping generators",
      guide: "Finn",
      color: "#aebaf3",
      sky: "#d5dcf2",
      ground: "#788b99",
      skill: "algebra_missing",
      kind: "balance",
      goal: "Balance the generators to power the mountain lifts.",
      stages: ["Generator online", "Lift repaired", "Gateway powered"],
    },
    {
      id: "geometry",
      name: "Geometry Kingdom",
      tag: "A turn for the towers",
      guide: "Kit",
      color: "#dcaccb",
      sky: "#ead8e8",
      ground: "#928095",
      skill: "geometry_transforms",
      kind: "rotate",
      goal: "Turn the stonework into place to rebuild the castle.",
      stages: ["Wall rebuilt", "Tower raised", "Castle restored"],
    },
    {
      id: "ratio",
      name: "Ratio Island",
      tag: "Supplies for the harbour",
      guide: "Marin",
      color: "#75cccb",
      sky: "#c7e9e4",
      ground: "#5d9e91",
      skill: "ratio_basics",
      kind: "ratio",
      goal: "Pack supplies in the right ratio and reconnect the harbour.",
      stages: ["Route reopened", "Dock repaired", "Harbour restored"],
    },
    {
      id: "statistics",
      name: "Statistics City",
      tag: "Light up the skyline",
      guide: "Ada",
      color: "#9db9e3",
      sky: "#d4e0f0",
      ground: "#6f859d",
      skill: "stats_averages",
      kind: "bars",
      goal: "Read the data to restore power to the city.",
      stages: [
        "Street illuminated",
        "Neighbourhood powered",
        "Observatory opened",
      ],
    },
    {
      id: "probability",
      name: "Probability Portal",
      tag: "A path through possibility",
      guide: "Nova",
      color: "#c2a5e6",
      sky: "#e2d6f1",
      ground: "#8c75ad",
      skill: "prob_chance",
      kind: "chance",
      goal: "Build fair chance pools to stabilise the portal paths.",
      stages: ["Anchor stabilised", "Path restored", "Portal opened"],
    },
    {
      id: "measure",
      name: "Measurement Mines",
      tag: "Get the carts moving",
      guide: "Flint",
      color: "#d1ad80",
      sky: "#e7d6bc",
      ground: "#8c7c68",
      skill: "measure_units",
      kind: "measure",
      goal: "Measure the rails and reconnect the mine lifts.",
      stages: ["Rails repaired", "Lights restored", "Lift running"],
    },
    T.world,
  ];
  const clone = (x) => JSON.parse(JSON.stringify(x));
  const num = (x, d = 0) =>
    Number.isFinite(Number(x)) ? Math.max(0, Number(x)) : d;
  function fresh() {
    return {
      version: 3,
      revision: 0,
      skills: {},
      coins: 0,
      earned: 0,
      minutes: 0,
      weekly: {},
      bought: [],
      equipped: [],
      recent: [],
      milestones: [],
      achievements: [],
      quest: null,
      quests: {},
      resumeView: null,
      learning: null,
      view: "home",
      world: "number",
      tourSeen: false,
      settings: { motion: false, sound: false },
      practice: {},
      discovery: {},
      checks: {},
      seen: [],
      lastResult: null,
    };
  }
  function migrate(input = {}) {
    const old =
      input && typeof input === "object" && !Array.isArray(input)
        ? clone(input)
        : {};
    const s = { ...old, ...fresh(), ...old, version: 3 };
    for (const k of [
      "skills",
      "weekly",
      "practice",
      "checks",
      "discovery",
      "quests",
    ])
      if (!s[k] || typeof s[k] !== "object" || Array.isArray(s[k])) s[k] = {};
    for (const k of [
      "bought",
      "equipped",
      "recent",
      "milestones",
      "seen",
      "achievements",
    ])
      s[k] = Array.isArray(s[k]) ? [...new Set(s[k])] : [];
    for (const k of ["coins", "earned", "minutes", "revision"])
      s[k] = num(s[k]);
    s.settings = { ...fresh().settings, ...old.settings };
    if (!worlds.some((w) => w.id === s.world)) s.world = "number";
    if (
      ![
        "home",
        "map",
        "world",
        "quest",
        "lesson",
        "practice",
        "check",
        "discovery",
        "adventure",
        "camp",
        "shop",
        "settings",
        "parent",
        "recap",
        "tour",
      ].includes(s.view)
    )
      s.view = "home";
    if (
      s.quest &&
      (!worlds.some((w) => w.id === s.quest.world) ||
        !Number.isInteger(s.quest.i) ||
        s.quest.i < 0 ||
        s.quest.i > 2)
    )
      s.quest = null;
    if (
      s.learning &&
      (!Array.isArray(s.learning.qs) ||
        !Number.isInteger(s.learning.i) ||
        s.learning.i < 0 ||
        s.learning.i >= s.learning.qs.length)
    )
      s.learning = null;
    for (const [badge, earned] of [
      [
        "independent",
        Object.values(s.checks).some((c) => c?.stage >= 1) ||
          Object.values(s.skills).some((k) => k?.reviewStage >= 1),
      ],
      [
        "memory",
        Object.values(s.checks).some((c) => c?.stage >= 2) ||
          Object.values(s.skills).some((k) => k?.state === "mastered"),
      ],
    ])
      if (earned && !s.achievements.includes(badge)) s.achievements.push(badge);
    M.state(s);
    if (s.view === "adventure" && !s.adventure.active) s.view = "home";
    if (s.quest) s.quests[s.quest.world] = s.quest;
    if (s.view === "quest" && !s.quest) s.view = "home";
    if (
      ["practice", "check", "discovery", "lesson"].includes(s.view) &&
      !s.learning
    )
      s.view = "home";
    return s;
  }
  const count = (s, id) =>
    [0, 1, 2].filter((i) => s.milestones.includes(id + ":" + i)).length;
  const xp = (s) => s.milestones.length * 100;
  function puzzle(id, i = 0) {
    const w = worlds.find((w) => w.id === id);
    if (!w) throw Error("Unknown world");
    const n = i + 1;
    switch (w.kind) {
      case "line":
        return {
          kind: w.kind,
          prompt: `Start at ${-n - 2}. Move ${n + 4} steps right. Place the bridge marker.`,
          answer: 2,
          min: -6,
          max: 8,
          hint: "Adding moves right. Count through zero, one step at a time.",
          worked: `${-n - 2} + ${n + 4} = 2. The marker belongs at 2.`,
        };
      case "fraction":
        return {
          kind: w.kind,
          prompt: `Open ${n}/4 of the four equal water channels.`,
          answer: n,
          total: 4,
          hint: "The denominator counts equal parts. The numerator says how many to open.",
          worked: `Open ${n} of the 4 channels: ${n}/4 of the water routes.`,
        };
      case "balance":
        return {
          kind: w.kind,
          prompt: `Each battery is x units. Balance x + ${n + 2} = ${n + 7}.`,
          answer: 5,
          min: 0,
          max: 10,
          hint: "Remove the same amount from both sides.",
          worked: `Subtract ${n + 2} from both sides. x = 5.`,
        };
      case "rotate":
        return {
          kind: w.kind,
          prompt: `Rotate the tower piece ${n * 90}° clockwise from its starting position.`,
          answer: n * 90,
          hint: "Each quarter turn is 90 degrees.",
          worked: `${n} clockwise quarter turn${n > 1 ? "s" : ""} makes ${n * 90}°.`,
        };
      case "ratio":
        return {
          kind: w.kind,
          prompt: `Pack green : blue supplies in a 2 : 3 ratio. There are ${n * 2} green crates.`,
          answer: n * 3,
          green: n * 2,
          min: 0,
          max: 12,
          hint: "Find how many groups of 2 green crates there are. Each group needs 3 blue.",
          worked: `${n * 2} ÷ 2 = ${n} groups. Blue crates: ${n} × 3 = ${n * 3}.`,
        };
      case "bars":
        return {
          kind: w.kind,
          prompt:
            "Set the missing bar so both neighbourhoods have the same total power.",
          answer: n + 3,
          values: [n + 2, n + 4],
          min: 0,
          max: 10,
          hint: "The left neighbourhood total is the sum of its two bars. The right has two equal bars.",
          worked: `${n + 2} + ${n + 4} = ${2 * n + 6}. Two equal bars need ${n + 3} each.`,
        };
      case "chance":
        return {
          kind: w.kind,
          prompt: `Make the chance of a green portal ${n}/4. Choose green slots in a pool of 4 equally likely slots.`,
          answer: n,
          total: 4,
          hint: "Probability = favourable slots divided by all equally likely slots.",
          worked: `${n} green slots out of 4 makes probability ${n}/4.`,
        };
      case "measure":
        return {
          kind: w.kind,
          prompt: `Lay a rail ${n + 1} metres long. Set its length in centimetres.`,
          answer: (n + 1) * 100,
          min: 0,
          max: 500,
          step: 50,
          hint: "One metre contains 100 centimetres.",
          worked: `${n + 1} × 100 = ${(n + 1) * 100} cm.`,
        };
    }
  }
  function startQuest(s, id) {
    if (id === "town") return;
    if (!worlds.some((w) => w.id === id)) return;
    for (const [badge, earned] of [
      [
        "independent",
        Object.values(s.checks).some((c) => c?.stage >= 1) ||
          Object.values(s.skills).some((k) => k?.reviewStage >= 1),
      ],
      [
        "memory",
        Object.values(s.checks).some((c) => c?.stage >= 2) ||
          Object.values(s.skills).some((k) => k?.state === "mastered"),
      ],
    ])
      if (earned && !s.achievements.includes(badge)) s.achievements.push(badge);
    M.state(s);
    if (s.view === "adventure" && !s.adventure.active) s.view = "home";
    if (s.quest) s.quests[s.quest.world] = s.quest;
    s.world = id;
    s.quest = s.quests[id] || {
      world: id,
      i: 0,
      value: 0,
      selected: [],
      assisted: false,
      solved: false,
      feedback: "",
      intro: true,
    };
    s.quests[id] = s.quest;
    s.view = "quest";
    s.resumeView = "quest";
  }

  function help(s) {
    if (!s.quest) return;
    s.quest.assisted = true;
    s.quest.feedback = puzzle(s.quest.world, s.quest.i).hint;
  }
  function answerQuest(s, skip = false) {
    const q = s.quest;
    if (!q || q.intro || q.solved) return false;
    const p = puzzle(q.world, q.i),
      v = ["fraction", "chance"].includes(p.kind) ? q.selected.length : q.value;
    if (skip || v !== p.answer) {
      q.assisted = true;
      q.feedback =
        (skip
          ? "Let’s build this together. "
          : "You can adjust it and try again. ") + p.worked;
      return false;
    }
    q.solved = true;
    q.feedback = "Restored! Your maths made a difference.";
    const id = q.world + ":" + q.i;
    if (!s.milestones.includes(id)) s.milestones.push(id);
    s.recent.unshift({
      type: "restoration",
      world: q.world,
      assisted: q.assisted,
      date: new Date().toISOString(),
    });
    s.recent = s.recent.slice(0, 30);
    return true;
  }
  function nextQuest(s) {
    const q = s.quest;
    if (!q?.solved) return;
    if (q.i < 2) {
      s.quest = {
        world: q.world,
        i: q.i + 1,
        value: 0,
        selected: [],
        assisted: false,
        solved: false,
        feedback: "",
        intro: false,
      };
      s.quests[q.world] = s.quest;
    } else {
      delete s.quests[q.world];
      s.resumeView = null;
      s.lastResult = { type: "quest", world: q.world };
      s.quest = null;
      s.view = "recap";
    }
  }
  function generate(s, id, mode, bank, curriculum, now = Date.now()) {
    const skill = curriculum.skills.find((k) => k.id === id);
    if (!skill) return "Unknown skill.";
    const p = s.practice[id] || {},
      c = s.checks[id] || {};
    if (mode === "check" && (!p.completed || c.reteach))
      return "Complete a practice lesson before this independent check.";
    if (mode === "check" && c.due > now)
      return "Your memory check is not due yet. Explore another skill in the meantime.";
    const used = new Set([
      ...s.seen,
      ...skill.qs.map((q) => q[0]),
      ...(s.skills[id]?.practiceSeen || []),
      ...(s.skills[id]?.reviewSeen || []),
      ...(s.discovery?.[id]?.answers || []).map((a) => a.q),
    ]);
    let qs,
      round = num(p.round) + num(c.round) + 1;
    const previous = s.skills[id] || {};
    const band = Math.max(
      5,
      Math.min(
        9,
        (s.discovery?.[id]?.rounds?.at(-1)?.band || 7) +
          (c.reteach ? -1 : previous.lastIndependentScore === 100 ? 1 : 0),
      ),
    );
    s.learningBand = band;
    for (let t = 0; t < 100; t++, round++) {
      const sample = bank.create(id, band, round);
      if (sample.every((q) => !used.has(q[0]))) {
        qs = sample;
        break;
      }
    }
    if (!qs) return "Fresh questions are unavailable. Try a different skill.";
    s.learning = {
      id,
      mode,
      round,
      qs,
      i: 0,
      correct: 0,
      assisted: false,
      feedback: "",
      answered: false,
    };
    s.seen = [...s.seen, ...qs.map((q) => q[0])];
    s.view = mode === "check" ? "check" : "lesson";
    s.resumeView = s.view;
    return null;
  }
  function answerLearning(s, value, skip = false, now = Date.now()) {
    const l = s.learning;
    if (!l || l.answered) return;
    const q = l.qs[l.i],
      normal = (x) => String(x).replace(/−/g, "-").trim().toLowerCase(),
      correct =
        !skip &&
        (l.mode === "discovery"
          ? Math.abs(parseNumber(value) - Number(q[1])) < 1e-8
          : normal(value) === normal(q[1]));
    if (correct && !l.assisted) l.correct++;
    if (l.mode === "discovery")
      l.answers.push({
        q: q[0],
        correct: correct && !l.assisted,
        skipped: skip,
      });
    l.answered = true;
    l.feedback =
      (correct
        ? "That works. "
        : skip
          ? "Let’s work through it. "
          : "Here is one way to work through it. ") + q[4];
  }
  function nextLearning(s, now = Date.now()) {
    const l = s.learning;
    if (!l?.answered) return;
    if (l.i < l.qs.length - 1) {
      l.i++;
      l.assisted = false;
      l.answered = false;
      l.feedback = "";
      return;
    }
    const passed = l.correct === l.qs.length;
    const old = s.skills[l.id] || {};
    if (l.mode === "discovery") {
      const d = s.discovery[l.id],
        score = l.correct;
      d.answers.push(...l.answers);
      d.rounds.push({ band: d.band, correct: score, total: 4 });
      const direction = score >= 3 ? 1 : score <= 1 ? -1 : 0;
      d.complete =
        !direction ||
        d.rounds.length >= 3 ||
        d.band + direction < 5 ||
        d.band + direction > 9;
      if (!d.complete) d.band += direction;
    } else if (l.mode === "practice") {
      s.practice[l.id] = { completed: true, round: l.round };
      if (s.checks[l.id]) s.checks[l.id].reteach = false;
      s.skills[l.id] = {
        ...old,
        lastPractised: new Date(now).toISOString(),
        practiceSessions: num(old.practiceSessions) + 1,
        practiceSeen: [...(old.practiceSeen || []), ...l.qs.map((q) => q[0])],
        state: old.state === "mastered" ? "mastered" : "learning",
      };
    } else {
      const previous = s.checks[l.id] || {},
        spaced = passed && previous.stage >= 1 && previous.due <= now;
      const stage = passed ? (spaced ? 2 : 1) : 0;
      if (passed && !s.achievements.includes("independent"))
        s.achievements.push("independent");
      if (spaced && !s.achievements.includes("memory"))
        s.achievements.push("memory");
      s.checks[l.id] = {
        round: l.round,
        stage,
        reteach: !passed,
        due: passed ? now + (spaced ? 7 : 2) * 86400000 : 0,
        score: Math.round((l.correct / l.qs.length) * 100),
      };
      s.skills[l.id] = {
        ...old,
        state: stage === 2 ? "mastered" : stage === 1 ? "review" : "learning",
        reviewStage: stage,
        lastIndependentScore: s.checks[l.id].score,
        reviewDueAt: passed ? new Date(s.checks[l.id].due).toISOString() : null,
        reviewSeen: [...(old.reviewSeen || []), ...l.qs.map((q) => q[0])],
      };
    }
    s.lastResult = {
      type: l.mode,
      id: l.id,
      correct: l.correct,
      total: l.qs.length,
    };
    s.recent.unshift({ ...s.lastResult, date: new Date(now).toISOString() });
    s.recent = s.recent.slice(0, 30);
    s.learning = null;
    s.resumeView = null;
    s.view = "recap";
  }
  function parseNumber(input) {
    const parts = String(input ?? "")
      .trim()
      .replace(/−/g, "-")
      .replace(/,/g, "")
      .replace(/%$/, "")
      .split("/");
    if (
      parts.length > 2 ||
      parts.some(
        (p) => !/^[-+]?(?:[0-9]+(?:\.[0-9]*)?|\.[0-9]+)$/.test(p.trim()),
      )
    )
      return NaN;
    const a = Number(parts[0]),
      b = parts.length === 2 ? Number(parts[1]) : 1;
    return b ? a / b : NaN;
  }
  function startDiscovery(s, id, curriculum, helpers) {
    if (!curriculum.discovery[id]) return "Unknown skill.";
    s.discovery[id] = s.discovery[id] || {
      band: 7,
      answers: [],
      rounds: [],
      complete: false,
    };
    const d = s.discovery[id];
    if (d.complete)
      return "Starting point already found. Try a lesson or fresh practice.";
    const qs = curriculum.discovery[id][d.band].map((q, i) => {
      const h = helpers(curriculum.discovery, id, { band: d.band, i });
      return [
        h.prompt(q[1]),
        String(q[2]),
        h.choices().map(String),
        "Think about what each part of the question means.",
        "The answer is " + q[2] + ".",
      ];
    });
    s.seen = [
      ...new Set([
        ...s.seen,
        ...curriculum.discovery[id][d.band].map((q) => q[1]),
        ...qs.map((q) => q[0]),
      ]),
    ];
    s.learning = {
      id,
      mode: "discovery",
      qs,
      i: 0,
      correct: 0,
      assisted: false,
      feedback: "",
      answered: false,
      answers: [],
    };
    s.view = "discovery";
    s.resumeView = "discovery";
    return null;
  }
  function purchase(s, id, catalog) {
    const item = catalog.find((x) => x.id === id);
    if (!item) return false;
    if (!s.bought.includes(id)) {
      if (s.coins < item.cost) return false;
      s.coins -= item.cost;
      s.bought.push(id);
    }
    if (s.equipped.includes(id))
      s.equipped = s.equipped.filter((x) => x !== id);
    else {
      s.equipped = s.equipped.filter(
        (x) => catalog.find((i) => i.id === x)?.slot !== item.slot,
      );
      s.equipped.push(id);
    }
    return true;
  }
  function weekKey(now) {
    const parts = new Intl.DateTimeFormat("en-GB", {
        timeZone: "Europe/London",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).formatToParts(new Date(now)),
      get = (t) => parts.find((p) => p.type === t).value;
    const d = new Date(
        get("year") + "-" + get("month") + "-" + get("day") + "T12:00:00Z",
      ),
      day = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() - day + 1);
    return d.toISOString().slice(0, 10);
  }
  function activeTime(s, ms, eligible, now = Date.now()) {
    if (!eligible || ms <= 0) return;
    const minutes = Math.min(ms, 5000) / 60000;
    s.minutes += minutes;
    const key = weekKey(now);
    s.weekly[key] = num(s.weekly[key]) + minutes;
    const earned = Math.floor(s.minutes * 10 + 1e-9),
      delta = Math.max(0, earned - s.earned);
    s.coins += delta;
    s.earned = Math.max(s.earned, earned);
  }
  root.V3Engine = Object.freeze({
    worlds,
    fresh,
    migrate,
    count,
    xp,
    puzzle,
    startQuest,
    help,
    answerQuest,
    nextQuest,
    generate,
    answerLearning,
    nextLearning,
    purchase,
    weekKey,
    activeTime,
    startDiscovery,
    parseNumber,
  });
})(typeof module !== "undefined" ? module.exports : window);
