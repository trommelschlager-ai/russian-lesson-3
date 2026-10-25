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

 // Keep all 4 original cards and audio in the document; only show 2 in the accepted design.
 // This avoids deleting the student's vocabulary or changing existing recording handlers.
 (()=>{
   if(window.__lesson1SingleLetterModeLoaded)return;
   const rows=Array.from(document.querySelectorAll("#lessonList > .letter-row"));
   const buttons=Array.from(document.querySelectorAll(".alphabet-six-grid > button[data-letter]"));
   const footer=document.querySelector(".page > .footer");
   if(rows.length!==33||buttons.length!==33||!footer)return;
   const colors=["#f52f51","#218def","#32ba78","#9765d9","#f1aa28","#0da9ac","#e64e84","#6679d8"];
   const washes=["#fff0f2","#edf6ff","#f2fff4","#faf0ff","#fff9e9","#edffff","#fff0f5","#f0f2ff"];
   const style=document.createElement("style");
   style.setAttribute("data-lesson1-single-letter","true");
   style.textContent="\nbody.lesson1-single-mode .alphabet-six-grid .alphabet-six-card[aria-current=\"true\"]{\n outline:3px solid #253b80;outline-offset:1px;\n box-shadow:0 3px 0 #29395242,0 0 0 5px #ffffffd9,0 8px 18px #394c704d;\n transform:translateY(-2px);\n}\nbody.lesson1-single-mode #lessonList{\n padding:clamp(12px,2vw,25px) clamp(8px,2vw,22px) 26px!important;\n background:linear-gradient(180deg,#f9fafc,#fff8f3);\n}\nbody.lesson1-single-mode #lessonList > .letter-row[hidden]{display:none!important;}\nbody.lesson1-single-mode #lessonList > .letter-row:not([hidden]){\n display:grid;\n grid-template-columns:1fr;\n gap:clamp(12px,1.8vw,22px);\n width:100%;\n max-width:1240px;\n margin:0 auto 20px!important;\n padding:clamp(13px,2.4vw,27px)!important;\n border:clamp(6px,.65vw,9px) solid var(--letter-outline,#f42a48)!important;\n border-radius:clamp(23px,3vw,32px)!important;\n background:linear-gradient(146deg,var(--letter-wash,#fff2f3),#fff 55%)!important;\n box-shadow:0 15px 29px #29334b21, inset 0 0 0 1px #ffffffce!important;\n overflow:hidden;\n scroll-margin-top:10px;\n}\nbody.lesson1-single-mode #lessonList .letter-row .left{\n display:grid!important;\n grid-template-columns:minmax(0,32%) minmax(0,1fr)!important;\n gap:clamp(8px,1.7vw,20px)!important;\n width:100%;\n min-width:0;\n}\nbody.lesson1-single-mode #lessonList .letter-row .big-letter{\n min-width:0;\n min-height:clamp(164px,33vw,290px)!important;\n border-radius:21px;\n box-shadow:0 11px 20px #25324d26;\n}\nbody.lesson1-single-mode #lessonList .letter-row .letter-text{\n font-size:clamp(56px,12vw,123px)!important;\n letter-spacing:-.06em!important;\n}\nbody.lesson1-single-mode #lessonList .letter-row .big-letter .speaker{\n width:clamp(49px,8vw,76px)!important;\n height:clamp(49px,8vw,76px)!important;\n font-size:clamp(21px,3vw,28px)!important;\n}\nbody.lesson1-single-mode #lessonList .letter-row .topline{\n grid-template-columns:minmax(0,27%) minmax(0,1fr)!important;\n gap:clamp(5px,1.4vw,14px)!important;\n}\nbody.lesson1-single-mode #lessonList .letter-row .cursive{\n min-width:0;\n height:clamp(65px,11vw,104px)!important;\n font-size:clamp(50px,9vw,78px)!important;\n}\nbody.lesson1-single-mode #lessonList .letter-row .right{\n padding:0!important;\n min-width:0;\n}\nbody.lesson1-single-mode #lessonList .letter-row .examples{\n display:grid!important;\n grid-template-columns:repeat(2,minmax(0,1fr))!important;\n gap:clamp(8px,1.6vw,18px)!important;\n}\nbody.lesson1-single-mode #lessonList .letter-row .examples > .ex:nth-child(n+3){\n display:none!important;\n}\nbody.lesson1-single-mode #lessonList .letter-row .ex{\n border:1px solid #e0e6ee!important;\n border-radius:19px!important;\n padding:clamp(8px,1vw,15px)!important;\n box-shadow:0 5px 13px #24375217!important;\n overflow:hidden;\n background:#fff;\n}\nbody.lesson1-single-mode #lessonList .letter-row .ex .photo{\n height:clamp(120px,19vw,230px)!important;\n object-fit:cover;\n border-radius:13px!important;\n}\nbody.lesson1-single-mode #lessonList .letter-row .ex .ex-word{\n font-size:clamp(17px,2.5vw,25px)!important;\n overflow-wrap:anywhere;\n white-space:normal!important;\n}\nbody.lesson1-single-mode #lessonList .letter-row .ex .speaker{\n width:clamp(41px,6vw,58px)!important;\n height:clamp(41px,6vw,58px)!important;\n font-size:clamp(17px,2.5vw,22px)!important;\n}\nbody.lesson1-single-mode #lessonList .letter-row .rl1-panel{\n border-radius:14px!important;\n background:#f4f8ff;\n padding:clamp(6px,.8vw,11px)!important;\n}\nbody.lesson1-single-mode #lessonList .letter-row .rl1-buttons{\n gap:clamp(3px,.5vw,7px)!important;\n}\nbody.lesson1-single-mode #lessonList .letter-row .rl1-buttons button{\n min-height:clamp(56px,7vw,70px)!important;\n border-radius:9px!important;\n}\nbody.lesson1-single-mode #lessonList .letter-row .section{\n border-radius:16px!important;\n padding:clamp(10px,1.4vw,15px)!important;\n margin-bottom:clamp(8px,1.4vw,16px)!important;\n background:linear-gradient(100deg,#fff0ab,#fff9e6)!important;\n}\nbody.lesson1-single-mode .alphabet-single-note{\n display:flex;align-items:center;justify-content:space-between;\n gap:10px;\n max-width:1240px;\n margin:9px auto 0;\n padding:10px 14px;\n color:#35426e;\n background:#fff;\n border-radius:14px;\n border:1px solid #ddd3ec;\n font:750 clamp(12px,2.5vw,16px)/1.4 Arial,\"Microsoft YaHei\",sans-serif;\n}\nbody.lesson1-single-mode .alphabet-single-note strong{color:#6f50ab}\nbody.lesson1-single-mode .footer .navbtn:disabled{opacity:.36;cursor:not-allowed}\nbody.lesson1-single-mode .footer .pageno{color:#122962}\n@media(max-width:620px){\n body.lesson1-single-mode #lessonList{padding:9px 7px 17px!important}\n body.lesson1-single-mode #lessonList > .letter-row:not([hidden]){\n  padding:11px!important;\n  border-width:6px!important;\n  border-radius:24px!important;\n  box-shadow:0 8px 17px #25334a20!important;\n  margin-bottom:12px!important;\n }\n body.lesson1-single-mode #lessonList .letter-row .left{grid-template-columns:minmax(0,31%) minmax(0,1fr)!important;gap:8px!important}\n body.lesson1-single-mode #lessonList .letter-row .big-letter{min-height:155px!important;border-radius:15px!important}\n body.lesson1-single-mode #lessonList .letter-row .letter-text{font-size:clamp(50px,12vw,74px)!important}\n body.lesson1-single-mode #lessonList .letter-row .big-letter .speaker{width:49px!important;height:49px!important}\n body.lesson1-single-mode #lessonList .letter-row .topline{grid-template-columns:minmax(0,30%) minmax(0,1fr)!important;gap:5px!important}\n body.lesson1-single-mode #lessonList .letter-row .sound-pill{font-size:12px!important;padding:5px 3px!important}\n body.lesson1-single-mode #lessonList .letter-row .cursive{height:61px!important;font-size:clamp(43px,10vw,57px)!important}\n body.lesson1-single-mode #lessonList .letter-row .examples{gap:7px!important}\n body.lesson1-single-mode #lessonList .letter-row .ex{padding:7px 5px!important;border-radius:13px!important}\n body.lesson1-single-mode #lessonList .letter-row .ex .photo{height:clamp(105px,27vw,149px)!important}\n body.lesson1-single-mode #lessonList .letter-row .ex .ex-word{font-size:clamp(14px,4.2vw,20px)!important}\n body.lesson1-single-mode #lessonList .letter-row .rl1-buttons button{font-size:9px!important;min-height:53px!important}\n body.lesson1-single-mode .footer{grid-template-columns:1fr 1fr!important;gap:7px!important}\n body.lesson1-single-mode .footer .pageno{grid-column:1/-1!important;order:-1}\n body.lesson1-single-mode .footer .navbtn{height:49px!important;font-size:14px!important}\n body.lesson1-single-mode .alphabet-single-note{margin:7px 7px 0;padding:7px 10px}\n}";
   const info=document.createElement("div");
   info.className="alphabet-single-note";
   const guide=document.createElement("span");
   guide.textContent="👇 选择字母，查看两个例词";
   const num=document.createElement("strong");
   num.setAttribute("aria-live","polite");
   info.append(guide,num);
   document.querySelector("#lessonList").before(info);
   const prev=footer.querySelector(".prev");
   const next=footer.querySelector(".next");
   const pageno=footer.querySelector(".pageno");
   if(prev){prev.removeAttribute("onclick");prev.textContent="◀ 上一个字母";}
   if(next){next.removeAttribute("onclick");next.textContent="下一个字母 ▶";}
   let current=0;
   function select(index,scroll){
     if(!Number.isInteger(index)||index<0||index>=rows.length)return;
     current=index;
     rows.forEach((row,i)=>{
       row.hidden=i!==index;
       row.style.setProperty("--letter-outline",colors[i%colors.length]);
       row.style.setProperty("--letter-wash",washes[i%washes.length]);
       row.setAttribute("aria-label","第 "+(i+1)+" 个俄语字母 "+buttons[i].dataset.letter);
     });
     buttons.forEach((btn,i)=>{
       if(i===index)btn.setAttribute("aria-current","true");
       else btn.removeAttribute("aria-current");
     });
     if(pageno)pageno.textContent=(index+1)+" / 33";
     if(prev)prev.disabled=index===0;
     if(next)next.disabled=index===32;
     num.textContent=(index+1)+" / 33 · "+buttons[index].dataset.letter;
     if(scroll)rows[index].scrollIntoView({behavior:"smooth",block:"start"});
   }
   buttons.forEach((btn,i)=>btn.addEventListener("click",()=>select(i,true)));
   if(prev)prev.addEventListener("click",()=>buttons[current-1]?.click());
   if(next)next.addEventListener("click",()=>buttons[current+1]?.click());
   document.body.classList.add("lesson1-single-mode");
   document.head.append(style);
   const hashMatch=location.hash.match(/^#letter-(\d+)$/);
   const initial=hashMatch?Math.max(0,Math.min(32,Number(hashMatch[1])-1)):0;
   select(initial,false);
   window.__lesson1SingleLetterModeLoaded=true;
 })();
})();
