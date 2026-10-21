/* Lesson 6 inline shadow-safe pronunciation practice.
 * Isolated to lesson 6; does not change the course's MP3 or other lessons.
 * Browser recognition checks the transcript, NOT actual pronunciation or stress.
 */
(() => {
  'use strict';
  if (window.__lesson6InlinePronunciationLoaded) return;
  window.__lesson6InlinePronunciationLoaded = true;

  const css = document.createElement('style');
  css.textContent = `
    .rl6-panel,.rl6-panel *{box-sizing:border-box}
    .rl6-panel{position:relative;z-index:2;max-width:100%;min-width:0;width:100%;
      border:1px solid #dfcdeb;border-radius:12px;background:#fffafa;
      padding:7px 6px;margin:9px 0 4px;line-height:1.3;
      box-shadow:0 2px 6px rgba(50,26,100,.08);font-family:system-ui,'Microsoft YaHei',sans-serif}
    .rl6-label{font-size:12px;font-weight:800;color:#544071;margin:0 0 6px;line-height:1.35;overflow-wrap:anywhere}
    .rl6-buttons{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:4px;width:100%}
    .rl6-buttons button{appearance:none;min-width:0;display:flex;align-items:center;justify-content:center;
      gap:2px;min-height:42px;padding:5px 1px;color:white;border:0;border-radius:8px;
      font-size:11px;font-weight:800;line-height:1.3;white-space:nowrap;cursor:pointer;
      box-shadow:0 2px 3px rgba(26,30,58,.14)}
    .rl6-original{background:#124ca2}.rl6-slow{background:#ad6518}.rl6-repeat{background:#ba1857}
    .rl6-buttons button:focus-visible{outline:3px solid #101a57;outline-offset:2px}
    .rl6-feedback{font-size:11px;line-height:1.45;color:#594a68;margin:6px 0 0;overflow-wrap:anywhere}
    .rl6-feedback[data-state='success']{color:#146435}
    .rl6-feedback[data-state='failure']{color:#a11d38}
    .rl6-feedback[data-state='warning']{color:#805315}
    .rl6-replay{background:#eef3ff;color:#223e80;border:1px solid #bdc9e8;padding:5px 9px;
      border-radius:9px;cursor:pointer;margin-top:6px;font-size:12px;font-weight:700}
    .vocab-card.rl6-has-panel,.extra-card.rl6-has-panel{min-width:0}
    .vocab-card.rl6-has-panel>.rl6-panel,.extra-card.rl6-has-panel>.rl6-panel{width:100%}
    .mobile-dialogue-line.rl6-has-panel>.rl6-panel{grid-column:1/-1;margin:3px 0}
    .extra-dialogue-line.rl6-has-panel>.rl6-panel{grid-column:1/-1;margin:3px 0}

    .time-card.rl6-has-panel>.rl6-panel{width:100%;grid-column:1/-1;margin:5px 0}
    .activity-card.rl6-has-panel>.rl6-panel{width:100%;grid-column:1/-1;margin:6px 0}
    .day-dialogue-card.rl6-has-panel>.rl6-panel{width:100%;grid-column:1/-1;margin:6px 0}
    .rl6-desktop-practice{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;padding:10px}
    .rl6-desktop-card{background:#fffaf2;border:1px solid #d9c6e3;border-radius:14px;padding:10px;min-width:0}
    .rl6-desktop-card>.rl6-panel{margin:5px 0}
    .rl6-desktop-ru{font-weight:800;font-size:19px;line-height:1.3;color:#3e2458}
    .rl6-desktop-zh{font-size:14px;color:#655474}
    @media(max-width:560px){.rl6-desktop-practice{display:none}}
    @media(max-width:390px){.rl6-buttons{gap:2px}.rl6-buttons button{font-size:10px;padding:4px 0}}
  `;
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
    const el=bar.querySelector('.rl6-feedback');
    el.dataset.state=kind;
    el.textContent=message;
  }
  function findRecording(text,role) {
    const manifest=window.COURSE_AUDIO||{};
    const candidates=[role+'|'+text,'male|'+text,'female|'+text];
    for(const key of candidates)if(manifest[key])return {path:manifest[key],role:key.split('|')[0]};
    return null;
  }
  function listen(bar,text,role,slow=false) {
    stopActivity();
    const sound=findRecording(text,role);
    if(!sound){setFeedback(bar,'此句暂时没有对应的音频，请使用原有的🔊按钮。','warning');return;}
    if(!slow && window.CourseAudio) {
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
      const replay=document.createElement('button');replay.className='rl6-replay';replay.type='button';replay.textContent='▶️ 听我的录音';
      replay.addEventListener('click',event=>{event.stopPropagation();if(activeAudio)activeAudio.pause();activeAudio=new Audio(objectUrl);activeAudio.play().catch(()=>setFeedback(bar,'无法播放录音。','warning'));});
      bar.querySelector('.rl6-feedback').append(replay);
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
    if(!target||target.classList.contains('rl6-has-panel'))return;
    const bar=document.createElement('div');bar.className='rl6-panel';
    const cap=document.createElement('div');cap.className='rl6-label';
    cap.textContent=label||('跟读练习 · '+text);
    bar.append(cap);
    const controls=document.createElement('div');controls.className='rl6-buttons';
    const buttons=[
      ['🔊','听原音','rl6-original',()=>listen(bar,text,role,false)],
      ['🐢','慢速听','rl6-slow',()=>listen(bar,text,role,true)],
      ['🎤','跟读','rl6-repeat',()=>microphone(bar,text,mic)]
    ];
    let mic;
    buttons.forEach(([emoji,word,cls,handler])=>{
      const b=document.createElement('button');b.type='button';b.className=cls;
      b.textContent=emoji+' '+word;b.setAttribute('aria-label',word+'：'+text);
      b.addEventListener('click',handler);controls.append(b);
      if(cls==='rl6-repeat')mic=b;
    });
    bar.append(controls);
    const fb=document.createElement('div');fb.className='rl6-feedback';
    fb.setAttribute('role','status');fb.setAttribute('aria-live','polite');
    fb.textContent='先听原音，再跟读。仅核对识别文字，不判断重音。';
    bar.append(fb);
    // Preserve original card and dialog click listeners: control clicks must not start parent audio.
    bar.addEventListener('click',event=>event.stopPropagation());
    bar.addEventListener('keydown',event=>event.stopPropagation());
    target.append(bar);target.classList.add('rl6-has-panel');
  }

  function setup() {
    // Preserve every original card, existing play control, artwork and voice recording.
    document.querySelectorAll('.vocab-card,.extra-card,.mobile-dialogue-line,.extra-dialogue-line').forEach(card => {
      const button=card.querySelector('button[data-say]');
      if(!button)return;
      const word=button.dataset.say;
      const role=button.dataset.role||'male';
      addBar(card,word,role,'跟读练习 · '+word);
    });
    
    // On desktops, practice must remain visible even where the original dialogue is an image hotspot.
    const scene=document.querySelector('.lesson-6 .art-dialogue');
    const mobileLines=[...document.querySelectorAll('.lesson-6 .mobile-dialogue-line')];
    if(scene && mobileLines.length && !document.querySelector('.rl6-desktop-practice')) {
      const strip=document.createElement('section');
      strip.className='rl6-desktop-practice';
      strip.setAttribute('aria-label','对话跟读');
      mobileLines.forEach(line=>{
        const original=line.querySelector('button[data-say]');
        if(!original)return;
        const holder=document.createElement('div');holder.className='rl6-desktop-card';
        const ru=document.createElement('div');ru.className='rl6-desktop-ru';ru.lang='ru';ru.textContent=original.dataset.say;
        const zh=document.createElement('div');zh.className='rl6-desktop-zh';zh.lang='zh-CN';zh.textContent=line.querySelector('.zh')?.textContent||'';
        holder.append(ru,zh);
        addBar(holder,original.dataset.say,original.dataset.role||'male','对话跟读');
        strip.append(holder);
      });
      scene.after(strip);
    }
    
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup,{once:true});else setup();
  window.addEventListener('pagehide',()=>{stopActivity();if(objectUrl)URL.revokeObjectURL(objectUrl);});
})();
