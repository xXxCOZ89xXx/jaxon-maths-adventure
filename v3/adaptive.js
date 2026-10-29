/* Evidence-informed suggestions only: guided missions never establish ability or mastery. */
(function (root) {
  const prerequisites = {
    fraction_operations: "fractions",
    fraction_mult: "fractions",
    fraction_mixed: "fractions",
    percent_change: "decimals",
    algebra_brackets: "algebra_missing",
    algebra_coordinates: "negative",
    geometry_transforms: "algebra_coordinates",
    geometry_circle: "geometry_area",
    ratio_proportion: "ratio_basics",
    ratio_rates: "ratio_basics",
    stats_pie: "fractions",
    measure_speed: "measure_units",
  };
  const education=typeof module!=="undefined"?require("./education").V6Education:root.V6Education;
  function skill(s, id) {
    const lower=education.minBand(id);
    const rounds = (s.discovery?.[id]?.rounds || []).filter(
        (r) => r.total >= 4,
      ),
      checks = (s.skills?.[id]?.independentEvidence || []).filter(
        (r) => r.total >= 3,
      ),
      c = s.checks?.[id];
    let band = rounds.length
        ? Math.max(
            lower,
            Math.min(
              9,
              rounds.at(-1).band +
                (rounds.at(-1).correct >= 3
                  ? 1
                  : rounds.at(-1).correct <= 1
                    ? -1
                    : 0),
            ),
          )
        : lower,
      reason = rounds.length
        ? "Your short discovery round"
        : "A gentle starting point; discovery is optional";
    // A brief area sample is an initial teaching suggestion, never skill mastery.
    // Objective discovery and independent evidence continue to take precedence.
    const C=typeof module!=="undefined"?require('./curriculum').V3Curriculum:root.V3Curriculum;
    const area=s.startingProfile?.areas?.[C.skills.find(k=>k.id===id)?.world];
    if(!rounds.length&&area?.responses?.length===4&&area.responses.some(r=>!r.skipped)&&Number.isFinite(area.completedAt)&&Number.isFinite(area.estimate?.band)){
      band=Math.max(lower,Math.min(9,area.estimate.band));
      reason="Provisional area starting sample; check this objective separately";
    }
    if (checks.length >= 2) {
      const recent = checks.slice(-2);
      if (recent.every((r) => r.correct / r.total >= 0.8)) {
        band = Math.min(9, band + 1);
        reason = "Two separate independent checks";
      } else if (recent.every((r) => r.correct / r.total <= 0.5)) {
        band = Math.max(lower, band - 1);
        reason = "More teaching after repeated independent difficulty";
      }
    }
    if (c?.stage >= 2) {
      band = Math.max(8, band);
      reason = "Fresh and spaced independent evidence";
    }
    if (c?.reteach && c.score <= 50) {
      band = Math.max(lower, band - 1);
      reason = "An easier teaching step after a complete check";
    }
    const pre = education.prerequisites[id]?.[0]||prerequisites[id],
      gaps =
        pre &&
        ((s.checks?.[pre]?.reteach && s.checks[pre].score <= 50) ||
          ((s.discovery?.[pre]?.rounds || []).slice(-2).length >= 2 &&
            s.discovery[pre].rounds.slice(-2).every((r) => r.correct <= 1)));
    if (gaps) {
      band = lower;
      reason = "Revisit " + pre.replaceAll("_", " ") + " alongside this skill";
    }
    return {
      band,
      tier: band <= 6 ? 1 : band <= 8 ? 2 : 3,
      reason,
      prerequisite: pre || null,
      prerequisiteGaps:education.gaps(s,id),
    };
  }
  function world(s, id, curriculum, ids = null) {
    const ks = curriculum.skills.filter((k) =>
      ids ? ids.includes(k.id) : k.world === id,
    );
    const known = ks.filter(
      (k) =>
        s.discovery?.[k.id]?.rounds?.length ||
        s.checks?.[k.id]?.stage ||
        s.skills?.[k.id]?.independentEvidence?.length,
    );
    if (!known.length) return 1;
    return Math.min(...(ids ? ks : known).map((k) => skill(s, k.id).tier));
  }
  root.V5Adaptive = { skill, world, prerequisites };
  if (typeof module !== "undefined")
    module.exports = { V5Adaptive: root.V5Adaptive };
})(typeof window !== "undefined" ? window : globalThis);
