# Lesson 4 audio restoration — 22 October 2026

15 previously missing dialogue lines now have separate MP3 files. Text, speaker,
source voice and duration are listed in manifest.json. Sources are Microsoft
ru-RU-SvetlanaNeural and ru-RU-DmitryNeural, generated with edge-tts. These are
neural synthetic recordings, not human voice actor recordings. HeyGen, TinyFish
and browser speech synthesis were not used for these files.

The approved four 640×480 WebP scenes were recovered from
lesson4-new-images-package.zip and connected as separate images. Main character
portraits, existing MP3s, index.html and the other six lessons are unchanged.

## Verification

- All 15 new MP3s decoded successfully with ffmpeg; duration 1.872–3.552 seconds.
- Headless Chromium at 390×844 and 1440×1000: all 30 practice cards tested at
  1× and 0.7×, with actual media play promises resolving.
- Each card tested with simulated matching and mismatching recognition results.
  These are transcript comparison tests, not a real microphone or phonetic test.
- Permission-denied handling, retry after an error, and Stop tested.
- Four original WebPs load at 640×480. No horizontal page overflow or script/
  HTTP errors in the local browser tests. Fonts, colors and card design retained.
- Floating practice launcher repositioned above the audio dock so Stop is usable.

## Remaining acceptance checks

- Real microphone recognition and permissions on physical Android and desktop
  hardware have not been tested. Browser support and network access vary.
- Human listening review of stress, question intonation, voice quality and audio/
  text correspondence is still required. File generation and successful decoding
  do not establish professional voice quality.
- Automated recognition compares words only; it does not score phonetics,
  stress, accent or pronunciation quality. The lesson tells students this.

Do not label the lesson professionally voice-reviewed or fully accepted for paid
release until the remaining checks have passed.
