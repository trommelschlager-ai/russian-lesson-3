import assert from 'node:assert/strict';
import {readFile,stat,mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
import http from 'node:http';
import puppeteer from 'puppeteer-core';
const html=await readFile('lesson-2-syllables-preview.html','utf8');
const sources=[...html.matchAll(/audio:'([^']+)'/g)].map(x=>x[1]);
assert.equal(sources.length,10,'Exactly ten MP3 recordings required');
for(const file of sources){const resolved=path.resolve(file);assert.ok(resolved.startsWith(process.cwd()+path.sep));assert.ok((await stat(resolved)).size>1000);}
assert.ok(!html.includes('SpeechSynthesisUtterance'),'Do not restore robotic syllable audio');
assert.ok(!html.includes('id="next"'),'Next button must be removed');
assert.ok(!html.includes('id="prev"'),'Previous button must be removed');
const server=http.createServer(async(req,res)=>{
 try{
 const name=new URL(req.url,'http://localhost').pathname.replace(/^\/+/,'');
 const target=path.resolve(name||'lesson-2-syllables-preview.html');
 if(!target.startsWith(process.cwd()+path.sep)){res.writeHead(403).end();return;}
 const buf=await readFile(target);res.writeHead(200,{'Content-Type':target.endsWith('.mp3')?'audio/mpeg':'text/html; charset=utf-8'});res.end(buf);
 }catch{res.writeHead(404).end();}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const base='http://127.0.0.1:'+server.address().port+'/lesson-2-syllables-preview.html';
const browser=await puppeteer.launch({executablePath:process.env.CHROME_PATH||'/usr/bin/google-chrome',headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--autoplay-policy=no-user-gesture-required']});
await mkdir('qa-lesson2-vertical',{recursive:true});
try{
 for(const width of [320,390,768,1280]){
   const page=await browser.newPage();const errors=[],failedResources=[];
   page.on('pageerror',e=>errors.push(String(e)));
   page.on('response',r=>{if(r.url().startsWith('http://127.0.0.1:') && r.status()>=400)failedResources.push(r.status()+' '+r.url());});
   await page.setViewport({width,height:844,isMobile:width<700,hasTouch:width<700,deviceScaleFactor:1});
   await page.evaluateOnNewDocument(()=>{
     class FakeSpeech{
       start(){this.onstart?.();this.onresult?.({results:[[{transcript:window.__testSpeechText||'Мама'}]]});this.onend?.();}
       abort(){this.onend?.();}
     }
     window.SpeechRecognition=FakeSpeech;window.webkitSpeechRecognition=FakeSpeech;
   });
   await page.goto(base,{waitUntil:'load',timeout:30000});
   const view=await page.evaluate(()=>{
     const cards=[...document.querySelectorAll('.word-card')];
     const box=x=>{const r=x.getBoundingClientRect();return{left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width}};
     return {count:cards.length,
       words:cards.map(x=>x.querySelector('.word').textContent),
       cardPositions:cards.map(x=>box(x)),
       logos:cards.map(x=>!!x.querySelector('.art svg')),
       actions:cards.map(x=>[...x.querySelectorAll('.action')].map(box)),
       syllables:cards.map(x=>[...x.querySelectorAll('.syl')].map(s=>s.textContent)),
       pageWidth:document.documentElement.scrollWidth,viewport:innerWidth,
       viewportHeight:innerHeight,pageHeight:document.documentElement.scrollHeight,
       next:!!document.querySelector('#next,#prev,.nav-btn,.step')
     };
   });
   assert.equal(view.count,10,'All 10 words must appear at once');
   assert.deepEqual(view.words,['МА́МА','ПА́ПА','ВОДА́','РУКА́','НОГА́','ПРИВЕ́Т','БАНА́Н','АРБУ́З','МОЛОКО́','МАШИ́НА']);
   assert.deepEqual(view.syllables[5],['ПРИ','ВЕ́Т']);
   assert.deepEqual(view.syllables[8],['МО','ЛО','КО́']);
   assert.deepEqual(view.syllables[9],['МА','ШИ́','НА']);
   assert.ok(view.logos.every(Boolean),'10 illustrations should render');
   assert.ok(!view.next,'Remove next/previous controls');
   assert.ok(view.cardPositions.every((c,i)=>i===0||c.top>view.cardPositions[i-1].top),'Cards need to stack vertically');
   assert.ok(view.pageHeight>view.viewportHeight*2,'Long page needs natural scrolling');
   assert.ok(view.pageWidth<=view.viewport+2,'No horizontal overflow at '+width);
   assert.ok(view.cardPositions.every(c=>c.left>=-1&&c.right<=width+1),'Word cards fit');
   assert.ok(view.actions.every(group=>group.length===3&&group.every(a=>a.left>=-1&&a.right<=width+1&&a.width>50)),'Three buttons fit in each card');
   await page.screenshot({path:'qa-lesson2-vertical/lesson2-'+width+'px.png',fullPage:false});
   await page.click('.word-card:first-child .syl:last-child');
   assert.equal(await page.$eval('.word-card:first-child .syl:last-child',el=>el.getAttribute('aria-pressed')),'true');
   await page.click('.word-card:first-child .action.mic');
   await page.waitForFunction(()=>document.querySelector('.word-card:first-child .feedback').textContent.includes('✅'));
   assert.equal(await page.$eval('#progress-label',el=>el.textContent),'1 / 10');
   await page.evaluate(()=>{window.__testSpeechText='арбуз';});
   await page.click('.word-card:first-child .action.mic');
   await page.waitForFunction(()=>document.querySelector('.word-card:first-child .feedback').textContent.includes('❌'));
   assert.equal(await page.$eval('#progress-label',el=>el.textContent),'1 / 10');
   let [response]=await Promise.all([page.waitForResponse(r=>r.url().includes('svetlana-2ccfed8bd93ea3ac.mp3'),{timeout:15000}),page.click('.word-card:first-child .action.listen')]);
   assert.equal(response.status(),200,'Original MP3 should load');
   assert.equal(await page.$eval('#player',x=>x.playbackRate),1);
   [response]=await Promise.all([page.waitForResponse(r=>r.url().includes('svetlana-2ccfed8bd93ea3ac.mp3'),{timeout:15000}),page.click('.word-card:first-child .action.slow')]);
   assert.equal(response.status(),200,'Slowed MP3 should load');
   assert.equal(await page.$eval('#player',x=>x.playbackRate),.8);
   [response]=await Promise.all([page.waitForResponse(r=>r.url().includes('svetlana-76455a1de03b74f0.mp3'),{timeout:15000}),page.click('.word-card:nth-child(9) .action.listen')]);
   assert.equal(response.status(),200,'Milk MP3 should load from ninth card');
   await page.waitForFunction(()=>document.querySelector('#player').currentSrc.includes('svetlana-76455a1de03b74f0.mp3'),{timeout:10000});
   assert.deepEqual(errors,[],'Uncaught JavaScript errors');
   assert.deepEqual(failedResources,[],'Missing local resources');
   await writeFile('qa-lesson2-vertical/lesson2-'+width+'.json',JSON.stringify(view,null,2));
   console.log('PASS vertical lesson 2 '+width+'px: 10 stacked cards, 30 buttons, real audio x1/x0.8, speech recognition mock match/mismatch, no overflow');
   await page.close();
 }
}finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
