"""Download owner-approved full-size course illustration (do not upscale thumbnails)."""
from urllib.request import urlopen, Request
from urllib.parse import urlparse,parse_qsl,urlencode
from pathlib import Path
from PIL import Image
from io import BytesIO
import re
url="https://media.canva.com/v2/image-resize/format:PNG/height:112/quality:100/uri:ifs%3A%2F%2FM%2F7bbc9908-0d7e-4355-9365-3183ecf74b59/watermark:F/width:200?csig=AAAAAAAAAAAAAAAAAAAAACDJvT3lCXdRIUndf1mcDopXGL41C1nYlPQC9AaTX6FE&exp=1792739443&osig=AAAAAAAAAAAAAAAAAAAAAF21h4fZunm2jbxR72pnCia13-Us_jt-F5vy9LBQzKQB&signer=media-rpc&token=AAIAAU0AJDdiYmM5OTA4LTBkN2UtNDM1NS05MzY1LTMxODNlY2Y3NGI1OQAAAAABoWeZATir-s8JVxGkj8skYd_vI_mBZNpsQ-Unzz4KNHE4D2oCmg&x-canva-quality=thumbnail"
urlbig=url.replace('/height:112/','/height:941/').replace('/width:200','/width:1672')
parsed=urlparse(urlbig)
params=dict(parse_qsl(parsed.query))
cases=[
 ('large_signed',urlbig),
 ('large_no_csig',urlbig.replace('csig='+params.get('csig','')+'&','')),
 ('large_no_query',urlbig.split('?')[0]),
 ('source_thumbnail',url),
]
for label,u in cases:
 try:
  req=Request(u,headers={'User-Agent':'Mozilla/5.0'})
  with urlopen(req,timeout=22) as resp:
   raw=resp.read()
  image=Image.open(BytesIO(raw)).convert('RGB')
  print('RESULT',label,len(raw),image.size,flush=True)
  if image.width>=1400 and image.height>=780:
   f=Path('assets/approved-art/lesson3-bubbles-approved.webp')
   f.parent.mkdir(parents=True,exist_ok=True)
   image.save(f,format='WEBP',quality=90,method=6)
   print('SUCCESS',f, f.stat().st_size,flush=True)
   break
 except Exception as e:print('ERROR',label,str(e)[:180],flush=True)
else:raise RuntimeError('High-resolution asset is not exposed by signed Canva thumbnail URLs')
