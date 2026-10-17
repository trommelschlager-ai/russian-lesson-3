#!/usr/bin/env python3
"""Replace seven faulty lesson 2 sounds; source text and other lessons are preserved."""
from pathlib import Path
import asyncio,json,re,subprocess,tempfile
import edge_tts
from mutagen.mp3 import MP3

VOICE="ru-RU-DmitryNeural"
ROOT=Path("audio/lesson2-pronunciation-fixes")
ROOT.mkdir(parents=True,exist_ok=True)

TARGETS={
    "ла":"ла́",
    "по":"по́",
    "до":"до́",
    "ко":"ко́",
    "бу":"бу́",
    "во":"во́",
    "мука":"мука́",
}
def normalize(x):
    return re.sub(r"[^а-яё]","",x.casefold())

async def generate():
    for key,stressed in TARGETS.items():
        # Repeated, stressed monosyllables are much less likely to be read
        # as Russian *unstressed* prepositions (во, по, до, ко).
        utterance=(f"{stressed}. {stressed}. {stressed}." if key!="мука"
                   else "Пшеничная мука́.")
        mp3=ROOT/(("flour" if key=="мука" else {"ла":"la","по":"po","до":"do","ко":"ko","бу":"bu","во":"vo"}[key])+".mp3")
        raw=ROOT/("_raw_"+key+".mp3")
        events=[]
        for attempt in range(4):
            try:
                audio=bytearray()
                async for event in edge_tts.Communicate(
                    utterance,VOICE,rate="-10%",boundary="WordBoundary").stream():
                    if event["type"]=="audio":
                        audio.extend(event["data"])
                    elif event["type"]=="WordBoundary":
                        events.append((event["text"],event["offset"]/10_000_000,event["duration"]/10_000_000))
                assert len(audio)>1200,(key,"no output")
                raw.write_bytes(audio)
                break
            except Exception:
                events=[]
                if attempt==3:raise
                await asyncio.sleep(1.2*(attempt+1))
        matching=[(txt,start,duration) for txt,start,duration in events if normalize(txt)==normalize(key)]
        assert len(matching)>= (1 if key=="мука" else 3),(key,events)
        word=matching[-1] if key=="мука" else matching[1]
        _,start,duration=word
        assert duration>0.12,(key,events)
        start_sec=max(0,start-0.055)
        end_sec=start+duration+0.095
        assert end_sec>start_sec
        subprocess.run([
            "ffmpeg","-hide_banner","-loglevel","error","-y",
            "-ss",str(start_sec),"-i",str(raw),
            "-t",str(end_sec-start_sec),"-ac","1","-ar","24000",
            "-c:a","libmp3lame","-q:a","3",str(mp3)
        ],check=True)
        info=MP3(str(mp3)).info
        assert mp3.stat().st_size>1400 and .16<info.length<3.5,(key,info.length,mp3.stat().st_size)
        print("CLIP_OK",key,"boundary",word,"file",mp3,"seconds",round(info.length,2),"bytes",mp3.stat().st_size,flush=True)
        raw.unlink()
    # This is the central mapping used by standalone lesson 2 and by
    # the alphabet continuation iframe. Preserve all other voice mappings.
    path=Path("assets/audio-manifest.js")
    source=path.read_text(encoding="utf-8")
    m=re.search(r'window.COURSE_AUDIO\s*=\s*(\{[\s\S]*?\});?\s*$',source)
    assert m,"Unexpected manifest structure"
    data=json.loads(m.group(1))
    before_keys=set(data)
    for key in TARGETS:
        index="male|"+key
        assert index in data,index
        assert data[index].startswith("audio/course/"),(index,data[index])
        data[index]=(ROOT/(("flour" if key=="мука" else {"ла":"la","по":"po","до":"do","ко":"ko","бу":"bu","во":"vo"}[key])+".mp3")).as_posix()
    assert set(data)==before_keys
    path.write_text(source[:m.start(1)]+json.dumps(data,ensure_ascii=False,separators=(',',':'))+source[m.end(1):],encoding="utf-8")

    # The spelling of the flour word itself must visibly show the stress.
    lesson=Path("russian_lesson_2_reading.html")
    page=lesson.read_text(encoding="utf-8")
    old='<div class="ru">мука</div><div class="lat">muka</div>'
    new='<div class="ru">мука́</div><div class="lat">muká</div>'
    assert page.count(old)==1,("Flour card changed unexpectedly",page.count(old))
    page=page.replace(old,new,1)
    assert page.count('data-say="мука"')==1,"Recorded audio lookup must remain exact"
    assert page.count('id="quiz-section"')==1 and 'lesson2-scrapbook.css' in page
    lesson.write_text(page,encoding="utf-8")
    (ROOT/"manifest.json").write_text(json.dumps({
        "voice":"Дмитрий · ru-RU-DmitryNeural",
        "method":"Stressed in context, cropped using word-boundary timings",
        "stress":"мука́ = flour / 面粉, NOT му́ка = suffering",
        "sounds":{k:data["male|"+k] for k in TARGETS}
    },ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
asyncio.run(generate())
