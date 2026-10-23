/* Original modular sprite wardrobe. Ownership/prices/equip authority remain in existing engines. */
(function(){'use strict';
const A=V3Art,C=V3Curriculum,R=V7WorldArt,esc=A.esc,oldIcon=A.icon;
const groups={Headwear:['wear-head',['helmet','cap','crown','wizardhat','hardhat','headphones','tophat']],Outfits:['wear-outfits',['jacket','hoodie','armour','suit','cape','spacesuit','ninja']],'Back items':['wear-back',['wings','jetpack','rucksack','shield','parachute','dragon']],Accessories:['wear-accessories',['glasses','medal','watch','scarf','gloves','sword','wand']],Companions:['wear-companions',['fox','dog','cat','frog','robot','axolotl','bee']]};
const backgrounds={forestbg:'forest',desertbg:'desert',spacebg:'probability',castlebg:'geometry',mountainbg:'rail',neonbg:'statistics'};
function sprite(sheet,index,cls='',attrs=''){return `<span class="sprite-cell ${cls}" ${attrs} style="background-image:url('${R.file(sheet)}');background-position:${(index%4)*100/3}% ${Math.floor(index/4)*100}%" aria-hidden="true"></span>`;}
function gear(item,cls=''){const group=groups[item.slot];return group?sprite(group[0],group[1].indexOf(item.id),cls,`data-worn="${item.id}"`):'';}
// Anchors are percentages of the shared 2:3 canvas. The base is inset 6% / 8%
// at 88% size, reserving hat headroom without changing character proportions.
const anchors=Object.freeze({head:[49,20],face:[49,21],neck:[49,29],body:[49,29],back:[49,29],wrist:[67.5,53.3],hands:[49,59],leftHand:[30,59],rightHand:[69,59],hand:[68,57],feet:[49,95],companion:[96,98],hair:[49,8]});
// Crops are measured within each atlas cell, excluding its transparent padding.
// They are CSS windows into the original assets, not replacement artwork.
const crops={
 'wear-head':[[13,135,376,397],[29,135,356,420],[15,126,369,440],[6,48,379,447],[14,71,375,325],[10,69,376,395],[7,58,377,393]],
 'wear-outfits':[[75,32,336,490],[49,28,338,485],[56,33,327,494],[50,33,333,488],[16,19,384,481],[45,17,340,476],[51,21,331,477]],
 'wear-back':[[13,77,384,483],[0,86,374,482],[25,94,358,483],[10,115,368,483],[27,29,384,420],[0,20,384,439]],
 'wear-accessories':[[21,202,384,372],[0,56,338,458],[78,65,324,459],[43,65,342,467],[37,87,379,416],[110,10,306,462],[125,17,269,463]],
 'wear-companions':[[14,13,436,440],[30,23,440,443],[64,16,443,443],[0,87,432,443],[46,23,421,424],[35,0,443,392],[0,0,443,417]],
 'wear-hair':[[19,32,422,420],[40,68,399,376],[18,18,427,420],[23,46,426,407],[26,101,416,376],[13,40,424,392],[18,55,427,400],[17,30,424,411]]
};
const categories=Object.freeze({headwear:{anchor:'head',width:32,z:7,pivot:[.5,1]},face:{anchor:'face',width:18,z:8,pivot:[.5,.5]},outfit:{anchor:'body',width:44,height:57,z:3,pivot:[.5,0]},back:{anchor:'back',width:34,z:1,pivot:[.5,0]},neck:{anchor:'neck',width:24,z:8,pivot:[.5,0]},wrist:{anchor:'wrist',width:7,z:8,pivot:[.5,.5]},hands:{anchor:'hands',width:9,height:11,z:8,pivot:[.5,.5]},handheld:{anchor:'hand',width:13,z:8,pivot:[.5,.75]},companion:{anchor:'companion',width:40,height:32,z:9,pivot:[.5,1]},footwear:{anchor:'feet',width:37,height:15,z:5,pivot:[.5,1]},hair:{anchor:'hair',width:29,height:17,z:6,pivot:[.5,0]}});
// Every catalogue wearable has an explicit fit. Overrides describe the silhouette,
// not its shop slot: a tiny dragon is a shoulder companion, not a full-size pack.
const fits=Object.freeze({
 helmet:{category:'headwear',width:26,dy:-.5},cap:{category:'headwear',width:30},crown:{category:'headwear',width:30},wizardhat:{category:'headwear',width:27},hardhat:{category:'headwear',width:26,dy:-.5},headphones:{category:'headwear',width:26,dy:5},tophat:{category:'headwear',width:29},
 jacket:{category:'outfit',width:44},hoodie:{category:'outfit',width:44},armour:{category:'outfit',width:45},suit:{category:'outfit',width:44},cape:{category:'outfit',width:53},spacesuit:{category:'outfit',width:46},ninja:{category:'outfit',width:44},
 wings:{category:'back',width:62,dy:-17},jetpack:{category:'back',width:33,dx:10},rucksack:{category:'back',width:34,dx:8,dy:-4},shield:{category:'back',width:31,dx:11,dy:-2},parachute:{category:'back',width:34,dx:-11,dy:-2},dragon:{category:'back',width:22,dx:20,dy:-7},
 glasses:{category:'face'},medal:{category:'neck',width:14},watch:{category:'wrist',width:5.3,height:5.5,rotation:78},scarf:{category:'neck',width:22,height:14,dy:-2},gloves:{category:'hands'},sword:{category:'handheld',width:13,pivot:[.49,.77],rotation:-12},wand:{category:'handheld',width:9,pivot:[.48,.73],rotation:12},
 fox:{category:'companion'},dog:{category:'companion'},cat:{category:'companion'},frog:{category:'companion'},robot:{category:'companion'},axolotl:{category:'companion'},bee:{category:'companion'}
});
function source(sheet,index,crop){const square=['wear-hair','wear-companions'].includes(sheet),faces=sheet==='wear-faces',sw=faces?2172:square?1774:1536,sh=faces?724:square?887:1024,cw=sw/4,ch=faces?sh:sh/2,[x,y,r,b]=crop,w=r-x,h=b-y;
 return `<span class="equipment-source" data-source-crop="${crop.join(',')}" style="background-image:url('${R.file(sheet)}');background-size:${sw/w*100}% ${sh/h*100}%;background-position:${(index%4*cw+x)/(sw-w)*100}% ${(Math.floor(index/4)*ch+y)/(sh-h)*100}%"></span>`;
}
function attachment(id,sheet,index,fit,crop=crops[sheet][index]){const rule={...categories[fit.category],...fit},[x,y]=anchors[rule.anchor],w=rule.width,h=rule.height??w*(crop[3]-crop[1])/(crop[2]-crop[0])*2/3,[px,py]=rule.pivot;
 return `<span class="avatar-attachment" data-worn="${id}" data-attachment="${id}" data-attachment-category="${fit.category}" data-anchor="${rule.anchor}" style="left:${x+(rule.dx||0)-w*px}%;top:${y+(rule.dy||0)-h*py}%;width:${w}%;height:${h}%;z-index:${rule.z};transform:rotate(${rule.rotation||0}deg);transform-origin:${px*100}% ${py*100}%">${source(sheet,index,crop)}</span>`;
}
function worn(item){const group=groups[item.slot];
 if(item.id==='gloves')return attachment('gloves',group[0],4,{category:'hands',anchor:'leftHand',rotation:180},[225,87,379,416])+attachment('gloves',group[0],4,{category:'hands',anchor:'rightHand',rotation:180},[37,87,201,416]);
 // Exclude the atlas' detached collar/hood. Join shoulder and leg crops at the waist.
 if(['jacket','hoodie'].includes(item.id)){const index=group[1].indexOf(item.id),crop=crops[group[0]][index];return attachment(item.id,group[0],index,{category:'outfit',height:26},[crop[0],item.id==='hoodie'?105:82,crop[2],270])+attachment(item.id,group[0],index,{category:'outfit',height:31,dy:26},[crop[0],270,crop[2],crop[3]]);}
 return attachment(item.id,group[0],group[1].indexOf(item.id),fits[item.id]);
}
function expression(face){return `<span class="avatar-expression" data-face-region="inner-face" aria-hidden="true">${source('wear-faces',face,[135,350,428,575])}</span>`;}
function footwear(shoes){return R.img('avatar-base','avatar-base avatar-upgrade-shoes footwear-'+shoes).replace('<img','<img data-footwear-facing="front" data-sole-geometry="starter"');}

function render(s={},inline=false){const items=C.catalog.filter(i=>(s.bought||[]).includes(i.id)&&(s.equipped||[]).includes(i.id)),by=slot=>items.find(i=>i.slot===slot),back=by('Back items'),bg=by('Backgrounds'),head=by('Headwear'),outfit=by('Outfits'),acc=by('Accessories'),pet=by('Companions');const settings=s.settings||{},option=n=>Number.isInteger(Number(n))&&Number(n)>0&&Number(n)<=3?Number(n):0,hair=option(settings.avatarHair),face=option(settings.avatarFace),shoes=option(settings.avatarShoes);
 return `<span class="explorer layered-explorer ${inline?'inline-explorer':''} ${hair?'changed-hair':''} ${outfit?'has-outfit':''}" role="img" aria-label="Teenage explorer wearing ${esc(items.map(i=>i.label).join(', ')||'starter green outfit')}" data-avatar-items="${esc(items.map(i=>i.id).join(' '))}">${bg?(bg.id==='mountainbg'?V6AssetArt.img('rail','avatar-scenery'):R.img(backgrounds[bg.id],'avatar-scenery')):''}${back?worn(back):''}${R.img('avatar-base','avatar-base')}${outfit?['left-hand','right-hand','feet'].map(part=>R.img('avatar-base','avatar-base avatar-skin avatar-'+part)).join('')+worn(outfit):''}${hair?`<span class="avatar-forehead" aria-hidden="true">${source('wear-faces',0,[170,445,250,495])}</span>`:''}${face||hair?expression(face):''}${hair?attachment('hair-'+hair,'wear-hair',hair,{category:'hair'}):''}${shoes?footwear(shoes):''}${head?worn(head):''}${acc?worn(acc):''}${['sword','wand'].includes(acc?.id)?R.img('avatar-base','avatar-base avatar-skin avatar-right-hand avatar-grip'):''}${pet?worn(pet):''}</span>`;
}
A.explorer=render;
A.icon=id=>{id=typeof id==='object'?id.id:id;const item=C.catalog.find(i=>i.id===id);if(!item)return oldIcon(id);if(item.slot==='Backgrounds'){return `<span class="item-art">${id==='mountainbg'?V6AssetArt.img('rail'):R.img(backgrounds[id])}</span>`;}return `<span class="item-art">${gear(item,'item-sprite')}</span>`;};
const guides={Rowan:0,Saff:0,Finn:1,Kit:1,Marin:3,Ada:2,Nova:1,Flint:5,Ellis:6,Jess:2,Sam:3};A.guide=name=>`<span class="illustrated-guide" role="img" aria-label="${esc(name)}, your adult guide">${sprite('helpers',guides[name]??0)}</span>`;
const select=(label,key,options,s)=>`<label>${label}<select data-avatar-look="${key}">${options.map((text,i)=>`<option value="${i}" ${Number(s.settings?.[key]||0)===i?'selected':''}>${text}</option>`).join('')}</select></label>`;
function controls(s){return `<section class="avatar-features" aria-label="Character appearance">${select('Hair','avatarHair',['Original brown','Short brown','Spiky brown','Curly brown'],s)}${select('Expression','avatarFace',['Calm','Thinking','Unsure','Proud'],s)}${select('Footwear','avatarShoes',['Green trainers','Walking boots','Blue high-tops','Gold explorer boots'],s)}<p class="small">These appearance choices are free. Shop items still use your existing coins and ownership.</p></section>`;}
const oldProduct=A.product;
A.product=(name,i)=>{
 if(/spaghetti|pasta|tomato|mince/i.test(name))return oldProduct(name,i);
 const food=[/^(?!.*coconut).*milk/i,/cheese/i,/apple|fruit/i,/bread/i,/oats/i,/rice/i,/flour/i,/chickpea/i,/coconut/i,/pepper/i,/carrot/i,/lentil/i,/banana/i,/juice/i,/chocolate(?!.*biscuit)/i,/fizzy/i];
 const supplies=[/sandwich/i,/pizza/i,/rolls/i,/wrap/i,/biscuit/i,/stock.*cube/i,/paper.*cup/i,/folder/i,/notebook/i,/pencil/i,/ticket/i,/towel/i,/locker.*token/i,/bag/i,/box/i,/coffee|tea|cappuccino|latte/i];
 let index=food.findIndex(re=>re.test(name)),sheet='products-food';if(index<0){index=supplies.findIndex(re=>re.test(name));sheet='products-supplies';}if(index<0){index=14;sheet='products-supplies';}
 return `<span class="ingredient-prop product-atlas" role="img" aria-label="${esc(name)}" style="background-image:url('${R.file(sheet)}');background-position:${index%4*100/3}% ${Math.floor(index/4)*100/3}%"></span>`;
};
window.V7Avatar={render,controls,sprite,groups,backgrounds,anchors,categories,fits,state:{},setState(s){this.state=s;}};
})();
