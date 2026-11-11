"use strict";
const WORDS=[
{ru:"Мама",zh:"妈妈",parts:["МА","МА"],stress:0,audio:"audio/alphabet-natural/svetlana-2ccfed8bd93ea3ac.mp3",image:"assets/lesson2-photos/embedded-001.webp",emoji:"👩"},
{ru:"Папа",zh:"爸爸",parts:["ПА","ПА"],stress:0,audio:"audio/alphabet-natural/svetlana-a0db4873b559279f.mp3",image:"assets/lesson2-photos/embedded-002.webp",emoji:"👨"},
{ru:"Дом",zh:"房子",parts:["ДОМ"],stress:0,audio:"audio/alphabet-natural/svetlana-41988eb2ae82fe48.mp3",image:"",emoji:"🏠"},
{ru:"Кот",zh:"猫",parts:["КОТ"],stress:0,audio:"audio/alphabet-natural/svetlana-0dc10f73d0666992.mp3",image:"",emoji:"🐈"},
{ru:"Нос",zh:"鼻子",parts:["НОС"],stress:0,audio:"audio/alphabet-natural/svetlana-e47474af9fa7996b.mp3",image:"",emoji:"👃"},
{ru:"Сок",zh:"果汁",parts:["СОК"],stress:0,audio:"audio/alphabet-natural/svetlana-8c3abbc6863d2550.mp3",image:"",emoji:"🧃"},
{ru:"Луна",zh:"月亮",parts:["ЛУ","НА"],stress:1,audio:"audio/lesson1-word-svetlana-v1/13.mp3",image:"assets/lesson2-photos/word-042.jpg",emoji:"🌙"},
{ru:"Рука",zh:"手",parts:["РУ","КА"],stress:1,audio:"audio/alphabet-natural/svetlana-63b1a2505193fb92.mp3",image:"assets/lesson2-photos/embedded-004.webp",emoji:"✋"},
{ru:"Вода",zh:"水",parts:["ВО","ДА"],stress:1,audio:"audio/alphabet-natural/svetlana-a8cd0937ee62e1f6.mp3",image:"assets/lesson2-photos/embedded-003.webp",emoji:"💧"},
{ru:"Окно",zh:"窗户",parts:["ОК","НО"],stress:1,audio:"audio/alphabet-natural/svetlana-ec851e22cf1ef2cf.mp3",image:"assets/lesson2-photos/word-051.jpg",emoji:"🪟"}
];
const SYLLABLES=["МА","ПА","МО","ПО","НА","НО","ЛУ","РУ","КО","СО","ВО","ДА"];
const LOCAL_KEY="lesson2-syllables-progress-v1";
const COURSE_KEY="russian-course-progress-v1";
const $=id=>document.getElementById(id);
let progress={heard:[],syllables:[],passed:false,best:0,current:0};
try{
 const p=JSON.parse(localStorage.getItem(LOCAL_KEY)||"null");
 if(p&&typeof p==="object"){
  progress.heard=Array.isArray(p.heard)?p.heard.filter(n=>WORDS.some(w=>w.ru===n)):[];
  progress.syllables=Array.isArray(p.syllables)?p.syllables.filter(s=>SYLLABLES.includes(s)):[];
  progress.passed=!!p.passed;progress.best=Number(p.best)||0;
  progress.current=Number.isInteger(p.current)?Math.max(0,Math.min(9,p.current)):0;
 }
}catch(e){}
let playing=null,questions=[],question=0,points=0,answered=false,heardQuestion=false,errors=[];
function save(){
 try{localStorage.setItem(LOCAL_KEY,JSON.stringify(progress))}catch(e){}
 if(new Set(progress.heard).size===10&&progress.passed){
  try{
   const course=JSON.parse(localStorage.getItem(COURSE_KEY)||"{}");
   if(!course["2"]||Number(course["2"].score)<5){
    course["2"]={score:5,total:5,date:new Date().toISOString()};
    localStorage.setItem(COURSE_KEY,JSON.stringify(course));
   }
  }catch(e){}
 }
}
function stop(){
 if(playing){try{playing.pause();playing.currentTime=0}catch(e){}playing=null}
 if(window.speechSynthesis)window.speechSynthesis.cancel();
}
function playWord(w,statusId,done){
 stop();
 const a=new Audio(w.audio+"?ver=approved-lesson2-20261112");
 playing=a;
 if(statusId)$(statusId).textContent="🔊 "+w.ru+" · 正在播放";
 a.addEventListener("ended",()=>{if(playing===a)playing=null},{once:true});
 a.play().then(()=>{if(done)done(true)}).catch(()=>{
  if(statusId)$(statusId).textContent="录音播放失败，请检查网络后重试。";
  if(done)done(false);
 });
}
function show(stage){
 stop();
 document.querySelectorAll(".view").forEach(v=>v.classList.toggle("active",v.id===stage));
 document.querySelectorAll(".tab").forEach(t=>t.setAttribute("aria-selected",String(t.dataset.stage===stage)));
 if(stage==="words")renderWord();
 if(stage==="quiz"&&!questions.length)startQuiz();
}
function listenSyllable(s){
 stop();
 const engine=window.speechSynthesis;
 if(!engine||typeof SpeechSynthesisUtterance!=="function"){
  $("syllableStatus").textContent="此设备不支持俄语语音。请在下一步听真人单词录音。";
  return;
 }
 const native=engine.getVoices().find(v=>String(v.lang).toLowerCase().startsWith("ru"));
 if(!native){
  $("syllableStatus").textContent="此设备没有俄语语音。可以继续学习下一步的单词录音。";
  return;
 }
 const u=new SpeechSynthesisUtterance(s.toLowerCase());
 u.lang="ru-RU";u.voice=native;u.rate=.82;
 u.onerror=()=>{$("syllableStatus").textContent="音节播放不可用，请听下一步的完整单词。"};
 engine.speak(u);
 if(!progress.syllables.includes(s)){progress.syllables.push(s);save()}
 renderSyllables();
 $("syllableStatus").textContent="🔊 "+s+" · 设备俄语示范音";
}
function renderSyllables(){
 const root=$("soundGrid");root.replaceChildren();
 SYLLABLES.forEach(s=>{
  const b=document.createElement("button");
  b.setAttribute("aria-label","听俄语音节 "+s);
  if(progress.syllables.includes(s))b.classList.add("listened");
  const small=document.createElement("small");small.textContent=" 🔊";
  b.textContent=s;b.append(small);
  b.addEventListener("click",()=>listenSyllable(s));
  root.append(b);
 });
}
function accent(part){return part.replace(/([АЕЁИОУЫЭЮЯ])([^АЕЁИОУЫЭЮЯ]*)$/,"$1\u0301$2")}
function renderWord(){
 const w=WORDS[progress.current];
 $("wordCount").textContent=(progress.current+1)+" / "+WORDS.length;
 $("wordFill").style.width=((progress.current+1)/WORDS.length*100)+"%";
 $("wordRussian").textContent=w.ru.toLocaleUpperCase("ru-RU");
 $("wordChinese").textContent=w.zh;
 $("wordIcon").textContent=w.emoji;
 $("wordIcon").hidden=!!w.image;
 $("wordPhoto").hidden=!w.image;
 if(w.image){$("wordPhoto").src=w.image;$("wordPhoto").alt=w.ru+" — "+w.zh}
 const root=$("wordBreakdown");root.replaceChildren();
 w.parts.forEach((part,i)=>{
  const el=document.createElement("span");
  if(i===w.stress)el.className="stress";
  el.textContent=i===w.stress?accent(part):part;
  root.append(el);
 });
 $("wordStatus").textContent=progress.heard.includes(w.ru)?"✅ 已听，可以再读一遍":"先听，再跟读一遍。";
 $("previousWord").disabled=progress.current===0;
 $("nextWord").textContent=progress.current===9?"开始小测验 →":"下一个 →";
}
function playCurrentWord(){
 const w=WORDS[progress.current];
 playWord(w,"wordStatus",ok=>{
  if(!ok)return;
  if(!progress.heard.includes(w.ru)){progress.heard.push(w.ru);save()}
  $("wordStatus").textContent="✅ 已听："+progress.heard.length+" / 10 · 跟着读一遍";
 });
}
function shuffle(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
function startQuiz(){
 questions=shuffle(WORDS.slice()).slice(0,5);
 question=0;points=0;answered=false;heardQuestion=false;errors=[];
 $("quizCard").hidden=false;$("quizResult").hidden=true;
 showQuestion();
}
function showQuestion(){
 if(question>=questions.length){finishQuiz();return}
 answered=false;heardQuestion=false;
 $("questionCount").textContent="第 "+(question+1)+" / 5 题";
 $("quizPoints").textContent="★ "+points+" / 5";
 $("quizFill").style.width=((question+1)/5*100)+"%";
 $("quizHint").textContent="先听发音，再选择答案";
 $("quizFeedback").textContent="";
 $("quizNext").disabled=true;$("quizNext").textContent=question===4?"查看成绩 →":"下一题 →";
 const expected=questions[question];
 const choice=shuffle([expected,...shuffle(WORDS.filter(w=>w!==expected)).slice(0,2)]);
 const root=$("quizOptions");root.replaceChildren();
 choice.forEach(w=>{
  const b=document.createElement("button");b.disabled=true;b.textContent=w.ru.toLocaleUpperCase("ru-RU");
  b.addEventListener("click",()=>{
   if(answered||!heardQuestion)return;
   answered=true;stop();
   if(w===expected)points++;else errors.push(expected);
   $("quizPoints").textContent="★ "+points+" / 5";
   $("quizFeedback").textContent=w===expected?"✅ 正确！":"正确答案："+expected.ru.toUpperCase();
   root.querySelectorAll("button").forEach(btn=>{
    btn.disabled=true;
    if(btn.textContent===expected.ru.toLocaleUpperCase("ru-RU"))btn.classList.add("correct");
    else if(btn===b)btn.classList.add("wrong");
   });
   $("quizNext").disabled=false;
  });
  root.append(b);
 });
}
function playQuestion(){
 if(answered||question>=questions.length)return;
 const index=question;
 playWord(questions[question],"quizHint",ok=>{
  if(!ok||index!==question||answered)return;
  heardQuestion=true;$("quizHint").textContent="请选择你听到的单词";
  $("quizOptions").querySelectorAll("button").forEach(b=>b.disabled=false);
 });
}
function finishQuiz(){
 stop();$("quizCard").hidden=true;$("quizResult").hidden=false;
 const passed=points>=4;
 progress.best=Math.max(progress.best,points);
 if(passed)progress.passed=true;
 save();
 $("resultIcon").textContent=passed?"🏆":"📖";
 $("resultTitle").textContent=passed?"太棒了！":"再练一练";
 $("resultScore").textContent=points+" / 5";
 $("resultMessage").textContent=passed?"通过测验！已听单词 "+progress.heard.length+"/10。":"点击下面的单词再听一听，然后重试。";
 const root=$("review");root.replaceChildren();
 errors.forEach(w=>{
  const b=document.createElement("button");
  b.textContent=w.ru+" 🔊";
  b.addEventListener("click",()=>playWord(w));
  root.append(b);
 });
}
document.querySelectorAll(".tab").forEach(b=>b.addEventListener("click",()=>show(b.dataset.stage)));
$("startWords").addEventListener("click",()=>show("words"));
$("previousWord").addEventListener("click",()=>{progress.current=Math.max(0,progress.current-1);save();renderWord()});
$("nextWord").addEventListener("click",()=>{if(progress.current===9)show("quiz");else{progress.current++;save();renderWord()}});
$("wordPlay").addEventListener("click",playCurrentWord);
$("quizAudio").addEventListener("click",playQuestion);
$("quizNext").addEventListener("click",()=>{if(!answered)return;question++;showQuestion()});
$("repeatQuiz").addEventListener("click",startQuiz);
$("backToWords").addEventListener("click",()=>show("words"));
window.addEventListener("pagehide",stop);
renderSyllables();renderWord();
if(window.location.hash==="#words")show("words");
if(window.location.hash==="#quiz")show("quiz");
