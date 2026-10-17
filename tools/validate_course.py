"""Validate deployable static course paths, scripts, images and recorded media."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit,unquote
import json,re,subprocess,tempfile,base64,concurrent.futures,shutil,sys
ROOT=Path(__file__).resolve().parents[1]
PAGES=['index.html','russian_lesson_1_COMPLETE.html','russian_lesson_2_reading.html','lesson-3-pronouns-basic.html','lesson-4-presentation-READY.html','lesson-5.html','lesson-6.html','lesson-7.html','audio-check.html','russian_lesson_1_alphabet.html','lesson-2-reading.html','lesson-3-online-voice-test.html','lesson-4.html']
errors=[];script_count=0;image_count=0;link_count=0
class Inspector(HTMLParser):
    def __init__(self,path):
        super().__init__(convert_charrefs=True);self.path=path;self.refs=[];self.ids=set();self.script=False;self.code=[];self.scripts=[]
    def handle_starttag(self,tag,attrs):
        a=dict(attrs)
        if a.get('id'):self.ids.add(a['id'])
        for key in ['href','src']:
            if a.get(key):self.refs.append((tag,key,a[key]))
        if tag=='script':self.script=True;self.code=[]
        if tag=='iframe' and a.get('srcdoc'):inspect(self.path,a['srcdoc'],embedded=True)
    def handle_data(self,data):
        if self.script:self.code.append(data)
    def handle_endtag(self,tag):
        if tag=='script':
            self.scripts.append(''.join(self.code));self.script=False

def inspect(path,text,embedded=False):
    global image_count,link_count,script_count
    parser=Inspector(path);parser.feed(text)
    for tag,key,ref in parser.refs:
        if ref.startswith('data:'):
            if tag=='img':
                image_count+=1
                try:base64.b64decode(ref.split(',',1)[1],validate=True)
                except Exception:errors.append(f'{path.name}: invalid inline image')
            continue
        parsed=urlsplit(ref)
        if parsed.scheme or parsed.netloc:continue
        target=(path.parent/unquote(parsed.path)).resolve() if parsed.path else path
        if not target.is_file():errors.append(f'{path.name}: missing {ref}')
        elif parsed.fragment:
            target_ids=parser.ids if target==path else set(re.findall(r'\bid=["\']([^"\']+)',target.read_text()))
            if parsed.fragment not in target_ids:errors.append(f'{path.name}: missing anchor {ref}')
        if tag=='img':image_count+=1
        if key=='href':link_count+=1
    for code in parser.scripts:
        if not code.strip():continue
        script_count+=1
        with tempfile.NamedTemporaryFile(suffix='.js',mode='w') as tmp:
            tmp.write(code);tmp.flush();r=subprocess.run(['node','--check',tmp.name],capture_output=True,text=True)
            if r.returncode:errors.append(f'{path.name}: JS syntax error: '+r.stderr[-300:])
for page in PAGES:
    p=ROOT/page
    if not p.is_file():errors.append('Missing page '+page);continue
    inspect(p,p.read_text())
for p in (ROOT/'assets').glob('*.css'):
    for url in re.findall(r'url\(["\']?([^\)"\']+)',p.read_text()):
        if not url.startswith(('data:','http:','https:')) and not(p.parent/url).is_file():errors.append(f'{p.name}: missing CSS asset {url}')
manifest_text=(ROOT/'assets/audio-manifest.js').read_text();manifest=json.loads(manifest_text.split('=',1)[1].strip().rstrip(';'))
for key,rel in manifest.items():
    if not(ROOT/rel).is_file():errors.append('Missing recording '+key+' '+rel)
for page in PAGES[2:8]:
    parser=Inspector(ROOT/page);parser.feed((ROOT/page).read_text())
    # Match actual button roles below, without requiring DOM execution.
    for m in re.finditer(r'<[^>]+\bdata-say="([^"]+)"[^>]*>',(ROOT/page).read_text()):
        from html import unescape
        text=unescape(m[1]);role=re.search(r'\bdata-role="([^"]+)"',m[0]);role=role[1] if role else 'male'
        if page=='lesson-3-pronouns-basic.html':
            if 'male|'+text not in manifest and 'female|'+text not in manifest:errors.append(page+': missing '+text)
        elif role+'|'+text not in manifest:errors.append(page+': missing '+role+'|'+text)
media_paths=sorted({ROOT/v for v in manifest.values()})
media_errors=[]
if '--media' in sys.argv:
    if not shutil.which('ffmpeg'):errors.append('ffmpeg is required for --media')
    else:
        def decode(p):
            r=subprocess.run(['ffmpeg','-v','error','-i',str(p),'-f','null','-'],capture_output=True,text=True)
            return None if r.returncode==0 and not r.stderr.strip() else f'{p.relative_to(ROOT)}: {r.stderr[:160]}'
        with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
            media_errors=[r for r in pool.map(decode,media_paths) if r]
        errors.extend(media_errors)
result={'pages':len(PAGES),'links':link_count,'images':image_count,'inline_scripts':script_count,'audio_entries':len(manifest),'unique_recordings':len(media_paths),'media_decoded':'--media' in sys.argv,'errors':errors}
print(json.dumps(result,ensure_ascii=False,indent=2))
if errors:raise SystemExit(1)
