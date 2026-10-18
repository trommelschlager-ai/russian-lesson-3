// Read-only audit for lesson 1: protect the enormous original HTML from blind edits.
import fs from 'node:fs/promises';
const html=await fs.readFile('russian_lesson_1_COMPLETE.html','utf8');
const checks={
  bytes:Buffer.byteLength(html),
  hasChineseLanguage:/lang=["']zh/i.test(html),
  hasRussianWords:/[А-Яа-яЁё]{2,}/.test(html),
  mp3DataUrls:(html.match(/data:audio\/(?:mpeg|mp3);base64,/gi)||[]).length,
  embeddedMpeg:(html.match(/audio\/mpeg/gi)||[]).length,
  audioElements:(html.match(/<audio\b/gi)||[]).length,
  letterCards:(html.match(/class=["'][^"']*(?:letter-card|alphabet-card)[^"']*["']/gi)||[]).length,
  hasMicCheck:/\bwebkitSpeechRecognition\b|\bSpeechRecognition\b/.test(html),
  hasExternalTrainer:html.includes('pronunciation-check.js'),
  words:[
    ['ёлка',html.toLowerCase().includes('ёлка')],
    ['халат',html.toLowerCase().includes('халат')],
    ['юг',html.toLowerCase().includes('юг')],
    ['язык',html.toLowerCase().includes('язык')],
    ['мама',html.toLowerCase().includes('мама')]
  ]
};
console.log(JSON.stringify(checks,null,2));
if(checks.bytes<2000000 || !checks.hasChineseLanguage || !checks.hasRussianWords)process.exitCode=1;
