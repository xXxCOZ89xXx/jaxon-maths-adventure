/* Original modular sprite wardrobe. Ownership/prices/equip authority remain in existing engines. */
(function(){'use strict';
const A=V3Art,C=V3Curriculum,R=V7WorldArt,esc=A.esc,oldIcon=A.icon;
const groups={Headwear:['wear-head',['helmet','cap','crown','wizardhat','hardhat','headphones','tophat']],Outfits:['wear-outfits',['jacket','hoodie','armour','suit','cape','spacesuit','ninja']],'Back items':['wear-back',['wings','jetpack','rucksack','shield','parachute','dragon']],Accessories:['wear-accessories',['glasses','medal','watch','scarf','gloves','sword','wand']],Companions:['wear-companions',['fox','dog','cat','frog','robot','axolotl','bee']]};
// Presentation policy only: retired IDs remain in the immutable catalogue and saves.
const retiredItems=Object.freeze(['helmet','cap','crown','wizardhat','hardhat','tophat','headphones','jetpack','rucksack','shield','parachute','dragon','medal','watch','scarf','gloves','sword','wand']);
const isActiveItem=item=>!!item&&!retiredItems.includes(typeof item==='string'?item:item.id);
const backgrounds={forestbg:'forest',desertbg:'desert',spacebg:'probability',castlebg:'geometry',mountainbg:'rail',neonbg:'statistics'};
function sprite(sheet,index,cls='',attrs=''){return `<span class="sprite-cell ${cls}" ${attrs} style="background-image:url('${R.file(sheet)}');background-position:${(index%4)*100/3}% ${Math.floor(index/4)*100}%" aria-hidden="true"></span>`;}

// Supplied artwork is presentation only. Ownership and chosen colours stay authoritative.
const suppliedFiles=Object.freeze({"base-camp-bird-box":"v3/assets/supplied-20261128/base-camp-bird-box.webp","base-camp-bookshelf":"v3/assets/supplied-20261128/base-camp-bookshelf.webp","base-camp-bunting":"v3/assets/supplied-20261128/base-camp-bunting.webp","base-camp-hammock":"v3/assets/supplied-20261128/base-camp-hammock.webp","base-camp-lantern-post":"v3/assets/supplied-20261128/base-camp-lantern-post.webp","base-camp-picnic-table":"v3/assets/supplied-20261128/base-camp-picnic-table.webp","base-camp-plant-pot":"v3/assets/supplied-20261128/base-camp-plant-pot.webp","base-camp-telescope":"v3/assets/supplied-20261128/base-camp-telescope.webp","town-library-books-being-stocked":"v3/assets/supplied-20261128/town-library-books-being-stocked.webp","town-library-books-finished":"v3/assets/supplied-20261128/town-library-books-finished.webp","town-park-bench-being-built-draft":"v3/assets/supplied-20261128/town-park-bench-being-built-draft.webp","town-park-bench-finished-draft":"v3/assets/supplied-20261128/town-park-bench-finished-draft.webp","town-playground-being-built":"v3/assets/supplied-20261128/town-playground-being-built.webp","town-playground-finished":"v3/assets/supplied-20261128/town-playground-finished.webp","axolotl":"v3/assets/supplied-20261128/axolotl.webp","bee":"v3/assets/supplied-20261128/bee.webp","cat":"v3/assets/supplied-20261128/cat.webp","colour-glasses-1":"v3/assets/supplied-20261128/colour-glasses-1.webp","colour-glasses-2":"v3/assets/supplied-20261128/colour-glasses-2.webp","colour-glasses-3":"v3/assets/supplied-20261128/colour-glasses-3.webp","colour-wings-1":"v3/assets/supplied-20261128/colour-wings-1.webp","colour-wings-2":"v3/assets/supplied-20261128/colour-wings-2.webp","colour-wings-3":"v3/assets/supplied-20261128/colour-wings-3.webp","dog":"v3/assets/supplied-20261128/dog.webp","fox":"v3/assets/supplied-20261128/fox.webp","frog":"v3/assets/supplied-20261128/frog.webp","robot":"v3/assets/supplied-20261128/robot.webp","colour-cap-1":"v3/assets/supplied-20261128/colour-cap-1.webp","colour-cap-2":"v3/assets/supplied-20261128/colour-cap-2.webp","colour-cap-3":"v3/assets/supplied-20261128/colour-cap-3.webp","colour-crown-1":"v3/assets/supplied-20261128/colour-crown-1.webp","colour-crown-2":"v3/assets/supplied-20261128/colour-crown-2.webp","colour-crown-3":"v3/assets/supplied-20261128/colour-crown-3.webp","colour-helmet-1":"v3/assets/supplied-20261128/colour-helmet-1.webp","colour-helmet-2":"v3/assets/supplied-20261128/colour-helmet-2.webp","colour-helmet-3":"v3/assets/supplied-20261128/colour-helmet-3.webp","colour-wizardhat-1":"v3/assets/supplied-20261128/colour-wizardhat-1.webp","colour-wizardhat-2":"v3/assets/supplied-20261128/colour-wizardhat-2.webp","colour-wizardhat-3":"v3/assets/supplied-20261128/colour-wizardhat-3.webp","colour-hardhat-1":"v3/assets/supplied-20261128/colour-hardhat-1.webp","colour-hardhat-2":"v3/assets/supplied-20261128/colour-hardhat-2.webp","colour-hardhat-3":"v3/assets/supplied-20261128/colour-hardhat-3.webp","colour-headphones-1":"v3/assets/supplied-20261128/colour-headphones-1.webp","colour-headphones-2":"v3/assets/supplied-20261128/colour-headphones-2.webp","colour-headphones-3":"v3/assets/supplied-20261128/colour-headphones-3.webp","colour-tophat-1":"v3/assets/supplied-20261128/colour-tophat-1.webp","colour-tophat-2":"v3/assets/supplied-20261128/colour-tophat-2.webp","colour-tophat-3":"v3/assets/supplied-20261128/colour-tophat-3.webp","colour-armour-1":"v3/assets/supplied-20261128/colour-armour-1.webp","colour-armour-2":"v3/assets/supplied-20261128/colour-armour-2.webp","colour-armour-3":"v3/assets/supplied-20261128/colour-armour-3.webp","colour-hoodie-1":"v3/assets/supplied-20261128/colour-hoodie-1.webp","colour-hoodie-2":"v3/assets/supplied-20261128/colour-hoodie-2.webp","colour-hoodie-3":"v3/assets/supplied-20261128/colour-hoodie-3.webp","colour-jacket-1":"v3/assets/supplied-20261128/colour-jacket-1.webp","colour-jacket-2":"v3/assets/supplied-20261128/colour-jacket-2.webp","colour-jacket-3":"v3/assets/supplied-20261128/colour-jacket-3.webp","colour-suit-1":"v3/assets/supplied-20261128/colour-suit-1.webp","colour-suit-2":"v3/assets/supplied-20261128/colour-suit-2.webp","colour-suit-3":"v3/assets/supplied-20261128/colour-suit-3.webp","colour-cape-1":"v3/assets/supplied-20261128/colour-cape-1.webp","colour-cape-2":"v3/assets/supplied-20261128/colour-cape-2.webp","colour-cape-3":"v3/assets/supplied-20261128/colour-cape-3.webp","colour-ninja-1":"v3/assets/supplied-20261128/colour-ninja-1.webp","colour-ninja-2":"v3/assets/supplied-20261128/colour-ninja-2.webp","colour-ninja-3":"v3/assets/supplied-20261128/colour-ninja-3.webp","colour-spacesuit-1":"v3/assets/supplied-20261128/colour-spacesuit-1.webp","colour-spacesuit-2":"v3/assets/supplied-20261128/colour-spacesuit-2.webp","colour-spacesuit-3":"v3/assets/supplied-20261128/colour-spacesuit-3.webp"});
const suppliedFile=name=>window.V3SuppliedArtworkFiles?.[name]||suppliedFiles[name];
function suppliedImage(name,cls='',alt=''){return suppliedFiles[name]?`<img class="${cls}" data-supplied-art="${name}" src="${suppliedFile(name)}" alt="${esc(alt)}" draggable="false" decoding="async">`:'';}
function wardrobeName(item,s={}){return V3Engine.colourOf(s,item.id)?.id||item.id;}
// The supplied hats include a view into their opening. Keep that rear surface
// behind the explorer and let the original head show through the front opening.
const hatFrontBrims=Object.freeze({
 cap:[92,74],helmet:[84,74],hardhat:[80,68],
 crown:[84,75],wizardhat:[84,75],tophat:[86,78]
});
function hatOpeningMask(id){
 const [edge,centre]=hatFrontBrims[id];
 // The lower opening and its rear rim belong to the rear layer. Retain only
 // the upper/front surface, following the brim curve instead of drawing a ring.
 const front=`M0 0H100V${edge}C84 ${edge} 70 ${centre} 50 ${centre}S16 ${edge} 0 ${edge}Z`;
 const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" preserveAspectRatio="none"><path fill="white" d="${front}"/></svg>`;
 return 'data:image/svg+xml,'+encodeURIComponent(svg).replaceAll("'",'%27');
}
function headDrop(s){
 const equipped=V3Engine.normaliseEquipment(s.equipped,C.catalog);
 return 0;
}
function layeredHat(item,name,x,y,w,h){
 const geometry=`left:${x}%;top:${y}%;width:${w}%;height:${h}%;`;
 const mask=hatOpeningMask(item.id);
 return `<span class="avatar-hat-back" data-hat-layer="back" data-hat-for="${item.id}" aria-hidden="true" style="${geometry}z-index:1;background-image:url('${suppliedFile(name)}')"></span><span class="avatar-attachment supplied-attachment" data-hat-layer="front" data-hat-for="${item.id}" data-worn="${item.id}" data-attachment="${item.id}" data-attachment-category="headwear" data-anchor="head" style="${geometry}z-index:7;mask-image:url('${mask}');-webkit-mask-image:url('${mask}');mask-size:100% 100%;-webkit-mask-size:100% 100%">${suppliedImage(name,'supplied-wearable')}</span>`;
}

// Front necklines retain measured centres. Per-outfit head heights follow owner review.
const headHeights=Object.freeze({boy:{jacket:-1.6,hoodie:-.6,armour:-1.6,cape:-1.6,spacesuit:-.2,ninja:-2.4},girl:{armour:-1.4,cape:-1.4,ninja:-2.7,suit:1}});
const headHeight=(character,outfit)=>headHeights[character]?.[outfit?.id]||0;
const nativeFaceX=Object.freeze({boy:48.926685675,girl:48.906248769});
const collarCentres=Object.freeze({"colour-armour-1":0.49862030905077265,"colour-armour-2":0.49750415973377704,"colour-armour-3":0.4975206611570248,"colour-hoodie-1":0.5020736132711249,"colour-hoodie-2":0.5018172377985461,"colour-hoodie-3":0.5015625,"colour-jacket-1":0.5033444816053512,"colour-jacket-2":0.5027917364600781,"colour-jacket-3":0.5011148272017838,"colour-suit-1":0.49921875,"colour-suit-2":0.49921996879875197,"colour-suit-3":0.4984399375975039,"colour-cape-1":0.5157684630738523,"colour-cape-2":0.5127897681854517,"colour-cape-3":0.5147527910685805,"colour-ninja-1":0.49869587897756906,"colour-ninja-2":0.49973958333333335,"colour-ninja-3":0.49895833333333334,"colour-spacesuit-1":0.5023328149300156,"colour-spacesuit-2":0.500260010400416,"colour-spacesuit-3":0.5083073727933541});
const frontNecklines=Object.freeze({
 hoodie:{front:.14,edge:.08,mouth:.15,shape:'v'},
 jacket:{front:.12,edge:.05,mouth:.14},
 armour:{front:.12,edge:.04,mouth:.15},
 suit:{front:.075,edge:.015,mouth:.11},
 cape:{front:.11,edge:.04,mouth:.11},
 spacesuit:{front:.095,edge:.04,mouth:.14},
 ninja:{front:.15,edge:.04,mouth:.15,shape:'v'}
});
const faceCentre=character=>character==='girl'?nativeFaceX.girl:nativeFaceX.boy;
function outfitFrontMask(name,item){
 const f=frontNecklines[item.id],cx=(collarCentres[name]||.5)*100,l=cx-f.mouth*100,r=cx+f.mouth*100,edge=f.edge*100,front=f.front*100;
 const notch=f.shape==='v'?`L${cx} ${front}L${r} ${edge}`:`C${l+3} ${front} ${cx-3} ${front} ${cx} ${front}S${r-3} ${front} ${r} ${edge}`;
 const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" preserveAspectRatio="none"><path fill="white" d="M0 ${edge}H${l}${notch}H100V100H0Z"/></svg>`;
 return 'data:image/svg+xml,'+encodeURIComponent(svg).replaceAll("'",'%27');
}
function frontOutfit(item,name,s){
 const character=s.settings?.avatarCharacter==='girl'?'girl':'boy',f=frontNecklines[item.id],w=item.id==='cape'?58:item.id==='armour'?43:44,h=56/(1-f.front),y=86-h,x=faceCentre(character)-w*(collarCentres[name]||.5),mask=outfitFrontMask(name,item);
 return `<span class="avatar-attachment supplied-attachment outfit-front" data-worn="${item.id}" data-attachment="${item.id}" data-attachment-category="outfit" data-anchor="body" data-front-neckline="30" style="left:${x}%;top:${y}%;width:${w}%;height:${h}%;z-index:4;mask-image:url('${mask}');-webkit-mask-image:url('${mask}');mask-size:100% 100%;-webkit-mask-size:100% 100%">${suppliedImage(name,'supplied-wearable')}</span>`;
}
function nativeNeck(character,adjust=0){
 const crop=character==='girl'?[464,330,541,370]:[452,330,539,370],[l,t,r,b]=crop,w=r-l,h=b-t;
 return `<span class="avatar-neck-bridge avatar-neck" data-native-neck="${character}" style="left:${faceCentre(character)-6.75}%;top:${26.4+adjust}%;width:13.5%;height:${4.1-adjust}%;z-index:3"><span class="native-neck-source" style="background-image:url('${R.file(character==='girl'?'avatar-girl':'avatar-base')}');background-size:${1024/w*100}% ${1536/h*100}%;background-position:${l/(1024-w)*100}% ${t/(1536-h)*100}%"></span></span>`;
}

function suppliedWorn(item,s){
 const name=wardrobeName(item,s);if(!suppliedFiles[name])return '';
 const category=fits[item.id].category;
 let x,y,w,h,z;
 if(category==='outfit')return frontOutfit(item,name,s);
 else if(category==='headwear'){w=({helmet:26,cap:25,crown:25,wizardhat:27,hardhat:26,headphones:26,tophat:27})[item.id];h=({cap:17.6,crown:17.6,helmet:16.5,wizardhat:19,hardhat:17.4,headphones:18.5,tophat:18.1})[item.id]*w/(item.id==='headphones'?29:30);x=49-w/2;y=18.8-h+headDrop(s);return layeredHat(item,name,x,y,w,h);}
 else if(category==='face'){w=21;h=6.8;x=49-w/2;y=17+headDrop(s);z=8;}
 else if(category==='back'){w=70;h=51.4;x=49-w/2;y=20;z=1;}
 else {w=34;h=30;x=65;y=68;z=9;}
 return `<span class="avatar-attachment supplied-attachment" data-worn="${item.id}" data-attachment="${item.id}" data-attachment-category="${category}" data-anchor="${categories[category].anchor}" style="left:${x}%;top:${y}%;width:${w}%;height:${h}%;z-index:${z}">${suppliedImage(name,'supplied-wearable')}</span>`;
}
A.suppliedImage=suppliedImage;
A.colourArt=c=>suppliedImage(c.id,'wardrobe-colour-image');
A.decorationArt=id=>suppliedImage(({'deco-plant':'base-camp-plant-pot','deco-birdbox':'base-camp-bird-box','deco-lantern':'base-camp-lantern-post'})[id]||'base-camp-'+id.replace('deco-',''),'decoration-image');
A.townProjectArt=(id,done)=>suppliedImage(({bench:'town-park-bench-'+(done?'finished-draft':'being-built-draft'),library:'town-library-books-'+(done?'finished':'being-stocked'),playground:'town-playground-'+(done?'finished':'being-built')})[id],'town-project-image');

function gear(item,cls=''){const supplied=suppliedImage(wardrobeName(item,window.V7Avatar?.state||{}),'supplied-item-image');if(supplied)return supplied;const group=groups[item.slot];return group?sprite(group[0],group[1].indexOf(item.id),cls,`data-worn="${item.id}"`):'';}
// Anchors are percentages of the shared 2:3 canvas. The base is inset 6% / 8%
// at 88% size, reserving hat headroom without changing character proportions.
const anchors=Object.freeze({head:[49,20],face:[49,21],neck:[49,29],body:[49,29],back:[49,29],wrist:[67.5,53.3],hands:[49,59],leftHand:[30,59],rightHand:[69,59],hand:[68,57],feet:[49,95],companion:[79,98],hair:[49,8]});
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
 helmet:{category:'headwear',width:26,dy:-.5},cap:{category:'headwear',width:25},crown:{category:'headwear',width:25},wizardhat:{category:'headwear',width:27},hardhat:{category:'headwear',width:26,dy:-.5},headphones:{category:'headwear',width:26,dy:5},tophat:{category:'headwear',width:29},
 jacket:{category:'outfit',width:44},hoodie:{category:'outfit',width:44},armour:{category:'outfit',width:45},suit:{category:'outfit',width:44},cape:{category:'outfit',width:53},spacesuit:{category:'outfit',width:46},ninja:{category:'outfit',width:44},
 wings:{category:'back',width:62,dx:-2,dy:-17},jetpack:{category:'back',width:33,dx:10},rucksack:{category:'back',width:34,dx:8,dy:-4},shield:{category:'back',width:31,dx:11,dy:-2},parachute:{category:'back',width:34,dx:-11,dy:-2},dragon:{category:'back',width:22,dx:20,dy:-7},
 glasses:{category:'face'},medal:{category:'neck',width:14},watch:{category:'wrist',width:5.3,height:5.5,rotation:78},scarf:{category:'neck',width:22,height:14,dy:-2},gloves:{category:'hands'},sword:{category:'handheld',width:13,pivot:[.49,.77],rotation:-12},wand:{category:'handheld',width:9,pivot:[.48,.73],rotation:12},
 fox:{category:'companion'},dog:{category:'companion'},cat:{category:'companion'},frog:{category:'companion'},robot:{category:'companion'},axolotl:{category:'companion'},bee:{category:'companion'}
});
function source(sheet,index,crop){const square=['wear-hair','wear-companions'].includes(sheet),faces=sheet==='wear-faces',sw=faces?2172:square?1774:1536,sh=faces?724:square?887:1024,cw=sw/4,ch=faces?sh:sh/2,[x,y,r,b]=crop,w=r-x,h=b-y;
 return `<span class="equipment-source" data-source-crop="${crop.join(',')}" style="background-image:url('${R.file(sheet)}');background-size:${sw/w*100}% ${sh/h*100}%;background-position:${(index%4*cw+x)/(sw-w)*100}% ${(Math.floor(index/4)*ch+y)/(sh-h)*100}%"></span>`;
}
// The hat pivot follows the visible front brim (75% of the crop), not the rear opening.
function attachment(id,sheet,index,fit,crop=crops[sheet][index]){const rule={...categories[fit.category],...fit},[x,y]=anchors[rule.anchor],w=rule.width,h=rule.height??w*(crop[3]-crop[1])/(crop[2]-crop[0])*2/3,[px,py]=rule.pivot,frontBrim=fit.category==='headwear'&&id!=='headphones'?h*.25:0;
 return `<span class="avatar-attachment" data-worn="${id}" data-attachment="${id}" data-attachment-category="${fit.category}" data-anchor="${rule.anchor}" style="left:${x+(rule.dx||0)-w*px}%;top:${y+(rule.dy||0)+frontBrim-h*py}%;width:${w}%;height:${h}%;z-index:${rule.z};transform:rotate(${rule.rotation||0}deg);transform-origin:${px*100}% ${py*100}%">${source(sheet,index,crop)}</span>`;
}
function worn(item,s={}){const supplied=suppliedWorn(item,s);if(supplied)return supplied;const group=groups[item.slot];
 if(item.id==='gloves')return attachment('gloves',group[0],4,{category:'hands',anchor:'leftHand',rotation:180},[225,87,379,416])+attachment('gloves',group[0],4,{category:'hands',anchor:'rightHand',rotation:180},[37,87,201,416]);
 // Exclude the atlas' detached collar/hood. Join shoulder and leg crops at the waist.
 if(['jacket','hoodie','suit','cape','spacesuit','ninja'].includes(item.id)){const index=group[1].indexOf(item.id),crop=crops[group[0]][index];return attachment(item.id,group[0],index,{...fits[item.id],height:26},[crop[0],({jacket:82,hoodie:105,suit:85,cape:87,spacesuit:88,ninja:90})[item.id],crop[2],270])+attachment(item.id,group[0],index,{...fits[item.id],height:31,dy:26},[crop[0],270,crop[2],crop[3]]);}
 return attachment(item.id,group[0],group[1].indexOf(item.id),fits[item.id]);
}
function expression(face){return `<span class="avatar-expression" data-face-region="inner-face" aria-hidden="true">${source('wear-faces',face,[135,350,428,575])}</span>`;}
function footwear(shoes){return R.img('avatar-base','avatar-base avatar-upgrade-shoes footwear-'+shoes).replace('<img','<img data-footwear-facing="front" data-sole-geometry="starter"');}

function render(s={},inline=false){const equipped=V3Engine.normaliseEquipment(s.equipped,C.catalog),items=C.catalog.filter(i=>isActiveItem(i)&&(s.bought||[]).includes(i.id)&&equipped.includes(i.id)),by=slot=>items.find(i=>i.slot===slot),back=by('Back items'),bg=by('Backgrounds'),head=by('Headwear'),outfit=by('Outfits'),acc=by('Accessories'),pet=by('Companions');// Legacy appearance values are ignored at render time, never rewritten in saved JSON.
const hair=0,face=0,shoes=0,character=s.settings?.avatarCharacter==='girl'?'girl':'boy',adjust=headHeight(character,outfit),base=cls=>R.img(character==='girl'?'avatar-girl':'avatar-base',cls);
 return `<span class="explorer layered-explorer ${inline?'inline-explorer':''} ${hair?'changed-hair':''} ${outfit?'has-outfit':''} ${head&&head.id!=='headphones'?'has-hat hat-'+head.id:''}" data-avatar-character="${character}" data-head-adjust="${adjust}" style="--outfit-head-top:${8+adjust}%" role="img" aria-label="${character==='girl'?'Girl':'Boy'} explorer wearing ${esc(items.map(i=>i.label).join(', ')||'starter green outfit')}" data-avatar-items="${esc(items.map(i=>i.id).join(' '))}">${bg?(bg.id==='mountainbg'?V6AssetArt.img('rail','avatar-scenery'):R.img(backgrounds[bg.id],'avatar-scenery')):''}${back?worn(back,s):''}${base('avatar-base')}${outfit?['left-hand','right-hand','feet'].map(part=>base('avatar-base avatar-skin avatar-'+part)).join('')+nativeNeck(character,adjust)+worn(outfit,s):''}${hair?`<span class="avatar-forehead" aria-hidden="true">${source('wear-faces',0,[170,445,250,495])}</span>`:''}${face||hair?expression(face):''}${hair?attachment('hair-'+hair,'wear-hair',hair,{category:'hair'}):''}${shoes?footwear(shoes):''}${head?worn(head,s):''}${acc?worn(acc,s):''}${['sword','wand'].includes(acc?.id)?base('avatar-base avatar-skin avatar-right-hand avatar-grip'):''}${pet?worn(pet,s):''}</span>`;
}
A.explorer=render;
A.icon=id=>{id=typeof id==='object'?id.id:id;const item=C.catalog.find(i=>i.id===id);if(!item)return oldIcon(id);if(item.slot==='Backgrounds'){return `<span class="item-art">${id==='mountainbg'?V6AssetArt.img('rail'):R.img(backgrounds[id])}</span>`;}return `<span class="item-art">${gear(item,'item-sprite')}</span>`;};
const guides={Rowan:0,Saff:0,Finn:1,Kit:1,Marin:3,Ada:2,Nova:1,Flint:5,Ellis:6,Jess:2,Sam:3};A.guide=name=>`<span class="illustrated-guide" role="img" aria-label="${esc(name)}, your adult guide">${sprite('helpers',guides[name]??0)}</span>`;
function controls(s={}){return `<section class="avatar-features" aria-label="Character appearance"><label for="explorer-character">Your main character<select id="explorer-character" data-character-choice><option value="boy" ${s.settings?.avatarCharacter!=='girl'?'selected':''}>Boy explorer · original</option><option value="girl" ${s.settings?.avatarCharacter==='girl'?'selected':''}>Girl explorer</option></select></label><p class="small">Both explorers use the same earned equipment. Changing character keeps your coins, purchases and adventures.</p></section>`;}
const oldProduct=A.product;
A.product=(name,i)=>{
 if(/spaghetti|pasta|tomato|mince/i.test(name))return oldProduct(name,i);
 const food=[/^(?!.*coconut).*milk/i,/cheese/i,/apple|fruit/i,/bread/i,/oats/i,/rice/i,/flour/i,/chickpea/i,/coconut/i,/pepper/i,/carrot/i,/lentil/i,/banana/i,/juice/i,/chocolate(?!.*biscuit)/i,/fizzy/i];
 const supplies=[/sandwich/i,/pizza/i,/rolls/i,/wrap/i,/biscuit/i,/stock.*cube/i,/paper.*cup/i,/folder/i,/notebook/i,/pencil/i,/ticket/i,/towel/i,/locker.*token/i,/bag/i,/box/i,/coffee|tea|cappuccino|latte/i];
 let index=food.findIndex(re=>re.test(name)),sheet='products-food';if(index<0){index=supplies.findIndex(re=>re.test(name));sheet='products-supplies';}if(index<0){index=14;sheet='products-supplies';}
 return `<span class="ingredient-prop product-atlas" role="img" aria-label="${esc(name)}" style="background-image:url('${R.file(sheet)}');background-position:${index%4*100/3}% ${Math.floor(index/4)*100/3}%"></span>`;
};
// Recipe-only asset selection. Ordinary Town/world products keep their original
// renderer; stored ingredient labels and mathematical quantities are untouched.
const recipeImages={pasta:'pasta',spaghetti:'spaghetti','ripe tomatoes':'fresh-tomatoes','fresh tomatoes':'fresh-tomatoes',tomatoes:'fresh-tomatoes','chopped tomatoes':'tinned-chopped-tomatoes',basil:'fresh-basil','fresh basil':'fresh-basil','olive oil':'olive-oil','chickpeas, drained':'chickpeas-tin',chickpeas:'chickpeas-tin','coconut milk':'coconut-milk','dry basmati rice':'basmati-rice','basmati rice':'basmati-rice',rice:'basmati-rice','ground cumin':'ground-cumin',turmeric:'turmeric',flatbreads:'flatbreads',passata:'passata','spinach, thawed and drained':'spinach',spinach:'spinach',pepper:'red-pepper',peppers:'red-pepper','red pepper':'red-pepper',mozzarella:'mozzarella',carrots:'carrots','red lentils':'red-lentils',lentils:'red-lentils',onion:'onion',garlic:'garlic','vegetable stock cubes':'vegetable-stock',stock:'vegetable-stock','rolled oats':'rolled-oats','oat milk':'oat-milk',eggs:'eggs',bananas:'bananas','baking powder':'baking-powder','cooking oil':'cooking-oil'};
A.recipeAsset=name=>{const label=String(name).toLowerCase(),key=label.split(' · ')[0].trim(),file=/^tomatoes?\s*·.*tin/.test(label)?'tinned-chopped-tomatoes':recipeImages[key];return file?(window.V3IngredientFiles?.[file]||'v3/assets/ingredients/served/'+file+'.webp'):null;};
A.recipeProduct=(name,i=0)=>{const file=A.recipeAsset(name);return file?`<span class="ingredient-prop recipe-ingredient-prop" role="img" aria-label="${esc(name)}"><img class="recipe-ingredient-image" src="${file}" alt="" draggable="false" decoding="async" loading="lazy" width="512" height="512"></span>`:A.product(name,i);};
window.V7Avatar={render,controls,isActiveItem,retiredItems,sprite,groups,backgrounds,anchors,categories,fits,state:{},setState(s){this.state=s;}};
})();
