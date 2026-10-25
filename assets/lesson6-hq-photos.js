/* Lesson 6 HQ imagery. Reuses existing full-resolution, lossless originals.
 * Only visual elements change. Audio, translation, buttons and exercises unchanged. */
(() => {
  "use strict";
  if (!document.body.classList.contains("lesson-6")) return;
  const root = "assets/lesson7-hq/";
  const imgPaths = {
    man: root + "man.webp",
    woman: root + "woman.webp",
    boy: "assets/illustrated/family-2.jpg",
    girl: "assets/illustrated/family-3.jpg"
  };
  function newImage(key, alt) {
    const img = document.createElement("img");
    img.className = "l6hq-img";
    img.src = imgPaths[key];
    img.alt = alt || "";
    img.loading = "lazy";
    img.decoding = "async";
    return img;
  }
  function mount(target, ids, label) {
    if (!target) return;
    const original = target.cloneNode(true);
    const keys = Array.isArray(ids) ? ids : [ids];
    const frame = document.createElement("span");
    frame.className = "l6hq-frame" + (keys.length > 1 ? " l6hq-pair" : "");
    frame.setAttribute("role","img");
    frame.setAttribute("aria-label", label || "");
    let fallback = false;
    keys.forEach(key => {
      const img = newImage(key, label);
      img.alt = "";
      img.addEventListener("error", () => {
        if (!fallback && frame.isConnected) {
          fallback = true;
          frame.replaceWith(original);
        }
      }, {once: true});
      frame.appendChild(img);
    });
    target.replaceWith(frame);
  }
  // Different role-specific pictures, preserving the lesson's existing text.
  const familyWords = {
    "родители": ["man", "woman"],
    "муж": "man",
    "жена": "woman",
    "дети": ["boy", "girl"],
    "друг": "man",
    "подруга": "woman"
  };
  document.querySelectorAll("#upgrade-words6-grid .extra-card").forEach(card => {
    const word = card.querySelector(".ru")?.textContent?.trim().toLowerCase();
    if (!word || !familyWords[word]) return;
    mount(card.querySelector(".extra-figure"), familyWords[word], word);
  });
  document.querySelectorAll("#extra-dialogue-6 img.extra-character").forEach(img => {
    const original = img.getAttribute("src") || "";
    const role = /dmitry/i.test(original) ? "man" : /svetlana/i.test(original) ? "woman" : null;
    if (!role) return;
    img.addEventListener("error", () => {if(img.src.indexOf(imgPaths[role])>=0)img.src=original}, {once: true});
    img.src = imgPaths[role];
    img.loading = "lazy";
    img.decoding = "async";
    img.width = 1254;
    img.height = 1254;
  });
  const sentences = {
    "Это мой брат.": "boy",
    "Это моя сестра.": "girl",
    "У меня есть брат.": "boy",
    "Это моя семья.": ["man", "woman"],
    "У меня нет детей.": ["boy", "girl"]
  };
  document.querySelectorAll("#upgrade-sentences6-grid .extra-dialogue-line").forEach(card => {
    const sentence = card.querySelector(".ru")?.textContent?.trim();
    if (!sentence || !sentences[sentence]) return;
    mount(card.querySelector(".upgrade-phrase-symbol"),sentences[sentence],sentence);
  });
})();