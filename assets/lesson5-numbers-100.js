/* 第5课 · Russian numbers 1–100. Keeps all approved original MP3 and
   changes only lesson 5 vocabulary and clock presentation. */
(()=>{'use strict';
 const small=['ноль','один','два','три','четыре','пять','шесть','семь','восемь','девять','десять'];
 const smallLat=['nol\'','odin','dva','tri','chetyre','pyat\'','shest\'','sem\'','vosem\'','devyat\'','desyat\''];
 const teens=['одиннадцать','двенадцать','тринадцать','четырнадцать','пятнадцать','шестнадцать','семнадцать','восемнадцать','девятнадцать'];
 const teenLat=['odinnadtsat\'','dvenadtsat\'','trinadtsat\'','chetyrnadtsat\'','pyatnadtsat\'','shestnadtsat\'','semnadtsat\'','vosemnadtsat\'','devyatnadtsat\''];
 const tens={20:['двадцать','dvadtsat\''],30:['тридцать','tridtsat\''],40:['сорок','sorok'],50:['пятьдесят','pyat\'desyat'],60:['шестьдесят','shest\'desyat'],70:['семьдесят','sem\'desyat'],80:['восемьдесят','vosem\'desyat'],90:['девяносто','devyanosto'],100:['сто','sto']};
 const cnDigits=['零','一','二','三','四','五','六','七','八','九','十'];
 const cn=n=>n<11?cnDigits[n]:n<20?'十'+cnDigits[n-10]:n===100?'一百':cnDigits[Math.floor(n/10)]+'十'+(n%10?cnDigits[n%10]:'');
 function info(n){
   if(n<11)return {ru:small[n],latin:smallLat[n],zh:cn(n)};
   if(n<20)return {ru:teens[n-11],latin:teenLat[n-11],zh:cn(n)};
   const t=n-n%10,ones=n%10;
   return {ru:tens[t][0]+(ones?' '+small[ones]:''),latin:tens[t][1]+(ones?' '+smallLat[ones]:''),zh:cn(n)};
 }
 const escaped=s=>String(s).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
 function numberArt(n){
   const palette=['#49ac60','#8f61d6','#e6a23e','#4299c7','#ed80ab','#63ac85'];
   return '<div class="l5-number-art" style="--digit-color:'+palette[n%palette.length]+'" aria-hidden="true"><span class="l5-number-floral floral-a">✿</span><span class="l5-number-floral floral-b">❀</span><span class="l5-number-leaves">❧</span><span class="l5-number-digits">'+n+'</span><span class="l5-number-floral floral-c">✿</span></div>';
 }
 function cardMarkup(n){
   const w=info(n);
   return '<article class="extra-card l5-number-card">'+numberArt(n)+
    '<div class="l5-number-info"><div class="ru" lang="ru">'+escaped(w.ru)+'</div>'+
    '<div class="latin">'+escaped(w.latin)+'</div><div class="zh" lang="zh-CN">'+w.zh+'</div>'+
    '<button type="button" class="word-play image-button" data-say="'+escaped(w.ru)+'" data-role="male" aria-label="听 '+escaped(w.ru)+'"><img src="assets/illustrated/play-blue.jpg" alt="" width="106" height="55"></button></div></article>';
 }
 const guide=[{title:'11–20 · 十一到二十',desc:'11–19 通常以 -надцать 结尾。注意发音与重音，例如 оди́ннадцать、двена́дцать。',min:11,max:20},
 {title:'20–29 · 二十几',desc:'два́дцать + 个位数。例：21 = двадцать один。',min:21,max:29},
 {title:'30–39 · 三十几',desc:'три́дцать + 个位数。例：35 = тридцать пять。',min:30,max:39},
 {title:'40–49 · 四十几',desc:'重点记住：40 = со́рок（不是 четыре десят）。41 = сорок один；49 = сорок девять。',min:40,max:49},
 {title:'50–59 · 五十几',desc:'пятьдеся́т + 个位数。注意软音符号 ь。',min:50,max:59},
 {title:'60–69 · 六十几',desc:'шестьдеся́т + 个位数。例：67 = шестьдесят семь。',min:60,max:69},
 {title:'70–79 · 七十几',desc:'се́мьдесят + 个位数。注意 ь。',min:70,max:79},
 {title:'80–89 · 八十几',desc:'во́семьдесят + 个位数。例：88 = восемьдесят восемь。',min:80,max:89},
 {title:'90–100 · 九十到一百',desc:'90 = девяно́сто；91 = девяносто один；100 = сто。',min:90,max:100}];
 function upgradeNumbers(){
   const el=document.getElementById('extra-vocab-5');if(!el)return;
   [...el.querySelectorAll('.extra-card')].forEach((card,i)=>{
     const n=i+6,fig=card.querySelector('.extra-figure');if(!fig)return;
     fig.outerHTML=numberArt(n);
     card.classList.add('l5-number-card','l5-classic-number');
     const info=document.createElement('div');info.className='l5-number-info';
     while(card.children.length>1)info.append(card.children[1]);card.append(info);
   });
   const current=el.closest('section');const added=document.createElement('section');
   added.className='illustrated-section l5-counting-section';added.id='l5-counting-to-100';
   added.innerHTML='<div class="l5-counting-heading"><h2>数字 11–100 · Числа от 11 до 100</h2><p>学会规律，就能自己读出 1 到 100 的数字。 · Выучим принцип образования чисел.</p></div>'+
     '<div class="l5-counting-rule"><strong>💡 如何组成数字？</strong><span>20 + 3 → двадцать три (23) · 40 + 7 → сорок семь (47)</span><span>数字 40「со́рок」、90「девяно́сто」、100「сто」需要单独记忆。</span></div>';
   guide.forEach((g,i)=>{
     const d=document.createElement('details');d.className='l5-counting-group';d.open=i===0||i===3;
     d.innerHTML='<summary><span class="l5-heading-number">'+String(i+1).padStart(2,'0')+'</span><span><strong>'+g.title+'</strong><small>'+g.desc+'</small></span><span class="l5-chevron">⌄</span></summary>'+
       '<div class="extra-grid l5-counting-grid" id="l5-group-'+i+'"></div>';
     const grid=d.querySelector('.l5-counting-grid');
     for(let n=g.min;n<=g.max;n++)grid.insertAdjacentHTML('beforeend',cardMarkup(n));
     added.append(d);
   });
   current.after(added);
   const originalCounter=el.closest('.lesson-extra');if(originalCounter){
     originalCounter.querySelector('.extra-heading h2').textContent='数字 6–10 · Числа 6–10';
     originalCounter.querySelector('.extra-heading p').textContent='同样精美的数字卡片 · 继续认识俄语数字';
   }
 }
 function prettyClock(hour){
   const angle=hour%12*30*Math.PI/180;
   const x=100+53*Math.sin(angle),y=100-53*Math.cos(angle);
   const ticks=Array.from({length:60},(_,i)=>{
     const a=i*6*Math.PI/180;
     const r=i%5===0?74:78;
     return '<line x1="'+(100+r*Math.sin(a)).toFixed(2)+'" y1="'+(100-r*Math.cos(a)).toFixed(2)+'" x2="'+(100+83*Math.sin(a)).toFixed(2)+'" y2="'+(100-83*Math.cos(a)).toFixed(2)+'" stroke="#4a3850" stroke-width="'+(i%5===0?2.4:1)+'"/>';
   }).join('');
   const nums=[12,1,2,3,4,5,6,7,8,9,10,11].map((n,i)=>{
     const a=i*30*Math.PI/180;return '<text x="'+(100+64*Math.sin(a)).toFixed(2)+'" y="'+(105-64*Math.cos(a)).toFixed(2)+'" text-anchor="middle" font-size="14" font-weight="650" fill="#3c263c">'+n+'</text>';
   }).join('');
   return '<svg class="l5-photo-clock" viewBox="0 0 200 200" role="img" aria-label="'+hour+':00">'+
     '<defs><radialGradient id="l5-face" cx=".4" cy=".33"><stop stop-color="white"/><stop offset="1" stop-color="#faeff1"/></radialGradient><linearGradient id="l5-red" x2="1" y2="1"><stop stop-color="#f7a2a2"/><stop offset=".43" stop-color="#ca173a"/><stop offset="1" stop-color="#7a1234"/></linearGradient></defs>'+
     '<circle cx="100" cy="101" r="96" fill="#7d4b49" opacity=".16"/><circle cx="100" cy="100" r="94" fill="url(#l5-red)" stroke="#8d1633" stroke-width="3"/>'+
     '<circle cx="100" cy="100" r="86" fill="url(#l5-face)" stroke="#fff0e9" stroke-width="4"/>'+ticks+nums+
     '<path d="M100 100 L100 27" stroke="#203b6d" stroke-width="4.3" stroke-linecap="round"/>'+
     '<path d="M100 100 L'+x.toFixed(2)+' '+y.toFixed(2)+'" stroke="#202237" stroke-width="7.5" stroke-linecap="round"/>'+
     '<circle cx="100" cy="100" r="8" fill="#18152f"/><circle cx="98" cy="97" r="2.5" fill="#999db6"/>'+
     '</svg>';
 }
 function upgradeClocks(){
  const grid=document.getElementById('extra-times-5');if(!grid)return;
  [...grid.querySelectorAll('.extra-time-card')].forEach(card=>{
   const text=card.querySelector('.extra-time-label')?.textContent||'';
   const hour=parseInt(text,10);if(!hour)return;
   const old=card.querySelector('svg');if(old)old.outerHTML='<div class="l5-clock-illustration">'+prettyClock(hour)+'<span class="l5-clock-flower">❀</span></div>';
   const detail=document.createElement('div');detail.className='l5-clock-copy';
   for(const node of [...card.children].slice(1))detail.append(node);
   card.append(detail);card.classList.add('l5-beautiful-clock');
  });
 }
 function run(){
  if(!document.body.classList.contains('lesson-5')||window.__lesson5NumeralsReady)return;
  window.__lesson5NumeralsReady=true;
  upgradeNumbers();upgradeClocks();
 }
 // Scripts execute in the document footer, before the existing pronunciation setup.
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run,{once:true});else run();
})();
