/* 2026-10-25: optional portraits and learning images for lessons 6 and 7.
 * Asset is a 6-column x 3-row 960x480 WEBP sprite. All previous artwork stays
 * visible until the new asset has actually downloaded successfully. */
(()=>{'use strict';
const url='assets/lesson67-atlas.webp?v=20261025',check=new Image();
check.onload=()=>{if(check.naturalWidth>=900&&check.naturalHeight>=450)activate()};
check.onerror=()=>{};check.src=url;
function activate(){
 if(document.documentElement.dataset.photoL67)return;
 document.documentElement.dataset.photoL67='1';
 const st=document.createElement('style');st.id='lesson67-photo-style';
 st.textContent=[
 '.l67-photo{background-image:url("'+url+'");background-size:600% 300%;background-repeat:no-repeat;',
 'border-radius:12px;display:block;box-sizing:border-box;background-color:#f2eafb;border:1px solid #e3daeb;overflow:hidden}',
 '.lesson-6 .upgrade-phrase-symbol.l67-photo{font-size:0!important;width:98px!important;height:104px!important;min-width:98px!important;flex:none!important}',
 '.lesson-6 .extra-figure.l67-photo,.lesson-7 .upgrade-emoji.l67-photo{font-size:0!important;line-height:0!important}',
 '.lesson-6 .extra-figure.l67-photo{width:100%;max-width:185px;height:auto;aspect-ratio:4/3;margin:0 auto}',
 '.lesson-6 .l67-portrait{width:100px;height:112px;flex:0 0 100px}',
 '.lesson-7 .l67-portrait{width:100px;height:112px;flex:0 0 100px}',
 '.lesson-6 .l67-pair{display:flex!important;gap:3px!important;background:#e6def2}',
 '.lesson-6 .l67-pair .l67-photo{width:50%;height:100%;flex:1;border:0;border-radius:0}',
 '.lesson-7 .upgrade-action-heading:has(.l67-action){grid-template-columns:115px minmax(0,1fr)!important}',
 '.lesson-7 .l67-action{width:115px;height:110px;align-self:start}',
 '.lesson-7 .upgrade-emoji.l67-photo{width:100%!important;height:100px!important;max-width:150px!important;margin:auto}',
 '@media(max-width:690px){.lesson-6 .upgrade-phrase-symbol.l67-photo{width:76px!important;min-width:76px!important;height:85px!important}',
 '.lesson-6 .l67-portrait{width:82px;height:100px;flex-basis:82px}',
 '.lesson-7 .upgrade-action-heading:has(.l67-action){grid-template-columns:94px minmax(0,1fr)!important}',
 '.lesson-7 .l67-action{width:94px;height:96px}}'
 ].join('');
 document.head.append(st);
 const pos=i=>((i%6)*20)+'% '+(Math.floor(i/6)*50)+'%';
 function cell(el,i,extra){el.classList.add('l67-photo');if(extra)el.classList.add(extra);
  el.style.backgroundPosition=pos(i);el.replaceChildren();el.setAttribute('aria-hidden','true')}
 function duo(el,a,b){el.classList.add('l67-pair');el.replaceChildren();
  [a,b].forEach(id=>{const child=document.createElement('span');cell(child,id);el.append(child)});
  el.setAttribute('aria-hidden','true')}
 function portrait(img,id){const d=document.createElement('span');cell(d,id,'l67-portrait');
  d.removeAttribute('aria-hidden');d.setAttribute('role','img');
  d.setAttribute('aria-label',img.getAttribute('alt')||'');img.replaceWith(d)}
 document.querySelectorAll('.lesson-6 img.extra-character,.lesson-7 img.day-dialogue-character').forEach(img=>{
  const p=(img.getAttribute('src')||'').toLowerCase();
  if(p.includes('dmitry'))portrait(img,0);else if(p.includes('svetlana'))portrait(img,1)});
 if(document.body.classList.contains('lesson-6')){
  const family={родители:[10,11],муж:0,жена:1,дети:[14,15],друг:16,подруга:17};
  document.querySelectorAll('.extra-card').forEach(card=>{
   const k=card.querySelector('.ru')?.textContent.trim().toLowerCase();
   const el=card.querySelector('.extra-figure');if(!el||family[k]===undefined)return;
   Array.isArray(family[k])?duo(el,...family[k]):cell(el,family[k])});
  const phrases={'Это мой брат.':0,'Это моя сестра.':1,'У меня есть брат.':0,'Это моя семья.':[0,1],'У меня нет детей.':[14,15]};
  document.querySelectorAll('.upgrade-phrase-symbol').forEach(el=>{
   const k=el.closest('.extra-dialogue-line')?.querySelector('.ru')?.textContent.trim();
   if(phrases[k]===undefined)return;Array.isArray(phrases[k])?duo(el,...phrases[k]):cell(el,phrases[k])});
 }
 if(document.body.classList.contains('lesson-7')){
  const dictionary={завтрак:4,обед:6,ужин:7,работа:5,отдых:9};
  document.querySelectorAll('.upgrade-word').forEach(card=>{
   const name=card.querySelector('.ru')?.textContent.trim().toLowerCase();
   const el=card.querySelector('.upgrade-emoji');
   if(el&&dictionary[name]!==undefined)cell(el,dictionary[name])});
  const actions=[[/встаю/,2],[/чищу зубы/,3],[/принимаю душ/,8],
   [/иду на работу/,5],[/обедаю/,6],[/ужинаю/,7],[/ложусь спать/,9],[/завтракаю/,4]];
  document.querySelectorAll('.upgrade-action').forEach(card=>{
   const name=card.querySelector('.ru')?.textContent||'';
   const match=actions.find(a=>a[0].test(name));
   const el=card.querySelector('.upgrade-action-heading>span');
   if(match&&el)cell(el,match[1],'l67-action')});
 }
}
})();