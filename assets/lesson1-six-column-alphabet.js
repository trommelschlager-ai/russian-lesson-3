/* Lesson 1: six larger alphabet cards per row.
 * Preserves original banner artwork above the old baked-in 11-column grid,
 * local audio recordings, detailed letter cards and existing progress tracking.
 */
(()=>{
 "use strict";
 if(window.__lesson1SixColumnAlphabetLoaded)return;
 const letters=Array.from("АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ");
 const hero=document.querySelector(".page > .hero");
 const original=document.querySelector("#hotspots");
 const lesson=document.querySelector("#lessonList");
 if(letters.length!==33||!hero||!original||!lesson||!window.speak)return;
 if(original.querySelectorAll("button[data-letter]").length!==33)return;
 const style=document.createElement("style");
 style.setAttribute("data-lesson1-six-column","true");
 style.textContent="\n.page > .hero{width:100%;aspect-ratio:1536 / 305;height:auto!important;overflow:hidden!important;position:relative!important;background:#eff9ff}\n.page > .hero > img{position:absolute!important;inset:0 auto auto 0!important;display:block;width:100%!important;height:auto!important;max-width:none!important}\n.page > .hero > .hotspots{display:none!important}\n.alphabet-six-wrap{padding:clamp(8px,1.4vw,16px);background:linear-gradient(145deg,#fff9f6,#eff7ff 52%,#fff8e7);border-bottom:2px solid #e9ddea;line-height:1.2}\n.alphabet-six-grid{max-width:1250px;margin:auto;display:grid;grid-template-columns:repeat(12,minmax(0,1fr));gap:clamp(5px,.8vw,12px);align-items:stretch}\n.alphabet-six-grid .alphabet-six-card{grid-column:span 2;width:100%;min-width:0;height:clamp(78px,10.4vw,146px);padding:clamp(4px,.8vw,10px) 2px;border:2px solid #ffffffd9;border-radius:clamp(10px,1.4vw,18px);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:clamp(3px,.6vw,9px);box-shadow:0 4px 0 #30436922,0 6px 12px #20335216;cursor:pointer;font-family:Arial,\"Segoe UI\",\"Microsoft YaHei\",sans-serif;color:#142d55;text-align:center;-webkit-tap-highlight-color:transparent;transition:transform .12s ease,box-shadow .12s ease}\n.alphabet-six-grid .alphabet-six-card:nth-child(8n+1){background:linear-gradient(155deg,#ffcdd0,#ff7989)}\n.alphabet-six-grid .alphabet-six-card:nth-child(8n+2){background:linear-gradient(155deg,#d8efff,#a0d3ff)}\n.alphabet-six-grid .alphabet-six-card:nth-child(8n+3){background:linear-gradient(155deg,#e0ffd9,#a6e7ad)}\n.alphabet-six-grid .alphabet-six-card:nth-child(8n+4){background:linear-gradient(155deg,#efe0ff,#c6adfa)}\n.alphabet-six-grid .alphabet-six-card:nth-child(8n+5){background:linear-gradient(155deg,#fff0b7,#ffda7c)}\n.alphabet-six-grid .alphabet-six-card:nth-child(8n+6){background:linear-gradient(155deg,#d3f8fa,#92e0f0)}\n.alphabet-six-grid .alphabet-six-card:nth-child(8n+7){background:linear-gradient(155deg,#ffd9e8,#ffaecb)}\n.alphabet-six-grid .alphabet-six-card:nth-child(8n){background:linear-gradient(155deg,#e5e8ff,#adbdfa)}\n.alphabet-six-grid .alphabet-six-card:nth-child(31){grid-column:4 / span 2}\n.alphabet-six-card .alphabet-six-glyph{display:block;font-size:clamp(24px,4vw,52px);font-weight:950;line-height:1.06;white-space:nowrap;letter-spacing:-.025em}\n.alphabet-six-card .alphabet-six-audio{display:grid;place-items:center;width:clamp(26px,3.5vw,39px);height:clamp(26px,3.5vw,39px);flex:0 0 auto;border-radius:50%;color:#176ba8;font-size:clamp(15px,1.9vw,20px);background:linear-gradient(#fff,#f6faff);border:1px solid #fff;box-shadow:0 2px 5px #1649762a;line-height:1}\n.alphabet-six-grid .alphabet-six-card:active{transform:translateY(2px);box-shadow:0 2px 0 #30436922}\n.alphabet-six-grid .alphabet-six-card:focus-visible{outline:3px solid #203bb9;outline-offset:2px}\n@media(max-width:620px){.alphabet-six-wrap{padding:7px 6px 10px}.alphabet-six-grid{gap:5px}.alphabet-six-grid .alphabet-six-card{height:clamp(74px,19vw,94px);border-width:1px;border-radius:11px;padding:5px 0;gap:5px}.alphabet-six-card .alphabet-six-glyph{font-size:clamp(20px,5.2vw,29px)}.alphabet-six-card .alphabet-six-audio{width:25px;height:25px;font-size:15px}}\n";
 const nav=document.createElement("nav");
 nav.className="alphabet-six-wrap";
 nav.setAttribute("aria-label","Русский алфавит · 俄语字母表");
 const grid=document.createElement("div");
 grid.className="alphabet-six-grid";
 for(const letter of letters){
   const b=document.createElement("button");
   b.type="button";
   b.className="alphabet-six-card";
   b.dataset.letter=letter;
   b.setAttribute("aria-label","播放俄语字母 "+letter+" · Произнести букву "+letter);
   const glyph=document.createElement("span");
   glyph.className="alphabet-six-glyph";
   glyph.textContent=letter+letter.toLocaleLowerCase("ru-RU");
   const audio=document.createElement("span");
   audio.className="alphabet-six-audio";
   audio.textContent="🔊";
   audio.setAttribute("aria-hidden","true");
   b.append(glyph,audio);
   b.addEventListener("click",()=>window.speak(letter));
   grid.append(b);
 }
 nav.append(grid);
 hero.parentElement.insertBefore(nav,lesson);
 document.head.append(style);
 window.__lesson1SixColumnAlphabetLoaded=true;
})();
