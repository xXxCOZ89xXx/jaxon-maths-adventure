/* Pure, serialisable learning state. The offline demo never reads production storage. */
(function (root) {
  "use strict";
  const M =
    typeof module !== "undefined"
      ? require("./adventure").V3Adventure
      : root.V3Adventure;
  const education =
    typeof module !== "undefined"
      ? require("./education").V6Education
      : root.V6Education;
  const content = () =>
    typeof module !== "undefined"
      ? require("./content-registry").V3Content
      : root.V3Content;
  const T =
    typeof module !== "undefined" ? require("./town").V3Town : root.V3Town;
  const catalog =
    typeof module !== "undefined"
      ? require("./curriculum").V3Curriculum.catalog
      : root.V3Curriculum.catalog;
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
  const R =
    typeof module !== "undefined"
      ? require("./restoration").V10Restoration
      : root.V10Restoration;
  const N =
    typeof module !== "undefined"
      ? require("./activity-navigation").V10Navigation
      : root.V10Navigation;
  const clone = (x) => JSON.parse(JSON.stringify(x));
  const num = (x, d = 0) =>
    Number.isFinite(Number(x)) ? Math.max(0, Number(x)) : d;
  function fresh() {
    return {
      version: 3,
      guidedProgressionVersion: 1,
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
    // Retain the compact array save contract; accept legacy single-item selections.
    s.equipped = normaliseEquipment(s.equipped);
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
    // Optional saving goal: an item id, or absent.
    if (typeof s.savingGoal !== "string") delete s.savingGoal;
    // Optional wardrobe colour choices: { item: 2 or 3 }, or absent.
    if (
      s.colours &&
      typeof s.colours === "object" &&
      !Array.isArray(s.colours)
    ) {
      const colours = {};
      for (const w of wardrobeColours)
        if ([2, 3].includes(s.colours[w.item]))
          colours[w.item] = s.colours[w.item];
      if (Object.keys(colours).length) s.colours = colours;
      else delete s.colours;
    } else delete s.colours;
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
        "journey",
        "camp",
        "shop",
        "settings",
        "parent",
        "recap",
        "tour",
        "starting",
        "starting-area",
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
    if (!old.guidedProgressionVersion) {
      R.preserveLegacy(s);
      s.guidedProgressionVersion = 1;
    }
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
    const stage = [0, 1, 2].find((i) => !s.milestones.includes(id + ":" + i));
    return R.start(s, id, stage === undefined ? 2 : stage);
  }

  function help(s) {
    if (!s.quest) return;
    s.quest.assisted = true;
    s.quest.feedback = puzzle(s.quest.world, s.quest.i).hint;
  }
  function answerQuest(s, skip = false) {
    const q = s.quest;
    if (!q || q.intro || q.solved || !R.gate(s, q.world, q.i).ready)
      return false;
    const p = puzzle(q.world, q.i),
      v = ["fraction", "chance"].includes(p.kind) ? q.selected.length : q.value;
    if (skip) {
      q.assisted = true;
      q.solved = true;
      q.skipped = true;
      q.feedback = "Skipped with help. " + p.worked;
      return false;
    }
    if (v !== p.answer) {
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
    // Finish this earlier saved snapshot only; subsequent stages use the new
    // assessed multi-step plan instead of creating another fixed legacy puzzle.
    if (q.skipped) {
      s.recent.unshift({
        type: "restoration-skip",
        world: q.world,
        stage: q.i,
        assisted: true,
        skipped: true,
        date: new Date().toISOString(),
      });
      s.recent = s.recent.slice(0, 30);
    }
    delete s.quests[q.world];
    s.quest = null;
    s.resumeView = null;
    s.lastResult = {
      type: "restoration",
      world: q.world,
      stage: q.i,
      legacy: true,
    };
    s.view = "recap";
  }

  function generate(s, id, mode, bank, curriculum, now = Date.now()) {
    if (N.restoreLearning(s, id, mode)) return null;
    const skill = curriculum.skills.find((k) => k.id === id);
    if (!skill) return "Unknown skill.";
    const p = s.practice[id] || {},
      c = s.checks[id] || {};
    if (mode === "check" && (!p.completed || c.reteach))
      return "Complete a practice lesson before this independent check.";
    if (mode === "check" && education.gaps(s, id).length)
      return (
        "Check the starting point for " +
        education
          .gaps(s, id)
          .map(
            (pre) => curriculum.skills.find((k) => k.id === pre)?.name || pre,
          )
          .join(", ") +
        " before this dependent independent check. Your earlier evidence is kept."
      );
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
    const adaptive =
      typeof module !== "undefined"
        ? require("./adaptive").V5Adaptive
        : root.V5Adaptive;
    const band = adaptive.skill(s, id).band;
    for (let t = 0; t < 100; t++, round++) {
      let sample;
      try {
        sample = content()
          ? content().create(bank, id, band, round, {
              exclude: used,
              excludeIds: new Set(s.seenQuestionIds || []),
            })
          : bank.create(id, band, round, { exclude: used });
      } catch (error) {
        if (/^Duplicate questions in review/.test(error.message)) continue;
        throw error;
      }
      if (sample.every((q) => !used.has(q[0]))) {
        qs = sample;
        break;
      }
    }
    if (!qs && mode === "practice") {
      // Practice can revisit the oldest material when a bank has no wholly
      // fresh six-question set. Checks deliberately never use this path.
      const candidates = new Map();
      for (let t = 0; t < 120; t++) {
        let sample;
        try {
          sample = content()
            ? content().create(bank, id, band, round + 100 + t, {
                exclude: new Set(),
              })
            : bank.create(id, band, round + 100 + t, { exclude: new Set() });
        } catch (error) {
          if (/^Duplicate questions in review/.test(error.message)) continue;
          throw error;
        }
        for (const question of sample || []) {
          const prompt = question?.[0];
          if (typeof prompt !== "string" || candidates.has(prompt)) continue;
          candidates.set(prompt, question);
        }
      }
      const oldest = [...candidates.values()].sort((a, b) => {
        const ai = s.seen.lastIndexOf(a[0]),
          bi = s.seen.lastIndexOf(b[0]);
        return (ai < 0 ? -1 : ai) - (bi < 0 ? -1 : bi);
      });
      const selected = [],
        answers = new Set(),
        families = new Set();
      for (const question of oldest) {
        if (answers.has(question[1])) continue;
        selected.push(question);
        answers.add(question[1]);
        families.add(question[5]?.family || question[5]?.id || question[0]);
        if (selected.length === 6) break;
      }
      if (selected.length === 6 && families.size >= 3) qs = selected;
    }
    if (!qs)
      return mode === "check"
        ? "A fresh independent check is not available yet. Practice is still available."
        : "Fresh questions are unavailable. Try a different skill.";
    let teachingExample = null;
    for (let attempt = 0; attempt < 32; attempt++) {
      let candidate = education.example(id, qs, band, round + attempt * 101);
      if (!candidate) break;
      if (content())
        candidate = content().rows(id, [candidate], {
          band,
          round: round + 17 + attempt * 101,
        })[0];
      const marker =
        typeof module !== "undefined"
          ? require("./answer-marking").V3AnswerMarking
          : root.V3AnswerMarking;
      if (
        !qs.some(
          (q) =>
            q[0] === candidate[0] ||
            q[1] === candidate[1] ||
            marker?.matches(q[1], candidate[1], q[5]?.answerContract),
        )
      ) {
        teachingExample = candidate;
        break;
      }
    }
    s.learningBand = band;
    if (content())
      s.seenQuestionIds = [
        ...new Set([
          ...(s.seenQuestionIds || []),
          ...qs.map((q) => q[5]?.questionKey).filter(Boolean),
          ...(teachingExample?.[5]?.questionKey
            ? [teachingExample[5].questionKey]
            : []),
        ]),
      ];
    if (!N.stashLearning(s))
      return "Your saved lessons need review. Their original state has been preserved.";
    s.learning = {
      id,
      mode,
      round,
      policyVersion: 3,
      band,
      teachingExample,
      qs,
      i: 0,
      correct: 0,
      assisted: false,
      feedback: "",
      answered: false,
    };
    s.seen = [
      ...s.seen,
      ...qs.map((q) => q[0]),
      ...(mode === "practice" &&
      [8, 9].includes(s.learning.teachingExample?.[5]?.contentVersion)
        ? [s.learning.teachingExample[0]]
        : []),
    ];
    s.view = mode === "check" ? "check" : "lesson";
    s.resumeView = s.view;
    return null;
  }
  function answerLearning(s, value, skip = false, now = Date.now()) {
    const l = s.learning;
    if (!l || l.answered) return;
    const q = l.qs[l.i];
    // Newly authored supported practice must pass through its teaching screen.
    // Existing saved questions keep their original response contract.
    if (
      (q[5]?.contentVersion === 8 || q[5]?.direct) &&
      l.mode === "practice" &&
      !l.started
    )
      return;
    if (q[5]?.direct && l.needsTeaching) return;
    const unit = q[5]?.unit || T.moneyUnit(q[0]);
    const moneyValue = (x) => T.moneyAnswerNumber(x, unit);
    const normal = (x) => String(x).replace(/−/g, "-").trim().toLowerCase(),
      correct =
        !skip &&
        (q[5]?.direct
          ? (typeof module !== "undefined"
              ? require("./touch-activities").V9Touch
              : root.V9Touch
            ).matches(q[5].direct, q[1], l.manipulation || {})
          : q[5]?.contentVersion === 8
            ? (typeof module !== "undefined"
                ? require("./curriculum-activities").V8Activities
                : root.V8Activities
              ).matches(
                {
                  answer: q[1],
                  activity: q[5].activity,
                  markingVersion: q[5].markingVersion,
                  answerContract: q[5].answerContract,
                  prompt: q[0],
                  unit,
                },
                String(value),
              ) &&
              (q[5].activity?.kind !== "experiment" ||
                l.manipulation?.c8?.trials === q[5].activity.outcomes.length)
            : q[5]?.markingVersion === 1
              ? (typeof module !== "undefined"
                  ? require("./answer-marking").V3AnswerMarking
                  : root.V3AnswerMarking
                ).matches(q[1], value, q[5].answerContract)
              : ["pounds", "pence"].includes(unit)
                ? Math.abs(moneyValue(value) - Number(q[1])) < 1e-8
                : l.mode === "discovery"
                  ? Math.abs(parseNumber(value) - Number(q[1])) < 1e-8
                  : normal(value) === normal(q[1]));
    if (correct && !l.assisted) l.correct++;
    if (l.mode === "discovery" && !l.answers.some((a) => a.q === q[0]))
      l.answers.push({
        q: q[0],
        correct: correct && !l.assisted,
        skipped: skip,
      });
    const responses = l.responses || (l.responses = []);
    const firstAttempt = !responses.some((r) => r.question === q[0]);
    if (responses.filter((r) => r.question === q[0]).length < 16)
      responses.push({
        question: q[0],
        ...(q[5]?.questionKey ? { questionKey: q[5].questionKey } : {}),
        answer: String(value),
        correct,
        firstAttempt,
        firstAttemptCorrect: firstAttempt && correct && !l.assisted && !skip,
        firstIndependent:
          l.mode === "check" && firstAttempt && correct && !l.assisted && !skip,
        assisted: !!l.assisted,
        skipped: skip,
        source: l.mode,
        interaction: l.manipulation ? "constructed" : "conventional",
      });
    l.answered = true;
    l.feedback =
      (correct
        ? "That works. "
        : skip
          ? "Let’s work through it. "
          : "Here is one way to work through it. ") + education.explain(q);
    if (!correct && !skip && q[5]?.choiceReasons?.[String(value)])
      l.feedback = q[5].choiceReasons[String(value)] + " " + q[4];
    if (
      !correct &&
      !skip &&
      ["pounds", "pence"].includes(unit) &&
      !Number.isFinite(moneyValue(value))
    )
      l.feedback =
        "Use " +
        unit +
        " for this question. £1 = 100p. " +
        education.explain(q);
    if (!correct && !skip) {
      l.answered = false;
      l.assisted = true;
      l.retrying = true;
      delete l.needsTeaching;
    }
    return correct;
  }
  function nextLearning(s, now = Date.now()) {
    const l = s.learning;
    if (!l?.answered) return;
    if (l.i < l.qs.length - 1) {
      l.i++;
      delete l.manipulation;
      delete l.lastConstructedSubmission;
      delete l.retrying;
      l.assisted = false;
      l.answered = false;
      l.feedback = "";
      delete l.hintLevel;
      delete l.mathTools;
      delete l.mathExtra;
      delete l.teachingExample;
      return;
    }
    const passed =
      l.policyVersion === 3
        ? l.qs.length === 6 && l.correct >= 5
        : l.correct === l.qs.length;
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
        d.band + direction < education.minBand(l.id) ||
        d.band + direction > 9;
      if (!d.complete) d.band += direction;
    } else if (l.mode === "practice") {
      s.practice[l.id] = { completed: true, round: l.round };
      if (s.checks[l.id]) s.checks[l.id].reteach = false;
      s.skills[l.id] = {
        ...old,
        practiceEvidence: [
          ...(old.practiceEvidence || []),
          {
            at: now,
            round: l.round,
            source: "supported-practice",
            responses: l.responses || [],
          },
        ],
        lastPractised: new Date(now).toISOString(),
        practiceSessions: num(old.practiceSessions) + 1,
        practiceSeen: [...(old.practiceSeen || []), ...l.qs.map((q) => q[0])],
        state: old.state === "mastered" ? "mastered" : "learning",
      };
    } else {
      const previous = s.checks[l.id] || {},
        families = [...new Set(l.qs.map((q) => q[5]?.family).filter(Boolean))],
        varied =
          ![2, 3].includes(l.policyVersion) ||
          (l.qs.length >= 3 &&
            (families.length >= 3 || l.qs.every((q) => !q[5]))),
        prior = (old.independentEvidence || []).filter(
          (r) =>
            (r.policyVersion === 3
              ? r.total === 6 && r.correct >= 5
              : r.correct === r.total &&
                r.total >= 3 &&
                r.policyVersion === 2) &&
            new Set(r.families || []).size >= 3 &&
            r.at <= now - 2 * 86400000,
        ),
        spaced =
          passed &&
          varied &&
          previous.stage >= 1 &&
          previous.due <= now &&
          (![2, 3].includes(l.policyVersion) || prior.length > 0);
      const stage = passed
        ? spaced || previous.stage === 2
          ? 2
          : 1
        : l.policyVersion === 3
          ? Math.max(0, (previous.stage || 0) - 1)
          : 0;
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
        independentEvidence: [
          ...(old.independentEvidence || []),
          {
            correct: l.correct,
            total: l.qs.length,
            at: now,
            band: l.band ?? s.learningBand,
            policyVersion: l.policyVersion || 1,
            families: l.qs.map((q) => q[5]?.family || "legacy-generator"),
            responses: l.responses || [],
          },
        ],
        state: stage === 2 ? "mastered" : stage === 1 ? "review" : "learning",
        reviewStage: stage,
        masteryPolicyVersion: spaced
          ? l.policyVersion || 1
          : old.masteryPolicyVersion || (previous.stage >= 2 ? 1 : null),
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
    if (s.pausedLearning) delete s.pausedLearning[l.id + "|" + l.mode];
    s.learning = null;
    s.resumeView = null;
    s.view = "recap";
  }
  function parseNumber(input) {
    const parts = String(input ?? "")
      .trim()
      .replace(/−/g, "-")
      .replace(/%$/, "")
      .split("/")
      .map((p) => {
        // Commas count only as thousands separators (12,345.5); 2,5 is refused.
        const t = p.trim();
        return !t.includes(",")
          ? t
          : /^[+-]?\d{1,3}(?:,\d{3})+(?:\.\d+)?$/.test(t)
            ? t.replace(/,/g, "")
            : "invalid";
      });
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
    if (N.restoreLearning(s, id, "discovery")) return null;
    if (!curriculum.discovery[id]) return "Unknown skill.";
    const profile =
      typeof module !== "undefined"
        ? require("./starting-profile").V11StartingProfile
        : root.V11StartingProfile;
    const baseline = profile?.latest(
      s,
      curriculum.skills.find((k) => k.id === id)?.world,
    );
    s.discovery[id] = s.discovery[id] || {
      band: profile?.valid(baseline)
        ? (typeof module !== "undefined"
            ? require("./adaptive").V5Adaptive
            : root.V5Adaptive
          ).skill(s, id).band
        : education.minBand(id) === 3
          ? 5
          : 7,
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
        d.band < 5 || education.foundations.some((f) => f[0] === id)
          ? education.question(id, d.band, 900 + d.band, i)[3]
          : "Think about what each part of the question means.",
        d.band < 5 || education.foundations.some((f) => f[0] === id)
          ? education.question(id, d.band, 900 + d.band, i)[4]
          : q[4] || "The answer is " + T.answerLabel([q[1]], q[2]) + ".",
      ];
    });
    const identified = content()?.rows(id, qs, {
      source: "discovery",
      band: d.band,
    });
    if (identified) {
      qs.splice(0, qs.length, ...identified);
      s.seenQuestionIds = [
        ...new Set([
          ...(s.seenQuestionIds || []),
          ...qs.map((q) => q[5].questionKey),
        ]),
      ];
    }
    s.seen = [
      ...new Set([
        ...s.seen,
        ...curriculum.discovery[id][d.band].map((q) => q[1]),
        ...qs.map((q) => q[0]),
      ]),
    ];
    if (!N.stashLearning(s))
      return "Your saved lessons need review. Their original state has been preserved.";
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
  // One ID per catalogue slot. Ownership is untouched; unknown IDs are retained.
  // Last selection wins for older arrays containing multiple items in one slot.
  function normaliseEquipment(value, items = catalog) {
    const ids = Array.isArray(value)
      ? value
      : typeof value === "string"
        ? [value]
        : [];
    return ids.filter((id, index, all) => {
      if (typeof id !== "string" || all.lastIndexOf(id) !== index) return false;
      const slot = items.find((i) => i.id === id)?.slot;
      return (
        !slot ||
        !all
          .slice(index + 1)
          .some((other) => items.find((i) => i.id === other)?.slot === slot)
      );
    });
  }
  function removeEquipment(s, slot, items = catalog) {
    if (!items.some((i) => i.slot === slot)) return false;
    s.equipped = normaliseEquipment(s.equipped, items).filter(
      (id) => items.find((i) => i.id === id)?.slot !== slot,
    );
    return true;
  }
  function purchase(s, id, catalog) {
    const item = catalog.find((x) => x.id === id);
    if (!item) return false;
    if (!s.bought.includes(id)) {
      if (s.coins < item.cost) return false;
      s.coins -= item.cost;
      s.bought.push(id);
    }
    s.equipped = normaliseEquipment(s.equipped, catalog);
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
  // Saving goal (the owner, 26 November 2026): one unowned item to save towards.
  // It only reads coins; prices, purchases and the wallet never change here.
  function setSavingGoal(s, id, items = catalog) {
    if (!items.some((i) => i.id === id) || s.bought.includes(id)) return false;
    s.savingGoal = id;
    return true;
  }
  function savingGoal(s, items = catalog) {
    const item = items.find((i) => i.id === s.savingGoal);
    if (!item || s.bought.includes(item.id)) return null;
    const have = Math.min(item.cost, Math.floor(num(s.coins))),
      left = item.cost - have;
    // 10 coins for each minute of active learning, as in activeTime.
    return { item, have, left, minutes: Math.ceil(left / 10), reached: !left };
  }
  // Town projects (the owner, 26 November 2026): shared Town builds a child adds coins to, a bit at a time.
  // Each 50-coin part has its own server price, so the server's usual buy check covers every
  // contribution: the price, enough coins (earned first, then bonus), and never the same part twice.
  // No server function changes. Wardrobe prices, items and equipment are untouched.
  const TOWN_PART = 50;
  const townProjects = Object.freeze(
    [
      {
        id: "bench",
        label: "Park bench",
        target: 500,
        thanks: "Families can sit and rest in the park.",
      },
      {
        id: "library",
        label: "Library books",
        target: 1000,
        thanks: "The library shelves are full of new books to borrow.",
      },
      {
        id: "playground",
        label: "Playground",
        target: 2000,
        thanks: "Children in Town have a new place to play.",
      },
    ].map((p) =>
      Object.freeze({
        ...p,
        parts: Object.freeze(
          Array.from(
            { length: p.target / TOWN_PART },
            (_, i) => `town-${p.id}-${String(i + 1).padStart(2, "0")}`,
          ),
        ),
      }),
    ),
  );
  const townCatalog = Object.freeze(
    townProjects.flatMap((p) =>
      p.parts.map((id) =>
        Object.freeze({ id, cost: TOWN_PART, project: p.id }),
      ),
    ),
  );
  const isTownPart = (id) => townCatalog.some((x) => x.id === id);
  function townProject(s, id) {
    const project = townProjects.find((p) => p.id === id);
    if (!project) return null;
    const bought = s.bought || [],
      given =
        project.parts.filter((x) => bought.includes(x)).length * TOWN_PART,
      left = project.target - given;
    return {
      project,
      given,
      left,
      done: !left,
      next: project.parts.find((x) => !bought.includes(x)) || null,
    };
  }
  // Adds the next 50-coin part on this device. A part the server already recorded is not paid twice.
  function contributeTown(s, part) {
    const item = townCatalog.find((x) => x.id === part);
    if (!item) return false;
    if (s.bought.includes(part)) return true;
    if (
      townProject(s, item.project).next !== part ||
      Math.floor(num(s.coins)) < item.cost
    )
      return false;
    s.coins -= item.cost;
    s.bought.push(part);
    return true;
  }
  // Base Camp decorations (the owner, 26 November 2026): eight approved items and prices.
  // Each is its own catalogue item, so the server's buy checks the price and ownership.
  const decorations = Object.freeze(
    [
      ["plant", "Plant pot", "small", 100],
      ["bunting", "Bunting", "small", 100],
      ["birdbox", "Bird box", "small", 150],
      ["lantern", "Lantern post", "medium", 200],
      ["hammock", "Hammock", "medium", 250],
      ["telescope", "Telescope", "medium", 300],
      ["bookshelf", "Bookshelf", "large", 350],
      ["picnic-table", "Picnic table", "large", 400],
    ].map(([key, label, size, cost]) =>
      Object.freeze({ id: `deco-${key}`, label, size, cost }),
    ),
  );
  const isDecoration = (id) => decorations.some((x) => x.id === id);
  // Buys one decoration on this device. One the server already recorded is not paid twice.
  function buyDecoration(s, id) {
    const item = decorations.find((x) => x.id === id);
    if (!item) return false;
    if (s.bought.includes(id)) return true;
    if (Math.floor(num(s.coins)) < item.cost) return false;
    s.coins -= item.cost;
    s.bought.push(id);
    return true;
  }
  // Wardrobe colours (the owner, 26 November 2026): 16 clothing items come in 3 colours. Colour 1
  // comes with the item; colours 2 and 3 cost a flat 50 coins each. Four items with a colour in
  // their name get their own name per colour; the rest show "name · colour". Colours follow the
  // picture brief. Each extra colour is its own catalogue item, so the server's buy checks it.
  const COLOUR_PRICE = 50;
  const wardrobeColours = Object.freeze(
    [
      [
        "helmet",
        "Explorer helmet",
        ["khaki", "#b59b62"],
        ["slate grey", "#5d6670"],
        ["sky blue", "#7fb8e0"],
      ],
      [
        "cap",
        "Forest cap",
        ["forest green", "#2f6b3a", "Forest cap"],
        ["red", "#c0392b", "Poppy cap"],
        ["navy", "#22315a", "Midnight cap"],
      ],
      [
        "crown",
        "Golden crown",
        ["gold", "#d4a62a", "Golden crown"],
        ["silver", "#b8bec6", "Silver crown"],
        ["rose gold", "#d99a8c", "Rose gold crown"],
      ],
      [
        "wizardhat",
        "Wizard hat",
        ["purple", "#6b3fa0"],
        ["midnight blue", "#1f2a5c"],
        ["emerald green", "#1f8a5b"],
      ],
      [
        "hardhat",
        "Builder hard hat",
        ["yellow", "#f2c230"],
        ["orange", "#e6762a"],
        ["white", "#f4f4f0"],
      ],
      [
        "headphones",
        "Gaming headphones",
        ["blue", "#2f6fd0"],
        ["red", "#c8323a"],
        ["mint green", "#7fd8b4"],
      ],
      [
        "tophat",
        "Top hat",
        ["black", "#222222"],
        ["navy", "#22315a"],
        ["burgundy", "#7a2236"],
      ],
      [
        "jacket",
        "Hero jacket",
        ["navy and gold", "#22315a"],
        ["forest green and bronze", "#2f6b3a"],
        ["burgundy and gold", "#7a2236"],
      ],
      [
        "hoodie",
        "Emerald hoodie",
        ["green", "#2e8b57", "Emerald hoodie"],
        ["orange", "#e0892b", "Amber hoodie"],
        ["sky blue", "#7fb8e0", "Sky hoodie"],
      ],
      [
        "armour",
        "Emerald armour",
        ["green and gold", "#2e8b57", "Emerald armour"],
        ["silver and blue", "#4a78c2", "Sapphire armour"],
        ["red and gold", "#b3262e", "Ruby armour"],
      ],
      [
        "suit",
        "Sharp suit",
        ["charcoal", "#3a3d42"],
        ["navy", "#22315a"],
        ["light grey", "#c4c7cc"],
      ],
      [
        "cape",
        "Superhero cape",
        ["red", "#c0392b"],
        ["royal blue", "#2a4fb0"],
        ["purple", "#6b3fa0"],
      ],
      [
        "spacesuit",
        "Space suit",
        ["white and blue", "#e8eef6"],
        ["white and orange", "#f2b27a"],
        ["silver and green", "#9fb8a0"],
      ],
      [
        "ninja",
        "Ninja outfit",
        ["black and blue", "#1d2233"],
        ["charcoal and red", "#4a2a2a"],
        ["dark green and gold", "#24452f"],
      ],
      [
        "wings",
        "Magic wings",
        ["ice blue", "#a9d8f0"],
        ["golden", "#e2b53a"],
        ["sunset orange", "#ee8a44"],
      ],
      [
        "glasses",
        "Cool sunglasses",
        ["black frames", "#222222"],
        ["red frames", "#c0392b"],
        ["blue frames", "#2f6fd0"],
      ],
    ].map(([item, label, ...cs]) =>
      Object.freeze({
        item,
        label,
        colours: Object.freeze(
          cs.map(([colour, swatch, own], i) =>
            Object.freeze({
              id: `colour-${item}-${i + 1}`,
              item,
              n: i + 1,
              colour,
              swatch,
              name: own || (i ? `${label} · ${colour}` : label),
              cost: i ? COLOUR_PRICE : 0,
            }),
          ),
        ),
      }),
    ),
  );
  // Only colours 2 and 3 are sold; colour 1 comes with the item.
  const colourCatalog = Object.freeze(
    wardrobeColours.flatMap((w) => w.colours.slice(1)),
  );
  const isColour = (id) => colourCatalog.some((x) => x.id === id);
  const findColour = (id) =>
    wardrobeColours.flatMap((w) => w.colours).find((x) => x.id === id) || null;
  const ownsColour = (s, c) =>
    !!c &&
    (s.bought || []).includes(c.item) &&
    (c.n === 1 || (s.bought || []).includes(c.id));
  // The colour the explorer wears for an item: the chosen one if it is still owned, else colour 1.
  function colourOf(s, item) {
    const w = wardrobeColours.find((x) => x.item === item);
    if (!w) return null;
    const chosen = w.colours.find((c) => c.n === (s.colours || {})[item]);
    return chosen && ownsColour(s, chosen) ? chosen : w.colours[0];
  }
  // Buys one extra colour on this device. The item itself must be owned first. One the server
  // already recorded is not paid twice. A bought colour becomes the one worn.
  function buyColour(s, id) {
    const c = colourCatalog.find((x) => x.id === id);
    if (!c || !s.bought.includes(c.item)) return false;
    if (!s.bought.includes(id)) {
      if (Math.floor(num(s.coins)) < c.cost) return false;
      s.coins -= c.cost;
      s.bought.push(id);
    }
    return chooseColour(s, id);
  }
  // Chooses which owned colour to wear. Never changes coins or what is owned.
  function chooseColour(s, id) {
    const c = findColour(id);
    if (!ownsColour(s, c)) return false;
    const colours = { ...(s.colours || {}) };
    if (c.n === 1) delete colours[c.item];
    else colours[c.item] = c.n;
    if (Object.keys(colours).length) s.colours = colours;
    else delete s.colours;
    return true;
  }
  // Story milestones require participation, separate from independent mastery.
  function participation(run, total) {
    const skipped = new Set(
      [
        ...(run.skips || []),
        ...(run.evidence || [])
          .filter((e) => e.skipped || e.skippedAfterAttempt)
          .map((e) => e.step ?? e.stage),
      ].filter((i) => Number.isInteger(i) && i >= 0 && i < total),
    );
    const required = Math.ceil(total / 2),
      answered = total - skipped.size;
    return {
      total,
      required,
      answered,
      eligible: total > 0 && answered >= required,
    };
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
    setSavingGoal,
    savingGoal,
    townProjects,
    townCatalog,
    townProject,
    contributeTown,
    isTownPart,
    decorations,
    isDecoration,
    buyDecoration,
    wardrobeColours,
    colourCatalog,
    isColour,
    colourOf,
    buyColour,
    chooseColour,
    normaliseEquipment,
    removeEquipment,
    participation,
    weekKey,
    activeTime,
    startDiscovery,
    parseNumber,
  });
})(typeof module !== "undefined" ? module.exports : window);
