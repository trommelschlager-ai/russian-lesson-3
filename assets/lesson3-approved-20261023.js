/* Lesson 3 approved sketch: eight accessible shortcuts. All original
   pronoun cards and their audio/exercises remain in the page and untouched. */
(()=>{
 'use strict';
 function setup(){
   const list=document.getElementById('pronoun-cards');
   if(!list||document.getElementById('l3-approved-tabs'))return;
   const cards=[...list.querySelectorAll(':scope > .card')];
   const pronouns=[['Я','我'],['Ты','你'],['Он','他'],['Она','她'],['Оно','它'],['Мы','我们'],['Вы','你们'],['Они','他们']];
   if(cards.length!==8)return;
   const nav=document.createElement('nav');
   nav.id='l3-approved-tabs';
   nav.className='l3-approved-tabs';
   nav.setAttribute('aria-label','选择人称代词 · Выбор местоимения');
   const buttons=[];
   pronouns.forEach(([ru,cn],i)=>{
     const b=document.createElement('button');b.type='button';b.className='l3-approved-tab';
     b.innerHTML='<span class="tab-ru" lang="ru">'+ru+'</span><span class="tab-cn" lang="zh-CN">'+cn+'</span>';
     b.setAttribute('aria-label',ru+' · '+cn);b.setAttribute('aria-current',i===0?'true':'false');
     b.addEventListener('click',()=>{
       buttons.forEach((x,j)=>x.setAttribute('aria-current',j===i?'true':'false'));
       cards[i].scrollIntoView({block:'start',behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});
     });
     buttons.push(b);nav.appendChild(b);
   });
   list.parentNode.insertBefore(nav,list);
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup,{once:true});else setup();
})();
