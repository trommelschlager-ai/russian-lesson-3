import puppeteer from 'puppeteer-core';
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';

const lessons=[
  ['1','russian_lesson_1_COMPLETE.html'],
  ['2','russian_lesson_2_reading.html'],
  ['3','lesson-3-pronouns-basic.html'],
  ['4','lesson-4-presentation-READY.html'],
  ['5','lesson-5.html'],
  ['6','lesson-6.html'],
  ['7','lesson-7.html'],
];
const port=18997;
const srv=spawn('python3',['-m','http.server',String(port),'--bind','127.0.0.1'],{stdio:'ignore'});
mkdirSync('audit-visuals',{recursive:true});
let browser;
let reports=[],fatal=0;
const sleep=(n)=>new Promise(r=>setTimeout(r,n));
try{
 await sleep(950);
 browser=await puppeteer.launch({
   executablePath:process.env.CHROME_PATH||'/usr/bin/google-chrome',
   headless:true,
   args:['--no-sandbox','--disable-dev-shm-usage','--autoplay-policy=no-user-gesture-required']
 });
 for(const [n,path] of lessons){
   const page=await browser.newPage();
   await page.setViewport({width:390,height:844,isMobile:true,hasTouch:true,deviceScaleFactor:1});
   const errors=[],httpErrors=[];
   page.on('pageerror',e=>errors.push(String(e).slice(0,220)));
   page.on('response',response=>{
     if(response.url().startsWith('http://127.0.0.1:') && response.status()>=400 && !response.url().includes('favicon.ico'))httpErrors.push(response.status()+' '+response.url());
   });
   try{
     const response=await page.goto('http://127.0.0.1:'+port+'/'+path,{waitUntil:'load',timeout:45000});
     await sleep(350);
     await page.screenshot({path:'audit-visuals/lesson-'+n+'-top.png'});
     const stats=await page.evaluate(()=>{
       const all=[...document.querySelectorAll('section')];
       const images=[...document.querySelectorAll('img')];
       return {
         title:document.title,sections:all.length,
         sectionTitles:all.map(s=>({title:s.querySelector('h1,h2,h3')?.textContent?.trim().slice(0,75)||'',cls:s.className||'',height:Math.round(s.getBoundingClientRect().height)})),
         overflow:document.documentElement.scrollWidth-innerWidth,
         documentHeight:document.documentElement.scrollHeight,
         links:[...document.querySelectorAll('a[href$=".html"]')].map(a=>a.getAttribute('href')),
         buttonTotal:document.querySelectorAll('button').length,
         images:images.length,
         visibleBrokenImages:images.filter(i=>i.complete&&i.naturalWidth===0&&i.getClientRects().length).map(i=>i.src.slice(-80)),
         audioButtons:document.querySelectorAll('[data-say],button.speaker,button[data-word],button[data-letter]').length,
         quizSection:!!document.querySelector('#quiz-section'),
         quizOpenButton:!!document.querySelector('[data-open-quiz]'),
         smallVisibleButtons:[...document.querySelectorAll('button')].filter(b=>{
           const r=b.getBoundingClientRect(),s=getComputedStyle(b);
           return s.display!=='none' && s.visibility!=='hidden' && r.width>0 && r.height>0 && (r.width<32||r.height<32);
         }).slice(0,12).map(b=>({text:b.textContent.trim().slice(0,24),aria:b.getAttribute('aria-label'),box:[Math.round(b.getBoundingClientRect().width),Math.round(b.getBoundingClientRect().height)]}))
       };
     });
     const sections=await page.$$('section');
     if(sections.length>0){
       // jump to last meaningful content block before quiz or near footer
       let chosen=sections[Math.max(0,sections.length-3)];
       if(n==='1')chosen=await page.$('#combinedLesson2Frame')||chosen;
       await chosen.evaluate(el=>el.scrollIntoView({block:'start'}));
       await sleep(400);
       await page.screenshot({path:'audit-visuals/lesson-'+n+'-middle.png'});
     }
     let quiz={};
     const open=await page.$('[data-open-quiz]');
     if(open){await open.evaluate(b=>b.click());await sleep(240);}
     const quizEl=await page.$('#quiz-section')||await page.$('#quiz');
     if(quizEl){
       await quizEl.evaluate(el=>el.scrollIntoView({block:'start'}));
       await sleep(250);
       await page.screenshot({path:'audit-visuals/lesson-'+n+'-quiz.png'});
       quiz=await page.evaluate(()=>{
         const q=document.querySelector('#quiz-section')||document.querySelector('#quiz');
         if(!q)return {};
         return {hidden:q.hidden,visible:getComputedStyle(q).display!=='none',text:q.innerText.slice(0,700),buttons:[...q.querySelectorAll('button')].map(b=>b.textContent.trim().slice(0,50)).slice(0,22)};
       });
     }
     if(n==='1'){
       await page.$eval('#combinedLesson2Frame',e=>e.scrollIntoView({block:'start'}));
       await page.waitForFunction(()=>{
         const d=document.querySelector('#combinedLesson2Frame')?.contentDocument;
         return d?.querySelector('#reset')&&d.body.innerText.length>1000;
       },{timeout:13000});
       const f=await page.$eval('#combinedLesson2Frame',e=>({height:e.clientHeight,inside:e.contentDocument.body.innerText.length,quiz:!!e.contentDocument.querySelector('#reset')}));
       stats.readingEmbedded=f;
       await page.screenshot({path:'audit-visuals/lesson-1-reading.png'});
     }
     let issues=[...errors,...httpErrors];
     if(stats.overflow>3)issues.push('horizontal overflow '+stats.overflow);
     if(stats.visibleBrokenImages.length)issues.push('broken images '+stats.visibleBrokenImages.length);
     if(!response||response.status()!==200)issues.push('page '+response?.status());
     if(quiz.hidden===true)issues.push('quiz section remained hidden after click');
     const obj={lesson:n,path,status:response?.status(),stats,quiz,issues};
     reports.push(obj);
     if(issues.length)fatal++;
     console.log('DEEP_QA '+n+' '+JSON.stringify({issues,sections:stats.sections,height:stats.documentHeight,quizVisible:quiz.visible,quizPreview:quiz.text?.slice(0,110),smallButtons:stats.smallVisibleButtons.length}));
   }catch(err){
     fatal++;
     reports.push({lesson:n,path,issues:[String(err)]});
     console.error('DEEP_QA_FAIL '+n+' '+String(err));
   }finally{await page.close();}
 }
}finally{
 await browser?.close();
 srv.kill('SIGTERM');
 writeFileSync('audit-visuals/report.json',JSON.stringify({generatedAt:new Date().toISOString(),fatal,reports},null,2));
}
if(fatal)process.exitCode=1;
