/* Content identities are additive. Never re-identify a saved question on load. */
(function (root) {
  "use strict";
  const teaching = () =>
    typeof module !== "undefined"
      ? require("./question-teaching").V3QuestionTeaching
      : root.V3QuestionTeaching;
  const marking = () =>
    typeof module !== "undefined"
      ? require("./answer-marking").V3AnswerMarking
      : root.V3AnswerMarking;
  const copy = (x) => JSON.parse(JSON.stringify(x)),
    part = (x) => encodeURIComponent(String(x));
  function key(skill, source, version, parameters) {
    if (!skill || !source || !Number.isInteger(version) || version < 1)
      throw Error("Invalid content identity");
    return ["q3", skill, source, "v" + version, ...parameters]
      .map(part)
      .join("/");
  }
  function rows(
    skill,
    questions,
    { source = "review", band = 0, round = 0 } = {},
  ) {
    return questions.map((q, i) => {
      const row = copy(q),
        meta = row[5] || {},
        version = meta.contentVersion || 1;
      // Existing generator IDs encode the actual family/seed selected by the bank.
      // The fallback identifies a deterministic legacy generator invocation, not its copy.
      const contract =
        meta.answerContract || marking()?.contract(row[0], meta.unit);
      row[5] = {
        ...meta,
        markingVersion: 1,
        ...(contract && (contract.unit || contract.decimalPlaces !== undefined)
          ? { answerContract: contract }
          : {}),
        questionKey:
          meta.questionKey ||
          (meta.id || meta.generatorKey
            ? part(skill) + "/" + part(meta.id || meta.generatorKey)
            : key(skill, source, version, [band, round, i])),
      };
      return teaching() ? teaching().enrich(row) : row;
    });
  }
  function identity(t) {
    return Array.isArray(t)
      ? t[5]?.questionKey ||
          (t[5]?.id ? part(t[5].skill || "") + "/" + part(t[5].id) : null)
      : t.questionKey ||
          (t.questionId
            ? part(t.skill || "") + "/" + part(t.questionId)
            : null);
  }
  function task(
    t,
    { world = "", route = "", tier = 0, seed = 0, stage = 0 } = {},
  ) {
    if (t.questionKey) return t;
    const contract = t.answerContract || marking()?.contract(t.prompt, t.unit);
    const enriched =
      t.kind === "curriculum" && teaching()
        ? teaching().enrich([
            t.prompt,
            t.answer,
            t.responseOptions || [],
            t.teach,
            t.worked,
            { activity: t.activity, answerContract: contract, unit: t.unit },
          ])
        : null;
    return {
      ...t,
      ...(enriched
        ? { worked: enriched[4], responseOptions: enriched[2] }
        : {}),
      markingVersion: 1,
      ...(contract && (contract.unit || contract.decimalPlaces !== undefined)
        ? { answerContract: contract }
        : {}),
      ...(t.questionId
        ? {}
        : {
            questionKey: key(
              t.skill || world,
              "mission",
              t.contentVersion || 1,
              [world, route, tier, seed, stage],
            ),
          }),
    };
  }
  function create(bank, skill, band, round, options = {}) {
    const qs = rows(skill, bank.create(skill, band, round, options), {
      band,
      round,
    });
    if (qs.some((q) => options.excludeIds?.has(q[5].questionKey)))
      throw Error(
        "Duplicate questions in review: content identity already encountered",
      );
    return qs;
  }
  function catalog(C, education) {
    const ids = new Set(C.skills.map((k) => k.id));
    if (ids.size !== C.skills.length)
      throw Error("Duplicate skill in content registry");
    const foundations = {
      negative: ["number_bonds"],
      division_groups: ["times_tables"],
      decimal_place: ["place"],
      prob_chance: ["fraction_parts"],
    };
    const entries = C.skills.map((k) => ({
      id: k.id,
      world: k.world,
      name: k.name,
      prerequisites: [
        ...(education.prerequisites[k.id] || foundations[k.id] || []),
      ],
      objectives: [...(k.curriculum?.objectives || [])],
      definitionVersion: k.curriculum?.contentVersion || 1,
    }));
    const byId = new Map(entries.map((k) => [k.id, k]));
    function visit(id, path = []) {
      if (path.includes(id))
        throw Error("Prerequisite cycle: " + [...path, id].join(" -> "));
      for (const p of byId.get(id).prerequisites) {
        if (!ids.has(p)) throw Error("Unknown prerequisite " + p);
        visit(p, [...path, id]);
      }
    }
    for (const id of ids) visit(id);
    return entries;
  }
  function install(context) {
    if (
      !context.V3Curriculum ||
      !context.V6Education ||
      !context.JaxonFreshReview
    )
      return;
    api.skills = catalog(context.V3Curriculum, context.V6Education);
    for (const k of api.skills)
      context.V6Education.prerequisites[k.id] ||= [...k.prerequisites];
    const bank = context.JaxonFreshReview;
    context.JaxonFreshReview = {
      ...bank,
      create: (id, band, round, options) =>
        create(bank, id, band, round, options),
    };
  }
  const api = {
    version: 1,
    key,
    identity,
    rows,
    task,
    create,
    catalog,
    install,
  };
  root.V3Content = api;
  if (typeof module !== "undefined") module.exports = { V3Content: api };
  install(root);
})(typeof window === "undefined" ? globalThis : window);
