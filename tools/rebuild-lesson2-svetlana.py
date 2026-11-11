#!/usr/bin/env python3
"""Unify lesson 2's 100 word recordings without touching approved lesson 1.

- Preserve 59 existing Svetlana tracks.
- Reuse 19 already approved female recordings from lesson 1.
- Generate 22 previously male-only words with ru-RU-SvetlanaNeural.
- Leave photos, stress marks, translations, ordering and lesson 1 unchanged.
"""
import asyncio
import hashlib
import json
import pathlib
import re

import edge_tts
from mutagen.mp3 import MP3

ROOT = pathlib.Path(__file__).resolve().parent.parent
LESSON_1 = ROOT / "lesson-1-panda-style.html"
LESSON_2 = ROOT / "assets/lesson2-words.json"
NEW_AUDIO = ROOT / "audio/lesson2-word-svetlana-v1"
VOICE = "ru-RU-SvetlanaNeural"
FEMALE_LABEL = "女声 · 斯韦特兰娜"

def first_lesson_recordings():
    html = LESSON_1.read_text(encoding="utf-8")
    matches = [re.search(r"const "+key+r"=(\[[^\n]+\]);", html) for key in ("DATA", "EXTRAS")]
    if any(m is None for m in matches):
        raise RuntimeError("Approved lesson 1 word source not found")
    data, extras = (json.loads(m.group(1)) for m in matches)
    if len(data) != 33 or len(extras) != 33:
        raise RuntimeError("Approved first-lesson data structure changed")
    result = {}
    for row in data:
        result[row["word"].casefold()] = row["wordAudio"]
    for group in extras:
        for row in group:
            result[row["word"].casefold()] = row["audio"]
    if len(result) < 120:
        raise RuntimeError("Unexpected count of approved female recordings")
    return result

def valid_mp3(path):
    if not path.exists() or path.stat().st_size < 1700:
        raise RuntimeError(f"MP3 missing/empty: {path}")
    duration = MP3(str(path)).info.length
    if not .12 < duration < 9:
        raise RuntimeError(f"Unsafe duration {duration:.2f}s for {path}")
    return duration

async def record(word, destination, gate):
    async with gate:
        destination.parent.mkdir(parents=True, exist_ok=True)
        for attempt in range(5):
            try:
                await edge_tts.Communicate(word, voice=VOICE, rate="-13%").save(str(destination))
                duration=valid_mp3(destination)
                print(f"Created {word}: {destination.name}, {destination.stat().st_size}B, {duration:.2f}s", flush=True)
                return
            except Exception:
                if attempt == 4:
                    raise
                await asyncio.sleep(2*(attempt+1))

async def main():
    words = json.loads(LESSON_2.read_text(encoding="utf-8"))
    if len(words) != 100 or sorted(x.get("legacyIndex") for x in words) != list(range(100)):
        raise RuntimeError("Lesson 2 ordering or word count has changed")
    approved = first_lesson_recordings()
    existing, reuse, generate = [], [], []
    for i, row in enumerate(words):
        if "斯韦特兰娜" in row.get("voiceLabel", ""):
            existing.append((i, row))
            continue
        if "德米特里" not in row.get("voiceLabel", ""):
            raise RuntimeError(f"Unknown voice of {i+1}: {row['word']}")
        key = row["word"].casefold()
        if key in approved:
            reuse.append((i, row, approved[key]))
        else:
            generate.append((i, row, f"audio/lesson2-word-svetlana-v1/{i+1:03d}.mp3"))
    print(f"Counts: existing={len(existing)}, reuse={len(reuse)}, generate={len(generate)}",flush=True)
    if (len(existing),len(reuse),len(generate)) != (59,19,22):
        raise RuntimeError("Voice counts differ from audit; don't change live lesson blindly")
    gate = asyncio.Semaphore(3)
    await asyncio.gather(*(record(row["word"], ROOT/target, gate) for i,row,target in generate))
    for i,row,target in reuse:
        if not target.startswith("audio/lesson1-word-svetlana-v1/"):
            raise RuntimeError(f"Unexpected reusable voice path for {row['word']}: {target}")
    generated_checksums=[hashlib.sha256((ROOT/target).read_bytes()).digest() for _,_,target in generate]
    if len(set(generated_checksums)) != 22:
        raise RuntimeError("Identical synthesized tracks detected")
    for i,row,target in reuse+generate:
        row["url"]=target
        row["voiceLabel"]=FEMALE_LABEL
    if len(words)!=100 or len(set(x["word"] for x in words))!=100 or any("男声" in x["voiceLabel"] for x in words):
        raise RuntimeError("Bad final lesson 2 voice data")
    LESSON_2.write_text(json.dumps(words,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print("SUCCESS: all 100 words female voiced; 41 male removed; 22 new tracks verified",flush=True)

if __name__=="__main__":
    asyncio.run(main())
