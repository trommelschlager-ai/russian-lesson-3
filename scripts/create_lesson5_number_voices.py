"""Prepare missing Russian MP3s for all numbers 11–100, only lesson 5."""
import asyncio
import hashlib
import json
import re
from pathlib import Path
from mutagen.mp3 import MP3
import edge_tts

ROOT=Path(__file__).resolve().parents[1]
SOURCE=ROOT/'assets/audio-manifest.js'
EXTENDED=ROOT/'assets/course-extensions-audio.js'
DEST=ROOT/'assets/lesson5-numbers-audio.js'
AUDIO=ROOT/'audio/lesson5-counting'
AUDIO.mkdir(parents=True, exist_ok=True)
s=['ноль','один','два','три','четыре','пять','шесть','семь','восемь','девять','десять']
teens=['одиннадцать','двенадцать','тринадцать','четырнадцать','пятнадцать','шестнадцать','семнадцать','восемнадцать','девятнадцать']
tens={20:'двадцать',30:'тридцать',40:'сорок',50:'пятьдесят',60:'шестьдесят',70:'семьдесят',80:'восемьдесят',90:'девяносто',100:'сто'}
def word(n):
    if n<=10:return s[n]
    if n<20:return teens[n-11]
    decade=(n//10)*10
    return tens[decade]+(' '+s[n%10] if n%10 else '')

def read_manifest(path):
    value=path.read_text(encoding='utf-8')
    obj=re.search(r'Object.assign\(window\.COURSE_AUDIO,\s*(\{.*?\})\s*\)',value,re.S)
    if obj:return json.loads(obj.group(1))
    m=re.search(r'window\.COURSE_AUDIO\s*=\s*(\{.*?\})\s*;',value,re.S)
    if not m:raise RuntimeError('Unknown manifest in '+str(path))
    return json.loads(m.group(1))

async def synthesize(n, existing, results, semaphore):
    text=word(n)
    key='male|'+text
    if key in existing:
        print('EXISTING',n,text,flush=True)
        return
    digest=hashlib.sha256(key.encode('utf-8')).hexdigest()[:16]
    relative=f'audio/lesson5-counting/male-{digest}.mp3'
    filepath=ROOT/relative
    async with semaphore:
        for attempt in range(3):
            try:
                await edge_tts.Communicate(text, voice='ru-RU-DmitryNeural',rate='-4%').save(str(filepath))
                if filepath.stat().st_size < 1700:raise RuntimeError('Too small')
                duration=MP3(str(filepath)).info.length
                if duration<.65 or duration>15:raise RuntimeError(f'Bad duration: {duration}')
                results[key]=relative
                print('CREATED',n,text,round(duration,2),flush=True)
                return
            except Exception as e:
                print('RETRY',n,attempt+1,str(e)[:100],flush=True)
                filepath.unlink(missing_ok=True)
                if attempt==2:raise
                await asyncio.sleep(1.5*(attempt+1))
async def main():
    existing=read_manifest(SOURCE)
    existing.update(read_manifest(EXTENDED))
    results={}
    semaphore=asyncio.Semaphore(3)
    await asyncio.gather(*(synthesize(n,existing,results,semaphore) for n in range(11,101)))
    missing=[word(n) for n in range(11,101) if 'male|'+word(n) not in existing and 'male|'+word(n) not in results]
    if missing:raise RuntimeError('Missing recordings: '+str(missing))
    body='/* Lesson 5 counting: ru-RU-DmitryNeural MP3; generated and duration-checked. */\n'
    body+='window.COURSE_AUDIO=window.COURSE_AUDIO||{};\n'
    body+='Object.assign(window.COURSE_AUDIO,'+json.dumps(results,ensure_ascii=False,separators=(',',':'))+');\n'
    DEST.write_text(body,encoding='utf-8')
    print('SUCCESS',len(results),'new plus',90-len(results),'existing = 90 numbers from 11 to 100',flush=True)
if __name__=='__main__':asyncio.run(main())
