#!/usr/bin/env python3
"""Download vetted Pexels pictures as LOCAL assets for the 100-word lesson.
This intentionally writes neither index.html nor another lesson.
If a download fails, abort before the Git commit; don't leave external hotlinks.
"""
from pathlib import Path
from urllib.request import Request, urlopen
import json, os

root=Path(__file__).resolve().parents[1]
destination=root/'assets'/'lesson2-photos'
data_path=root/'assets'/'lesson2-words.json'
photos={
  'Машина': ('5864402','car-not-taxi-pexels.jpg','Neron Photos / Pexels'),
  'Город': ('2677692','city-skyline-pexels.jpg','Bruno Thethe / Pexels'),
  'Цыплёнок': ('8136327','whole-chick-pexels.jpg','Ellie Burgin / Pexels'),
  'Холод': ('8731918','frost-crystals-pexels.jpg','Mika Mark / Pexels'),
  'Потом': ('5477697','clock-planner-pexels.jpg','Kaboompics / Pexels'),
  'Вчера': ('273153','calendar-yesterday-pexels.jpg','Pixabay / Pexels'),
  'Сегодня': ('8646391','calendar-today-pexels.jpg','Fauzan Fitria / Pexels'),
  'Завтра': ('11773871','calendar-tomorrow-pexels.jpg','Towfiqu barbhuiya / Pexels'),
}
data=json.loads(data_path.read_text('utf-8'))
assert len(data)==100 and len({w['word'] for w in data})==100
assert set(photos).issubset({w['word'] for w in data})
credits=['# Local photos for Lesson 2','', 'Images from Pexels, free-to-use license.']
for word,(num,filename,credit) in photos.items():
    url=f'https://images.pexels.com/photos/{num}/pexels-photo-{num}.jpeg?auto=compress&cs=tinysrgb&w=1000'
    print('FETCH',word,url,flush=True)
    req=Request(url,headers={'User-Agent':'Mozilla/5.0 (compatible; EducationalLanguageCourse/1.0)'})
    with urlopen(req,timeout=35) as response:
        pic=response.read(1500000)
        typ=response.headers.get('Content-Type','')
    assert len(pic)>4000 and pic[:2]==b'\\xff\\xd8' and 'image' in typ,(word,len(pic),typ,pic[:6])
    (destination/filename).write_bytes(pic)
    credits.append(f'- {word}: [{credit}](https://www.pexels.com/photo/{num}/), downloaded as {filename}.')
    for item in data:
        if item['word']==word:
            item['imageData']='assets/lesson2-photos/'+filename
            break
(data_path).write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\\n','utf-8')
(destination/'PEXELS-SOURCES.md').write_text('\\n'.join(credits)+'\\n','utf-8')
print('DOWNLOADED_AND_UPDATED',len(photos),flush=True)
