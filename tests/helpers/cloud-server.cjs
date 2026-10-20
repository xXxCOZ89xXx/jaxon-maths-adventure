// Node/Playwright-only fictional server. Never imported by application builds.
const ref = "abcdefghijklmnopqrst",
  url = `https://${ref}.supabase.co`,
  uid = "11111111-1111-4111-8111-111111111111",
  parentUid = "22222222-2222-4222-8222-222222222222";
function fixture() {
  return {
    progress: {},
    revision: 0,
    wallet: { coins: 200, bonus: 0, owned: [], active_seconds: 0, redeemed: 0 },
    tokens: new Map(),
    transactions: new Map(),
    calls: [],
    pinAttempts: 0,
    loseSave: false,
  };
}
async function mock(page, server) {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.route("**/*", async (route) => {
    const req = route.request(),
      u = new URL(req.url());
    if (u.origin === "http://127.0.0.1:4173" || u.protocol === "file:")
      return route.continue();
    if (u.origin !== url) {
      errors.push("Unexpected external request: " + u.origin);
      return route.abort();
    }
    const body = req.postDataJSON() || {};
    server.calls.push({ path: u.pathname, body });
    const parent =
      req.headers().authorization?.includes(".parent.") ||
      body.email?.includes("parent");
    let data = {},
      status = 200;
    const user = {
      id: parent ? parentUid : uid,
      aud: "authenticated",
      role: "authenticated",
      email: parent ? "parent@fictional.invalid" : "learner@fictional.invalid",
      app_metadata: { provider: "email" },
      user_metadata: {},
      identities: [],
      created_at: new Date().toISOString(),
    };
    if (u.pathname === "/auth/v1/token") {
      if (body.password === "wrong") {
        status = 400;
        data = {
          error: "invalid_grant",
          error_description: "Invalid credentials",
        };
      } else {
        const token = "fake." + (parent ? "parent" : "learner") + ".token";
        data = {
          access_token: token,
          refresh_token: "fictional-refresh",
          expires_in: 3600,
          token_type: "bearer",
          user,
        };
      }
    } else if (u.pathname === "/auth/v1/user") data = user;
    else if (u.pathname === "/auth/v1/recover") data = {};
    else if (u.pathname === "/auth/v1/logout") data = {};
    else if (u.pathname === "/rest/v1/rpc/v3_identity")
      data = { name: "jaxon-maths-v3-staging", projectRef: ref };
    else if (u.pathname === "/rest/v1/rpc/v3_role")
      data = {
        role: parent ? "parent" : "learner",
        child: uid,
        user: user.id,
        pinSet: true,
      };
    else if (u.pathname === "/rest/v1/rpc/v3_unlock") {
      if (body.p_pin !== (parent ? "654321" : "1234")) {
        server.pinAttempts++;
        data = { error: "PIN was not recognised. Try again." };
      } else {
        const token = "unlock-" + user.id;
        server.tokens.set(token, user.id);
        data = {
          token,
          expires: new Date(Date.now() + 3600000).toISOString(),
          role: parent ? "parent" : "learner",
          user: user.id,
          child: uid,
        };
      }
    } else if (u.pathname === "/rest/v1/rpc/v3_request") {
      if (server.tokens.get(body.p_token) !== user.id) {
        status = 403;
        data = { code: "P0001", message: "Unlock required" };
      } else if (body.p_operation === "read")
        data = {
          revision: server.revision,
          progress: server.progress,
          wallet: server.wallet,
        };
      else if (body.p_operation === "lock") {
        server.tokens.delete(body.p_token);
        data = { ok: true };
      } else if (body.p_operation === "save" && parent) {
        status=403;data={code:"P0001",message:"Learner account required"};
      } else if (body.p_operation === "save") {
        const a = body.p_args;
        if (server.transactions.has(a.requestId))
          data = server.transactions.get(a.requestId);
        else if (a.revision !== server.revision)
          data = {
            conflict: true,
            revision: server.revision,
            progress: server.progress,
          };
        else {
          server.progress = a.progress;
          server.revision++;
          data = { revision: server.revision };
          server.transactions.set(a.requestId, data);
        }
        if (server.loseSave) {
          server.loseSave = false;
          return route.abort();
        }
      } else if (
        body.p_operation === "award" ||
        body.p_operation === "confirm_offline"
      ) {
        if (!parent) {
          status = 403;
          data = { code: "P0001", message: "Parent account required" };
        } else {
          const a = body.p_args;
          if (!server.transactions.has(a.requestId)) {
            if (body.p_operation === "confirm_offline") {
              server.wallet.active_seconds += a.amount * 60;
              server.wallet.coins += a.amount * 10;
            } else server.wallet.bonus += a.amount;
            server.transactions.set(a.requestId, { wallet: server.wallet });
          }
          data = { wallet: server.wallet };
          if (server.loseAward) {
            server.loseAward = false;
            return route.abort();
          }
        }
      } else if (body.p_operation === "buy") {
        const a = body.p_args;
        if (!server.transactions.has(a.requestId)) {
          server.wallet.coins -= 45;
          server.wallet.owned.push(a.item);
          server.transactions.set(a.requestId, { wallet: server.wallet });
        }
        data = { wallet: server.wallet };
      } else data = { wallet: server.wallet };
    } else {
      errors.push("Unmocked backend route " + u.pathname);
      return route.abort();
    }
    await route.fulfill({
      status,
      contentType: "application/json",
      headers: { "access-control-allow-origin": "*" },
      body: JSON.stringify(data),
    });
  });
  return errors;
}

module.exports = {fixture,mock,ref,url,uid,parentUid};
