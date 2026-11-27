/* Demo-only sample and stopping-point policy. Built into the public demo only.
 * It decides which activities a visitor may START. Continuing, pausing, resuming
 * and finishing anything already started are never blocked, so saved fictional
 * work is never trapped. It adds no rewards, network calls or navigation. */
(function (root) {
  "use strict";
  function create(cfg, deps = {}) {
    if (!cfg || cfg.version !== 1 || typeof cfg.id !== "string")
      throw Error("DEMO_SAMPLE_CONFIG");
    const list = (v) => (Array.isArray(v) ? v : []),
      has = (v, x) => list(v).includes("*") || list(v).includes(String(x)),
      stop = cfg.stop || {},
      total = Number.isSafeInteger(stop.activities)
        ? stop.activities
        : Infinity,
      repeats = Number.isSafeInteger(stop.repeatsPerActivity)
        ? stop.repeatsPerActivity
        : Infinity,
      maxLevel = Number.isSafeInteger(cfg.maxLevel) ? cfg.maxLevel : 3,
      msg = cfg.messages || {};
    const recommend = (s, world) => {
      const R = deps.restoration || root.V10Restoration;
      return R && typeof R.recommend === "function"
        ? R.recommend(s, world)
        : null;
    };
    // Returns null for anything that does not start new content.
    function classify(s, action) {
      const parts = String(action || "").split(":"),
        name = parts[0],
        arg = parts[1] || "";
      switch (name) {
        case "learn":
        case "check":
        case "discover":
          return { key: "skill:" + arg, ok: has(cfg.lessons, arg) };
        case "quest":
          return { key: "quest:" + arg, ok: has(cfg.quests, arg) };
        case "mission":
        case "scene-mission": {
          const world = parts[1],
            route = parts[2],
            tier = Number(parts[3]),
            a = (s && s.adventure) || {},
            saved = [world, route, tier].join("|");
          // Going back into a visit already under way (open or paused) is resuming,
          // not a new start, so it is never blocked or counted. Finished visits are
          // no longer saved here, so a replay still counts.
          if (
            (a.active && a.active.key === saved) ||
            (a.suspended && a.suspended[saved])
          )
            return null;
          return {
            key: "mission:" + world + ":" + route,
            ok:
              has((cfg.missions || {})[world], route) &&
              (!Number.isFinite(tier) || tier <= maxLevel),
          };
        }
        case "j-plan":
        case "j-replay":
          return { key: "plan:" + arg, ok: has(cfg.townPlans, arg) };
        case "j-work": {
          const tier = Number(parts[2]);
          return {
            key: "plan:job-" + arg,
            ok:
              has(cfg.townPlans, "job-" + arg) &&
              (!Number.isFinite(tier) || !parts[2] || tier <= maxLevel),
          };
        }
        case "j-recipe-replay":
        case "j-start":
          return { key: "recipe:" + arg, ok: has(cfg.recipes, arg) };
        case "home-activity":
          return { key: "home:" + arg, ok: has(cfg.homeActivities, arg) };
        case "restore":
          return {
            key: "restore:" + parts[1] + ":" + parts[2],
            ok: has(cfg.restorationWorlds, parts[1]),
          };
        case "starting":
          // Optional starting checks award nothing; they are not counted.
          return { key: null, ok: has(cfg.startingChecks, arg) };
        case "next-path": {
          const n = recommend(s, arg);
          if (!n) return { key: null, ok: false };
          if (n.type === "restore")
            return classify(s, "restore:" + arg + ":" + n.stage);
          if (["discover", "learn", "check"].includes(n.type))
            return classify(s, n.type + ":" + n.id);
          return null;
        }
        default:
          return null;
      }
    }
    function book(s) {
      const b = s && s.demoSample;
      if (!b || typeof b !== "object" || Array.isArray(b)) return null;
      const entry = b.samples && b.samples[cfg.id];
      return entry && entry.used && typeof entry.used === "object"
        ? entry
        : null;
    }
    function usage(s) {
      const used = (book(s) || {}).used || {};
      return { used, count: Object.keys(used).length, total };
    }
    function verdict(s, action) {
      if (cfg.enabled === false) return { ok: true };
      const c = classify(s, action);
      if (!c) return { ok: true };
      if (!c.ok) return { ok: false, reason: msg.notInSample };
      if (!c.key) return { ok: true };
      const u = usage(s),
        times = u.used[c.key] || 0;
      if (!times && u.count >= total) return { ok: false, reason: msg.ended };
      if (times >= repeats) return { ok: false, reason: msg.repeatUsed };
      return { ok: true, key: c.key };
    }
    function allowed(s, action) {
      return verdict(s, action).ok;
    }
    function reason(s, action) {
      return verdict(s, action).reason || msg.notInSample || "";
    }
    // Called only after the game has admitted the action.
    function record(s, action) {
      const v = verdict(s, action);
      if (!v.ok || !v.key) return false;
      if (!s.demoSample || typeof s.demoSample !== "object")
        s.demoSample = { version: 1, samples: {} };
      s.demoSample.samples ||= {};
      const entry = (s.demoSample.samples[cfg.id] ||= { used: {} });
      entry.used[v.key] = (entry.used[v.key] || 0) + 1;
      return true;
    }
    function ended(s) {
      return cfg.enabled !== false && usage(s).count >= total;
    }
    function banner(s) {
      const u = usage(s),
        text = ended(s)
          ? msg.ended
          : String(msg.progress || "")
              .replace("{used}", u.count)
              .replace("{total}", total);
      return { text, ended: ended(s), link: cfg.endLink || null };
    }
    // Browser-only: disable start buttons outside the sample and show progress.
    function decorate(s, main) {
      if (!main || cfg.enabled === false) return;
      main.querySelectorAll("[data-action]").forEach((el) => {
        const v = verdict(s, el.dataset.action);
        if (v.ok) return;
        el.disabled = true;
        el.setAttribute("aria-disabled", "true");
        el.title = v.reason || "";
        el.classList.add("demo-out-of-sample");
      });
      if (!list(cfg.bannerViews).includes(s.view)) return;
      const b = banner(s),
        doc = main.ownerDocument,
        note = doc.createElement("section");
      note.className = "notice demo-sample-note";
      note.setAttribute("role", "note");
      const p = doc.createElement("p");
      p.textContent = b.text;
      note.append(p);
      if (b.ended && b.link && typeof b.link.href === "string") {
        const a = doc.createElement("a");
        a.href = b.link.href;
        a.textContent = b.link.text || b.link.href;
        note.append(a);
      }
      main.prepend(note);
    }
    return {
      config: cfg,
      classify,
      allowed,
      reason,
      record,
      usage,
      ended,
      banner,
      decorate,
    };
  }
  root.ESADemoSampleFactory = create;
  if (typeof module !== "undefined") module.exports = { create };
})(typeof window === "undefined" ? globalThis : window);
