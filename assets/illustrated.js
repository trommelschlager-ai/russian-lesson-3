(() => {
  'use strict';
  document.addEventListener('click',event=>{
    if(event.target.closest('[data-open-quiz]')){
      event.preventDefault();
      const quiz=document.getElementById('quiz-section');
      quiz.hidden=false;
      quiz.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});
      document.getElementById('quiz-title').focus({preventScroll:true});
    }
    if(!event.target.closest('.lesson-menu'))document.querySelectorAll('.lesson-menu[open]').forEach(menu=>menu.open=false);
  });
  document.addEventListener('keydown',event=>{
    if(event.key==='Escape')document.querySelectorAll('.lesson-menu[open]').forEach(menu=>{menu.open=false;menu.querySelector('summary').focus();});
  });
})();
