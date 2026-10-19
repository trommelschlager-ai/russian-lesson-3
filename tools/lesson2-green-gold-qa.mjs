import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import http from "node:http";
import puppeteer from "puppeteer-core";
const html=await readFile("lesson-2-green-gold-preview.html","utf8");
assert.ok(html.includes("第二课"));
assert.ok(!html.includes("SpeechSynthesisUtterance"));
assert.equal((html.match(/"imageData":/g)||[]).length,10);
assert.ok(html.includes("svetlana-bdff791cbc88be0b.mp3"));
assert.ok(html.includes("svetlana-1ff492d4122f4c7a.mp3"));
const server=http.createServer((req,res)=>{if(req.url!=="/lesson-2-green-gold-preview.html"){res.writeHead(404).end();return;}res.writeHead(200,{"Content-Type":"text/html; charset=utf-8"});res.end(html)});
await new Promise(resolve=>server.listen(0,"127.0.0.1",resolve));
const url="http://127.0.0.1:"+server.address().port+"/lesson-2-green-gold-preview.html";
const browser=await puppeteer.launch({executablePath:process.env.CHROME_PATH||"/usr/bin/google-chrome",headless:true,args:["--no-sandbox","--disable-dev-shm-usage"]});
try{
 for(const width of [320,390,768,1440]){
  const page=await browser.newPage();const errors=[];
  page.on("pageerror",e=>errors.push(String(e)));
  await page.setViewport({width,height:880,isMobile:width<700,hasTouch:width<700});
  await page.evaluateOnNewDocument(()=>{
   class SpeechMock{
    start(){this.onstart?.();this.onresult?.({results:[[{transcript:window.__heard||"Мама"}]]});this.onend?.();}
    abort(){this.onend?.();}
   }
   window.SpeechRecognition=SpeechMock;window.webkitSpeechRecognition=SpeechMock;
   HTMLMediaElement.prototype.play=function(){return Promise.resolve();};
  });
  await page.goto(url,{waitUntil:"load",timeout:30000});
  const data=await page.evaluate(()=>({
   count:document.querySelectorAll(".card").length,
   buttons:document.querySelectorAll(".action").length,
   scroll:document.documentElement.scrollWidth,
   viewport:window.innerWidth,
   words:[...document.querySelectorAll(".word")].map(x=>x.textContent),
   photos:[...document.querySelectorAll(".photo")].map(x=>x.src.startsWith("data:image/webp;base64,")),
   roles:[...document.querySelectorAll(".kicker")].map(x=>x.textContent)
  }));
  assert.equal(data.count,10);assert.equal(data.buttons,30);
  assert.ok(data.scroll<=data.viewport+2,"horizontal overflow at "+width);
  assert.deepEqual(data.words,["МА́МА","ПА́ПА","ВОДА́","РУКА́","НОГА́","РЫ́БА","ЛИСА́","ПТИ́ЦА","ЕДА́","ЦВЕТО́К"]);
  assert.ok(data.photos.every(Boolean));
  assert.ok(data.roles[7].includes("斯韦特兰娜")&&data.roles[9].includes("斯韦特兰娜"));
  await page.click(".card:first-child .action.mic");
  await page.waitForFunction(()=>document.querySelector(".card:first-child .feedback").textContent.includes("识别文字一致"));
  assert.equal(await page.$eval("#num",e=>e.textContent),"1");
  await page.evaluate(()=>window.__heard="банан");await page.click(".card:first-child .action.mic");
  await page.waitForFunction(()=>document.querySelector(".card:first-child .feedback").textContent.includes("文字未匹配"));
  assert.equal(await page.$eval("#num",e=>e.textContent),"1");
  await page.click(".card:first-child .action.listen");
  assert.equal(await page.$eval("#player",e=>e.playbackRate),1);
  await page.click(".card:first-child .action.slow");
  assert.equal(await page.$eval("#player",e=>e.playbackRate),.8);
  await page.$eval(".card:nth-child(10)",e=>e.scrollIntoView());
  await page.waitForFunction(()=>document.querySelector(".card:nth-child(10) .photo").naturalWidth>0);
  assert.deepEqual(errors,[]);
  console.log("PASS lesson 2 green-gold "+width+"px: photos, MP3 controls, ten cards and microphone");
  await page.close();
 }
}finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
