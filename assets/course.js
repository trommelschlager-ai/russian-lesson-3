(() => {
  'use strict';
  if (window.CourseAudio) return;
  const player = new Audio();
  player.preload = 'none';
  player.hidden=true;
  player.dataset.coursePlayer='1';
  if(document.body)document.body.append(player);else document.addEventListener('DOMContentLoaded',()=>document.body.append(player),{once:true});
  let generation = 0;
  let highlighted = null;
  function status(message) {
    for (const id of ['course-audio-status', 'voice-status']) {
      const element = document.getElementById(id);
      if (element) element.textContent = message;
    }
  }
  function clearHighlight() {
    if (highlighted) highlighted.classList.remove('is-playing');
    highlighted = null;
  }
  function stop(silent = false) {
    generation++;
    player.onended = null;
    player.onerror = null;
    player.pause();
    clearHighlight();
    if (!silent) status('已停止');
  }
  function play(items) {
    if(window.parent!==window)window.parent.postMessage({type:"russian-course-audio-start"},"*");
    stop(true);
    for (const media of document.querySelectorAll('audio[controls]')) media.pause();
    const token = generation;
    const queue = items.map(x => typeof x === 'string' ? {text:x,role:'male'} : x);
    let index = 0;
    function failed(error) {
      if (token !== generation) return;
      stop(true);
      status(error?.name === 'NotAllowedError'
        ? '请再次点击 🔊 播放。'
        : '音频未能播放。请检查网络和媒体音量，再点击重试。');
    }
    function next() {
      if (token !== generation) return;
      clearHighlight();
      if (index === queue.length) {
        player.onended = null;
        player.onerror = null;
        status('播放完成 ✓');
        return;
      }
      const item = queue[index++];
      const role = item.role || 'male';
      const src = window.COURSE_AUDIO?.[role + '|' + item.text];
      if (!src) { failed(new Error('Missing audio')); return; }
      highlighted = [...document.querySelectorAll('[data-say]')].find(el => el.dataset.say === item.text && (el.dataset.role || 'male') === role && el.getClientRects().length > 0) || null;
      if (highlighted) highlighted.classList.add('is-playing');
      player.src = src;
      player.onended = next;
      player.onerror = failed;
      status((role === 'female' ? '👩 Светлана' : '👨 Дмитрий') + ' · ' + index + '/' + queue.length + ' · ' + item.text);
      // First play is synchronous in the user's click; reuse one media element for sequences.
      try {
        const pending = player.play();
        if (pending) pending.catch(failed);
      } catch (error) { failed(error); }
    }
    if (queue.length) next();
  }
  window.CourseAudio = {play, stop};
  window.CourseProgress = {
    save(lesson, score, total) {
      try {
        const progress = JSON.parse(localStorage.getItem('russian-course-progress-v1') || '{}');
        progress[lesson] = {score,total,date:new Date().toISOString()};
        localStorage.setItem('russian-course-progress-v1', JSON.stringify(progress));
      } catch (_) { /* Lessons still work when local storage is unavailable. */ }
    }
  };
  document.addEventListener('click', event => {
    const stopButton = event.target.closest('#course-audio-stop');
    if (stopButton) { stop(); return; }
    const all = event.target.closest('[data-course-all]');
    if (all) {
      const group = document.getElementById(all.dataset.courseAll);
      const elements = [...group.querySelectorAll('[data-say]')].filter(el => !el.parentElement.closest('[data-say]'));
      play(elements.map(el => ({text:el.dataset.say,role:el.dataset.role || 'male'})));
      return;
    }
    if (document.body.classList.contains('new-lesson')) {
      const element = event.target.closest('[data-say]');
      if (element) play([{text:element.dataset.say,role:element.dataset.role || 'male'}]);
    }
    const example = event.target.closest('.ex');
    if (example && !event.target.closest('button')) {
      const button = example.querySelector('[data-word]');
      if (button) play([{text:button.dataset.word,role:'male'}]);
    }
  });
  document.addEventListener('keydown', event => {
    const target = event.target;
    if ((event.key === 'Enter' || event.key === ' ') && target.matches('[data-say][role="button"]') && !target.closest('.pronouns')) {
      event.preventDefault();
      play([{text:target.dataset.say,role:target.dataset.role || 'male'}]);
    }
  });
  window.addEventListener('message',event=>{if(event.source===window.parent && event.data?.type==='russian-course-audio-stop')stop(true);});
  window.addEventListener('pagehide', () => stop(true));
  document.addEventListener('visibilitychange', () => { if (document.hidden) stop(true); });
  function initialize() {
    for (const element of document.querySelectorAll('[data-say]:not(button):not(.say):not(.dialog-line)')) {
      if (!element.closest('.pronouns') && !element.querySelector('button')) {
        element.tabIndex = 0;
        element.setAttribute('role','button');
        element.setAttribute('aria-label','听 ' + element.dataset.say);
      }
    }
    for (const media of document.querySelectorAll('audio[controls]')) {
      media.addEventListener('play', () => {stop(true);for(const other of document.querySelectorAll('audio[controls]'))if(other!==media)other.pause();});
    }
    const root = document.getElementById('course-quiz');
    if (root && window.COURSE_QUIZ) initializeQuiz(root);
    const progress = document.getElementById('course-progress');
    if (progress) {
      try {
        const saved = JSON.parse(localStorage.getItem('russian-course-progress-v1') || '{}');
        const done = Object.values(saved).filter(x => x.score / x.total >= .8).length;
        progress.textContent = '学习进度：' + done + ' / 7 课的小测验达到 80%。成绩保存在当前设备。';
      } catch (_) {progress.textContent='开始学习，完成每课的小测验。';}
    }
  }
  function initializeQuiz(root) {
    const questions = window.COURSE_QUIZ;
    const result = document.getElementById('course-result');
    let answered = new Map();
    function update() {
      const score = [...answered].filter(([i,j]) => questions[i].answer === j).length;
      const done = answered.size === questions.length;
      result.textContent = (done ? '测试完成！' : '已完成 ') + answered.size + ' / ' + questions.length + ' · 答对 ' + score + ' 题' + (done ? (score/questions.length>=.8 ? ' ✓ 继续下一课。' : ' · 建议再听一遍，然后重做。') : '');
      if (done) CourseProgress.save(window.COURSE_LESSON,score,questions.length);
    }
    function render() {
      root.replaceChildren();
      questions.forEach((q,i) => {
        const box = document.createElement('article');box.className='question';
        const title = document.createElement('h3');title.className='q-title';title.textContent=(i+1)+'. '+q.q;box.append(title);
        if(q.audio){const listen=document.createElement('button');listen.type='button';listen.className='action';listen.textContent='🔊 听题目';listen.addEventListener('click',()=>play([{text:q.audio,role:q.role||'male'}]));box.append(listen);}
        const options=document.createElement('div');options.className='options';
        q.options.forEach((value,j)=>{
          const button=document.createElement('button');button.type='button';button.className='option';button.textContent=String.fromCharCode(65+j)+' · '+value;
          button.addEventListener('click',()=>{
            if(answered.has(i))return;answered.set(i,j);
            [...options.children].forEach((child,k)=>{child.disabled=true;if(k===q.answer)child.classList.add('correct');});
            if(j!==q.answer)button.classList.add('wrong');
            const feedback=document.createElement('p');feedback.className='quiz-feedback';feedback.textContent=(j===q.answer?'✓ 正确。':'✗ 正确答案：'+q.options[q.answer]+'。')+' '+q.explanation;box.append(feedback);update();
          });options.append(button);
        });box.append(options);root.append(box);
      });update();
    }
    document.getElementById('course-reset').addEventListener('click',()=>{answered=new Map();render();});
    render();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initialize,{once:true});else initialize();
})();


/* Isolated speech practice; existing course audio remains untouched. */
(function(){
  if(window.__coursePronunciationLoader)return;
  window.__coursePronunciationLoader=true;
  var script=document.createElement('script');
  script.src='assets/pronunciation-check.js';
  script.defer=true;
  document.head.appendChild(script);
})();
