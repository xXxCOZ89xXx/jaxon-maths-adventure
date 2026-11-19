const fs = require("node:fs"),
  { load } = require("./audit-curriculum.cjs");
const state = JSON.parse(fs.readFileSync("docs/current-status.json", "utf8")),
  c = load(),
  skills = c.V3Content.catalog(c.V3Curriculum, c.V6Education),
  worlds = new Set(skills.map((k) => k.world));
const text = `# Current project status\n\nGenerated from the code registry by \`npm run status\`. Historical review reports remain dated evidence; this page is the current implementation summary.\n\n- Current scope: ${state.phase}.\n- Registry: **${skills.length} skills across ${worlds.size} worlds**, with ${skills.reduce((n, k) => n + k.prerequisites.length, 0)} prerequisite links.\n- Released baseline: \`${state.baseline}\`.\n- Release: ${state.release}\n\n## Implementation\n\n${state.features.map((x) => "- " + x).join("\n")}\n\n## Verification and cutover\n\n${state.validation}\n\n${state.hostedDatabase}\n\n${state.acceptance}\n\nSee [the implementation sequence](PHASE3-IMPLEMENTATION.md), [the database review package](../supabase/history/README.md), [multi-learner design](MULTI-LEARNER-DESIGN.md) and [screenshot archive](review/ARCHIVE.md).\n`;
if (process.argv.includes("--check")) {
  if (fs.readFileSync("docs/CURRENT-STATUS.md", "utf8") !== text)
    throw Error("Regenerate current status from the registry");
} else fs.writeFileSync("docs/CURRENT-STATUS.md", text);
console.log(
  `Current registry: ${skills.length} skills, ${worlds.size} worlds.`,
);
