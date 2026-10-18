// Checks physical audio files, durations and mapping of all visible words in lessons 2-7.
// This does NOT judge voice quality or commercial rights to the recordings.
import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const ffprobe = promisify(execFile);
const files=[
'russian_lesson_2_reading.html','lesson-3-pronouns-basic.html',
'lesson-4-presentation-READY.html','lesson-5.html','lesson-6.html','lesson-7.html'
];
const pathExists=async file=>{try{await fs.access(file);return true;}catch{return false;}};
const root=process.cwd(), notMapped=[], checked=[], paths=new Set();
for(const filename of files){
  const html=await fs.readFile(filename,'utf8');
  const srcs=[...html.matchAll(/<script[^>]*\bsrc=["']([^"']+)["']/gi)].map(x=>x[1]).filter(x=>/audio.*\.js$/.test(x));
  const ctx={window:{}};
  for(const src of srcs){
    const p=path.resolve(root,src);
    if(!(await pathExists(p))){notMapped.push({lesson:filename,script:src});continue;}
    vm.runInNewContext(await fs.readFile(p,'utf8'),ctx,{filename:src});
  }
  const manifest=ctx.window.COURSE_AUDIO||{};
  const matches=[...html.matchAll(/<[^>]*\bdata-say="([^"]+)"[^>]*>/g)];
  const missing=[];
  for(const m of matches){
    const item=m[0], text=m[1];
    let role=(item.match(/\bdata-role="([^"]+)"/)||[])[1]||'male';
    // Lesson 3 denotes speakers A/B on parent dialogue lines, not by data-role.
    if(filename==='lesson-3-pronouns-basic.html'){
      const start=html.lastIndexOf('<div class="say"',m.index);
      if(start>=0){
        const tag=html.slice(start,html.indexOf('>',start)+1);
        if(tag.includes('data-say="'+text+'"')){
          const lead=html.slice(html.indexOf('>',start)+1,html.indexOf('>',start)+150);
          if(/class="speaker">Б<\/span>/.test(lead))role='female';
        }
      }
    }
    const key=role+'|'+text;
    if(!manifest[key]) missing.push(key);
    else paths.add(manifest[key]);
  }
  checked.push({lesson:filename,items:matches.length,missing:missing.length});
  for(const key of new Set(missing))notMapped.push({lesson:filename,missing:key});
}
const allMaps={window:{}};
for(const src of ['assets/audio-manifest.js','assets/course-extensions-audio.js','assets/lesson2-audio-overrides-v2.js','assets/lesson7-dialogue-audio.js']){
  vm.runInNewContext(await fs.readFile(src,'utf8'),allMaps,{filename:src});
}
for(const file of Object.values(allMaps.window.COURSE_AUDIO||{}))paths.add(file);
const pathsToCheck=[...paths];
const errors=[];
let good=0, next=0;
async function worker(){
  while(next<pathsToCheck.length){
    const file=pathsToCheck[next++];
    const abs=path.resolve(root,file);
    if(!abs.startsWith(root+path.sep)||!(await pathExists(abs))){errors.push({file,error:'not found'});continue;}
    try{
      const {stdout}=await ffprobe('ffprobe',['-v','error','-show_entries','format=duration','-of','default=noprint_wrappers=1:nokey=1',abs],{timeout:15000});
      const duration=Number(stdout.trim());
      if(!Number.isFinite(duration)||duration<=0)errors.push({file,error:'invalid duration'});
      else good++;
    }catch(e){errors.push({file,error:String(e.message).slice(0,140)});}
  }
}
await Promise.all(Array.from({length:8},worker));
const report={checked,expectedAudioFiles:pathsToCheck.length,readableAudioFiles:good,errors:errors.slice(0,30),errorCount:errors.length,mappingIssues:notMapped.slice(0,30),mappingIssueCount:notMapped.length,note:'Only lessons 2-7 manifest entries; lesson 1 embedded audio is covered by prior audit and requires listening.'};
console.log(JSON.stringify(report,null,2));
if(errors.length||notMapped.length)process.exitCode=1;
