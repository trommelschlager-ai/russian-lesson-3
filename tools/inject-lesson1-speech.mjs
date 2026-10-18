// Idempotent minimal addition to the large lesson-1 HTML.
// All existing artwork, text, and MP3 stay byte-identical.
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const target='russian_lesson_1_COMPLETE.html';
const original=await fs.readFile(target,'utf8');
const marker='<!-- optional-speech-practice-lesson1 -->';
if(original.includes(marker)){
  console.log('Lesson 1 speech practice already included; unchanged.');
  process.exit(0);
}
const match=/<\/body\s*>/i.exec(original);
assert.ok(match,'Missing closing body tag in lesson 1');
assert.ok(original.includes('speak('),'Original lesson 1 speech/player code missing');
const snippet='\n'+marker+'\n'+
  '<script defer src="assets/pronunciation-lesson1-data.js"></script>\n'+
  '<script defer src="assets/pronunciation-check.js"></script>\n';
const updated=original.slice(0,match.index)+snippet+original.slice(match.index);
assert.ok(updated.replace(snippet,'')===original,'Any unexpected modification to original page');
assert.equal((updated.match(/optional-speech-practice-lesson1/g)||[]).length,1);
await fs.writeFile(target,updated);
console.log('ADDED lesson 1 pronunciation button: original bytes '+Buffer.byteLength(original)+
' added bytes '+Buffer.byteLength(snippet));
