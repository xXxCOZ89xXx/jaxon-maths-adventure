const assert=require('node:assert/strict'),{V3QuestionTeaching:T}=require('../v3/question-teaching.js'),{V3AnswerMarking:A}=require('../v3/answer-marking.js');
const row=(prompt,answer,worked)=>[prompt,answer,[answer,'-1','-2','-3'],'hint',worked,{}];
const priority=T.enrich(row('11 + 7 × 5 = ?','46','Multiply before adding.'));assert(priority[4].includes('35'));assert(priority[4].includes('46'));assert(priority[2].includes('90'),'Left-to-right evaluation is a real operation-priority mistake');
const fraction=T.enrich(row('2/3 + 1/6 = ?','5/6','Add equal-sized parts.'));assert(fraction[4].includes('15/18'));assert(fraction[2].some(v=>A.matches('1/3',v)),'Adding denominators is represented as a wrong method');
const compared=T.enrich(row('Which is greater: 2/3 or 3/4?','3/4','Compare the fractions.'));assert(compared[2].includes('2/3'));assert(compared[2].includes('3/4'));assert(compared[4].includes('2 × 4 = 8'));assert(compared[4].includes('3 × 3 = 9'));
const original=row('11 + 7 × 5 = ?','46','Historical wording');T.enrich(original);assert.equal(original[4],'Historical wording');
const c=require('../scripts/audit-curriculum.cjs').load();let questions=0;
for(const k of c.V3Curriculum.skills)for(const band of [6,9])for(const seed of [1,2,7])for(const q of c.JaxonFreshReview.create(k.id,band,seed)){
 assert(q[5].id||q[5].generatorKey,'Every registered generator must identify its actual invocation, not just the final selection slot');
 if(q[5].activity||q[5].direct||!A.parse(q[1]))continue;
 assert.equal(q[2].length,4,q[0]);assert.equal(q[2].filter(v=>A.matches(q[1],v,q[5].answerContract)).length,1,q[0]);
 for(const v of q[2])if(!A.matches(q[1],v,q[5].answerContract))assert(q[5].choiceReasons?.[v],k.id+': '+q[0]+' / '+v);
 questions++;
}
console.log(`PASS question teaching: ${questions} numeric questions have one correct choice and explained misconception alternatives; comparison values and question-specific arithmetic/fraction steps verified; original rows unchanged.`);
