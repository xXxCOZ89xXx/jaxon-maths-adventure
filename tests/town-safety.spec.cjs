const {test,expect}=require('./helpers/identities.cjs'),F=require('./helpers/guided-progression.cjs');
test('a damaged other plan stays saved and Continue explains a failed branch without changing cash or receipts',async({camp})=>{
 const p=camp.page,s=F.fresh();F.L.start(s,'shop-party');s.adventure.townLifeV2.runs['shop-party:1'].version=99;F.L.start(s,'shop-budget');const j=F.L.state(s),t=F.L.task(s);j.values.choice=t.answer;j.solved=true;t.effect={spend:50,receipt:'Must not charge',add:{flour:2}};delete t.branches[j.values.choice];const before={cash:j.cash,inventory:j.inventory,receipts:j.receipts,stage:j.stage};
 await p.evaluate(({key,s})=>localStorage.setItem(key,JSON.stringify(s)),{key:camp.key,s});await p.reload();
 await p.locator('.scene-dock [data-action="j-next"]').click();await expect(p.locator('.scene-dock .feedback')).toContainText('no supported next step');
 const saved=await camp.read(),run=F.L.state(saved);expect({cash:run.cash,inventory:run.inventory,receipts:run.receipts,stage:run.stage}).toEqual(before);expect(saved.adventure.townLifeV2.runs['shop-party:1'].version).toBe(99);
});
