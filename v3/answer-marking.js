/* Versioned numeric marking for newly authored contracts. Never eval input. */
(function(root){'use strict';
const units={pounds:['money',100],pence:['money',1],g:['mass',1],kg:['mass',1000],mg:['mass',.001],mm:['length',.001],cm:['length',.01],m:['length',1],km:['length',1000],ml:['volume',.001],l:['volume',1],seconds:['time',1],minutes:['time',60],hours:['time',3600],degrees:['angle',1],percent:['percent',1],cm2:['area',.0001],m2:['area',1],cm3:['capacity',.000001],m3:['capacity',1]};
const aliases={gbp:'pounds','£':'pounds',pound:'pounds',pounds:'pounds',p:'pence',penny:'pence',pennies:'pence',pence:'pence',gram:'g',grams:'g',kilogram:'kg',kilograms:'kg',milligram:'mg',milligrams:'mg',metre:'m',metres:'m',meter:'m',meters:'m',centimetre:'cm',centimetres:'cm',millimetre:'mm',millimetres:'mm',kilometre:'km',kilometres:'km',litre:'l',litres:'l',liter:'l',liters:'l',millilitre:'ml',millilitres:'ml',s:'seconds',sec:'seconds',second:'seconds',min:'minutes',minute:'minutes',h:'hours',hr:'hours',hour:'hours','°':'degrees',degree:'degrees','%':'percent',percentage:'percent'};
function unit(s){const v=String(s||'').toLowerCase().trim().replace(/²/g,'2').replace(/³/g,'3');return aliases[v]||v;}
function parse(input){
 let text=String(input??'').trim().replace(/−/g,'-').replace(/\u00a0/g,' '),supplied='';
 if(/^[+-]?£/.test(text)){supplied='pounds';text=text.replace(/^([+-]?)£/,'$1').trim();}
 const suffix=/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(text)?null:text.match(/\s*([a-zA-Z°%]+[²³23]?)\s*$/);
 if(suffix){if(supplied)return null;supplied=unit(suffix[1]);text=text.slice(0,suffix.index).trim();if(!units[supplied])return null;}
 if(text.includes(',')){if(!/^[+-]?\d{1,3}(?:,\d{3})+(?:\.\d+)?$/.test(text))return null;text=text.replace(/,/g,'');}
 let value;const mixed=text.match(/^([+-]?\d+)\s+(\d+)\s*\/\s*(\d+)$/),fraction=text.match(/^([+-]?(?:\d+(?:\.\d*)?|\.\d+))\s*\/\s*([+-]?(?:\d+(?:\.\d*)?|\.\d+))$/);
 if(mixed){if(Number(mixed[3])===0)return null;value=(text.startsWith('-')?-1:1)*(Math.abs(Number(mixed[1]))+Number(mixed[2])/Number(mixed[3]));}
 else if(fraction){if(Number(fraction[2])===0)return null;value=Number(fraction[1])/Number(fraction[2]);}
 else if(/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(text))value=Number(text);else return null;
 if(!Number.isFinite(value))return null;
 return {value,unit:supplied,decimalPlaces:text.includes('/')?null:Math.max(0,(text.match(/\.(\d+)/)?.[1].length??0)-Number(text.match(/[eE]([+-]?\d+)/)?.[1]||0))};
}
function matches(expected,input,{unit:target='',decimalPlaces,relativeTolerance=1e-8,strict=false}={}){
 const answer=parse(expected),actual=parse(input);if(!answer||!actual)return false;
 const wanted=unit(target||answer.unit);let value=actual.value;
 if(actual.unit){if(!wanted||!units[wanted]||units[actual.unit][0]!==units[wanted][0])return false;value*=units[actual.unit][1]/units[wanted][1];}
 let exact=answer.value;if(answer.unit&&wanted&&units[answer.unit]?.[0]===units[wanted]?.[0])exact*=units[answer.unit][1]/units[wanted][1];
 if(Number.isInteger(decimalPlaces)&&decimalPlaces>=0&&decimalPlaces<=12){const rounded=Number(exact.toFixed(decimalPlaces));return Math.abs(value-rounded)<=Math.max(1e-9,Math.abs(rounded)*Number.EPSILON*8);}
 if(strict)return Math.abs(value-exact)<=Math.max(Math.abs(value),Math.abs(exact))*Number.EPSILON*4;
 const approx=!Number.isInteger(exact)&&actual.decimalPlaces>=4?Math.min(.5*10**(-Math.min(16,actual.decimalPlaces)),Math.abs(exact)*.01):0;
 const tolerance=Number.isInteger(exact)?Math.abs(exact)*Number.EPSILON*8:Math.max(Math.min(1e-6,Math.abs(exact)*1e-4),Math.abs(exact)*relativeTolerance,approx);
 return Math.abs(value-exact)<=tolerance+Math.max(Math.abs(exact),Math.abs(value))*Number.EPSILON*8;
}
function contract(prompt='',explicitUnit=''){
 const p=String(prompt).replace(/²/g,'2').replace(/³/g,'3'),places=p.match(/(?:to|rounded to)\s*(\d+)\s*(?:decimal places?|d\.p\.)/i);let target=explicitUnit;
 if(!target){const found=p.match(/(?:in|in whole|answer in|give[^.]*? in)\s+(pounds|pence|kilograms|grams|kilometres|centimetres|millimetres|metres|litres|millilitres|seconds|minutes|hours|degrees|kg|g|cm2|m2|cm3|m3|cm|mm|km|m|ml|l)\b/i);target=found?.[1]||[...p.matchAll(/\b(pounds|pence)\b/gi)].at(-1)?.[1]||'';}
 return {unit:unit(target),...(places?{decimalPlaces:Number(places[1])}:{})};
}
const api={version:1,parse,matches,contract};root.V3AnswerMarking=api;if(typeof module!=='undefined')module.exports={V3AnswerMarking:api};
})(typeof window==='undefined'?globalThis:window);
