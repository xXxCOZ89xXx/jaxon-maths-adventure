/* New Town content only. Every new run snapshots these tasks; old runs keep their original content. */
(function(root){
  'use strict';
  const money=n=>'£'+(n/100).toFixed(2),clock=n=>String(Math.floor(n/60)).padStart(2,'0')+':'+String(n%60).padStart(2,'0');
  const clone=x=>JSON.parse(JSON.stringify(x));
  function shuffle(a,seed){const b=[...a];let r=(seed*2654435761)>>>0;for(let i=b.length-1;i>0;i--){r=(Math.imul(r,1664525)+1013904223)>>>0;const j=r%(i+1);[b[i],b[j]]=[b[j],b[i]];}return b;}
  function arrange(labels,seed){let p=shuffle(labels.map((_,i)=>i),seed);if(p.every((v,i)=>v===i))p.push(p.shift());return {items:p.map(i=>labels[i]),answer:labels.map((_,i)=>p.indexOf(i))};}
  function make(meta,tier,seed,data,original){
    const shift=(seed-1)%7,scale=tier,steps=[];let time=540+shift*10,cash=6000+scale*500,stock={},recipeCard=null;
    const initialCash=cash,initialTime=time;
    const add=(venue,title,kind,prompt,answer,extra={},effect={})=>{const lessons={basket:['Count each product separately and compare it with the quantities you need.','Need 4 notebooks and have 1? Put 3 on the list.'],journey:['Add walking time to each arrival before comparing eligible fares.','A bus arriving at 08:00 plus a 10-minute walk reaches the destination at 08:10.'],clock:['Add the duration to the start time. Carry 60 minutes into the next hour.','08:45 plus 20 minutes is 09:05.'],measure:['Convert the units, then position the scale marker.','0.1 litre equals 100 ml.'],budget:['Every pound has one purpose; all allocations must equal the wages.','From £10, save £3 and reserve £2: £5 remains.'],choice:['Check which option meets the requirement before comparing its cost.','A 4-seat ticket is too small for 5 people, even when cheaper.']};const lesson=lessons[kind]||['Work out the requested total or difference, using the units in the question.','Three groups of 2 items contain 6 items.'];const t={venue,title,kind,prompt,answer,min:0,max:100000,step:1,unit:'',skill:'town_money',teach:lesson[0],example:lesson[1],hint:'Compare your model with the quantities and units in the task.',worked:'Check each quantity and the operation you used.',effect,...extra};steps.push(t);cash+=(effect.earn||0)-(effect.spend||0)-(effect.savings||0);time+=effect.minutes||0;return t;};
    const amount=(venue,title,prompt,answer,unit='p',effect={})=>add(venue,title,unit==='time'?'clock':'amount',prompt,answer,{unit,max:unit==='time'?1439:100000,step:unit==='p'?25:1,worked:unit==='time'?`The finish time is ${clock(answer)}.`:unit==='p'?`The amount is ${money(answer)}.`:`The duration is ${answer} minutes.`},effect);
    const order=(venue,title,labels,prompt,effect={})=>add(venue,title,'order',prompt,null,{...arrange(labels,seed+steps.length),instruction:'Tap an action, then its position. Use every action once.',teach:'Think about which action depends on an earlier action.',example:'For a different task: put socks on before putting shoes on.',hint:'Which action can safely happen first? What needs to be ready before the next action?',worked:labels.join(' → ')},effect);
    const choice=(venue,title,prompt,options,answer,extra={},effect={})=>{const indices=shuffle(options.map((_,i)=>i),seed+steps.length);return add(venue,title,'choice',prompt,indices.indexOf(answer),{options:indices.map(i=>({name:options[i].name,price:options[i].price??0,...options[i]})),...extra},effect);};
    function pay(venue,label,cost,effect={}){const paid=Math.ceil(cost/500)*500;add(venue,'Pay for '+label,'coins',`The bill is ${money(cost)}. Take ${money(paid)} from your pretend purse and place it on the counter.`,paid,{unit:'p',teach:'Build the payment from UK coin and note values.',hint:'£1 is 100p. You can remove the last token.',worked:`The payment tray needs ${paid} pence.`});add(venue,'Collect your change','coins',`You paid ${money(paid)} for a ${money(cost)} bill. Collect the change.`,paid-cost,{unit:'p',hint:'Subtract the bill from the amount paid.',worked:`${money(paid)} − ${money(cost)} = ${money(paid-cost)}.`},{spend:cost,receipt:label,...effect});}
    function bus(destination,returning=false){const depart=time+10,arrival=depart+15+shift*5,walk=5*(tier),fare=100+25*shift+25*(tier-1),deadline=arrival+walk+5;
      let options=shuffle([{name:'Local bus',depart,arrive:arrival,price:fare},{name:'Later bus',depart:depart+10,arrive:arrival+15,price:fare-25},{name:'Express bus',depart:depart+5,arrive:arrival-5,price:fare+100}],seed+steps.length);
      add('station',returning?'Catch the bus home':'Catch the bus to '+destination,'journey',`Catch the bus ${returning?'home':'to '+destination}. It is ${clock(time)}. Allow ${walk} minutes to walk after the bus. You need to arrive by ${clock(deadline)}. Choose the cheapest service that gets you there in time.`,options.findIndex(o=>o.name==='Local bus'),{destination,options,walk,deadline,hint:'Add the walking time to each bus arrival. Compare fares only for services that arrive in time.',worked:`The local service reaches the destination at ${clock(arrival+walk)} and costs ${money(fare)}.`},{spend:fare,minutes:arrival+walk-time,receipt:'Bus to '+(returning?'home':destination),choice:'Local bus'});
    }
    function basket(venue,title,prompt,items,prices,answer,visualContext,effect={},budget){return add(venue,title,'basket',prompt,answer,{items:items.map((name,i)=>({name,price:prices[i]})),visualContext,budget,stock:clone(stock),instruction:'Tap a product to collect one. Tap a basket item to put one back.',hint:visualContext==='stock'?'Count the products inside each cupboard or fridge compartment.':'Compare each basket quantity with your saved shopping list.',worked:answer.map((n,i)=>items[i]+': '+n).join('; ')},effect);}
    function buy(items,prices,need,venue,atHome,limit){
      const have=atHome||items.map(()=>0);items.forEach((n,i)=>stock[n]=have[i]);
      if(atHome)basket('home','Inspect the kitchen stock','Look inside the cupboards and fridge. Select the quantities already available.',items,prices,have,'stock');
      const missing=need.map((n,i)=>Math.max(0,n-have[i])),list=Object.fromEntries(items.map((n,i)=>[n,missing[i]]));
      basket('home','Make your shopping list',atHome?'Use the recipe card and kitchen stock. List only the missing ingredients.':`Prepare the list: ${items.map((n,i)=>need[i]+' × '+n).join('; ')}.`,items,prices,missing,'list',{list});
      bus(venue==='market'?'the supermarket':'the shopping centre');
      const extras=['Chocolate bar','Fizzy drink'],all=[...items,...extras],allPrices=[...prices,85+shift*5,110+shift*5],cost=missing.reduce((sum,n,i)=>sum+n*prices[i],0);
      basket(venue,'Collect from the shelves','Use your saved shopping list. Tap shelf products to put the required quantities in your basket. Leave unneeded extras on the shelf.',all,allPrices,[...missing,0,0],'shelves',{},limit??cash);
      if(limit)amount(venue,'Check the money left',`Your shopping budget is ${money(limit)}. The basket costs ${money(cost)}. How much of this budget remains?`,limit-cost);
      pay(venue,'shopping',cost,{add:list});bus('home',true);
      return {list,cost};
    }
    function finishDay(label){amount('home','Count your remaining cash',`Back home after ${label}. Use the starting purse (${money(initialCash)}) and your saved receipts to work out the cash still in your purse. Savings held at the bank are separate.`,cash);}
    if(meta.category==='Cooking'){
      const m=clone(data.meals.find(m=>'cook-'+m.id===meta.id));
      if(original){Object.assign(m,{name:original==='lentil'?'Lentil Bolognese':'Spaghetti Bolognese',ingredients:['Spaghetti · 100 g pack','Tomatoes · tin',original==='lentil'?'Lentils · 100 g pack':'Mince · 100 g pack'],need:[2,1,2],prices:[65,85,150],water:500,cook:25,prep:['Measure the sauce ingredients','Simmer the protein with tomatoes in the pan','Cook the spaghetti and combine with the sauce']});}
      const requirements=m.need.map(n=>n*scale),prices=m.prices.map(p=>p+shift*5),have=requirements.map((n,i)=>i===1?0:Math.min(n,1));
      const liquid=m.id==='pancakes'&&!original?'milk':m.id==='pizza'&&!original?'passata':m.id==='soup'&&!original?'prepared stock':'water';
      const ml=(liquid==='milk'?m.need[1]*100:liquid==='passata'?m.need[1]*100:m.water)*scale;
      const method=m.id==='pizza'&&!original?'oven':m.id==='pancakes'&&!original?'frying pan':'hob';
      const temperature=method==='oven'?190:method==='frying pan'?160:100;
      const minutes=m.cook+shift;
      recipeCard={name:m.name,basePortions:2,portions:2*scale,ingredients:m.ingredients.map((name,i)=>({name,base:m.need[i],required:requirements[i]})),prep:m.prep,liquid,ml,method,temperature,minutes,safety:'Pretend recipe for maths only. Cooking with real food needs an adult and a real recipe.'};
      if(tier>1)amount('home','Scale the recipe',`The recipe card makes 2 portions. You need ${2*scale} portions. How many ${m.ingredients[0]} are needed?`,requirements[0],'packs');
      buy(m.ingredients,prices,requirements,'market',have);
      order('home','Prepare '+m.name,m.prep,'Open the recipe card. Arrange the preparation actions for this meal.');
      add('home','Measure the '+liquid,'measure',`Use the jug to measure ${ml/1000} litres of ${liquid} for this batch.`,ml,{unit:'ml',max:Math.max(1000,ml+500),step:50,hint:'One litre is 1,000 ml. Tap a jug scale mark, then fine-tune if needed.',worked:`${ml/1000} litres = ${ml} ml.`});
      choice('home','Set the recipe temperature',`Use the temperature supplied on the recipe card for the ${method}. Do not guess a real food-safety temperature.`,[temperature-20,temperature,temperature+20].map(n=>({name:n+' °C',price:0})),1,{hint:'Find the temperature beside the cooking method on the recipe card.',worked:`This fictional recipe specifies ${temperature} °C.`});
      amount('home','When will the meal be ready?',`Start ${m.name} at ${clock(time)}. The recipe specifies ${minutes} minutes. Set the finishing time.`,time+minutes,'time',{minutes,consume:Object.fromEntries(m.ingredients.map((n,i)=>[n,requirements[i]]))});
      order('home','Serve and tidy',['Turn off the cooking equipment','Serve the meal','Wash the used equipment'],'The meal is ready. Put these actions in a safe and useful order.');
    }else if(meta.id==='shop-budget'){
      // A real choice branches the saved plan. Both branches include a stock problem and recalculation.
      const branches=[];for(const lunch of ['wraps','pasta','potato']){
        const begin=steps.length;time=initialTime;cash=initialCash;stock={};
        const items=lunch==='wraps'?['Wraps · pack','Cheese · pack','Apples · bag']:lunch==='pasta'?['Pasta · bag','Tomato sauce · jar','Pears · bag']:['Potatoes · bag','Beans · tin','Pears · bag'];
        const prices=lunch==='wraps'?[160,180,150]:lunch==='pasta'?[125,145,160]:[155,80,160],need=[tier===3?2:1,tier===3?2:1,tier>=2?2:1],missing=[...need,0];
        const list=Object.fromEntries(items.map((n,i)=>[n,need[i]]));
        basket('home','List the lunch ingredients',`Your chosen lunch is ${lunch==='wraps'?'cheese wraps with apples':lunch==='pasta'?'tomato pasta with pears':'jacket potatoes with beans and pears'}. Pack lunches for ${tier+1} days. List ${need.map((n,i)=>n+' × '+items[i]).join('; ')}.`,items,prices,need,'list',{list});
        bus('the supermarket');
        const replacement=lunch==='wraps'?'Wholemeal rolls · pack':lunch==='pasta'?'Rice · bag':'Sweet potatoes · bag',newPrice=(lunch==='wraps'?140:lunch==='pasta'?135:165)+shift*5;
        const alternatives=[{name:replacement,price:newPrice},{name:lunch==='wraps'?'Chocolate biscuits':'Sweet popcorn',price:90}];
        const substituted=[replacement,...items.slice(1)],newPrices=[newPrice,...prices.slice(1)],newList=Object.fromEntries(substituted.map((n,i)=>[n,need[i]]));
        choice('market','Choose a useful substitute',`${items[0]} is out of stock. Which item can replace it in your ${lunch==='wraps'?'cheese lunch':lunch==='pasta'?'sauce-based lunch':'potato and bean lunch'}? Compare its use and price.`,alternatives,0,{unavailable:items[0],hint:'Choose a bread or starchy base for the main lunch, rather than a snack.',worked:`${replacement} can be used as the main base for this lunch.`},{list:newList,choice:replacement});
        const all=[...substituted,'Chocolate biscuits'],allPrices=[...newPrices,90],cost=need.reduce((s,n,i)=>s+n*newPrices[i],0);
        basket('market','Shop from the revised list','The saved list now uses your substitute. Build the lunch basket. Keep the total within £12.',all,allPrices,missing,'shelves',{},1200);
        amount('market','Recalculate the lunch budget',`The revised basket costs ${money(cost)}. How much remains from £12?`,1200-cost);
        pay('market','packed-lunch ingredients',cost,{add:newList});bus('home',true);finishDay('lunch shopping');
        branches.push(clone(steps.splice(begin)));
      }
      time=initialTime;cash=initialCash;stock={};
      const t=choice('home','Choose your packed lunch',`Choose a lunch for ${tier+1} days. You have £12 for ingredients. All three options can fit the budget; your choice changes the shopping list.`,[{name:'Cheese wraps with apples',detail:`${tier===3?2:1} wrap packs, ${tier===3?2:1} cheese packs, ${tier>=2?2:1} apple bags`,price:(tier===3?2:1)*340+(tier>=2?2:1)*150},{name:'Tomato pasta with pears',detail:`${tier===3?2:1} pasta bags, ${tier===3?2:1} sauce jars, ${tier>=2?2:1} pear bags`,price:(tier===3?2:1)*270+(tier>=2?2:1)*160},{name:'Jacket potatoes with beans',detail:`${tier===3?2:1} potato bags, ${tier===3?2:1} bean tins, ${tier>=2?2:1} pear bags`,price:(tier===3?2:1)*235+(tier>=2?2:1)*160}],0,{allowedChoices:[0,1,2],lunchChoice:true,hint:'Compare what each lunch needs. Choose the one you want to make.',worked:'Each lunch can fit £12. The next stages use your choice.'});
      t.branches=Object.fromEntries(t.options.map((o,i)=>[i,branches[o.name.startsWith('Cheese')?0:o.name.startsWith('Tomato')?1:2]]));steps.push(...clone(branches[0]));
    }else if(meta.category==='Shopping'){
      const m=clone(data.shopping.find(m=>'shop-'+m.id===meta.id)),prices=m.prices.map(p=>p+shift*5),need=m.qty.map(n=>n?Math.min(8,n+tier-1):0);
      if(m.id==='offers'){
        bus('the shopping centre');const pack=2+tier,small=150+shift*10,large=2*small+(shift%2?45:-35),best=large<2*small?1:0;
        choice('shops','Compare complete offers',`You need ${2*pack} drinks. Compare two ${pack}-packs at ${money(small)} each with one ${2*pack}-pack at ${money(large)}.`,[{name:'Two small packs',price:2*small},{name:'One large pack',price:large}],best,{worked:`Two small packs total ${money(2*small)}. Compare that with ${money(large)}.`});pay('shops','festival drinks',Math.min(2*small,large),{add:{'Juice carton':2*pack}});bus('home',true);
      }else{
        if(m.id==='party')amount('home','Plan enough cups',`${3+tier} guests each need 2 cups. How many cups do you need altogether?`,(3+tier)*2,'cups');
        if(m.id==='groceries'){m.items=[...m.items];m.items[0]='Breakfast oats · 6-serving box';prices[0]=155;need[0]=1;choice('home','Choose the grocery pack',`You need at least ${tier+2} breakfasts. Which oats pack is the cheapest that covers them?`,[{name:'2 servings',price:90},{name:'6 servings',price:155},{name:'12 servings',price:320}],1,{worked:'The 2-serving pack is too small. Compare the two packs that cover the breakfasts.'});}
        if(m.id==='party'){need[0]=Math.ceil((3+tier)*2/10);m.items=[...m.items];m.items[0]='Paper cups · pack of 10';}
        buy(m.items,prices,need,m.venue,m.id==='missing'?need.map((n,i)=>i===1?0:1):null,m.id==='party'?2000:null);
      }finishDay(m.name);
    }else if(meta.category==='Travel'){
      const m=data.trips.find(m=>'travel-'+m.id===meta.id),destination={swim:'the swimming pool',library:'the library',appointment:'the health centre',cinema:'the cinema',connection:'the railway station'}[m.id];
      amount('home','Reserve the return fare',`A single bus fare is ${money(100+25*shift+25*(tier-1))}. Keep enough for the outward and return journeys. How much is needed?`,2*(100+25*shift+25*(tier-1)));
      bus(destination);const duration=m.duration+shift+5*(tier-1),finish=time+duration;
      if(m.id==='library')choice('shops','Use the library return date',`Your library receipt says return in ${7+tier} days. Which reminder matches the receipt?`,[{name:(7+tier)+' days',price:0},{name:'Tomorrow',price:0},{name:'Next month',price:0}],0,{worked:`The reminder needs to be ${7+tier} days away.`});
      if(m.id==='connection'){amount('station','Allow for the connection',`The onward train leaves ${clock(time+20)}. Walking to the platform takes 5 minutes. What is the latest time to leave the bus stop?`,time+15,'time');}
      if(m.fee)pay(m.venue,m.id==='connection'?'onward train ticket':m.id==='cinema'?'cinema ticket':'swimming ticket',m.fee+shift*25);
      amount(m.venue,m.id==='appointment'?'Appointment finish time':'Plan when to leave',`${destination.replace('the ','The ')} visit starts at ${clock(time)} and lasts ${duration} minutes. Set the finish time before choosing the return bus.`,time+duration,'time',{minutes:duration});
      bus('home',true);amount('home','Calculate the outward bus duration',`Your outward receipt records a bus departing at ${clock(initialTime+10)} and arriving at ${clock(initialTime+25+shift*5)}. How many minutes was the bus ride?`,15+shift*5,'minutes');finishDay(m.name);
    }else if(meta.category==='Employment'){
      const m=data.jobs.find(j=>'job-'+j.id===meta.id),v=m.id,hours=m.hours+tier-1,rate=m.rate+shift*25,gross=hours*rate,deduction=m.deduction+shift*5,net=gross-deduction;
      let bill=0;
      if(v==='cafe'){const drinks=2+tier;add(v,'Prepare a customer order','measure',`${drinks} drinks need 150 ml of milk each. Measure the total.`,drinks*150,{unit:'ml',max:1500,step:50,worked:`${drinks} × 150 ml = ${drinks*150} ml.`});bill=drinks*175;}
      else if(v==='station'){bill=250*(tier+1);amount(v,'Sell return tickets',`${tier+1} customers each need a £2.50 return ticket. Build the total fare.`,bill);}
      else if(v==='work'){add(v,'Measure a repair piece','measure',`The work order needs a ${60+tier*10+shift*5} cm strip. Set its length on the ruler.`,60+tier*10+shift*5,{unit:'cm',max:150,step:5,worked:'Measure from zero to the requested centimetre mark.'});bill=600+tier*50;}
      else if(v==='bank'){amount(v,'Post a customer deposit',`A customer has ${money(2000+shift*100)} and deposits £5. Build the new balance.`,2500+shift*100);bill=0;}
      else{const items=v==='leisure'?['Swim ticket','Locker token','Towel hire']:v==='shops'?['Notebook','Pencil pack','Folder']:['Apples','Milk','Bread'],qty=[tier+1,1,1],prices=[125,150,100];bill=qty.reduce((s,n,i)=>s+n*prices[i],0);basket(v,'Collect the customer order',`The customer requests ${qty.map((n,i)=>n+' × '+items[i]).join('; ')}. Collect the order for them.`,items,prices,qty,'shelves');}
      if(bill){const paid=Math.ceil(bill/500)*500;add(v,'Give change from the till','coins',`The customer bill is ${money(bill)} and they paid ${money(paid)}. Give their change. This is business money, separate from your purse.`,paid-bill,{unit:'p',worked:`${money(paid)} − ${money(bill)} = ${money(paid-bill)}.`},{receipt:'Customer sale handled',sale:bill});}
      amount(v,'Calculate gross wages',`Shift ${clock(initialTime)}–${clock(initialTime+hours*60+m.break)} includes a ${m.break}-minute unpaid break. Pay is ${money(rate)} per hour. Build gross pay.`,gross,'p',{minutes:hours*60+m.break});
      amount(v,'Read your fictional payslip',`Gross ${money(gross)}. Supplied deduction ${money(deduction)}. Build net pay. These are fictional practice figures, not real wage or tax advice.`,net,'p',{earn:net,receipt:'Net wages'});
      const saving=Math.floor(net/300)*100,travel=200+shift*25,spend=net-saving-travel;
      add('bank','Allocate the new wages','budget',`Allocate ${money(saving)} to savings, ${money(travel)} to travel and the rest of your ${money(net)} net wages to spending.`,[saving,travel,spend],{labels:['Savings','Travel','Spending'],budget:net,step:5,worked:`Spending = ${money(net)} − ${money(saving)} − ${money(travel)} = ${money(spend)}.`},{savings:saving,receipt:'Wages savings reserved'});bus('home',true);finishDay(m.name);
    }else{
      const m=data.errands.find(e=>'errand-'+e.id===meta.id),destination={post:'the post office',activity:'the climbing centre',bills:'the community bank',appointment:'the hairdresser',repair:'the bicycle workshop'}[m.id];let fee=m.fee+shift*25;bus(destination);
      if(m.id==='post'){const weight=250+shift*50+tier*100;choice('shops','Choose parcel postage',`Your parcel weighs ${weight} g. Choose the cheapest service covering its weight.`,[{name:'Small · up to 500 g',price:235},{name:'Medium · up to 1,000 g',price:325}],weight<=500?0:1,{worked:`${weight} g ${weight<=500?'fits the small':'needs the medium'} service.`});fee=weight<=500?235:325;}
      else if(m.id==='bills')amount('bank','Check the remaining bill',`The club bill is ${money(fee+300)}; £3 has already been paid. How much remains?`,fee);
      else if(m.id==='repair')amount('work','Check the repair receipt',`Brake adjustment £2; replacement cable £1.50; labour ${money(fee-350)}. What is the total?`,fee);
      else amount(m.venue,'Plan the appointment',`The booking starts at ${clock(time+10)} and lasts ${m.minutes} minutes. Set the finish time.`,time+10+m.minutes,'time',{minutes:10+m.minutes});
      pay(m.venue,m.id==='post'?'postage':m.id==='bills'?'club bill':m.id==='repair'?'bicycle repair':'booking',fee,{minutes:['post','bills','repair'].includes(m.id)?m.minutes:0});bus('home',true);finishDay(m.name);
    }
    return {version:2,contentRevision:3,id:meta.id+':'+seed,scenario:meta.id,name:recipeCard?.name||meta.name,category:meta.category,tier,seed,stage:0,steps,values:{},inventory:stock,shoppingList:{},cash:initialCash,time:initialTime,savings:0,receipts:[],completed:[],evidence:[],solved:false,assisted:false,feedback:'',done:false,...(recipeCard?{recipeCard}:{}),...(original?{originalRecipe:original}:{})};
  }
  root.V53TownContent={make,shuffle,arrange};if(typeof module!=='undefined')module.exports={V53TownContent:root.V53TownContent};
})(typeof window!=='undefined'?window:globalThis);
