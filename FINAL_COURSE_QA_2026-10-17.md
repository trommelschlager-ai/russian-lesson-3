# Итоговый технический отчёт — 17 октября 2026

**Ветка для проверки:** `course-recovery-2026-10-16`. **Основной сайт не изменялся.**
**PR:** https://github.com/trommelschlager-ai/russian-lesson-3/pull/1 — черновик, не объединён.

## Фактически исправлено и сохранено

1. **Урок 1: «Халат»** — заменена ошибочная фотография врачей на изображение банного халата (`assets/illustrated/bathrobe-white.webp`), соответствующее переводу `浴袍`. Слово, латиница и дизайн карточки сохранены.
2. **Урок 1: звук** — заново создано **165 MP3** голосами `ru-RU-DmitryNeural` и `ru-RU-SvetlanaNeural`; аудиофайлы лежат в `audio/alphabet-natural/`, полная привязка в `audio/alphabet-natural/manifest.json`. Внутренние аудиоссылки внутри `russian_lesson_1_COMPLETE.html` заменены на отдельные MP3 для всех 33 букв, 33 главных слов и 99 примеров. Browser `speechSynthesis` больше не используется для воспроизведения.
3. **Урок 6** — ранее исправленные две картинки Дмитрия остаются на правильных репликах диалога. Базовые картинки словаря семьи без принудительной переделки дизайна.
4. **Урок 7** — добавлены четыре реплики диалога «Мой день» со смысловыми китайскими переводами, латинской записью русского произношения, портретами Светланы/Дмитрия и **4 новых MP3** (`audio/lesson7-dialogue/`). Добавлены стили только для этого диалога (`assets/lesson7-dialogue.css`), без переделки других карточек или теста.

## Проверено

- GitHub Actions для изображения: https://github.com/trommelschlager-ai/russian-lesson-3/actions/runs/38973152087 — success.
- GitHub Actions для 165 новых MP3: https://github.com/trommelschlager-ai/russian-lesson-3/actions/runs/38973338569 — success. Создано 165 записей; генератор проверил MP3 и длительность звука.
- GitHub Actions для урока 7: https://github.com/trommelschlager-ai/russian-lesson-3/actions/runs/38973654991 — success. Сгенерированы 4 новых MP3 и привязаны к репликам.
- **Повторная браузерная проверка после обновлений:** https://github.com/trommelschlager-ai/russian-lesson-3/actions/runs/38973782724 — **success (14/14: 7 уроков × телефон и компьютер)**.
- SHA главной страницы `index.html` совпадает с `main`: `0c4b8c7e01cd87045ed8a9a96e8cefab5ce04abd`.
- Никаких изменений в ветке `main` не выполнялось.
- Временные одноразовые workflow/trigger-файлы очищены из резервной ветки.

## Перед коммерческим запуском

- **Обязательно прослушать на реальном телефоне** новые записи для букв, звуков и нескольких длинных слов; автоматическая проверка формата не гарантирует правильную интонацию.
- Проверить диалог урока 7 целиком по кнопке «全部播放» и несколько отдельных реплик.
- Для **платного курса** проверить право на коммерческое использование синтезированных Microsoft Edge Neural Voice аудиозаписей: `edge-tts` — неофициальный доступ к голосовому сервису, поэтому технический успех генерации **не является лицензией** на продажу аудио.
- Главная страница пока содержит ссылки только на уроки 1–4; чтобы уроки 5–7 появились в меню, потребуется отдельно согласованное изменение ссылок в `index.html` либо иной способ навигации.
- Не объединять PR в `main` до финального ручного просмотра и согласования публикации.

## Complaint: alphabet narration still sounds robotic — follow-up 17 October 2026

- The learner reports that lesson 1 still **sounds like the same robotic voice**. The earlier "fixed" claim was therefore not a satisfactory user-acceptance result.
- Verified repository branch has 165 new MP3 recordings in `audio/alphabet-natural/` generated with Microsoft Edge neural TTS (Dmitry/Svetlana); changing to these voices does **not guarantee naturalness**.
- GitHub Actions browser test https://github.com/trommelschlager-ai/russian-lesson-3/actions/runs/38974821445 passed. Under mobile and desktop Chrome, clicking `А` and `Арбуз` actually loads the newly generated MP3 files; no browser speech synthesis is used. This proves file routing, not pleasant sounding speech.
- Test page `ALPHABET_VOICE_COMPARISON.html` now lets the user compare four new MP3 clips with one previously approved clip from lesson 4, using a commit-hash URL to rule out cached copies.
- `raw.githack.com` branch URLs are temporarily cached and can serve stale page content; use an immutable commit URL for this check. **Query string changes do not invalidate raw.githack CDN cache.**
- Do not replace all 165 recordings again without identifying a substantially better voice by listening first. Original main/index and lesson 7 remain untouched.
