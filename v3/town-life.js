/* Replayable fictional Town plans. Additive progress JSON; no accounts or network; one-time story milestones only. */
(function(root){
  'use strict';
  const T=typeof module!=='undefined'?require('./town').V3Town:root.V3Town;
  const H=typeof module!=='undefined'?require('./hands-on').V5HandsOn:root.V5HandsOn;
  const copy=x=>JSON.parse(JSON.stringify(x)), money=T.money, clock=T.clock;
  // Quantities are usable contents, not pack counts. Old runs retain their
  // saved recipeCard/steps/inventory; these definitions create new runs only.
  const ingredient=(name,quantity,unit,pack,price,storage='cupboard',group='required')=>({name,quantity,unit,pack,price,storage,group});
  const oil=()=>ingredient('Olive oil',10,'ml',250,180,'cupboard','pantry');
  const meals=[
    {id:'pasta',name:'Tomato pasta',prepMinutes:10,cook:12,water:1000,liquid:'water',method:'hob',heat:'A steady boil for the pasta',ingredients:[ingredient('Pasta',200,'g',500,95),ingredient('Ripe tomatoes',300,'g',300,140,'fridge'),ingredient('Basil',5,'g',15,75,'fridge'),oil()],optional:['20 g grated cheese per 2 servings (milk)','20 g pitted olives per 2 servings'],allergens:'Wheat/gluten in pasta; milk if cheese is added.',prep:['Wash the tomatoes and basil; ask an adult to cut the tomatoes.','Mix the prepared tomatoes, torn basil and measured oil into a fresh sauce.','An adult cooks the measured pasta in boiling water, following its packet, then drains it.','Combine the warm pasta and tomato sauce; add an optional topping if suitable.']},
    {id:'curry',name:'Mild chickpea coconut curry',prepMinutes:10,cook:20,water:250,liquid:'water for the rice',method:'hob',heat:'A gentle simmer for the sauce',ingredients:[ingredient('Chickpeas, drained',240,'g',240,80),ingredient('Chopped tomatoes',200,'g',400,85),ingredient('Coconut milk',200,'ml',400,125),ingredient('Dry basmati rice',125,'g',500,110),ingredient('Ground cumin',1,'teaspoons',20,95,'cupboard','pantry'),ingredient('Turmeric',0.5,'teaspoons',20,90,'cupboard','pantry')],optional:['Chilli or hotter curry paste: optional adult addition only; not included in this mild recipe or shopping list.'],allergens:'Check spice and optional paste labels for mustard, milk or gluten. Coconut is an ingredient too.',prep:['Drain and rinse the chickpeas; measure the tomatoes, coconut milk and mild spices.','An adult warms these ingredients together and lets the sauce simmer gently.','Cook the measured rice with the measured water, following its packet; start it while the sauce simmers.','Check the rice and sauce are ready together, then serve. No chilli is needed.']},
    {id:'pizza',name:'Vegetable flatbread pizza',prepMinutes:15,cook:12,method:'oven',heat:'200 °C conventional / 180 °C fan',temperature:200,ingredients:[ingredient('Flatbreads',2,'items',4,150),ingredient('Passata',100,'g',500,90),ingredient('Spinach, thawed and drained',100,'g',250,95,'fridge'),ingredient('Pepper',80,'g',160,70,'fridge'),ingredient('Mozzarella',100,'g',125,100,'fridge')],optional:['Basil leaves to finish','A little grated hard cheese (milk)'],allergens:'Wheat/gluten in flatbreads and milk in mozzarella; check flatbread labels for other ingredients.',prep:['Ask an adult to preheat the oven and prepare the pepper; squeeze excess water from the thawed spinach.','Cover the flatbreads with the measured passata, vegetables and torn mozzarella.','An adult bakes two flatbreads per batch until hot throughout and the cheese has melted.','Let the pizzas cool slightly before an adult cuts them for serving.']},
    {id:'soup',name:'Carrot and red lentil soup',prepMinutes:10,cook:25,water:750,liquid:'water for the stock',method:'hob',heat:'A gentle simmer',ingredients:[ingredient('Carrots',250,'g',500,65,'fridge'),ingredient('Red lentils',100,'g',500,120),ingredient('Onion',100,'g',200,45),ingredient('Garlic',1,'cloves',6,55),ingredient('Vegetable stock cubes',1,'items',6,75,'cupboard','pantry'),oil()],optional:['Chopped parsley to finish'],allergens:'Stock cubes may contain celery, gluten or milk: check the label.',prep:['Wash the carrots; an adult chops the carrots, onion and garlic. Rinse the lentils.','An adult softens the onion and garlic in the measured oil, then adds the carrots.','Add the lentils, stock cube and measured water; simmer until the vegetables and lentils are tender.','Serve as a chunky soup, or let an adult blend it safely away from splashes.']},
    {id:'pancakes',name:'Banana oat pancakes',prepMinutes:10,cook:15,method:'frying pan',heat:'Medium heat',ingredients:[ingredient('Rolled oats',100,'g',500,100),ingredient('Oat milk',125,'ml',1000,145,'fridge'),ingredient('Eggs',2,'items',6,165,'fridge'),ingredient('Bananas',1,'items',3,70),ingredient('Baking powder',2,'teaspoons',20,80,'cupboard','pantry'),ingredient('Cooking oil',5,'ml',250,150,'cupboard','pantry')],optional:['0.5 teaspoon vanilla extract per 2 servings','Fresh fruit or yoghurt to serve (yoghurt contains milk)'],allergens:'Eggs; oats and oat milk may contain gluten. Optional yoghurt contains milk.',prep:['Measure the oats and oat milk; peel the banana and crack the eggs into a separate bowl.','An adult helps blend the oats, milk, banana, eggs and baking powder into a smooth batter.','An adult lightly oils a pan and cooks two small pancakes at a time, turning them when set.','Cook both sides until the centre is set; serve with a suitable optional topping.']}
  ];
  const shopping=[
    {id:'groceries',name:'Weekly grocery top-up',venue:'market',items:['Breakfast oats · box','Milk · carton','Apples · bag'],qty:[2,2,1],prices:[125,145,160]},
    {id:'party',name:'Plan a games-night party',venue:'shops',items:['Paper cups · pack','Fruit · bag','Sandwiches · pack'],qty:[2,3,2],prices:[90,120,175]},
    {id:'budget',name:'Packed lunches within £12',venue:'market',items:['Bread · loaf','Soup · tin','Fruit · bag'],qty:[1,3,1],prices:[140,95,150]},
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
  const Q=typeof module!=='undefined'?require('./town-content').V53TownContent:root.V53TownContent;
  function make(scenario,tier,seed,original){const meta=catalog.find(c=>c.id===scenario);return meta?copy(Q.make(meta,tier,seed,{meals,shopping,trips,errands,jobs},original)):null;}
  function startRecipe(s,recipe,tier=1,replay=false){
    if(!['bolognese','lentil'].includes(recipe)||book(s)!==undefined&&!validBook(book(s)))return false;
    s.adventure ||= {};const b=book(s)||{version:2,runs:{},counts:{},active:null};
    let j=Object.values(b.runs).filter(r=>r.originalRecipe===recipe).at(-1);
    if(!j||j.done&&replay){const key='original-'+recipe,seed=(b.counts[key]||0)+1;j=make('cook-pasta',Math.max(1,Math.min(3,tier)),seed,recipe);j.id=key+':'+seed;b.runs[j.id]=j;b.counts[key]=seed;}
    b.active=j.id;s.adventure.townLifeV2=b;s.adventure.townActive=2;s.view=s.resumeView='journey';s.world='town';s.pausedActivity=null;return true;
  }
  function start(s,id,tier=1,replay=false){
    if(!catalog.some(x=>x.id===id)||book(s)!==undefined&&!validBook(book(s)))return false;
    s.adventure ||= {};const b=book(s)||{version:2,runs:{},counts:{},active:null};
    const existing=Object.values(b.runs).filter(x=>x.scenario===id&&!x.originalRecipe).at(-1);
    if(existing&&!existing.done){b.active=existing.id;}
    else if(existing&&!replay){b.active=existing.id;}
    else {const seed=(b.counts[id]||0)+1,j=make(id,Math.max(1,Math.min(3,Math.trunc(tier)||1)),seed);if(!validRun(j))return false;b.runs[j.id]=j;b.counts[id]=seed;b.active=j.id;}
    s.adventure.townLifeV2=b;s.adventure.townActive=2;s.view=s.resumeView='journey';s.world='town';s.pausedActivity=null;return true;
  }
  function value(t,v){if(t.kind==='order'||t.kind==='match')return v.order||[];if(['basket','budget'].includes(t.kind))return v.parts||[0,0,0];if(['journey','choice'].includes(t.kind))return v.choice??-1;if(t.kind==='coins')return (v.coins||[]).reduce((a,b)=>a+b,0);return v.amount||0;}
  function valid(t,v){if(H.invalidDraft(v,t))return false;const x=value(t,v);if(t.allowedChoices)return t.allowedChoices.includes(x);return Array.isArray(t.answer)?Array.isArray(x)&&x.length===t.answer.length&&x.every((a,i)=>a===t.answer[i]):x===t.answer;}
  function action(s,name,arg,raw=''){
    const j=state(s),t=task(s);if(!j||!t)return false;const v=j.values,bits=raw.split(':');
    if(name==='j-next')return next(s);
    if(['j-submit','j-skip'].includes(name)&&stockShortage(j,t)){j.feedback=stockShortage(j,t);return false;}
    if(name==='j-skip'){
      if(j.solved)return false;
      if(!j.evidence.some(e=>e.stage===j.stage))j.evidence.push({stage:j.stage,firstValue:copy(value(t,v)),correct:false,assisted:true,skipped:true,source:'town-life-v2'});
      const first=j.evidence.find(e=>e.stage===j.stage);if(first&&!first.skipped)first.skippedAfterAttempt=true;
      j.skips ||= [];if(!j.skips.includes(j.stage))j.skips.push(j.stage);
      j.assisted=true;j.solved=true;j.feedback='Skipped with help. '+t.worked;
      if(['basket','budget'].includes(t.kind))v.parts=copy(t.answer);
      else if(['order','match'].includes(t.kind))v.order=copy(t.answer);
      else if(['choice','journey'].includes(t.kind))v.choice=t.answer;
      else if(t.kind==='coins')v.coins=T.moneyTokens(t.answer);else v.amount=t.answer;
      delete v.amountDraft;delete v.clockDraft;return true;
    }
    if(name==='j-help'){j.assisted=true;j.hintLevel=(j.hintLevel||0)+1;j.feedback=name==='j-skip'||j.hintLevel>2?t.worked:j.hintLevel===2?t.teach:t.hint;return true;}
    if(name==='j-submit'){if(j.solved)return false;if(H.invalidDraft(v,t))return false;const ok=valid(t,v);if(!j.evidence.some(e=>e.stage===j.stage))j.evidence.push({stage:j.stage,firstValue:copy(value(t,v)),correct:ok,assisted:j.assisted,source:'town-life-v2'});j.solved=ok;j.assisted ||= !ok;j.feedback=ok?'That works. Continue when you are ready.':'Not yet. '+t.hint;return ok;}
    if(j.solved)return false;
    if(name==='j-pick'&&Number.isInteger(+arg)&&+arg>=0&&+arg<t.items?.length){v.picked=+arg;return true;}
    if(name==='j-clear'){v.order=[];return true;}
    if(name==='j-place'&&Number.isInteger(v.picked)&&Number.isInteger(+arg)&&+arg>=0&&+arg<t.items?.length){const a=Array(t.items.length).fill(null).map((_,i)=>v.order?.[i]??null);a.forEach((x,i)=>{if(x===v.picked)a[i]=null;});a[+arg]=v.picked;v.order=a;return true;}
    if(name==='j-budget-pick'&&t.kind==='budget'&&[1,5,50,100,500,1000].includes(+arg)){v.budgetToken=+arg;return true;}
    if(name==='j-budget-place'&&t.kind==='budget'&&Number.isInteger(+arg)&&+arg>=0&&+arg<t.labels.length&&[1,5,50,100,500,1000].includes(v.budgetToken)){v.parts ||= t.labels.map(()=>0);if(v.parts.reduce((a,b)=>a+b,0)+v.budgetToken>t.budget)return false;v.parts[+arg]+=v.budgetToken;return true;}
    if(name==='j-part'){const i=+bits[1],n=+bits[2],max=t.kind==='budget'?t.budget:12;if(!Number.isInteger(i)||i<0||i>=t.answer.length||!Number.isInteger(n)||![-1000,-500,-100,-50,-25,-5,-1,1,5,25,50,100,500,1000].includes(n))return false;v.parts ||= Array(t.answer.length).fill(0);v.parts[i]=Math.max(0,Math.min(t.kind==='budget'?(v.parts[i]||0)+Math.max(0,t.budget-v.parts.reduce((a,b)=>a+b,0)):max,(v.parts[i]||0)+n));return true;}
    if(name==='j-choice'&&Number.isInteger(+arg)&&+arg>=0&&+arg<t.options?.length){v.choice=+arg;return true;}
    if(name==='j-coin'){v.coins ||= [];if(arg==='clear')v.coins=[];else if(arg==='undo')v.coins.pop();else if([1,2,5,10,20,50,100,200,500,1000,2000,5000].includes(+arg)&&v.coins.length<100)v.coins.push(+arg);else return false;return true;}
    if(name==='j-adjust'||name==='j-value'){const n=name==='j-adjust'?(v.amount||0)+Number(arg):Number(arg);if(!Number.isInteger(n)||n<0||n>t.max)return false;v.amount=n;delete v.amountDraft;delete v.clockDraft;return true;}
    return false;
  }
  function next(s){
    const j=state(s),t=task(s);if(!j||!t||!j.solved||!valid(t,j.values))return false;
    if(stockShortage(j,t)){j.feedback=stockShortage(j,t);return false;}
    const e=t.effect,cash=j.cash+(e.earn||0)-(e.spend||0)-(e.savings||0),time=j.time+(e.minutes||0),inventory={...j.inventory};
    for(const [name,n]of Object.entries(e.add||{}))inventory[name]=(inventory[name]||0)+n;
    for(const [name,n]of Object.entries(e.consume||{})){if((inventory[name]||0)<n)return false;inventory[name]-=n;}
    if(cash<0||time>=1440)return false;
    j.envelopes ||= {};
    if(t.kind==='budget')t.labels.forEach((label,i)=>{if(label!=='Savings')j.envelopes[label]=(j.envelopes[label]||0)+j.values.parts[i];});
    let expense=e.spend||0;
    for(const label of /Bus/.test(e.receipt||'')?['Travel','Spending']:['Spending','Travel']){const used=Math.min(expense,j.envelopes[label]||0);if(used)j.envelopes[label]-=used;expense-=used;}
    j.cash=cash;j.time=time;j.inventory=inventory;if(e.list)j.shoppingList=copy(e.list);if(e.savings)j.savings+=e.savings;
    if(e.receipt)j.receipts.push({id:j.id+':'+j.stage,label:e.receipt,spent:e.spend||0,earned:e.earn||0,sale:e.sale||0,saved:e.savings||0,items:copy(e.add||{}),time:j.time,choice:e.choice||null});
    if(e.choice){j.decisions ||= [];j.decisions.push({stage:j.stage,choice:e.choice});}
    if(t.branches){const branch=t.branches[j.values.choice];if(!Array.isArray(branch))return false;j.steps.splice(j.stage+1,j.steps.length-j.stage-1,...copy(branch));j.decisions ||= [];j.decisions.push({stage:j.stage,choice:t.options[j.values.choice].name});}
    j.completed.push(j.stage);j.stage++;j.done=j.stage===j.steps.length;j.values={};j.solved=false;j.assisted=false;j.feedback='';j.hintLevel=0;if(j.done){s.resumeView='journey';s.lastResult={type:'town-plan',world:'town',name:j.name,runId:j.id};completeLandmark(s,j);}return true;
  }
  function stockShortage(j,t){const missing=Object.entries(t.requiresStock||{}).filter(([name,n])=>(j.inventory[name]||0)<n);return missing.length?'Not enough ingredients to cook. Missing '+missing.map(([key,n])=>{const i=j.recipeCard?.ingredients?.find(i=>i.key===key);return (n-(j.inventory[key]||0))+' '+(i?.unit||'')+' of '+(i?.name||key);}).join('; ')+'. Your progress is saved; review your ingredient list.':null;}
  function completeLandmark(s,j){
    const M=typeof module!=='undefined'?require('./adventure').V3Adventure:root.V3Adventure;
    const route=catalog.find(c=>c.id===j.scenario).venue,key=M.id('town',route,j.tier),a=M.state(s);
    // The same venue/tier story milestone can be earned only once across old and new play.
    // A completed plan never rewrites an earlier mission record, mastery or wallet.
    if(a.records[key])return;
    a.records[key]={world:'town',route,tier:j.tier,unassisted:j.evidence.filter(e=>e.correct&&!e.assisted).length,evidence:copy(j.evidence),skips:copy(j.skips||[]),context:T.context(route,j.category==='Employment'?'direct':'journey'),completedAt:new Date().toISOString(),serial:Math.max(0,...Object.values(a.records).map(r=>r.serial||0))+1,source:'town-life-v2'};
    const milestone='mission|'+key;if(!s.milestones.includes(milestone))s.milestones.push(milestone);
  }
  function model(s){const j=state(s);if(!j)return null;const original=task(s),t=original?T.taskDetails(original):null;return {...j,task:t,title:t?.title||'Town plan complete',venue:t?.venue||'home',recipeName:j.name,context:j.contentRevision===3?{...T.context(t?.venue||'home',j.category==='Employment'?'direct':'journey'),role:j.category==='Employment'?'worker':j.category==='Cooking'&&(t?.venue||'home')==='home'?'home cook':'customer',objective:j.category==='Cooking'?'Use your recipe card and carry the ingredients through your day.':j.category==='Shopping'?'Use your current shopping list and budget.':j.category==='Travel'?'Plan your visit and keep money and time for the return journey.':j.category==='Employment'?'Help customers at work. Keep business money separate from your wages.':'Complete the errand and keep your receipts for the trip home.'}:T.context(t?.venue||'home',j.category==='Employment'?'direct':'journey')};}
  root.V52TownLife={catalog,meals,jobs,make,start,startRecipe,state,task,action,next,model,valid,validRun,validBook,book};
  if(typeof module!=='undefined')module.exports={V52TownLife:root.V52TownLife};
})(typeof window!=='undefined'?window:globalThis);
