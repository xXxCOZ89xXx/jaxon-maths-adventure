const F=require('./guided-progression.cjs'),fixture=require('../fixtures/town-recipes-before-refresh.json');
module.exports=index=>{const s=F.fresh(),run=JSON.parse(JSON.stringify(fixture.runs[index]));s.adventure={townLifeV2:{version:2,runs:{[run.id]:run},active:run.id,counts:{[run.scenario]:run.seed}},townActive:2};s.view=s.resumeView='journey';s.world='town';return s;};
