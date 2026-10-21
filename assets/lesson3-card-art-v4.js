
/* Study scenery taken from the user's approved photo. Original eight character pictures stay intact. */
(() => {
 'use strict';
 if(window.__lesson3ReferenceSceneLoaded) return;
 window.__lesson3ReferenceSceneLoaded=true;
 const css=document.createElement('style');
 css.textContent="\n#pronoun-cards.pronouns>.card.rl3-has-panel{\n display:grid!important;\n grid-template-columns:minmax(0,1.08fr) minmax(0,.92fr)!important;\n grid-template-rows:auto auto auto!important;\n align-items:stretch!important;align-content:start!important;\n overflow:hidden;\n}\n#pronoun-cards.pronouns>.card.rl3-has-panel>.card-copy{\n grid-column:1!important;grid-row:1!important;align-self:stretch!important;\n position:relative;z-index:2;padding:20px 14px 15px!important;min-width:0;\n}\n#pronoun-cards .card.rl3-has-panel>.card-copy>.ru{font-size:clamp(31px,4vw,42px);line-height:1.1;margin-right:38px}\n#pronoun-cards .card.rl3-has-panel>.card-copy>.lat{font-size:18px}\n#pronoun-cards .card.rl3-has-panel>.card-copy>.zh{font-size:23px}\n#pronoun-cards .card.rl3-has-panel>.card-copy>.example{\n display:grid!important;grid-template-columns:minmax(0,1fr);\n margin-top:18px!important;padding-top:13px!important;\n font-size:17px;line-height:1.45;gap:6px\n}\n#pronoun-cards .card.rl3-has-panel .card-copy .example-ru{\n display:flex!important;gap:5px;align-items:center;justify-content:space-between;line-height:1.42;font-size:17px\n}\n#pronoun-cards .card.rl3-has-panel .card-copy .example-ru>span{min-width:0}\n#pronoun-cards .card.rl3-has-panel .card-copy .example-ru strong{font-size:18px;line-height:1.42}\n#pronoun-cards .card.rl3-has-panel .card-copy .example-lat,\n#pronoun-cards .card.rl3-has-panel .card-copy .example-zh{font-size:16px;line-height:1.42}\n#pronoun-cards .card.rl3-has-panel .card-copy .example-audio{\n position:relative!important;top:4px!important;float:none;flex:0 0 32px;\n width:32px!important;height:32px!important;font-size:17px!important\n}\n#pronoun-cards.pronouns>.card.rl3-has-panel>.card-art{\n display:block!important;position:relative!important;\n grid-column:2!important;grid-row:1!important;\n align-self:stretch!important;justify-self:stretch!important;\n width:100%!important;height:100%!important;\n min-height:255px!important;max-height:none!important;\n aspect-ratio:auto!important;overflow:hidden;\n background:#f5eaff!important;border:0!important;padding:0!important;isolation:isolate\n}\n#pronoun-cards.pronouns>.card.rl3-has-panel>.card-art>.l3-real-bg,\n#pronoun-cards.pronouns>.card.rl3-has-panel>.card-art>.l3-real-front{\n position:absolute;top:0;left:0;width:100%;height:100%;\n display:block;object-fit:fill;min-height:0!important;max-width:none;pointer-events:none\n}\n#pronoun-cards.pronouns>.card.rl3-has-panel>.card-art>.l3-real-bg{z-index:0}\n#pronoun-cards.pronouns>.card.rl3-has-panel>.card-art>.l3-real-front{z-index:3}\n#pronoun-cards.pronouns>.card.rl3-has-panel>.card-art>.l3-original-person{\n display:block!important;position:absolute!important;z-index:2!important;\n top:10%!important;left:-22%!important;right:auto!important;bottom:auto!important;\n width:148%!important;height:auto!important;max-height:none!important;\n min-height:0!important;padding:0!important;\n object-fit:contain!important;object-position:center center!important;\n margin:0!important;filter:none!important;transform:none!important;\n -webkit-mask-image:linear-gradient(to bottom,#000 0%,#000 65%,transparent 100%)!important;\n mask-image:linear-gradient(to bottom,#000 0%,#000 65%,transparent 100%)!important;\n}\n#pronoun-cards.pronouns>.card.rl3-has-panel>.rl3-panel{\n grid-column:1/-1!important;grid-row:2!important;align-self:start;z-index:4\n}\n#pronoun-cards.pronouns>.card.rl3-has-panel>.rl3-example-holder{\n grid-column:1/-1!important;grid-row:3!important;align-self:start;z-index:4\n}\n@media(max-width:620px){\n #pronoun-cards.pronouns>.card.rl3-has-panel{\n   grid-template-columns:minmax(0,1.04fr) minmax(0,.96fr)!important;\n   grid-template-rows:auto auto auto!important\n }\n #pronoun-cards.pronouns>.card.rl3-has-panel>.card-copy{padding:14px 10px 11px!important}\n #pronoun-cards.pronouns>.card.rl3-has-panel>.card-copy>.ru{font-size:30px}\n #pronoun-cards.pronouns>.card.rl3-has-panel>.card-copy>.lat{font-size:17px}\n #pronoun-cards.pronouns>.card.rl3-has-panel>.card-copy>.zh{font-size:21px}\n #pronoun-cards .card.rl3-has-panel>.card-copy>.example{margin-top:13px!important;padding-top:10px!important;gap:5px}\n #pronoun-cards .card.rl3-has-panel .card-copy .example-ru{font-size:17px}\n #pronoun-cards .card.rl3-has-panel .card-copy .example-ru strong{font-size:17px}\n #pronoun-cards .card.rl3-has-panel .card-copy .example-lat,\n #pronoun-cards .card.rl3-has-panel .card-copy .example-zh{font-size:15px}\n #pronoun-cards .card.rl3-has-panel .card-copy .example-audio{\n  flex:0 0 29px;width:29px!important;height:29px!important;font-size:15px!important\n }\n #pronoun-cards.pronouns>.card.rl3-has-panel>.card-art{\n   min-height:245px!important;height:100%!important;aspect-ratio:auto!important\n }\n #pronoun-cards.pronouns>.card.rl3-has-panel>.card-art>.l3-original-person{\n   width:150%!important;left:-24%!important;top:12%!important\n }\n}\n";
 document.head.append(css);
 const root='assets/lesson3-reference/';
 function restoreExample(card){
   const left=card.querySelector('.card-copy');
   const example=card.querySelector('.example');
   if(left&&example&&example.parentNode!==left) left.appendChild(example);
   if(example)example.classList.remove('rl3-wide-example');
 }
 /* Remove ONLY flat corner background colors from the original low-resolution
    illustration. RGB values of the actual face, hair, hands and clothes stay unchanged. */
 function liftOriginalSubject(img){
   if(img.dataset.originalLifted) return;
   img.dataset.originalLifted='yes';
   const input=new Image();
   input.onload=()=>{
     try {
       const w=input.naturalWidth,h=input.naturalHeight;
       if(!w||!h||w>1200||h>1200) return;
       const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;
       const ctx=canvas.getContext('2d',{willReadFrequently:true});
       if(!ctx) return;
       ctx.drawImage(input,0,0);
       const shot=ctx.getImageData(0,0,w,h),p=shot.data;
       function pixel(x,y){const i=(y*w+x)*4;return [p[i],p[i+1],p[i+2]]}
       const corners=[[2,2],[w-3,2],[2,h-3],[w-3,h-3]].map(([x,y])=>pixel(x,y));
       function similar(i){
         let best=Infinity;
         for(const color of corners){
           const r=p[i]-color[0],g=p[i+1]-color[1],b=p[i+2]-color[2];
           best=Math.min(best,r*r+g*g+b*b)
         }
         return best;
       }
       const seen=new Uint8Array(w*h),q=new Int32Array(w*h);
       let start=0,end=0;
       function touch(k){
         if(k<0||k>=w*h||seen[k])return;
         const d=similar(k*4);
         if(d<1250){seen[k]=1;q[end++]=k}
       }
       for(let x=0;x<w;x++){touch(x);touch((h-1)*w+x)}
       for(let y=0;y<h;y++){touch(y*w);touch(y*w+w-1)}
       while(start<end){
         const k=q[start++],x=k%w,y=(k/w)|0;
         if(x>0)touch(k-1);if(x<w-1)touch(k+1);
         if(y>0)touch(k-w);if(y<h-1)touch(k+w);
       }
       for(let k=0;k<w*h;k++){
         if(seen[k]){p[k*4+3]=0;continue}
         // Smooth only immediate boundaries while preserving all facial pixels.
         let adjacent=false;
         const x=k%w,y=(k/w)|0;
         if(x>0&&seen[k-1])adjacent=true;
         if(x<w-1&&seen[k+1])adjacent=true;
         if(y>0&&seen[k-w])adjacent=true;
         if(y<h-1&&seen[k+w])adjacent=true;
         if(adjacent){const d=Math.sqrt(similar(k*4));p[k*4+3]=Math.round(Math.max(0,Math.min(255,(d-18)/42*255)));}
       }
       ctx.putImageData(shot,0,0);
       img.src=canvas.toDataURL('image/png');
     } catch(e) { /* Existing portrait remains visible if processing is unsupported. */ }
   };
   input.src=img.src;
 }
 function setup(){
   const cards=document.querySelectorAll('#pronoun-cards>.card[data-say]');
   cards.forEach((card,index)=>{
     restoreExample(card);
     const art=card.querySelector('.card-art');
     const original=art&&art.querySelector(':scope > img:not(.l3-real-bg):not(.l3-real-front)');
     if(!art||!original)return;
     art.querySelectorAll('.l3-study-back,.l3-study-front').forEach(n=>n.remove());
     original.classList.add('l3-original-person');
     const backdrop=document.createElement('img');
     backdrop.src=root+'approved-study-bg.webp?v=2';backdrop.alt='';
     backdrop.setAttribute('aria-hidden','true');backdrop.className='l3-real-bg';
     const foreground=document.createElement('img');
     foreground.src=root+'approved-study-books.webp?v=2';foreground.alt='';
     foreground.setAttribute('aria-hidden','true');foreground.className='l3-real-front';
     art.insertBefore(backdrop,original);
     art.appendChild(foreground);
     if(card.dataset.say!=='Оно')liftOriginalSubject(original);
   });
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup,{once:true});
 else setup();
})();