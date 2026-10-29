import { createClient } from "@supabase/supabase-js";
// Connected UI shared by the staging and production builders. Offline Camp does not import it.
const $ = (id) => document.getElementById(id),
  esc = window.V3Art.esc,
  E = window.V3Engine,
  P = window.V3Presentation;
let client,
  c,
  identity,
  unlock,
  wallet,
  sync,
  runningGame = false,
  expires = 0,
  timeout,
  saveTimer,
  intents,
  lastSaveAttempt = 0;
let busy = false,
  operationPending = null,
  releaseTab;
const main = $("main"),
  status = $("status");
function message(s) {
  status.textContent = s;
}
function safeActionError(err) {
  if (Number(err?.status) === 429) return "Too many attempts. Please wait before trying again.";
  if (err?.message?.startsWith('Sign-in failed.')) return "Sign-in failed. Check the account details.";
  if (err?.message?.startsWith('PIN was not recognised')) return "PIN was not recognised. Try again or ask your parent for help.";
  if (err?.message?.includes('five minutes')) return "Too many PIN attempts. Wait five minutes before trying again.";
  return "This action could not be confirmed. Check your connection and try again. Your saved work is preserved.";
}
function panel(title, body) {
  main.innerHTML = `<section class="panel auth-panel"><h1>${esc(title)}</h1>${body}</section>`;
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
    const b = e.submitter || $("cloud-form").querySelector('button[type="submit"],button.primary');
    b.disabled = true;
    try {
      await action();
    } catch (err) {
      message(safeActionError(err));
    } finally {
      busy = false;
      if (b.isConnected) b.disabled = false;
    }
  };
}
async function rpc(op, args = {}) {
  if (!active()) throw Error("Unlock your account to continue");
  const token = unlock, who = identity;
  const { data, error } = await client.rpc("v3_request", {
    p_token: unlock,
    p_operation: op,
    p_args: args,
  });
  // A late response must not reopen data after lock, expiry or an account change.
  if (!active() || unlock !== token || identity !== who)
    throw Error("Account changed. Unlock again to continue.");
  if (error) throw error;
  if (data?.error) throw Error(data.error);
  return data;
}
function authForm() {
  document.querySelector("nav").hidden = true;
  form(
    "Staging account sign-in",
    `<p>Use a fictional account from jaxon-maths-v3-staging. Your game account and PIN are separate.</p><p>Parents: sign in with your own account and parent PIN for the starting profile and independent evidence. Learners: use your learner account, then begin at Base Camp. Use How to play for help; do not share a parent PIN.</p>${field("Email", "email", 'type="email" autocomplete="username"')}${field("Account password", "password", 'type="password" autocomplete="current-password"')}${button("Forgot account password", "recover")}`,
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
    if ($("recover").disabled) return;
    $("recover").disabled = true;
    const { error } = await client.auth.resetPasswordForEmail(email, {
      redirectTo: location.origin + location.pathname,
    });
    message(P.recoveryMessage(error));
    // One request per deliberate action; rate limits never trigger automatic retries.
    if (Number(error?.status) !== 429) $("recover").disabled = false;
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
  await Promise.race([flush(true),new Promise(resolve=>setTimeout(resolve,1500))]);
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
  intents=window.V3CloudSync.createIntents({storage:localStorage,key:`v3-intent:${c.projectRef}:${identity.user}`,rpc,
    allowed:identity.role==='learner'?['buy']:['award','redeem','confirm_offline']});
  // Recover purchases independently of the item button, even when ownership already refreshed.
  if(identity.role==='learner'&&navigator.onLine){try{const recovered=await intents.recover();if(recovered){remote=recovered;wallet=remote.wallet;localStorage.setItem(cacheKey,JSON.stringify(remote));}}catch{message('A purchase is awaiting confirmation. Its retry is preserved.');}}
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
    screenTime: () =>
      Math.max(0, Number(wallet.active_seconds) / 60 - Number(wallet.redeemed)),
    applyWallet,
    onSave(state) {
      if(!sync.enqueue(state))return;
      if(state.view==='home'){queueMicrotask(()=>flush(true));return;}
      if(!saveTimer)saveTimer=setTimeout(()=>{saveTimer=null;flush();},30000);
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
  else await flush(true);
  window.addEventListener("online", () => {flush(true);recoverPurchase();});
  window.addEventListener('pagehide',()=>flush(true));
  document.addEventListener("visibilitychange", () => {
    if (!active()) {if(!document.hidden)lock();}
    else flush(true);
  });
  // Polling uses HTTPS and works when a WebSocket or background tab is unavailable.
  setInterval(async () => {
    if (!active() || document.hidden) return;
    await flush();
    await recoverPurchase();
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
  s.coins = Number(wallet.coins) + Number(wallet.bonus);
  s.bought = [...wallet.owned];
  s.equipped = s.equipped.filter((id) => s.bought.includes(id));
}
async function flush(force=false) {
  if(!sync||!active())return;
  const dirty=sync.snapshot();
  if(!dirty.pending&&!dirty.latest)return;
  if(!force&&Date.now()-lastSaveAttempt<30000)return;
  lastSaveAttempt=Date.now();
  try{
    await sync.flush({oneRequest:!force});
    const next=sync.snapshot();
    if(!next.conflict)message(next.pending||next.latest?'Saved on this device · waiting for staging sync':'Saved to staging · 60-minute weekly goal · screen time 1:1');
  }catch{message('Not synced. Your changes remain on this device; reconnect and unlock to retry.');}
}
async function recoverPurchase(){
  if(!active()||identity.role!=='learner'||!navigator.onLine)return;
  try{if(!intents.pending())return;const remote=await intents.recover();if(remote){wallet=remote.wallet;localStorage.setItem(`v3-last-remote:${c.projectRef}:${identity.user}`,JSON.stringify(remote));
      const key=window.V3CloudContext?.key;
      if(key&&!document.documentElement.hasAttribute('data-saving')){const state=JSON.parse(localStorage.getItem(key));applyWallet(state);localStorage.setItem(key,JSON.stringify(state));window.dispatchEvent(new StorageEvent('storage',{key}));}}}
  catch{message('A purchase is awaiting confirmation. Its retry is preserved.');}
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
async function transaction(op,payload) {
  const latest=await intents.run(op,payload);
  wallet=latest.wallet;
  localStorage.setItem(`v3-last-remote:${c.projectRef}:${identity.user}`,JSON.stringify(latest));
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
  let pending = null,
    invalidIntent = false;
  try {
    const raw = localStorage.getItem(
      `v3-intent:${c.projectRef}:${identity.user}`,
    );
    if (raw) {
      pending = JSON.parse(raw);
      if (
        !["award", "redeem", "confirm_offline"].includes(pending.op) ||
        !Number.isInteger(pending.payload?.amount) ||
        pending.payload.amount < 1 ||
        pending.payload.amount > 60
      )
        throw Error("Invalid intent");
    }
  } catch {
    invalidIntent = true;
  }
  panel(
    "Staging parent dashboard",
    `<p class="eyebrow">FAMILY FIELD JOURNAL</p><p class="parent-intro">Fictional family only · ${P.minutes(week)} / 60 reported weekly active minutes. Guided learning, story restoration and independent evidence stay separate.</p>${window.V11StartingUI.parent(p)}<div class="wallet-grid"><div class="wallet-card"><strong>${P.coins(Number(remote.wallet.coins) + Number(remote.wallet.bonus))}</strong><span>Available coins · learning + parent bonus</span></div><div class="wallet-card"><strong>${P.minutes(Math.max(0, Number(remote.wallet.active_seconds) / 60 - Number(remote.wallet.redeemed)))} min</strong><span>Earned screen time still available · 1:1</span></div><div class="wallet-card"><strong>${P.minutes(remote.wallet.redeemed)} min</strong><span>Redeemed screen time · already used</span></div><div class="wallet-card"><strong>${P.minutes(Math.max(0, Number(p.minutes) - Number(remote.wallet.active_seconds) / 60))} min</strong><span>Reported time awaiting parent review · not yet credited</span></div></div><p class="form-note">Server-credited active time: ${P.minutes(Number(remote.wallet.active_seconds) / 60)} minutes. Confirm only reviewed offline learning; each confirmed minute credits 10 coins and 1 screen-time minute once.</p><div class="parent-columns"><section class="panel"><h2>Learning evidence</h2><p>Saved game evidence; story progress and guided practice do not establish independent mastery.</p>${
      window.V3Curriculum.skills
        .filter((k) => p.practice[k.id] || p.checks[k.id])
        .map(
          (k) =>
            `<p class="evidence-row"><strong>${esc(k.name)}:</strong> ${p.checks[k.id]?.reteach ? "Revisit teaching" : p.checks[k.id]?.stage >= 2 ? "Spaced independent mastery" : p.checks[k.id]?.stage === 1 ? "Fresh independent check passed" : "Guided practice"} · score ${esc(p.checks[k.id]?.score ?? "No independent score")}</p>`,
        )
        .join("") || "<p>No completed learning yet.</p>"
    }<h2>Recent saved activity</h2>${p.recent
      .slice(0, 8)
      .map(
        (x) =>
          `<p>${esc(x.type)} · ${esc(x.id || x.world || "")} · ${esc(P.date(x.date))}${x.assisted ? " · supported" : ""}</p>`,
      )
      .join(
        "",
      )}</section><section class="panel"><h2>Parent reward controls</h2><p class="small muted">Choose an action, enter an amount and review it before submitting. Nothing is selected or awarded automatically.</p><form id="reward-form" class="reward-form">${field("Amount (1 to 60)", "amount", 'type="number" min="1" max="60" step="1"')}<label for="reward-kind">Action</label><select id="reward-kind" required><option value="" disabled selected>Choose a reward action</option><option value="award">Award bonus coins</option><option value="redeem">Redeem earned screen-time minutes</option><option value="confirm_offline">Confirm reported offline learning minutes</option></select><button>Submit parent reward</button></form>${button("Refresh learning evidence", "refresh-parent")}</section></div>`,
  );
  main.querySelector(".auth-panel").classList.add("parent-journal");
  if (pending && !invalidIntent) {
    $("reward-kind").value = pending.op;
    $("reward-kind").disabled = true;
    $("amount").value = pending.payload.amount;
    $("amount").readOnly = true;
    $("reward-form").querySelector("button").textContent =
      "Retry saved parent transaction";
    message(
      "A saved parent transaction is awaiting confirmation. Retry sends the same request once; it does not create another award.",
    );
  }
  if (invalidIntent) {
    $("reward-form").querySelector("button").disabled = true;
    message(
      "Saved transaction cannot be read. Its original bytes are preserved; reward actions are paused.",
    );
  }
  $("reward-form").onsubmit = async (e) => {
    e.preventDefault();
    if (busy || !$("reward-kind").value || !$("amount").value) return;
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
    const verifiedKey = "v3-verified:" + c.projectRef, receiptVerifiedKey="v3-verified-receipts:"+c.projectRef;
    if (check.error) {
      if (
        navigator.onLine ||
        sessionStorage.getItem(verifiedKey) !== c.projectRef || sessionStorage.getItem(receiptVerifiedKey)!=='1'
      )
        throw Error("Staging identity was not verified. Sign-in is disabled.");
    } else {
      if (
        check.data?.name !== c.projectName ||
        check.data?.projectRef !== c.projectRef
      )
        throw Error("Staging identity mismatch. Sign-in disabled.");
      if(check.data?.saveReceiptVersion!==1)throw Error('The saving upgrade has not been verified on this server. Existing saved data is preserved.');
      sessionStorage.setItem(verifiedKey, c.projectRef);
      sessionStorage.setItem(receiptVerifiedKey,'1');
    }
    $("cloud-lock").onclick = lock;
    $("cloud-signout").onclick = async () => {
      try {
        await Promise.race([flush(true),new Promise(resolve=>setTimeout(resolve,1500))]);
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
