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
let words=[],cards=[],active=-1,recognition=null,recorder=null,stream=null;
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
function status(i,title,copy,error=false){
 const card=cards[i];if(!card)return;
 el(card,'status-title').textContent=title;
 el(card,'status-copy').textContent=copy;
 el(card,'feedback').classList.toggle('error',error);
 el(card,'status-icon').src=icon(error?'arrow-clockwise':'speaker-high');
}
function markSeen(i){seen.add(indexOf(words[i]));updateProgress()}
function stop(){
 audio.pause();
 if(recognition){try{recognition.abort()}catch{}recognition=null}
 if(recorder&&recorder.state==='recording')recorder.stop();
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
async function record(i){
 if(!words[i])return;
 stop();active=i;markSeen(i);
 const card=cards[i],button=el(card,'record');
 const API=window.SpeechRecognition||window.webkitSpeechRecognition;
 if(!navigator.mediaDevices?.getUserMedia){status(i,'浏览器不支持麦克风','请使用 HTTPS 页面和支持麦克风的浏览器。',true);return}
 try{
  const mic=await navigator.mediaDevices.getUserMedia({audio:true});
  if(active!==i){mic.getTracks().forEach(t=>t.stop());return}
  stream=mic;button.disabled=true;
  if(window.MediaRecorder){
   const chunks=[],r=new MediaRecorder(mic);recorder=r;
   r.addEventListener('dataavailable',e=>{if(e.data.size)chunks.push(e.data)});
   r.addEventListener('stop',()=>{
    if(!chunks.length)return;
    if(recordings.has(i))URL.revokeObjectURL(recordings.get(i));
    const url=URL.createObjectURL(new Blob(chunks,{type:r.mimeType}));
    recordings.set(i,url);
    let replay=card.querySelector('.listen-recording');
    if(!replay){replay=document.createElement('button');replay.className='listen-recording';replay.textContent='听自己的录音';el(card,'status-copy').after(replay)}
    replay.onclick=async()=>{stop();active=i;audio.src=url;audio.playbackRate=1;try{await audio.play()}catch{status(i,'无法播放录音','请再次点击。',true)}};
   });
   r.start();
  }
  if(!API){
   status(i,'正在录音（最多8秒）','此浏览器不支持文字识别。请听自己的录音，与原音比较。');
   setTimeout(()=>{if(active===i){stop();status(i,'录音完成','请听自己的录音，与原音比较。')}},8000);
   return;
  }
  const r=new API();recognition=r;
  r.lang='ru-RU';r.interimResults=false;r.maxAlternatives=3;
  r.onresult=e=>{
   if(active!==i)return;
   const heard=e.results[0][0].transcript,match=norm(heard)===norm(words[i].word),id=indexOf(words[i]);
   if(match){good.add(id);review.delete(id)}else{review.add(id);good.delete(id)}
   status(i,match?'识别文字一致！':'请再试一次','听到：'+heard+'。文字识别不能判断重音是否正确。',!match);updateProgress();
  };
  r.onerror=e=>{if(active===i)status(i,'识别未完成',e.error==='not-allowed'?'请允许麦克风权限。':'未能识别，请检查网络并重试。',true)};
  r.onend=()=>{
   if(recognition===r)recognition=null;
   if(recorder?.state==='recording')recorder.stop();
   mic.getTracks().forEach(t=>t.stop());
   if(stream===mic)stream=null;
   button.disabled=false;
  };
  r.start();
  status(i,'正在听，请朗读…','请读：'+words[i].word);
  setTimeout(()=>{if(active===i&&recognition===r)r.stop()},8000);
 }catch{
  stop();status(i,'无法使用麦克风','请检查浏览器的麦克风权限。',true);
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
 requestAnimationFrame(fitWords);
 window.addEventListener('resize',()=>requestAnimationFrame(fitWords),{passive:true});
 window.lesson2={play,record,get words(){return words},get current(){return active}};
}).catch(e=>{
 list.textContent='单词加载失败，请刷新页面后重试。';
 console.error('Lesson 2 could not load:',e);
});
