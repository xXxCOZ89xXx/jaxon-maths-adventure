// Exact pre-overhaul V1 shape, synthetic only. Never create a live account or reset a save.
const T=require('../../v3/town').V3Town;
module.exports=function legacy(s,recipe='bolognese'){
 s.adventure ||= {};s.adventure.townActive=1;
 s.adventure.journeyV1={version:1,id:'recipe-journey-1',recipe,stage:0,context:T.context('home','journey'),inventory:[1,1,0],shoppingList:null,basket:null,cash:1000,budget:1000,completed:[],values:{},solved:false,assisted:false,evidence:[],feedback:'',receipts:[],done:false};
 s.view=s.resumeView='journey';s.world='town';return true;
};
