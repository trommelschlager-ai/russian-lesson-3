/* The approved mockup is the visual source; the original 100-word lesson
   and all playback, slow and microphone handlers remain the real controls. */
(()=>{
  'use strict';
  function mount(){
    const list=document.getElementById('word-list');
    const nav=document.querySelector('.l2-feature-controls');
    const first=list?.querySelector('.word-card');
    if(!list||!nav||!first){setTimeout(mount,120);return;}
    if(document.documentElement.dataset.lesson2ApprovedArt)return;
    document.documentElement.dataset.lesson2ApprovedArt='yes';
    const photo=first.querySelector('[data-role="photo"]');
    if(photo){
      photo.src='assets/approved-art/lesson2-approved-food.avif';
      photo.alt='Еда: красивая каша с ягодами, цветами и видом на Москву';
      photo.setAttribute('loading','eager');
      photo.setAttribute('decoding','async');
    }
    const info=first.querySelector('.info');
    const translation=info?.querySelector('.translation');
    if(translation&&!info.querySelector('.l2-example')){
      const ex=document.createElement('div');
      ex.className='l2-example';
      ex.innerHTML='💡 例句： <b lang="ru">Еда́ вкусная.</b><small lang="zh-CN">食物很好吃。</small>';
      translation.after(ex);
    }
    function attach(){
      const current=list.querySelector('.word-card.l2-current');
      const topline=current?.querySelector('.topline');
      if(topline&&nav.parentNode!==topline)topline.append(nav);
    }
    attach();
    new MutationObserver(attach).observe(list,{attributes:true,attributeFilter:['class'],subtree:true});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})();
