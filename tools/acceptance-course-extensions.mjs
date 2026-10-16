import puppeteer from 'puppeteer-core';
import {spawn} from 'node:child_process';
import {mkdirSync,writeFileSync} from 'node:fs';

const samples=[
 ['4','lesson-4-presentation-READY.html',4,4,8],
 ['5','lesson-5.html',5,4,12],
 ['6','lesson-6.html',3,4,10],
];
const server=spawn('python3',['-m','http.server','18998','--bind','127.0.0.1'],{stdio:'ignore'});
const wait=t=>new Promise(r=>setTimeout(r,t));
const issues=[],results=[];
mkdirSync('qa-extension-shots',{recursive:true});
let browser;
try {
 await wait(1100);
 browser=await puppeteer.launch({executablePath:process.env.CHROME_PATH||'/usr/bin/google-chrome',headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--autoplay-policy=no-user-gesture-required']});
 for(const viewport of [{name:'mobile',width:390,height:844,isMobile:true,hasTouch:true},{name:'desktop',width:1280,height:900,isMobile:false,hasTouch:false}]){
  for(const [n,path,cardCount,dialogueCount,expectedQuiz] of samples){
   const page=await browser.newPage();const errors=[],http=[];
   page.on('pageerror',e=>errors.push(String(e)));
   page.on('response',r=>{if(r.url().includes('127.0.0.1:18998')&&r.status()>=400&&!r.url().includes('favicon.ico'))http.push(r.status()+' '+r.url())});
   await page.setViewport({...viewport,deviceScaleFactor:1});
   try {
    const response=await page.goto('http://127.0.0.1:18998/'+path,{waitUntil:'load',timeout:45000});
    await wait(320);
    const check=await page.evaluate(n=>{
      const v=document.getElementById('extra-vocab-'+n);
      const d=document.getElementById('extra-dialogue-'+n);
      const buttons=[...document.querySelectorAll('.lesson-extra [data-say]')];
      return {
        overflow:document.documentElement.scrollWidth-innerWidth,
        sourceCount:v?.querySelectorAll('.extra-card').length??-1,
        dialogueCount:d?.querySelectorAll('.extra-dialogue-line').length??-1,
        missingAudio:buttons.filter(b=>!window.COURSE_AUDIO?.[(b.dataset.role||'male')+'|'+b.dataset.say]).map(b=>b.dataset.say),
        buttons:buttons.length,
        quizCount:window.COURSE_QUIZ?.length,
        scrollHeight:document.documentElement.scrollHeight
      };
    },n);
    if(!response||![200,304].includes(response.status()))throw Error('Page response '+response?.status());
    if(check.sourceCount!==cardCount)throw Error('Cards '+check.sourceCount+' expected '+cardCount);
    if(check.dialogueCount!==dialogueCount)throw Error('Dialogue '+check.dialogueCount+' expected '+dialogueCount);
    if(n==='5'){const times=await page.$eval('#extra-times-5',el=>el.querySelectorAll('.extra-time-card').length);if(times!==5)throw Error('Extra time cards '+times+' expected 5');}
    if(check.quizCount!==expectedQuiz)throw Error('Questions '+check.quizCount+' expected '+expectedQuiz);
    if(check.overflow>3)throw Error('Horizontal overflow '+check.overflow);
    if(check.missingAudio.length)throw Error('Missing audio '+check.missingAudio.join(','));
    await page.$eval('#extra-vocab-'+n,el=>el.scrollIntoView({block:'start'}));
    await wait(220);
    if(viewport.name==='mobile')await page.screenshot({path:'qa-extension-shots/lesson-'+n+'-extra-mobile.png'});
    await page.$eval('#extra-dialogue-'+n,el=>el.scrollIntoView({block:'start'}));
    await wait(180);
    if(viewport.name==='mobile')await page.screenshot({path:'qa-extension-shots/lesson-'+n+'-dialogue-mobile.png'});
    // Play a newly recorded audio sample, not a fixture or old word.
    const play=await page.$('#extra-vocab-'+n+' [data-say]');
    await play.evaluate(el=>el.click());
    await page.waitForFunction(()=>document.querySelector('audio[data-course-player]')?.readyState>=2,{timeout:20000});
    const audioPath=await page.$eval('audio[data-course-player]',e=>e.currentSrc||e.src);
    if(!audioPath.includes('/audio/lesson-extensions/'))throw Error('New recorded MP3 not used '+audioPath);
    await page.evaluate(()=>{const buttons=[...document.querySelectorAll('[data-open-quiz]')];const b=buttons.find(x=>x.getClientRects().length&&getComputedStyle(x).display!=='none');if(!b)throw new Error('No visible quiz-open button');b.click();});
    await page.waitForFunction(()=>!!document.querySelector('#course-quiz .question'),{timeout:2000});
    let quiz=await page.evaluate(()=>{
      const qs=window.COURSE_QUIZ;
      const all=[...document.querySelectorAll('#course-quiz .question')];
      if(all.length!==qs.length)return {error:'Rendered '+all.length+' questions vs '+qs.length};
      for(let i=0;i<qs.length;i++){
        const choices=all[i].querySelectorAll('button.option');
        if(choices.length!==4)return {error:'Question '+i+' has '+choices.length+' options'};
        choices[qs[i].answer].click();
      }
      return {
        complete:document.querySelector('#course-result')?.textContent,
        feedback:document.querySelectorAll('.quiz-feedback').length,
        green:document.querySelectorAll('#course-quiz .option.correct').length,
        total:qs.length
      };
    });
    if(quiz.error||quiz.feedback!==expectedQuiz||quiz.green!==expectedQuiz||!quiz.complete?.includes('测试完成'))throw Error('Quiz result failure '+JSON.stringify(quiz));
    if(viewport.name==='mobile'){
      await page.$eval('#quiz-section',e=>e.scrollIntoView({block:'start'}));
      await wait(220);
      await page.screenshot({path:'qa-extension-shots/lesson-'+n+'-quiz-mobile.png'});
    }
    await page.click('#course-reset');
    const reset=await page.$eval('#course-quiz',e=>e.querySelectorAll('.quiz-feedback').length);
    if(reset!==0)throw Error('Quiz reset failed');
    if(errors.length||http.length)throw Error('Browser '+errors.join(',')+' '+http.join(','));
    const result={lesson:n,viewport:viewport.name,ok:true,stats:check,quiz:quiz.complete,audio:audioPath.slice(-65)};
    results.push(result);
    console.log('PASS_EXTENSION '+JSON.stringify(result));
   }catch(err){const msg=viewport.name+' lesson '+n+' '+String(err);issues.push(msg);results.push({lesson:n,viewport:viewport.name,ok:false,error:msg});console.error('FAIL_EXTENSION '+msg);}
   finally{await page.close();}
  }
  // lesson 3 touch dimensions
  const page=await browser.newPage();
  await page.setViewport({...viewport,deviceScaleFactor:1});
  try {
   await page.goto('http://127.0.0.1:18998/lesson-3-pronouns-basic.html',{waitUntil:'load',timeout:45000});
   const size=await page.evaluate(()=>{
     const selectors=['button.card-audio','button.example-audio','button.inline-audio'];
     return selectors.flatMap(selector=>[...document.querySelectorAll(selector)].filter(x=>x.getClientRects().length).map(x=>({selector,w:Math.round(x.getBoundingClientRect().width),h:Math.round(x.getBoundingClientRect().height)})));
   });
   let tooSmall=size.filter(x=>x.w<42||x.h<42);
   if(viewport.name==='mobile'&&tooSmall.length)throw Error('undersized touch targets: '+JSON.stringify(tooSmall.slice(0,4)));
   results.push({lesson:'3-touch',viewport:viewport.name,count:size.length,minWidth:Math.min(...size.map(x=>x.w)),minHeight:Math.min(...size.map(x=>x.h)),ok:true});
   console.log('PASS_TOUCH '+viewport.name+' '+JSON.stringify({count:size.length,min:size.reduce((acc,x)=>Math.min(acc,x.w,x.h),1000)}));
  }catch(err){issues.push('lesson 3 '+viewport.name+' '+String(err));console.error('FAIL_TOUCH '+String(err));}
  finally{await page.close();}
 }
}finally {
 await browser?.close();
 server.kill('SIGTERM');
 writeFileSync('qa-extension-shots/result.json',JSON.stringify({issues,results},null,2));
}
if(issues.length)process.exitCode=1;
