// Lesson 2: verify every displayed word, stress mark, image and MP3 against source manifests.
// This cannot judge the naturalness of speech or hear incorrect stress; final listening is still required.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {existsSync} from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import vm from 'node:vm';
import {execFileSync} from 'node:child_process';

const words=JSON.parse(await fs.readFile('assets/lesson2-words.json','utf8'));
const recordings=JSON.parse(await fs.readFile('audio/alphabet-natural/manifest.json','utf8'));
const voiceMap={window:{}};
vm.runInNewContext(await fs.readFile('assets/audio-manifest.js','utf8'),voiceMap);
const mainAudio=new Map(Object.entries(voiceMap.window.COURSE_AUDIO||{}).map(([text,file])=>[file,text]));
const scopedRecordings=JSON.parse(await fs.readFile('audio/lesson2-corrections/manifest.json','utf8'));
const natural=new Map([...recordings,...scopedRecordings].map(x=>[x.file,x]));
const clean=s=>String(s).toLocaleLowerCase('ru').replace(/ё/g,'е').replace(/[^а-я]/g,'');
const root=path.resolve('.');
const checked=new Set(), seenImages=new Set(), errors=[];
let naturalCount=0, courseCount=0, durations=0;

function fail(word,detail){errors.push(word+': '+detail)}
async function fileCheck(file,word,kind){
 const resolved=path.resolve(root,file);
 if(!resolved.startsWith(root+path.sep))return fail(word,'unsafe '+kind+' path');
 let data;
 try{data=await fs.readFile(resolved)}catch{return fail(word,'missing '+kind+' '+file)}
 if(data.length<(kind==='audio'?3000:1000))fail(word,kind+' unusually small: '+data.length);
 if(kind==='audio'){
  const hash=crypto.createHash('sha256').update(data).digest('hex');
  if(checked.has(hash))fail(word,'duplicate MP3 audio payload');
  checked.add(hash);
  if(!((data[0]===0x49&&data[1]===0x44&&data[2]===0x33)||(data[0]===0xff&&(data[1]&0xe0)===0xe0)))fail(word,'invalid MP3 header');
  try{
   const seconds=Number(execFileSync('ffprobe',['-v','error','-show_entries','format=duration','-of','default=noprint_wrappers=1:nokey=1',resolved],{encoding:'utf8',timeout:5000}).trim());
   if(!Number.isFinite(seconds)||seconds<0.2||seconds>10)fail(word,'invalid audio duration '+seconds);
   else durations++;
  }catch(e){fail(word,'ffprobe failed: '+String(e.message).slice(0,110))}
 } else seenImages.add(file);
}
assert.equal(words.length,100,'There must be 100 words');
assert.equal(new Set(words.map(x=>x.word)).size,100,'Each word must be unique');
assert.equal(new Set(words.map(x=>x.url)).size,100,'Each MP3 must have a dedicated source');
assert.equal(new Set(words.map(x=>x.legacyIndex)).size,100,'Stable progress IDs must remain unique');
assert.ok(words.every((w,i)=>w.legacyIndex>=0&&w.legacyIndex<100&&w.group===Math.floor(i/10)+1),'Group / progress IDs must be valid');
assert.ok(words.every((w,i)=>i===0||w.word.length>=words[i-1].word.length),'Words must run shortest to longest');
for(const w of words){
 if(!w.word||!w.zh||!w.latin||!w.voiceLabel)fail(w.word,'missing visible text');
 if(!Array.isArray(w.parts)||w.parts.join('').toLocaleLowerCase('ru')!==w.word.toLocaleLowerCase('ru'))fail(w.word,'syllable text mismatch');
 if(!Number.isInteger(w.stress)||w.stress<0||w.stress>=w.parts.length)fail(w.word,'invalid stressed syllable');
 const entry=natural.get(w.url);
 if(entry){
  naturalCount++;
  if(clean(entry.spoken)!==clean(w.word)&&!(w.word==='Йогурт'&&entry.file==='audio/lesson2-corrections/yogurt-svetlana-yo-v2.mp3'&&entry.spoken==='Ёгурт.'))fail(w.word,'original recorded text mismatch: '+entry.spoken);
  if(clean(entry.display)!==clean(w.word))fail(w.word,'natural source label mismatch: '+entry.display);
  if(!w.voiceLabel.includes(entry.voice==='Svetlana'?'斯韦特兰娜':'德米特里'))fail(w.word,'wrong voice label');
 } else {
  courseCount++;
  const key=mainAudio.get(w.url);
  if(!key||clean(key.split('|').slice(1).join('|'))!==clean(w.word))fail(w.word,'no matching course voice manifest entry: '+String(key));
  if(key&&!key.startsWith('male|')&&!key.startsWith('female|'))fail(w.word,'unknown course speaker');
 }
 await fileCheck(w.url,w.word,'audio');
 await fileCheck(w.imageData,w.word,'image');
}
assert.equal(seenImages.size,100,'Every vocabulary item now needs its own local photograph');
console.log(JSON.stringify({wordCount:words.length,shortest:words[0].word,longest:words.at(-1).word,verifiedNaturalManifest:naturalCount,verifiedCourseManifest:courseCount,audioFilesWithReadableDuration:durations,uniquePhotoPaths:seenImages.size,identicalMP3s:words.length-checked.size,errors},null,2));
if(errors.length)process.exitCode=1;
