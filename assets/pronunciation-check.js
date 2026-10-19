/* Бесплатная тренировка русской речи (распознавание слов, не оценка фонетики).
   Срабатывает только по нажатию пользователя, не записывает и не сохраняет аудио.
   На некоторых устройствах браузер может отправлять речь в сервис распознавания. */
(function () {
  'use strict';
  if (window.__RussianSpeechCheckLoaded) return;
  window.__RussianSpeechCheckLoaded = true;

  var SpeechAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
  var practiceMode = Boolean(window.RUSSIAN_SPEECH_LESSONS);
  var titles = {
    1: '俄语字母表 · Алфавит', 2: '阅读与发音 · Чтение',
    3: '人称代词 · Местоимения', 4: '日常问候 · Приветствия',
    5: '数字与时间 · Числа и время', 6: '我的家人 · Семья',
    7: '我的一天 · Мой день'
  };
  var filename = location.pathname.split('/').pop().toLowerCase();
  var lesson = filename.includes('lesson-7') ? 7 :
    filename.includes('lesson-6') ? 6 :
    filename.includes('lesson-5') ? 5 :
    filename.includes('lesson-4') ? 4 :
    filename.includes('lesson-3') ? 3 :
    (filename.includes('lesson-2') || filename.includes('lesson_2')) ? 2 : 1;
  var selected = 0;
  var recognition = null;
  var hasAnswer = false;
  var lastFocus = null;
  var currentList = [];

  function clean(s) {
    return String(s || '').toLocaleLowerCase('ru-RU').replace(/ё/g, 'е')
      .replace(/[^\p{L}\p{N}]+/gu, ' ').trim().replace(/\s+/g, ' ');
  }
  function entries() {
    if (practiceMode) {
      return (window.RUSSIAN_SPEECH_LESSONS[lesson] || []).map(function (entry) {
        return {text: entry[0], zh: entry[1] || '', role: 'male'};
      });
    }
    var seen = new Set();
    var found = [];
    if (lesson === 4) {
      found.push({text:'Привет!',zh:'你好！',role:'male'});
      seen.add(clean('Привет!'));
    }
    document.querySelectorAll('[data-say]').forEach(function (el) {
      var word = (el.dataset.say || '').trim();
      var key = clean(word);
      if (!/[\u0400-\u052f]/.test(word) || !key || key.length > 90 || seen.has(key)) return;
      seen.add(key);
      var card = el.closest('.vocab-card, .word-card, .ex, .pronoun-card, .dialog-line, article');
      var translation = card && card.querySelector('.zh, .chinese, [lang="zh-CN"]');
      found.push({text:word, zh:translation ? translation.textContent.trim().slice(0,70) : '',
        role:el.dataset.role || 'male'});
    });
    return found;
  }
  function stopListening() {
    if (recognition) {
      try { recognition.abort(); } catch (_) {}
      recognition = null;
    }
  }

  function mount() {
    if (!practiceMode && !document.querySelector('[data-say]')) return;
    var css = document.createElement('style');
    css.textContent = [
      '.rc-fab{position:fixed;right:16px;bottom:16px;z-index:2147480000;border:0;border-radius:999px;',
      'background:linear-gradient(135deg,#ff3980,#df1759);color:#fff;padding:14px 18px;',
      'box-shadow:0 6px 24px #48122c66;font:700 15px/1.3 system-ui,sans-serif;cursor:pointer}',
      '.rc-shade{position:fixed;inset:0;z-index:2147480001;background:#170c1eb8;overflow:auto;',
      'display:none;align-items:center;justify-content:center;padding:8px;font-family:system-ui,"Microsoft YaHei",sans-serif}',
      '.rc-shade.rc-visible{display:flex}',
      '.rc-panel{width:min(480px,100%);max-height:min(94dvh,760px);overflow-y:auto;overscroll-behavior:contain;',
      'background:#fffaf1;border:3px solid #eecb91;border-radius:23px;',
      'box-shadow:0 14px 55px #1b0b187a;color:#282045;padding:15px}',
      '.rc-header{display:flex;align-items:flex-start;gap:10px;justify-content:space-between}',
      '.rc-header h2{font-size:21px;line-height:1.2;margin:0;color:#24215f}',
      '.rc-x{border:0;background:#f3e6e7;border-radius:50%;width:38px;height:38px;',
      'font-size:21px;color:#503c4d;cursor:pointer}',
      '.rc-note{color:#605c70;font-size:13px;line-height:1.4;margin:6px 0 8px}',
      '.rc-label{display:block;font-weight:700;font-size:13px;margin:8px 0 4px}',
      '.rc-select{display:block;width:100%;border:1px solid #b8b8d7;border-radius:12px;',
      'padding:9px 11px;min-height:44px;background:#fff;color:#292345;font:600 16px system-ui,sans-serif}',
      '.rc-word{margin:9px 0 5px;background:#fff;border:2px solid #e8def6;border-radius:16px;',
      'padding:10px 12px;text-align:center}',
      '.rc-word-ru{font:800 27px/1.25 system-ui,sans-serif;color:#263579;overflow-wrap:anywhere}',
      '.rc-word-zh{font-size:16px;color:#665978;margin-top:5px}',
      '.rc-controls{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:9px}',
      '.rc-btn{min-height:46px;border:0;border-radius:12px;color:#fff;background:#2779da;',
      'font:700 15px system-ui,sans-serif;cursor:pointer;padding:10px}',
      '.rc-btn.rc-mic{background:#ec3675}',
      '.rc-btn:disabled{opacity:.5;cursor:not-allowed}',
      '.rc-result{background:#f3f1ff;border:2px solid transparent;border-radius:13px;padding:10px;',
      'margin-top:10px;min-height:64px;font-size:14px;line-height:1.35}',
      '.rc-result[data-state="success"]{background:#e7f8eb;border-color:#a0dfad}',
      '.rc-result[data-state="mismatch"]{background:#fff0ed;border-color:#f3a4a1}',
      '.rc-result[data-state="warning"]{background:#fff2d9;border-color:#edc981}',
      '.rc-result[data-state="listening"]{background:#fff0f6;border-color:#f3bfd3}',
      '.rc-result-head{display:flex;gap:10px;align-items:center}',
      '.rc-result-icon{font-size:32px;line-height:1;flex:0 0 38px;text-align:center}',
      '.rc-result-title{display:block;font-size:17px;line-height:1.3;color:#24215f}',
      '.rc-result-message{font-size:13px;color:#635576;line-height:1.4;margin-top:3px}',
      '.rc-result-details{border-top:1px solid #0001;margin:7px 0 0;padding-top:7px;display:grid;gap:3px;overflow-wrap:anywhere}',
      '.rc-result-details b{color:#35336e}',
      '.rc-privacy{margin:8px 0 0;color:#79637b;font-size:12px;line-height:1.45}',
      '.rc-privacy summary{cursor:pointer;min-height:26px;padding:3px 0}',
      '.rc-privacy p{margin:3px 0}',
      '.rc-link{display:inline-block;color:#1c61b8;font-weight:700;margin-top:8px}',
      '@media(max-width:420px){.rc-panel{padding:12px;border-radius:19px}.rc-word-ru{font-size:25px}',
      '.rc-fab{right:9px;bottom:10px;padding:12px 15px}}',
      '@media(max-height:680px){.rc-shade{align-items:flex-start}.rc-panel{max-height:calc(100dvh - 12px)}',
      '.rc-header h2{font-size:20px}.rc-word{padding:8px}.rc-note{margin:4px 0}}'
    ].join('');
    document.head.appendChild(css);

    var trigger = document.createElement('button');
    trigger.className = 'rc-fab';
    trigger.type = 'button';
    trigger.textContent = '🎤 跟读练习';
    trigger.setAttribute('aria-label','打开俄语跟读练习 · Открыть тренировку произношения');

    var shade = document.createElement('div');
    shade.className = 'rc-shade';
    shade.innerHTML =
      '<section class="rc-panel" role="dialog" aria-modal="true" aria-labelledby="rc-title">' +
      '<div class="rc-header"><h2 id="rc-title">🎤 俄语跟读练习</h2>' +
      '<button type="button" class="rc-x" aria-label="关闭">×</button></div>' +
      '<p class="rc-note">🔊 先听 → 🎤 跟读。只比较识别的文字，不进行口音评分。</p>' +
      '<div class="rc-lessons"><label class="rc-label" for="rc-lesson">选择课程</label>' +
      '<select class="rc-select" id="rc-lesson"></select></div>' +
      '<label class="rc-label" for="rc-word-choice">选择单词或句子</label>' +
      '<select class="rc-select" id="rc-word-choice"></select>' +
      '<div class="rc-word"><div class="rc-word-ru" lang="ru"></div>' +
      '<div class="rc-word-zh" lang="zh-CN"></div></div>' +
      '<div class="rc-controls"><button type="button" class="rc-btn rc-listen">🔊 听原音</button>' +
      '<button type="button" class="rc-btn rc-mic">🎤 开始说话</button></div>' +
      '<div class="rc-result" data-state="info" role="status" aria-live="polite"></div>' +
      '<a class="rc-link" href="#">📖 返回相应课程</a>' +
      '<details class="rc-privacy"><summary>🔒 麦克风、隐私与评分说明</summary><p>需允许麦克风，并可能需要网络。某些浏览器会把音频发送到其语音识别服务处理；本课程不会保存你的录音。识别文字一致不代表口音、重音或每个音都正确。单个字母和短音节也可能识别不准。</p></details>' +
      '</section>';
    document.body.appendChild(trigger);
    document.body.appendChild(shade);

    var card = shade.querySelector('.rc-panel');
    var result = shade.querySelector('.rc-result');
    var ru = shade.querySelector('.rc-word-ru');
    var zh = shade.querySelector('.rc-word-zh');
    var lessonSelect = shade.querySelector('#rc-lesson');
    var wordSelect = shade.querySelector('#rc-word-choice');
    var mic = shade.querySelector('.rc-mic');
    var listen = shade.querySelector('.rc-listen');
    var link = shade.querySelector('.rc-link');
    // Prominent status and text-only details. Recognition transcripts are never inserted as HTML.
    function feedback(kind, title, message, target, heard) {
      var icons = {success:'✅',mismatch:'❌',warning:'⚠️',listening:'🎙️',info:'💡'};
      result.dataset.state=kind;
      result.replaceChildren();
      var header=document.createElement('div');
      header.className='rc-result-head';
      var badge=document.createElement('span');
      badge.className='rc-result-icon';
      badge.setAttribute('aria-hidden','true');
      badge.textContent=icons[kind]||'💡';
      var text=document.createElement('div');
      var heading=document.createElement('strong');
      heading.className='rc-result-title';
      heading.textContent=title;
      text.appendChild(heading);
      if(message){
        var sub=document.createElement('div');
        sub.className='rc-result-message';
        sub.textContent=message;
        text.appendChild(sub);
      }
      header.append(badge,text);
      result.append(header);
      if(target!==undefined && target!==null){
        var details=document.createElement('div');
        details.className='rc-result-details';
        function detail(label,value){
          var div=document.createElement('div');
          var bold=document.createElement('b');
          bold.textContent=label+'：';
          div.append(bold,document.createTextNode(value));
          details.append(div);
        }
        detail('目标',target);
        if(heard!==undefined)detail('识别到',heard||'（无）');
        result.append(details);
      }
    }
    var pages = {
      1:'russian_lesson_1_COMPLETE.html', 2:'russian_lesson_2_reading.html',
      3:'lesson-3-pronouns-basic.html', 4:'lesson-4-presentation-READY.html',
      5:'lesson-5.html', 6:'lesson-6.html', 7:'lesson-7.html'
    };
    if (practiceMode) {
      Object.keys(titles).forEach(function (n) {
        var opt = document.createElement('option');
        opt.value=n; opt.textContent=n+' · '+titles[n];
        lessonSelect.appendChild(opt);
      });
      lessonSelect.value=String(lesson);
    } else {
      shade.querySelector('.rc-lessons').hidden=true;
    }
    if (!SpeechAPI || !window.isSecureContext) {
      mic.disabled=true;
      feedback('warning','当前无法使用麦克风','请使用支持语音识别的 Chrome 和 HTTPS 网页。');
    }

    function showWord() {
      stopListening();
      mic.textContent='🎤 开始说话';
      var item=currentList[selected] || {text:'',zh:'',role:'male'};
      ru.textContent=item.text;
      zh.textContent=item.zh;
      feedback('info','准备好了','先听原音，再点击 🎤 开始说话。');
      link.href=pages[lesson];
    }
    function refreshWords() {
      currentList=entries();
      wordSelect.replaceChildren();
      currentList.forEach(function (entry,i) {
        var opt=document.createElement('option');
        opt.value=String(i);
        opt.textContent=entry.text+(entry.zh?' · '+entry.zh:'');
        wordSelect.appendChild(opt);
      });
      selected=0;
      wordSelect.value='0';
      showWord();
      if (!currentList.length) feedback('warning','暂无可练习内容','请打开其他课程。');
    }
    function open(n) {
      lastFocus=document.activeElement;
      if (practiceMode && n && window.RUSSIAN_SPEECH_LESSONS[n]) lesson=Number(n);
      if (practiceMode) lessonSelect.value=String(lesson);
      refreshWords();
      shade.classList.add('rc-visible');
      trigger.style.display='none';
      wordSelect.focus();
    }
    function close() {
      stopListening();
      shade.classList.remove('rc-visible');
      trigger.style.display='';
      if (lastFocus && typeof lastFocus.focus==='function') lastFocus.focus();
    }
    trigger.addEventListener('click',function(){open();});
    shade.querySelector('.rc-x').addEventListener('click',close);
    shade.addEventListener('click',function(e){if (e.target===shade) close();});
    document.addEventListener('keydown',function(e){if (e.key==='Escape' && shade.classList.contains('rc-visible')) close();});
    window.addEventListener('pagehide',stopListening);
    lessonSelect.addEventListener('change',function(){lesson=Number(lessonSelect.value);refreshWords();});
    wordSelect.addEventListener('change',function(){selected=Number(wordSelect.value);showWord();});

    listen.addEventListener('click',function(){
      var item=currentList[selected];
      if(!item)return;
      stopListening();
      var manifest=window.COURSE_AUDIO || {};
      var role=item.role || 'male';
      if(!manifest[role+'|'+item.text] && manifest['male|'+item.text])role='male';
      if(!manifest[role+'|'+item.text] && manifest['female|'+item.text])role='female';
      if (manifest[role+'|'+item.text] && window.CourseAudio) {
        window.CourseAudio.play([{text:item.text,role:role}]);
        feedback('info','正在播放原音','听完后点击 🎤 跟读。');
      } else if (lesson===1 && typeof window.speak==='function') {
        // The alphabet lesson keeps its own existing natural MP3 voice player.
        window.speak(item.text);
        feedback('info','正在播放原音','正在使用第1课原有的词语发音。听完后点击 🎤。');
      } else {
        feedback('warning','没有找到单独的音频','请返回相应课程，先听卡片中的 🔊 原音。');
      }
    });

    mic.addEventListener('click',function(){
      if (!SpeechAPI || !window.isSecureContext || !currentList.length) return;
      if(recognition){stopListening();mic.textContent='🎤 开始说话';feedback('info','已停止','点击麦克风可重新练习。');return;}
      if(window.CourseAudio)window.CourseAudio.stop(true);
      var item=currentList[selected];
      var attempt=new SpeechAPI();
      recognition=attempt;
      hasAnswer=false;
      attempt.lang='ru-RU';
      attempt.continuous=false;
      attempt.interimResults=false;
      attempt.maxAlternatives=1;
      attempt.onstart=function(){
        if(recognition!==attempt)return;
        mic.textContent='■ 停止录音';
        feedback('listening','正在聆听…','请清楚地说出目标词：'+item.text);
      };
      attempt.onresult=function(event){
        if(recognition!==attempt)return;
        var heard=event.results[0] && event.results[0][0] ?
          event.results[0][0].transcript.trim() : '';
        hasAnswer=true;
        var match=clean(heard)===clean(item.text);
        feedback(match?'success':'mismatch',match?'识别文字一致 ✅':'识别文字不同 ❌',
          match?'浏览器听懂了目标词，继续练习！':'未识别为目标词，请再试一次。',item.text,heard);
      };
      attempt.onerror=function(event){
        if(recognition!==attempt)return;
        hasAnswer=true;
        var messages={
          'not-allowed':'麦克风权限被拒绝。请在浏览器设置中允许本站使用麦克风。',
          'service-not-allowed':'浏览器不允许使用语音识别服务。请使用 Chrome 再试。',
          'no-speech':'没有听到清晰的声音，请靠近麦克风后重试。',
          'audio-capture':'无法访问麦克风。请检查设备和权限。',
          'network':'语音识别服务网络连接失败，请检查网络后重试。',
          'language-not-supported':'当前设备无法使用俄语语音识别。',
          'aborted':'识别已取消。'
        };
        feedback('warning','识别未完成',messages[event.error]||('语音识别失败：'+event.error));
      };
      attempt.onend=function(){
        if(recognition!==attempt)return;
        recognition=null;
        mic.textContent='🎤 再试一次';
        if(!hasAnswer)feedback('warning','没有识别结果','请点击麦克风再试一次。');
      };
      try{attempt.start();}catch(e){
        recognition=null;mic.textContent='🎤 再试一次';
        feedback('warning','麦克风启动失败','请检查浏览器权限后再试一次。');
      }
    });

    if (practiceMode) {
      document.querySelectorAll('[data-sp-lesson]').forEach(function(button){
        button.addEventListener('click',function(){open(Number(button.dataset.spLesson));});
      });
    }
  }
  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',mount,{once:true});
  }else mount();
})();
