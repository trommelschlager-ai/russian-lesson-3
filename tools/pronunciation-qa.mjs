import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import puppeteer from 'puppeteer-core';

const root = process.cwd();
const mime = {'.html':'text/html; charset=utf-8','.js':'application/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.jpg':'image/jpeg','.jpeg':'image/jpeg','.png':'image/png','.mp3':'audio/mpeg','.json':'application/json'};
const server = http.createServer(async (req,res)=>{
  const url = new URL(req.url,'http://localhost');
  const rel = decodeURIComponent(url.pathname).replace(/^\/+/, '');
  const file = path.resolve(root,rel || 'index.html');
  if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
  try{
    const data=await fs.readFile(file);
    res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream'});
    res.end(data);
  }catch(_){res.writeHead(404).end();}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const base='http://127.0.0.1:'+server.address().port+'/';
const browser=await puppeteer.launch({executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
const page=await browser.newPage();
await page.setViewport({width:390,height:844,isMobile:true,deviceScaleFactor:1});
await page.evaluateOnNewDocument(()=>{
  class MockRecognition{
    start(){
      this.onstart?.();
      this.onresult?.({results:[[{transcript:window.__mockSpeech||'Привет!'}]]});
      this.onend?.();
    }
    abort(){this.onend?.();}
  }
  window.SpeechRecognition=MockRecognition;
  window.webkitSpeechRecognition=MockRecognition;
});
try{
  await page.goto(base+'pronunciation-practice.html',{waitUntil:'domcontentloaded'});
  await page.waitForSelector('.rc-fab');
  assert.equal(await page.$$eval('[data-sp-lesson]',nodes=>nodes.length),8);
  await page.click('[data-sp-lesson="4"]');
  await page.waitForSelector('.rc-shade.rc-visible');
  const ru=await page.$eval('.rc-word-ru',e=>e.textContent);
  assert.equal(ru,'Привет!');
  await page.click('.rc-mic');
  await page.waitForFunction(()=>document.querySelector('.rc-result').textContent.includes('一致'));
  await page.evaluate(()=>{window.__mockSpeech='Пока';});
  await page.click('.rc-mic');
  await page.waitForFunction(()=>document.querySelector('.rc-result').textContent.includes('不同'));
  await page.click('.rc-x');
  for(let n=1;n<=7;n++){
    await page.click('[data-sp-lesson="'+n+'"]');
    const shown=await page.$eval('.rc-word-ru',e=>e.textContent);
    assert.ok(shown,'Empty practice lesson '+n);
    await page.click('.rc-x');
  }
  const realLessons=[
    'russian_lesson_2_reading.html','lesson-3-pronouns-basic.html',
    'lesson-4-presentation-READY.html','lesson-5.html','lesson-6.html','lesson-7.html'
  ];
  for(const f of realLessons){
    await page.goto(base+f,{waitUntil:'domcontentloaded'});
    await page.waitForSelector('.rc-fab',{timeout:20000});
    await page.click('.rc-fab');
    await page.waitForSelector('.rc-shade.rc-visible');
    const options=await page.$$eval('#rc-word-choice option',els=>els.length);
    assert.ok(options>0,'No vocabulary: '+f);
    console.log('PASS: '+f+' | selectable items: '+options);
  }
  console.log('PASS: standalone 7 lessons + match/mismatch and 6 embedded trainers');
} finally {
  await browser.close();
  await new Promise(resolve=>server.close(resolve));
}
