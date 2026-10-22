/* Replayable fictional Town plans. Additive progress JSON; no accounts or network; one-time story milestones only. */
(function(root){
  'use strict';
  const T=typeof module!=='undefined'?require('./town').V3Town:root.V3Town;
  const H=typeof module!=='undefined'?require('./hands-on').V5HandsOn:root.V5HandsOn;
  const copy=x=>JSON.parse(JSON.stringify(x)), money=T.money, clock=T.clock;
  const meals=[
    {id:'pasta',name:'Tomato pasta',ingredients:['Pasta · 100 g pack','Tomatoes · tin','Cheese · 50 g pack'],need:[2,2,1],prices:[65,85,90],water:300,cook:12,prep:['Read the recipe','Boil the pasta water','Stir in tomatoes and cheese']},
    {id:'curry',name:'Chickpea curry',ingredients:['Chickpeas · tin','Coconut milk · 200 ml carton','Rice · 100 g pack'],need:[2,1,2],prices:[75,120,60],water:400,cook:20,prep:['Rinse the rice','Simmer chickpeas in coconut milk','Serve with the cooked rice']},
    {id:'pizza',name:'Vegetable pizza',ingredients:['Pizza base','Passata · 100 ml carton','Peppers · pair'],need:[1,2,1],prices:[150,55,110],water:100,cook:15,prep:['Spread passata on the base','Add the prepared peppers','Bake the topped pizza']},
    {id:'soup',name:'Carrot and lentil soup',ingredients:['Carrots · 200 g bag','Lentils · 100 g pack','Stock · cube'],need:[2,1,2],prices:[80,95,20],water:600,cook:25,prep:['Wash and chop the carrots','Add lentils and measured stock','Simmer then blend the soup']},
    {id:'pancakes',name:'Banana pancakes',ingredients:['Flour · 100 g pack','Milk · 100 ml carton','Bananas'],need:[2,3,2],prices:[45,35,30],water:150,cook:8,prep:['Mash the bananas','Mix flour, milk and banana','Cook and turn the pancakes']}
  ];
  const shopping=[
    {id:'groceries',name:'Weekly grocery top-up',venue:'market',items:['Breakfast oats · box','Milk · carton','Apples · bag'],qty:[2,2,1],prices:[125,145,160]},
    {id:'party',name:'Plan a games-night party',venue:'shops',items:['Paper cups · pack','Fruit · bag','Sandwiches · pack'],qty:[2,3,2],prices:[90,120,175]},
    {id:'budget',name:'Lunches within £12',venue:'market',items:['Bread · loaf','Soup · tin','Fruit · bag'],qty:[1,3,1],prices:[140,95,150]},
    {id:'offers',name:'Compare festival supply offers',venue:'shops',items:['Small juice pack','Large juice pack','Reusable cup'],qty:[2,0,1],prices:[180,395,100]},
    {id:'missing',name:'Replace missing picnic ingredients',venue:'market',items:['Rolls · pack','Cheese · pack','Tomatoes · pack'],qty:[2,2,2],prices:[110,145,80]}
  ];
  const trips=[
    {id:'swim',name:'Bus to a swimming session',venue:'leisure',duration:35,fee:450,walk:10},
    {id:'library',name:'Library visit and return bus',venue:'shops',duration:25,fee:0,walk:5},
    {id:'appointment',name:'Arrive for a health appointment',venue:'home',duration:40,fee:0,walk:15},
    {id:'cinema',name:'Cinema timetable and last bus',venue:'leisure',duration:95,fee:650,walk:10},
    {id:'connection',name:'Bus and train connection',venue:'station',duration:45,fee:275,walk:5}
  ];
  const errands=[
    {id:'post',name:'Post a parcel at the shopping centre',venue:'shops',fee:235,minutes:15},
    {id:'activity',name:'Book a climbing activity',venue:'leisure',fee:550,minutes:60},
    {id:'bills',name:'Pay the household club bill',venue:'bank',fee:725,minutes:10},
    {id:'appointment',name:'Plan a haircut appointment',venue:'shops',fee:800,minutes:30},
    {id:'repair',name:'Collect a repaired bicycle',venue:'work',fee:650,minutes:20}
  ];
  const jobs=[
    {id:'market',name:'Supermarket cashier',rate:825,break:30,hours:3,deduction:125},
    {id:'cafe',name:'Café kitchen assistant',rate:875,break:15,hours:2,deduction:100},
    {id:'shops',name:'Shop stock assistant',rate:850,break:30,hours:4,deduction:175},
    {id:'station',name:'Station ticket clerk',rate:925,break:15,hours:3,deduction:150},
    {id:'leisure',name:'Leisure-centre attendant',rate:900,break:30,hours:2,deduction:100},
    {id:'work',name:'Workshop apprentice',rate:950,break:30,hours:4,deduction:200},
    {id:'bank',name:'Community bank assistant',rate:975,break:15,hours:3,deduction:175}
  ];
  const catalog=[...meals.map(x=>({id:'cook-'+x.id,category:'Cooking',name:x.name,venue:'home'})),...shopping.map(x=>({id:'shop-'+x.id,category:'Shopping',name:x.name,venue:x.venue})),...trips.map(x=>({id:'travel-'+x.id,category:'Travel',name:x.name,venue:x.venue})),...jobs.map(x=>({id:'job-'+x.id,category:'Employment',name:x.name,venue:x.id})),...errands.map(x=>({id:'errand-'+x.id,category:'Everyday errands',name:x.name,venue:x.venue}))];
  const teaching={
    basket:['Compare each requested quantity with the cupboard or order. Build one item at a time.','Need three tins and have one? Put two tins on the list.','Re-read the quantity beside each item, then check the total.'],
    budget:['Give each pound and penny one purpose. All envelopes together must equal the wages or budget.','£10 could be £3 savings, £2 travel and £5 spending.','Add the envelopes. Check both their individual targets and their total.'],
    measure:['Use the correct units and read the model from zero. One litre equals 1,000 ml; one metre equals 100 cm.','0.25 litres is 250 ml. Half a metre is 50 cm.','Convert the requested quantity to the model’s units before adding or removing units.'],
    clock:['Add minutes to the starting time. Carry 60 minutes into the next hour.','09:50 plus 20 minutes finishes at 10:10.','Find the starting time, add the duration, and check the hour change.'],
    choice:['Compare the whole cost of eligible options. An option must meet the quantity or weight requirement.','Two £1.50 packs cost £3; a suitable £2.80 pack is cheaper.','Rule out options that do not cover what is needed, then compare prices.'],
    journey:['Add walking time to arrival before comparing the deadline. Then compare fares of the services that work.','Arrive at 09:10 plus a 10-minute walk: reach the destination at 09:20.','Check arrival plus walking for each service. Pick the cheapest eligible fare.'],
    order:['Work out which action must happen before the next. Follow the supplied recipe or day plan.','Read a shopping list before collecting items; collect them before paying.','Read the supplied sequence, then place each action in its position.'],
    match:['Match the meaning and units of each label to its destination. Each label is used once.','A 500 ml bottle matches half a litre.','Check each destination against the information in the task.'],
    coins:['Count in pence. £1 is 100p. Change is payment minus the bill.','£5 paid for a £3.20 bill leaves £1.80 change.','Add the denominations in your tray and compare with the requested payment or change.'],
    amount:['Use the quantities in the task to build the amount. For wages, subtract unpaid break time before multiplying by the hourly rate.','Three paid hours at £8 per hour earns £24 before supplied deductions.','Separate the calculation into steps, then build the final amount in pence.']
  };
  const obj=x=>x&&typeof x==='object'&&!Array.isArray(x);
  function validBook(b){return obj(b)&&b.version===2&&obj(b.runs)&&obj(b.counts)&&Object.values(b.counts).every(n=>Number.isInteger(n)&&n>=0)&&(b.active===null||typeof b.active==='string'&&Object.hasOwn(b.runs,b.active))&&Object.values(b.runs).every(validRun);}
  function validRun(j){return obj(j)&&j.version===2&&typeof j.id==='string'&&catalog.some(c=>c.id===j.scenario)&&[1,2,3].includes(j.tier)&&Number.isInteger(j.stage)&&Array.isArray(j.steps)&&j.steps.length>=3&&j.stage>=0&&j.stage<=j.steps.length&&j.done===(j.stage===j.steps.length)&&j.steps.every(t=>obj(t)&&typeof t.prompt==='string'&&t.answer!==undefined&&obj(t.effect)&&typeof t.venue==='string')&&obj(j.values)&&obj(j.inventory)&&obj(j.shoppingList)&&Array.isArray(j.receipts)&&Array.isArray(j.evidence)&&Array.isArray(j.completed)&&j.completed.length===j.stage&&j.completed.every((x,i)=>x===i)&&Number.isInteger(j.cash)&&j.cash>=0&&Number.isInteger(j.time)&&j.time>=0&&j.time<1440;}
  function book(s){return s.adventure?.townLifeV2;}
  function state(s){const b=book(s);return validBook(b)?b.runs[b.active]||null:null;}
  function task(s){const j=state(s);return j&&!j.done?j.steps[j.stage]:null;}
  function ordered(labels,seed){const rotation=1+seed%(labels.length-1),indices=labels.map((_,i)=>(i+rotation)%labels.length);return {items:indices.map(i=>labels[i]),answer:labels.map((_,i)=>indices.indexOf(i))};}
  function make(scenario,tier,seed){
    const meta=catalog.find(x=>x.id===scenario);if(!meta)return null;
    const shift=(seed-1)%7,scale=tier,steps=[];
    let planned=540+shift*10,plannedCash=6000+scale*500,stock={};
    const initialCash=plannedCash,initialTime=planned;
    function add(venue,title,kind,prompt,answer,extra={},effect={}){
      const t={venue,title,kind,prompt,answer,min:0,max:100000,step:1,unit:'',skill:'town_money',teach:'Build a model, compare it with the plan, then check each quantity.',example:'If a £2 item is paid with £5, the change is £3.',hint:'Use the saved plan, cash and clock. You can change your model before trying again.',worked:'Compare every part with the quantities and units in this task.',effect,...extra};
      const help=teaching[kind];if(help){if(!extra.teach)t.teach=help[0];if(!extra.example)t.example=help[1];if(!extra.hint)t.hint=help[2];}
      steps.push(t);plannedCash+=(effect.earn||0)-(effect.spend||0)-(effect.savings||0);planned+=effect.minutes||0;return t;
    }
    function order(venue,title,labels,instruction,effect={}){return add(venue,title,'order',instruction,null,{...ordered(labels,seed+steps.length),instruction,teach:'Put the actions into a sensible sequence. Explain what must happen before the next step.',example:'First read a list, then collect items, then pay.',worked:labels.join(' → ')},effect);}
    function match(venue,title,items,labels,prompt){return add(venue,title,'match',prompt,null,{items,labels:[...labels].reverse(),answer:labels.map((_,i)=>labels.length-1-i),instruction:'Tap a label, then its matching destination.',worked:items.map((x,i)=>x+' → '+labels[i]).join('; ')});}
    function amount(venue,title,prompt,answer,unit='p',effect={}){return add(venue,title,unit==='p'?'amount':'clock',prompt,answer,{unit,step:unit==='p'?25:5,max:unit==='p'?100000:1439,worked:unit==='p'?`The calculated amount is ${money(answer)}.`:`The clock should show ${clock(answer)}.`},effect);}
    function pay(venue,name,cost,extraEffect={}){const tender=Math.ceil(cost/500)*500;add(venue,'Pay for '+name,'coins',`The ${name} costs ${money(cost)}. Build the ${money(tender)} payment.`,tender,{unit:'p',worked:`Make ${tender} pence with coins or notes.`});add(venue,'Collect change','coins',`Paid ${money(tender)} for ${money(cost)}. Build your change before leaving.`,tender-cost,{unit:'p',worked:`${money(tender)} − ${money(cost)} = ${money(tender-cost)}.`},{spend:cost,...extraEffect});}
    function bus(destination,returning=false){
      const depart=planned+10,arrival=depart+15+shift*5,walk=5+5*(tier-1),fare=100+25*shift+25*(tier-1),deadline=arrival+walk+5;
      let options=[{name:'Bus A',depart,arrive:arrival,price:fare},{name:'Bus B',depart:depart+10,arrive:arrival+15,price:fare-25},{name:'Express C',depart:depart+5,arrive:arrival-5,price:fare+100}];
      const rotate=(seed+steps.length)%3;options=options.slice(rotate).concat(options.slice(0,rotate));
      const answer=options.findIndex(x=>x.name==='Bus A'),chosen=options[answer];
      add('station',returning?'Return bus home':'Travel to '+destination,'journey',`${returning?'Return home':'Reach '+destination} by ${clock(deadline)}, with ${walk} minutes to walk. Current time ${clock(planned)}. Choose the cheapest bus arriving in time.`,answer,{options,walk,deadline,worked:`Bus A costs ${money(fare)}; arrival plus walking is ${clock(arrival+walk)}. Bus B misses the deadline and Express C costs more.`},{spend:fare,minutes:chosen.arrive+walk-planned,receipt:'Bus fare to '+destination,choice:chosen.name});
    }
    function homeCheck(label){order('home','Check the day’s records',['Check the receipts','Count the remaining pretend cash','Put away purchases'],`At home after ${label}, arrange the checks in the order shown in your plan: receipts, cash, then purchases.`);}
    function shoppingTrip(items,prices,need,venue,cupboard,limit=null){
      const initial=cupboard||items.map(()=>0);items.forEach((x,i)=>stock[x]=initial[i]);
      add('home','Check cupboards','basket',`Inspect the cupboards: ${items.map((x,i)=>initial[i]+' '+x).join(', ')}. Build the quantities already at home.`,initial,{items:items.map((name,i)=>({name,price:prices[i]})),worked:'Match the stock shown in the cupboard list.'});
      const missing=need.map((x,i)=>Math.max(0,x-initial[i])),list=Object.fromEntries(items.map((x,i)=>[x,missing[i]]));
      add('home','Make a shopping list','basket',`Plan needs ${items.map((x,i)=>need[i]+' '+x).join(', ')}. Use your cupboard stock and list only what is missing.`,missing,{items:items.map((name,i)=>({name,price:prices[i]})),worked:need.map((x,i)=>`${items[i]}: ${x} − ${initial[i]} = ${missing[i]}`).join('; ')},{list});
      bus(T.venues.find(v=>v.id===venue).name);
      const cost=missing.reduce((n,x,i)=>n+x*prices[i],0),budget=limit||plannedCash;
      add(venue,'Choose the shopping','basket',`Follow the saved list for ${meta.name}. Your shopping limit is ${money(budget)}. Select only the missing quantities.`,missing,{items:items.map((name,i)=>({name,price:prices[i]})),budget,worked:`The list costs ${money(cost)}; ${money(budget-cost)} of the shopping limit remains.`});
      pay(venue,meta.name,cost,{add:list,receipt:meta.name});
      bus('home',true);
      return {cost,inventory:Object.fromEntries(items.map((x,i)=>[x,need[i]]))};
    }
    if(scenario.startsWith('cook-')){
      const m=meals.find(x=>'cook-'+x.id===scenario),need=m.need.map(x=>x*scale+(shift%2)),prices=m.prices.map(x=>x+shift*5),cupboard=need.map((x,i)=>Math.min(x,i===1?0:1));
      shoppingTrip(m.ingredients,prices,need,'market',cupboard);
      match('home','Unpack the recipe ingredients',m.ingredients,need.map((x,i)=>x+' × '+m.ingredients[i]),'Match each ingredient to its required quantity before cooking.');
      order('home','Prepare '+m.name,m.prep,`Arrange the preparation stages for ${m.name}. Your recipe says: ${m.prep.join('; then ')}.`);
      const ml=m.id==='pizza'?need[1]*100:m.id==='pancakes'?need[1]*100:m.water*scale+shift*50;
      add('home','Measure for '+m.name,'measure',`For this ${m.name} batch, measure ${ml/1000} litres of ${m.id==='pancakes'?'milk':m.id==='pizza'?'passata':m.id==='soup'?'prepared stock':'water'} in the jug.`,ml,{max:2500,step:50,unit:'ml',worked:`${ml/1000} × 1,000 = ${ml} ml.`});
      const minutes=m.cook+shift+5*(tier-1);amount('home','Set the cooking finish time',`${m.name} starts at ${clock(planned)}. Cook for ${minutes} minutes. Build the finishing time.`,planned+minutes,'time',{minutes,consume:Object.fromEntries(m.ingredients.map((x,i)=>[x,need[i]]))});
      order('home','Serve and tidy',['Serve the meal','Put away spare ingredients','Wash the equipment'],`The ${m.name} is ready. Order the finish: serve, store spares, then wash up.`);
    } else if(scenario.startsWith('shop-')){
      const m=shopping.find(x=>'shop-'+x.id===scenario),prices=m.prices.map(x=>x+shift*5),need=m.qty.map(x=>x?Math.min(8,x+(tier-1)+(shift%2)):0);
      if(m.id==='budget'){prices.splice(0,3,140+shift*5,95+shift*5,150+shift*5);need.splice(0,3,1,3+(tier-1),1);amount('home','Reserve a fixed shopping budget',`You have ${money(initialCash)}. Reserve exactly £12 for packed lunches. Build this amount before leaving.`,1200);}
      if(m.id==='offers'){
        const pack=2+tier,unit=55+shift*5;
        bus('the shopping centre');
        const small=unit*pack,large=small*2+(shift%2?50:-50),best=large<2*small?1:0;
        add('shops','Compare whole-pack offers','choice',`Need ${2*pack} drinks. Offer A: two ${pack}-packs at ${money(small)} each. Offer B: one ${2*pack}-pack at ${money(large)}. Select the cheaper complete purchase.`,best,{options:[{name:'Two small packs',depart:planned,arrive:planned,price:small*2},{name:'One large pack',depart:planned,arrive:planned,price:large}],deadline:planned,walk:0,worked:`Compare ${money(small*2)} with ${money(large)}.`});
        pay('shops','festival drinks',Math.min(small*2,large),{add:{'Juice carton':2*pack},receipt:'Best-value drinks'});bus('home',true);
      }else shoppingTrip(m.items,prices,need,m.venue,m.id==='missing'?need.map((x,i)=>i===1?0:1):null,m.id==='budget'?1200:null);
      homeCheck(m.name);
    } else if(scenario.startsWith('travel-')){
      const m=trips.find(x=>'travel-'+x.id===scenario),duration=m.duration+(tier-1)*5+shift;
      order('home','Plan '+m.name,['Check the appointment or activity time','Find the outward bus','Keep money for the return'],`Prepare for ${m.name}: check the event, find a bus, reserve the return fare.`);
      bus(m.name);
      const begin=planned+m.walk;
      amount(m.venue,'Read the departure and arrival time',`The activity starts at ${clock(begin)}. It lasts ${duration} minutes. Build the time it finishes before planning the return.`,begin+duration,'time',{minutes:m.walk+duration});
      if(m.id==='connection'){
        match('station','Match the onward services',['Local bus','Connecting train','Walk to platform'],['15 minutes','30 minutes','5 minutes'],'Match the legs of the connection to their journey durations.');
        amount('station','Total connected travel time','The local bus takes 15 minutes, the connection takes 30 minutes, and the platform walk takes 5 minutes. Build the total duration in minutes.',50,'minutes');
      }
      if(m.fee)pay(m.venue,m.id==='connection'?'onward ticket':m.name,m.fee+shift*25,{receipt:m.name});
      bus('home',true);homeCheck(m.name);
    } else if(scenario.startsWith('job-')){
      const m=jobs.find(x=>'job-'+x.id===scenario),venue=m.id,hours=m.hours+tier-1,rate=m.rate+shift*25,gross=hours*rate,deduction=m.deduction+shift*5,net=gross-deduction,start=initialTime;
      order(venue,'Start your '+m.name+' shift',['Read the shift plan','Check your equipment','Serve the first customer'],`As the ${m.name}, first read the shift plan, then check equipment, then help the first customer.`);
      if(venue==='cafe')add(venue,'Prepare customer drinks','measure',`${2+tier} drinks each need 150 ml. Build the total volume for the order.`,(2+tier)*150,{max:2000,step:50,unit:'ml',worked:`${2+tier} × 150 ml = ${(2+tier)*150} ml.`});
      else if(venue==='station')match(venue,'Match customer tickets',['Single to Town','Return to Town','Group pass'],['£1.50','£2.50','£6.00'],'Match each customer ticket to the price shown on the board: single £1.50, return £2.50, group £6.00.');
      else if(venue==='work')add(venue,'Measure a workpiece','measure',`A shelf needs a ${60+tier*10+shift*5} cm strip. Build the length on the ruler.`,60+tier*10+shift*5,{max:150,step:5,unit:'cm',worked:'Read from zero and check the centimetre marking.'});
      else if(venue==='bank')amount(venue,'Post a customer deposit',`A customer has ${money(2000+shift*100)} and deposits £5. Build the new balance.`,2500+shift*100);
      else {const items=venue==='leisure'?['Swim ticket','Locker token','Towel hire']:venue==='shops'?['Notebook','Pencil pack','Folder']:['Apples','Milk','Bread'];add(venue,'Build a customer order','basket',`A customer requests ${tier+1} ${items[0]}, one ${items[1]} and one ${items[2]}. Build the order.`,[tier+1,1,1],{items:items.map((name,i)=>({name,price:[125,150,100][i]})),worked:'Count each requested item; staff handle purchases without spending their personal cash.'});}
      const bill=375+shift*25+tier*50;add(venue,'Handle a customer payment','coins',`Customer bill ${money(bill)}, paid £10. Build the change from the till. Your personal pretend cash is separate.`,1000-bill,{unit:'p',worked:`£10 − ${money(bill)} = ${money(1000-bill)}.`},{receipt:'Customer sale handled',sale:bill});
      amount(venue,'Calculate shift wages',`Shift ${clock(start)}–${clock(start+hours*60+m.break)} includes an unpaid ${m.break}-minute break. Pay is ${money(rate)} per hour. Build gross pay.`,gross,'p',{minutes:hours*60+m.break});
      amount(venue,'Read your fictional payslip',`Gross pay ${money(gross)} minus supplied deductions ${money(deduction)}. Build net pay. The deduction is supplied for this fictional exercise.`,net,'p',{earn:net,receipt:'Net wages'});
      const saving=Math.floor(net/300)*100,travel=200+shift*25,spend=net-saving-travel;
      add('bank','Build a wages budget','budget',`Allocate only your new wages: ${money(saving)} to savings, ${money(travel)} to travel, and ${money(spend)} to spending.`,[saving,travel,spend],{labels:['Savings','Travel','Spending'],budget:net,step:5,worked:`${money(saving)} + ${money(travel)} + ${money(spend)} = ${money(net)}.`},{savings:saving,receipt:'Wages savings reserved'});
      bus('home',true);homeCheck(m.name);
    } else {
      const m=errands.find(x=>'errand-'+x.id===scenario),fee=m.fee+shift*25;
      order('home','Plan '+m.name,['Check the booking or instructions','Reserve the cost and bus fare','Take what the errand needs'],`For ${m.name}, order your preparation: check instructions, reserve money, then pack.`);
      bus(m.name);
      if(m.id==='post'){
        const weight=250+shift*50+tier*100;
        add('shops','Choose a parcel service','choice',`At the Post Office counter: your parcel weighs ${weight} g. Small covers up to 500 g for £2.35; Medium covers up to 1,000 g for £3.25. Choose the cheapest service that covers its weight.`,weight<=500?0:1,{options:[{name:'Small · up to 500 g',depart:planned,arrive:planned,price:235},{name:'Medium · up to 1,000 g',depart:planned,arrive:planned,price:325}],deadline:planned,walk:0,worked:`${weight} g ${weight<=500?'fits Small':'needs Medium'}.`});
        pay('shops','parcel postage',weight<=500?235:325,{receipt:'Parcel posted',minutes:m.minutes});
      } else if(m.id==='bills'){
        amount('bank','Check the bill',`Club account: ${money(fee+300)} billed, £3 already paid. Build the amount still due.`,fee);pay('bank','club bill',fee,{receipt:'Club bill settled',minutes:m.minutes});
      } else if(m.id==='repair'){
        match('work','Check the repair receipt',['Brake adjustment','Replacement cable','Labour'],['£2.00','£1.50',money(fee-350)],`Match the receipt: brakes £2, cable £1.50, labour ${money(fee-350)}. Check it totals ${money(fee)}.`);pay('work','bicycle repair',fee,{receipt:'Bicycle collected',minutes:m.minutes});
      } else {
        amount(m.venue,'Plan the appointment finish',`${m.name} begins ${clock(planned+10)} and lasts ${m.minutes} minutes. Build the finish time.`,planned+10+m.minutes,'time',{minutes:10+m.minutes});pay(m.venue,m.name,fee,{receipt:m.name});
      }
      bus('home',true);homeCheck(m.name);
    }
    // Every plan is stored as a snapshot, so future content changes cannot rewrite a saved run.
    return {version:2,id:scenario+':'+seed,scenario,name:meta.name,category:meta.category,tier,seed,stage:0,steps,values:{},inventory:stock,shoppingList:{},cash:initialCash,time:initialTime,savings:0,receipts:[],completed:[],evidence:[],solved:false,assisted:false,feedback:'',done:false};
  }
  function start(s,id,tier=1,replay=false){
    if(!catalog.some(x=>x.id===id)||book(s)!==undefined&&!validBook(book(s)))return false;
    s.adventure ||= {};const b=book(s)||{version:2,runs:{},counts:{},active:null};
    const existing=Object.values(b.runs).filter(x=>x.scenario===id).at(-1);
    if(existing&&!existing.done){b.active=existing.id;}
    else if(existing&&!replay){b.active=existing.id;}
    else {const seed=(b.counts[id]||0)+1,j=make(id,Math.max(1,Math.min(3,Math.trunc(tier)||1)),seed);if(!validRun(j))return false;b.runs[j.id]=j;b.counts[id]=seed;b.active=j.id;}
    s.adventure.townLifeV2=b;s.adventure.townActive=2;s.view=s.resumeView='journey';s.world='town';return true;
  }
  function value(t,v){if(t.kind==='order'||t.kind==='match')return v.order||[];if(['basket','budget'].includes(t.kind))return v.parts||[0,0,0];if(['journey','choice'].includes(t.kind))return v.choice??-1;if(t.kind==='coins')return (v.coins||[]).reduce((a,b)=>a+b,0);return v.amount||0;}
  function valid(t,v){if(H.invalidDraft(v,t))return false;const x=value(t,v);return Array.isArray(t.answer)?Array.isArray(x)&&x.length===t.answer.length&&x.every((a,i)=>a===t.answer[i]):x===t.answer;}
  function action(s,name,arg,raw=''){
    const j=state(s),t=task(s);if(!j||!t)return false;const v=j.values,bits=raw.split(':');
    if(name==='j-next')return next(s);
    if(name==='j-help'||name==='j-skip'){j.assisted=true;j.feedback=(name==='j-skip'?t.worked+' ':'')+t.hint;return true;}
    if(name==='j-submit'){if(H.invalidDraft(v,t))return false;const ok=valid(t,v);if(!j.evidence.some(e=>e.stage===j.stage))j.evidence.push({stage:j.stage,firstValue:copy(value(t,v)),correct:ok,assisted:j.assisted,source:'town-life-v2'});j.solved=ok;j.assisted ||= !ok;j.feedback=ok?'Plan checked. Continue when you are ready.':'Keep adjusting. '+t.worked;return ok;}
    if(j.solved)return false;
    if(name==='j-pick'&&Number.isInteger(+arg)&&+arg>=0&&+arg<t.items?.length){v.picked=+arg;return true;}
    if(name==='j-clear'){v.order=[];return true;}
    if(name==='j-place'&&Number.isInteger(v.picked)&&Number.isInteger(+arg)&&+arg>=0&&+arg<t.items?.length){const a=Array(t.items.length).fill(null).map((_,i)=>v.order?.[i]??null);a.forEach((x,i)=>{if(x===v.picked)a[i]=null;});a[+arg]=v.picked;v.order=a;return true;}
    if(name==='j-part'){const i=+bits[1],n=+bits[2],max=t.kind==='budget'?t.budget:12;if(!Number.isInteger(i)||i<0||i>=t.answer.length||!Number.isInteger(n)||![-1000,-500,-100,-25,-5,-1,1,5,25,100,500,1000].includes(n))return false;v.parts ||= Array(t.answer.length).fill(0);v.parts[i]=Math.max(0,Math.min(max,(v.parts[i]||0)+n));return true;}
    if(name==='j-choice'&&Number.isInteger(+arg)&&+arg>=0&&+arg<t.options?.length){v.choice=+arg;return true;}
    if(name==='j-coin'){v.coins ||= [];if(arg==='clear')v.coins=[];else if(arg==='undo')v.coins.pop();else if([1,2,5,10,20,50,100,200,500,1000,2000,5000].includes(+arg)&&v.coins.length<100)v.coins.push(+arg);else return false;return true;}
    if(name==='j-adjust'||name==='j-value'){const n=name==='j-adjust'?(v.amount||0)+Number(arg):Number(arg);if(!Number.isInteger(n)||n<0||n>t.max)return false;v.amount=n;delete v.amountDraft;delete v.clockDraft;return true;}
    return false;
  }
  function next(s){
    const j=state(s),t=task(s);if(!j||!t||!j.solved||!valid(t,j.values))return false;
    const e=t.effect,cash=j.cash+(e.earn||0)-(e.spend||0)-(e.savings||0),time=j.time+(e.minutes||0),inventory={...j.inventory};
    for(const [name,n]of Object.entries(e.add||{}))inventory[name]=(inventory[name]||0)+n;
    for(const [name,n]of Object.entries(e.consume||{})){if((inventory[name]||0)<n)return false;inventory[name]-=n;}
    if(cash<0||time>=1440)return false;
    j.cash=cash;j.time=time;j.inventory=inventory;if(e.list)j.shoppingList=copy(e.list);if(e.savings)j.savings+=e.savings;
    if(e.receipt)j.receipts.push({id:j.id+':'+j.stage,label:e.receipt,spent:e.spend||0,earned:e.earn||0,sale:e.sale||0,saved:e.savings||0,items:copy(e.add||{}),time:j.time,choice:e.choice||null});
    j.completed.push(j.stage);j.stage++;j.done=j.stage===j.steps.length;j.values={};j.solved=false;j.assisted=false;j.feedback='';if(j.done){s.resumeView=null;completeLandmark(s,j);}return true;
  }
  function completeLandmark(s,j){
    const M=typeof module!=='undefined'?require('./adventure').V3Adventure:root.V3Adventure;
    const route=catalog.find(c=>c.id===j.scenario).venue,key=M.id('town',route,j.tier),a=M.state(s);
    // The same venue/tier story milestone can be earned only once across old and new play.
    // A completed plan never rewrites an earlier mission record, mastery or wallet.
    if(a.records[key])return;
    a.records[key]={world:'town',route,tier:j.tier,unassisted:j.evidence.filter(e=>e.correct&&!e.assisted).length,evidence:copy(j.evidence),context:T.context(route,j.category==='Employment'?'direct':'journey'),completedAt:new Date().toISOString(),serial:Math.max(0,...Object.values(a.records).map(r=>r.serial||0))+1,source:'town-life-v2'};
    const milestone='mission|'+key;if(!s.milestones.includes(milestone))s.milestones.push(milestone);
  }
  function model(s){const j=state(s);if(!j)return null;const t=task(s);return {...j,task:t,title:t?.title||'Town plan complete',venue:t?.venue||'home',recipeName:j.name,context:T.context(t?.venue||'home',j.category==='Employment'?'direct':'journey')};}
  root.V52TownLife={catalog,meals,jobs,make,start,state,task,action,next,model,valid,validRun,validBook,book};
  if(typeof module!=='undefined')module.exports={V52TownLife:root.V52TownLife};
})(typeof window!=='undefined'?window:globalThis);
