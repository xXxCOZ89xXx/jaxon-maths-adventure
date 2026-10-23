/* Practical Maths Town: fictional UK examples, integer-pence arithmetic, no banking APIs. */
(function (root) {
  "use strict";
  const money = (p) => "£" + (p / 100).toFixed(2),
    clock = (m) =>
      String(Math.floor(m / 60) % 24).padStart(2, "0") +
      ":" +
      String(m % 60).padStart(2, "0");
  const world = {
    id: "town",
    name: "Practical Maths Town",
    tag: "A town ready for tomorrow",
    guide: "Ellis",
    color: "#e1b07c",
    sky: "#e8dfc9",
    ground: "#91a280",
    skill: "town_money",
    kind: "town",
    goal: "Help your neighbours reopen their town, plan a day out and build everyday independence.",
    stages: [
      "High Street reopened",
      "Neighbourhood connected",
      "Town festival ready",
    ],
  };
  const venues = [
    {
      id: "market",
      name: "Supermarket",
      guide: "Priya",
      icon: "▤",
      story:
        "The delivery has arrived. Help Priya stock the shelves and serve the first customers.",
      reward: "Market basket",
      skills: ["town_money", "town_totals"],
      landmark: "Community market",
    },
    {
      id: "cafe",
      name: "Corner Café",
      guide: "Sam",
      icon: "☕",
      story:
        "Sam is opening the café for a community lunch. Prepare an order and settle the bill together.",
      reward: "Café enamel mug",
      skills: ["town_menu", "town_split"],
      landmark: "Café terrace",
    },
    {
      id: "bank",
      name: "Community Bank",
      guide: "Morgan",
      icon: "▥",
      story:
        "Morgan is teaching the town club to manage a fictional savings account. Every amount here is pretend.",
      reward: "Savings acorn",
      skills: ["town_balance", "town_interest"],
      landmark: "Savings garden",
    },
    {
      id: "shops",
      name: "Shopping Centre",
      guide: "Alex",
      icon: "▧",
      story:
        "Alex needs supplies for the festival. Compare offers and leave enough in the budget for essentials.",
      reward: "Smart shopper badge",
      skills: ["town_discounts", "town_value"],
      landmark: "Shopping arcade",
    },
    {
      id: "station",
      name: "Bus & Train Station",
      guide: "Dev",
      icon: "⇄",
      story:
        "Dev is reconnecting the station. Plan a journey that arrives in time without overspending.",
      reward: "Explorer travel pass",
      skills: ["town_timetable", "town_travel"],
      landmark: "Station platforms",
    },
    {
      id: "home",
      name: "Neighbourhood Home",
      guide: "Jess",
      icon: "⌂",
      story:
        "Jess is getting the community house ready. Read the meters, measure supplies and plan a small household budget.",
      reward: "House key charm",
      skills: ["town_bills", "town_household"],
      landmark: "Community house",
    },
    {
      id: "leisure",
      name: "Cinema & Leisure",
      guide: "Rory",
      icon: "▷",
      story:
        "Rory is organising a film afternoon. Choose tickets, plan the time and keep within an allowance.",
      reward: "Festival ticket",
      skills: ["town_tickets", "town_time"],
      landmark: "Cinema square",
    },
    {
      id: "work",
      name: "Workshop Workplace",
      guide: "Ash",
      icon: "⚒",
      story:
        "Ash is helping at the workshop. Read a timesheet and check a simplified fictional payslip.",
      reward: "Workshop pencil",
      skills: ["town_wages", "town_payslip"],
      landmark: "Training workshop",
    },
  ];
  const lessons = [
    [
      "town_money",
      "UK coins and notes",
      "market",
      "Count pounds and pence; 100p makes £1.",
      "UK coins are 1p, 2p, 5p, 10p, 20p, 50p, £1 and £2. Common notes are £5, £10, £20 and £50. The value is printed on them. Count larger values first and convert pounds to pence before adding.",
      "A £1 coin and two 20p coins make 140p, or £1.40.",
    ],
    [
      "town_totals",
      "Shopping totals and change",
      "market",
      "Add prices and check the money returned.",
      "Add all prices to find the total. Change = money paid − total. Check by adding the change back to the total. Working in whole pence avoids decimal-place mistakes.",
      "Bread costs £1.20 and milk £1.50: total £2.70. From £5, change is £2.30.",
    ],
    [
      "town_menu",
      "Menus and spending budgets",
      "cafe",
      "Choose an order that fits the available money.",
      "Read each menu price, multiply by the number ordered, then add. A budget is the maximum you can spend. Money left = budget − order total. You can change the order before paying.",
      "Two £2 sandwiches cost £4. A £5 budget leaves £1.",
    ],
    [
      "town_split",
      "Sharing a bill fairly",
      "cafe",
      "Split equal costs between people.",
      "When everyone shares the whole bill equally, divide the total by the number of people. If people pay for their own orders, add each person’s items instead. Agree the method first.",
      "A £12 bill shared equally by 3 people is £4 each.",
    ],
    [
      "town_balance",
      "Balances, deposits and withdrawals",
      "bank",
      "Track money entering and leaving an account.",
      "A balance is the money in an account. A deposit puts money in; a withdrawal takes money out. New balance = old balance + deposits − withdrawals. A statement lists these transactions. We use fictional accounts only.",
      "Start with £20, deposit £5, then withdraw £3: £22 remains.",
    ],
    [
      "town_interest",
      "Saving and simple interest",
      "bank",
      "Explore a fixed one-year interest example.",
      "Savings are money kept for later. In these simplified examples, one year’s simple interest = starting savings × rate ÷ 100. Add it to the starting balance. Real accounts can have changing rates, conditions and tax.",
      "£100 at 2% simple interest earns £2 after one year: balance £102.",
    ],
    [
      "town_discounts",
      "Discounts and sale prices",
      "shops",
      "Find the amount saved and the final price.",
      "A discount reduces the original price. Find 10% by dividing by 10. Discount = original price × percentage ÷ 100. Sale price = original price − discount.",
      "20% off £10 saves £2, so the sale price is £8.",
    ],
    [
      "town_value",
      "Unit prices and offers",
      "shops",
      "Compare packs for the quantity you actually need.",
      "Unit price = pack price ÷ number of items. Compare the same unit, such as cost per item or per litre. Also check the total cost and whether you need all the items: a larger pack is not always the right purchase.",
      "Four apples for £2 cost 50p each; three for £1.20 cost 40p each.",
    ],
    [
      "town_timetable",
      "Timetables and journey durations",
      "station",
      "Read 12/24-hour time and allow time to arrive.",
      "The 24-hour clock uses 00:00 to 23:59. After noon, add 12 to a pm hour (except 12 pm). Journey duration is arrival minus departure. Count to the next hour, then onwards. Leave time for walking and transfers.",
      "09:40 to 10:15 lasts 20 + 15 = 35 minutes. 3:30 pm is 15:30.",
    ],
    [
      "town_travel",
      "Travel costs and ticket choices",
      "station",
      "Compare suitable tickets and plan return costs.",
      "A single covers one journey. A return covers the outward and return journeys under its conditions. Compare the return price with the cost of two singles. Check the route and time restrictions before choosing.",
      "Two £2 singles cost £4. A suitable £3.50 return saves 50p.",
    ],
    [
      "town_bills",
      "Bills and energy readings",
      "home",
      "Read units used and calculate a fictional bill.",
      "An electricity meter records energy in kilowatt-hours (kWh). Units used = new reading − old reading. Energy cost = units × price per kWh. Add any stated standing charge for each day. These are made-up tariffs, not advice about a real bill.",
      "A meter rises from 100 to 104 kWh. At 25p per kWh, energy costs £1. Add a stated 50p standing charge: £1.50.",
    ],
    [
      "town_household",
      "Household budgeting and measures",
      "home",
      "Plan essentials and keep some money aside.",
      "List the available money, essential costs and savings. Add costs, then subtract from the budget. A litre is 1,000 millilitres; a metre is 100 centimetres. Check units before measuring household supplies.",
      "From £20, set aside £12 for food and £5 for travel. £3 remains.",
    ],
    [
      "town_tickets",
      "Ticket prices and allowances",
      "leisure",
      "Plan a day out within an allowance.",
      "An allowance is a set amount you can spend. Add tickets, travel and any extras. Compare eligible ticket offers, and keep enough for the whole activity. A cheaper ticket may have conditions.",
      "Two £4 tickets cost £8. A £10 allowance leaves £2 for extras.",
    ],
    [
      "town_time",
      "Planning activity times",
      "leisure",
      "Find finish times and allow a gap between plans.",
      "Add an activity’s duration to its starting time. Sixty minutes makes one hour. Include any stated break or walk before planning the next activity. Show pm times clearly in 24-hour format.",
      "A 14:30 film lasts 90 minutes, ending at 16:00. A 15-minute walk means arrival at 16:15.",
    ],
    [
      "town_wages",
      "Hours worked and gross wages",
      "work",
      "Read a timesheet and calculate basic pay.",
      "Hourly pay is the amount earned for each paid hour. Gross wages = paid hours × hourly rate. Subtract an unpaid break from a shift before calculating paid hours. These are fictional educational jobs and rates.",
      "Three paid hours at £8 per hour earn £24 gross.",
    ],
    [
      "town_payslip",
      "Understanding a simple payslip",
      "work",
      "Distinguish gross pay, deductions and net pay.",
      "Gross pay is pay before deductions. Deductions are amounts taken from pay; real examples can include tax, National Insurance and pensions. Net pay is gross minus the deductions shown. Our simplified deductions are supplied amounts, not real tax calculations.",
      "Gross pay £40 minus a stated £3 deduction gives £37 net pay.",
    ],
  ];
  function question(id, band, round, i = 0) {
    const d = Math.max(1, Math.min(3, band - 4)),
      n = Math.max(1, Math.floor(round)) * 3 + i + 1;
    let prompt, answer, hint, worked;
    const pounds = 4 + n + d,
      price = 100 + 25 * (n % 8),
      count = 2 + (n % 3),
      pay = 800 + 25 * (n % 20);
    switch (id) {
      case "town_money":
        prompt = `A £${2 + n} note-and-coin total plus ${10 * ((n % 5) + 1)}p: how many pence altogether?`;
        answer = (2 + n) * 100 + 10 * ((n % 5) + 1);
        hint = "Convert pounds to pence first.";
        worked = `${2 + n} × 100 + ${10 * ((n % 5) + 1)} = ${answer}p.`;
        break;
      case "town_totals":
        prompt = `Pay £${pounds} for items costing ${money(price)} and ${money(price + 35)}. Change in pence?`;
        answer = pounds * 100 - 2 * price - 35;
        hint = "Add both item prices, then subtract from the amount paid.";
        worked = `${pounds * 100} − (${price} + ${price + 35}) = ${answer}p.`;
        break;
      case "town_menu":
        prompt = `${count} sandwiches at ${money(price)} each. Total order cost in pence?`;
        answer = count * price;
        hint = "Multiply the price by the number of sandwiches.";
        worked = `${count} × ${price} = ${answer}p.`;
        break;
      case "town_split":
        prompt = `A £${pounds * count} café bill is shared equally by ${count} people. Pounds each?`;
        answer = pounds;
        hint = "Divide the whole bill by the number of people.";
        worked = `${pounds * count} ÷ ${count} = £${pounds}.`;
        break;
      case "town_balance":
        prompt = `Balance £${pounds * 3}. Deposit £${pounds}, then withdraw £${d + 1}. New balance in pounds?`;
        answer = pounds * 4 - d - 1;
        hint = "Add the deposit, then subtract the withdrawal.";
        worked = `${pounds * 3} + ${pounds} − ${d + 1} = £${answer}.`;
        break;
      case "town_interest":
        prompt = `£${pounds * 100} savings at ${d}% simple interest for one year. Interest earned in pounds?`;
        answer = pounds * d;
        hint = "Divide savings by 100, then multiply by the percentage.";
        worked = `${pounds * 100} × ${d} ÷ 100 = £${answer} interest.`;
        break;
      case "town_discounts":
        prompt = `${d * 10}% off a £${pounds * 10} jacket. Sale price in pounds?`;
        answer = pounds * 10 - pounds * d;
        hint = "Find the discount, then subtract it from the original price.";
        worked = `£${pounds * 10} − £${pounds * d} = £${answer}.`;
        break;
      case "town_value":
        prompt = `${count} yoghurt pots cost ${money(count * price)}. Price per pot in pence?`;
        answer = price;
        hint = "Divide the pack price by the number of pots.";
        worked = `${count * price} ÷ ${count} = ${price}p per pot.`;
        break;
      case "town_timetable": {
        const duration = 25 + 5 * d + 5 * (n % 6);
        prompt = `Train departs ${clock(540 + n)} and arrives ${clock(540 + n + duration)}. Journey duration in minutes?`;
        answer = duration;
        hint = "Count the minutes from departure to arrival.";
        worked = `${clock(540 + n)} → ${clock(540 + n + duration)} is ${duration} minutes.`;
        break;
      }
      case "town_travel": {
        const saving = 50 + 25 * (n % 7),
          singles = pounds * 200,
          returnPrice = singles - saving;
        prompt = `Two ${money(pounds * 100)} single tickets or a ${money(returnPrice)} return for the same journey. Savings with the return in pence?`;
        answer = saving;
        hint =
          "Compare the return with two singles. Use pence for the calculation.";
        worked = `${singles}p − ${returnPrice}p = ${saving}p saved.`;
        break;
      }
      case "town_bills":
        prompt = `Meter ${1000 + n} → ${1000 + n + count} kWh. ${20 + 5 * d}p per kWh plus 50p standing charge for one day. Total in pence?`;
        answer = count * (20 + 5 * d) + 50;
        hint =
          "Subtract readings, multiply by unit price, then add the stated charge.";
        worked = `${count} × ${20 + 5 * d} + 50 = ${answer}p.`;
        break;
      case "town_household":
        prompt = `Budget £${pounds * 5}; food £${pounds * 2}, travel £${pounds}, savings £${d}. Pounds left?`;
        answer = pounds * 2 - d;
        hint = "Subtract all three amounts from the budget.";
        worked = `${pounds * 5} − ${pounds * 2} − ${pounds} − ${d} = £${answer}.`;
        break;
      case "town_tickets":
        prompt = `An allowance of £${pounds * 3} pays for ${count} tickets costing £${pounds} each. Pounds remaining?`;
        answer = pounds * (3 - count);
        if (answer < 0) {
          prompt = `An allowance of £${pounds * 5} pays for ${count} tickets costing £${pounds} each. Pounds remaining?`;
          answer = pounds * (5 - count);
        }
        hint = "Subtract the total ticket cost from the allowance.";
        worked = `Allowance minus ${count} × £${pounds} leaves £${answer}.`;
        break;
      case "town_time": {
        const duration = 60 + 15 * d + 5 * (n % 7);
        prompt = `Film starts ${clock(780 + n)}. It lasts ${duration} minutes, followed by a 15-minute walk. Total minutes from the start until arrival?`;
        answer = duration + 15;
        hint = "Include both the film duration and walking time.";
        worked = `${duration} + 15 = ${answer} minutes.`;
        break;
      }
      case "town_wages":
        prompt = `${count} paid hours at ${money(pay)} per hour. Gross wages in pence?`;
        answer = count * pay;
        hint = "Multiply paid hours by the hourly rate.";
        worked = `${count} × ${pay} = ${answer}p gross.`;
        break;
      case "town_payslip":
        prompt = `Gross pay £${pounds * 10}, with a supplied £${n} deduction. Net pay in pounds?`;
        answer = pounds * 10 - n;
        hint = "Net pay is gross pay minus deductions.";
        worked = `${pounds * 10} − ${n} = £${answer} net. This is not a tax-rate calculation.`;
        break;
      default:
        throw Error("Unknown town skill " + id);
    }
    const step = Number.isInteger(answer)
        ? Math.max(1, answer >= 100 ? 10 : 1)
        : 0.25,
      values = [
        answer,
        answer + step,
        Math.max(0, answer - step),
        answer + 2 * step,
      ];
    if (new Set(values).size < 4) values[2] = answer + 3 * step;
    const slot = (round + i + id.length) % 4;
    const options = values.filter((x) => x !== answer).map(String);
    options.splice(slot, 0, String(answer));
    return [prompt, String(answer), options, hint, worked];
  }
  function install(curriculum, bank) {
    if (!curriculum.skills.some((k) => k.id === "town_money"))
      for (const [id, name, venue, description, lesson, example] of lessons) {
        curriculum.skills.push({
          id,
          name,
          world: "town",
          venue,
          year: "Everyday independence",
          description,
          lesson: lesson + "\n\nEasier example: " + example,
          qs: [0, 1, 2].map((i) => question(id, 5, 1, i)),
        });
        curriculum.discovery[id] = {};
        for (let band = 5; band <= 9; band++)
          curriculum.discovery[id][band] = [0, 1, 2, 3].map((i) => {
            const q = question(id, band, 50 + band, i);
            return [0, q[0], Number(q[1])];
          });
      }
    return {
      create: (id, band, round) =>
        id.startsWith("town_")
          ? [0, 1, 2].map((i) => question(id, band, round, i))
          : bank.create(id, band, round),
      supportedSkills: [
        ...new Set([...bank.supportedSkills, ...lessons.map((l) => l[0])]),
      ],
    };
  }
  function context(venue,entry='direct') {
    const v=venues.find(v=>v.id===venue),customer={market:'Follow your shopping list, stay within budget and pay for your purchases.',cafe:'Order a meal, scale quantities and settle your bill.',bank:'Check your fictional account before a planned purchase.',shops:'Compare the prices of the things you need.',station:'Choose an affordable service that arrives in time.',home:'Check your cupboards and prepare the chosen recipe.',leisure:'Plan your own tickets, booking and arrival.',work:'Plan the time and resources for your own project.'};
    if((!v&&venue!=='gateway')||!['direct','journey'].includes(entry))return null;
    return {version:1,venue,entry,role:entry==='journey'?(venue==='home'?'home cook':venue==='station'?'passenger':'customer'):'worker',objective:entry==='journey'?customer[venue]||'Continue your plan.':v?.story||'Help at the Town festival.'};
  }
  root.V3Town = { world, venues, lessons, question, money, clock, install, context };
  if (root.V3Curriculum && root.JaxonFreshReview)
    root.JaxonFreshReview = install(root.V3Curriculum, root.JaxonFreshReview);
})(typeof module !== "undefined" ? module.exports : window);
