/* Lesson 3 inline shadow-safe pronunciation practice.
 * Isolated to lesson 3; does not change the course's MP3 or other lessons.
 * Browser recognition checks the transcript, NOT actual pronunciation or stress.
 */
(() => {
  'use strict';
  if (window.__lesson3InlinePronunciationLoaded) return;
  window.__lesson3InlinePronunciationLoaded = true;

  const css = document.createElement('style');
  css.textContent = `
    .rl3-panel,.rl3-panel * {box-sizing:border-box}
    .rl3-panel {position:relative;z-index:2;min-width:0;max-width:100%;margin:9px 0 5px;
      padding:8px;border:1px solid #dac8f1;border-radius:13px;background:#fffafa;
      box-shadow:0 2px 6px rgba(50,26,100,.08);line-height:1.3;font-family:system-ui,'Microsoft YaHei',sans-serif}
    .rl3-panel .rl3-label {font-size:12px;font-weight:800;color:#544071;margin-bottom:6px;
      overflow-wrap:anywhere;line-height:1.4}
    .rl3-buttons {display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px}
    .rl3-buttons button {appearance:none;display:flex;align-items:center;justify-content:center;
      gap:4px;min-width:0;min-height:43px;padding:6px 3px;color:white;border:0;border-radius:10px;
      font-size:12px;font-weight:800;line-height:1.2;white-space:nowrap;cursor:pointer;
      box-shadow:0 2px 3px rgba(26,30,58,.14)}
    .rl3-buttons .rl3-original {background:#124ca2}
    .rl3-buttons .rl3-slow {background:#ad6518}
    .rl3-buttons .rl3-repeat {background:#ba1857}
    .rl3-buttons button:focus-visible {outline:3px solid #101a57;outline-offset:2px}
    .rl3-buttons button:disabled {opacity:.48;cursor:not-allowed}
    .rl3-feedback {font-size:12px;line-height:1.48;color:#594a68;min-height:0;margin-top:6px;
      white-space:normal;overflow-wrap:anywhere}
    .rl3-feedback[data-state='success'] {color:#146435}
    .rl3-feedback[data-state='failure'] {color:#a11d38}
    .rl3-feedback[data-state='warning'] {color:#805315}
    .rl3-replay {background:#eef3ff;color:#223e80;border:1px solid #bdc9e8;
      padding:5px 9px;border-radius:9px;cursor:pointer;margin-top:6px;font-size:12px;font-weight:700}
    #pronoun-cards .card.rl3-has-panel {grid-template-rows:auto auto auto}
    #pronoun-cards .card.rl3-has-panel > .rl3-panel {grid-column:1 / -1;margin:3px 8px 5px}
    #pronoun-cards .card.rl3-has-panel > .rl3-example-holder {grid-column:1 / -1;min-width:0;margin:0 8px 6px}
    #pronoun-cards .rl3-example-holder > .rl3-panel {margin:0}
    .examples-grid .example-card.rl3-has-panel > .rl3-panel {margin-top:14px}
    .examples-grid .example-card.rl3-has-panel {padding-bottom:12px}
    .dialogue-card .say.rl3-has-panel {flex-wrap:wrap;align-items:flex-start}
    .dialogue-card .say.rl3-has-panel > .rl3-panel {flex:1 1 100%;width:100%;margin:4px 0 0}
    .examples-list li.rl3-has-panel {flex-wrap:wrap}
    .examples-list li.rl3-has-panel > .rl3-panel {flex:1 1 100%;width:100%;margin-top:5px}
    .window-sentences .sentence.rl3-has-panel > .rl3-panel {width:100%;margin-top:7px}
    @media(max-width:430px) {
      .rl3-panel {padding:6px;margin-top:6px}
      .rl3-buttons {gap:4px}
      .rl3-buttons button {font-size:11px;min-height:40px;gap:2px;padding:5px 1px}
      .rl3-label,.rl3-feedback {font-size:11px}
    }

    /* The original two-column grid must not stretch neighbouring cards when a result appears. */
    #pronoun-cards.pronouns {align-items:start}
    #pronoun-cards .card.rl3-has-panel {align-self:start;grid-template-rows:auto auto auto}
    @media(hover:none){#pronoun-cards .card:hover{transform:none;box-shadow:0 4px 0 #c6a5f0}}
    /* Keep feedback local to only the item that the student actively tested. */
    .rl3-feedback{display:none}
    .rl3-feedback.is-visible{display:block;min-height:46px;max-height:110px;overflow-y:auto;
      overscroll-behavior:contain;padding:5px 1px 1px}
    /* Move the example illustration to the top, and give the practice panel full card width. */
    .examples-grid .example-card.rl3-has-panel{
      display:grid;grid-template-columns:minmax(0,2fr) minmax(0,1fr);
      grid-template-rows:repeat(4,auto) auto;align-content:start;align-items:start;
      justify-content:stretch;gap:3px 10px;padding:13px;min-height:0
    }
    .examples-grid .example-card.rl3-has-panel>h3,
    .examples-grid .example-card.rl3-has-panel>.translit,
    .examples-grid .example-card.rl3-has-panel>.chinese,
    .examples-grid .example-card.rl3-has-panel>.action{grid-column:1;min-width:0;margin-right:0;align-self:start}
    .examples-grid .example-card.rl3-has-panel>.example-illustration{
      position:static;grid-column:2;grid-row:1/span 4;align-self:start;
      display:block;width:100%;height:125px;min-height:0;max-height:140px;
      object-fit:contain;object-position:center top;background:#ead9ff;
      border-left:0;border-radius:10px
    }
    .examples-grid .example-card.rl3-has-panel>.rl3-panel{
      grid-column:1/-1;grid-row:5;width:100%;max-width:100%;margin:10px 0 0;padding:10px
    }
    .examples-grid .example-card.rl3-has-panel .rl3-buttons button{min-height:51px;font-size:14px;padding:8px 3px}
    @media(max-width:620px){
      .examples-grid .example-card.rl3-has-panel{grid-template-columns:minmax(0,1.7fr) minmax(0,1fr)}
      .examples-grid .example-card.rl3-has-panel>.rl3-panel{padding:9px 7px}
      .examples-grid .example-card.rl3-has-panel>.example-illustration{height:110px}
      .examples-grid .example-card.rl3-has-panel .rl3-buttons button{font-size:13px;min-height:49px}
    }
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
    const el=bar.querySelector('.rl3-feedback');
    el.dataset.state=kind;
    // A spoken result belongs to one item, never to an entire grid row.
    document.querySelectorAll('.rl3-feedback.is-visible').forEach(other=>{
      if(other!==el){other.classList.remove('is-visible');other.textContent='';}
    });
    el.classList.add('is-visible');
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
      const replay=document.createElement('button');replay.className='rl3-replay';replay.type='button';replay.textContent='▶️ 听我的录音';
      replay.addEventListener('click',event=>{event.stopPropagation();if(activeAudio)activeAudio.pause();activeAudio=new Audio(objectUrl);activeAudio.play().catch(()=>setFeedback(bar,'无法播放录音。','warning'));});
      bar.querySelector('.rl3-feedback').append(replay);
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
    if(!target||target.classList.contains('rl3-has-panel'))return;
    const bar=document.createElement('div');bar.className='rl3-panel';
    const cap=document.createElement('div');cap.className='rl3-label';
    cap.textContent=label||('跟读练习 · '+text);
    bar.append(cap);
    const controls=document.createElement('div');controls.className='rl3-buttons';
    const buttons=[
      ['🔊','听原音','rl3-original',()=>listen(bar,text,role,false)],
      ['🐢','慢速听','rl3-slow',()=>listen(bar,text,role,true)],
      ['🎤','跟读','rl3-repeat',()=>microphone(bar,text,mic)]
    ];
    let mic;
    buttons.forEach(([emoji,word,cls,handler])=>{
      const b=document.createElement('button');b.type='button';b.className=cls;
      b.textContent=emoji+' '+word;b.setAttribute('aria-label',word+'：'+text);
      b.addEventListener('click',handler);controls.append(b);
      if(cls==='rl3-repeat')mic=b;
    });
    bar.append(controls);
    const fb=document.createElement('div');fb.className='rl3-feedback';
    fb.setAttribute('role','status');fb.setAttribute('aria-live','polite');
    fb.textContent='先听原音，再跟读。仅核对识别文字，不判断重音。';
    bar.append(fb);
    // Preserve original card and dialog click listeners: control clicks must not start parent audio.
    bar.addEventListener('click',event=>event.stopPropagation());
    bar.addEventListener('keydown',event=>event.stopPropagation());
    target.append(bar);target.classList.add('rl3-has-panel');
  }
  function setup(){
    document.querySelectorAll('#pronoun-cards .card[data-say]').forEach(card=>{
      addBar(card,card.dataset.say,'male','单词 · '+card.dataset.say);
      const example=card.querySelector('.example-audio[data-say]');
      if(example){
        const barTarget=document.createElement('div');barTarget.className='rl3-example-holder';
        card.append(barTarget);
        addBar(barTarget,example.dataset.say,'male','例句 · '+example.dataset.say);
      }
    });
    document.querySelectorAll('.window-sentences .sentence').forEach(row=>{
      const btn=row.querySelector('.inline-audio[data-say]');if(btn)addBar(row,btn.dataset.say,'male','跟读句子 · '+btn.dataset.say);
    });
    document.querySelectorAll('.examples-list li').forEach(li=>{
      const btn=li.querySelector('.small-audio[data-say]');if(btn)addBar(li,btn.dataset.say,'male','跟读句子 · '+btn.dataset.say);
    });
    document.querySelectorAll('.examples-grid .example-card[data-say]').forEach(card=>{
      addBar(card,card.dataset.say,'male','跟读句子 · '+card.dataset.say);
    });
    document.querySelectorAll('.dialogue-card .say[data-say]').forEach(line=>{
      const speaker=line.querySelector('.speaker')?.textContent.trim();
      const role=speaker==='Б'||speaker==='B'?'female':'male';
      addBar(line,line.dataset.say,role,'对话跟读 · '+line.dataset.say);
    });
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup,{once:true});else setup();
  window.addEventListener('pagehide',()=>{stopActivity();if(objectUrl)URL.revokeObjectURL(objectUrl);});
})();
