#!/usr/bin/env python3
"""Safe additive enhancements for lessons 4, 5 and 6. Do not modify homepage."""
from pathlib import Path
import json, html, math, re

ROOT=Path(".")
DATA={
    4:{
      "items":[
        ("Здравствуйте!","Zdravstvuyte!","您好！","male","👋"),
        ("До свидания!","Do svidaniya!","再见！","male","👋"),
        ("Спасибо!","Spasibo!","谢谢！","female","💐"),
        ("Пожалуйста!","Pozhaluysta!","不客气！（回应感谢）","male","🤝"),
      ],
      "dialogue":[
        ("Здравствуйте!","Zdravstvuyte!","您好！","female"),
        ("Здравствуйте! Как дела?","Zdravstvuyte! Kak dela?","您好！您怎么样？","male"),
        ("Хорошо, спасибо!","Khorosho, spasibo!","很好，谢谢！","female"),
        ("До свидания!","Do svidaniya!","再见！","male"),
      ],
      "quiz":[
        {"q":"「До свидания!」是什么意思？","options":["再见！","谢谢！","晚安！","早上好！"],"answer":0,"explanation":"До свидания! · Do svidaniya! = 再见！","audio":"До свидания!","role":"male"},
        {"q":"别人说「Спасибо!」时，可以用哪句话回应？","options":["Доброе утро!","Пожалуйста!","До свидания!","Спокойной ночи!"],"answer":1,"explanation":"Пожалуйста! 可用于回应感谢，意思是「不客气」。","audio":"Пожалуйста!","role":"male"}
      ]
    },
    5:{
      "items":[
        ("шесть","shest'","六","male","6"),
        ("семь","sem'","七","male","7"),
        ("восемь","vosem'","八","male","8"),
        ("девять","devyat'","九","male","9"),
        ("десять","desyat'","十","male","10"),
      ],
      "times":[
        ("три часа","tri chasa","三点","male",3),
        ("четыре часа","chetyre chasa","四点","male",4),
        ("шесть часов","shest' chasov","六点","male",6),
        ("семь часов","sem' chasov","七点","male",7),
        ("десять часов","desyat' chasov","十点","male",10),
      ],
      "dialogue":[
        ("Который час?","Kotoryy chas?","现在几点？","female"),
        ("Сейчас шесть часов.","Seychas shest' chasov.","现在六点。","male"),
        ("Во сколько начинается урок?","Vo skol'ko nachinayetsya urok?","课几点开始？","female"),
        ("В девять часов.","V devyat' chasov.","九点。","male"),
      ],
      "quiz":[
        {"q":"「семь」是什么意思？","options":["六","九","七","十"],"answer":2,"explanation":"семь · sem' = 七。","audio":"семь","role":"male"},
        {"q":"「шесть часов」表示几点？","options":["5:00","7:00","9:00","6:00"],"answer":3,"explanation":"шесть часов = 六点；5–20 → часов。","audio":"шесть часов","role":"male"},
        {"q":"怎样用俄语问「现在几点？」","options":["Как дела?","Который час?","Где урок?","Сколько стоит?"],"answer":1,"explanation":"Который час? = 现在几点？","audio":"Который час?","role":"female"}
      ]
    },
    6:{
      "items":[
        ("семья","sem'ya","家庭／家人","male","🏠"),
        ("брат","brat","兄弟（哥哥或弟弟）","male","👦"),
        ("сестра","sestra","姐妹（姐姐或妹妹）","female","👧"),
      ],
      "dialogue":[
        ("Это твоя семья?","Eto tvoya sem'ya?","这是你的家人吗？","female"),
        ("Да, это моя семья.","Da, eto moya sem'ya.","对，这是我的家人。","male"),
        ("У тебя есть сестра?","U tebya yest' sestra?","你有姐妹吗？","female"),
        ("Да, у меня есть сестра.","Da, u menya yest' sestra.","有，我有姐妹。","male"),
      ],
      "quiz":[
        {"q":"「брат」是什么意思？","options":["姐妹","父亲","兄弟","儿子"],"answer":2,"explanation":"брат = 兄弟，可以指哥哥或弟弟。","audio":"брат","role":"male"},
        {"q":"「Это твоя семья?」是什么意思？","options":["你有姐姐吗？","这是你的家人吗？","她是妈妈吗？","你有儿子吗？"],"answer":1,"explanation":"Это твоя семья? = 这是你的家人吗？","audio":"Это твоя семья?","role":"female"},
      ]
    }
}

def escape(v): return html.escape(str(v),quote=True)
def play_button(word,role):
    return f'<button type="button" class="word-play image-button" data-say="{escape(word)}" data-role="{role}" aria-label="听 {escape(word)}"><img src="assets/illustrated/play-blue.jpg" alt="" width="106" height="55"></button>'

def item_card(word,lat,zh,role,illustration):
    return f'<article class="extra-card"><div class="extra-figure" aria-hidden="true">{escape(illustration)}</div><div class="ru" lang="ru">{escape(word)}</div><div class="latin">{escape(lat)}</div><div class="zh" lang="zh-CN">{escape(zh)}</div>{play_button(word,role)}</article>'

def dialogue_line(word,lat,zh,role,lesson):
    speaker="Светлана" if role=="female" else "Дмитрий"
    voice_name='svetlana' if role=='female' else 'dmitry'
    picture=f'assets/illustrated/{voice_name}-{lesson if lesson != 6 else 5}.jpg'
    assert Path(picture).exists(),picture
    return f'<article class="extra-dialogue-line"><img src="{picture}" alt="{speaker}" class="extra-character"><div><div class="extra-speaker">{speaker}</div><div class="ru" lang="ru">{escape(word)}</div><div class="latin">{escape(lat)}</div><div class="zh" lang="zh-CN">{escape(zh)}</div>{play_button(word,role)}</div></article>'

def clock(hour):
    # 12-hour visual dial with visible hour hand and minute hand
    theta=math.pi*hour/6
    x=50+26*math.sin(theta);y=50-26*math.cos(theta)
    return (f'<svg viewBox="0 0 100 100" aria-hidden="true" class="extra-clock">'
            '<circle cx="50" cy="50" r="46" fill="#fffdf8" stroke="#7b4f9c" stroke-width="3"/>'
            '<text x="50" y="14" font-size="12" text-anchor="middle" fill="#56317b">12</text>'
            '<text x="87" y="54" font-size="12" text-anchor="middle" fill="#56317b">3</text>'
            '<text x="50" y="94" font-size="12" text-anchor="middle" fill="#56317b">6</text>'
            '<text x="14" y="54" font-size="12" text-anchor="middle" fill="#56317b">9</text>'
            '<path d="M50 50 L50 20" stroke="#4365a5" stroke-width="3" stroke-linecap="round"/>'
            f'<path d="M50 50 L{x:.2f} {y:.2f}" stroke="#e58432" stroke-width="5" stroke-linecap="round"/>'
            '<circle cx="50" cy="50" r="4" fill="#443267"/></svg>')

def time_card(word,lat,zh,role,hour):
    return f'<article class="extra-card extra-time-card">{clock(hour)}<div class="extra-time-label">{hour}:00</div><div class="ru" lang="ru">{escape(word)}</div><div class="latin">{escape(lat)}</div><div class="zh" lang="zh-CN">{escape(zh)}</div>{play_button(word,role)}</article>'

def build(l):
    dat=DATA[l]
    head={
       4:("更多实用表达", "告别、感谢与礼貌用语 · Дополнительные фразы"),
       5:("数字 6–10", "继续认识数字 · Числа от шести до десяти"),
       6:("认识更多家庭成员", "补充词汇 · Новые слова о семье")
    }[l]
    cards=''.join(item_card(*x) for x in dat['items'])
    section=(f'<section class="illustrated-section extra-section lesson-extra" aria-labelledby="lesson-extra-{l}">'
      f'<div class="extra-heading"><div><h2 id="lesson-extra-{l}">{head[0]}</h2><p>{head[1]}</p></div>'
      f'<button class="extra-play-all" type="button" data-course-all="extra-vocab-{l}">🔊 全部播放</button></div>'
      f'<div id="extra-vocab-{l}" class="extra-grid">{cards}</div></section>')
    if l==5:
      clocks=''.join(time_card(*x) for x in dat['times'])
      section+=('<section class="illustrated-section extra-section lesson-extra"><div class="extra-heading"><div>'
                '<h2>再学几个整点时间</h2><p>3:00 / 4:00 / 6:00 / 7:00 / 10:00 · 学会用 час、часа、часов</p></div>'
                '<button type="button" class="extra-play-all" data-course-all="extra-times-5">🔊 全部播放</button></div>'
                f'<div class="extra-grid extra-clock-grid" id="extra-times-5">{clocks}</div>'
                '<p class="extra-rule">一点 → один час；两点到四点 → два / три / четыре часа；五点到十点 → пять / шесть / семь / восемь / девять / десять часов。</p>'
                '</section>')
    lines=''.join(dialogue_line(*line,l) for line in dat["dialogue"])
    section+=(f'<section class="illustrated-section extra-section extra-conversation"><div class="extra-heading"><div>'
              f'<h2>{"礼貌地打招呼" if l==4 else "问时间" if l==5 else "对话：介绍家人"}</h2>'
              '<p>听对话，跟着两个声音重复一遍 · 听、读、说</p></div>'
              f'<button type="button" class="extra-play-all" data-course-all="extra-dialogue-{l}">🔊 全部播放</button></div>'
              f'<div class="extra-dialogue-grid" id="extra-dialogue-{l}">{lines}</div></section>')
    return section

css="""/* New lesson vocabulary and dialogue additions, scoped to avoid redesigning existing cards. */
.lesson-extra{padding-top:12px;padding-bottom:18px}
.extra-heading{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin:9px 0 16px}
.extra-heading h2{font-family:Arial,'Noto Sans CJK SC',sans-serif;color:#203773;font-weight:800;font-size:clamp(22px,3vw,30px);line-height:1.3;margin:0}
.extra-heading p{color:#7a6688;font-size:16px;line-height:1.5;margin:4px 0 0}
.extra-play-all{border-radius:13px;border:2px solid #aa86cc;background:#eee3fa;color:#4e2873;padding:11px 15px;font-size:16px;font-weight:700;min-height:46px}
.extra-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:11px}
.extra-card{min-width:0;background:#fffdf7;border:1px solid #e9d9c6;border-radius:18px;padding:14px 8px;box-shadow:0 3px 9px #aa7e4520;text-align:center;display:flex;flex-direction:column;align-items:center}
.extra-figure{width:min(100%,136px);aspect-ratio:1.3;background:linear-gradient(145deg,#f3e5ff,#e8f5ff);display:flex;align-items:center;justify-content:center;border-radius:15px;color:#593282;font-size:clamp(45px,6vw,72px);font-weight:850;line-height:1}
.extra-card .ru{margin-top:12px;font-size:clamp(25px,3vw,32px);line-height:1.18}
.extra-card .latin{font-size:20px;line-height:1.3;overflow-wrap:anywhere}
.extra-card .zh{font-size:19px;line-height:1.4;margin-top:6px}
.extra-card .word-play{margin-top:auto;padding-top:12px;width:106px;min-height:52px}
.extra-card .word-play img{width:100%;height:auto}
.extra-clock{width:100px;height:100px;margin:0 auto 7px}
.extra-time-label{background:#edddfa;border-radius:9px;padding:4px 11px;color:#493267;font-weight:700;font-size:20px}
.extra-rule{background:#f3ebfa;color:#66497e;border-radius:13px;font-size:16px;line-height:1.7;padding:12px 14px;margin:13px 0 0}
.extra-dialogue-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
.extra-dialogue-line{background:#fffdf8;border:1px solid #e9d9c6;border-radius:16px;padding:12px;display:grid;grid-template-columns:105px minmax(0,1fr);align-items:center;gap:12px;min-width:0}
.extra-character{width:105px;height:118px;object-fit:cover;border-radius:12px}
.extra-speaker{font-weight:750;color:#a12d67;margin-bottom:5px}
.extra-dialogue-line .ru{font-size:clamp(22px,2.8vw,29px);line-height:1.2;overflow-wrap:anywhere}
.extra-dialogue-line .latin{font-size:18px;line-height:1.35}
.extra-dialogue-line .zh{font-size:20px;line-height:1.35}
.extra-dialogue-line button{min-width:95px;min-height:47px}
@media(max-width:690px){
  .lesson-extra{padding-left:12px;padding-right:12px}
  .extra-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
  .extra-card{padding:10px 5px}
  .extra-card .ru{font-size:26px}
  .extra-card .latin{font-size:19px}
  .extra-card .zh{font-size:18px}
  .extra-dialogue-grid{grid-template-columns:1fr;gap:10px}
  .extra-dialogue-line{grid-template-columns:96px minmax(0,1fr);padding:9px}
  .extra-character{width:96px;height:115px}
  .extra-dialogue-line .ru{font-size:22px}
}
@media(max-width:360px){.extra-dialogue-line{grid-template-columns:76px minmax(0,1fr)}.extra-character{width:76px;height:108px}.extra-figure{font-size:42px}}
"""

def main():
  csspath=ROOT/'assets/course-extensions.css'
  assert not csspath.exists()
  csspath.write_text(css,encoding="utf-8")
  pending=set()
  for n in (4,5,6):
    path=ROOT/({4:"lesson-4-presentation-READY.html",5:"lesson-5.html",6:"lesson-6.html"}[n])
    source=path.read_text(encoding="utf-8")
    assert "lesson-extra" not in source
    assert source.count('<section class="quiz-invitation">')==1
    assert source.count('<link href="assets/illustrated.css" rel="stylesheet"/>')==1
    source=source.replace('<link href="assets/illustrated.css" rel="stylesheet"/>',
            '<link href="assets/illustrated.css" rel="stylesheet"/><link href="assets/course-extensions.css" rel="stylesheet"/>',1)
    source=source.replace('<section class="quiz-invitation">',build(n)+'<section class="quiz-invitation">',1)
    # Update quiz array, preserving current tests and their original scores.
    m=re.search(r'window\.COURSE_QUIZ=(\[.*?\]);</script>',source,re.S)
    assert m, ("Quiz data not found",n)
    quiz=json.loads(m.group(1))
    assert len(quiz)>=4,(n,len(quiz))
    quiz+=DATA[n]["quiz"]
    inserted=json.dumps(quiz,ensure_ascii=False,separators=(',',':'))
    source=source[:m.start(1)]+inserted+source[m.end(1):]
    assert source.count('<script src="assets/audio-manifest.js"></script>')==1
    source=source.replace('<script src="assets/audio-manifest.js"></script>',
         '<script src="assets/audio-manifest.js"></script><script src="assets/course-extensions-audio.js"></script>',1)
    path.write_text(source,encoding="utf-8")
    context=ROOT/f'content-review/lesson-{n}.json'
    doc=json.loads(context.read_text(encoding="utf-8"))
    assert 'extended_content' not in doc
    doc['extended_content']=DATA[n]
    context.write_text(json.dumps(doc,indent=2,ensure_ascii=False)+'\n',encoding="utf-8")
    for row in DATA[n]["items"]+DATA[n].get("times",[])+DATA[n]["dialogue"]:
      pending.add((row[3],row[0]))
    for q in DATA[n]["quiz"]:pending.add((q["role"],q["audio"]))
    print('ENHANCED',n,'quiz extra',len(DATA[n]["quiz"]),'audio keys',len(pending),flush=True)
  # Click targets for lesson 3: 44px minimum hit areas without changing icon art.
  l3=ROOT/'lesson-3-pronouns-basic.html'
  l3html=l3.read_text(encoding='utf-8')
  assert 'lesson3-touch-targets.css' not in l3html
  assert '</head>' in l3html
  l3html=l3html.replace('</head>','<link rel="stylesheet" href="assets/lesson3-touch-targets.css"/></head>',1)
  l3.write_text(l3html,encoding='utf-8')
  # Tiny icon remains the same; increase button's accessible hit area and spacing only.
  (ROOT/'assets/lesson3-touch-targets.css').write_text("""
@media(pointer:coarse){
  .card-audio,.example-audio,.inline-audio,.q-audio,
  .speaker,.play-all,.action,.quiz-listen,
  .pronouns button[data-say],.pronoun-card button[data-say]{
    min-width:44px!important;
    min-height:44px!important;
    display:inline-flex;align-items:center;justify-content:center;
    touch-action:manipulation;
  }
}
""",encoding='utf-8')
  # no unrelated web site pages touched
  assert not (ROOT/'index.html').read_text(encoding='utf-8').find('俄语课程')<0
  (ROOT/'assets/lesson-extensions-required-audio.json').write_text(
      json.dumps([{'role':r,'text':s} for r,s in sorted(pending)],ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
  print('Audio to validate/generate:',len(pending),flush=True)

if __name__=='__main__':main()
