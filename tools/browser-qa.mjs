import puppeteer from 'puppeteer-core';
import {spawn} from 'node:child_process';
import {mkdirSync, writeFileSync} from 'node:fs';

const paths = [
  'russian_lesson_1_COMPLETE.html',
  'russian_lesson_2_reading.html',
  'lesson-3-pronouns-basic.html',
  'lesson-4-presentation-READY.html',
  'lesson-5.html',
  'lesson-6.html',
  'lesson-7.html',
];
const modes = [{label:'mobile',width:390,height:844,isMobile:true,hasTouch:true},{label:'desktop',width:1280,height:800,isMobile:false,hasTouch:false}];
const port = 18991;
const server = spawn('python3',['-m','http.server',String(port),'--bind','127.0.0.1'],{stdio:'ignore'});
const report = [];
let browser;
let failures = 0;
const sleep = ms => new Promise(r => setTimeout(r,ms));
mkdirSync('qa-browser-shots',{recursive:true});

try {
  await sleep(900);
  browser = await puppeteer.launch({
    executablePath:process.env.CHROME_PATH || '/usr/bin/google-chrome',
    headless:true,
    args:['--no-sandbox','--disable-dev-shm-usage','--autoplay-policy=no-user-gesture-required'],
  });
  for (const mode of modes) {
    for (const path of paths) {
      const page = await browser.newPage();
      await page.setViewport({width:mode.width,height:mode.height,isMobile:mode.isMobile,hasTouch:mode.hasTouch,deviceScaleFactor:1});
      const jsErrors = [], failedLocal = [];
      page.on('pageerror', e => jsErrors.push(String(e).slice(0,180)));
      page.on('response', r => {
        if (r.status()>=400 && r.url().startsWith('http://127.0.0.1:') && !r.url().endsWith('/favicon.ico')) failedLocal.push(r.status()+' '+r.url());
      });
      try {
        const response = await page.goto('http://127.0.0.1:'+port+'/'+path,{waitUntil:'load',timeout:30000});
        await sleep(350);
        if (path === 'russian_lesson_2_reading.html') {
          if (mode.label==='mobile') await page.screenshot({path:'qa-browser-shots/lesson2-new-design-hero.png'});
          const check = await page.evaluate(()=>{
            const book=document.querySelector('.hero-art img.home-matched-book');
            const quiz=window.quizData || [];
            return {
              theme:document.body.classList.contains('lesson2-scrapbook'),
              syllables:document.querySelectorAll('.syllable').length,
              wordCards:document.querySelectorAll('.word-card').length,
              questions:quiz.length,
              imageReady:!!book&&book.complete&&book.naturalWidth>0,
              links:[...document.querySelectorAll('.scrap-quicknav a')].map(a=>a.hash),
              width:document.documentElement.scrollWidth,
              viewport:window.innerWidth
            };
          });
          console.log('LESSON2_SCRAPBOOK '+mode.label+' '+JSON.stringify(check));
          if(!check.theme || check.syllables!==40 || check.wordCards!==8 || check.questions!==20 || !check.imageReady || check.links.join(',')!=='#syllables,#words,#quiz-section' || check.width>check.viewport+2) throw Error('Lesson 2 visual/data test failed: '+JSON.stringify(check));
        }
        const measured = await page.evaluate(() => ({
          title:document.title,
          viewport:window.innerWidth,
          pageWidth:document.documentElement.scrollWidth,
          images:document.images.length,
          brokenImages:[...document.images].filter(i=>i.complete && i.naturalWidth===0).map(i=>i.getAttribute('src')).slice(0,12),
          audioButtons:document.querySelectorAll('button[data-say]').length,
          allButtons:document.querySelectorAll('button').length,
          lessonMenu:!!document.querySelector('.lesson-menu'),
        }));
        let clicked = false, clickFailure = '';
        const button = await page.$('button[data-say]');
        if (button) {
          try {await button.click({timeout:4500});clicked=true;await sleep(150);}
          catch(e){clickFailure=String(e).slice(0,140);}
        }
        // Check the actual alphabet player, not just existence/clickability of its controls.
        if (path === 'russian_lesson_1_COMPLETE.html') {
          for (const spoken of ['А','Арбуз']) {
            try {
              const outcome = await page.evaluate((word) => {
                if (typeof window.speak !== 'function') throw new Error('Alphabet speak() missing');
                window.speak(word);
                const player = document.querySelector('audio[data-lesson-player]');
                if (!player) throw new Error('Player not created');
                return {url:player.currentSrc || player.src};
              },spoken);
              if (!outcome.url.includes('/audio/alphabet-natural/')) throw new Error('Not using new MP3: '+outcome.url.slice(0,140));
              await page.waitForFunction(() => {
                const p=document.querySelector('audio[data-lesson-player]');
                return p && p.readyState>=2 && !p.error;
              },{timeout:12000});
              clicked=true;
              console.log('ALPHABET_MP3 '+mode.label+' '+spoken+' '+outcome.url);
            } catch(err) {clickFailure+=' Alphabet '+spoken+': '+String(err).slice(0,170);}
          }
        }
        if (mode.label==='mobile') await page.screenshot({path:'qa-browser-shots/'+path.replace('.html','')+'.png'});
        if (path==='russian_lesson_1_COMPLETE.html') {
          // The alphabet has a reading continuation far below the fold.
          // Scrolling is essential when iframe loading=lazy.
          await page.$eval('#combinedLesson2Frame', el=>el.scrollIntoView({block:'center'}));
          await page.waitForFunction(()=>{
            const iframe=document.querySelector('#combinedLesson2Frame');
            const d=iframe?.contentDocument;
            return d?.body?.innerText?.includes('第一部分｜读音节');
          },{timeout:20000});
          await sleep(800);
          const reading=await page.$eval('#combinedLesson2Frame',frame=>({
            source:frame.getAttribute('src'),
            text:frame.contentDocument?.body?.innerText?.length || 0,
            heading:frame.contentDocument?.querySelector('h2')?.textContent || '',
            contentHeight:frame.contentDocument?.documentElement?.scrollHeight || 0,
            height:Math.round(frame.getBoundingClientRect().height),
            quiz:!!frame.contentDocument?.querySelector('#reset'),
          }));
          console.log('READING_CONTINUATION '+mode.label+' '+JSON.stringify(reading));
          if (!reading.source?.includes('russian_lesson_2_reading.html') || reading.text<1500 || !reading.quiz) throw Error('Missing actual reading exercises in alphabet continuation');
          if (reading.height<900) throw Error('Reading iframe collapsed');
          if (mode.label==='mobile')await page.screenshot({path:'qa-browser-shots/alphabet-reading-continuation-mobile.png'});
        }
        const errors = [];
        if (!response || ![200,304].includes(response.status())) errors.push('Page HTTP status '+(response?.status() ?? 'none'));
        if (jsErrors.length) errors.push('JavaScript: '+jsErrors.join('; '));
        if (failedLocal.length) errors.push('Missing HTTP resource: '+failedLocal.slice(0,5).join('; '));
        if (measured.brokenImages.length) errors.push('Broken images: '+measured.brokenImages.join(', '));
        if (measured.pageWidth>measured.viewport+3) errors.push('Horizontal overflow: '+measured.pageWidth+' > '+measured.viewport);
        if (clickFailure) errors.push('Audio button click failed: '+clickFailure);
        failures+=errors.length;
        report.push({path,mode:mode.label,clicked,measured,errors});
        console.log((errors.length?'FAIL':'PASS')+' '+mode.label+' '+path+' viewport '+measured.viewport+' content '+measured.pageWidth+' images '+measured.images+' audioButtons '+measured.audioButtons+' '+errors.join(' | '));
      } catch (err) {
        failures++;
        report.push({path,mode:mode.label,errors:[String(err)]});
        console.error('FAIL '+mode.label+' '+path+' '+String(err));
      } finally {await page.close();}
    }
  }
} finally {
  if (browser) await browser.close();
  server.kill('SIGTERM');
  writeFileSync('qa-browser-shots/results.json',JSON.stringify({tests:report.length,failures,report},null,2));
}
if (failures) process.exitCode=1;
