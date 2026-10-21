/* Lesson 3 single-image art: original faces, no overlaid foreground books */
(() => {
 'use strict';
 if(window.__lesson3FinalSingleImages) return;
 window.__lesson3FinalSingleImages=true;
 const names=["Я","Ты","Он","Она","Оно","Мы","Вы","Они"];
 const filenames=["ya","ty","on","ona","ono","my","vy","oni"];
 const stylesheet=document.createElement('style');
 stylesheet.textContent="\n#pronoun-cards.pronouns>.card.rl3-has-panel{\n  display:grid!important;\n  grid-template-columns:minmax(0,1.08fr) minmax(0,.92fr)!important;\n  grid-template-rows:auto auto auto!important;\n  align-items:stretch!important;align-content:start!important;\n  overflow:hidden;\n}\n#pronoun-cards.pronouns>.card.rl3-has-panel>.card-copy{\n  grid-column:1!important;grid-row:1!important;position:relative;\n  padding:17px 12px 13px!important;align-self:stretch!important;min-width:0;\n}\n#pronoun-cards.pronouns>.card.rl3-has-panel>.card-copy>.ru{\n  font-size:clamp(30px,4vw,42px);line-height:1.1;margin-right:38px;\n}\n#pronoun-cards.pronouns>.card.rl3-has-panel>.card-copy>.lat{font-size:17px}\n#pronoun-cards.pronouns>.card.rl3-has-panel>.card-copy>.zh{font-size:23px}\n#pronoun-cards.pronouns>.card.rl3-has-panel>.card-copy>.example{\n  display:grid!important;margin-top:16px!important;padding-top:12px!important;\n  gap:5px;line-height:1.4;\n}\n#pronoun-cards .card.rl3-has-panel .card-copy .example-ru{\n  display:flex!important;align-items:center;justify-content:space-between;gap:5px;\n  font-size:17px;line-height:1.42;\n}\n#pronoun-cards .card.rl3-has-panel .card-copy .example-ru>span{min-width:0}\n#pronoun-cards .card.rl3-has-panel .card-copy .example-ru strong{\n  font-size:18px;line-height:1.42\n}\n#pronoun-cards .card.rl3-has-panel .card-copy .example-lat,\n#pronoun-cards .card.rl3-has-panel .card-copy .example-zh{font-size:16px;line-height:1.44}\n#pronoun-cards .card.rl3-has-panel .card-copy .example-audio{\n  position:relative!important;top:3px!important;float:none;\n  flex:0 0 32px;width:32px!important;height:32px!important;font-size:16px!important;\n}\n#pronoun-cards.pronouns>.card.rl3-has-panel>.card-art{\n  position:relative!important;display:block!important;\n  grid-column:2!important;grid-row:1!important;\n  align-self:stretch!important;justify-self:stretch!important;\n  width:100%!important;height:100%!important;min-height:260px!important;\n  max-height:none!important;aspect-ratio:auto!important;\n  overflow:hidden!important;padding:0!important;background:#eee4fc!important;\n}\n#pronoun-cards.pronouns>.card.rl3-has-panel>.card-art>img.rl3-final-art{\n  position:absolute!important;inset:0!important;display:block!important;\n  width:100%!important;height:100%!important;min-height:0!important;\n  padding:0!important;max-width:none!important;\n  object-fit:cover!important;object-position:center!important;\n  filter:none!important;mask:none!important;-webkit-mask:none!important;\n}\n#pronoun-cards.pronouns>.card.rl3-has-panel>.rl3-panel{\n  grid-column:1/-1!important;grid-row:2!important;z-index:2;align-self:start;\n}\n#pronoun-cards.pronouns>.card.rl3-has-panel>.rl3-example-holder{\n  grid-column:1/-1!important;grid-row:3!important;z-index:2;align-self:start;\n}\n@media(max-width:620px){\n  #pronoun-cards.pronouns>.card.rl3-has-panel{\n    grid-template-columns:minmax(0,1.04fr) minmax(0,.96fr)!important;\n    grid-template-rows:auto auto auto!important;\n  }\n  #pronoun-cards.pronouns>.card.rl3-has-panel>.card-copy{\n    padding:13px 10px 10px!important;\n  }\n  #pronoun-cards.pronouns>.card.rl3-has-panel>.card-copy>.ru{font-size:30px}\n  #pronoun-cards.pronouns>.card.rl3-has-panel>.card-copy>.lat{font-size:17px}\n  #pronoun-cards.pronouns>.card.rl3-has-panel>.card-copy>.zh{font-size:21px}\n  #pronoun-cards.pronouns>.card.rl3-has-panel>.card-copy>.example{\n    margin-top:13px!important;padding-top:10px!important;gap:5px;\n  }\n  #pronoun-cards .card.rl3-has-panel .card-copy .example-ru{font-size:16px}\n  #pronoun-cards .card.rl3-has-panel .card-copy .example-ru strong{font-size:17px}\n  #pronoun-cards .card.rl3-has-panel .card-copy .example-lat,\n  #pronoun-cards .card.rl3-has-panel .card-copy .example-zh{font-size:15px}\n  #pronoun-cards .card.rl3-has-panel .card-copy .example-audio{\n    flex:0 0 30px;width:30px!important;height:30px!important\n  }\n  #pronoun-cards.pronouns>.card.rl3-has-panel>.card-art{\n    min-height:260px!important;max-height:none!important;height:100%!important;\n  }\n}";
 document.head.appendChild(stylesheet);
 function setup(){
  document.querySelectorAll('#pronoun-cards>.card[data-say]').forEach(card=>{
   const i=names.indexOf(card.dataset.say);
   if(i<0)return;
   const copy=card.querySelector('.card-copy');
   const ex=card.querySelector('.example');
   if(copy&&ex&&ex.parentNode!==copy)copy.appendChild(ex);
   if(ex)ex.classList.remove('rl3-wide-example');
   const art=card.querySelector('.card-art');
   if(!art)return;
   const graphic=new Image();
   graphic.className='rl3-final-art';
   graphic.alt='';
   graphic.decoding='async';
   graphic.src='assets/lesson3-portraits/'+filenames[i]+'.svg?v=20261021-single';
   art.replaceChildren(graphic);
  });
 }
 if(document.readyState==='loading')
   document.addEventListener('DOMContentLoaded',setup,{once:true});
 else setup();
})();