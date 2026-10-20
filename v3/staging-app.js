import { createClient } from "@supabase/supabase-js";
// Only included by the explicit staging builder. Test Camp never imports this file.
const $ = (id) => document.getElementById(id),
  esc = window.V3Art.esc,
  E = window.V3Engine;
let client,
  c,
  identity,
  unlock,
  wallet,
  sync,
  runningGame = false,
  expires = 0,
  timeout,
  saveTimer;
let busy = false,
  operationPending = null,
  releaseTab;
const main = $("main"),
  status = $("status");
function message(s) {
  status.textContent = s;
}
function panel(title, body) {
  main.innerHTML = `<section class="panel"><h1>${esc(title)}</h1>${body}</section>`;
  main.focus();
}
function button(label, id) {
  return `<button id="${id}">${label}</button>`;
}
function field(label, id, attrs = "") {
  return `<label>${label}<input id="${id}" required ${attrs}></label>`;
}
function active() {
  return !!unlock && Date.now() < expires;
}
function form(title, body, action) {
  panel(
    title,
    `<form id="cloud-form" class="preferences">${body}<button class="primary">Continue</button></form>`,
  );
  $("cloud-form").onsubmit = async (e) => {
    e.preventDefault();
    if (busy) return;
    busy = true;
    const b = e.submitter;
    b.disabled = true;
    try {
      await action();
    } catch (err) {
      message(err.message);
    } finally {
      busy = false;
      if (b.isConnected) b.disabled = false;
    }
  };
}
async function rpc(op, args = {}) {
  if (!active()) throw Error("Unlock your account to continue");
  const { data, error } = await client.rpc("v3_request", {
    p_token: unlock,
    p_operation: op,
    p_args: args,
  });
  if (error) throw error;
  if (data?.error) throw Error(data.error);
  return data;
}
function authForm() {
  document.querySelector("nav").hidden = true;
  form(
    "Staging account sign-in",
    `<p>Use a fictional account from jaxon-maths-v3-staging. Your game account and PIN are separate.</p>${field("Email", "email", 'type="email" autocomplete="username"')}${field("Account password", "password", 'type="password" autocomplete="current-password"')}${button("Forgot account password", "recover")}`,
    async () => {
      const { error } = await client.auth.signInWithPassword({
        email: $("email").value,
        password: $("password").value,
      });
      if (error) throw Error("Sign-in failed. Check the account details.");
      await pinScreen();
    },
  );
  $("recover").type = "button";
  $("recover").onclick = async () => {
    const email = $("email").value;
    if (!email) {
      message("Enter your staging email first.");
      return;
    }
    const { error } = await client.auth.resetPasswordForEmail(email, {
      redirectTo: location.origin + location.pathname,
    });
    message(
      error
        ? "Recovery request could not be sent."
        : "If this staging account exists, a private recovery link will arrive.",
    );
  };
}
async function pinScreen() {
  const { data, error } = await client.rpc("v3_role");
  if (error) throw error;
  identity = data;
  const set = !data.pinSet,
    len = data.role === "parent" ? 6 : 4;
  form(
    set ? "Set your staging PIN" : "Unlock your " + data.role + " account",
    `<p>${len} digits. Account recovery requires your account password.</p>${field("PIN", "pin", `type="password" inputmode="numeric" pattern="[0-9]{${len}}" minlength="${len}" maxlength="${len}" autocomplete="off"`)}${set ? "" : button("Reset PIN with account password", "reset-pin")}`,
    async () => {
      const pin = $("pin").value;
      if (set) {
        const q = await client.rpc("v3_set_pin", { p_pin: pin });
        if (q.error) throw q.error;
      }
      const q = await client.rpc("v3_unlock", { p_pin: pin });
      $("pin").value = "";
      if (q.error) throw q.error;
      if (q.data.error) throw Error(q.data.error);
      await open(q.data);
    },
  );
  if (!set) {
    $("reset-pin").type = "button";
    $("reset-pin").onclick = () => {
      form(
        "Recover your PIN",
        `${field("Account email", "email", 'type="email" autocomplete="username"')}${field("Account password", "password", 'type="password" autocomplete="current-password"')}${field("New PIN", "new-pin", `type="password" inputmode="numeric" pattern="[0-9]{${len}}" maxlength="${len}"`)}`,
        async () => {
          const { data, error } = await client.auth.signInWithPassword({
            email: $("email").value,
            password: $("password").value,
          });
          if (error || data.user.id !== identity.user) {
            await client.auth.signOut();
            throw Error("Use the same account to recover this PIN");
          }
          const q = await client.rpc("v3_set_pin", {
            p_pin: $("new-pin").value,
          });
          if (q.error) throw q.error;
          await pinScreen();
        },
      );
    };
  }
}
async function lock() {
  const old = unlock;
  unlock = null;
  expires = 0;
  clearTimeout(timeout);
  clearTimeout(saveTimer);
  sessionStorage.removeItem("v3-unlock:" + c.projectRef);
  document.querySelector("nav").hidden = true;
  document.querySelector("header").hidden = true;
  main.inert = true;
  if (old)
    await Promise.race([
      Promise.resolve(
        client.rpc("v3_request", {
          p_token: old,
          p_operation: "lock",
          p_args: {},
        }),
      ).catch(() => {}),
      new Promise((resolve) => setTimeout(resolve, 1500)),
    ]);
  // Reload disposes game handlers and all in-memory learner data before any account switch.
  location.reload();
}
async function open(u) {
  unlock = u.token;
  expires = Date.parse(u.expires);
  identity = u;
  if (!active()) throw Error("Unlock expired");
  sessionStorage.setItem("v3-unlock:" + c.projectRef, JSON.stringify(u));
  timeout = setTimeout(lock, Math.max(1, expires - Date.now()));
  let remote;
  const cacheKey = `v3-last-remote:${c.projectRef}:${identity.user}`;
  try {
    remote = await rpc("read");
    localStorage.setItem(cacheKey, JSON.stringify(remote));
  } catch (err) {
    const cached = localStorage.getItem(cacheKey);
    if (identity.role !== "learner" || !cached || navigator.onLine) throw err;
    remote = JSON.parse(cached);
    message(
      "Offline learner session. Changes stay on this device until staging reconnects.",
    );
  }
  wallet = remote.wallet;
  if (identity.role === "parent") {
    document.querySelector("nav").hidden = true;
    await parent(remote);
    return;
  }
  const key = `jaxon_v3_staging:${c.projectRef}:${identity.user}:game`,
    qkey = key + ":queue";
  // A single writing tab per account prevents shared local queues from racing. Other devices use CAS.
  if (!navigator.locks)
    throw Error(
      "This staging build requires Web Locks for safe saves. Use a current Safari or Chrome.",
    );
  let acquired;
  const ready = new Promise((resolve) => (acquired = resolve));
  navigator.locks.request(
    key + ":owner",
    { ifAvailable: true },
    async (lock) => {
      acquired(!!lock);
      if (lock) await new Promise((r) => (releaseTab = r));
    },
  );
  if (!(await ready))
    throw Error(
      "This staging account is already open in another tab. Close that tab first.",
    );
  sync = window.V3CloudSync.create({
    storage: localStorage,
    key: qkey,
    rpc,
    notify: (doc) => {
      if (doc.conflict) conflictUI();
    },
  });
  const local = sync.snapshot(),
    initial = local.latest || local.pending?.progress || remote.progress;
  if (!local.pending && !local.latest && !local.conflict) sync.seed(remote);
  // Never overwrite a corrupt game cache silently.
  const previous = localStorage.getItem(key);
  if (previous)
    try {
      JSON.parse(previous);
    } catch {
      throw Error("Existing game cache is unreadable. It has been preserved.");
    }
  const s = E.migrate(initial);
  applyWallet(s);
  localStorage.setItem(key, JSON.stringify(s));
  window.V3CloudContext = {
    key,
    isUnlocked: active,
    applyWallet,
    onSave(state) {
      sync.enqueue(state);
      clearTimeout(saveTimer);
      saveTimer = setTimeout(flush, 400);
    },
    onActive(ms) {
      heartbeat(ms / 1000);
    },
    purchase: async (item) => {
      await transaction("buy", { item });
      const x = E.migrate(JSON.parse(localStorage.getItem(key)));
      applyWallet(x);
      localStorage.setItem(key, JSON.stringify(x));
    },
  };
  document.querySelector("nav").hidden = false;
  if (!runningGame) {
    runningGame = true;
    const script = document.createElement("script");
    script.src = "v3/app.js";
    document.body.append(script);
  }
  if (local.conflict) conflictUI();
  else await flush();
  window.addEventListener("online", flush);
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
      if (!active()) lock();
      else flush();
    }
  });
  // Polling uses HTTPS and works when a WebSocket or background tab is unavailable.
  setInterval(async () => {
    if (!active() || document.hidden) return;
    await flush();
    if (
      sync.snapshot().pending ||
      sync.snapshot().latest ||
      sync.snapshot().conflict
    )
      return;
    try {
      const latest = await rpc("read");
      const walletChanged =
        JSON.stringify(wallet) !== JSON.stringify(latest.wallet);
      wallet = latest.wallet;
      localStorage.setItem(cacheKey, JSON.stringify(latest));
      if (
        !document.documentElement.hasAttribute("data-saving") &&
        !sync.snapshot().pending &&
        !sync.snapshot().latest &&
        !sync.snapshot().conflict &&
        latest.revision > sync.snapshot().revision
      ) {
        sync.seed(latest);
        const next = E.migrate(latest.progress);
        applyWallet(next);
        localStorage.setItem(key, JSON.stringify(next));
        window.dispatchEvent(new StorageEvent("storage", { key }));
        message("Updated from your other staging device.");
      } else if (
        walletChanged &&
        !document.documentElement.hasAttribute("data-saving")
      ) {
        const current = E.migrate(JSON.parse(localStorage.getItem(key)) || {});
        applyWallet(current);
        localStorage.setItem(key, JSON.stringify(current));
        window.dispatchEvent(new StorageEvent("storage", { key }));
      }
    } catch {
      message("Offline. Learning changes remain on this device.");
    }
  }, 10000);
}
function applyWallet(s) {
  s.coins =
    Math.floor((Number(wallet.coins) + Number(wallet.bonus)) * 100) / 100;
  s.bought = [...wallet.owned];
  s.equipped = s.equipped.filter((id) => s.bought.includes(id));
}
async function flush() {
  if (!sync || !active()) return;
  try {
    await sync.flush();
    if (!sync.snapshot().conflict)
      message("Saved to staging · 60-minute weekly goal · screen time 1:1");
  } catch {
    message(
      "Not synced. Your changes remain on this device; reconnect and unlock to retry.",
    );
  }
}
function conflictUI() {
  // A blocking separate panel stops game edits while preserving both entire versions.
  let dialog = $("sync-conflict");
  if (dialog) return;
  dialog = document.createElement("dialog");
  dialog.id = "sync-conflict";
  dialog.setAttribute("aria-labelledby", "conflict-title");
  dialog.innerHTML = `<h2 id="conflict-title">Two devices changed this adventure</h2><p>Both copies are preserved on this device. Choose which full adventure to continue. No automatic merge can safely combine an unfinished independent check.</p>${button("Continue this device’s copy", "keep-local")}${button("Continue the other device’s copy", "keep-remote")}`;
  document.body.append(dialog);
  dialog.showModal();
  dialog.oncancel = (e) => e.preventDefault();
  for (const choice of ["local", "remote"])
    $("keep-" + choice).onclick = async () => {
      const state = sync.resolve(choice);
      applyWallet(state);
      localStorage.setItem(window.V3CloudContext.key, JSON.stringify(state));
      dialog.remove();
      window.dispatchEvent(
        new StorageEvent("storage", { key: window.V3CloudContext.key }),
      );
      await flush();
    };
}
async function transaction(op, payload) {
  // Persist intent BEFORE the request. Retrying after response loss uses the same ID and content.
  const key = `v3-intent:${c.projectRef}:${identity.user}`,
    raw = localStorage.getItem(key);
  const intent = raw
    ? JSON.parse(raw)
    : { op, payload: { ...payload, requestId: crypto.randomUUID() } };
  if (
    intent.op !== op ||
    JSON.stringify({ ...intent.payload, requestId: undefined }) !==
      JSON.stringify({ ...payload, requestId: undefined })
  )
    throw Error("A previous transaction is pending. Retry that action first.");
  localStorage.setItem(key, JSON.stringify(intent));
  try {
    await rpc(op, intent.payload);
  } catch (err) {
    // Server rejections are final; transport failures preserve the exact intent for retry.
    if (err.code && err.code !== "PGRST000") localStorage.removeItem(key);
    throw err;
  }
  const latest = await rpc("read");
  wallet = latest.wallet;
  localStorage.setItem(
    `v3-last-remote:${c.projectRef}:${identity.user}`,
    JSON.stringify(latest),
  );
  localStorage.removeItem(key);
  return latest;
}
async function heartbeat(seconds) {
  if (operationPending || !active() || !navigator.onLine) return;
  operationPending = true;
  try {
    const r = await rpc("active", { seconds, requestId: crypto.randomUUID() });
    wallet = r.wallet;
  } catch {
  } finally {
    operationPending = false;
  }
}
async function parent(remote) {
  const p = E.migrate(remote.progress),
    week = p.weekly[E.weekKey(Date.now())] || 0;
  panel(
    "Staging parent dashboard",
    `<p>Fictional family only · ${Number(week).toFixed(1)} / 60 reported weekly active minutes.</p><p>Server-counted connected active time: ${(Number(remote.wallet.active_seconds) / 60).toFixed(1)} minutes. Screen-time conversion 1:1. Redeemed: ${remote.wallet.redeemed} minutes.</p><p>Available coins: ${Number(remote.wallet.coins) + Number(remote.wallet.bonus)}</p><h2>Learning evidence</h2><p>Saved game evidence; story progress and guided practice do not establish independent mastery.</p>${
      window.V3Curriculum.skills
        .filter((k) => p.practice[k.id] || p.checks[k.id])
        .map(
          (k) =>
            `<p><strong>${esc(k.name)}</strong>: ${p.checks[k.id]?.reteach ? "Revisit teaching" : p.checks[k.id]?.stage >= 2 ? "Spaced independent mastery" : p.checks[k.id]?.stage === 1 ? "Fresh independent check passed" : "Guided practice"} · score ${esc(p.checks[k.id]?.score ?? "No independent score")}</p>`,
        )
        .join("") || "<p>No completed learning yet.</p>"
    }<h2>Recent saved activity</h2>${p.recent
      .slice(0, 8)
      .map(
        (x) =>
          `<p>${esc(x.type)} · ${esc(x.id || x.world || "")} · ${esc(x.date)}${x.assisted ? " · supported" : ""}</p>`,
      )
      .join(
        "",
      )}<form id="reward-form">${field("Amount (1 to 60)", "amount", 'type="number" min="1" max="60" step="1" value="10"')}<label>Action<select id="reward-kind"><option value="award">Award bonus coins</option><option value="redeem">Redeem earned screen-time minutes</option></select></label><button>Submit parent reward</button></form>${button("Refresh learning evidence", "refresh-parent")}`,
  );
  $("reward-form").onsubmit = async (e) => {
    e.preventDefault();
    if (busy) return;
    busy = true;
    e.submitter.disabled = true;
    try {
      const next = await transaction($("reward-kind").value, {
        amount: Number($("amount").value),
      });
      await parent(next);
      message("Parent transaction saved once.");
    } catch (err) {
      message(err.message);
    } finally {
      busy = false;
      if (e.submitter.isConnected) e.submitter.disabled = false;
    }
  };
  $("refresh-parent").onclick = async () => {
    try {
      await parent(await rpc("read"));
    } catch (err) {
      message(err.message);
    }
  };
}
async function boot() {
  try {
    c = window.V3CloudSync.config(window.V3StagingConfig);
    client = createClient(c.url, c.anonKey, {
      auth: {
        storageKey: "jaxon_v3_staging_auth:" + c.projectRef,
        flowType: "pkce",
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
      },
    });
    const check = await client.rpc("v3_identity");
    const verifiedKey = "v3-verified:" + c.projectRef;
    if (check.error) {
      if (
        navigator.onLine ||
        sessionStorage.getItem(verifiedKey) !== c.projectRef
      )
        throw Error("Staging identity was not verified. Sign-in is disabled.");
    } else {
      if (
        check.data?.name !== c.projectName ||
        check.data?.projectRef !== c.projectRef
      )
        throw Error("Staging identity mismatch. Sign-in disabled.");
      sessionStorage.setItem(verifiedKey, c.projectRef);
    }
    $("cloud-lock").onclick = lock;
    $("cloud-signout").onclick = async () => {
      try {
        if (active()) await rpc("lock");
      } finally {
        unlock = null;
        sessionStorage.removeItem("v3-unlock:" + c.projectRef);
        await client.auth.signOut();
        releaseTab?.();
        location.reload();
      }
    };
    client.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT" && unlock) lock();
    });
    const code = new URL(location.href).searchParams.get("code");
    if (code) {
      const result = await client.auth.exchangeCodeForSession(code);
      history.replaceState(null, "", location.pathname);
      if (result.error)
        throw Error(
          "Recovery link expired or is from another browser. Request a new link here.",
        );
      form(
        "Choose a new staging account password",
        field(
          "New password",
          "new-password",
          'type="password" minlength="12" autocomplete="new-password"',
        ),
        async () => {
          const { error } = await client.auth.updateUser({
            password: $("new-password").value,
          });
          if (error) throw error;
          await client.auth.signOut();
          authForm();
          message(
            "Password changed. Sign in again to set or recover your PIN.",
          );
        },
      );
      return;
    }
    const {
      data: { session },
    } = await client.auth.getSession();
    if (!session) {
      authForm();
      return;
    }
    const saved = sessionStorage.getItem("v3-unlock:" + c.projectRef);
    if (saved) {
      const u = JSON.parse(saved);
      const { data } = navigator.onLine
        ? await client.auth.getUser()
        : { data: { user: session.user } };
      if (u.user === data.user?.id && Date.parse(u.expires) > Date.now()) {
        try {
          await open(u);
          return;
        } catch (err) {
          if (runningGame) throw err;
          sessionStorage.removeItem("v3-unlock:" + c.projectRef);
          unlock = null;
        }
      }
    }
    await pinScreen();
  } catch (err) {
    panel(
      "Staging is unavailable",
      `<p>${esc(err.message)}</p><p>Test Camp remains a separate offline game. No production fallback is available.</p>`,
    );
    message("Cloud disabled.");
  }
}
boot();
