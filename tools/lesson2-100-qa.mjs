import assert from 'node:assert/strict';
import {readFile,stat} from 'node:fs/promises';
import path from 'node:path';
import http from 'node:http';
import puppeteer from 'puppeteer-core';
const html=await readFile('lesson-2-100-words.html','utf8');
const m=html.match(/const WORDS=(\[[^\n]*\]);/);assert.ok(m,'WORDS array');
const words=JSON.parse(m[1]);assert.equal(words.length,100);
assert.equal(new Set(words.map(w=>w.word.toLocaleLowerCase('ru-RU'))).size,100);
let photo=0,drawn=0;const bad=[];
for(let i=0;i<words.length;i++){
 const w=words[i];
 assert.equal(w.group,Math.floor(i/10)+1,'10 blocks of 10');
 assert.ok(w.parts.length===2||w.parts.length===3,'2 or 3 syllables: '+w.word);
 assert.equal(w.parts.join('').toLocaleLowerCase('ru-RU'),w.word.toLocaleLowerCase('ru-RU'));
 assert.ok(w.stress>=0&&w.stress<w.parts.length);
 assert.ok(w.zh.length>0&&w.emoji);
 assert.ok(w.url.endsWith('.mp3'));
 const filepath=w.url.startsWith('https://raw.githubusercontent.com/')?w.url.split('/course-recovery-2026-10-16/')[1]:w.url;
 try{assert.ok(filepath&&!filepath.includes('://'));const s=await stat(path.resolve(filepath));assert.ok(s.size>300,'nonempty MP3');}catch(e){bad.push(w.word+': '+w.url);}
 if(w.imageData.startsWith('data:image/webp;'))photo++;
 else if(w.imageData.startsWith('data:image/svg+xml;'))drawn++;
 else assert.fail('Unknown image source for '+w.word);
}
assert.deepEqual(bad,[],'All 100 MP3 must exist locally');
assert.equal(photo,10);assert.equal(drawn,90);
assert.ok(!html.includes('SpeechSynthesisUtterance'),'No robotic browser TTS');
const server=http.createServer((req,res)=>{if(req.url!=='/lesson-2-100-words.html'){res.writeHead(404).end();return;}res.writeHead(200,{'Content-Type':'text/html;charset=utf-8'});res.end(html)});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const url='http://127.0.0.1:'+server.address().port+'/lesson-2-100-words.html';
const browser=await puppeteer.launch({executablePath:process.env.CHROME_PATH||'/usr/bin/google-chrome',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
try{
 for(const width of [320,390,768,1440]){
  const page=await browser.newPage();const jsErrors=[];page.on('pageerror',e=>jsErrors.push(String(e)));
  await page.setViewport({width,height:850,isMobile:width<700,hasTouch:width<700});
  await page.evaluateOnNewDocument(()=>{
   class FakeSpeech{start(){this.onstart?.();this.onresult?.({results:[[{transcript:window.__heard||'Мама'}]]});this.onend?.();}abort(){this.onend?.();}}
   window.SpeechRecognition=FakeSpeech;window.webkitSpeechRecognition=FakeSpeech;
   HTMLMediaElement.prototype.play=function(){return Promise.resolve();};
  });
  await page.goto(url,{waitUntil:'load',timeout:30000});
  const data=await page.evaluate(()=>({
   cards:document.querySelectorAll('.card').length,
   nav:document.querySelectorAll('.jump a').length,
   sections:document.querySelectorAll('.group-title').length,
   buttons:document.querySelectorAll('.card .action').length,
   bodyW:document.documentElement.scrollWidth,viewport:innerWidth,
   labels:[...document.querySelectorAll('.card .word')].map(x=>x.textContent),
   firstPhoto:document.querySelector('.card .photo').naturalWidth,
   artSrc:document.querySelector('.card:nth-of-type(11) .photo')?.src.slice(0,20)||''
  }));
  assert.equal(data.cards,100);assert.equal(data.nav,100);assert.equal(data.sections,10);assert.equal(data.buttons,300);
  assert.ok(data.bodyW<=data.viewport+3,'no horizontal scrolling: '+width+' scroll '+data.bodyW);
  assert.equal(data.labels[0],'МА́МА');assert.equal(data.labels[9],'ЦВЕТО́К');
  assert.ok(data.labels[99].startsWith('Я'));
  await page.click('article.card:first-of-type .mic');
  await page.waitForFunction(()=>document.querySelector('article.card:first-of-type .feedback').textContent.includes('识别文字一致'));
  assert.equal(await page.$eval('#num',el=>el.textContent),'1');
  await page.evaluate(()=>window.__heard='банан');
  await page.click('article.card:first-of-type .mic');
  await page.waitForFunction(()=>document.querySelector('article.card:first-of-type .feedback').textContent.includes('文字未匹配'));
  assert.equal(await page.$eval('#num',el=>el.textContent),'1');
  await page.click('article.card:first-of-type .listen');assert.equal(await page.$eval('#player',x=>x.playbackRate),1);
  await page.click('article.card:first-of-type .slow');assert.equal(await page.$eval('#player',x=>x.playbackRate),.8);
  assert.deepEqual(jsErrors,[]);
  console.log('PASS 100-word green-gold lesson '+width+'px: 100 words, 100 audio files, 10 blocks, 300 controls, mock mic/audio and no horizontal overflow');
  await page.close();
 }
}finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
