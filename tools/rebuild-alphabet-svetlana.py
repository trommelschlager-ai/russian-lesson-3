#!/usr/bin/env python3
"""Regenerate the 33 Russian alphabet letter names using one Russian female voice.
Never deletes or overwrites the existing recordings. Requires edge-tts and ffmpeg.
"""
import asyncio
import hashlib
import json
import pathlib
import re
import subprocess
import tempfile

import edge_tts

ROOT = pathlib.Path(__file__).resolve().parent.parent
VOICE = "ru-RU-SvetlanaNeural"
OUT = ROOT / "audio" / "alphabet-svetlana-v1"
ALPHABET = list("АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ")
NAMES = ["а","бэ","вэ","гэ","дэ","е","ё","жэ","зэ","и","и краткое","ка","эль","эм","эн","о","пэ","эр","эс","тэ","у","эф","ха","цэ","че","ша","ща","твёрдый знак","ы","мягкий знак","э","ю","я"]
# Force a clearly pronounced isolated letter; Che is a proper-name reading, NOT colloquial "чё".
PRONOUNCE = {"О":"О!", "Ч":"Че"}
# Keep a second optional candidate for difficult Ч and О for comparison.
ALTERNATES = {"О":"О.", "Ч":"ЧЕ"}

def verify(path):
    if not path.is_file() or path.stat().st_size < 1000:
        raise RuntimeError(f"Missing/empty recording: {path}")
    cmd=["ffprobe","-v","error","-show_entries","format=duration","-of","default=noprint_wrappers=1:nokey=1",str(path)]
    result=subprocess.run(cmd,capture_output=True,text=True,check=True)
    duration=float(result.stdout.strip())
    if not .08 <= duration <= 6.0:
        raise RuntimeError(f"Unexpected duration for {path.name}: {duration}")
    return duration

async def produce(letter,text,target,limiter):
    async with limiter:
        target.parent.mkdir(parents=True,exist_ok=True)
        with tempfile.TemporaryDirectory() as folder:
            raw=pathlib.Path(folder)/"raw.mp3"
            for attempt in range(4):
                try:
                    await edge_tts.Communicate(text,voice=VOICE,rate="-10%").save(str(raw))
                    verify(raw)
                    break
                except Exception:
                    if attempt==3: raise
                    await asyncio.sleep(2*(attempt+1))
            # Consistent perceived loudness; trim only digital silence, preserve tails.
            subprocess.run(["ffmpeg","-hide_banner","-loglevel","error","-y","-i",str(raw),
              "-af","loudnorm=I=-19:TP=-2.5:LRA=10", "-codec:a","libmp3lame","-b:a","64k",str(target)],
              check=True)
        duration=verify(target)
        print(f"{letter}: {text!r} -> {target.name} ({target.stat().st_size} bytes, {duration:.2f}s)",flush=True)

async def main():
    if len(ALPHABET)!=33 or len(NAMES)!=33 or len(set(ALPHABET))!=33:
        raise RuntimeError("Invalid alphabet data")
    limiter=asyncio.Semaphore(3)
    jobs=[]
    for letter,name in zip(ALPHABET,NAMES):
        jobs.append(produce(letter,PRONOUNCE.get(letter,name),OUT/f"{ALPHABET.index(letter)+1:02d}-{letter.lower()}.mp3",limiter))
    for letter,text in ALTERNATES.items():
        jobs.append(produce(letter+" alternative",text,OUT/f"alternative-{letter.lower()}.mp3",limiter))
    await asyncio.gather(*jobs)

    files=[OUT/f"{i:02d}-{letter.lower()}.mp3" for i,letter in enumerate(ALPHABET,1)]
    hashes=[hashlib.sha256(p.read_bytes()).hexdigest() for p in files]
    if len(set(hashes))!=33:
        raise RuntimeError("Two alphabet audio files are byte-identical")
    manifest_file=ROOT/"audio/alphabet-natural/manifest.json"
    manifest=json.loads(manifest_file.read_text(encoding="utf-8"))
    letters=[x for x in manifest if x.get("field")=="letterAudio"]
    if len(letters)!=33: raise RuntimeError(f"Expected 33 letterAudio entries, got {len(letters)}")
    for i,(row,letter) in enumerate(zip(letters,ALPHABET),1):
        row["file"]=f"audio/alphabet-svetlana-v1/{i:02d}-{letter.lower()}.mp3"
        row["voice"]=VOICE
        row["spoken"]=NAMES[i-1]
    manifest_file.write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")

    page=ROOT/"lesson-1-panda-style.html"
    html=page.read_text(encoding="utf-8")
    match=re.search(r"const DATA=(\[[^\n]+\]);",html)
    if not match: raise RuntimeError("Lesson letter data missing")
    data=json.loads(match.group(1))
    if len(data)!=33 or [row["l"] for row in data]!=ALPHABET:
        raise RuntimeError("Unexpected in-page alphabet order")
    for i,row in enumerate(data,1):
        row["letterAudio"]=f"audio/alphabet-svetlana-v1/{i:02d}-{row['l'].lower()}.mp3"
    html=html[:match.start(1)]+json.dumps(data,ensure_ascii=False,separators=(",",":"))+html[match.end(1):]
    html,n=re.subn(r'const AUDIO_RELEASE="[^"]+";',
      'const AUDIO_RELEASE="20261111-svetlana-33-female-v1";',html)
    if n!=1: raise RuntimeError("Audio cache version cannot be replaced")
    page.write_text(html,encoding="utf-8")

    print("READY: 33 female MP3 verified; lesson and manifest updated; old audio untouched",flush=True)

if __name__=="__main__":
    asyncio.run(main())
