import assert from 'node:assert/strict';
import {readFile,stat} from 'node:fs/promises';
import path from 'node:path';
import http from 'node:http';
import puppeteer from 'puppeteer-core';

const html=await readFile('lesson-2-syllables-preview.html','utf8');
const sources=[...html.matchAll(/audio:'([^']+)'/g)].map(x=>x[1]);
assert.equal(sources.length,10,'All ten words need existing MP3 recordings');
for(const file of sources){const p=path.resolve(file);assert.ok(p.startsWith(process.cwd()+path.sep));assert.ok((await stat(p)).size>1000,'Missing MP3 '+file);}
assert.ok(!html.includes('SpeechSynthesisUtterance'),'Robot syllable TTS must not be used');
assert.ok(!html.includes('speechSynthesis.speak'),'Robot syllable TTS must not be used');
const server=http.createServer(async (req,res)=>{
 try{const name=new URL(req.url,'http://localhost').pathname.replace(/^\/+/,'');const target=path.resolve(name||'lesson-2-syllables-preview.html');
 if(!target.startsWith(process.cwd()+path.sep))return res.writeHead(403).end();
 const buf=await readFile(target);res.writeHead(200,{'Content-Type':target.endsWith('.mp3')?'audio/mpeg':'text/html;charset=utf-8'});res.end(buf);}
 catch{res.writeHead(404).end();}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const url='http://127.0.0.1:'+server.address().port+'/lesson-2-syllables-preview.html';
const browser=await puppeteer.launch({executablePath:process.env.CHROME_PATH||'/usr/bin/google-chrome',headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--autoplay-policy=no-user-gesture-required']});
try{
for(const width of [320,390,768,1280]){
 const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.setViewport({width,height:844,isMobile:width<700,hasTouch:width<700,deviceScaleFactor:1});
 await page.evaluateOnNewDocument(()=>{
 class FakeSpeech{
 start(){this.onstart?.();this.onresult?.({results:[[{transcript:window.__testSpeechText||'Мама'}]]});this.onend?.();}
 abort(){this.onend?.();}
 }
 window.SpeechRecognition=FakeSpeech;window.webkitSpeechRecognition=FakeSpeech;
 });
 await page.goto(url,{waitUntil:'load'});
 const initial=await page.evaluate(()=>{
 const box=document.querySelector('.card').getBoundingClientRect();
 const controls=[...document.querySelectorAll('.control')].map(e=>{const r=e.getBoundingClientRect();return {left:r.left,right:r.right,width:r.width};});
 return {cardCount:document.querySelectorAll('.card').length,word:document.querySelector('#word').textContent,
 chips:[...document.querySelectorAll('.syl')].map(x=>x.textContent),
 width:document.documentElement.scrollWidth,viewport:innerWidth,
 actions:controls,artReady:!!document.querySelector('#illustration svg'),steps:document.querySelectorAll('.step').length,
 cardBounds:{left:box.left,right:box.right}};
 });
 assert.equal(initial.cardCount,1,'Must show one spacious learning card');
 assert.equal(initial.word,'МА́МА');
 assert.deepEqual(initial.chips,['МА́','МА']);assert.equal(initial.steps,10);
 assert.ok(initial.artReady,'Vector illustration missing');
 assert.ok(initial.width<=initial.viewport+2,'Page horizontal scroll');
 assert.ok(initial.cardBounds.left>=0 && initial.cardBounds.right<=width+1,'Card clipped at width '+width);
 assert.ok(initial.actions.every(x=>x.left>=0 && x.right<=width+1 && x.width>50),'Buttons clipped');
 await page.click('.syl:last-child'); assert.equal(await page.$eval('.syl:last-child',x=>x.getAttribute('aria-pressed')),'true','Syllable tap should highlight, not synthesize');
 await page.click('#mic');await page.waitForFunction(()=>document.querySelector('#feedback').textContent.includes('✅'));
 assert.equal(await page.$eval('#progress-label',x=>x.textContent),'1 / 10');
 await page.evaluate(()=>window.__testSpeechText='арбуз');await page.click('#mic');
 await page.waitForFunction(()=>document.querySelector('#feedback').textContent.includes('❌'));
 assert.equal(await page.$eval('#progress-label',x=>x.textContent),'1 / 10');
 let [resp]=await Promise.all([page.waitForResponse(x=>x.url().includes('svetlana-2ccfed8bd93ea3ac.mp3')),page.click('#listen')]);
 assert.equal(resp.status(),200,'Normal word audio');
 assert.equal(await page.$eval('#player',x=>x.playbackRate),1);
 [resp]=await Promise.all([page.waitForResponse(x=>x.url().includes('svetlana-2ccfed8bd93ea3ac.mp3')),page.click('#slow')]);
 assert.equal(resp.status(),200,'Slow MP3 audio');
 assert.equal(await page.$eval('#player',x=>x.playbackRate),.8);
 await page.click('#next');assert.equal(await page.$eval('#word',x=>x.textContent),'ПА́ПА');
 await page.click('.step:nth-child(6)');
 assert.equal(await page.$eval('#word',x=>x.textContent),'ПРИВЕ́Т');
 assert.deepEqual(await page.$$eval('.syl',xs=>xs.map(x=>x.textContent)),['ПРИ','ВЕ́Т']);
 await page.click('.step:nth-child(9)');assert.equal(await page.$eval('#word',x=>x.textContent),'МОЛОКО́');
 assert.deepEqual(await page.$$eval('.syl',xs=>xs.map(x=>x.textContent)),['МО','ЛО','КО́']);
 assert.deepEqual(errors,[],'JavaScript page errors');
 console.log('PASS clean-lesson2 '+width+'px | 10 words, 1 card, no overflow, mp3 1.0 + 0.8, mock speech yes/no, stress, navigation');
 await page.close();
}
}finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
