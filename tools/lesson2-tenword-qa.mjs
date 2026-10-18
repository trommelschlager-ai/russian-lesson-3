import assert from 'node:assert/strict';
import {readFile,stat} from 'node:fs/promises';
import path from 'node:path';
import http from 'node:http';
import puppeteer from 'puppeteer-core';

const html=await readFile('lesson-2-syllables-preview.html','utf8');
const sources=[...html.matchAll(/audio:'([^']+)'/g)].map(m=>m[1]);
assert.equal(sources.length,10,'Ten words need ten real MP3 recordings');
for(const file of sources){
  const p=path.resolve(file);
  assert.ok(p.startsWith(process.cwd()+path.sep));
  const s=await stat(p);assert.ok(s.size>1000,'Missing or empty MP3: '+file);
}
const server=http.createServer(async (req,res)=>{
  try{
    const loc=new URL(req.url,'http://localhost').pathname.replace(/^\/+/,'');
    const target=path.resolve(loc||'lesson-2-syllables-preview.html');
    if(!target.startsWith(process.cwd()+path.sep))return res.writeHead(403).end();
    const data=await readFile(target);
    const mime=target.endsWith('.mp3')?'audio/mpeg':target.endsWith('.html')?'text/html; charset=utf-8':'application/octet-stream';
    res.writeHead(200,{'Content-Type':mime});res.end(data);
  }catch{res.writeHead(404).end();}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const url='http://127.0.0.1:'+server.address().port+'/lesson-2-syllables-preview.html';
const browser=await puppeteer.launch({executablePath:process.env.CHROME_PATH||'/usr/bin/google-chrome',headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--autoplay-policy=no-user-gesture-required']});
try{
  for(const width of [390,320,1280]){
    const page=await browser.newPage();
    const errors=[];page.on('pageerror',e=>errors.push(String(e)));
    await page.setViewport({width,height:844,isMobile:width<700,hasTouch:width<700});
    await page.evaluateOnNewDocument(()=>{
      class FakeSpeech {
        start(){
          this.onstart?.();
          this.onresult?.({results:[[{transcript:window.__testSpeechText || 'Мама'}]]});
          this.onend?.();
        }
        abort(){this.onend?.();}
      }
      window.SpeechRecognition=FakeSpeech;window.webkitSpeechRecognition=FakeSpeech;
    });
    await page.goto(url,{waitUntil:'load'});
    const data=await page.evaluate(()=>({
      count:document.querySelectorAll('.word-card').length,
      syllables:[...document.querySelectorAll('.word-card')].map(x=>[...x.querySelectorAll('button.syl')].map(a=>a.childNodes[0].textContent)),
      ru:[...document.querySelectorAll('.ru-word')].map(x=>x.textContent),
      bodyWidth:document.documentElement.scrollWidth,
      viewport:innerWidth,
      brokenImgs:[...document.images].filter(x=>x.complete && !x.naturalWidth).length,
      feedbacks:document.querySelectorAll('.feedback').length
    }));
    assert.equal(data.count,10);
    assert.deepEqual(data.syllables[5],['ПРИ','ВЕ́Т']);
    assert.deepEqual(data.syllables[6],['БА','НА́Н']);
    assert.deepEqual(data.syllables[8],['МО','ЛО','КО́']);
    assert.deepEqual(data.syllables[9],['МА','ШИ́','НА']);
    assert.ok(data.bodyWidth<=data.viewport+3,'Horizontal scroll: '+width+' '+data.bodyWidth);
    await page.click('.word-card:first-child .action.mic');
    await page.waitForFunction(()=>document.querySelector('.word-card:first-child .feedback').textContent.includes('✅'));
    await page.evaluate(()=>{window.__testSpeechText='арбуз';});
    await page.click('.word-card:first-child .action.mic');
    await page.waitForFunction(()=>document.querySelector('.word-card:first-child .feedback').textContent.includes('❌'));
    assert.equal(await page.$eval('#progress-label',el=>el.textContent),'已练习 1 / 10');
    const [audioResponse]=await Promise.all([page.waitForResponse(resp=>resp.url().includes('1ba336d42a62d39b66.mp3'),{timeout:15000}),page.click('.word-card:first-child .action.listen')]);
    assert.equal(audioResponse.status(),200,'Whole-word MP3 should load successfully');
    assert.deepEqual(errors,[],'JS errors on viewport '+width);
    console.log('PASS lesson2-10card viewport '+width+' cards='+data.count+' audio=loaded mic=match+mismatch no-horizontal-scroll');
    await page.close();
  }
}finally{
 await browser.close();await new Promise(resolve=>server.close(resolve));
}
