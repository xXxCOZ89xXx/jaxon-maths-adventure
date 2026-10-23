/* Turn existing validated workbenches into scene-object close-ups. No progress writes. */
(function(){'use strict';
const A=V3Art,M=V3Adventure;
const ui={key:null,open:false,focus:null};
function key(s){const q=s.view==='adventure'?M.current(s):s.quest;return q?JSON.stringify(['world',s.view,q.key||q.world,q.seed||0,q.i]):null;}
function before(){const e=document.activeElement;ui.focus=e?.closest('.world-task-dialog')&&e.dataset.action?e.dataset.action:null;}
const spots={number:['Use number workshop',62,55,25,26],fractions:['Use water controls',24,44,32,30],algebra:['Use freight coupling bay',43,55,38,28],geometry:['Use construction table',49,57,30,25],ratio:['Inspect supply crates',47,54,33,27],statistics:['Use data display',62,27,30,30],probability:['Use probability apparatus',44,54,32,27],measure:['Use measuring equipment',45,52,36,28]};
function decorate(s){if(!['adventure','quest'].includes(s.view))return;const stage=document.querySelector('.world-stage'),work=stage?.querySelector('.stage-workbench'),vista=stage?.querySelector('.stage-vista'),art=vista?.querySelector('.hero-art');if(!stage||!work||!art)return;const q=s.view==='adventure'?M.current(s):s.quest;if(!q)return;const stamp=key(s);if(ui.key!==stamp){ui.key=stamp;ui.open=false;ui.focus=null;}
 stage.classList.add('immersive-mission');const scene=art.querySelector('.asset-scene');if(!scene)return;const homeSpots={meters:['Inspect utility meters',78,32,12,23],recycling:['Use bins and recycling',13,51,25,26],post:['Use postbox and mail',2,43,11,31]};const config=spots[q.world]||homeSpots[q.context?.homeActivity]||['Use service counter',8,35,31,36];
 const target=document.createElement('button');target.dataset.worldTaskOpen='true';target.className='object-hit world-tool-hit';target.setAttribute('aria-label',config[0]);target.style.cssText=`left:${config[1]}%;top:${config[2]}%;width:${config[3]}%;height:${config[4]}%`;target.innerHTML=`<span class="object-tag">${config[0]}</span>`;scene.append(target);
 if(!scene.querySelector('.scene-teen')){const person=document.createElement('span');person.className='activity-explorer';person.innerHTML=A.explorer(s);scene.append(person);}
 const task=q.tasks?.[q.i];if(task?.readings&&window.V7Home){const panel=document.createElement('div');panel.innerHTML=V7Home.meterPanel(task);work.querySelector('h2')?.after(panel);}
 const entry=document.createElement('div');entry.className='scene-dock activity-entry';const text=document.createElement('p');text.textContent=q.phase==='lesson'||q.intro?'Inspect the scene object to learn the idea.':'Use the highlighted object to continue your saved task.';entry.append(text);const button=target.cloneNode(true);button.className='primary';button.removeAttribute('style');button.textContent=config[0];entry.append(button);
 const d=document.createElement('dialog');d.className='scene-dialog world-task-dialog';d.dataset.worldScope=stamp;d.setAttribute('aria-label',config[0]);const close=document.createElement('button');close.dataset.worldTaskClose='true';close.textContent='Close ×';close.className='world-task-close';d.append(close);while(work.firstChild)d.append(work.firstChild);work.remove();stage.prepend(art);stage.append(entry,d);vista.classList.add('scene-support');
 if(ui.open){d.showModal();if(ui.focus)d.querySelector(`[data-action="${CSS.escape(ui.focus)}"]`)?.focus({preventScroll:true});}
}
function close(){ui.open=false;document.querySelector('.world-task-dialog')?.close();document.querySelector('[data-world-task-open]')?.focus({preventScroll:true});}
document.addEventListener('click',e=>{if(e.target.closest('[data-world-task-close]')){e.preventDefault();return close();}if(e.target.closest('[data-world-task-open]')){e.preventDefault();ui.open=true;document.querySelector('.world-task-dialog')?.showModal();}});
document.addEventListener('cancel',e=>{if(e.target.matches('.world-task-dialog')){e.preventDefault();close();}});
window.V7ActivityScenes={key,before,decorate};
})();
