/* Approved lesson 3 visual: keep original 8 pronouns, MP3,
   quizzes and cards; move 3 existing navigation controls into current card. */
(()=>{
 'use strict';
 function mount(){
  const list=document.getElementById('pronoun-cards');
  const btns=document.querySelector('.rl3-feature-buttons');
  const selected=list?.querySelector('.card.rl3-active-card');
  if(!list||!btns||!selected){setTimeout(mount,140);return;}
  if(document.documentElement.dataset.lesson3ApprovedArt)return;
  document.documentElement.dataset.lesson3ApprovedArt='yes';
  const headerImg=document.querySelector('.hero-art img');
  if(headerImg){
    headerImg.src='assets/approved-art/lesson3-approved-hero.avif';
    headerImg.alt='Дмитрий и Светлана у Кремля, урок 3 «Личные местоимения»';
    headerImg.setAttribute('loading','eager');
  }
  const first=list.querySelector(':scope > .card');
  if(first){
    const img=first.querySelector('.card-art img');
    if(img){
      img.src='assets/approved-art/lesson3-approved-student.avif';
      img.alt='Дмитрий показывает на себя — Я';
    }
  }
  function attach(){
   const card=list.querySelector('.card.rl3-active-card');
   const copy=card?.querySelector('.card-copy');
   if(copy&&btns.parentNode!==copy)copy.append(btns);
  }
  attach();
  new MutationObserver(attach).observe(list,{attributes:true,attributeFilter:['class'],subtree:true});
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})();
