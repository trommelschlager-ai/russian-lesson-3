/* Full-size single-card navigator; load AFTER lesson2-vertical.js.
   All 100 original cards stay in memory/DOM to preserve audio/mic/progress. */
(()=>{'use strict';
function ready(){
 const target=document.getElementById('word-list');if(!target)return;
 if(target.dataset.approvedNav)return;
 const all=[...target.querySelectorAll(':scope > .word-card')];
 if(all.length!==100){if(all.length===0)setTimeout(ready,200);return;}
 target.dataset.approvedNav='true';
 const nav=document.createElement('div');nav.className='l2-feature-controls';
 nav.innerHTML='<strong class="count">📖 第 <span id="l2-now">01</span> 个单词 / 共 100 个</strong><div class="nav-actions"><button type="button" id="l2-prev" aria-label="上一个词">‹</button><span class="l2-nav-index" id="l2-page">1 / 100</span><button type="button" id="l2-next" aria-label="下一个词">›</button></div>';
 target.before(nav);
 const list=document.createElement('details');list.className='l2-index';
 list.innerHTML='<summary>📚 单词列表（100个） · Список слов</summary><div class="l2-index-list"></div>';
 const listInner=list.querySelector('.l2-index-list'),buttons=[];
 all.forEach((card,i)=>{
 const b=document.createElement('button');b.type='button';
 const ru=card.querySelector('[data-role=word]')?.textContent||String(i+1);
 const zh=card.querySelector('[data-role=zh]')?.textContent||'';
 b.innerHTML=String(i+1).padStart(2,'0')+' · '+ru+'<span>'+zh+'</span>';
 b.addEventListener('click',()=>{show(i);list.open=false;nav.scrollIntoView({behavior:'smooth',block:'start'});});
 listInner.append(b);buttons.push(b);
 });
 target.after(list);let active=0;
 function show(index){
  active=Math.max(0,Math.min(all.length-1,index));
  all.forEach((card,i)=>{const current=i===active;card.classList.toggle('l2-current',current);card.setAttribute('aria-hidden',current?'false':'true');card.querySelectorAll('button').forEach(button=>button.tabIndex=current?0:-1);});
  nav.querySelector('#l2-now').textContent=String(active+1).padStart(2,'0');
  nav.querySelector('#l2-page').textContent=(active+1)+' / '+all.length;
  nav.querySelector('#l2-prev').disabled=active===0;
  nav.querySelector('#l2-next').disabled=active===all.length-1;
  buttons.forEach((b,i)=>b.setAttribute('aria-current',i===active?'true':'false'));
 }
 nav.querySelector('#l2-prev').onclick=()=>show(active-1);
 nav.querySelector('#l2-next').onclick=()=>show(active+1);
 show(0);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ready);else ready();
})();