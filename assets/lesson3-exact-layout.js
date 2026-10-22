(()=>{'use strict';
function init(){
 const root=document.getElementById('pronoun-cards'),tabs=document.querySelectorAll('#l3-approved-tabs>.l3-approved-tab');
 const cards=[...root?.querySelectorAll(':scope > .card')||[]];
 if(cards.length!==8||tabs.length!==8){setTimeout(init,160);return;}
 if(document.querySelector('.rl3-feature-buttons'))return;
 const menu=document.createElement('div');menu.className='rl3-feature-buttons';
 menu.innerHTML='<a href="#pronouns">🔊 听发音</a><a href="#examples">📖 学句子</a><a href="#quiz-section">✏️ 小测验</a>';
 root.after(menu);
 function show(i){
 cards.forEach((card,n)=>{
 const yes=n===i;card.classList.toggle('rl3-active-card',yes);card.setAttribute('aria-hidden',yes?'false':'true');
 card.querySelectorAll('button').forEach(b=>b.tabIndex=yes?0:-1);
 });
 tabs.forEach((tab,n)=>tab.setAttribute('aria-current',n===i?'true':'false'));
 }
 [...tabs].forEach((tab,i)=>tab.addEventListener('click',()=>show(i)));
 show(0);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();