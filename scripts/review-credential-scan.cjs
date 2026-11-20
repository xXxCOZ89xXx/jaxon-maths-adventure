// Classify only exact reviewed historical lines. Never output candidate values or source text.
const fs = require("node:fs");
const cp = require("node:child_process");
const crypto = require("node:crypto");
const path = require("node:path");
const allowlist = require("./credential-review-allowlist.json");
function review(findings, log, read, entries = allowlist) {
  const errors = /\bERR\b|fatal:|error=/i.test(log);
  const unresolved = [],
    accepted = [];
  for (const f of findings) {
    let lineHash;
    try {
      const line = read(f.Commit, f.File).split(/\r?\n/)[f.StartLine - 1];
      if (typeof line !== "string" || f.StartLine !== f.EndLine)
        throw Error("Unbounded match");
      lineHash = crypto.createHash("sha256").update(line).digest("hex");
    } catch {
      unresolved.push({
        file: f.File,
        commit: f.Commit,
        rule: f.RuleID,
        reason: "Source unavailable or multiline finding",
      });
      continue;
    }
    const entry =
      f.RuleID === "generic-api-key" &&
      entries.find((a) => a.file === f.File && a.lineSha256 === lineHash);
    if (entry)
      accepted.push({
        file: f.File,
        commit: f.Commit,
        rule: f.RuleID,
        reason: entry.reason,
      });
    else
      unresolved.push({
        file: f.File,
        commit: f.Commit,
        rule: f.RuleID,
        reason: "Not an exact reviewed line",
      });
  }
  const scanned = Number(log.match(/(\d+) commits scanned/)?.[1] || 0);
  return {
    complete: !errors && scanned > 0,
    scannedCommitDiffs: scanned,
    candidates: findings.length,
    reviewedNonSecrets: accepted.length,
    unresolved,
    passed: !errors && scanned > 0 && unresolved.length === 0,
    scope:
      "Supplied Git history diff stream; caller records fetch/merge coverage. Excludes unreachable objects, working folders and provider secrets",
  };
}
if (require.main === module) {
  if (process.argv.length !== 5)
    throw Error(
      "Usage: node scripts/review-credential-scan.cjs REPORT_JSON SCAN_LOG OUTPUT_JSON",
    );
  const cache = new Map();
  const result = review(
    JSON.parse(fs.readFileSync(process.argv[2], "utf8")),
    fs.readFileSync(process.argv[3], "utf8"),
    (commit, file) => {
      if (!/^[0-9a-f]{40}$/.test(commit) || file.includes("\0"))
        throw Error("Invalid source reference");
      const key = commit + ":" + file;
      if (!cache.has(key))
        cache.set(
          key,
          cp.execFileSync("git", ["show", key], {
            encoding: "utf8",
            maxBuffer: 32 * 1024 * 1024,
            stdio: ["ignore", "pipe", "pipe"],
          }),
        );
      return cache.get(key);
    },
  );
  result.reachableCommits = Number(
    cp
      .execFileSync("git", ["rev-list", "--all", "--count"], {
        encoding: "utf8",
      })
      .trim(),
  );
  fs.writeFileSync(
    path.resolve(process.argv[4]),
    JSON.stringify(result, null, 2) + "\n",
  );
  console.log(JSON.stringify(result));
  if (!result.passed) process.exitCode = 1;
}
module.exports = { review };
