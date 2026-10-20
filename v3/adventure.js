/* Repeatable, deterministic mission generation and durable evidence. No clock or network needed. */
(function (root) {
  "use strict";
  const T =
    typeof module !== "undefined" ? require("./town").V3Town : root.V3Town;
  const copy = (x) => JSON.parse(JSON.stringify(x)),
    money = T.money,
    clock = T.clock;
  const stories = {
    number: {
      guide: "Rowan",
      routes: ["Canopy courier", "Workshop supplies", "River lanterns"],
      types: ["line", "blocks", "line"],
      artefacts: ["Copper compass", "Carved leaf", "River lantern"],
      intro:
        "The bridge is only the beginning. Help Rowan reconnect the canopy trail and bring supplies to the workshop.",
    },
    fractions: {
      guide: "Saff",
      routes: ["Oasis gardener", "Temple channels", "Water carrier"],
      types: ["fraction", "fraction", "measure"],
      artefacts: ["Oasis seed", "Mosaic shard", "Water vessel"],
      intro:
        "Saff has found old irrigation plans. Share the water carefully so every garden can grow.",
    },
    algebra: {
      guide: "Finn",
      routes: ["Generator engineer", "Mountain railway", "Lift navigator"],
      types: ["balance", "sequence", "coordinate"],
      artefacts: ["Generator cog", "Railway token", "Crystal lens"],
      intro:
        "Finn’s lifts are moving again. Build a mountain railway and connect the observatory using patterns and coordinates.",
    },
    geometry: {
      guide: "Kit",
      routes: ["Tower mason", "Courtyard designer", "Sky bridge"],
      types: ["rotate", "grid", "rotate"],
      artefacts: ["Tower tile", "Courtyard rose", "Sky pennant"],
      intro:
        "Kit wants the castle to welcome visitors. Turn the stonework, lay the courtyard and build a sky bridge.",
    },
    ratio: {
      guide: "Marin",
      routes: ["Harbour supplier", "Sail maker", "Island kitchen"],
      types: ["ratio", "ratio", "measure"],
      artefacts: ["Harbour shell", "Sail patch", "Recipe card"],
      intro:
        "Marin is preparing the island festival. Pack supplies, mix colours and scale a recipe for the whole harbour.",
    },
    statistics: {
      guide: "Ada",
      routes: ["Neighbourhood survey", "Power planner", "Observatory keeper"],
      types: ["bars", "bars", "sequence"],
      artefacts: ["Survey notebook", "Power crystal", "Star chart"],
      intro:
        "Ada needs a clear picture of the city. Rebuild data displays and share power fairly between neighbourhoods.",
    },
    probability: {
      guide: "Nova",
      routes: ["Portal gardener", "Chance laboratory", "Festival spinner"],
      types: ["chance", "chance", "chance"],
      artefacts: ["Portal petal", "Chance prism", "Spinner pin"],
      intro:
        "Nova has opened new portal paths. Build equally likely chance pools and explore which outcomes are possible.",
    },
    measure: {
      guide: "Flint",
      routes: ["Rail surveyor", "Water pump", "Lift mechanic"],
      types: ["measure", "measure", "balance"],
      artefacts: ["Survey ruler", "Pump wheel", "Lift gear"],
      intro:
        "Flint has discovered another mine level. Measure the rails, fill the pump and balance the mechanical lift.",
    },
  };
  function state(s) {
    if (
      !s.adventure ||
      typeof s.adventure !== "object" ||
      Array.isArray(s.adventure)
    )
      s.adventure = {};
    const a = s.adventure;
    a.version = 1;
    for (const k of [
      "records",
      "suspended",
      "attempts",
      "difficulty",
      "camp",
      "taught",
      "campProjects",
    ])
      if (!a[k] || typeof a[k] !== "object" || Array.isArray(a[k])) a[k] = {};
    const validMission = (q) =>
      q &&
      typeof q === "object" &&
      routes(q.world).length &&
      (q.route === "gateway" ||
        routes(q.world).some((r) => r.id === q.route)) &&
      [1, 2, 3].includes(q.tier) &&
      q.key === id(q.world, q.route, q.tier) &&
      Number.isInteger(q.i) &&
      q.i >= 0 &&
      q.i < 3 &&
      Array.isArray(q.tasks) &&
      q.tasks.length === 3 &&
      q.tasks.every(
        (t) => t && typeof t.kind === "string" && t.answer !== undefined,
      ) &&
      q.values &&
      typeof q.values === "object" &&
      !Array.isArray(q.values) &&
      ["lesson", "play"].includes(q.phase);
    if (a.active && !validMission(a.active)) a.active = null;
    for (const key of Object.keys(a.suspended))
      if (!validMission(a.suspended[key])) delete a.suspended[key];
    for (const key of Object.keys(a.records)) {
      const r = a.records[key];
      if (
        !r ||
        !routes(r.world).length ||
        ![1, 2, 3].includes(r.tier) ||
        !(
          r.route === "gateway" || routes(r.world).some((v) => v.id === r.route)
        )
      )
        delete a.records[key];
    }
    return a;
  }
  const id = (world, route, tier) => [world, route, tier].join("|");
  function routes(world) {
    if (world === "town")
      return T.venues.map((v) => ({
        id: v.id,
        name: v.name,
        guide: v.guide,
        story: v.story,
        artefact: v.reward,
        skills: v.skills,
      }));
    const w = stories[world];
    return w
      ? w.routes.map((name, i) => ({
          id: String(i),
          name,
          guide: w.guide,
          story: w.intro,
          artefact: w.artefacts[i],
          skills: [],
        }))
      : [];
  }
  function recommendation(s, world) {
    const a = state(s),
      records = Object.values(a.records).filter((r) => r.world === world),
      last = records.sort((x, y) => y.serial - x.serial)[0];
    if (!last) return 1;
    return Math.max(
      1,
      Math.min(
        3,
        last.tier +
          ((last.lastUnassisted ?? last.unassisted) === 3
            ? 1
            : (last.lastUnassisted ?? last.unassisted) <= 1
              ? -1
              : 0),
      ),
    );
  }
  function completions(s, world) {
    return Object.values(state(s).records).filter((r) => r.world === world);
  }
  function visualLevel(s, world, legacy = 0) {
    const n = new Set(
      completions(s, world)
        .filter((r) => r.route !== "gateway")
        .map((r) => r.route),
    ).size;
    return Math.max(
      legacy,
      world === "town" ? (n >= 8 ? 3 : n >= 4 ? 2 : n ? 1 : 0) : Math.min(3, n),
    );
  }
  function collections(s) {
    const result = new Map();
    for (const r of Object.values(state(s).records)) {
      const route = routes(r.world).find((v) => v.id === r.route);
      const key = r.world + "|" + r.route;
      if (!result.has(key))
        result.set(key, {
          id: key,
          world: r.world,
          name:
            r.route === "gateway"
              ? "Gateway crest"
              : route?.artefact || "Explorer keepsake",
        });
    }
    return [...result.values()];
  }
  function entry(s, world, route, tier) {
    return state(s).records[id(world, route, tier)];
  }
  function commonTask(world, route, tier, seed, stage) {
    const n = seed * 13 + stage * 11 + Number(route) * 6,
      kind = stories[world].types[Number(route)],
      d = tier;
    let task = { kind, skill: null, unit: "", min: 0, max: 30, step: 1 };
    const teach = (text, example) => {
      task.teach = text;
      task.example = example;
    };
    if (kind === "line") {
      const start = -(2 + (n % 5)),
        move = 3 + (n % (4 + d * 3)),
        answer = start + move;
      Object.assign(task, {
        prompt: `Route the courier: start at ${start}, move ${move} steps right. Place the destination marker.`,
        answer,
        min: -8,
        max: 16,
      });
      teach(
        "Adding moves right on a number line. Negative numbers are left of zero. Count the spaces, including the step from −1 to 0.",
        "Start at −2 and move 3 spaces right: −1, 0, 1.",
      );
      task.worked = `${start} + ${move} = ${answer}. Place the marker at ${answer}.`;
      task.skill = "negative";
    }
    if (kind === "blocks") {
      const h = 1 + (n % (d + 2)),
        t = 1 + ((n * 3) % 8),
        o = n % 10;
      Object.assign(task, {
        prompt: `Pack ${h * 100 + t * 10 + o} supply units using hundreds, tens and ones.`,
        answer: [h, t, o],
        max: 9,
      });
      teach(
        "A hundred block is 100 units, a ten bar is 10 and a single cube is 1. Build each column separately.",
        "234 units = 2 hundreds, 3 tens and 4 ones.",
      );
      task.worked = `Use ${h} hundreds, ${t} tens and ${o} ones.`;
      task.skill = "place";
    }
    if (kind === "fraction" || kind === "chance") {
      const total = [4, 6, 8][d - 1],
        answer = 1 + (n % (total - 1));
      Object.assign(task, {
        prompt:
          kind === "fraction"
            ? `Open ${answer}/${total} of the equal irrigation channels.`
            : `Build a pool with chance ${answer}/${total} of a green portal. All ${total} slots are equally likely.`,
        answer,
        total,
      });
      teach(
        kind === "fraction"
          ? "A denominator counts equal parts; the numerator counts the parts you choose."
          : "Probability = favourable outcomes ÷ all equally likely outcomes. A bigger green share increases the chance; it does not guarantee a result.",
        "Choose 1 of 4 equal parts to make one quarter.",
      );
      task.worked = `Select ${answer} of the ${total} equal ${kind === "fraction" ? "channels" : "slots"}.`;
      task.skill = kind === "fraction" ? "fractions" : "prob_chance";
    }
    if (kind === "balance") {
      const coefficient = d,
        add = 1 + (n % 7),
        answer = 2 + (n % 8),
        total = coefficient * answer + add;
      Object.assign(task, {
        prompt: `Power the ${world === "measure" ? "lift" : "generator"}: ${coefficient} × x + ${add} = ${total}. Set the value of one battery x.`,
        answer,
        coefficient,
        add,
        total,
        max: 12,
      });
      teach(
        "Keep both sides equal. Remove the added amount first, then divide the remaining total by the number of equal batteries.",
        "For 2x + 3 = 11, subtract 3 to get 8, then divide by 2: x = 4.",
      );
      task.worked = `(${total} − ${add}) ÷ ${coefficient} = ${answer}.`;
      task.skill = "algebra_missing";
    }
    if (kind === "sequence") {
      const start = 2 + (n % 7),
        step = d + 1 + (n % 3),
        values = [start, start + step, start + 2 * step],
        answer = start + 3 * step;
      Object.assign(task, {
        prompt:
          "Attach the next numbered carriage to extend this repeating-step pattern.",
        values,
        answer,
        max: 50,
      });
      teach(
        "Find the difference between neighbouring values. Add the same difference to continue an arithmetic sequence.",
        "3, 6, 9 increases by 3, so the next value is 12.",
      );
      task.worked = `Each step adds ${step}; ${values[2]} + ${step} = ${answer}.`;
      task.skill = "algebra_patterns";
    }
    if (kind === "coordinate") {
      const minCoord = 1 - d,
        maxCoord = minCoord + 4,
        x = d === 1 ? 1 + (n % 4) : minCoord + (n % 5),
        y = d === 1 ? 1 + ((n * 3 + 1) % 4) : minCoord + ((n * 3 + 1) % 5);
      Object.assign(task, {
        prompt: `Route the lift to (${x}, ${y}). Choose x across and y vertically from the origin.`,
        answer: [x, y],
        size: 5,
        minCoord,
        maxCoord,
      });
      teach(
        "Coordinates are (x, y): across first, then vertically. The origin is (0, 0). Negative x goes left of the origin; negative y goes below it.",
        "(−2, 1) means two left and one up from the origin.",
      );
      task.worked = `Choose x = ${x} and y = ${y}.`;
      task.skill = "algebra_coordinates";
    }
    if (kind === "rotate") {
      const degrees = (1 + (n % 3)) * 90,
        answer =
          d === 1
            ? degrees
            : d === 2
              ? (360 - degrees) % 360
              : (450 - degrees) % 360;
      Object.assign(task, {
        prompt:
          d === 1
            ? `Turn the tower piece ${degrees}° clockwise from its starting position.`
            : d === 2
              ? `Turn the tower piece ${degrees}° anticlockwise from its starting position.`
              : `Turn 90° clockwise, then ${degrees}° anticlockwise. Show the final tower-piece position.`,
        answer,
        max: 270,
        step: 90,
      });
      teach(
        "A quarter turn is 90° and a full turn is 360°. Clockwise and anticlockwise are opposite directions. Add clockwise turns and subtract anticlockwise turns; a full turn returns to the start.",
        "90° clockwise then 90° anticlockwise cancel. One anticlockwise quarter turn reaches the same position as three clockwise quarter turns.",
      );
      task.worked = `The final position is ${answer}° clockwise from the start (${answer / 90} clockwise quarter turns).`;
      task.skill = "geometry_transforms";
    }
    if (kind === "grid") {
      const cols = 2 + (n % 3),
        rows = 1 + ((n + 1) % (d + 1));
      const answer = [];
      for (let y = 0; y < rows; y++)
        for (let x = 0; x < cols; x++) answer.push(y * 5 + x);
      Object.assign(task, {
        prompt: `Lay a courtyard rectangle ${cols} tiles wide and ${rows} tiles high. Start in the top-left corner.`,
        answer,
        cols,
        rows,
        size: 5,
      });
      teach(
        "A rectangle has equal opposite sides. Area counts the square tiles covering it: width × height. Here the rows start at the top.",
        "A 2-wide, 3-high rectangle uses 2 × 3 = 6 square tiles.",
      );
      task.worked = `Fill the first ${cols} cells in each of the top ${rows} rows: ${cols * rows} tiles.`;
      task.skill = "geometry_area";
    }
    if (kind === "ratio") {
      const a = 1 + d,
        b = 2 + d,
        groups = 1 + (n % 3),
        green = a * groups,
        answer = b * groups;
      Object.assign(task, {
        prompt: `Pack green : blue supplies in a ${a} : ${b} ratio. There are ${green} green crates.`,
        green,
        answer,
        max: 20,
      });
      teach(
        "Scale both sides of a ratio by the same number. Find the number of groups from the known colour.",
        "For 2 : 3, four green is two groups, so six blue is needed.",
      );
      task.worked = `${green} ÷ ${a} = ${groups} groups; ${groups} × ${b} = ${answer} blue.`;
      task.skill = "ratio_basics";
    }
    if (kind === "bars") {
      const base = 2 + (n % 6),
        spread = d;
      Object.assign(task, {
        prompt:
          "Set the observatory’s mean bar to the mean power of the three neighbourhood bars.",
        values: [base, base + spread, base + 2 * spread],
        answer: base + spread,
        max: 20,
      });
      teach(
        "The mean shares a total equally: add the values, then divide by how many values there are.",
        "The mean of 2, 4 and 6 is (2 + 4 + 6) ÷ 3 = 4.",
      );
      task.worked = `(${task.values.join(" + ")}) ÷ 3 = ${task.answer}.`;
      task.skill = "stats_averages";
    }
    if (kind === "measure") {
      const isWater =
        (world === "measure" && route === "1") ||
        world === "fractions" ||
        world === "ratio";
      const units = 1 + (n % (d + 3)),
        fraction = world === "fractions" ? 2 : 1,
        answer = isWater ? units * 250 : units * 100;
      Object.assign(task, {
        kind: "measure",
        prompt: isWater
          ? `Fill the ${world === "ratio" ? "recipe container" : "water tank"} with ${units / 4} litres. Set the volume in millilitres.`
          : `Lay a rail ${units} metres long. Set the length in centimetres.`,
        answer,
        unit: isWater ? "ml" : "cm",
        max: isWater ? 2000 : 1000,
        step: isWater ? 50 : 25,
      });
      teach(
        isWater
          ? "One litre contains 1,000 millilitres. Multiply litres by 1,000 to convert."
          : "One metre contains 100 centimetres. Multiply metres by 100 to convert.",
        "Half a litre is 500 ml. Two metres is 200 cm.",
      );
      task.worked = isWater
        ? `${units / 4} × 1,000 = ${answer} ml.`
        : `${units} × 100 = ${answer} cm.`;
      task.skill = isWater ? "measure_volume" : "measure_units";
    }
    task.hint = task.teach;
    return task;
  }
  function townTask(venue, tier, seed, stage) {
    const n = (seed * 5 + stage * 3) % 17,
      d = tier,
      price = 100 + 25 * (n % 5),
      count = 1 + (n % 2),
      base = {
        venue,
        kind: "amount",
        min: 0,
        max: 100000,
        step: 25,
        unit: "p",
        skill: T.venues.find((v) => v.id === venue).skills[stage % 2],
      };
    let t = base;
    if (
      (venue === "market" || venue === "cafe" || venue === "leisure") &&
      stage === 0
    ) {
      const isCafe = venue === "cafe",
        items = isCafe
          ? [
              ["Sandwich", 250],
              ["Fruit", 75],
              ["Water", 100],
            ]
          : venue === "leisure"
            ? [
                ["Child ticket", 450],
                ["Adult ticket", 700],
                ["Snack", 150],
              ]
            : [
                ["Apples", price],
                ["Milk", 150],
                ["Bread", 125],
              ];
      const quantities = [count, d === 3 ? 2 : 1, venue === "leisure" ? 0 : 1],
        total = items.reduce(
          (sum, item, i) => sum + item[1] * quantities[i],
          0,
        );
      Object.assign(t, {
        kind: "basket",
        items: items.map(([name, price]) => ({ name, price })),
        quantities,
        budget: Math.ceil(total / 500) * 500,
        prompt: `${isCafe ? "Prepare the café order" : venue === "leisure" ? "Book the film tickets" : "Pack the shopping list"}: ${items.map((item, i) => quantities[i] + " " + item[0]).join(", ")}. Stay within ${money(Math.ceil(total / 500) * 500)}.`,
        answer: quantities,
        worked: `Use the requested quantities. Total ${money(total)}; ${money(Math.ceil(total / 500) * 500 - total)} remains.`,
      });
    } else if ((venue === "market" || venue === "shops") && stage === 1) {
      const packSize = 2 + d,
        unit = 35 + n * 5;
      Object.assign(t, {
        kind: "offers",
        need: packSize * 2,
        items: [
          {
            name: packSize + " apples",
            quantity: packSize,
            price: unit * packSize,
          },
          {
            name: packSize * 2 + " apples",
            quantity: packSize * 2,
            price: unit * packSize * 2 + 50,
          },
        ],
        answer: [2, 0],
        prompt: `Buy at least ${packSize * 2} apples for the lowest total cost. Add whole packs to the basket.`,
        worked: `Two small packs cost ${money(unit * packSize * 2)}; one large pack costs ${money(unit * packSize * 2 + 50)}. Two small packs are 50p cheaper.`,
      });
    } else if (
      ["market", "cafe", "leisure", "station"].includes(venue) &&
      stage === 2
    ) {
      const bill = price * (d + 1) + 75,
        paid = Math.ceil(bill / 500) * 500;
      Object.assign(t, {
        kind: "coins",
        prompt: `${venue === "station" ? "A travel ticket" : "The bill"} costs ${money(bill)}. Paid ${money(paid)}. Put the exact change in the tray.`,
        answer: paid - bill,
        bill,
        paid,
        worked: `${money(paid)} − ${money(bill)} = ${money(paid - bill)} change.`,
      });
    } else if (venue === "cafe" && stage === 1) {
      const people = d + 1,
        each = 250 + n * 25;
      Object.assign(t, {
        prompt: `Share a ${money(each * people)} café bill equally between ${people} friends. Set each person’s payment.`,
        answer: each,
        worked: `${money(each * people)} ÷ ${people} = ${money(each)} each.`,
      });
    } else if (venue === "bank") {
      const balance = 2000 + n * 100,
        amount = 500 + d * 100;
      if (stage === 0)
        Object.assign(t, {
          kind: "bank",
          balance,
          transactions: [
            { name: "Deposit", amount },
            { name: "Withdrawal", amount: -(200 + d * 50) },
          ],
          prompt: `Start at ${money(balance)}. Post the deposit and withdrawal in order, then set the final balance.`,
          answer: balance + amount - 200 - d * 50,
          worked: `${money(balance)} + ${money(amount)} − ${money(200 + d * 50)} = ${money(balance + amount - 200 - d * 50)}.`,
        });
      else if (stage === 1)
        Object.assign(t, {
          prompt: `Your savings balance is ${money(balance)}. Withdraw ${money(amount)} for planned supplies. Set the remaining balance.`,
          answer: balance - amount,
          worked: `${money(balance)} − ${money(amount)} = ${money(balance - amount)}.`,
        });
      else {
        const savings = (1 + (n % 5)) * 10000,
          rate = d;
        Object.assign(t, {
          prompt: `Fictional savings: ${money(savings)} at ${rate}% simple interest for one year. Set the final balance including interest.`,
          answer: savings + (savings * rate) / 100,
          step: 100,
          worked: `Interest ${money((savings * rate) / 100)}; final balance ${money(savings + (savings * rate) / 100)}. Real bank conditions vary.`,
        });
      }
    } else if (venue === "shops" && stage === 0) {
      const original = (20 + n) * 100,
        rate = d * 10;
      Object.assign(t, {
        kind: "discount",
        original,
        rate,
        prompt: `Put the correct sale-price label on a ${money(original)} jacket with ${rate}% off.`,
        answer: (original * (100 - rate)) / 100,
        step: 10,
        worked: `Save ${money((original * rate) / 100)}. Sale price ${money((original * (100 - rate)) / 100)}.`,
      });
    } else if ((venue === "shops" || venue === "home") && stage === 2) {
      const amounts = [(5 + n) * 100, (2 + d) * 100, 300],
        budget = amounts.reduce((a, b) => a + b, 0);
      Object.assign(t, {
        kind: "budget",
        labels: ["Essentials", "Travel", "Savings"],
        amounts,
        budget,
        prompt: `Allocate ${money(budget)}: ${money(amounts[0])} for essentials, ${money(amounts[1])} for travel, and ${money(amounts[2])} for savings. Use the three envelopes.`,
        answer: amounts,
        step: 100,
        worked: `${amounts.map(money).join(" + ")} = ${money(budget)}. Every pound has a purpose.`,
      });
    } else if (venue === "station" && stage === 0) {
      const deadline = 600 + n * 5,
        walk = 10;
      const options = [
        {
          name: "Bus A",
          depart: deadline - 50,
          arrive: deadline - 15,
          price: 200,
        },
        {
          name: "Bus B",
          depart: deadline - 30,
          arrive: deadline - 5,
          price: 150,
        },
        {
          name: "Train C",
          depart: deadline - 40,
          arrive: deadline - 20,
          price: 350,
        },
      ];
      Object.assign(t, {
        kind: "journey",
        options,
        deadline,
        walk,
        prompt: `Arrive for ${clock(deadline)}. Allow ${walk} minutes to walk from the station. Book the cheapest service that gets you there in time.`,
        answer: 0,
        worked: `Bus A arrives at ${clock(options[0].arrive)}; plus 10 minutes reaches ${clock(options[0].arrive + walk)}. Bus B is too late after walking. Train C costs more.`,
      });
    } else if ((venue === "station" || venue === "leisure") && stage === 1) {
      const start = 780 + n * 5,
        duration = 45 + d * 15,
        walk = venue === "station" ? 10 : 15;
      Object.assign(t, {
        kind: "clock",
        start,
        duration,
        walk,
        prompt: `${venue === "station" ? "Journey" : "Film"} starts ${clock(start)} (${Math.floor(start / 60) - 12}:${String(start % 60).padStart(2, "0")} pm), lasts ${duration} minutes, then a ${walk}-minute walk. Set the arrival clock.`,
        answer: start + duration + walk,
        step: 5,
        max: 1439,
        unit: "time",
        worked: `${clock(start)} + ${duration} + ${walk} minutes = ${clock(start + duration + walk)}.`,
      });
    } else if (venue === "home" && stage === 0) {
      const previous = 1200 + n,
        current = previous + 3 + d,
        rate = 25,
        standing = 50;
      Object.assign(t, {
        kind: "bill",
        previous,
        current,
        rate,
        standing,
        prompt:
          "Prepare the fictional electricity bill from the meter readings. Include one day’s standing charge.",
        answer: (current - previous) * rate + standing,
        worked: `(${current} − ${previous}) × 25p + 50p = ${money((current - previous) * rate + standing)}.`,
      });
    } else if (venue === "home" && stage === 1) {
      const volume = (d + 1) * 250;
      Object.assign(t, {
        kind: "measure",
        prompt: `Measure ${volume / 1000} litres of water for the household planter. Set the jug in ml.`,
        answer: volume,
        step: 50,
        max: 2000,
        unit: "ml",
        worked: `${volume / 1000} litres × 1,000 = ${volume} ml.`,
      });
    } else if (venue === "work") {
      const rate = 800 + n * 25,
        hours = 2 + d;
      if (stage === 0)
        Object.assign(t, {
          kind: "timesheet",
          start: 540,
          finish: 540 + hours * 60 + 30,
          breakMinutes: 30,
          rate,
          prompt: `Shift 09:00–${clock(540 + hours * 60 + 30)}, including a 30-minute unpaid break. Set gross wages at ${money(rate)}/paid hour.`,
          answer: rate * hours,
          step: 25,
          worked: `${hours + 0.5} hours minus 0.5-hour unpaid break = ${hours} paid hours. ${hours} × ${money(rate)} = ${money(rate * hours)} gross.`,
        });
      else if (stage === 1) {
        const gross = rate * hours,
          deduction = 150 + d * 50;
        Object.assign(t, {
          kind: "payslip",
          gross,
          deduction,
          prompt:
            "Complete the simplified fictional payslip: set the net pay after the supplied deduction.",
          answer: gross - deduction,
          worked: `Gross ${money(gross)} − supplied deduction ${money(deduction)} = net ${money(gross - deduction)}. These are not real tax rates.`,
        });
      } else {
        const goal = (40 + n * 5) * 100,
          saved = (5 + d) * 100,
          weekly = (5 + d) * 100,
          weeks = Math.ceil((goal - saved) / weekly);
        Object.assign(t, {
          kind: "amount",
          unit: "weeks",
          step: 1,
          max: 20,
          prompt: `Save for a ${money(goal)} tool kit. You already have ${money(saved)} and save ${money(weekly)} each week. Set the whole number of weeks needed.`,
          answer: weeks,
          worked: `(${money(goal)} − ${money(saved)}) ÷ ${money(weekly)} needs ${weeks} whole weeks. Round up to cover the remaining cost.`,
        });
      }
    }
    if (t.answer === undefined)
      throw Error("Missing town activity " + venue + " " + stage);
    if (venue === "bank")
      t.skill = stage === 2 ? "town_interest" : "town_balance";
    if (venue === "station")
      t.skill = stage === 2 ? "town_travel" : "town_timetable";
    if (venue === "shops" && stage === 2) t.skill = "town_household";
    if (venue === "work" && stage === 2) t.skill = "town_household";
    const lesson = T.lessons.find((l) => l[0] === t.skill);
    t.teach = lesson[4];
    t.example = lesson[5];
    if (venue === "work" && stage === 2) {
      t.teach +=
        " Count whole weeks and round up if part of another week is needed.";
      t.example =
        "If you still need £11 and save £5 each week, you need 3 whole weeks.";
    }
    t.hint = t.teach;
    return t;
  }
  function task(world, route, tier, seed, stage) {
    if (route === "gateway") {
      if (world === "town")
        return townTask(
          ["market", "bank", "station"][stage],
          tier,
          seed,
          stage === 0 ? 0 : stage === 1 ? 0 : 0,
        );
      return commonTask(world, String(stage), tier, seed, stage);
    }
    return world === "town"
      ? townTask(route, tier, seed, stage)
      : commonTask(world, route, tier, seed, stage);
  }
  function start(s, world, route, tier) {
    const a = state(s),
      valid =
        routes(world).some((r) => r.id === route) ||
        (route === "gateway" && routes(world).length);
    if (!valid) return false;
    tier = Math.max(1, Math.min(3, Math.trunc(tier) || 1));
    const key = id(world, route, tier);
    if (a.active) a.suspended[a.active.key] = a.active;
    if (a.suspended[key]) a.active = a.suspended[key];
    else {
      const seed = (a.attempts[key] || 0) + 1;
      a.attempts[key] = seed;
      a.active = {
        key,
        world,
        route,
        tier,
        seed,
        i: 0,
        phase: "lesson",
        tasks: [0, 1, 2].map((i) => task(world, route, tier, seed, i)),
        values: {},
        assisted: false,
        unassisted: 0,
        feedback: "",
        solved: false,
      };
    }
    s.world = world;
    s.view = "adventure";
    s.resumeView = "adventure";
    return true;
  }
  function current(s) {
    return state(s).active;
  }
  function begin(s) {
    const q = current(s);
    if (q?.phase === "lesson") {
      q.phase = "play";
      state(s).taught[q.tasks[q.i].skill] = true;
    }
  }
  function edit(s, key, value) {
    const q = current(s);
    if (!q || q.phase !== "play" || q.solved) return false;
    const t = q.tasks[q.i],
      integer = (n) => Number.isInteger(n),
      array = Array.isArray;
    let valid = false;
    if (key === "amount")
      valid = integer(value) && value >= (t.min || 0) && value <= t.max;
    if (key === "parts") {
      const length = t.items?.length || 3,
        max = t.kind === "blocks" ? 9 : t.kind === "budget" ? t.budget : 12;
      valid =
        array(value) &&
        value.length === length &&
        value.every((n) => integer(n) && n >= 0 && n <= max);
    }
    if (key === "selected") {
      const max = t.kind === "grid" ? 25 : t.total;
      valid =
        array(value) &&
        new Set(value).size === value.length &&
        value.every((n) => integer(n) && n >= 0 && n < max);
    }
    if (key === "point")
      valid =
        array(value) &&
        value.length === 2 &&
        value.every(
          (n) => integer(n) && n >= (t.minCoord ?? 0) && n <= (t.maxCoord ?? 4),
        );
    if (key === "choice")
      valid = integer(value) && value >= 0 && value < t.options?.length;
    if (key === "coins")
      valid =
        array(value) &&
        value.length <= 100 &&
        value.every((n) =>
          [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000].includes(n),
        );
    if (key === "posted")
      valid =
        t.kind === "bank" &&
        integer(value) &&
        value === (q.values.posted || 0) + 1 &&
        value <= t.transactions.length;
    if (!valid) return false;
    q.values[key] = copy(value);
    return true;
  }
  function value(q, t) {
    if (["fraction", "chance", "grid"].includes(t.kind))
      return q.values.selected || [];
    if (["basket", "offers", "budget", "blocks"].includes(t.kind))
      return q.values.parts || [];
    if (t.kind === "coordinate") return q.values.point || [];
    if (t.kind === "journey") return q.values.choice ?? -1;
    if (t.kind === "coins")
      return (q.values.coins || []).reduce((a, b) => a + b, 0);
    return Number(q.values.amount || 0);
  }
  function correct(q, t) {
    const v = value(q, t);
    if (["fraction", "chance"].includes(t.kind)) return v.length === t.answer;
    if (t.kind === "bank" && (q.values.posted || 0) !== t.transactions.length)
      return false;
    if (Array.isArray(t.answer)) {
      if (v.length !== t.answer.length) return false;
      return t.kind === "grid"
        ? [...v].sort((a, b) => a - b).every((n, i) => n === t.answer[i])
        : v.every((n, i) => n === t.answer[i]);
    }
    return v === t.answer;
  }
  function help(s, worked = false) {
    const q = current(s);
    if (!q || q.solved) return;
    q.assisted = true;
    q.feedback = worked
      ? "Let’s work through it. " + q.tasks[q.i].worked
      : q.tasks[q.i].hint;
  }
  function submit(s) {
    const q = current(s);
    if (!q || q.phase !== "play" || q.solved) return false;
    const t = q.tasks[q.i];
    if (!correct(q, t)) {
      q.assisted = true;
      q.feedback = "Let’s adjust this together. " + t.worked;
      return false;
    }
    q.solved = true;
    if (!q.assisted) q.unassisted++;
    q.feedback = "That works! Your plan is ready.";
    return true;
  }
  function next(s, now = Date.now()) {
    const a = state(s),
      q = a.active;
    if (!q?.solved) return false;
    if (q.i < 2) {
      q.i++;
      q.phase = "lesson";
      q.values = {};
      q.assisted = false;
      q.solved = false;
      q.feedback = "";
      return false;
    }
    const old = a.records[q.key],
      serial =
        Object.values(a.records).reduce(
          (n, r) => Math.max(n, r.serial || 0),
          0,
        ) + 1;
    a.records[q.key] = {
      world: q.world,
      route: q.route,
      tier: q.tier,
      unassisted: Math.max(old?.unassisted || 0, q.unassisted),
      lastUnassisted: q.unassisted,
      completedAt: new Date(now).toISOString(),
      serial,
    };
    const milestone = "mission|" + q.key;
    if (!s.milestones.includes(milestone)) s.milestones.push(milestone);
    s.recent.unshift({
      type: "expedition",
      world: q.world,
      route: q.route,
      tier: q.tier,
      assisted: q.unassisted < 3,
      date: new Date(now).toISOString(),
    });
    s.recent = s.recent.slice(0, 30);
    s.lastResult = {
      type: "expedition",
      world: q.world,
      route: q.route,
      tier: q.tier,
      newReward: !old,
    };
    delete a.suspended[q.key];
    a.active = null;
    s.resumeView = null;
    s.view = "recap";
    return true;
  }
  function campPlace(s, slot, artefact) {
    const a = state(s);
    if (!["shelf", "garden", "gate"].includes(slot)) return false;
    if (artefact && !collections(s).some((c) => c.id === artefact))
      return false;
    a.camp[slot] = artefact || null;
    return true;
  }
  const projects = [
    {
      id: "greenhouse",
      name: "Community greenhouse",
      need: 12,
      story: "Grow a garden together.",
    },
    {
      id: "lookout",
      name: "Explorer lookout",
      need: 30,
      story: "A view across your restored worlds.",
    },
    {
      id: "noticeboard",
      name: "Town noticeboard",
      need: 60,
      story: "Keep your neighbours’ stories at camp.",
    },
  ];
  function build(s, id) {
    const project = projects.find((p) => p.id === id);
    if (!project || s.milestones.length < project.need) return false;
    state(s).campProjects[id] = true;
    return true;
  }
  root.V3Adventure = {
    stories,
    routes,
    state,
    id,
    entry,
    recommendation,
    completions,
    visualLevel,
    collections,
    start,
    current,
    begin,
    edit,
    help,
    submit,
    next,
    value,
    correct,
    task,
    campPlace,
    projects,
    build,
  };
})(typeof module !== "undefined" ? module.exports : window);
