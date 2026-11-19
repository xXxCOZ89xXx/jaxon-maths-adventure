/* Untimed starting estimates. Saved legacy samples remain valid; never mastery evidence. */
(function (root) {
  "use strict";
  const get = (name, file) =>
      typeof module !== "undefined" ? require("./" + file)[name] : root[name],
    copy = (x) => JSON.parse(JSON.stringify(x));
  const areas = {
    number: ["negative", "operations"],
    fractions: ["fractions", "decimals"],
    algebra: ["algebra_missing", "algebra_patterns"],
    geometry: ["geometry_angles", "geometry_area"],
    ratio: ["ratio_basics", "ratio_sharing"],
    statistics: ["stats_tables", "stats_averages"],
    probability: ["prob_chance", "prob_events"],
    measure: ["measure_units", "measure_time"],
    town: ["town_money", "town_timetable"],
  };
  const views = [
    "lesson",
    "practice",
    "check",
    "discovery",
    "adventure",
    "journey",
    "quest",
  ];
  function book(s) {
    if (s.startingProfile === undefined)
      s.startingProfile = { version: 1, areas: {} };
    const b = s.startingProfile;
    return b?.version === 1 &&
      b.areas &&
      typeof b.areas === "object" &&
      !Array.isArray(b.areas)
      ? b
      : null;
  }
  const modern = (a) => [2, 3].includes(a?.assessmentVersion);
  const length = (a) =>
    a === undefined || a?.assessmentVersion === 3
      ? 8
      : a?.assessmentVersion === 2
        ? 15
        : 4;
  const streak = (a) => (a?.assessmentVersion === 3 ? 2 : 3);
  function valid(a) {
    return (
      (a?.assessmentVersion === undefined || modern(a)) &&
      Array.isArray(a?.responses) &&
      a.responses.length === length(a) &&
      a.responses.every(
        (r) =>
          r &&
          Number.isFinite(r.at) &&
          typeof r.correct === "boolean" &&
          typeof r.prompt === "string" &&
          typeof r.skill === "string",
      ) &&
      Number.isFinite(a.completedAt) &&
      a.estimate?.band >= 3 &&
      a.estimate?.band <= 9
    );
  }
  function skillsAt(C, id, year) {
    const ED = get("V6Education", "education");
    return [
      ...new Set([
        ...(areas[id] || []),
        ...C.skills.filter((k) => k.world === id).map((k) => k.id),
      ]),
    ].filter((skill) => {
      if (!C.discovery[skill]?.[year]?.length) return false;
      const k = C.skills.find((k) => k.id === skill),
        range = k?.year?.match(/Year (\d+)(?:[–-](\d+))?/);
      if (range)
        return (
          year >= Number(range[1]) && (!range[2] || year <= Number(range[2]))
        );
      const foundation = ED.foundations.find((f) => f[0] === skill);
      return (
        !foundation ||
        (year >= Number(foundation[3].match(/Y(\d+)/)[1]) && year <= 5)
      );
    });
  }
  function years(C, id) {
    const skills = C.skills.filter((k) => k.world === id);
    return [
      ...new Set(
        skills.flatMap((k) => Object.keys(C.discovery[k.id] || {}).map(Number)),
      ),
    ]
      .filter((y) => Number.isInteger(y) && skillsAt(C, id, y).length)
      .sort((a, b) => a - b);
  }
  function chooseYear(s, id, year, C, retake = false) {
    if (!areas[id]) return "Choose an assessment area.";
    const b = book(s);
    if (!b)
      return "Your starting profile needs review. Nothing has been reset.";
    if (retake ? !valid(b.areas[id]) : b.areas[id] !== undefined)
      return "Resume your saved assessment; its starting year is already saved.";
    const key = retake ? "retakeYears" : "years";
    if (
      b[key] !== undefined &&
      (!b[key] || typeof b[key] !== "object" || Array.isArray(b[key]))
    )
      return "Your saved year choices need review. Nothing has been reset.";
    if (year !== null && !years(C, id).includes(year))
      return "Choose one of the curriculum years available for this area.";
    b[key] ||= {};
    if (year === null) delete b[key][id];
    else b[key][id] = year;
    return null;
  }
  function latest(s, id) {
    const b = s.startingProfile,
      a = b?.areas?.[id];
    return valid(a)
      ? a
      : Array.isArray(b?.history?.[id])
        ? b.history[id].slice().reverse().find(valid) || a
        : a;
  }
  function complete(s) {
    return (
      s.startingProfile?.version === 1 &&
      Object.keys(areas).every((id) => valid(latest(s, id)))
    );
  }
  function unlocked(s) {
    return (
      s.startingProfile?.version === 1 &&
      Object.keys(areas).some((id) => valid(latest(s, id)))
    );
  }
  function recent(s, id, now = Date.now()) {
    const a = latest(s, id);
    return (
      valid(a) &&
      a.estimate.enoughEvidence !== false &&
      a.responses.some((r) => !r.skipped) &&
      now >= a.completedAt &&
      now - a.completedAt < 14 * 86400000
    );
  }
  function next(s) {
    return Object.keys(areas).find((id) => !valid(latest(s, id)));
  }
  function startingSafe(row) {
    const meta = row?.[5] || {},
      prompt = String(row?.[0] || "");
    return (
      !meta.direct &&
      !(meta.contentVersion === 8 && meta.activity) &&
      !/\b(?:drag|move the marker|move marker|sort (?:the )?|build .{0,50} using|measure .{0,40} strip|align the ruler|ruler's zero)\b/i.test(
        prompt,
      )
    );
  }
  function retake(s, id, C, now = Date.now()) {
    const b = book(s),
      previous = b?.areas?.[id],
      year = b?.retakeYears?.[id];
    if (!valid(previous))
      return "Resume your current assessment before starting another.";
    if (!years(C, id).includes(year))
      return "Choose your current curriculum year for the new assessment.";
    if (
      (b.history !== undefined &&
        (!b.history ||
          typeof b.history !== "object" ||
          Array.isArray(b.history))) ||
      (b.history?.[id] !== undefined && !Array.isArray(b.history[id]))
    )
      return "Your earlier assessments need review. Nothing was reset.";
    const run = {
      assessmentVersion: 3,
      selectedYear: year,
      band: year,
      availableYears: years(C, id),
      correctStreak: 0,
      downStreak: 0,
      responses: [],
      startedAt: now,
      draft: "",
      previousPrompts: previous.responses.map((r) => r.prompt),
    };
    run.question = makeQuestion(run, id, C);
    b.history ||= {};
    b.history[id] ||= [];
    b.history[id].push(copy(previous));
    b.areas[id] = run;
    delete b.retakeYears[id];
    return start(s, id, C, now);
  }
  function buildQuestion(a, id, C) {
    if (modern(a)) {
      const q = modernQuestion(a, id, C);
      if (get("V3Town", "town").moneyUnit(q.prompt) === "pounds") {
        const pounds = (x) => String(Number(Number(x).toFixed(2)));
        q.answer = pounds(q.answer);
        q.choices = q.choices.map(pounds);
        q.tolerance = 1e-8;
      }
      const parse = get("V3Engine", "engine").parseNumber;
      q.answer =
        q.choices.find((v) => Math.abs(parse(v) - parse(q.answer)) < 1e-8) ||
        q.answer;
      return q;
    }
    const ED = get("V6Education", "education"),
      helper = get("V3Discovery", "discovery"),
      i = a.responses.length,
      skill = areas[id][i % 2],
      band = Math.max(ED.minBand(skill), Math.min(9, a.band));
    if (skill === "town_money") {
      const T = get("V3Town", "town"),
        moneyIndex = Math.floor(i / 2);
      for (let n = 0; n < 64; n++) {
        const row = T.question(
          skill,
          band,
          moneyIndex + 1 + n * 17,
          moneyIndex + n,
        );
        if (startingSafe([row[0], row[1], row[2], row[3], row[4]]))
          return {
            skill,
            band,
            prompt: row[0],
            answer: String(row[1]),
            choices: row[2].map(String),
            sourceQuestionId: row[5]?.id || row[5]?.generatorKey,
            explanation: row[4],
            moneyQuestionVersion: 2,
          };
      }
      throw Error("No safe Town money starting sample at band " + band);
    }
    const bank = C.discovery[skill]?.[band],
      rawIndex =
        bank?.findIndex((item) =>
          startingSafe([item[1], item[2], null, item[3], item[4]]),
        ) ?? -1,
      raw = bank?.[rawIndex];
    if (!raw)
      throw Error(
        "Missing safe baseline discovery sample: " + skill + " / " + band,
      );
    const h = helper(C.discovery, skill, { band, i: rawIndex });
    return {
      skill,
      band,
      prompt: h.prompt(raw[1]),
      answer: String(raw[2]),
      choices: h.choices().map(String),
      explanation:
        raw[4] ||
        "The answer is " +
          get("V3Town", "town").answerLabel([raw[1]], raw[2]) +
          ".",
    };
  }
  function modernQuestion(a, id, C) {
    const band = a.band,
      ED = get("V6Education", "education"),
      V8 = get("V8Curriculum", "curriculum-expansion"),
      T = get("V3Town", "town"),
      helper = get("V3Discovery", "discovery"),
      review = root.JaxonFreshReview,
      used = new Set([
        ...a.responses.map((r) => r.prompt),
        ...(a.previousPrompts || []),
      ]),
      fresh = new Set([
        ...ED.foundations.map((f) => f[0]),
        "place",
        "operations",
        "multiply",
        "fractions",
        "decimals",
      ]),
      pack = new Set(V8.packs.map((p) => p.id)),
      textRows = (skill, seed) =>
        V8.rows(skill, band, seed, true).filter(startingSafe),
      count = (skill) => a.responses.filter((r) => r.skill === skill).length,
      pool = skillsAt(C, id, band).filter((skill) =>
        pack.has(skill)
          ? textRows(skill, band + 901).length
          : fresh.has(skill) ||
            skill === "town_money" ||
            review?.supportedSkills.includes(skill) ||
            C.discovery[skill][band].some(
              (raw) =>
                startingSafe([raw[1], raw[2], null, raw[3], raw[4]]) &&
                !used.has(
                  helper(C.discovery, skill, { band, i: 0 }).prompt(raw[1]),
                ),
            ),
      ),
      skill = pool
        .slice()
        .sort(
          (x, y) => count(x) - count(y) || pool.indexOf(x) - pool.indexOf(y),
        )[0],
      i = count(skill);
    if (pack.has(skill)) {
      for (let attempt = 0; attempt < 64; attempt++) {
        const rows = textRows(
            skill,
            Math.floor(a.startedAt % 100003) + attempt + 1,
          ),
          row = rows[a.responses.length % rows.length],
          raw = [0, row[0], Number(row[1]), row[3], row[4]],
          bank = { [skill]: { [band]: [raw] } },
          h = helper(bank, skill, { band, i: 0 }),
          prompt = h.prompt(row[0]);
        if (!used.has(prompt))
          return {
            skill,
            band,
            prompt,
            answer: String(raw[2]),
            choices: h.choices().map(String),
            sourceQuestionId: row[5]?.id || row[5]?.generatorKey,
            explanation: row[4],
            tolerance: 1e-6,
          };
      }
    }
    if (skill === "town_money") {
      for (let attempt = 0; attempt < 64; attempt++) {
        const row = T.question(skill, band, i + 1 + attempt * 17, i + attempt);
        if (
          startingSafe([row[0], row[1], row[2], row[3], row[4]]) &&
          !used.has(row[0])
        )
          return {
            skill,
            band,
            prompt: row[0],
            answer: String(row[1]),
            choices: row[2].map(String),
            sourceQuestionId: row[5]?.id || row[5]?.generatorKey,
            explanation: row[4],
            moneyQuestionVersion: 2,
          };
      }
    }
    if (fresh.has(skill)) {
      for (let attempt = 0; attempt < 64; attempt++) {
        const row = ED.question(
            skill,
            band,
            Math.floor(a.startedAt % 100003) + attempt + 1,
            a.responses.length,
          ),
          raw = [row[0], row[1], row[2], row[3], row[4], row[5]];
        if (startingSafe(raw) && !used.has(row[0]))
          return {
            skill,
            band,
            prompt: row[0],
            answer: String(row[1]),
            choices: row[2].map(String),
            sourceQuestionId: row[5]?.id || row[5]?.generatorKey,
            explanation: row[4],
          };
      }
    }
    if (review?.supportedSkills.includes(skill)) {
      for (let attempt = 0; attempt < 64; attempt++) {
        const rows = review.create(
            skill,
            band,
            Math.floor(a.startedAt % 100003) + attempt + 1,
          ),
          row = rows[a.responses.length % rows.length];
        if (!startingSafe(row)) continue;
        const numeric = get("V3Engine", "engine").parseNumber(row[1]);
        if (!Number.isFinite(numeric)) continue;
        const raw = [0, row[0], numeric, row[3], row[4]],
          h = helper({ [skill]: { [band]: [raw] } }, skill, { band, i: 0 }),
          prompt = h.prompt(row[0]);
        if (!used.has(prompt))
          return {
            skill,
            band,
            prompt,
            answer: String(numeric),
            choices: h.choices().map(String),
            sourceQuestionId: row[5]?.id || row[5]?.generatorKey,
            explanation: row[4],
            tolerance: 1e-6,
          };
      }
    }
    const bank = C.discovery[skill][band],
      index = bank.findIndex(
        (raw) =>
          startingSafe([raw[1], raw[2], null, raw[3], raw[4]]) &&
          !used.has(helper(C.discovery, skill, { band, i: 0 }).prompt(raw[1])),
      );
    if (index < 0)
      throw Error("No unused starting sample for " + skill + " / " + band);
    const raw = bank[index],
      h = helper(C.discovery, skill, { band, i: index });
    return {
      skill,
      band,
      prompt: h.prompt(raw[1]),
      answer: String(raw[2]),
      choices: h.choices().map(String),
      explanation:
        raw[4] || "The answer is " + T.answerLabel([raw[1]], raw[2]) + ".",
    };
  }
  function makeQuestion(a, id, C) {
    const original = buildQuestion(a, id, C),
      teaching = get("V3QuestionTeaching", "question-teaching"),
      compared = teaching?.comparison(original.prompt, original.answer, true),
      q = compared
        ? {
            ...original,
            answer: compared.answer,
            choices: compared.choices.map(String),
          }
        : original,
      registry = get("V3Content", "content-registry"),
      marker = get("V3AnswerMarking", "answer-marking"),
      contract = marker
        ? {
            ...marker.contract(
              q.prompt,
              get("V3Town", "town").moneyUnit(q.prompt),
            ),
            ...(compared ? { strict: true } : {}),
          }
        : null;
    return registry && marker
      ? {
          ...q,
          questionKey: q.sourceQuestionId
            ? encodeURIComponent(q.skill) +
              "/" +
              encodeURIComponent(q.sourceQuestionId)
            : registry.key(q.skill, "starting", 3, [
                a.startedAt,
                a.selectedYear || a.band,
                a.responses.length,
                q.band,
              ]),
          markingVersion: 1,
          ...(contract &&
          (contract.unit ||
            contract.decimalPlaces !== undefined ||
            contract.strict)
            ? { answerContract: contract }
            : {}),
        }
      : q;
  }
  function refreshPendingMoney(a, id, C) {
    if (
      id === "town" &&
      a?.question?.skill === "town_money" &&
      !a.answered &&
      a.question.moneyQuestionVersion !== 2
    ) {
      a.question = makeQuestion(a, id, C);
      a.draft = "";
      delete a.validation;
    }
  }
  function question(s, id) {
    const a = s.startingProfile?.areas?.[id];
    refreshPendingMoney(a, id, root.V3Curriculum);
    return a?.question || null;
  }
  function start(s, id, C, now = Date.now(), selectedYear) {
    if (!areas[id]) return "Choose an assessment area.";
    const b = book(s);
    if (!b)
      return "Your starting profile needs review. Nothing has been reset.";
    let a = b.areas[id];
    if (valid(a)) {
      s.view = "starting";
      return null;
    }
    if (a === undefined) {
      const year = selectedYear ?? b.years?.[id];
      if (!years(C, id).includes(year))
        return "Choose your current curriculum year before starting this area.";
      a = b.areas[id] = {
        assessmentVersion: 3,
        selectedYear: year,
        band: year,
        availableYears: years(C, id),
        correctStreak: 0,
        downStreak: 0,
        responses: [],
        startedAt: now,
        draft: "",
      };
    }
    if (
      !a ||
      typeof a !== "object" ||
      !Array.isArray(a.responses) ||
      a.responses.length > length(a) ||
      (a.assessmentVersion !== undefined && !modern(a)) ||
      !Number.isFinite(a.band) ||
      (modern(a) &&
        (!Array.isArray(a.availableYears) ||
          !a.availableYears.includes(a.band))) ||
      (a.question &&
        (!Array.isArray(a.question.choices) ||
          typeof a.question.prompt !== "string"))
    )
      return "Your saved assessment is preserved and needs review.";
    refreshPendingMoney(a, id, C);
    if (!a.question) a.question = makeQuestion(a, id, C);
    if (a.question.questionKey)
      s.seenQuestionIds = [
        ...new Set([...(s.seenQuestionIds || []), a.question.questionKey]),
      ];
    s.seen = [...new Set([...(s.seen || []), a.question.prompt])];
    b.active = id;
    s.world = id;
    s.view = s.resumeView = "starting-area";
    return null;
  }
  function answer(
    s,
    id,
    value,
    skip = false,
    now = Date.now(),
    skipReason = "unknown",
  ) {
    const a = s.startingProfile?.areas?.[id],
      q = a?.question;
    if (!q || a.answered || valid(a) || a.responses.length >= length(a))
      return false;
    const T = get("V3Town", "town"),
      unit = T.moneyUnit(q.prompt),
      marker = get("V3AnswerMarking", "answer-marking"),
      parse =
        q.markingVersion === 1
          ? (x) => marker.parse(x)?.value
          : unit
            ? (x) => T.moneyAnswerNumber(x, unit)
            : get("V3Engine", "engine").parseNumber;
    if (!skip && !Number.isFinite(parse(value))) {
      a.validation = unit
        ? "Use " + unit + " for this question. £1 = 100p."
        : "Use a number, decimal or fraction, or choose I don’t know.";
      return false;
    }
    delete a.validation;
    const correct =
      !skip &&
      (q.markingVersion === 1
        ? marker.matches(q.answer, value, q.answerContract)
        : Number.isFinite(parse(value)) &&
          Math.abs(parse(value) - parse(q.answer)) <
            (modern(a) ? q.tolerance || 1e-8 : 1e-8));
    a.responses.push({
      ...copy(q),
      value: skip ? null : String(value),
      skipped: skip,
      ...(skip ? { skipReason } : {}),
      correct,
      at: now,
    });
    if (modern(a)) {
      a.correctStreak = correct ? (a.correctStreak || 0) + 1 : 0;
      a.downStreak = correct ? 0 : (a.downStreak || 0) + 1;
    }
    a.answered = true;
    a.draft = "";
    return true;
  }
  function estimate(a, id, C) {
    const byYear = a.availableYears.map((band) => ({
        band,
        total: a.responses.filter((r) => r.band === band).length,
        correct: a.responses.filter((r) => r.band === band && r.correct).length,
      })),
      secure = byYear.filter(
        (r) =>
          r.total >= (a.assessmentVersion === 3 ? 2 : 3) &&
          r.correct / r.total >= 2 / 3,
      ),
      band = secure.at(-1)?.band || a.availableYears[0],
      nextYear = secure.length
        ? a.availableYears[
            Math.min(
              a.availableYears.length - 1,
              a.availableYears.indexOf(band) + 1,
            )
          ]
        : band,
      weak = [
        ...new Set(
          a.responses
            .filter((r) => !r.correct && r.band <= band)
            .map((r) => r.skill),
        ),
      ],
      nextSkills = [...new Set([...weak, ...skillsAt(C, id, nextYear)])].slice(
        0,
        2,
      );
    return {
      band,
      enoughEvidence: secure.length > 0,
      attempted: a.responses.filter((r) => !r.skipped).length,
      correct: a.responses.filter((r) => r.correct).length,
      total: length(a),
      sampledYears: byYear.filter((r) => r.total),
      nextYear,
      nextSkills,
      reason:
        "A starting estimate from a limited sample, not a full assessment or proof of mastery.",
    };
  }
  function advance(s, id, C, now = Date.now()) {
    const a = s.startingProfile?.areas?.[id];
    if (!a?.answered) return false;
    if (a.responses.length === length(a)) {
      if (modern(a)) a.estimate = estimate(a, id, C);
      else {
        const AD = get("V5Adaptive", "adaptive"),
          anchor = areas[id][0],
          correct = a.responses.filter((r) => r.correct).length;
        // Reuse the existing four-response recommendation policy in a temporary state.
        // Do not write a skill discovery round or independent evidence for this mixed sample.
        const sample = {
          discovery: {
            [anchor]: { rounds: [{ band: a.band, correct, total: 4 }] },
          },
          skills: {},
          checks: {},
        };
        a.estimate = AD.skill(sample, anchor);
      }
      a.completedAt = now;
      delete a.question;
      delete a.answered;
      s.view = "starting";
      s.resumeView = null;
      return true;
    }
    if (modern(a)) {
      const index = a.availableYears.indexOf(a.band);
      if (a.correctStreak === streak(a)) {
        a.band =
          a.availableYears[Math.min(index + 1, a.availableYears.length - 1)];
        a.correctStreak = 0;
      }
      if (a.downStreak === streak(a)) {
        a.band = a.availableYears[Math.max(index - 1, 0)];
        a.downStreak = 0;
      }
    } else if (a.responses.length === 2) {
      const n = a.responses.filter((r) => r.correct).length;
      a.band = Math.max(
        3,
        Math.min(9, a.band + (n === 2 ? 1 : n === 0 ? -1 : 0)),
      );
    }
    a.question = makeQuestion(a, id, C);
    s.seen = [...new Set([...(s.seen || []), a.question.prompt])];
    a.answered = false;
    return true;
  }
  function rows(s, now = Date.now()) {
    const E = get("V3Engine", "engine"),
      C = get("V3Curriculum", "curriculum"),
      AD = get("V5Adaptive", "adaptive");
    return E.worlds.map((w) => {
      const a = latest(s, w.id),
        done = valid(a),
        independent = C.skills
          .filter((k) => k.world === w.id)
          .flatMap((k) =>
            (s.skills?.[k.id]?.independentEvidence || [])
              .filter((e) => e.total >= 3 && Number.isFinite(e.at))
              .map((e) => ({ ...e, id: k.id })),
          ),
        last = independent.slice().sort((x, y) => y.at - x.at)[0],
        known = done ? a.responses.filter((r) => !r.skipped).length : 0;
      return {
        id: w.id,
        name: w.name,
        limit: length(a),
        pendingCaptured:
          s.startingProfile?.areas?.[w.id] !== a
            ? s.startingProfile.areas[w.id]?.responses?.length || 0
            : null,
        captured: Array.isArray(a?.responses) ? a.responses.length : 0,
        attempted: Array.isArray(a?.responses)
          ? a.responses.filter((r) => !r.skipped).length
          : 0,
        status:
          s.startingProfile?.areas?.[w.id] !== a
            ? "In progress · previous estimate shown"
            : done
              ? "Complete · provisional"
              : a?.responses?.length
                ? "In progress"
                : "Not assessed yet",
        estimate:
          done && known && (!modern(a) || a.estimate.enoughEvidence)
            ? modern(a)
              ? "Starting estimate: around Year " + a.estimate.band
              : "Earlier sample: starting range " + a.estimate.band
            : done
              ? "Not enough evidence to estimate"
              : "Not assessed yet",
        confidence: done
          ? known < 3
            ? "Very limited evidence"
            : a.assessmentVersion === 3
              ? "Provisional · short 8-question sample"
              : "Limited sample"
          : "Not enough evidence",
        at: done ? a.completedAt : null,
        stale: done && now - a.completedAt > 30 * 86400000,
        objectives: (modern(a)
          ? [...new Set(a.responses.map((r) => r.skill))]
          : areas[w.id]
        ).map((id) => C.skills.find((k) => k.id === id)?.name || id),
        independent: independent.length
          ? {
              count: independent.length,
              at: last.at,
              band: AD.skill(s, last.id).band,
              mastered: C.skills.filter(
                (k) => k.world === w.id && s.checks?.[k.id]?.stage >= 2,
              ).length,
            }
          : null,
      };
    });
  }
  // Central UI admission policy, also applied when loading an existing activity view.
  function allowed(s, action) {
    if (unlocked(s)) return true;
    const [name, arg] = action.split(":");
    if (["skip-tour", "finish-tour"].includes(name)) return true;
    if (name === "resume-saved") return arg === "baseline";
    if (name === "continue") return false;
    if (name === "nav") return !views.includes(arg);
    return !/^(?:mission|scene-mission|restore|quest|learn|check|discover|next-path|home-activity|practice|begin|solve|skip|hint|next-quest|answer|learning-|next-learning|m-|j-|c8-|d9-|p5-|math)/.test(
      name,
    );
  }
  root.V11StartingProfile = {
    areas,
    views,
    book,
    complete,
    unlocked,
    recent,
    next,
    valid,
    length,
    years,
    chooseYear,
    latest,
    retake,
    question,
    start,
    answer,
    advance,
    rows,
    allowed,
    startingSafe,
  };
  if (typeof module !== "undefined")
    module.exports = { V11StartingProfile: root.V11StartingProfile };
})(typeof window === "undefined" ? globalThis : window);
