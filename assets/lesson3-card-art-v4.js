/* Lesson 3 approved visual v4: notebook and book background behind original characters.
 * Run after pronunciation script so its safe DOM reflow takes priority. */
(() => {
 'use strict';
 if (window.__lesson3StudentScenesV4) return;
 window.__lesson3StudentScenesV4 = true;
 const style = document.createElement('style');
 style.textContent = `
 /* Match the selected reference: word and example in the left top column;
    complete colorful educational illustration in the right top column;
    original two interactive practice panels across the full card width. */
 #pronoun-cards.pronouns>.card.rl3-has-panel{
   display:grid!important;
   grid-template-columns:minmax(0,1fr) minmax(0,.99fr)!important;
   grid-template-rows:auto auto auto!important;
   align-items:stretch!important;align-content:start!important;
   overflow:hidden;
 }
 #pronoun-cards.pronouns>.card.rl3-has-panel>.card-copy{
   grid-column:1!important;grid-row:1!important;
   position:relative;z-index:2;
   padding:20px 15px 16px!important;min-width:0;
   align-self:stretch;
 }
 #pronoun-cards.pronouns>.card.rl3-has-panel>.card-copy>.ru{
   font-size:clamp(31px,4vw,43px);
   margin-right:39px;line-height:1.08
 }
 #pronoun-cards.pronouns>.card.rl3-has-panel>.card-copy>.lat{font-size:18px;margin-top:6px}
 #pronoun-cards.pronouns>.card.rl3-has-panel>.card-copy>.zh{font-size:24px}
 #pronoun-cards.pronouns>.card.rl3-has-panel>.card-copy>.example{
   display:grid!important;
   margin-top:17px!important;padding-top:13px!important;
   line-height:1.4;gap:7px;
 }
 #pronoun-cards .card-copy>.example>.example-ru{
   display:flex;align-items:center;justify-content:space-between;
   gap:7px;font-size:17px;line-height:1.4
 }
 #pronoun-cards .card-copy>.example>.example-ru>span{min-width:0}
 #pronoun-cards .card-copy>.example>.example-ru strong{font-size:18px;line-height:1.4}
 #pronoun-cards .card-copy>.example .example-lat,
 #pronoun-cards .card-copy>.example .example-zh{font-size:16px;line-height:1.45}
 #pronoun-cards .card-copy>.example .example-audio{
   position:relative;top:4px;flex:0 0 34px;
   width:34px;height:34px;font-size:17px;float:none
 }
 /* The picture stretches down to align with the left translation.
    This replaces the fixed 3:2 art viewport that caused the blank space. */
 #pronoun-cards.pronouns>.card.rl3-has-panel>.card-art{
   display:block!important;position:relative!important;
   grid-column:2!important;grid-row:1!important;
   width:100%!important;height:100%!important;
   min-height:255px!important;max-height:none!important;
   aspect-ratio:auto!important;
   align-self:stretch!important;justify-self:stretch!important;
   padding:0!important;overflow:hidden!important;
   background:#f3eaff;
   isolation:isolate;
 }
 #pronoun-cards .card-art>.l3-study-back,
 #pronoun-cards .card-art>.l3-study-front{
   display:block;position:absolute;left:0;width:100%;height:100%;
   pointer-events:none;z-index:0
 }
 #pronoun-cards .card-art>.l3-study-back{top:0}
 #pronoun-cards .card-art>.l3-study-front{top:0;z-index:2}
 #pronoun-cards.pronouns>.card.rl3-has-panel>.card-art>img{
   display:block!important;position:absolute!important;
   z-index:1!important;left:-7%!important;top:2%!important;right:auto!important;
   inset:auto!important;left:-7%!important;top:2%!important;
   width:114%!important;height:91%!important;max-height:none!important;
   min-height:0!important;padding:0!important;
   object-fit:contain!important;object-position:center 6%!important;
   filter:saturate(1.06);
   -webkit-mask-image:linear-gradient(to bottom,#000 0%,#000 55%,rgba(0,0,0,.97) 62%,transparent 91%);
   mask-image:linear-gradient(to bottom,#000 0%,#000 55%,rgba(0,0,0,.97) 62%,transparent 91%);
 }
 /* For group portraits, preserve every face while the decor fills the bottom. */
 #pronoun-cards>.card[data-say="Мы"]>.card-art>img,
 #pronoun-cards>.card[data-say="Вы"]>.card-art>img,
 #pronoun-cards>.card[data-say="Они"]>.card-art>img{
   width:124%!important;left:-12%!important;top:8%!important;
   height:84%!important;object-position:center 8%!important
 }
 #pronoun-cards>.card[data-say="Оно"]>.card-art>img{
   width:113%!important;left:-6%!important;top:3%!important;
   height:79%!important;object-fit:cover!important;
   -webkit-mask-image:linear-gradient(to bottom,#000 0%,#000 57%,transparent 95%);
   mask-image:linear-gradient(to bottom,#000 0%,#000 57%,transparent 95%);
 }
 #pronoun-cards.pronouns>.card.rl3-has-panel>.rl3-panel{
   grid-column:1/-1!important;grid-row:2!important;align-self:start;
   z-index:3;
 }
 #pronoun-cards.pronouns>.card.rl3-has-panel>.rl3-example-holder{
   grid-column:1/-1!important;grid-row:3!important;align-self:start;
   z-index:3;
 }
 @media(max-width:620px){
   #pronoun-cards.pronouns>.card.rl3-has-panel{
     grid-template-columns:minmax(0,1.05fr) minmax(0,.95fr)!important;
     grid-template-rows:auto auto auto!important;
   }
   #pronoun-cards.pronouns>.card.rl3-has-panel>.card-copy{
     padding:14px 10px 11px!important;
   }
   #pronoun-cards.pronouns>.card.rl3-has-panel>.card-copy>.ru{font-size:32px}
   #pronoun-cards.pronouns>.card.rl3-has-panel>.card-copy>.lat{font-size:17px}
   #pronoun-cards.pronouns>.card.rl3-has-panel>.card-copy>.zh{font-size:22px}
   #pronoun-cards.pronouns>.card.rl3-has-panel>.card-copy>.example{margin-top:13px!important;padding-top:10px!important;gap:5px}
   #pronoun-cards .card-copy>.example>.example-ru{font-size:17px;gap:2px}
   #pronoun-cards .card-copy>.example>.example-ru strong{font-size:17px}
   #pronoun-cards .card-copy>.example .example-lat,
   #pronoun-cards .card-copy>.example .example-zh{font-size:15px}
   #pronoun-cards .card-copy>.example .example-audio{
     flex-basis:28px;width:28px;height:28px;font-size:15px
   }
   #pronoun-cards.pronouns>.card.rl3-has-panel>.card-art{
     min-height:245px!important;height:100%!important;aspect-ratio:auto!important
   }
 }
 `;
 document.head.append(style);
 const backdrop = `<svg class="l3-study-back" viewBox="0 0 320 430" preserveAspectRatio="xMidYMid slice" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
 <defs><linearGradient id="l3paper" x2=".85" y2="1"><stop stop-color="#f5e4ff"/><stop offset="1" stop-color="#e4d1fa"/></linearGradient></defs>
 <rect width="320" height="430" fill="#f4e8ff"/>
 <circle cx="280" cy="82" r="115" fill="#fbe4f4" opacity=".85"/>
 <ellipse cx="70" cy="255" rx="128" ry="170" fill="#e6dafa" opacity=".45"/>
 <g transform="rotate(-10 82 133)" opacity=".85">
   <rect x="1" y="48" width="147" height="176" rx="10" fill="#fffefa" stroke="#d7bef4" stroke-width="3"/>
   <rect x="0" y="44" width="147" height="17" rx="5" fill="#f6d1e9"/>
   <g fill="#c0a1e8"><circle cx="17" cy="70" r="4"/><circle cx="17" cy="101" r="4"/><circle cx="17" cy="132" r="4"/><circle cx="17" cy="163" r="4"/><circle cx="17" cy="194" r="4"/></g>
   <g stroke="#e2d6f4" stroke-width="2"><path d="M33 80h96M33 104h96M33 128h96M33 152h96M33 176h96M33 200h96"/></g>
   <rect x="55" y="111" width="58" height="42" rx="12" fill="#c2a2f2" opacity=".7"/>
   <circle cx="70" cy="131" r="4" fill="white"/><circle cx="84" cy="131" r="4" fill="white"/><circle cx="98" cy="131" r="4" fill="white"/>
 </g>
 <g transform="translate(270,75)" fill="none" stroke="#baa0d8" stroke-width="3" stroke-linecap="round">
  <path d="M0 8C-10-7-15-19-5-26C5-33 12-15 0 8M0 8C13-5 26-9 29-1C35 12 14 22 0 8M0 8C-7 22-20 30-26 19C-31 7-10 1 0 8"/>
  <path d="M0 8v67"/><path d="M0 34c-20-12-25-7-29-1M0 58c18-16 28-12 32-5"/>
 </g>
 <path d="M254 22l4 11 12 2-9 8 2 12-10-6-10 6 3-12-9-8 13-2z" fill="#ffe2a7" opacity=".95"/>
 <path d="M35 253l3 7 8 1-6 6 2 8-7-4-7 4 2-8-6-6 8-1z" fill="#fff6cf"/>
 <circle cx="284" cy="262" r="7" fill="#fff" opacity=".65"/>
 </svg>`;
 const foreground = `<svg class="l3-study-front" viewBox="0 0 320 430" preserveAspectRatio="xMidYMid slice" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
 <defs><linearGradient id="l3desk" x1="0" x2="0" y1="0" y2="1"><stop stop-color="#fbf5ff"/><stop offset="1" stop-color="#e2d1f5"/></linearGradient></defs>
 <rect x="0" y="372" width="320" height="58" fill="url(#l3desk)"/>
 <path d="M0 374H320" stroke="#ccb5e7" stroke-width="3"/>
 <g transform="translate(190,305)">
  <rect x="6" y="63" width="123" height="27" rx="5" fill="#a18acb" opacity=".3"/>
  <rect x="10" y="49" width="126" height="25" rx="5" fill="#bfa8ea"/><rect x="15" y="52" width="118" height="20" rx="4" fill="#d9ccf6"/>
  <rect x="0" y="28" width="128" height="25" rx="5" fill="#dca4bb"/><rect x="5" y="31" width="119" height="18" rx="4" fill="#fbe4ef"/>
  <rect x="25" y="7" width="95" height="24" rx="4" fill="#9b8ade"/><rect x="28" y="11" width="89" height="17" rx="4" fill="#e2dfff"/>
  <path d="M33 18h64M21 40h95M23 61h100" stroke="#bba4d7" stroke-width="2" opacity=".7"/>
 </g>
 <g transform="translate(25 312)">
   <path d="M3 0L-7-45" stroke="#ca91b2" stroke-width="9"/><path d="M20-1L16-61" stroke="#818fd3" stroke-width="9"/>
   <path d="M32-3L44-51" stroke="#e9b65b" stroke-width="8"/><path d="M43-1L62-46" stroke="#ad87dd" stroke-width="8"/>
   <path d="M-7-44l0-11 8 10M16-62l-3-11 10 11M44-51l4-12 3 14M62-46l7-11-4 13" fill="#f9e5bf"/>
   <path d="M-9-1h62l-9 62H1z" fill="#a993e6" stroke="#8c71c8" stroke-width="3"/>
   <ellipse cx="22" cy="-1" rx="31" ry="7" fill="#d5bcfb"/>
 </g>
 <g transform="translate(105 377)">
  <path d="M0-9Q32-23 69-9Q104-23 136-9V27Q103 14 68 28Q31 14 0 27z" fill="#fffef8" stroke="#d7c9e8" stroke-width="3"/>
  <path d="M68-7V26M12 1Q34-7 56 3M83 3Q106-6 123 0M14 12Q38 5 54 14M82 15Q105 7 122 12" stroke="#dfd5ed" fill="none" stroke-width="2"/>
 </g>
 </svg>`;
 function setupScenes(){
   document.querySelectorAll('#pronoun-cards>.card[data-say]').forEach((card,index)=>{
     const copy=card.querySelector('.card-copy');
     const example=card.querySelector('.example');
     const art=card.querySelector('.card-art');
     if(!copy||!art) return;
     // Earlier pronunciation extension relocated this; put it back LEFT like ref.
     if(example&&example.parentNode!==copy) copy.appendChild(example);
     if(example) example.classList.remove('rl3-wide-example');
     if(!art.querySelector('.l3-study-back'))art.insertAdjacentHTML('afterbegin',backdrop);
     if(!art.querySelector('.l3-study-front'))art.insertAdjacentHTML('beforeend',foreground);
     art.style.setProperty('--study-hue',String(index*7)+'deg');
   });
 }
 if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',setupScenes,{once:true});
 else setupScenes();
})();
