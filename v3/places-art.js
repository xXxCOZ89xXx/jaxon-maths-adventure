/* Original Town architecture and additive camp estates. No external assets or render loop. */
(function () {
  "use strict";
  const A=window.V3Art, M=window.V3Adventure, T=window.V3Town;
  const {at,poly,block,pine,lamp,house,gear,miniExplorer}=A.primitives, esc=A.esc;
  const plots=[
    {id:"market",x:600,y:250},{id:"cafe",x:360,y:370},
    {id:"bank",x:840,y:370},{id:"shops",x:1080,y:490},
    {id:"station",x:120,y:490},{id:"home",x:360,y:610},
    {id:"leisure",x:840,y:610},{id:"work",x:600,y:730},
  ];
  const labels=["Supermarket","Corner Café","Bank","Shopping Centre","Bus & Train","Neighbourhood Home","Cinema & Leisure","Workshop"];
  const glass="#a9d3cf", light="#f3df9b", ink="#294b4e";
  function panel(x,y,w,h,fill,slope=.45,extra="") {
    return poly(`M${x} ${y}l${w} ${w*slope}v${h}l${-w} ${-w*slope}Z`,fill,extra);
  }
  function windowRow(x,y,n,w=13,h=24,lit=true) {
    return Array.from({length:n},(_,i)=>panel(x+i*(w+7),y+i*(w+7)*.45,w,h,lit?glass:"#79938e")+'').join("");
  }
  function label(text,y=80,w=210) {
    return `<rect x="${-w/2}" y="${y}" width="${w}" height="27" rx="5" fill="#fcf0d2" stroke="#9da989"/><text x="0" y="${y+18}" text-anchor="middle" fill="#254538" font-family="system-ui" font-size="13" font-weight="750">${esc(text)}</text>`;
  }
  function bench(x,y,k=1) {
    return at(x,y,block(0,0,24,11,17,"#816947","#c6a46d")+'<path d="M-24-18v-15l48 22v15M-17 10v12m34-7v12" fill="none" stroke="#496154" stroke-width="4"/>',k);
  }
  function flowers(x,y) {
    return at(x,y,block(0,0,18,9,12,"#a57f57","#65865a")+'<path d="M-9-19v-14m17 20v-13" stroke="#587d4e" stroke-width="3"/><circle cx="-9" cy="-33" r="5" fill="#dab482"/><circle cx="8" cy="-26" r="5" fill="#c58d99"/>');
  }
  function car(x,y,bus=false) {
    return at(x,y,block(0,0,bus?46:30,14,bus?35:20,bus?"#d4b76f":"#759a98",bus?"#edd89c":"#b6cfc0")+windowRow(bus?-38:-22,bus?-34:-20,bus?4:2,10,10)+`<circle cx="-${bus?29:19}" cy="13" r="7" fill="${ink}"/><circle cx="${bus?29:19}" cy="13" r="7" fill="${ink}"/>`);
  }
  function venue(x,y,i,lit=true,k=1,sign=true) {
    const g=lit?glass:"#879e97";
    let b=block(0,18,i===3?113:99,50,5,"#8e9e8d","#cbd0bd");
    if(i===0) { // Supermarket: low, broad commercial footprint and service yard.
      b+=block(0,0,104,39,57,"#b4ad90","#dce0ce")+block(-2,-54,100,37,7,"#547c68","#87a68a");
      b+=panel(-92,-49,76,39,g)+panel(9,-22,45,32,g,-.45)+panel(-13,-14,24,36,"#507e77");
      b+='<path d="M-53-29v35m23-25v35M-1-6v30" stroke="#e7e7c9" stroke-width="3"/>';
      b+=panel(-98,-62,94,11,"#527862")+panel(52,-32,37,35,"#6c8073",-.45);
      b+=at(84,16,'<path d="M-15-17h27v18h-27zM-13-14h21l-4 10h-17z" fill="none" stroke="#547b74" stroke-width="3"/><circle cx="-9" cy="5" r="3" fill="#365457"/><circle cx="6" cy="5" r="3" fill="#365457"/>');
      b+=car(-101,48)+block(99,-10,17,10,17,"#a08357","#d4b579")+'<path d="M-126 58l41 19m-7-36l41 19" stroke="#f1ebce" stroke-width="3"/>';
    } else if(i===1) { // Corner café: tall glazing, striped awning, terrace and menu.
      b+=block(0,0,57,34,83,"#ba8e70","#dbc6a0")+poly("M-62-83L0-119L62-83L0-49Z","#4e7465");
      b+=windowRow(-48,-69,2,17,36)+panel(10,-44,31,45,g,-.45);
      b+=poly("M-61-48L1-20L-12-2L-75-31Z","#edddae");
      for(let n=0;n<5;n++)b+=poly(`M${-60+n*13} ${-48+n*6}l7 3-13 18-7-3Z`,"#ac7865");
      b+=bench(-76,27,.8)+bench(65,43,.8)+flowers(-86,-2)+flowers(77,-5);
      b+=at(17,58,'<path d="M-14 0l5-35h24L21 4M-9-35h24v28H-9Z" stroke="#8c7351" stroke-width="3" fill="#37594e"/><path d="M-4-28h14m-14 7h11m-11 7h13" stroke="#e5d7ae" stroke-width="2"/>');
    } else if(i===2) { // Bank: stone portico, pediment, steps, vault-like entrance and ATM.
      b+=block(0,0,77,36,100,"#a5b2ab","#d9ddc9")+block(-8,16,77,34,12,"#9ca89d","#dce0cd")+block(-10,25,84,37,7,"#9aa494","#dce0cc");
      b+=panel(-67,-82,61,71,"#768d87");
      for(let n=0;n<4;n++)b+=panel(-68+n*20,-78+n*9,8,65,"#e0dfc6");
      b+=poly("M-87-98L-43-130L7-55L-4-48Z","#dddcc4")+panel(-82,-100,79,12,"#c3caba");
      b+=panel(7,-55,29,68,"#365b58",-.45)+panel(45,-65,22,34,"#5e7773",-.45)+panel(49,-59,14,12,"#bed7b3",-.45);
      b+='<path d="M53-33l12-5" stroke="#decf9e" stroke-width="4"/><path d="M51-39l3-1m3-1l3-1m-9 6l3-1m3-1l3-1" stroke="#d8d9b5" stroke-width="2"/>';
    } else if(i===3) { // Shopping complex: several departments around a glazed atrium.
      b+=block(-37,0,72,34,88,"#b99791","#dfccba")+block(58,10,60,31,66,"#aeb2a0","#e1dbc0")+block(15,-29,36,24,91,"#8cb0ac","#c7e2cf");
      b+=windowRow(-99,-72,4,17,35)+windowRow(9,-40,4,13,31)+panel(-12,-47,40,74,g);
      b+='<path d="M-100-29l73 33M11-1l85 38" stroke="#d7ae78" stroke-width="9"/><path d="M2-42v58m14-51v58" stroke="#e2e3c7" stroke-width="3"/>';
      b+=flowers(-91,28)+flowers(94,52);
    } else if(i===4) { // Transport interchange: railway, canopy, station clock, bus shelter.
      b+='<path d="M-130 28l250 112m-250-96l250 112" stroke="#405e62" stroke-width="4"/>';
      for(let n=0;n<9;n++)b+=`<path d="M${-119+n*28} ${32+n*12.5}l-8 13" stroke="#9b8862" stroke-width="5"/>`;
      b+=block(-15,-4,81,25,50,"#a8aa91","#dfd4af")+poly("M-111-54L34-112L96-69L-48-11Z","#5a8278");
      b+='<path d="M-86-35v45m132-61v45" stroke="#527970" stroke-width="5"/><circle cx="-10" cy="-69" r="16" fill="#efe4bd" stroke="#526b60" stroke-width="3"/><path d="M-10-81v12l9 4" fill="none" stroke="#355654" stroke-width="3"/>';
      b+=panel(-75,-28,25,23,"#405d58")+panel(-34,-14,19,31,g)+car(58,65,true);
      b+=at(84,-16,'<path d="M-22 19v-44h44v44M-27-25h54v6h-54" stroke="#5e827b" stroke-width="4" fill="#bcd5ca"/><path d="M-16-10h20m-20 7h20" stroke="#5f817a" stroke-width="3"/>');
    } else if(i===5) { // Two-storey home with domestic garden, drive, chimney and porch.
      b+=block(0,0,60,35,116,"#c7a57d","#e3cfaa")+poly("M-70-116L-4-169L70-116L0-81Z","#786b5a")+poly("M-4-169L70-116L0-81Z","#4b665e");
      b+=block(30,-124,10,7,34,"#a88465","#d0b58b")+windowRow(-48,-101,2,17,27)+windowRow(-48,-54,2,17,27);
      b+=panel(9,-82,27,25,g,-.45)+panel(9,-31,24,46,"#4e7963",-.45)+poly("M-9-35L24-54L56-38L22-20Z","#d4c29b");
      b+=car(-85,41)+flowers(66,44)+block(76,-5,29,15,6,"#64855e","#94b477")+'<path d="M55 33v-13l45-20v13m-35-4v11m14-17v11" fill="none" stroke="#e1d4ad" stroke-width="4"/>';
    } else if(i===6) { // Cinema marquee and a separate sports annex.
      b+=block(-25,0,76,38,101,"#756d8e","#b9b3bc")+block(72,23,48,29,66,"#799e9b","#c4d6c5");
      b+=panel(-86,-83,24,39,"#d5b478")+panel(-49,-66,24,39,"#8fada9")+panel(-22,-31,45,55,g)+'<path d="M-82-76l15 7v26l-15-7zM-45-59l15 7v26l-15-7z" fill="#56716d"/><path d="M-80-72v22m13-16v22m24-11v22m13-16v22" stroke="#e2d5b0" stroke-width="2" stroke-dasharray="2 5"/>';
      b+=poly("M-92-32L26 21L50 2L-68-51Z","#e5c27f")+panel(-91,-32,116,17,"#b58a5d");
      b+='<path d="M-83-23l100 45" stroke="#f7e4a6" stroke-width="4" stroke-dasharray="3 8"/>';
      b+=panel(39,-32,57,24,g)+at(104,53,'<path d="M-14-17h28v30h-28z" fill="#7d9b75"/><circle cx="0" cy="-3" r="10" fill="none" stroke="#e9d9a8" stroke-width="2"/>');
    } else { // Industrial sawtooth roof, roller doors, loading, safety bollards.
      b+=block(0,0,98,38,77,"#8e9b94","#c5cbb7");
      for(let n=0;n<3;n++)b+=poly(`M${-98+n*60} ${-77+n*2}l26-35 36 33-28 16Z`,n%2?"#9abeb4":"#668a80");
      b+=panel(-83,-62,55,55,"#627e75")+panel(7,-29,44,48,"#5a756d",-.45);
      for(let n=0;n<6;n++)b+=`<path d="M-80 ${-52+n*7}l48 22" stroke="#a2b4a2" stroke-width="2"/>`;
      b+=gear(52,-65,lit,.7)+block(88,20,23,14,22,"#a98e60","#dac593");
      b+='<path d="M-44 31v-16m38 31V30m57-12v16" stroke="#e0bc69" stroke-width="6"/><path d="M-43 21l36 16" stroke="#526a5b" stroke-width="4" stroke-dasharray="5 5"/>';
      b+=panel(60,-43,15,21,"#c6d9b5",-.45);
    }
    b+=sign?label(labels[i],i===4?120:93,i===5?224:210):"";
    return at(x,y,b,k);
  }
  function townScene(level=0,settled=0,done=[]) {
    const venues=plots.map((p,i)=>({...p,i})).sort((a,b)=>a.y-b.y || a.x-b.x);
    const streets="M360 250L1080 610M120 370L840 730M840 250L120 610M1080 370L360 730";
    const crossings=[at(590,410,'<path d="M-23-11l40 20m-47-9l40 20m-47-9l40 20" stroke="#f5edce" stroke-width="5"/>'),at(480,536,'<path d="M-23-11l40-20m-33 31l40-20m-33 31l40-20" stroke="#f5edce" stroke-width="5"/>')].join("");
    return `<svg class="world-scene town-scene" viewBox="0 0 1200 900" role="img" aria-label="Practical Maths Town: eight distinct buildings, roads, crossings and gardens"><rect width="1200" height="900" fill="#aac8b5"/><path d="M0 151l130-72 139 77 189-95 183 88 176-75 198 90 185-92v828H0Z" fill="#6e9984" opacity=".4"/>${block(600,490,592,310,30,"#6f8e73","#a2b38b",false)}<path d="${streets}" fill="none" stroke="#d6d8be" stroke-width="41"/><path d="${streets}" fill="none" stroke="#6d8980" stroke-width="25"/><path d="${streets}" fill="none" stroke="#dedcc0" stroke-width="2" stroke-dasharray="12 18"/>${crossings}${flowers(565,512)}${bench(651,510)}${lamp(572,486,true)}${[0,1,2,3].map(i=>pine([65,1135,160,1025][i],[370,370,716,745][i],.6,"#558568")).join("")}${venues.map(p=>venue(p.x,p.y,p.i,level>0 || done.includes(p.id),.86)).join("")}${at(550,550,miniExplorer(),.7)}${at(742,467,miniExplorer(),.55)}<path d="M45 842h1110" stroke="#66866a"/><text x="600" y="875" text-anchor="middle" font-family="system-ui" font-size="17" fill="#284e3d">Walk the High Street · every place is open to explore</text></svg>`;
  }
  function exterior(id) {
    const i=Math.max(0,T.venues.findIndex(v=>v.id===id));
    return `<svg class="world-scene exterior-scene" viewBox="0 0 900 600" role="img" aria-label="${esc(T.venues[i].name)} exterior: original purpose-built architecture"><rect width="900" height="600" fill="#b6cdb8"/><path d="M0 190l190-95 220 110 225-111 265 128v378H0Z" fill="#88a68a" opacity=".5"/>${block(450,375,360,166,25,"#779077","#b8c3a1",false)}<path d="M92 432l480 207" stroke="#e0ddbd" stroke-width="50"/><path d="M92 432l480 207" stroke="#789087" stroke-width="31"/>${pine(165,320,.95)}${venue(450,366,i,true,1.62)}${lamp(709,397,true)}${at(657,456,miniExplorer(),1.1)}</svg>`;
  }
  const interiorFeatures=[
    "Shelves · baskets · checkout · tills", "Tables · food counter · orders · till",
    "Account screens · counters · vault · cash machine", "Departments · sale displays · comparison desk",
    "Platforms · railway · bus shelter · tickets · timetables", "Kitchen · utility meters · household planning",
    "Cinema screen · seating · ticket desk · sports annex", "Workbenches · machinery · clock-in · timesheets",
  ];
  function counter(x,y,w=56,fill="#a58c63") {
    return block(x,y,w,23,43,fill,"#dfd0a4");
  }
  function till(x,y) {
    return at(x,y,block(0,0,17,10,9,"#68877b","#bdd0ae")+'<path d="M-12-10v-25h26v25Z" fill="#4c6e65"/><path d="M-8-31h18v14H-8Z" fill="#b8d0ae"/>');
  }
  function roomText(x,y,text,size=14,color="#294d40") {
    return `<text x="${x}" y="${y}" text-anchor="middle" font-family="system-ui" font-size="${size}" font-weight="650" fill="${color}">${esc(text)}</text>`;
  }
  function location(id,q=null) {
    const i=Math.max(0,T.venues.findIndex(v=>v.id===id)),v=q?.values || {};
    let objects="", readout="";
    if(i===0) {
      for(let row=0;row<3;row++) {
        const x=260+row*145,y=326+row*22;
        objects+=block(x,y,49,22,92,"#8b9c7b","#c0c8a0")+panel(x-43,y-84,83,78,"#587456");
        for(let shelf=0;shelf<4;shelf++)objects+=panel(x-45,y-88+shelf*26,88,5,"#d2c8a1");
        for(let shelf=0;shelf<3;shelf++)for(let n=0;n<4;n++)
          objects+=panel(x-41+n*20,y-82+shelf*24+n*9,12,16,["#c09262","#afc5b1","#d4b577","#93aa7d"][n]);
      }
      objects+=counter(571,455,99,"#86a594")+till(590,410)+block(318,440,34,20,25,"#a68a5c","#d9c18c");
      const count=Math.min(12,(v.parts||[]).reduce((a,b)=>a+b,0));
      for(let n=0;n<count;n++)objects+=at(299+n%4*10,409-Math.floor(n/4)*13,poly("M0-5h9v10H0Z",["#b77b52","#bdd3be","#d6b174"][n%3]));
      readout=`Your basket · ${count} selected items`;
    } else if(i===1) {
      objects+=counter(324,327,137,"#b28d71")+till(410,309);
      for(const [x,y] of [[314,421],[481,434],[627,387]])objects+=block(x,y,32,19,30,"#a38b63","#e3cfa0")+bench(x-52,y+15,.65)+bench(x+47,y+24,.65)+at(x,y-31,'<ellipse rx="11" ry="5" fill="#f2e5bc"/><path d="M-6-9h12v9H-6z" fill="#b6815d"/>');
      objects+=flowers(195,357)+panel(552,197,105,59,"#375c50",-.45)+roomText(599,221,"TODAY’S MENU",13,"#f3e5bc");
      readout="Orders are fictional · prepare your plan at the counter";
    } else if(i===2) {
      objects+=counter(333,356,145,"#a1ada0")+till(315,307)+till(430,352);
      objects+='<path d="M526 190h168v142H526z" fill="#8d9e99" stroke="#57736d" stroke-width="7"/><circle cx="610" cy="261" r="53" fill="#aebdb2" stroke="#5e7c74" stroke-width="8"/><path d="M575 261h70m-35-35v70" stroke="#617f75" stroke-width="7"/><circle cx="610" cy="261" r="17" fill="#dfd5aa"/>';
      objects+=panel(186,229,50,72,"#57776c")+panel(195,240,31,24,"#c3d7ae")+counter(580,448,60,"#9aa99b");
      readout="Fictional account plan · "+T.money(v.amount||0);
    } else if(i===3) {
      for(let n=0;n<3;n++) {
        const x=223+n*160,y=290+n*22;
        objects+=block(x,y,62,25,88,["#a78b8b","#92a997","#ab9c79"][n],"#e1d8b6")+panel(x-52,y-74,102,55,glass)+panel(x-56,y-87,113,14,["#92757d","#678577","#ad8c57"][n]);
        objects+=roomText(x,y-40,["STYLE","OUTDOORS","HOME"][n],12);
      }
      objects+=counter(527,460,104,"#9f9b7d")+till(579,421)+bench(280,449);
      readout="Sale label plan · "+T.money(v.amount||0);
    } else if(i===4) {
      objects+='<path d="M150 412l580 109m-580-89l580 109" stroke="#587577" stroke-width="7"/>';
      for(let n=0;n<15;n++)objects+=`<path d="M${163+n*38} ${421+n*7}l-5 16" stroke="#a28b62" stroke-width="6"/>`;
      objects+=at(488,424,car(0,0,true),1.8)+counter(309,301,68,"#87a29a")+till(280,263);
      objects+=panel(510,178,110,75,"#365b54",-.45)+roomText(562,185,"DEPARTURES",13,"#efdfb2")+roomText(562,210,"BUS · TRAIN",12,"#dfdfb9");
      objects+='<circle cx="372" cy="170" r="32" fill="#f1e6c1" stroke="#6b8b76" stroke-width="5"/><path d="M372 148v22l16 9" stroke="#355c4f" stroke-width="4" fill="none"/>';
      objects+=bench(664,355,.85);
      readout="Journey planning · no real tickets or fares";
    } else if(i===5) {
      objects+=counter(279,314,105,"#a4ad87")+counter(467,310,64,"#a4ad87");
      objects+=block(264,307,31,19,68,"#bdc4ad","#e7e3ca")+panel(238,254,49,36,"#4e6962")+panel(238,291,49,8,"#c4c9aa");
      objects+='<ellipse cx="430" cy="282" rx="22" ry="10" fill="#8aaba3"/><path d="M430 282v-20q0-12 14-6" stroke="#658d7d" stroke-width="4" fill="none"/>';
      objects+=block(476,439,76,41,34,"#a38b62","#e0c79a")+bench(364,450,.85)+flowers(640,404);
      objects+=panel(582,183,54,58,"#b6bf9e",-.45)+panel(646,151,48,55,"#cbd1b1",-.45)+roomText(610,201,"kWh",16)+roomText(670,173,"WATER",12);
      readout="Household plan · "+(v.amount||0)+" fictional units";
    } else if(i===6) {
      objects+=panel(168,213,244,111,"#344f5c")+panel(179,224,220,83,"#c5d7cb");
      for(let row=0;row<3;row++)for(let n=0;n<5;n++)objects+=block(297+n*34+row*16,349+row*38+n*8,14,10,28,"#986f77","#c49b98");
      objects+=counter(600,437,57,"#9c9274")+till(612,397)+poly("M566 323L682 275L739 304L623 354Z","#8cac8d")+'<path d="M603 318l66-27m-43 47l66-27m-56-11l35 17" stroke="#e9e1bd" stroke-width="3"/>';
      readout="Cinema seats and sports bookings · plan your visit";
    } else {
      objects+=counter(315,343,126,"#a18e6b")+counter(567,448,91,"#829b88")+till(640,414);
      objects+=gear(320,291,true,1.1)+gear(537,345,true,1.45)+block(537,398,61,30,37,"#879f94","#c5d4b4");
      objects+='<path d="M202 221l79 36m-62-29v23m22-13v23m22-13v23" stroke="#668978" stroke-width="6"/><path d="M392 451l129 58" stroke="#d7bc73" stroke-width="11" stroke-dasharray="12 8"/>';
      objects+=panel(594,170,56,64,"#56796a",-.45)+panel(602,178,39,27,"#c5d7ae",-.45)+roomText(624,207,"CLOCK IN",10);
      readout="Shift and wage plan · "+(v.amount||0)+" selected units";
    }
    return `<svg class="world-scene location-scene interior-${esc(id)}" viewBox="0 0 900 560" role="img" aria-label="Inside ${esc(T.venues[i].name)}: ${esc(interiorFeatures[i])}"><rect width="900" height="560" fill="#b8ceba"/><path d="M60 480l390-193 390 193-390 75Z" fill="#6e9278" opacity=".25"/>${block(450,380,330,130,18,"#879d80","#e1d8b8",false)}${poly("M120 362L450 232V82L120 212Z",["#a4b99a","#d4bdac","#b4c3b9","#cbbd9e","#aabfba","#c5c8a5","#c1b5c6","#a6b7a6"][i])}${poly("M450 232L780 362V212L450 82Z","#d5d9be")}${objects}${at(722,453,miniExplorer(),1.1)}${roomText(450,39,T.venues[i].name,24)}${roomText(450,541,readout,16)}</svg>`;
  }
  function roof(w,d,h,color="#4f7364") {
    return poly(`M-${w+8} -${h}L0 -${h+d+26}L${w+8} -${h}L0 ${d-h}Z`,color)+poly(`M0 -${h+d+26}L${w+8} -${h}L0 ${d-h}Z`,"#36594e");
  }
  function residence(stage) {
    if(stage<=2) {
      const w=stage===1?73:103,h=stage===1?115:150;
      return `<g data-estate-part="${stage===1?"starter-tent":"improved-tent"}">${poly(`M-${w} 0L-8 -${h}L${w} 0L5 47Z`,"#d4b06e")}${poly(`M-8 -${h}L${w} 0L5 47Z`,"#a17b4d")}${poly(`M-25 29L-7 -${h-40}L30 32L5 47Z`,"#365d4c")}${stage===2?'<path d="M-110 11l-72-30 36-70 78 33Z" fill="#dcc48d"/><path d="M-181-19v64m71-34v64" stroke="#826b49" stroke-width="6"/>':""}</g>`;
    }
    const w=[0,0,0,113,147,169,191,208,137][stage],d=stage===8?68:stage>=6?88:60,h=stage===8?205:stage===7?191:stage===6?166:stage===5?153:stage===4?142:91;
    const wall=stage>=7?"#c5c5aa":stage>=5?"#b7ad88":"#a3865f";
    let b="";
    if(stage===8) {
      b+=at(-183,27,block(0,0,109,59,150,wall,"#e7dfbf")+roof(109,59,150)+windowRow(-93,-129,6,14,29)+windowRow(-93,-78,6,14,29));
      b+=at(183,27,block(0,0,109,59,150,wall,"#e7dfbf")+roof(109,59,150)+windowRow(-93,-129,6,14,29)+windowRow(-93,-78,6,14,29));
    }
    b+=block(0,0,w,d,h,wall,"#e6d8ad")+roof(w,d,h);
    if(stage<=6)for(let n=0;n<5;n++)b+=`<path d="M-${w-5} ${-h+18+n*17}l${w-10} ${(w-10)*.45}" stroke="#826c4c" stroke-opacity=".4" stroke-width="2"/>`;
    b+=windowRow(-w+15,-h+24,stage>=5?7:stage>=4?6:4,stage>=7?19:15,stage>=4?30:25);
    if(stage>=4)b+=windowRow(-w+15,-h+81,stage>=5?7:6,stage>=7?19:15,30);
    b+=panel(16,d-h+25,stage>=7?57:39,stage>=4?41:30,stage>=7?light:glass,-.45);
    b+=panel(-21,d-61,41,63,"#375e50")+block(-3,37,48,25,9,"#a6a283","#d8cd9f");
    if(stage===3)b+=poly("M-55-27L-4-60L51-28L0-1Z","#769177")+'<path d="M-52-24v49m102-49v49" stroke="#a38a60" stroke-width="5"/>';
    if(stage>=4 && stage<=6)b+=`<g data-estate-part="balcony-lookout">${block(-42,0,91,31,68,"#a58d62","#d5c18e")}<path d="M-130-51v-24l87 39 88-39v24m-88-10v24" fill="none" stroke="#6c8060" stroke-width="5"/>${panel(-85,-116,52,35,"#d7d4a7")}</g>`;
    if(stage>=7) {
      b+=poly("M-70-72L-9-117L63-60L-2-31Z","#e0d5ad")+'<path d="M-58-66v92m105-54v92" stroke="#e1d9b6" stroke-width="12"/>';
      b+='<path d="M-44 29l85 40m-101-29l116 54m-132-43l148 66" stroke="#cec6a0" stroke-width="11"/>';
    }
    b+=block(stage>=7?76:43,-h-8,12,8,37,"#8c8065","#c3b68d");
    if(stage===8) {
      b+=at(183,-24,panel(-79,-54,113,50,"#567c68"));
      for(let i=0;i<3;i++)b+=at(123+i*35,-57+i*15,'<path d="M-7-15H7v11L0 2l-7-6zm7 17v9m-8 0H8M-7-12h-6v8l6 3M7-12h6v8L7-1" fill="#dfc175" stroke="#dfc175" stroke-width="2"/>');
      b+=roomText(157,61,"Trophy room",12);
    }
    if(stage>=7)b=b.replaceAll(glass,light);
    return `<g data-estate-part="residence-${stage}">${b}</g>`;
  }
  function wheel(x,y) {
    return at(x,y,`<g class="mill-wheel" data-estate-part="turning-waterwheel"><circle r="48" fill="#745e42" stroke="#d1b57a" stroke-width="8"/><circle r="32" fill="#a6c2ae" stroke="#886d47" stroke-width="5"/>${Array.from({length:10},(_,i)=>`<g transform="rotate(${i*36})"><path d="M0-45V45" stroke="#866c47" stroke-width="5"/><path d="M-10-49h20v10h-20z" fill="#b59561"/></g>`).join("")}<circle r="9" fill="#e0c590"/></g>`);
  }
  function watermill() {
    return `<g data-estate-part="watermill">${at(278,432,block(0,0,67,37,100,"#b2a17a","#d7c398")+roof(67,37,100)+windowRow(-54,-80,3,15,24)+panel(-20,-5,25,39,"#4b6b56"))}${wheel(359,455)}${roomText(252,502,"Watermill",15)}</g>`;
  }
  function greenhouse(x,y) {
    return at(x,y,block(0,0,58,30,53,"#82ab94","#bdd8b1")+poly("M-58-53L0-100L58-53L0-23Z","#b8d7b1")+'<path d="M0-100v129m-28-104v90m56-90v90M-57-53L0-23l57-30" stroke="#5c8a70" stroke-width="4"/>'+flowers(-15,5));
  }
  function workshop(x,y,advanced=false,powered=false) {
    return `<g data-estate-part="${advanced?"advanced-workshop":"equipment-workshop"}">${at(x,y,block(0,0,advanced?101:80,40,advanced?103:79,"#8b9f8a","#c9cfac")+roof(advanced?101:80,40,advanced?103:79,"#6c7c5d")+panel(-62,-61,51,54,"#57766a")+gear(39,-54,true,.7)+panel(15,-12,36,31,powered?light:glass,-.45))}</g>`;
  }
  function grid(stage) {
    const poles=stage===8?[[431,563],[602,674],[1022,595],[987,419]]:[[431,563],[602,674],[987,505]];
    const cables=poles.slice(1).map(([x,y],i)=>`M${poles[i][0]} ${poles[i][1]-122}Q${(poles[i][0]+x)/2} ${(poles[i][1]+y)/2-100} ${x} ${y-122}`).join("");
    return `<g data-estate-part="private-power-grid"><path d="M494 519V486L431 459V441${stage===8?"M987 297Q974 299 960 311M1022 473L1085 470":"M987 383Q939 350 899 344"}" fill="none" stroke="#3f5d53" stroke-width="3"/><path d="${cables}" fill="none" stroke="#3f5d53" stroke-width="3"/>${poles.map(([x,y])=>at(x,y,'<path d="M0 0v-124m-18 0h36m-29-7v13m22-13v13" fill="none" stroke="#806d4e" stroke-width="6"/><path d="M-17-125h7m13 0h7" stroke="#c6d6af" stroke-width="6"/>')).join("")}${at(493,573,block(0,0,42,23,57,"#819c8c","#c2cdb1")+panel(-30,-46,24,31,"#4f7767")+'<path d="M-17-40l-6 12h8l-6 13" fill="none" stroke="#ead39a" stroke-width="3"/>')}${roomText(488,622,"Distribution",13)}</g>`;
  }
  function camp(s,previewStage=null) {
    const p=M.campProgress(s),a=M.state(s),stage=previewStage || p.current.id;
    const st=M.campStages[stage-1],power=stage>=7;
    let land=block(600,480,554,279,32,"#6e8a6a","#9eaf83",false);
    land+='<path d="M455 510l280 125 267-127" stroke="#d3c49b" stroke-width="40" fill="none"/>';
    let extra="";
    if(stage>=2)extra+='<g data-estate-part="fence-and-garden"><path d="M454 613l-137-62v-27m137 89v-27m65 57v-27m65 57v-27m65 57v-27M317 533l330 148" fill="none" stroke="#bca576" stroke-width="7"/>'+flowers(811,586)+flowers(856,608)+block(577,627,38,20,8,"#7e7b50","#668c57")+'</g>';
    if(stage>=3)extra+=at(545,455,block(0,0,25,14,31,"#8a7951","#b6a576")+'<path d="M-22-19l45 20m-45-9l45 20" stroke="#4b7360" stroke-width="3"/>')+at(791,455,block(0,0,40,17,15,"#8e744a","#ba9a64")+'<path d="M-31-5l65 30m-49-35l-15 6" stroke="#c7b17a" stroke-width="4"/>');
    if(stage>=4)extra+=bench(888,519)+flowers(744,622)+flowers(789,647);
    if(p.count>=3 && stage<5) extra+=at(987,502,block(0,0,45,24,53,"#ac956a","#d1bc8e")+roof(45,24,53))+roomText(988,553,"Workshop",13);
    if(stage>=5) {
      extra+=workshop(987,502,stage===8,power)+at(961,633,block(0,0,44,25,60,"#a38d62","#b9c5a0")+roof(44,25,60));
      extra+='<g data-estate-part="water-pump">'+at(448,625,block(0,0,17,10,29,"#6d9381","#b5c6a3")+'<path d="M0-30v-32h18m-18 9h-18v-14" fill="none" stroke="#597d70" stroke-width="7"/>')+'</g>';
    }
    if(stage>=5 || a.campProjects.greenhouse)extra+='<g data-estate-part="community-greenhouse">'+greenhouse(390,650)+'</g>';
    if(a.campProjects.lookout)extra+=at(147,412,block(0,0,31,18,119,"#a18a61","#d4bb82")+roof(38,20,119))+roomText(144,451,"Lookout",13);
    if(a.campProjects.noticeboard)extra+=at(604,710,'<path d="M-31 0v-78h62V0m-62-65h62v40h-62" fill="#b69c64" stroke="#796647" stroke-width="6"/><path d="M-23-55h17v22h-17zM7-55h17v22H7z" fill="#ecdcb0"/>');
    let water="";
    if(stage>=6) {
      water='<g data-estate-part="stream-and-channel"><path d="M146 218L239 323L210 412L366 516L248 719" fill="none" stroke="#d3c6a0" stroke-width="61"/><path d="M146 218L239 323L210 412L366 516L248 719" fill="none" stroke="#5eabb4" stroke-width="43"/><path class="flowing-water" d="M146 218L239 323L210 412L366 516L248 719" fill="none" stroke="#bfe4d4" stroke-width="4" stroke-dasharray="12 24"/></g>';
      extra+=watermill()+at(277,623,block(0,0,65,21,12,"#9b7c51","#d1b17a")+'<path d="M-64-12v-26l129 59v-26" fill="none" stroke="#836b49" stroke-width="5"/>');
      extra+='<g data-estate-part="storage-tank-and-pipework">'+block(418,464,37,22,73,"#85a69b","#c6d6b7")+'<path d="M419 474v74l29 13v64m-29-77l206 93" fill="none" stroke="#648c7c" stroke-width="10"/><path d="M418 436h28v-22" fill="none" stroke="#d0dab6" stroke-width="5"/></g>';
    }
    if(power) {
      extra+='<g data-estate-part="hydro-generator"><path d="M366 463L392 483m-22-26l27 20" stroke="#9b8659" stroke-width="5"/>'+at(404,520,block(0,0,30,18,39,"#779888","#b7ccac")+gear(0,-32,true,.65))+'</g>'+grid(stage);
      for(const [x,y] of [[534,495],[748,578],[900,625],[1088,591]])extra+=lamp(x,y,true);
    } else if(stage>=2) extra+=lamp(784,513,true)+lamp(587,558,true);
    if(stage===8)extra+='<g data-estate-part="landscaped-courtyard">'+block(706,575,133,58,9,"#a7b094","#dfd5b0")+block(706,562,31,17,21,"#a7b8a4","#b4d7c6")+'<path d="M706 542v-23m0 4q-13 3-13 13m13-13q13 3 13 13" stroke="#86bfc0" stroke-width="4" fill="none"/>'+flowers(600,585)+flowers(648,610)+flowers(781,586)+flowers(826,611)+'</g>';
    const placed=Object.entries(a.camp).filter(([,id])=>id).map(([slot,id],i)=>{
      const c=M.collections(s).find(c=>c.id===id);if(!c)return "";
      return at([562,824,510][i],[570,652,669][i],`<title>${esc(c.name)} at camp ${esc(slot)}</title>`+block(0,0,18,10,24,"#99835a","#d9c18a")+at(-22,-69,A.keepsake(c).replace(/<svg[^>]*>/,"<g>").replace("</svg>","</g>"),.55));
    }).join("");
    const starter=stage<=2?at(576,476,block(0,0,27,17,27,"#9f8557","#d4b87d"))+at(763,498,'<path d="M-16-19h28v32h-28z" fill="#8f9871"/><path d="M-8-19v-7H5v7" stroke="#5f7959" stroke-width="4" fill="none"/>')+at(617,522,'<ellipse rx="27" ry="13" fill="#74634a"/><path d="M-15 1l29-11m-24-6L9 6" stroke="#a78a5b" stroke-width="7"/><path class="camp-fire" d="M-10-9q-4-15 6-26 0 12 8 10 10 17-1 24Z" fill="#e3b26d"/>'):"";
    return `<svg class="camp-scene estate-stage-${stage} ${previewStage?"estate-preview":""}" data-camp-stage="${stage}" viewBox="0 0 1200 800" role="img" aria-label="${previewStage?"Preview: ":""}Base Camp stage ${stage} of 8: ${esc(st.name)}${power?", hydro generator, power grid and lit estate":""}"><rect width="1200" height="800" fill="${power?"#6e9987":"#b2cdb7"}"/><path d="M0 195l180-110 203 104L600 66l218 122L1022 70l178 130v600H0Z" fill="#51816a" opacity=".3"/>${land}${water}${pine(1073,339,1.3)}${pine(129,542,1.2)}${at(700,stage===8?375:411,residence(stage))}${extra}${starter}${placed}${at(667,550,miniExplorer(),.9)}<rect x="28" y="25" width="570" height="43" rx="8" fill="#244b3d"/><text x="48" y="53" fill="#f6e8bc" font-family="system-ui" font-size="22" font-weight="750">${stage} / 8 · ${esc(st.name)}</text>${power?roomText(920,777,"Water → generator → estate lights",14):roomText(920,777,"A home built through your adventures",14)}</svg>`;
  }
  const originalScene=A.scene;
  Object.assign(A,{venue,townScene,exterior,location,camp,townPlots:plots,
    scene:(id,level=0,before=false,settled=0)=>id==="town"?townScene(before?0:level,settled):originalScene(id,level,before,settled)});
})();
