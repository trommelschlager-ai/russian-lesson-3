from pathlib import Path
from urllib.request import Request,urlopen
from urllib.error import HTTPError,URLError
from io import BytesIO
from PIL import Image
import os
urls=["https://media.canva.com/v2/image-resize/format:PNG/height:112/quality:100/uri:ifs%3A%2F%2FM%2Fad6b8513-dff8-43e7-955e-4324e6f041a3/watermark:F/width:200?csig=AAAAAAAAAAAAAAAAAAAAAC8kSszkYMbjRB29tk5l-8QG7WAQKbKMERHD4aXQgAf3&exp=1792731837&osig=AAAAAAAAAAAAAAAAAAAAAKvEhbq-clcGlcujIOWTXu9MRK6WUY29sARS_yfkP049&signer=media-rpc&token=AAIAAU0AJGFkNmI4NTEzLWRmZjgtNDNlNy05NTVlLTQzMjRlNmYwNDFhMwAAAAABoWck8ki68mYaLOiHm9Sh7S8MoomqEoU3j9KVHuDLnHaU1GcW3A&x-canva-quality=thumbnail",
"https://media.canva.com/v2/image-resize/format:PNG/height:112/quality:100/uri:ifs%3A%2F%2FM%2Fe6a4892f-ddc0-4699-988e-6555364e9310/watermark:F/width:200?csig=AAAAAAAAAAAAAAAAAAAAADPCSQnP2p4J9L9ii9I4f7V22R9jxykMgeAgdVn3iak5&exp=1792733010&osig=AAAAAAAAAAAAAAAAAAAAAI81EwnnTg6eZlH5QTkMit-b9ZOj-wmz8ANm8pqZPYhq&signer=media-rpc&token=AAIAAU0AJGU2YTQ4OTJmLWRkYzAtNDY5OS05ODhlLTY1NTUzNjRlOTMxMAAAAAABoWc22FA5CYp9OVysM_Lox8k1F0RBXYBqZhWXY2BLS4-2Qcq9Dg&x-canva-quality=thumbnail"]
out=Path("assets/approved-art")
out.mkdir(parents=True,exist_ok=True)
for idx,url in enumerate(urls,2):
  import re
  fullurl=re.sub(r'/height:\\d+','/height:941',url)
  fullurl=re.sub(r'/width:\\d+','/width:1672',fullurl)
  attempts=[('full_signed',fullurl),('full_unsigned',fullurl.split('?')[0]),('original',url)]
  for label,u in attempts:
    try:
      req=Request(u,headers={'User-Agent':'Mozilla/5.0'})
      with urlopen(req,timeout=18) as resp:
        raw=resp.read()
        im=Image.open(BytesIO(raw)).convert("RGB")
        print("RESULT",idx,label,len(raw),im.size,flush=True)
        if im.width>=1300:
          im.crop((0,0,1672,366 if idx==3 else 346)).save(out/f"lesson{idx}-approved-hero.webp",format="WEBP",quality=88,method=6)
          im.save(out/f"lesson{idx}-approved-full.webp",format="WEBP",quality=82,method=6)
          print("SAVED",idx,flush=True)
          break
    except Exception as err:print("ERROR",idx,label,str(err)[:200],flush=True)
