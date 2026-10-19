'use strict';
// Lesson 2: 100 independent, full-size word cards in their original sequence.
const list=document.getElementById('word-list');
const template=document.getElementById('word-template');
const audio=document.getElementById('audio');
const el=(card,role)=>card.querySelector('[data-role="'+role+'"]');
const icon=(name,white=false)=>'assets/lesson2-icons/'+name+(white?'-white':'')+'.svg';
const accent=s=>/[ёЁ]/.test(s)?s:s.replace(/([аеёиоуыэюя])([^аеёиоуыэюя]*)$/iu,'$1\u0301$2');
const stressed=w=>w.parts.map((p,i)=>i===w.stress?accent(p):p).join('');
const norm=s=>s.toLowerCase().replace(/ё/g,'е').replace(/[^а-я]/g,'');
// A learner may repeat the same word while SpeechRecognition is listening.
// Accept up to 4 identical tokens, but NEVER accept a phrase containing
// a different word (for example "еда вода" or "не еда").
function transcriptionMatches(spoken,expectedWord){
 const expected=norm(expectedWord);
 if(!expected||typeof spoken!=='string')return false;
 if(norm(spoken)===expected)return true;
 const tokens=spoken.toLocaleLowerCase('ru-RU').replace(/ё/g,'е').match(/[а-я]+/g)||[];
 return tokens.length>=2&&tokens.length<=4&&tokens.every(token=>token===expected);
}
let words=[],cards=[],active=-1,recognition=null,recorder=null,stream=null;
let speechSession=0;
const recordings=new Map();
let saved={};
try{saved=JSON.parse(localStorage.getItem('lesson2-reference-progress')||'{}')}catch{}
const seen=new Set(saved.seen||[]),good=new Set(saved.good||[]),review=new Set(saved.review||[]);
const indexOf=w=>w.legacyIndex??words.indexOf(w);
function updateProgress(){
 const n=seen.size;
 const set=(id,value)=>{const e=document.getElementById(id);if(e)e.textContent=value};
 set('seen',n);set('good',good.size);set('review',review.size);
 set('percent',n+'%');set('progress-label',n+' / '+words.length);
 const fill=document.getElementById('fill');if(fill)fill.style.width=Math.min(100,100*n/words.length)+'%';
 try{localStorage.setItem('lesson2-reference-progress',JSON.stringify({seen:[...seen],good:[...good],review:[...review]}))}catch{}
}
const VOICE_CHECK_VERSION='mobile-repeat-fix-v4-20261019';
function diagnostic(i,stage){
 const card=cards[i];if(!card)return;
 let line=card.querySelector('.voice-diagnostics');
 if(!line){
  line=document.createElement('div');
  line.className='voice-diagnostics';
  line.style.cssText='font-size:12px;line-height:1.45;color:#5e3d22;margin-top:7px;overflow-wrap:anywhere';
  el(card,'status-copy').after(line);
 }
 const supported=!!(window.SpeechRecognition||window.webkitSpeechRecognition);
 line.textContent='语音检测 '+VOICE_CHECK_VERSION+' · '+stage+
  ' · 语音识别接口：'+(supported?'存在':'不可用')+
  ' · HTTPS：'+(window.isSecureContext?'是':'否');
}
function status(i,title,copy,error=false){
 const card=cards[i];if(!card)return;
 el(card,'status-title').textContent=title;
 el(card,'status-copy').textContent=copy;
 el(card,'feedback').classList.toggle('error',error);
 el(card,'status-icon').src=icon(error?'arrow-clockwise':'speaker-high');
 diagnostic(i,title);
}
function markSeen(i){seen.add(indexOf(words[i]));updateProgress()}
function stop(){
 speechSession++;
 audio.pause();
 if(recognition){const old=recognition;recognition=null;try{old.abort()}catch{}}
 if(recorder&&recorder.state==='recording'){try{recorder.stop()}catch{}}
 recorder=null;
 if(stream){stream.getTracks().forEach(t=>t.stop());stream=null}
 cards.forEach(card=>{el(card,'record').disabled=false});
}
async function play(i,rate=1){
 if(!words[i])return;
 stop();active=i;markSeen(i);
 audio.src=words[i].url;
 audio.playbackRate=rate;
 if('preservesPitch' in audio)audio.preservesPitch=true;
 status(i,rate===1?'正在播放原音…':'正在慢速播放…','请注意红色的重音音节。');
 try{await audio.play()}catch{status(i,'无法播放录音','请检查网络或再次点击。',true)}
}
audio.addEventListener('ended',()=>{if(active>=0)status(active,'现在试试自己朗读','按“我来读”，清晰地读出整个单词。')});
audio.addEventListener('error',()=>{if(active>=0)status(active,'录音加载失败','请检查网络后重试。',true)});
// On Android start browser speech recognition synchronously from the tap.
// Do not acquire a second getUserMedia stream first: this can block the
// recognition service or lose user activation on mobile browsers.
function browserTip(){
 const ua=navigator.userAgent||'';
 return /Android|iPhone|iPad/i.test(ua)
  ? '请用手机 Google Chrome 直接打开 HTTPS 网页，并允许麦克风权限。不要在聊天软件内置浏览器里打开。'
  : '请使用支持语音识别的浏览器，并允许麦克风权限。';
}
function errorText(code){
 const messages={
  'not-allowed':'麦克风权限被拒绝。请在浏览器网站设置里允许使用麦克风。',
  'service-not-allowed':'浏览器禁止语音识别服务。'+browserTip(),
  'audio-capture':'未检测到可用麦克风，请检查权限或其他应用是否占用麦克风。',
  'network':'语音识别服务连接失败。请联网后重试；部分网络或浏览器不能连接此服务。',
  'no-speech':'没有识别到声音。请靠近麦克风，清晰读出单词后重试。',
  'language-not-supported':'此浏览器的语音识别服务不支持俄语。'+browserTip(),
  'aborted':'识别已取消。请点击粉色按钮重新开始。'
 };
 return (messages[code]||'语音识别失败：'+String(code||'unknown')+'。')+' （'+String(code||'unknown')+'）';
}
// Standalone recording is a truthful fallback: it can be replayed but is not graded.
async function recordOnly(i){
 if(!words[i]||!cards[i])return;
 stop();active=i;markSeen(i);
 const token=speechSession,card=cards[i],button=el(card,'record');
 if(!navigator.mediaDevices?.getUserMedia||!window.MediaRecorder){
  status(i,'无法录音',browserTip(),true);return;
 }
 try{
  status(i,'正在申请麦克风权限…','此模式只录音供自己试听，不会自动评分。');
  const mic=await navigator.mediaDevices.getUserMedia({audio:true});
  if(token!==speechSession||active!==i){mic.getTracks().forEach(t=>t.stop());return}
  stream=mic;
  const chunks=[],r=new MediaRecorder(mic);recorder=r;
  r.addEventListener('dataavailable',e=>{if(e.data.size)chunks.push(e.data)});
  r.addEventListener('stop',()=>{
   mic.getTracks().forEach(t=>t.stop());
   if(stream===mic)stream=null;
   if(!chunks.length){if(token===speechSession)status(i,'录音失败','没有收到声音文件，请重试。',true);return}
   if(recordings.has(i))URL.revokeObjectURL(recordings.get(i));
   const url=URL.createObjectURL(new Blob(chunks,{type:r.mimeType}));
   recordings.set(i,url);
   let replay=card.querySelector('.listen-recording');
   if(!replay){replay=document.createElement('button');replay.className='listen-recording';replay.textContent='▶ 听自己的录音';el(card,'status-copy').after(replay)}
   replay.onclick=async()=>{stop();active=i;audio.src=url;audio.playbackRate=1;try{await audio.play()}catch{status(i,'无法播放录音','请再次点击。',true)}};
   if(token===speechSession){button.disabled=false;status(i,'录音完成（未评分）','可播放自己的录音并与标准发音比较。此模式无法自动判断对错。')}
  });
  r.start();button.disabled=true;
  status(i,'正在录音…','请大声朗读，6秒后自动完成。本模式不自动评分。');
  setTimeout(()=>{if(token===speechSession&&recorder===r&&r.state==='recording'){try{r.stop()}catch{}}},6000);
 }catch(e){if(token===speechSession){stop();status(i,'无法使用麦克风','请允许此网站使用麦克风：'+String(e?.name||'permission'),true)}}
}
function offerRecordingFallback(i){
 if(!cards[i])return;
 const card=cards[i];
 let fallback=card.querySelector('.manual-record');
 if(!fallback){
  fallback=document.createElement('button');fallback.type='button';
  fallback.className='listen-recording manual-record';
  fallback.textContent='🎙 只录音并试听（不自动评分）';
  fallback.onclick=()=>recordOnly(i);
  el(card,'status-copy').after(fallback);
 }
}
function record(i){
 if(!words[i]||!cards[i])return;
 stop();active=i;markSeen(i);
 const card=cards[i],button=el(card,'record');
 status(i,'🎤 按钮已触发，正在检查识别功能…','正在检查设备和浏览器，请稍候。');
 const API=window.SpeechRecognition||window.webkitSpeechRecognition;
 if(typeof API!=='function'){
  status(i,'当前浏览器无法自动判断对错','没有语音识别接口。'+browserTip()+' 下方可选择只录音试听。',true);
  offerRecordingFallback(i);return;
 }
 const token=speechSession;
 let r,received=false,failed=false,heardSpeech=false;
 try{
  r=new API();recognition=r;
  r.lang='ru-RU';r.continuous=false;r.interimResults=false;r.maxAlternatives=5;
  button.disabled=true;
  r.onstart=()=>{if(token===speechSession)status(i,'麦克风已启动，请朗读…','请读：'+words[i].word)};
  r.onspeechstart=()=>{if(token===speechSession){heardSpeech=true;status(i,'已听到声音，正在识别…','请读完整个单词。')}};
  r.onresult=e=>{
   if(token!==speechSession||received)return;
   const candidates=[];
   for(let j=e.resultIndex??0;j<e.results.length;j++){
    const result=e.results[j];
    for(let k=0;k<result.length;k++){
     const transcript=result[k]?.transcript;
     if(typeof transcript==='string'&&transcript.trim())candidates.push(transcript.trim());
    }
   }
   if(!candidates.length)return;
   received=true;
   const matching=candidates.find(t=>transcriptionMatches(t,words[i].word));
   const id=indexOf(words[i]),ok=!!matching;
   if(ok){good.add(id);review.delete(id)}
   else{review.add(id);good.delete(id)}
   const repeated=ok&&((matching.toLocaleLowerCase('ru-RU').match(/[а-яё]+/g)||[]).length>1);
   status(i,ok?'✅ 文字识别一致！':'❌ 文字不一致，请重试',
    '识别结果：'+(matching||candidates[0])+'。目标：'+words[i].word+'。'+
    (repeated?'多次朗读同一单词，仍算文字一致。':'')+
    '语音识别仅核对文字，不能可靠判断发音或重音。',!ok);
   updateProgress();
  };
  r.onnomatch=()=>{if(token===speechSession&&!received){failed=true;status(i,'没有匹配的识别结果','请重新点击粉色按钮，大声读出单词。',true)}};
  r.onerror=e=>{
   if(token!==speechSession||received)return;
   failed=true;
   const code=e?.error||'unknown';
   status(i,'语音识别没有完成',errorText(code),true);
   offerRecordingFallback(i);
  };
  r.onend=()=>{
   if(token!==speechSession)return;
   if(recognition===r)recognition=null;
   button.disabled=false;
   if(!received&&!failed){
    status(i,'没有返回识别结果',heardSpeech?'听到了声音，但识别服务没有返回文字。'+browserTip():'请重试，或检查浏览器麦克风和语音识别权限。'+browserTip(),true);
    offerRecordingFallback(i);
   }
  };
  // IMPORTANT: called synchronously within the user click (no await).
  r.start();
  status(i,'正在启动俄语识别…','请允许麦克风，然后大声读出：'+words[i].word);
  setTimeout(()=>{
   if(token!==speechSession||recognition!==r)return;
   if(!received&&!failed){failed=true;status(i,'识别等待超时','请检查网络、浏览器和麦克风权限，然后再试。'+browserTip(),true);offerRecordingFallback(i)}
   try{r.stop()}catch{}
  },12000);
 }catch(e){
  if(token===speechSession){
   recognition=null;button.disabled=false;
   status(i,'无法启动语音识别','启动失败：'+String(e?.name||'unknown')+'。'+browserTip(),true);
   offerRecordingFallback(i);
  }
 }
}
function makeCard(w,i){
 const card=template.content.firstElementChild.cloneNode(true);
 card.dataset.index=i;
 const q=role=>el(card,role);
 q('ordinal').textContent=String(i+1).padStart(2,'0');
 q('voice').textContent=w.voiceLabel||'';
 const photo=q('photo');photo.src=w.imageData;photo.alt=w.word+' — '+w.zh;
 photo.loading=i<2?'eager':'lazy';photo.decoding='async';
 photo.style.objectFit=w.fit||'cover';photo.style.objectPosition=w.position||'center';
 q('photo-caption').textContent=w.caption||'';
 const word=q('word');word.textContent=stressed(w).toLocaleUpperCase('ru-RU');
 word.style.setProperty('--letters',w.word.length);
 q('latin').textContent=w.latin;q('zh').textContent=w.zh;
 const syllables=q('syllables');syllables.replaceChildren();
 w.parts.forEach((part,s)=>{
  const b=document.createElement('button');
  b.textContent=(s===w.stress?accent(part):part).toLocaleUpperCase('ru-RU');
  b.className=s===w.stress?'stressed':'';
  b.title='播放完整单词，观察这个音节';
  b.onclick=()=>play(i,.7);syllables.append(b);
 });
 q('play').onclick=()=>play(i);
 q('small-play').onclick=()=>play(i);
 q('slow').onclick=()=>play(i,.7);
 q('record').onclick=()=>record(i);
 q('retry').onclick=()=>record(i);
 return card;
}
function fitWords(){
 cards.forEach(card=>{
  const heading=el(card,'word');heading.style.fontSize='';
  let px=parseFloat(getComputedStyle(heading).fontSize)||60;
  for(let n=0;n<30&&heading.scrollWidth>heading.clientWidth+1&&px>22;n++){
   px=Math.max(22,px-2);heading.style.fontSize=px+'px';
  }
 });
}
const steps=[['speaker-high','先听原音','点击蓝色按钮，听标准发音'],['clock','再听慢速','点击橙色按钮，听慢速发音'],['microphone','自己朗读','点击红色按钮，大声朗读'],['check-circle','语音识别','检查文字是否一致，不判断重音'],['arrow-clockwise','继续下一个','练习后，向下滚动到下一个单词']];
const stepsContainer=document.getElementById('steps');
if(stepsContainer)steps.forEach(([name,title,copy],i)=>{
 const d=document.createElement('div');d.className='step';
 d.innerHTML='<b>'+(i+1)+'</b><img src="'+icon(name,true)+'" alt=""><div><strong>'+title+'</strong><small>'+copy+'</small></div>';
 stepsContainer.append(d);
});
fetch('assets/lesson2-words.json').then(r=>{if(!r.ok)throw Error('data');return r.json()}).then(data=>{
 if(!Array.isArray(data)||data.length!==100)throw Error('Expected 100 words');
 words=data;
 const fragment=document.createDocumentFragment();
 cards=words.map((w,i)=>{const card=makeCard(w,i);fragment.append(card);return card});
 list.replaceChildren(fragment);updateProgress();
 // Visible version marker distinguishes the newest test build from a cached tab.
 diagnostic(0,'页面已加载。点击粉色麦克风按钮开始检测');
 requestAnimationFrame(fitWords);
 window.addEventListener('resize',()=>requestAnimationFrame(fitWords),{passive:true});
 window.lesson2={play,record,diagnostic,get words(){return words},get current(){return active}};
}).catch(e=>{
 list.textContent='单词加载失败，请刷新页面后重试。';
 console.error('Lesson 2 could not load:',e);
});
