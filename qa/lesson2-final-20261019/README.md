# Lesson 2 final correction QA — 2026-10-19

Backup: `backup/lesson2-before-list-yogurt-sun-20261019`, original commit `1cbc74aac61d13bf124720ccaea677c286cc6467`.
Working branch: `feature/lesson2-final-order-audio-qa-20261019`. No merge to main.

## Changes
- Catalog stays one column with 100 numbered words, photos, Russian and Chinese labels, sorted by word length. Mobile catalog now uses full document height instead of a 245px pane / 165px scroll area.
- Selecting a mobile catalog entry returns to the existing central card. On desktop, previous/next keeps the active catalog row in view.
- Existing stable `legacyIndex` progress identifiers and localStorage key preserved.
- Sun replaced with a local 1600x1067 Pexels photo; source and license documented in assets/lesson2-photos/PEXELS-SOURCES.md. Gold frame and existing artwork unchanged.
- New local Svetlana MP3 synthesized from `Йо́гурт.` with explicit first-syllable stress. Scoped to Lesson 2; original shared audio left intact.

## Passed
- Static QA: 100 unique words, increasing word length, 100 valid stress/syllable definitions, 100 matching audio source-manifest entries, 100 distinct local photos, 100 readable MP3 durations, no duplicate MP3 payloads.
- Chromium desktop 1536x1024 and Pixel 7 Android emulation at 390x844: all 100 central cards, selected-row state, text fit, all image decoding, continuous single-column order, reach/click item 100, saved progress after reload, zero JS errors, zero horizontal overflow.
- Mobile catalog clientHeight/scrollHeight both 6899px: no small nested scroll window.
- Actual new yogurt MP3 played to completion using the normal button and the slow button at 1x and 0.7x; preservesPitch=true. No mocked playback.
- Sun framing visually inspected in desktop and mobile screenshots.
- index.html, other lessons, panoramic header, decorative artwork, colors, Chinese interface and right panel were not modified.

## Remaining limitations
- Audio cannot be heard by this runtime. Auditory confirmation of naturalness and first-syllable stress has NOT been performed. Explicit stress in synthesis input is not a listening check.
- Android check uses Chromium mobile emulation, not a physical Android phone.

## Reproduce
Run from the repository root with Playwright available:
`node tools/lesson2-reference-qa.mjs`
`CHROME_PATH=/path/to/chromium node tools/lesson2-final-browser-qa.cjs`
The browser test uses CODEX_PRIMARY_RUNTIME_NODE_MODULES to resolve Playwright, starts its own local static server, and writes screenshots here.
