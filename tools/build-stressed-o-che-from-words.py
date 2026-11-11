#!/usr/bin/env python3
"""Fix isolated Russian O and CHE with vowels extracted from stressed context words.
Source words: 'ох' -> [o], 'чек' -> [tɕe]. Original files remain untouched.
Audio is sliced at the end of the last voiced vowel, removing the trailing consonant.
"""
import asyncio
import json
import pathlib
import re
import wave

import av
import edge_tts
import numpy as np

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "audio" / "alphabet-phonetic-v1"
VOICE = "ru-RU-SvetlanaNeural"
SAMPLES = [("О", "Ох!", "letter-o-stressed.wav"), ("Ч", "Чек.", "letter-che-stressed.wav")]

async def get_audio(text, destination):
    for attempt in range(4):
        try:
            await edge_tts.Communicate(text, voice=VOICE, rate="-12%").save(str(destination))
            if destination.stat().st_size < 1800:
                raise ValueError("Audio file too short")
            return
        except Exception:
            if attempt == 3:
                raise
            await asyncio.sleep(2 + attempt)

def read_pcm(filename):
    samples = []
    with av.open(str(filename)) as input_file:
        resampler = av.AudioResampler(format="s16", layout="mono", rate=24000)
        for frame in input_file.decode(audio=0):
            converted = resampler.resample(frame)
            for mono in converted:
                samples.append(mono.to_ndarray().reshape(-1).astype(np.float32) / 32768.0)
        for mono in (resampler.resample(None) or []):
            samples.append(mono.to_ndarray().reshape(-1).astype(np.float32) / 32768.0)
    if not samples:
        raise RuntimeError(f"No decoded audio in {filename}")
    return np.concatenate(samples)

def vowel_end(samples, tag):
    rate = 24000
    hop = 120
    window = 600  # 25 ms
    rms, periodic = [], []
    for start in range(0, len(samples)-window, hop):
        x = samples[start:start+window]
        rms.append(float(np.sqrt(np.mean(x*x))))
        x = x - np.mean(x)
        norm = float(np.sum(x*x))
        if norm < 1e-8:
            periodic.append(0.0)
            continue
        # Vowels are voiced and periodic; /x/ and /k/ at the ends are not.
        periodic.append(max(float(np.sum(x[:-lag]*x[lag:]) / norm) for lag in range(65, 251)))
    rms = np.array(rms)
    periodic = np.array(periodic)
    peak = float(np.max(rms))
    onset_candidates = np.where(rms >= max(peak*.045, .0025))[0]
    voiced_candidates = np.where((rms >= max(peak*.12, .004)) & (periodic > .48))[0]
    if not len(onset_candidates) or not len(voiced_candidates):
        raise RuntimeError(f"No reliable speech/vowel segment for {tag}")
    first = int(onset_candidates[0] * hop)
    last_voiced = int(voiced_candidates[-1] * hop + window)
    end = min(len(samples), last_voiced + int(.010*rate))
    begin = max(0, first - int(.018*rate))
    duration = (end-begin)/rate
    print(f"{tag}: source duration={len(samples)/rate:.3f}s, "
          f"cut={begin/rate:.3f}-{end/rate:.3f}s, voiced_end={last_voiced/rate:.3f}s",
          flush=True)
    if not .105 <= duration <= .9:
        raise RuntimeError(f"Unsafe segment duration {duration:.3f}s for {tag}")
    cropped = samples[begin:end].copy()
    # Ensure enough onset of affricate /tɕ/ is preserved for Ч.
    n = min(int(.015*rate), len(cropped)//5)
    cropped[-n:] *= np.linspace(1, 0, n)
    cropped[:min(100, n)] *= np.linspace(0, 1, min(100, n))
    maximum = float(np.max(np.abs(cropped)))
    if maximum < .012:
        raise RuntimeError(f"Audio silent for {tag}")
    cropped = np.clip(cropped * min(1.0, .84/maximum), -.97, .97)
    return (cropped * 32767).astype("<i2")

def write_wav(filename, pcm):
    with wave.open(str(filename), "wb") as audio:
        audio.setnchannels(1)
        audio.setsampwidth(2)
        audio.setframerate(24000)
        audio.writeframes(pcm.tobytes())
    if filename.stat().st_size < 2000:
        raise RuntimeError("Output audio too short")

async def main():
    OUT.mkdir(parents=True, exist_ok=True)
    for letter, context, filename in SAMPLES:
        raw = OUT / f"source-{letter.lower()}-fullword.mp3"
        await get_audio(context, raw)
        pcm = vowel_end(read_pcm(raw), letter)
        output = OUT / filename
        write_wav(output, pcm)
        print(f"Generated {letter} from '{context}': {output.name} {output.stat().st_size} bytes", flush=True)

    manifest_file = ROOT / "audio/alphabet-natural/manifest.json"
    rows = json.loads(manifest_file.read_text(encoding="utf-8"))
    for row in rows:
        if row.get("field") != "letterAudio":
            continue
        if row.get("display") == "Окно":
            row["file"] = "audio/alphabet-phonetic-v1/letter-o-stressed.wav"
            row["spoken"] = "о"
            row["voice"] = "ru-RU-SvetlanaNeural (stressed О from ох)"
        if row.get("display") == "Чай":
            row["file"] = "audio/alphabet-phonetic-v1/letter-che-stressed.wav"
            row["spoken"] = "че"
            row["voice"] = "ru-RU-SvetlanaNeural (stressed ЧЕ from чек)"
    manifest_file.write_text(json.dumps(rows, ensure_ascii=False, indent=2)+"\n", encoding="utf-8")

    page = ROOT / "lesson-1-panda-style.html"
    html = page.read_text(encoding="utf-8")
    found = re.search(r"const DATA=(\[[^\n]+\]);", html)
    if not found:
        raise RuntimeError("Lesson data missing")
    data = json.loads(found.group(1))
    if len(data) != 33:
        raise RuntimeError("Alphabet length wrong")
    for row in data:
        if row["l"] == "О":
            row["letterAudio"] = "audio/alphabet-phonetic-v1/letter-o-stressed.wav"
        elif row["l"] == "Ч":
            row["letterAudio"] = "audio/alphabet-phonetic-v1/letter-che-stressed.wav"
    html = html[:found.start(1)]+json.dumps(data,ensure_ascii=False,separators=(",",":"))+html[found.end(1):]
    html,n = re.subn(r'const AUDIO_RELEASE="[^"]+";',
         'const AUDIO_RELEASE="20261111-stressed-phonemes-o-che-v1";', html)
    if n != 1:
        raise RuntimeError("Cache version missing")
    page.write_text(html, encoding="utf-8")
    print("SUCCESS: both corrected files created and lesson references updated",flush=True)

if __name__ == "__main__":
    asyncio.run(main())
