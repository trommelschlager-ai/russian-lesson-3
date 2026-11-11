#!/usr/bin/env python3
"""Generate corrected isolated Russian letter recordings with one Dmitry neural voice.

Run only via the dedicated one-shot GitHub workflow. Original MP3s are preserved.
"""
import asyncio
import json
import pathlib
import re

import edge_tts

ROOT = pathlib.Path(__file__).resolve().parent.parent
VOICE = "ru-RU-DmitryNeural"
OUTPUT = ROOT / "audio" / "alphabet-corrected"
TRACKS = {
    "О": ("о́", "letter-o-dmitry-stressed.mp3"),
    "Ч": ("че́", "letter-che-dmitry-stressed.mp3"),
}

async def main():
    OUTPUT.mkdir(parents=True, exist_ok=True)
    for letter, (text, filename) in TRACKS.items():
        target = OUTPUT / filename
        for attempt in range(3):
            try:
                await edge_tts.Communicate(text, voice=VOICE, rate="-10%").save(str(target))
                if target.stat().st_size < 1000:
                    raise RuntimeError(f"{letter}: unexpectedly small recording")
                break
            except Exception:
                if attempt == 2:
                    raise
                await asyncio.sleep(2 + attempt)
        print(f"Generated {letter}: {target.relative_to(ROOT)}, {target.stat().st_size} bytes")

    manifest_file = ROOT / "audio" / "alphabet-natural" / "manifest.json"
    manifest = json.loads(manifest_file.read_text(encoding="utf-8"))
    for entry in manifest:
        if entry.get("field") != "letterAudio":
            continue
        if entry.get("display") == "Окно":
            entry["file"] = "audio/alphabet-corrected/letter-o-dmitry-stressed.mp3"
            entry["voice"] = VOICE
            entry["spoken"] = "о"
        if entry.get("display") == "Чай":
            entry["file"] = "audio/alphabet-corrected/letter-che-dmitry-stressed.mp3"
            entry["voice"] = VOICE
            entry["spoken"] = "че"
    manifest_file.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    lesson_file = ROOT / "lesson-1-panda-style.html"
    lesson = lesson_file.read_text(encoding="utf-8")
    data_match = re.search(r"const DATA=(\[[^\n]+\]);", lesson)
    if not data_match:
        raise RuntimeError("No inline alphabet DATA found")
    data = json.loads(data_match.group(1))
    for entry in data:
        if entry["l"] in TRACKS:
            entry["letterAudio"] = "audio/alphabet-corrected/" + TRACKS[entry["l"]][1]
    if len(data) != 33:
        raise RuntimeError("Expected 33 alphabet entries")
    lesson = lesson[:data_match.start(1)] + json.dumps(data, ensure_ascii=False, separators=(",", ":")) + lesson[data_match.end(1):]
    lesson = re.sub(r'const AUDIO_RELEASE="[^"]+";', 'const AUDIO_RELEASE="20261111-dmitry-new-oe-che-6";', lesson)
    lesson_file.write_text(lesson, encoding="utf-8")
    print("Updated inline lesson data, manifest, and cache version")

if __name__ == "__main__":
    asyncio.run(main())
