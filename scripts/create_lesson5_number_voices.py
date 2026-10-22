"""Build lesson 5 compound-number MP3 by joining existing licensed/previously
recorded same-speaker Russian word clips, no external speech service."""
import json
import re
import hashlib
from pathlib import Path
from mutagen.mp3 import MP3
from pydub import AudioSegment
from pydub.silence import detect_nonsilent

ROOT=Path(__file__).resolve().parents[1]
AUDIO=ROOT/'audio/lesson5-counting'
AUDIO.mkdir(parents=True,exist_ok=True)
SOURCE=ROOT/'assets/audio-manifest.js'
EXTRA=ROOT/'assets/course-extensions-audio.js'
DEST=ROOT/'assets/lesson5-numbers-audio.js'
units=['ноль','один','два','три','четыре','пять','шесть','семь','восемь','девять']
tens={20:'двадцать',30:'тридцать',40:'сорок',50:'пятьдесят',60:'шестьдесят',70:'семьдесят',80:'восемьдесят',90:'девяносто'}
def parse(path):
    t=path.read_text(encoding='utf-8')
    m=re.search(r'Object\.assign\(window\.COURSE_AUDIO,\s*(\{.*?\})\s*\)',t,re.S)
    if not m:m=re.search(r'window\.COURSE_AUDIO\s*=\s*(\{.*?\})\s*;',t,re.S)
    if not m:raise RuntimeError('Cannot read manifest: '+str(path))
    return json.loads(m.group(1))
def trimmed(sound):
    spans=detect_nonsilent(sound,min_silence_len=110,silence_thresh=-44)
    if not spans:return sound
    return sound[max(0,spans[0][0]-35):min(len(sound),spans[-1][1]+65)]
def main():
    refs=parse(SOURCE)
    refs.update(parse(EXTRA))
    pieces={}
    for ru in set(units[1:])|set(tens.values()):
        f=ROOT/refs['male|'+ru]
        if not f.is_file():raise RuntimeError('Missing original recording '+str(f))
        pieces[ru]=trimmed(AudioSegment.from_mp3(str(f))).set_frame_rate(24000).set_channels(1)
    mappings={}
    for n in range(21,100):
        if n%10==0:continue
        ten,one=tens[(n//10)*10],units[n%10]
        utterance=ten+' '+one
        key='male|'+utterance
        if key in refs:continue
        digest=hashlib.sha256(key.encode('utf-8')).hexdigest()[:16]
        rel='audio/lesson5-counting/male-'+digest+'.mp3'
        # Both pieces were recorded with the original course's male voice.
        # A short natural pause replaces synthetic browser speech.
        clip=pieces[ten]+AudioSegment.silent(duration=80,frame_rate=24000)+pieces[one]
        clip.export(str(ROOT/rel),format='mp3',bitrate='160k')
        duration=MP3(str(ROOT/rel)).info.length
        if not 1.0<=duration<10:raise RuntimeError('Bad duration '+str(n)+' '+str(duration))
        mappings[key]=rel
        print('CREATED',n,utterance,round(duration,2),'sec',flush=True)
    expected=[n for n in range(21,100) if n%10]
    if len(mappings)+sum(1 for n in expected if 'male|'+tens[(n//10)*10]+' '+units[n%10] in refs)!=len(expected):
        raise RuntimeError('Failed completeness for 21-99')
    dest_text='/* Lesson 5 compound-number MP3 assembled from the existing Dmitry male number recordings. */\n'
    dest_text+='window.COURSE_AUDIO=window.COURSE_AUDIO||{};\n'
    dest_text+='Object.assign(window.COURSE_AUDIO,'+json.dumps(mappings,ensure_ascii=False,separators=(',',':'))+');\n'
    DEST.write_text(dest_text,encoding='utf-8')
    print('SUCCESS:',len(mappings),'additional composed MP3; all 11–100 now have audio in union of manifests',flush=True)
if __name__=='__main__':main()
