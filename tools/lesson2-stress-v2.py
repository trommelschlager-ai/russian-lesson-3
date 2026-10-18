from pathlib import Path
from io import BytesIO
import asyncio, json, re, math
import edge_tts
from pydub import AudioSegment, effects
from mutagen.mp3 import MP3
import audioop

out=Path("audio/lesson2-pronunciation-v2")
out.mkdir(parents=True,exist_ok=True)
words={
 "ла":("ла́па","ла́па"),
 "по":("по́ле","по́ле"),
 "до":("до́ма","до́ма"),
 "ко":("ко́тик","ко́тик"),
 "бу":("бу́лка","бу́лка"),
 "во":("во́ля","во́ля"),
 "мука":("Нам нужна пшеничная мука для выпечки.","мука")
}
names={"ла":"la","по":"po","до":"do","ко":"ko","бу":"bu","во":"vo","мука":"flour"}

def norm(t):
 return re.sub(r"[^а-яё]","",t.lower())

async def synth(phrase,needle):
 attempts=0
 while True:
  attempts+=1
  audio=bytearray()
  events=[]
  try:
   async for e in edge_tts.Communicate(phrase,"ru-RU-DmitryNeural",rate="-18%",boundary="WordBoundary").stream():
    if e["type"]=="audio":audio.extend(e["data"])
    if e["type"]=="WordBoundary": events.append((e["text"],e["offset"]/10000,e["duration"]/10000))
   matching=[e for e in events if norm(e[0])==norm(needle)]
   assert len(audio)>1000 and matching,("missing target boundaries",phrase,events)
   clip=AudioSegment.from_file(BytesIO(audio),format="mp3")
   text,start,duration=matching[-1]
   assert 240<duration<3000,(phrase,duration)
   selection=clip[max(0,int(start-24)):min(len(clip),int(start+duration+36))]
   assert len(selection)>250
   return selection,events
  except Exception as e:
   if attempts>=4:raise
   print("Retry",phrase,str(e)[:90],flush=True)
   await asyncio.sleep(attempts+1)

def find_syllable_end(audio):
 # Recover a phonetic boundary near the middle of a naturally stressed
 # two-syllable word; prefer a low-energy consonant closure around the
 # expected boundary, instead of trusting unstressed standalone synthesis.
 dur=len(audio)
 mono=audio.set_channels(1).set_frame_rate(16000)
 begin=int(dur*.34)
 finish=int(dur*.68)
 readings=[]
 for t in range(begin,finish,8):
  frame=mono[t:t+18]
  energy=audioop.rms(frame.raw_data,frame.sample_width) if len(frame)>=16 else 99999
  # avoid prioritizing the very end of the word
  middle=dur*.51
  reading=math.log(energy+1)+.45*abs(t-middle)/max(1,dur)*4
  readings.append((reading,t,energy))
 assert readings,("no boundary candidate",dur)
 best=min(readings)
 return best[1],best[2]

async def main():
 manifest={}
 for key,(phrase,needle) in words.items():
  word,events=await synth(phrase,needle)
  (out/(names[key]+"-source.mp3")).write_bytes(b"")
  if key=="мука":
   excerpt=word.fade_in(10).fade_out(20)
   boundary="entire word in flour context"
  else:
   endpoint,rms=find_syllable_end(word)
   # For words with second consonant onset, cut at the low energy boundary.
   excerpt=word[:min(len(word),endpoint+15)].fade_in(7).fade_out(26)
   boundary=f"stressed first syllable, cropped at {endpoint}ms; local RMS {rms}"
  assert 180<len(excerpt)<2000,(key,len(excerpt))
  path=out/(names[key]+".mp3")
  excerpt.export(path,format="mp3",bitrate="80k")
  assert path.stat().st_size>1500
  duration=MP3(str(path)).info.length
  assert 0.18<duration<2.2,(key,duration)
  print("V2_AUDIO",key,phrase,round(duration,2),"sec",boundary,flush=True)
  manifest[key]={"path":path.as_posix(),"context":phrase,"duration_sec":round(duration,2),"crop":boundary}
 (out/"details.json").write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
 # Scope overrides to lesson 2 ONLY, to avoid touching pronunciations in any other lesson.
 overrides={"male|"+k:rec["path"] for k,rec in manifest.items()}
 js="window.COURSE_AUDIO=window.COURSE_AUDIO||{};Object.assign(window.COURSE_AUDIO,"+json.dumps(overrides,ensure_ascii=False,separators=(',',':'))+");\n"
 Path("assets/lesson2-audio-overrides-v2.js").write_text(js,encoding="utf-8")
 lesson=Path("russian_lesson_2_reading.html")
 page=lesson.read_text(encoding="utf-8")
 old='<script src="assets/audio-manifest.js"></script><script src="assets/course.js"></script>'
 new='<script src="assets/audio-manifest.js"></script><script src="assets/lesson2-audio-overrides-v2.js"></script><script src="assets/course.js"></script>'
 assert page.count(old)==1,("unexpected lesson scripts",page.count(old))
 assert 'мука́' in page and 'lesson2-scrapbook.css' in page
 page=page.replace(old,new,1)
 lesson.write_text(page,encoding="utf-8")
 # Restore the global audio map to what it contained before the previous
 # flawed correction, preserving changes to all other words and voices.
 mf=Path("assets/audio-manifest.js")
 content=mf.read_text(encoding="utf-8")
 m=re.search(r'window.COURSE_AUDIO\s*=\s*(\{[\s\S]*?\});?\s*$',content)
 assert m
 data=json.loads(m.group(1))
 original={
  "ла":"audio/course/male-f894a109817dc9.mp3",
  "по":"audio/course/male-51ad1397c22557.mp3",
  "до":"audio/course/male-102dcd5d863606.mp3",
  "ко":"audio/course/male-e42faa066a234e.mp3",
  "бу":"audio/course/male-adef0cb3f7af03.mp3",
  "во":"audio/course/male-c0f622cbe8f9a8.mp3",
  "мука":"audio/course/male-9f5aff656efd81.mp3"
 }
 for word,old in original.items():
  key="male|"+word
  assert data[key].startswith("audio/lesson2-pronunciation-fixes/"),(word,data[key])
  data[key]=old
 mf.write_text(content[:m.start(1)]+json.dumps(data,ensure_ascii=False,separators=(',',':'))+content[m.end(1):],encoding="utf-8")
 print("APPLIED_SCOPED_AUDIO_OVERRIDE",len(overrides),flush=True)

asyncio.run(main())
