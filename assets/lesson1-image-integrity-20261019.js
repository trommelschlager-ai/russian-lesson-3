'use strict';
// Do not change lesson order, translations or audio. Repair only mismatched photos.
(()=>{
 const PHOTO_BY_WORD={
   'щетка':{src:'assets/lesson2-photos/word-058.jpg',alt:'Щётка — щётка для чистки'},
   'щука':{src:'assets/lesson2-photos/word-039.jpg',alt:'Щука — рыба'},
   'щи':{src:'https://commons.wikimedia.org/wiki/Special:FilePath/Schi.jpg?width=800',alt:'Щи — русский капустный суп'},
   'щель':{src:'https://commons.wikimedia.org/wiki/Special:FilePath/Gap_between_board_and_door.jpg?width=800',alt:'Щель — узкий зазор между дверью и доской'}
 };
 const fold=x=>String(x||'').trim().toLocaleLowerCase('ru-RU').replace(/ё/g,'е');
 const normalize=x=>fold(x).replace(/[\u0301\u0300]/g,'');
 let fixed=new Set();
 function run(){
  const root=document.getElementById('lessonList');
  if(!root)return;
  // Only deeply nested exact word labels are allowed to select a card.
  const leaves=root.querySelectorAll('*');
  for(const node of leaves){
   if(node.children.length!==0)continue;
   const key=normalize(node.textContent);
   const photo=PHOTO_BY_WORD[key];
   if(!photo)continue;
   let parent=node;
   for(let level=0;level<7&&parent&&parent!==root;level++,parent=parent.parentElement){
    const pictures=parent.querySelectorAll('img');
    const count=pictures.length;
    // Nearest card containing this one word and one image (never the whole grid).
    if(count!==1)continue;
    const label=normalize(parent.textContent);
    const others=Object.keys(PHOTO_BY_WORD).some(k=>k!==key&&label.includes(k));
    if(others)continue;
    const img=pictures[0];
    if(img.getAttribute('data-verified-word')===key){fixed.add(key);break;}
    img.removeAttribute('srcset');
    const picture=img.closest('picture');if(picture)picture.querySelectorAll('source').forEach(s=>s.removeAttribute('srcset'));
    img.src=photo.src;img.alt=photo.alt;img.title=photo.alt;img.loading='lazy';
    img.setAttribute('data-verified-word',key);
    fixed.add(key);break;
   }
  }
  if(fixed.size===4){
   if(observer)observer.disconnect();
   const footer=document.querySelector('.footer');
   if(footer&&!document.getElementById('lesson1-photo-credits')){
    const note=document.createElement('details');note.id='lesson1-photo-credits';
    note.style.cssText='margin-top:12px;font-size:11px;line-height:1.4;opacity:.75';
    const s=document.createElement('summary');s.textContent='Источники фото / 图片来源';note.append(s);
    const a=document.createElement('a');a.href='https://commons.wikimedia.org/wiki/File:Schi.jpg';a.textContent='Щи — Шнапс, Wikimedia Commons';a.target='_blank';a.rel='noopener noreferrer';
    const b=document.createElement('a');b.href='https://commons.wikimedia.org/wiki/File:Gap_between_board_and_door.jpg';b.textContent='Щель — Djxvillain, CC BY-SA 3.0';b.target='_blank';b.rel='noopener noreferrer';
    note.append(a,document.createTextNode(' · '),b);footer.append(note);
   }
  }
 }
 const observer=new MutationObserver(()=>run());
 function start(){
  run();
  const root=document.getElementById('lessonList');
  if(root&&fixed.size!==4)observer.observe(root,{subtree:true,childList:true});
  setTimeout(()=>{run();observer.disconnect();console.info('Lesson 1 photo audit', [...fixed]);},12000);
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
