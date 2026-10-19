/* Run from repository root: node tests/v2-discovery-regression.cjs
   Checks maths discovery-answer presentation and answer-key uniqueness.
   This does not replace an educational correctness review. */
'use strict';
const fs=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const html=fs.readFileSync('v2-game-test.html','utf8');
const bankStart=html.indexOf('const discoveryBank={');
const bankEnd=html.indexOf('function discoveryData()',bankStart);
const helperStart=html.indexOf('function discoveryFractionParts(');
const helperEnd=html.indexOf('function discoveryPage(',helperStart);
assert.ok(bankStart>=0&&bankEnd>bankStart&&helperStart>=0&&helperEnd>helperStart,'Discovery source present');
const bank=vm.runInNewContext(html.slice(bankStart,bankEnd)+';discoveryBank');
const helpers=html.slice(helperStart,helperEnd);
const getChoices=vm.runInNewContext('(function(id,band,i){function discoveryData(){return {[id]:{band,i}}}function discoveryQuestion(id){return discoveryBank[id]?.[band]?.[i]};'+helpers+';const q=discoveryQuestion(id),options=discoveryChoices(id);return {question:q,options,labels:options.map(v=>discoveryChoiceLabel(v,q[1])),prompt:discoveryPromptText(q[1])}})',{discoveryBank:bank});
function numeric(x){if(typeof x==='number')return x;const str=String(x);if(str.includes('/')){const [a,b]=str.split('/').map(Number);return b?a/b:NaN}return Number(str)}
let count=0;
for(const [id,years] of Object.entries(bank)){
 for(const [year,questions] of Object.entries(years)){
  assert.equal(questions.length,4,id+' Year '+year+' must have 4 questions');
  for(let i=0;i<4;i++){
   const {question,options,labels,prompt}=getChoices(id,Number(year),i);
   assert.equal(options.length,4,id+' '+year+' has 4 choices');
   assert.equal(new Set(labels).size,4,id+' '+year+' distinct displayed choices');
   const tol=String(question[2]).length>12?0.00005:0.0000001;
   const correct=options.filter(v=>Math.abs(numeric(v)-question[2])<tol);
   assert.equal(correct.length,1,id+' '+year+' exactly one correct answer');
   if(/enter a fraction/i.test(question[1]))assert.ok(labels.every(v=>/^[-]?[0-9]+\/[0-9]+$/.test(v)),id+' fraction choices need fraction format');
   if(/(?:as a percentage|what percentage|how many percent|percentage\?|percentage (?:increase|decrease)|write .*percentage)/i.test(question[1]))assert.ok(labels.every(v=>v.endsWith('%')),id+' percentage labels');
   assert.ok(!/\benter\b/i.test(prompt),id+' '+year+' should invite a tap, not typing');
   count++;
  }
 }
}
console.log('PASS: '+count+' discovery questions, 4 distinct options and 1 valid answer per question.');
