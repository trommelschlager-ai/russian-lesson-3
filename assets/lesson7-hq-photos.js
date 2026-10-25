/* Lesson 7 visual refresh (2026-10-25).
   Full-resolution, lossless originals in assets/lesson7-hq/.
   Does not change lesson copy, audio, buttons, or tests. */
(()=>{
"use strict";
if(!document.body.classList.contains("lesson-7"))return;
const dir="assets/lesson7-hq/";
const names={ "завтрак":"breakfast","обед":"lunch","ужин":"dinner",
 "работа":"study","учёба":"study","отдых":"rest","домой":"home" };
function picture(target,key,kind,label){
 if(!target||!key)return;
 const img=document.createElement("img");
 img.className="l7hq-picture l7hq-"+kind;
 img.src=dir+key+".webp";
 img.alt=label||"";
 img.loading="lazy";
 img.decoding="async";
 img.width=1254;img.height=1254;
 const fallback=target.cloneNode(true);
 img.onerror=()=>{if(img.isConnected)img.replaceWith(fallback)};
 target.replaceWith(img);
}
document.querySelectorAll("#upgrade-words7-grid .upgrade-word").forEach(card=>{
 const name=card.querySelector(".ru")?.textContent.trim().toLowerCase();
 const target=card.querySelector(".upgrade-emoji");
 if(names[name]&&target)picture(target,names[name],"word",name);
});
const actions=[
 [/возвращаюсь домой/, "home"],
 [/гуляю/, "walk"],
 [/ужинаю/, "dinner"],
 [/обедаю/, "lunch"],
 [/иду на работу/, "study"],
 [/ложусь спать/, "rest"]
];
document.querySelectorAll("#upgrade-actions7-grid .upgrade-action").forEach(card=>{
 const title=card.querySelector(".ru")?.textContent||"";
 const match=actions.find(([pattern])=>pattern.test(title));
 const target=card.querySelector(".upgrade-action-heading > span");
 if(match&&target)picture(target,match[1],"action",title);
});
document.querySelectorAll(".day-dialogue-character").forEach(img=>{
 const src=img.getAttribute("src")||"";
 let key=/dmitry/i.test(src)?"man":/svetlana/i.test(src)?"woman":null;
 if(!key)return;
 const orig=img.getAttribute("src");
 img.addEventListener("error",()=>{if(img.getAttribute("src")!==orig)img.src=orig},{once:true});
 img.src=dir+key+".webp";
 img.loading="lazy";img.decoding="async";
 img.width=1254;img.height=1254;
});
})();