# Lesson 2 rebuild — 2026-10-19

final result: blocked

The page is an interactive rebuild, not a completed fidelity-approved lesson.

Source: /workspace/scratch/bf35dba45c29/upload/01-30102.png, 1536×1024.
Public test verified: https://raw.githack.com/trommelschlager-ai/russian-lesson-3/3688c18d381a6b7ed3c4675c2b2aba03aa6dc7c5/lesson-2-100-words.html — 100 menu entries, МАМА initially, MP3 readyState 4 / duration 1.872 / rate 0.7.

Actual browser evidence: /workspace/scratch/lesson2-final-browser.jpg, 1363×936 desktop browser. /workspace/scratch/lesson2-mobile-browser.jpg shows the lesson inside a 390×844 iframe. These are real browser captures, not ImageGen results. Exact desktop 1536×1024 export failed with Page.captureScreenshot timeout. Local Playwright Chromium was missing; downloading it failed with truncated archive errors. A 1536×1024 iframe harness exists in qa/desktop.html; it does not substitute for the requested exact-size screenshot.
Comparison: qa/comparison.jpg combines reference and browser capture. Different viewport explicitly noted; no pixel-perfect assertion. Focused typography/photo/frame review performed from the full-resolution browser view.

## Verified
- First card is МАМА. No runtime sorting.
- Next card becomes ПАПА; previous returns МАМА.
- Left-menu selection reaches 100 / 100.
- Slow MP3 plays at rate 0.7: HTMLAudioElement readyState 4, duration 1.872 s, no media error for Мама.
- All 100 image files decode with Pillow; all 100 MP3 decode with ffprobe, positive durations. qa/asset-checks.json records each path, size and duration. This is a file/decode check, not an auditory pronunciation review of every word.
- Seen progress increased to 3 / 100 after navigating three cards.
- Browser console inspected: visible errors are from chrome-extension metadata messaging; no application error observed in tested actions.
- index.html has no diff. Existing lesson/audio files were not removed.
- Flower photograph corrected using the existing alphabet lesson's photograph, credited to Ianaré Sévi, CC BY-SA 3.0 in IMAGE_SOURCES.md.

## Remaining findings
- P1 imagery: central mother/daughter image is a different, lower-resolution source than the approved reference. Some inherited images are illustrations rather than real photographs. Authentic photo replacement remains necessary.
- P1 decorative fidelity: header artwork, gold corners, photo frame, floral footer and typography differ from the reference. The same composition and separate functioning UI are present; exact reproduction is not achieved.
- P2 desktop viewport: requested 1536×1024 export remains unverified. Narrower 1363×936 page requires vertical scrolling; controls remain in document flow.
- P2 content: saved 100 words do not include Голова or Кошка; these were not silently substituted for existing words. Abstract words use contextual photographs/captions rather than definitive literal depictions.
- P2 recognition: real microphone capture and Russian recognition service were not tested with human speech. Browser support, permission and network dependencies remain. Text matching explicitly does not assess stress or pronunciation.
- P2 mobile: observed inside a 390×844 iframe without visible horizontal overflow; exact standalone mobile browser/device validation remains incomplete.

## Iteration history
1. First browser view: МАМА wrapped; portrait/frame overlapped actions. Fixed container-relative font sizing and fixed portrait height. Recaptured.
2. Frame hid top counter and bottom controls. Switched outer ornament to a nine-slice border; recaptured. Counter and navigation remain separate interactive elements.
3. Contact-sheet review found flower vase mismatch; replaced with the actual flower photograph from lesson 1. Added captions for contextual calendar/abstract photos.

## Priorities
1. Replace remaining mismatched artwork/photos with exact approved assets and verify 1536×1024 against source.
2. Complete genuine microphone/recognition checks and mobile device testing.
3. Audit all recordings by ear; file decoding alone cannot validate stress.
