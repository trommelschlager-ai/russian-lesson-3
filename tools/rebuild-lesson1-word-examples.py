#!/usr/bin/env python3
"""Regenerate only 33 mixed-voice example words in Russian lesson 1.

Do not touch the approved alphabet's 33 letterAudio tracks or the 99 existing
Svetlana example-word recordings. Validates before writing any lesson data.
"""
import asyncio
import hashlib
import json
import pathlib
import re
import tempfile

import edge_tts
from mutagen.mp3 import MP3

ROOT = pathlib.Path(__file__).resolve().parent.parent
PAGE = ROOT / "lesson-1-panda-style.html"
MANIFEST = ROOT / "audio/alphabet-natural/manifest.json"
OUT = ROOT / "audio" / "lesson1-word-svetlana-v1"
VOICE = "ru-RU-SvetlanaNeural"
RELEASE = "20261111-svetlana-33-extras-v1"
ALPHABET = list("АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ")

def checked_duration(path):
    if not path.is_file() or path.stat().st_size < 1500:
        raise ValueError(f"MP3 missing or empty: {path}")
    duration = MP3(str(path)).info.length
    if not .10 < duration < 10:
        raise ValueError(f"Unexpected audio length: {path} {duration:.2f}s")
    return duration

async def synthesize(index, word, target, lock):
    async with lock:
        target.parent.mkdir(parents=True, exist_ok=True)
        for attempt in range(5):
            try:
                # Full words provide pronunciation context missing from isolated letters.
                await edge_tts.Communicate(word, voice=VOICE, rate="-13%").save(str(target))
                duration = checked_duration(target)
                print(f"{index:02d} {word}: {target.stat().st_size} bytes, {duration:.2f}s", flush=True)
                return
            except Exception:
                if attempt == 4: raise
                await asyncio.sleep(2*(attempt+1))

async def main():
    html = PAGE.read_text(encoding="utf-8")
    match_data = re.search(r"const DATA=(\[[^\n]+\]);", html)
    match_extra = re.search(r"const EXTRAS=(\[[^\n]+\]);", html)
    if not match_data or not match_extra: raise RuntimeError("Missing inline lesson vocabulary")
    data = json.loads(match_data.group(1))
    extras = json.loads(match_extra.group(1))
    if len(data) != 33 or [x["l"] for x in data] != ALPHABET or len(extras) != 33:
        raise RuntimeError("Unexpected lesson alphabet structure")
    if any(len(group) != 3 for group in extras):
        raise RuntimeError("Expected three extra words per letter")

    # The extra at index 1 is the existing Dmitry word; preserve all others.
    old_tracks = []
    for i, (letter, group) in enumerate(zip(ALPHABET, extras), start=1):
        target = group[1]
        old = target["audio"]
        if not old.startswith("audio/alphabet-natural/dmitry-"):
            raise RuntimeError(f"Unexpected audio at {letter}: {old}")
        new = f"audio/lesson1-word-svetlana-v1/{i:02d}.mp3"
        old_tracks.append((letter, target["word"], old, new))

    manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
    if sum(x.get("field") == "letterAudio" for x in manifest) != 33:
        raise RuntimeError("Alphabet audio manifest missing")
    if sum(x.get("field") == "audio" and x.get("voice") == "Dmitry" for x in manifest) != 33:
        raise RuntimeError("Expected precisely 33 mixed voice words")
    original_letters = [(x["l"],x["letterAudio"]) for x in data]

    lock = asyncio.Semaphore(3)
    OUT.mkdir(parents=True, exist_ok=True)
    await asyncio.gather(*(synthesize(i,word,ROOT/new,lock)
       for i,(_,word,old,new) in enumerate(old_tracks,start=1)))
    if len(set(hashlib.sha256((ROOT/new).read_bytes()).digest()
                for _,_,_,new in old_tracks)) != 33:
        raise RuntimeError("Identical rendered examples detected")

    for letter, word, old, new in old_tracks:
        matches = [row for row in manifest
                   if row.get("field") == "audio" and row.get("file") == old]
        if len(matches) != 1 or matches[0]["display"].casefold() != word.casefold():
            raise RuntimeError(f"Audio manifest doesn't match {letter} {word}: {old}")
        matches[0]["voice"] = VOICE
        matches[0]["file"] = new
    for group, (_,_,old,new) in zip(extras,old_tracks):
        if group[1]["audio"] != old: raise RuntimeError("Old audio not stable")
        group[1]["audio"] = new

    manifest_output = json.dumps(manifest,ensure_ascii=False,indent=2)+"\n"
    modified_html = html[:match_extra.start(1)] + json.dumps(
        extras,ensure_ascii=False,separators=(",",":")
    ) + html[match_extra.end(1):]
    if "const AUDIO_RELEASE=" not in modified_html:
        raise RuntimeError("No cache release constant")
    # Do not change the accepted alphabet cache keys; new tracks have new filenames.
    if [(x["l"],x["letterAudio"]) for x in data] != original_letters:
        raise RuntimeError("Alphabet voices unexpectedly changed")
    MANIFEST.write_text(manifest_output,encoding="utf-8")
    PAGE.write_text(modified_html,encoding="utf-8")
    print("SUCCESS: 33 replacement female example tracks; all alphabet audio unchanged.",flush=True)

if __name__=="__main__":
    asyncio.run(main())
