import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import puppeteer from 'puppeteer-core';

const ROOT=process.cwd();
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.webp':'image/webp','.jpg':'image/jpeg','.png':'image/png','.mp3':'audio/mpeg'};
const server=http.createServer(async(req,res)=>{
 try{
  const url=new URL(req.url,'http://localhost');
  const full=path.resolve(ROOT,'.'+decodeURIComponent(url.pathname==='/ ' ? '/lesson-2-100-words.html' : url.pathname));
  if(!full.startsWith(ROOT+path.sep)){res.writeHead(403).end();return}
  const data=await fs.readFile(full);
  res.writeHead(200,{'Content-Type':types[path.extname(full)]||'application/octet-stream'});
  res.end(data);
 }catch{res.writeHead(404).end()}
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const url='http://127.0.0.1:'+server.address().port+'/lesson-2-100-words.html';
const browser=await puppeteer.launch({executablePath:process.env.CHROME_PATH||'/usr/bin/google-chrome',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
await fs.mkdir('lesson2-qa-screenshots',{recursive:true});
try{
 for(const [width,height] of [[1536,1024],[390,844]]){
  const page=await browser.newPage(), errors=[];
  page.on('pageerror',err=>errors.push(err.message));
  await page.setViewport({width,height,isMobile:width<=700,hasTouch:width<=700});
  await page.evaluateOnNewDocument(()=>{HTMLMediaElement.prototype.play=function(){return Promise.resolve()}});
  await page.goto(url,{waitUntil:'networkidle0',timeout:60000});
  await page.evaluate(()=>localStorage.removeItem('lesson2-reference-progress'));
  await page.reload({waitUntil:'networkidle0',timeout:60000});
  await page.waitForFunction(()=>window.lesson2?.words?.length===100,{timeout:25000});
  await page.waitForFunction(()=>document.querySelector('#photo')?.naturalWidth>0,{timeout:20000});
  await page.screenshot({path:'lesson2-qa-screenshots/lesson2-'+width+'x'+height+'.png',fullPage:true});
  assert.equal(await page.$$eval('.worditem',a=>a.length),100);
  const results=await page.evaluate(async()=>{
   const words=window.lesson2.words, bad=[];
   for(let i=0;i<words.length;i++){
    window.lesson2.choose(i);
    await new Promise(resolve=>requestAnimationFrame(resolve));
    const w=words[i],im=document.querySelector('#photo'),el=document.querySelector('#word');
    if(!el.textContent.replace(/[\u0301]/g,'').toLowerCase().includes(w.word.toLowerCase()))bad.push(w.word+': rendered word');
    if(el.scrollWidth>el.clientWidth+3)bad.push(w.word+': word text overflow '+el.scrollWidth+'/'+el.clientWidth);
    if(im.getAttribute('src')!==w.imageData)bad.push(w.word+': wrong image src');
    if(document.querySelectorAll('.worditem.active').length!==1)bad.push(w.word+': navigation active count');
   }
   window.lesson2.choose(0);
   return {bad,scroll:document.documentElement.scrollWidth,client:innerWidth,first:words[0].word,last:words.at(-1).word};
  });
  if(results.bad.length)console.error('DISPLAY ISSUES',results.bad);
  assert.deepEqual(results.bad,[]);
  assert.ok(results.scroll<=results.client+3,'horizontal overflow: '+width+' '+results.scroll);
  await page.waitForFunction(()=>document.querySelector('#photo')?.naturalWidth>0,{timeout:20000});
  await page.click('#play');assert.equal(await page.$eval('#audio',e=>e.playbackRate),1);
  await page.click('#slow');assert.equal(await page.$eval('#audio',e=>e.playbackRate),.7);

  assert.deepEqual(errors,[]);
  console.log('PASS '+width+'x'+height+': 100 rendered words; images, audio rates, navigation and text fitting OK');
  await page.close();
 }
}finally{await browser.close();await new Promise(r=>server.close(r))}
