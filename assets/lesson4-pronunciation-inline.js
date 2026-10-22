/* Lesson 4 inline shadow-safe pronunciation practice.
 * Isolated to lesson 4; does not change the course's MP3 or other lessons.
 * Browser recognition checks the transcript, NOT actual pronunciation or stress.
 */
(() => {
  'use strict';
  if (window.__lesson4InlinePronunciationLoaded) return;
  window.__lesson4InlinePronunciationLoaded = true;

  const css = document.createElement('style');
  css.textContent = `
    .rl4-panel,.rl4-panel *{box-sizing:border-box}
    .rl4-panel{position:relative;z-index:2;max-width:100%;min-width:0;width:100%;
      border:1px solid #dfcdeb;border-radius:12px;background:#fffafa;
      padding:7px 6px;margin:9px 0 4px;line-height:1.3;
      box-shadow:0 2px 6px rgba(50,26,100,.08);font-family:system-ui,'Microsoft YaHei',sans-serif}
    .rl4-label{font-size:12px;font-weight:800;color:#544071;margin:0 0 6px;line-height:1.35;overflow-wrap:anywhere}
    .rl4-buttons{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:4px;width:100%}
    .rl4-buttons button{appearance:none;min-width:0;display:flex;align-items:center;justify-content:center;
      gap:2px;min-height:42px;padding:5px 1px;color:white;border:0;border-radius:8px;
      font-size:11px;font-weight:800;line-height:1.3;white-space:nowrap;cursor:pointer;
      box-shadow:0 2px 3px rgba(26,30,58,.14)}
    .rl4-original{background:#124ca2}.rl4-slow{background:#ad6518}.rl4-repeat{background:#ba1857}
    .rl4-buttons button:focus-visible{outline:3px solid #101a57;outline-offset:2px}
    .rl4-feedback{font-size:11px;line-height:1.45;color:#594a68;margin:6px 0 0;overflow-wrap:anywhere}
    .rl4-feedback[data-state='success']{color:#146435}
    .rl4-feedback[data-state='failure']{color:#a11d38}
    .rl4-feedback[data-state='warning']{color:#805315}
    .rl4-replay{background:#eef3ff;color:#223e80;border:1px solid #bdc9e8;padding:5px 9px;
      border-radius:9px;cursor:pointer;margin-top:6px;font-size:12px;font-weight:700}
    .vocab-card.rl4-has-panel,.extra-card.rl4-has-panel{min-width:0}
    .vocab-card.rl4-has-panel>.rl4-panel,.extra-card.rl4-has-panel>.rl4-panel{width:100%}
    .mobile-dialogue-line.rl4-has-panel>.rl4-panel{grid-column:1/-1;margin:3px 0}
    .extra-dialogue-line.rl4-has-panel>.rl4-panel{grid-column:1/-1;margin:3px 0}
    .rl4-desktop-practice{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;padding:10px}
    .rl4-desktop-card{background:#fffaf2;border:1px solid #d9c6e3;border-radius:14px;padding:10px;min-width:0}
    .rl4-desktop-card>.rl4-panel{margin:5px 0}
    .rl4-desktop-ru{font-weight:800;font-size:19px;line-height:1.3;color:#3e2458}
    .rl4-desktop-zh{font-size:14px;color:#655474}
    @media(max-width:560px){.rl4-desktop-practice{display:none}}
    @media(max-width:390px){.rl4-buttons{gap:2px}.rl4-buttons button{font-size:10px;padding:4px 0}}
  `;
  document.head.append(css);

  const SpeechAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
  let activeRecognition = null;
  let activeRecorder = null;
  let activeStream = null;
  let activeAudio = null;
  let activeTimer = null;
  let activeMicButton = null;
  let recognitionTimer = null;
  let microphoneRequest = 0;
  let objectUrl = null;
  let recorderOwner = null;
  const root = document;

  function normalize(s) {
    return String(s || '').toLocaleLowerCase('ru-RU').replace(/ё/g, 'е')
      .replace(/[^\p{L}\p{N}]+/gu, ' ').trim().replace(/\s+/g, ' ');
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
    microphoneRequest++;
    clearTimeout(recognitionTimer); recognitionTimer = null;
    if(activeMicButton){activeMicButton.textContent="🎤 跟读";activeMicButton=null;}
    clearTimeout(activeTimer); activeTimer = null;
    if (activeRecognition) {const r=activeRecognition; activeRecognition=null;try{r.abort();}catch{}}
    if (activeRecorder) {const r=activeRecorder;activeRecorder=null;try{if(r.state==='recording')r.stop();}catch{}}
    if (activeStream) {activeStream.getTracks().forEach(t=>t.stop());activeStream=null;}
    if (activeAudio) {activeAudio.pause();activeAudio=null;}
    if (window.CourseAudio) window.CourseAudio.stop(true);
  }
  function setFeedback(bar,message,kind='info') {
    const el=bar.querySelector('.rl4-feedback');
    el.dataset.state=kind;
    el.textContent=message;
  }
  function findRecording(text,role) {
    const manifest=window.COURSE_AUDIO||{};
    const path=manifest[role+'|'+text];
    return path ? {path,role} : null;
  }
  function listen(bar,text,role,slow=false) {
    stopActivity();
    const sound=findRecording(text,role);
    if(!sound){setFeedback(bar,'此句尚无配套 MP3 录音。暂不提供系统朗读。 / Для этой реплики MP3 пока нет.','warning');return;}
    const audio = new Audio(sound.path); activeAudio=audio;
    audio.playbackRate=slow?0.7:1;
    if ('preservesPitch' in audio) audio.preservesPitch=true;
    setFeedback(bar,slow?'正在慢速播放（0.7×）。':'正在播放原音。');
    audio.addEventListener('ended',()=>{if(activeAudio===audio){activeAudio=null;setFeedback(bar,'请点击“跟读”试一试。');}}, {once:true});
    audio.addEventListener('error',()=>{if(activeAudio===audio)setFeedback(bar,'录音无法播放，请检查网络或再点一次。','failure');},{once:true});
    audio.play().catch(()=>{if(activeAudio===audio) setFeedback(bar,'录音无法播放，请检查网络或再点一次。','failure');});
  }
  function useRecognition(bar,text,button) {
    stopActivity();
    const recognition=new SpeechAPI(); activeRecognition=recognition;
    activeMicButton=button;
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
      const match=normalize(results[0])===expected ? results[0] : null;
      setFeedback(bar,(match?'✅ 识别文字一致：':'❌ 识别文字不同：')+(match||results[0])+
        '。注意：识别文字并不能判断口音、音素或重音是否准确。',match?'success':'failure');
    };
    recognition.onerror=event=>{
      if(activeRecognition!==recognition)return;
      error=true;button.textContent='🎤 跟读';
      setFeedback(bar,readableError(event)+' 点击“跟读”可重试；也可以录音自听。','warning');offerRecorder(bar,button);
    };
    recognition.onend=()=>{
      if(activeRecognition!==recognition)return;
      clearTimeout(recognitionTimer);recognitionTimer=null;
      activeRecognition=null;activeMicButton=null;button.textContent='🎤 跟读';
      if(!received&&!error)setFeedback(bar,'未收到识别结果；再次点击可重试。','warning');
    };
    try{recognition.start();recognitionTimer=setTimeout(()=>{
      if(activeRecognition!==recognition)return;
      error=true;setFeedback(bar,'识别超时，请重试或录音自听。','warning');offerRecorder(bar,button);
      recognition.abort();button.textContent='🎤 跟读';
    },15000);}
    catch(err){activeRecognition=null;button.textContent='🎤 跟读';setFeedback(bar,readableError(err)+' 可以录音自听。','warning');offerRecorder(bar,button);}
  }
  function offerRecorder(bar,button){
    const record=document.createElement('button');record.type='button';record.className='rl4-replay';record.textContent='🎙 录音自听（不评分）';
    record.addEventListener('click',()=>useLocalRecorder(bar,button));
    bar.querySelector('.rl4-feedback').append(record);
  }
  async function useLocalRecorder(bar,button) {
    if(!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      setFeedback(bar,'浏览器既不支持俄语识别，也不支持录音。建议使用最新版 Chrome 和 HTTPS 页面。','warning');
      return;
    }
    stopActivity();
    setFeedback(bar,'正在请求麦克风权限。录音只在此设备播放，不会上传到课程网站。');
    const request=microphoneRequest;
    let stream;
    try{stream=await navigator.mediaDevices.getUserMedia({audio:true});}
    catch(err){setFeedback(bar,readableError(err),'warning');return;}
    if(request!==microphoneRequest){stream.getTracks().forEach(t=>t.stop());return;}
    activeStream=stream;
    const chunks=[];
    let recorder;
    try{recorder=new MediaRecorder(stream);}
    catch{stream.getTracks().forEach(t=>t.stop());activeStream=null;setFeedback(bar,'此浏览器无法启动录音。','warning');return;}
    activeRecorder=recorder;recorderOwner=bar;activeMicButton=button;
    button.textContent='■ 停止录音';
    recorder.ondataavailable=e=>{if(e.data?.size)chunks.push(e.data);};
    recorder.onstop=()=>{
      button.textContent='🎤 跟读';
      if(activeRecorder===recorder)activeRecorder=null;
      stream.getTracks().forEach(t=>t.stop());if(activeStream===stream)activeStream=null;
      if(recorderOwner!==bar || request!==microphoneRequest)return;
      if(activeMicButton===button)activeMicButton=null;
      if(!chunks.length){setFeedback(bar,'没有录到声音，请重新尝试。','warning');return;}
      if(objectUrl)URL.revokeObjectURL(objectUrl);
      objectUrl=URL.createObjectURL(new Blob(chunks,{type:recorder.mimeType||'audio/webm'}));
      const replayUrl=objectUrl;
      setFeedback(bar,'🎧 录音完成（未自动评分）。可以试听自己刚才说的话。');
      const replay=document.createElement('button');replay.className='rl4-replay';replay.type='button';replay.textContent='▶️ 听我的录音';
      replay.addEventListener('click',event=>{event.stopPropagation();if(activeAudio)activeAudio.pause();activeAudio=new Audio(replayUrl);activeAudio.play().catch(()=>setFeedback(bar,'无法播放录音。','warning'));});
      bar.querySelector('.rl4-feedback').append(replay);
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
    if(activeRecognition && activeMicButton===button){stopActivity();setFeedback(bar,'已停止识别。');return;}
    if (SpeechAPI) useRecognition(bar,text,button);
    else useLocalRecorder(bar,button);
  }
  function addBar(target, text, role='male',label='') {
    if(!target||target.classList.contains('rl4-has-panel'))return;
    const bar=document.createElement('div');bar.className='rl4-panel';
    const cap=document.createElement('div');cap.className='rl4-label';
    cap.textContent=label||('跟读练习 · '+text);
    bar.append(cap);
    const controls=document.createElement('div');controls.className='rl4-buttons';
    const buttons=[
      ['🔊','听原音','rl4-original',()=>listen(bar,text,role,false)],
      ['🐢','慢速听','rl4-slow',()=>listen(bar,text,role,true)],
      ['🎤','跟读','rl4-repeat',()=>microphone(bar,text,mic)]
    ];
    let mic;
    buttons.forEach(([emoji,word,cls,handler])=>{
      const b=document.createElement('button');b.type='button';b.className=cls;
      b.textContent=emoji+' '+word;b.setAttribute('aria-label',word+'：'+text);
      b.addEventListener('click',handler);controls.append(b);
      if(cls==='rl4-repeat')mic=b;
    });
    bar.append(controls);
    const hasNativeAudio=!!findRecording(text,role);
    if(!hasNativeAudio){
      buttons.slice(0,2).forEach((_,i)=>{
        const button=controls.children[i];
        button.disabled=true;
        button.title='MP3 录音待补充 · Запись пока отсутствует';
      });
    }
    const fb=document.createElement('div');fb.className='rl4-feedback';
    fb.setAttribute('role','status');fb.setAttribute('aria-live','polite');
    fb.textContent=hasNativeAudio
      ? '先听原音，再跟读。仅核对识别文字，不判断重音。'
      : 'MP3 录音待补充，暂不提供系统朗读。🎤跟读可用。';
    bar.append(fb);
    // Preserve original card and dialog click listeners: control clicks must not start parent audio.
    bar.addEventListener('click',event=>event.stopPropagation());
    bar.addEventListener('keydown',event=>event.stopPropagation());
    target.append(bar);target.classList.add('rl4-has-panel');
  }
  function setup() {
    const dock=document.querySelector('.audio-dock');
    if(dock){
      const updateDock=()=>document.documentElement.style.setProperty('--lesson4-dock-height',dock.getBoundingClientRect().height+'px');
      updateDock();
      if(window.ResizeObserver)new ResizeObserver(updateDock).observe(dock);
    }
    // Only dialogue #extra-dialogue-4 is new. Prevent missing MP3 from triggering
    // "全部播放" errors; the three-button microphone still works per sentence.
    const replacementDialogue=document.getElementById('extra-dialogue-4');
    if(replacementDialogue){
      const playButtons=[...replacementDialogue.querySelectorAll('button[data-say]')];
      playButtons.forEach(button=>{
        const playable=!!findRecording(button.dataset.say,button.dataset.role||'male');
        button.disabled=!playable;
        button.title=playable?'听原音':'原声录音待补充 · Запись пока отсутствует';
        button.setAttribute('aria-label',(playable?'听 ':'录音准备中：')+button.dataset.say);
      });
      const playAll=document.querySelector('[data-course-all="extra-dialogue-4"]');
      if(playAll){
        const ready=playButtons.length===4&&playButtons.every(button=>!button.disabled);
        playAll.disabled=!ready;
        playAll.textContent=ready?'🔊 全部播放':'🔊 录音准备中';
        playAll.title=ready?'听完整对话':'原声录音待补充 · Запись пока отсутствует';
      }
    }
    // Pending recordings remain explicit: never substitute browser speech.
    document.querySelectorAll('.lesson-4 .lesson4-pending-play').forEach(button=>{
      button.title='MP3 录音待补充 · Запись пока отсутствует';
    });
    // Leave the original sound buttons, images, dialogues, and cards untouched.
    // The original image-hotspots have equivalent text in the mobile dialogue;
    // on desktop we add a dedicated practice strip below the image.
    const selector='.vocab-card,.mobile-dialogue-line,.extra-card,.extra-dialogue-line';
    document.querySelectorAll(selector).forEach(card=>{
      const original=card.querySelector('button[data-say]');
      const text=original?.dataset.say||card.dataset.practiceText;
      if(!text)return;
      const role=original?.dataset.role||card.dataset.practiceRole||'male';
      addBar(card,text,role,'跟读练习 · '+text);
    });
    const illustration=document.querySelector('.lesson-4 .art-dialogue');
    const speechLines=[...document.querySelectorAll('.lesson-4 .mobile-dialogue-line')];
    if(illustration&&!document.querySelector('#lesson4-original-two')&&speechLines.length&&!document.querySelector('.rl4-desktop-practice')){
      const strip=document.createElement('section');
      strip.className='rl4-desktop-practice';
      strip.setAttribute('aria-label','对话跟读 · Диалоговая практика');
      speechLines.forEach(line=>{
        const source=line.querySelector('button[data-say]');
        if(!source)return;
        const card=document.createElement('div');card.className='rl4-desktop-card';
        const ru=document.createElement('div');ru.className='rl4-desktop-ru';ru.lang='ru';
        ru.textContent=source.dataset.say;
        const zh=document.createElement('div');zh.className='rl4-desktop-zh';zh.lang='zh-CN';
        zh.textContent=line.querySelector('.zh')?.textContent||'';
        card.append(ru,zh);
        addBar(card,source.dataset.say,source.dataset.role||'male','对话跟读');
        strip.append(card);
      });
      illustration.after(strip);
    }
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup,{once:true});else setup();
  document.addEventListener('click',event=>{
    if(!event.target.closest('.rl4-panel') && event.target.closest('[data-say],[data-course-all],.rc-listen'))stopActivity();
  },true);
  document.getElementById('course-audio-stop')?.addEventListener('click',()=>stopActivity());
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stopActivity();});
  window.addEventListener('pagehide',()=>{stopActivity();if(objectUrl)URL.revokeObjectURL(objectUrl);});
})();
