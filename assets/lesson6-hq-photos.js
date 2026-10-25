/* Lesson 6: user-approved portrait and family image replacements.
 * The three new PNGs belong in assets/lesson6-approved/.
 * Only replaces a picture after it has loaded; the existing picture remains otherwise.
 * No audio, translations, lesson text or buttons are touched.
 */
(()=>{
  "use strict";
  if(!document.body.classList.contains("lesson-6"))return;
  const root="assets/lesson6-approved/";
  const original="assets/lesson7-hq/";
  const sources={
    man:root+"ivan.jpg",
    woman:root+"woman.jpg",
    family:root+"family.jpg",
    boy:"assets/illustrated/family-2.jpg",
    girl:"assets/illustrated/family-3.jpg"
  };
  const fallbacks={
    man:original+"man.webp",
    woman:original+"woman.webp",
    family:"assets/illustrated/lesson-6-hero.jpg",
    boy:"assets/illustrated/family-2.jpg",
    girl:"assets/illustrated/family-3.jpg"
  };
  const cache=new Map();
  function load(key){
    if(cache.has(key))return cache.get(key);
    const promise=new Promise(resolve=>{
      const a=new Image();a.onload=()=>resolve(sources[key]);a.onerror=()=>{
        const b=new Image();b.onload=()=>resolve(fallbacks[key]);b.onerror=()=>resolve(null);
        b.src=fallbacks[key];
      };a.src=sources[key];
    });
    cache.set(key,promise);return promise;
  }
  async function place(target,keys,label){
    if(!target)return;
    const chosen=Array.isArray(keys)?keys:[keys];
    const urls=await Promise.all(chosen.map(load));
    if(urls.some(u=>!u)||!target.isConnected)return;
    const frame=document.createElement("span");
    frame.className="l6hq-frame"+(chosen.length>1?" l6hq-pair":"");
    frame.setAttribute("role","img");
    frame.setAttribute("aria-label",label||"");
    const originalNode=target.cloneNode(true);
    let failed=false;
    for(const src of urls){
      const img=new Image();img.src=src;img.alt="";
      img.className="l6hq-img";img.decoding="async";img.loading="lazy";
      img.addEventListener("error",()=>{
        if(!failed&&frame.isConnected){failed=true;frame.replaceWith(originalNode);}
      },{once:true});
      frame.append(img);
    }
    target.replaceWith(frame);
  }
  const words={
    "родители":["man","woman"],
    "муж":"man","жена":"woman",
    "дети":["boy","girl"],"друг":"man","подруга":"woman"
  };
  document.querySelectorAll("#upgrade-words6-grid .extra-card").forEach(card=>{
    const key=card.querySelector(".ru")?.textContent.trim().toLowerCase();
    if(words[key])place(card.querySelector(".extra-figure"),words[key],key);
  });
  // Approved family group picture for the vocabulary word Семья.
  document.querySelectorAll("#extra-vocab-6 .extra-card").forEach(card=>{
    const key=card.querySelector(".ru")?.textContent.trim().toLowerCase();
    if(key==="семья")place(card.querySelector(".extra-figure-photo"),"family",key);
  });
  const sentenceArt={
    "Это мой брат.":"boy",
    "Это моя сестра.":"girl",
    "У меня есть брат.":"boy",
    "У меня нет детей.":["boy","girl"],
    "Я люблю свою семью.":"family",
    "Его зовут Иван.":"man",
    "Это моя семья.":"family"
  };
  document.querySelectorAll("#upgrade-sentences6-grid .extra-dialogue-line").forEach(card=>{
    const sentence=card.querySelector(".ru")?.textContent.trim();
    if(sentenceArt[sentence])place(card.querySelector(".upgrade-phrase-symbol"),sentenceArt[sentence],sentence);
  });
  document.querySelectorAll("#extra-dialogue-6 img.extra-character, #upgrade-dialogue6-grid img.extra-character, .lesson-6 .mobile-dialogue-line img").forEach(img=>{
    const source=img.getAttribute("src")||"";
    const label=img.getAttribute("alt")||"";
    const k=/dmitry/i.test(source+label)?"man":/svetlana/i.test(source+label)?"woman":null;
    if(k)place(img,k,label);
  });
})();