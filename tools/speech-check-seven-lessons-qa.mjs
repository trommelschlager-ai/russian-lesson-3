// Exercises the embedded pronunciation trainer in every lesson, sequentially.
// Speech is mocked for deterministic UI tests; this is not acoustic/phonetic validation.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import puppeteer from 'puppeteer-core';

const root=process.cwd();
const lessons=[
  ['1. Alphabet','russian_lesson_1_COMPLETE.html'],
  ['2. Reading','russian_lesson_2_reading.html'],
  ['3. Pronouns','lesson-3-pronouns-basic.html'],
  ['4. Greetings','lesson-4-presentation-READY.html'],
  ['5. Numbers and time','lesson-5.html'],
  ['6. Family','lesson-6.html'],
  ['7. My day','lesson-7.html']
];
const mime={'.html':'text/html; charset=utf-8','.js':'application/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.jpg':'image/jpeg','.png':'image/png','.mp3':'audio/mpeg','.svg':'image/svg+xml'};
const server=http.createServer(async(req,res)=>{
  const url=new URL(req.url,'http://localhost');
  const file=path.resolve(root,decodeURIComponent(url.pathname).replace(/^\/+/, '')||'index.html');
  if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
  try{const data=await fs.readFile(file);res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream'}).end(data);}
  catch{res.writeHead(404).end();}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const base='http://127.0.0.1:'+server.address().port+'/';
const browser=await puppeteer.launch({executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--autoplay-policy=no-user-gesture-required']});
let total=0;
try{
 for(const viewport of [{width:390,height:844},{width:320,height:640}]){
   for(const [name,filename] of lessons){
     const page=await browser.newPage();
     await page.setViewport({...viewport,deviceScaleFactor:1,isMobile:true,hasTouch:true});
     const errors=[];
     page.on('pageerror',e=>errors.push(String(e)));
     await page.evaluateOnNewDocument(()=>{
       class MockSpeechRecognition {
         start(){
           this.onstart?.();
           const text=window.__simulatedWrongWord ? 'другое слово' : document.querySelector('.rc-word-ru')?.textContent || 'Привет';
           this.onresult?.({results:[[{transcript:text}]]});
           this.onend?.();
         }
         abort(){this.onend?.();}
       }
       window.SpeechRecognition=MockSpeechRecognition;
       window.webkitSpeechRecognition=MockSpeechRecognition;
     });
     try{
       const response=await page.goto(base+filename,{waitUntil:'domcontentloaded',timeout:35000});
       assert.equal(response?.status(),200,'HTML failed to load');
       await page.waitForSelector('.rc-fab',{timeout:25000});
       const buttonText=await page.$eval('.rc-fab',e=>e.textContent);
       assert.ok(buttonText.includes('🎤'),'Floating mic button missing');
       await page.click('.rc-fab');
       await page.waitForSelector('.rc-shade.rc-visible');
       const options=await page.$$eval('#rc-word-choice option',els=>els.length);
       assert.ok(options>0,'No practice choices');
       const target=await page.$eval('.rc-word-ru',el=>el.textContent.trim());
       assert.ok(target.length>0,'Empty practice word');
       const panel=await page.$eval('.rc-panel',el=>{const b=el.getBoundingClientRect();return {top:b.top,bottom:b.bottom,left:b.left,right:b.right,height:b.height};});
       assert.ok(panel.top>=-2&&panel.bottom<=viewport.height+2,'Modal overflows screen vertically: '+JSON.stringify(panel));
       assert.ok(panel.left>=-2&&panel.right<=viewport.width+2,'Modal overflows screen horizontally: '+JSON.stringify(panel));
       await page.click('.rc-mic');
       await page.waitForFunction(()=>document.querySelector('.rc-result').dataset.state==='success');
       const success=await page.$eval('.rc-result',el=>el.innerText);
       assert.ok(success.includes('✅'),'Success glyph missing');
       await page.evaluate(()=>window.__simulatedWrongWord=true);
       await page.click('.rc-mic');
       await page.waitForFunction(()=>document.querySelector('.rc-result').dataset.state==='mismatch');
       const failure=await page.$eval('.rc-result',el=>el.innerText);
       assert.ok(failure.includes('❌'),'Mismatch glyph missing');
       await page.click('.rc-listen');
       if(name.startsWith('1.')){
         // Verify every alphabet word offered in this speaking practice uses natural MP3.
         const missingAlphabet=[];
         for(let k=0;k<options;k++){
           await page.select('#rc-word-choice',String(k));
           await page.click('.rc-listen');
           const source=await page.evaluate(()=>{
             const player=document.querySelector('audio[data-lesson-player]');
             return player?.getAttribute('src')||player?.currentSrc||'';
           });
           const word=await page.$eval('.rc-word-ru',el=>el.textContent.trim());
           console.log('ALPHABET_ITEM '+word+' => '+source);
           if(!source.includes('alphabet-natural/'))missingAlphabet.push(word);
         }
         assert.deepEqual(missingAlphabet,[],'No native alphabet MP3 for these words');
       }else{
         const src=await page.evaluate(()=>{
           const player=document.querySelector('audio[data-course-player]');
           return player?.getAttribute('src')||'';
         });
         assert.ok(src.includes('.mp3'),'Course MP3 did not start: '+src);
       }
       assert.deepEqual(errors,[],'Uncaught browser errors');
       console.log('PASS '+viewport.width+'×'+viewport.height+' '+name+' | choices='+options+
         ' | matched+rejected correct | native MP3 | mobile dialog fits');
       total++;
     }finally{await page.close();}
   }
 }
 console.log('PASS TOTAL '+total+'/14 seven lessons tested in order at two mobile sizes');
}finally{
 await browser.close();
 await new Promise(resolve=>server.close(resolve));
}
