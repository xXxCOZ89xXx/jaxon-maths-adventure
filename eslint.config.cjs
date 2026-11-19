const globals = require("globals"),
  files = require("./scripts/maintained-source.cjs").filter((f) =>
    /\.[cm]?js$/.test(f),
  );
module.exports = [
  {
    files,
    languageOptions: {
      ecmaVersion: "latest",
      globals: {
        ...globals.browser,
        ...globals.node,
        V3Engine: "readonly",
        V3Content: "readonly",
        V3CloudContext: "readonly",
        V3HistoryStorage: "readonly",
      },
    },
    rules: {
      "no-undef": "error",
      "no-unreachable": "error",
      "no-dupe-args": "error",
      "no-dupe-keys": "error",
      "no-unsafe-finally": "error",
      "no-constant-condition": "error",
    },
  },
  {
    files: [
      "v3/content-registry.js",
      "v3/history-storage.js",
      "v3/answer-marking.js",
      "v3/question-teaching.js",
      "tests/*registry.cjs",
      "tests/history-storage*.cjs",
      "tests/answer-marking.cjs",
      "tests/mastery-policy.cjs",
      "tests/question-teaching.cjs",
      "scripts/source-checks.cjs",
      "scripts/project-status.cjs",
    ],
    rules: {
      "no-unused-vars": [
        "error",
        { args: "none", caughtErrors: "none", varsIgnorePattern: "^_" },
      ],
    },
  },
];
