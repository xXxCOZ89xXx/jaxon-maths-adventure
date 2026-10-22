/* Original V1 ledger retained; V2 plans delegate to TownLife. V1 never awards coins, minutes, mastery or estate milestones. */
(function (root) {
  "use strict";
  const T =
    typeof module !== "undefined" ? require("./town").V3Town : root.V3Town;
  const H = typeof module !== "undefined" ? require("./hands-on").V5HandsOn : root.V5HandsOn;
  const L = typeof module !== "undefined" ? require("./town-life").V52TownLife : root.V52TownLife;
  const recipes = {
    bolognese: { name: "Spaghetti Bolognese", protein: "Mince" },
    lentil: { name: "Lentil Bolognese", protein: "Lentils" },
  };
  const names = [
    "Check the cupboards",
    "Build the shopping list",
    "Choose the bus",
    "Shop as a customer",
    "Pay at checkout",
    "Check your change",
    "Bring the shopping home",
    "Prepare the recipe",
  ];
  const venues = [
    "home",
    "home",
    "station",
    "market",
    "market",
    "market",
    "home",
    "home",
  ];
  function state(s) {
    return s.adventure?.townActive === 2 ? L.state(s) : s.adventure?.journeyV1 || null;
  }
  function validState(j) {
    return (
      !!j &&
      j.version === 1 &&
      j.context?.version === 1 &&
      j.context.entry === "journey" &&
      j.context.venue === venues[Math.min(j.stage, 7)] &&
      j.done === (j.stage === 8) &&
      !!recipes[j.recipe] &&
      Number.isInteger(j.stage) &&
      j.stage >= 0 &&
      j.stage <= 8 &&
      Array.isArray(j.inventory) &&
      j.inventory.length === 3 &&
      j.inventory.every((n) => Number.isInteger(n) && n >= 0 && n <= 24) &&
      Number.isInteger(j.cash) &&
      j.cash >= 0 &&
      j.cash <= j.budget &&
      j.budget === 1000 &&
      j.values &&
      typeof j.values === "object" &&
      !Array.isArray(j.values) &&
      Array.isArray(j.completed) &&
      new Set(j.completed).size === j.completed.length &&
      j.completed.length === j.stage &&
      j.completed.every((n, i) => n === i) &&
      Array.isArray(j.receipts) &&
      Array.isArray(j.evidence) &&
      (!j.shoppingList ||
        (Array.isArray(j.shoppingList) &&
          j.shoppingList.length === 3 &&
          j.shoppingList.every(
            (n) => Number.isInteger(n) && n >= 0 && n <= 12,
          ))) &&
      (!j.basket ||
        (Array.isArray(j.basket) &&
          j.basket.length === 3 &&
          j.basket.every((n) => Number.isInteger(n) && n >= 0 && n <= 12)))
    );
  }
  function start(s, recipe = "bolognese") {
    const saved=s.adventure?.journeyV1;
    if (!recipes[recipe] || (saved && !validState(saved))) return false;
    s.adventure = s.adventure || {};
    s.adventure.townActive=1;
    if (!saved)
      s.adventure.journeyV1 = {
        version: 1,
        id: "recipe-journey-1",
        recipe,
        stage: 0,
        context: T.context("home", "journey"),
        inventory: [1, 1, 0],
        shoppingList: null,
        basket: null,
        cash: 1000,
        budget: 1000,
        completed: [],
        values: {},
        solved: false,
        assisted: false,
        evidence: [],
        feedback: "",
        receipts: [],
        done: false,
      };
    s.view = "journey";
    s.resumeView = "journey";
    s.world = "town";
    return true;
  }
  const total = (list) => list.reduce((n, x, i) => n + x * [50, 80, 150][i], 0);
  function task(s) {
    if(s.adventure?.townActive===2)return L.task(s);
    const j = state(s);
    if (!validState(j) || j.done) return null;
    const protein = recipes[j.recipe].protein,
      items = [
        { name: "Pasta · 100 g pack", price: 50 },
        { name: "Tomatoes · tin", price: 80 },
        { name: protein + " · 100 g pack", price: 150 },
      ],
      base = {
        venue: venues[j.stage],
        min: 0,
        max: 2000,
        step: 50,
        unit: "",
        skill: "town_household",
        teach:
          "Read what is already available before calculating what is missing. Keep the shopping, fares and cooking quantities connected.",
        example:
          "If a recipe needs two tins and there is one in the cupboard, buy one more tin.",
        worked:
          "Compare the recipe quantities with your inventory and check your arithmetic.",
        hint: "Check the recipe, current inventory and your available cash.",
      };
    if (j.stage <= 1 || j.stage === 3 || j.stage === 6) {
      let answer =
        j.stage === 0
          ? [1, 1, 0]
          : j.stage === 1
            ? [2, 2, 2].map((n, i) => Math.max(0, n - j.inventory[i]))
            : j.stage === 3
              ? j.shoppingList
              : j.inventory;
      return {
        ...base,
        kind: "basket",
        items,
        answer,
        budget: j.stage === 3 ? j.cash : null,
        prompt:
          j.stage === 0
            ? "Inspect the cupboard: one pasta pack, one tomato tin and no protein packs. Represent what is already here."
            : j.stage === 1
              ? "The recipe needs two pasta packs, two tomato tins and two protein packs. Build a list containing only the missing quantities."
              : j.stage === 3
                ? "Follow your saved shopping list. Put only the required quantities into the basket and stay within your cash budget."
                : "Check the returned ingredients against the actual inventory before cooking.",
      };
    }
    if (j.stage === 2)
      return {
        ...base,
        kind: "journey",
        options: [
          { name: "Bus A", depart: 540, arrive: 555, price: 100 },
          { name: "Bus B", depart: 550, arrive: 565, price: 150 },
          { name: "Bus C", depart: 545, arrive: 560, price: 200 },
        ],
        deadline: 560,
        walk: 5,
        answer: 0,
        prompt:
          "Reach the market by 09:20, allowing a five-minute walk. Choose the cheapest bus that gets you there in time.",
      };
    if (j.stage === 4)
      return {
        ...base,
        kind: "coins",
        unit: "p",
        answer: 500,
        prompt: `Your basket costs £${(total(j.basket) / 100).toFixed(2)}. Make a £5 payment using fictional UK money.`,
        worked:
          "£5 is 500 pence. Different sets of coins or notes can make the same amount.",
      };
    if (j.stage === 5)
      return {
        ...base,
        kind: "coins",
        unit: "p",
        answer: 500 - total(j.basket),
        prompt: `You paid £5 for £${(total(j.basket) / 100).toFixed(2)} of shopping. Build the change you should receive.`,
        worked:
          "Change is money paid minus the cost. Check by adding the change to the cost.",
      };
    return {
      ...base,
      kind: "measure",
      unit: "ml",
      answer: 200,
      max: 1000,
      step: 50,
      prompt:
        "The ingredients are home. Pour 0.2 litres of water into the sauce jug, then prepare the recipe.",
      worked: "One litre is 1,000 ml, so 0.2 litres is 200 ml.",
    };
  }
  function value(t, v) {
    if (t.kind === "basket") return v.parts || [0, 0, 0];
    if (t.kind === "coins") return (v.coins || []).reduce((a, b) => a + b, 0);
    if (t.kind === "journey") return v.choice ?? -1;
    return v.amount || 0;
  }
  function valid(t, v) {
    const answer = value(t, v);
    return Array.isArray(t.answer)
      ? Array.isArray(answer) &&
          answer.length === 3 &&
          answer.every((x, i) => x === t.answer[i])
      : answer === t.answer;
  }
  function action(s, name, arg, raw) {
    if(s.adventure?.townActive===2)return L.action(s,name,arg,raw);
    if(name==='j-skip'){const j=state(s),t=task(s);if(!validState(j)||!t)return false;j.assisted=true;j.feedback=t.worked;return true;}
    const j = state(s);
    if (!validState(j) || j.done) return false;
    const t = task(s),
      v = j.values,
      bits = raw.split(":");
    if (name === "j-next") return next(s);
    if (name === "j-help") {
      j.assisted = true;
      j.feedback = t.hint;
      return true;
    }
    if (name === "j-submit") {
      if (H.invalidDraft(v, t)) return false;
      const correct =
        valid(t, v) &&
        (j.stage !== 3 || total(v.parts || []) <= j.cash) &&
        (j.stage !== 7 || j.inventory.every((n) => n >= 2));
      if (!j.evidence.some((e) => e.stage === j.stage))
        j.evidence.push({
          stage: j.stage,
          firstValue: JSON.parse(JSON.stringify(value(t, v))),
          correct,
          assisted: j.assisted,
          source: "guided-journey",
        });
      j.solved = correct;
      j.feedback = correct
        ? "Ready for the next part of the journey."
        : "Keep adjusting. " + t.worked;
      j.assisted ||= !correct;
      return correct;
    }
    if (j.solved) return false;
    if (name === "j-part") {
      const i = Number(bits[1]),
        step = Number(bits[2]);
      if (i < 0 || i > 2 || !Number.isInteger(i) || ![-1, 1].includes(step))
        return false;
      v.parts = v.parts || [0, 0, 0];
      v.parts[i] = Math.max(0, Math.min(12, v.parts[i] + step));
      return true;
    }
    if (
      name === "j-choice" &&
      Number.isInteger(+arg) &&
      +arg >= 0 &&
      +arg < t.options?.length
    ) {
      v.choice = +arg;
      return true;
    }
    if (name === "j-coin") {
      v.coins = v.coins || [];
      if (arg === "clear") v.coins = [];
      else if (arg === "undo") v.coins.pop();
      else if (
        [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000].includes(+arg) &&
        v.coins.length < 100
      )
        v.coins.push(+arg);
      else return false;
      return true;
    }
    if (name === "j-adjust" || name === "j-value") {
      const n =
        name === "j-adjust" ? (v.amount || 0) + Number(arg) : Number(arg);
      if (!Number.isInteger(n) || n < 0 || n > t.max) return false;
      v.amount = n;
      delete v.amountDraft;
      return true;
    }
    return false;
  }
  function next(s) {
    if(s.adventure?.townActive===2)return L.next(s);
    const j = state(s);
    if (!validState(j) || !j.solved || j.done || j.completed.includes(j.stage))
      return false;
    if (j.stage === 1) j.shoppingList = [...j.values.parts];
    if (j.stage === 2) {
      j.cash -= task(s).options[j.values.choice].price;
      j.receipts.push({ id: j.id + ":bus", amount: 100 });
    }
    if (j.stage === 3) j.basket = [...j.values.parts];
    if (j.stage === 4) {
      j.cash -= 500;
      j.receipts.push({ id: j.id + ":checkout", amount: total(j.basket) });
    }
    if (j.stage === 5) {
      j.cash += 500 - total(j.basket);
      j.inventory = j.inventory.map((n, i) => n + j.basket[i]);
    }
    if (j.stage === 7) {
      if (j.inventory.some((n) => n < 2)) return false;
      j.inventory = j.inventory.map((n) => n - 2);
      j.done = true;
      s.resumeView = null;
    }
    j.completed.push(j.stage);
    j.stage++;
    j.context = T.context(venues[Math.min(j.stage, 7)], "journey");
    j.values = {};
    j.solved = false;
    j.assisted = false;
    j.feedback = "";
    return true;
  }
  function model(s) {
    if(s.adventure?.townActive===2)return L.model(s);
    const j = state(s);
    return validState(j)
      ? {
          ...j,
          title: names[j.stage] || "Dinner is ready",
          venue: venues[Math.min(j.stage, 7)],
          recipeName: recipes[j.recipe]?.name,
          task: task(s),
        }
      : null;
  }
  root.V5Journey = {
    start,
    state,
    validState,
    task,
    action,
    next,
    model,
    valid,
    recipes,
    names,
    venues,
  };
  if (typeof module !== "undefined")
    module.exports = { V5Journey: root.V5Journey };
})(typeof window !== "undefined" ? window : globalThis);
