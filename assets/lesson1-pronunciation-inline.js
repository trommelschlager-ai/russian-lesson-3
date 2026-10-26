/* Lesson 1 inline shadow-safe pronunciation practice.
 * Isolated to lesson 1; does not change the course's MP3 or other lessons.
 * Browser recognition checks the transcript, NOT actual pronunciation or stress.
 */
(() => {
  'use strict';
  if (window.__lesson1InlinePronunciationLoaded) return;
  window.__lesson1InlinePronunciationLoaded = true;

  const css=document.createElement('style');
  css.textContent=".rl1-panel,.rl1-panel *{box-sizing:border-box}\n.rl1-panel{max-width:100%;min-width:0;width:100%;margin:7px auto 0;padding:5px 3px 6px;\nborder:1px solid #cad5e7;border-radius:11px;background:#f9fbff;\nfont-family:system-ui,'Microsoft YaHei',sans-serif;line-height:1.35}\n.rl1-label{color:#3c4771;font-size:10px;font-weight:800;overflow-wrap:anywhere;margin:0 0 5px}\n.rl1-buttons{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:3px}\n.rl1-buttons button{min-width:0;min-height:52px;border:0;border-radius:8px;cursor:pointer;\ndisplay:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px;\npadding:4px 0;font:800 10px/1.2 system-ui,'Microsoft YaHei',sans-serif;color:white;white-space:nowrap}\n.rl1-original{background:#124ca2}.rl1-slow{background:#ad6518}.rl1-repeat{background:#ba1857}\n.rl1-buttons button:focus-visible{outline:2px solid #14235f;outline-offset:2px}\n.rl1-feedback{color:#4c5470;font-size:10px;line-height:1.35;margin-top:4px;overflow-wrap:anywhere;white-space:normal}\n.rl1-feedback[data-state='success']{color:#146435}\n.rl1-feedback[data-state='failure']{color:#a11d38}\n.rl1-feedback[data-state='warning']{color:#805315}\n.rl1-replay{background:#e4edff;border:1px solid #b6c6ed;color:#173870;border-radius:6px;margin-top:5px;padding:4px;font-size:11px}\n.ex.rl1-has-panel{min-width:0}\n.ex.rl1-has-panel>.rl1-panel{width:100%}
@media(min-width:621px){.rl1-disclosure>summary{display:none}}
@media(max-width:620px){.rl1-disclosure:not([open])>.rl1-label,.rl1-disclosure:not([open])>.rl1-buttons,.rl1-disclosure:not([open])>.rl1-feedback{display:none}}
\n@media(max-width:620px){.rl1-panel{padding:4px 2px}.rl1-buttons{gap:2px}\n.rl1-buttons button{min-height:49px;font-size:9px}.rl1-feedback{font-size:9px}}";
  document.head.append(css);

  const SpeechAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
  let activeRecognition = null;
  let activeRecorder = null;
  let activeStream = null;
  let activeAudio = null;
  let activeTimer = null;
  let recordingIsManual = false;
  let objectUrl = null;
  let recorderOwner = null;
  const root = document;

  function normalize(s) {
    return String(s || '').toLocaleLowerCase('ru-RU').replace(/ё/g, 'е')
      .replace(/[^\u0400-\u052f]+/g, ' ').trim().replace(/\s+/g, ' ');
  }
  function readableError(err) {
    const e = err?.error || err?.name || 'unknown';
    const messages = {
      'not-allowed':'没有麦克风权限。请在浏览器设置中允许此网站使用麦克风。',
      'service-not-allowed':'浏览器未允许语音识别服务。',
      'network':'语音识别需要网络连接，请检查网络。',
      'no-speech':'没有识别到声音，请再试一次。',
      'audio-capture':'无法使用麦克风，请检查权限。',
      'language-not-supported':'此设备不支持俄语语音识别。',
      'NotAllowedError':'没有麦克风权限，请在浏览器设置中开启。'
    };
    return messages[e] || '语音识别暂不可用（' + e + '）。';
  }
  function stopActivity() {
    clearTimeout(activeTimer); activeTimer = null;
    if (activeRecognition) {const r=activeRecognition; activeRecognition=null;try{r.abort();}catch{}}
    if (activeRecorder) {const r=activeRecorder;activeRecorder=null;try{if(r.state==='recording')r.stop();}catch{}}
    if (activeStream) {activeStream.getTracks().forEach(t=>t.stop());activeStream=null;}
    if (activeAudio) {activeAudio.pause();activeAudio=null;}
    if (window.CourseAudio) window.CourseAudio.stop(true);
  }
  function setFeedback(bar,message,kind='info') {
    const el=bar.querySelector('.rl1-feedback');
    el.dataset.state=kind;
    el.textContent=message;
  }
  function findRecording(text,role) {
    // The original alphabet lesson uses its own natural MP3 table.
    try {
      const uri=lesson1Recordings.get(text)||lesson1Recordings.get(text.toLocaleLowerCase('ru-RU'));
      return uri?{path:uri,role:role||'female'}:null;
    } catch{return null;}
  }
  function listen(bar,text,role,slow=false) {
    stopActivity();
    const sound=findRecording(text,role);
    if(!sound){setFeedback(bar,'此句暂时没有对应的音频，请使用原有的🔊按钮。','warning');return;}
    if(!slow && false && window.CourseAudio) {
      window.CourseAudio.play([{text,role:sound.role}]);
      setFeedback(bar,'正在播放原音。听完后点击“跟读”。');
      return;
    }
    const audio = new Audio(sound.path); activeAudio=audio;
    audio.playbackRate=slow?0.7:1;
    if ('preservesPitch' in audio) audio.preservesPitch=true;
    setFeedback(bar,slow?'正在慢速播放（0.7×）。':'正在播放原音。');
    audio.addEventListener('ended',()=>{if(activeAudio===audio){activeAudio=null;setFeedback(bar,'请点击“跟读”试一试。');}}, {once:true});
    audio.play().catch(()=>{if(activeAudio===audio) setFeedback(bar,'录音无法播放，请检查网络或再点一次。','failure');});
  }
  function useRecognition(bar,text,button) {
    stopActivity();
    const recognition=new SpeechAPI(); activeRecognition=recognition;
    let received=false; let error=false;
    recognition.lang='ru-RU';recognition.continuous=false;
    recognition.interimResults=false;recognition.maxAlternatives=3;
    button.textContent='🎙 聆听中';
    recognition.onstart=()=>{if(activeRecognition===recognition)setFeedback(bar,'请清楚地朗读：'+text);};
    recognition.onresult=event=>{
      if(activeRecognition!==recognition)return;
      const results=[];
      for(const r of event.results)for(const alternative of r){if(alternative?.transcript)results.push(alternative.transcript.trim());}
      if(!results.length)return;
      received=true;
      const expected=normalize(text);
      const match=results.find(x=>normalize(x)===expected);
      setFeedback(bar,(match?'✅ 识别文字一致：':'❌ 识别文字不同：')+(match||results[0])+
        '。注意：识别文字并不能判断口音、音素或重音是否准确。',match?'success':'failure');
    };
    recognition.onerror=event=>{
      if(activeRecognition!==recognition)return;
      error=true; recordingIsManual=true;button.textContent='🎤 跟读';
      setFeedback(bar,readableError(event)+' 再次点击“跟读”可录音自听。','warning');
    };
    recognition.onend=()=>{
      if(activeRecognition!==recognition)return;
      activeRecognition=null;button.textContent='🎤 跟读';
      if(!received&&!error)setFeedback(bar,'未收到识别结果；再次点击可重试。','warning');
    };
    try{recognition.start();}
    catch(err){activeRecognition=null;button.textContent='🎤 跟读';recordingIsManual=true;setFeedback(bar,readableError(err)+' 点击“跟读”可录音自听。','warning');}
  }
  async function useLocalRecorder(bar,button) {
    if(!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      setFeedback(bar,'浏览器既不支持俄语识别，也不支持录音。建议使用最新版 Chrome 和 HTTPS 页面。','warning');
      return;
    }
    stopActivity();
    setFeedback(bar,'正在请求麦克风权限。录音只在此设备播放，不会上传到课程网站。');
    let stream;
    try{stream=await navigator.mediaDevices.getUserMedia({audio:true});}
    catch(err){setFeedback(bar,readableError(err),'warning');return;}
    activeStream=stream;
    const chunks=[];
    let recorder;
    try{recorder=new MediaRecorder(stream);}
    catch{stream.getTracks().forEach(t=>t.stop());activeStream=null;setFeedback(bar,'此浏览器无法启动录音。','warning');return;}
    activeRecorder=recorder;recorderOwner=bar;
    button.textContent='■ 停止录音';
    recorder.ondataavailable=e=>{if(e.data?.size)chunks.push(e.data);};
    recorder.onstop=()=>{
      button.textContent='🎤 跟读';
      if(activeRecorder===recorder)activeRecorder=null;
      stream.getTracks().forEach(t=>t.stop());if(activeStream===stream)activeStream=null;
      if(recorderOwner!==bar)return;
      if(!chunks.length){setFeedback(bar,'没有录到声音，请重新尝试。','warning');return;}
      if(objectUrl)URL.revokeObjectURL(objectUrl);
      objectUrl=URL.createObjectURL(new Blob(chunks,{type:recorder.mimeType||'audio/webm'}));
      setFeedback(bar,'🎧 录音完成（未自动评分）。可以试听自己刚才说的话。');
      const replay=document.createElement('button');replay.className='rl1-replay';replay.type='button';replay.textContent='▶️ 听我的录音';
      replay.addEventListener('click',event=>{event.stopPropagation();if(activeAudio)activeAudio.pause();activeAudio=new Audio(objectUrl);activeAudio.play().catch(()=>setFeedback(bar,'无法播放录音。','warning'));});
      bar.querySelector('.rl1-feedback').append(replay);
    };
    try{recorder.start();setFeedback(bar,'🎙 正在录音……再次点击“停止录音”，或六秒后自动停止。');}
    catch{button.textContent='🎤 跟读';activeRecorder=null;stream.getTracks().forEach(t=>t.stop());activeStream=null;setFeedback(bar,'录音启动失败。','warning');return;}
    activeTimer=setTimeout(()=>{if(activeRecorder===recorder&&recorder.state==='recording')recorder.stop();},6000);
  }
  function microphone(bar,text,button) {
    if(activeRecorder && recorderOwner===bar && activeRecorder.state==='recording') {
      clearTimeout(activeTimer);activeRecorder.stop();return;
    }
    if(!window.isSecureContext) {setFeedback(bar,'麦克风只在 HTTPS 安全网页中可用。','warning');return;}
    if (SpeechAPI && !recordingIsManual) useRecognition(bar,text,button);
    else useLocalRecorder(bar,button);
  }
  function addBar(target, text, role='male',label='') {
    if(!target||target.classList.contains('rl1-has-panel'))return;
    const bar=document.createElement('div');bar.className='rl1-panel';
    const disclosure=document.createElement('details');disclosure.className='rl1-disclosure';
    disclosure.open=window.matchMedia('(min-width:621px)').matches;
    const summary=document.createElement('summary');summary.textContent='🎧 🎤 跟读练习';
    disclosure.append(summary);bar.append(disclosure);
    const cap=document.createElement('div');cap.className='rl1-label';
    cap.textContent=label||('跟读练习 · '+text);
    disclosure.append(cap);
    const controls=document.createElement('div');controls.className='rl1-buttons';
    const buttons=[
      ['🔊','听原音','rl1-original',()=>listen(bar,text,role,false)],
      ['🐢','慢速听','rl1-slow',()=>listen(bar,text,role,true)],
      ['🎤','跟读','rl1-repeat',()=>microphone(bar,text,mic)]
    ];
    let mic;
    buttons.forEach(([emoji,word,cls,handler])=>{
      const b=document.createElement('button');b.type='button';b.className=cls;
      b.textContent=emoji+' '+word;b.setAttribute('aria-label',word+'：'+text);
      b.addEventListener('click',handler);controls.append(b);
      if(cls==='rl1-repeat')mic=b;
    });
    disclosure.append(controls);
    const fb=document.createElement('div');fb.className='rl1-feedback';
    fb.setAttribute('role','status');fb.setAttribute('aria-live','polite');
    fb.textContent='先听原音，再跟读。仅核对识别文字，不判断重音。';
    disclosure.append(fb);
    // Preserve original card and dialog click listeners: control clicks must not start parent audio.
    bar.addEventListener('click',event=>event.stopPropagation());
    bar.addEventListener('keydown',event=>event.stopPropagation());
    target.append(bar);target.classList.add('rl1-has-panel');
  }
  function setup() {
    // Keep original alphabet layout and letter MP3 buttons unchanged.
    document.querySelectorAll('#lessonList .ex').forEach(card=>{
      const text=card.querySelector('.ex-word')?.textContent?.trim();
      if(!text||!findRecording(text,'female'))return;
      addBar(card,text,'female','跟读练习 · '+text);
    });
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup,{once:true});else setup();
  window.addEventListener('pagehide',()=>{stopActivity();if(objectUrl)URL.revokeObjectURL(objectUrl);});
})();


/* Complete alphabet lesson after the learner has listened to all 33 distinct letters.
   Existing images, audio and pronunciation buttons are not modified. */
(() => {
  'use strict';
  const alphabet=new Set(Array.from('АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ'));
  const key='russian-lesson1-letters-heard-v1';
  let heard=new Set();
  try {
    const stored=JSON.parse(localStorage.getItem(key)||'[]');
    if(Array.isArray(stored))heard=new Set(stored.filter(letter=>alphabet.has(letter)));
  } catch (_) {}
  function countLetter(event){
    const button=event.target.closest('button[data-letter]');
    const letter=button&&button.dataset.letter;
    if(!alphabet.has(letter)||heard.has(letter))return;
    heard.add(letter);
    try {
      localStorage.setItem(key,JSON.stringify([...heard]));
      if(heard.size===alphabet.size){
        const keyProgress='russian-course-progress-v1';
        const saved=JSON.parse(localStorage.getItem(keyProgress)||'{}');
        saved[1]={score:33,total:33,date:new Date().toISOString()};
        localStorage.setItem(keyProgress,JSON.stringify(saved));
      }
    } catch (_) { /* The lesson still works if browser storage is disabled. */ }
  }
  document.addEventListener('click',countLetter,true);
})();


/* Six-column alphabet layout adapter.
 * Does not alter the existing speech recognition or MP3 handlers. */
(()=>{
  "use strict";
  if(window.__lesson1SixColumnLoaderStarted)return;
  if(!document.getElementById("hotspots")||!document.getElementById("lessonList"))return;
  window.__lesson1SixColumnLoaderStarted=true;
  const script=document.createElement("script");
  script.src="assets/lesson1-six-column-alphabet.js?v=lesson1-one-screen-overview-20261026c";
  script.async=false;
  document.head.append(script);
})();
