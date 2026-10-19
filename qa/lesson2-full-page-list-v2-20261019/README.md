# Full-page list revision — 2026-10-19

Backup: backup/lesson2-before-full-page-list-yogurt-v2-20261019.

The catalog is now BELOW the central lesson at every viewport, not a left sidebar. All 100 rows have natural document height; there is no inner scrollbar. Selecting a row updates the central card and plays its MP3 without scrolling the reader back to the top. The panorama, gold artwork, Chinese controls and guidance panels are retained. Stable legacyIndex progress remains unchanged.

Yogurt now uses a separate Svetlana recording at audio/lesson2-corrections/yogurt-svetlana-yo-v2.mp3. The phonetic synthesis input Ёгурт. forces initial stressed /jo/; displayed Russian spelling stays Йогурт. Its SHA256 differs from the prior file. Audio played to completion at 1x and 0.7x in Chromium; auditory naturalness/stress review is NOT possible in this runtime and remains unverified.

Passed static 100-word/photo/MP3 checks and desktop 1536x1024 / Android mobile emulation 390x844 browser checks. Catalog height equals scrollHeight: 7399px desktop and 6899px mobile. Confirmed catalog starts below the main card, all rows form one column, item 100 is reachable and clickable, clicking stays at the selected row, progress survives reload, no horizontal overflow or JS errors.

Screenshots show the actual page, not design drafts. Physical-device Android and listening review remain outside the automated checks. index.html, other lessons and main branch are untouched.
