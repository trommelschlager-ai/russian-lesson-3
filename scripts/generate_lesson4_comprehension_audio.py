"""Generate only four missing spoken lines in the lesson 4 comprehension dialogue.
Run from the repository root: python scripts/generate_lesson4_comprehension_audio.py
This does not touch HTML, images, other lessons or previously published audio.
"""
import asyncio
import hashlib
import json
import re
import subprocess
from pathlib import Path

import edge_tts

ROOT = Path(__file__).resolve().parents[1]
AUDIO_DIR = ROOT / "audio" / "lesson4-comprehension"
MANIFEST = ROOT / "assets" / "lesson4-final-audio.js"
# Preserve the exact published text; do not normalize or paraphrase it.
LINES = [
    ("female", "Ты меня понимаешь?", "ru-RU-SvetlanaNeural"),
    ("male", "Не совсем. Повтори, пожалуйста.", "ru-RU-DmitryNeural"),
    ("female", "Хорошо, повторю медленно.", "ru-RU-SvetlanaNeural"),
    ("male", "Теперь всё понятно!", "ru-RU-DmitryNeural"),
]

async def main():
    page = (ROOT / "lesson-4-presentation-READY.html").read_text(encoding="utf-8")
    AUDIO_DIR.mkdir(parents=True, exist_ok=True)
    manifest_text = MANIFEST.read_text(encoding="utf-8")
    match = re.search(r"Object\.assign\(window\.COURSE_AUDIO,\s*(\{[\s\S]*?\})\s*\);", manifest_text)
    if not match:
        raise RuntimeError("Unexpected existing manifest format. Refusing to overwrite.")
    mapping = json.loads(match.group(1))
    produced = []
    for role, phrase, voice in LINES:
        if page.count('data-say="' + phrase + '"') != 1:
            raise RuntimeError("Dialogue phrase missing or duplicated in HTML: " + phrase)
        digest = hashlib.sha256((role + "|" + phrase).encode("utf-8")).hexdigest()[:12]
        destination = AUDIO_DIR / (role + "-" + digest + ".mp3")
        print("Generating", role, phrase, voice, flush=True)
        synth = edge_tts.Communicate(phrase, voice=voice, rate="-3%", volume="+0%")
        await synth.save(str(destination))
        if not destination.exists() or destination.stat().st_size < 4500:
            raise RuntimeError("Missing or suspiciously small MP3: " + str(destination))
        seconds = subprocess.check_output([
            "ffprobe", "-v", "error", "-show_entries",
            "format=duration", "-of", "default=noprint_wrappers=1:nokey=1", str(destination),
        ], text=True).strip()
        if not 0.5 < float(seconds) < 12:
            raise RuntimeError("Suspicious duration " + seconds + " for " + phrase)
        mapping[role + "|" + phrase] = destination.relative_to(ROOT).as_posix()
        produced.append((phrase, role, str(destination), seconds, destination.stat().st_size))
    manifest_output = "/* Lesson 4 only: Microsoft SvetlanaNeural / DmitryNeural MP3. */\n"
    manifest_output += "Object.assign(window.COURSE_AUDIO, " + json.dumps(mapping, ensure_ascii=False, indent=2) + ");\n"
    MANIFEST.write_text(manifest_output, encoding="utf-8")
    assert len(produced) == 4
    for phrase, role, filename, seconds, size in produced:
        print("OK:", role, phrase, filename, seconds + "s", size, "bytes", flush=True)

if __name__ == "__main__":
    asyncio.run(main())
