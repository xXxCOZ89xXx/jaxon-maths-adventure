/* Original modular sprite wardrobe. Ownership/prices/equip authority remain in existing engines. */
(function(){'use strict';
const A=V3Art,C=V3Curriculum,R=V7WorldArt,esc=A.esc,oldIcon=A.icon;
const groups={Headwear:['wear-head',['helmet','cap','crown','wizardhat','hardhat','headphones','tophat']],Outfits:['wear-outfits',['jacket','hoodie','armour','suit','cape','spacesuit','ninja']],'Back items':['wear-back',['wings','jetpack','rucksack','shield','parachute','dragon']],Accessories:['wear-accessories',['glasses','medal','watch','scarf','gloves','sword','wand']],Companions:['wear-companions',['fox','dog','cat','frog','robot','axolotl','bee']]};
const backgrounds={forestbg:'forest',desertbg:'desert',spacebg:'probability',castlebg:'geometry',mountainbg:'rail',neonbg:'statistics'};
function sprite(sheet,index,cls='',attrs=''){return `<span class="sprite-cell ${cls}" ${attrs} style="background-image:url('${R.file(sheet)}');background-position:${(index%4)*100/3}% ${Math.floor(index/4)*100}%" aria-hidden="true"></span>`;}
function gear(item,cls=''){const group=groups[item.slot];return group?sprite(group[0],group[1].indexOf(item.id),cls,`data-worn="${item.id}"`):'';}
function render(s={},inline=false){const items=C.catalog.filter(i=>(s.bought||[]).includes(i.id)&&(s.equipped||[]).includes(i.id)),by=slot=>items.find(i=>i.slot===slot),back=by('Back items'),bg=by('Backgrounds'),head=by('Headwear'),outfit=by('Outfits'),acc=by('Accessories'),pet=by('Companions');const settings=s.settings||{},hair=Number(settings.avatarHair)||0,face=Number(settings.avatarFace)||0,shoes=Number(settings.avatarShoes)||0;
 return `<span class="explorer layered-explorer ${inline?'inline-explorer':''} ${hair?'changed-hair':''}" role="img" aria-label="Teenage explorer wearing ${esc(items.map(i=>i.label).join(', ')||'starter green outfit')}" data-avatar-items="${esc(items.map(i=>i.id).join(' '))}">${bg?(bg.id==='mountainbg'?V6AssetArt.img('rail','avatar-scenery'):R.img(backgrounds[bg.id],'avatar-scenery')):''}${back?gear(back,'avatar-back'):''}${R.img('avatar-base','avatar-base')}${outfit?gear(outfit,'avatar-outfit'):''}${face?`<span class="avatar-face sprite-face" style="background-image:url('${R.file('wear-faces')}');background-position:${face*100/3}% 50%"></span>`:''}${hair?sprite('wear-hair',hair,'avatar-hair'):''}${shoes?sprite('wear-hair',4+shoes,'avatar-shoes'):''}${head?gear(head,'avatar-head head-'+head.id):''}${acc?gear(acc,'avatar-accessory accessory-'+acc.id):''}${pet?gear(pet,'avatar-pet'):''}</span>`;
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
window.V7Avatar={render,controls,sprite,groups,backgrounds,state:{},setState(s){this.state=s;}};
})();
