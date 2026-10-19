const {chromium,devices}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright');
const assert=require('node:assert/strict');const fs=require('node:fs');const http=require('node:http');const path=require('node:path');
const root=process.cwd();
const server=http.createServer((req,res)=>{const p=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));if(!p.startsWith(root+path.sep)){res.writeHead(403).end();return}fs.readFile(p,(err,data)=>{if(err){res.writeHead(404).end();return}const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript','.json':'application/json','.css':'text/css','.jpg':'image/jpeg','.webp':'image/webp','.mp3':'audio/mpeg','.svg':'image/svg+xml'};res.setHeader('Content-Type',mime[path.extname(p)]||'application/octet-stream');res.end(data)})});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const base='http://127.0.0.1:'+server.address().port;
 const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/usr/bin/google-chrome',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
 const out=process.env.QA_SCREENSHOTS||path.join(root,'qa/lesson2-final-20261019');fs.mkdirSync(out,{recursive:true});
 for(const mobile of [false,true]){
  const context=await browser.newContext(mobile?{...devices['Pixel 7'],viewport:{width:390,height:844},deviceScaleFactor:1}:{viewport:{width:1536,height:1024}});
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base+'/lesson-2-100-words.html');
  await page.waitForFunction(()=>window.lesson2?.words.length===100);
  const result=await page.evaluate(async()=>{
   const w=window.lesson2.words;const bad=[];
   for(let i=0;i<100;i++){
    window.lesson2.choose(i);await new Promise(requestAnimationFrame);
    const photo=document.querySelector('#photo'),word=document.querySelector('#word');
    if(word.textContent.replace(/\u0301/g,'').toLowerCase()!==w[i].word.toLowerCase())bad.push('text '+i);
    if(photo.getAttribute('src')!==w[i].imageData)bad.push('photo '+i);
    if(document.querySelectorAll('.worditem.active').length!==1)bad.push('active '+i);
    if(word.scrollWidth>word.clientWidth+3)bad.push('overflow '+i);
   }
   await Promise.all(w.map(x=>new Promise(resolve=>{const im=new Image();im.onload=resolve;im.onerror=()=>{bad.push('decode '+x.word);resolve()};im.src=x.imageData})));
   const rows=[...document.querySelectorAll('.worditem')].map(el=>{const r=el.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width}});
   for(let i=1;i<100;i++)if(rows[i].y<=rows[i-1].y||rows[i].x!==rows[0].x)bad.push('not one column '+i);
   const nav=document.querySelector('#words');
   return {bad,width:innerWidth,scrollWidth:document.documentElement.scrollWidth,navHeight:nav.clientHeight,navScrollHeight:nav.scrollHeight,progress:JSON.parse(localStorage.getItem('lesson2-reference-progress')),first:w[0].word,last:w.at(-1).word};
  });
  assert.deepEqual(result.bad,[]);assert.ok(result.scrollWidth<=result.width+3);assert.equal(result.progress.seen.length,100);
  if(mobile)assert.equal(result.navHeight,result.navScrollHeight,'mobile list must use document scrolling');
  await page.reload();await page.waitForFunction(()=>window.lesson2?.words.length===100);assert.equal(await page.locator('#seen').textContent(),'100');
  await page.evaluate(()=>window.lesson2.choose(73));
  for(const [id,rate] of [['#play',1],['#slow',.7]]){
   await page.locator(id).click();await page.waitForFunction(()=>document.querySelector('#audio').currentTime>0.1);
   assert.equal(await page.locator('#audio').evaluate(a=>a.playbackRate),rate);
   assert.equal(await page.locator('#audio').evaluate(a=>a.preservesPitch),true);
   await page.waitForFunction(()=>document.querySelector('#audio').ended);
  }
  await page.evaluate(()=>window.lesson2.choose(74));await page.locator('#photo').evaluate(im=>im.decode());
  await page.screenshot({path:out+'/lesson2-'+(mobile?'android':'desktop')+'-sun.jpg',quality:85});
  const last=page.locator('.worditem').last();await last.scrollIntoViewIfNeeded();
  assert.equal(await last.locator('.num').textContent(),'100');
  await page.screenshot({path:out+'/lesson2-'+(mobile?'android':'desktop')+'-list-100.jpg',quality:85});
  await last.click();await page.waitForFunction(()=>window.lesson2.current===99);
  assert.ok(await last.evaluate(el=>el.classList.contains('active')));
  if(mobile)assert.ok(await page.locator('.lesson').evaluate(el=>Math.abs(el.getBoundingClientRect().top)<3));
  assert.deepEqual(errors,[]);console.log(JSON.stringify({device:mobile?'Pixel 7 Android emulation':'desktop',...result,audio:'real MP3 played to end at 1x and 0.7x; pitch preserved; no listening verification'}));
  await context.close();
 }
 await browser.close();await new Promise(r=>server.close(r));
})().catch(e=>{console.error(e);process.exit(1)});
