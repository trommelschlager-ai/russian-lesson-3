from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from threading import Thread
from pathlib import Path
from playwright.sync_api import sync_playwright

Path("test-screenshots").mkdir(exist_ok=True)
server=ThreadingHTTPServer(("127.0.0.1",8125),SimpleHTTPRequestHandler)
Thread(target=server.serve_forever,daemon=True).start()
fake_speech="""(() => {
  class FakeRecognition {
    constructor(){this.lang='';this.continuous=false;this.interimResults=false;}
    start(){window.__qaRecognizer=this; if(this.onstart)this.onstart();}
    abort(){if(this.onend)this.onend();}
  }
  window.SpeechRecognition=FakeRecognition;
  window.webkitSpeechRecognition=FakeRecognition;
})();"""
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,args=["--no-sandbox"])
    for label,width,height in (("android",390,844),("desktop",1360,900)):
        page=browser.new_page(viewport={"width":width,"height":height})
        page.add_init_script(fake_speech)
        errors=[]
        page.on("pageerror",lambda err:errors.append(str(err)))
        response=page.goto("http://127.0.0.1:8125/lesson-5.html",wait_until="domcontentloaded",timeout=30000)
        assert response.status==200
        first=page.locator("#vocabulary.numbers>.vocab-card")
        first.first.locator(".rl5-panel").wait_for(timeout=30000)
        assert first.count()==5,"Lost numbers 1–5"
        assert page.locator("#extra-vocab-5 .l5-number-card").count()==5
        assert page.locator(".l5-counting-grid .l5-number-card").count()==90
        for n in range(5):
            assert first.nth(n).locator(".rl5-buttons button").count()==3
            assert first.nth(n).locator(".vocab-picture").count()==1
        # One full-width card per row, matching section 6–10.
        bounds=first.evaluate_all("""cards => cards.map(c => {
           const r=c.getBoundingClientRect();
           return {x:r.x,y:r.y,width:r.width,height:r.height};
        })""")
        assert all(abs(z["x"]-bounds[0]["x"])<=2 for z in bounds),bounds
        assert all(z["y"]>=bounds[i-1]["y"]+bounds[i-1]["height"]-2 for i,z in enumerate(bounds) if i>0),bounds
        assert all(z["width"]>=min(width-50, 700) for z in bounds),bounds
        # Russian STT can append a second word while recognizing the target.
        seven=page.locator("#extra-vocab-5 .l5-number-card").nth(1)
        bar=seven.locator(".rl5-panel")
        def recognize(heard):
            seven.locator(".rl5-repeat").click()
            page.evaluate("""value => window.__qaRecognizer.onresult({
               results: [[{transcript:value}]]
            })""",heard)
            return bar.locator(".rl5-feedback").get_attribute("data-state"),bar.locator(".rl5-feedback").inner_text()
        state,message=recognize("семь семью")
        assert state=="success" and "семь семью" in message,(state,message)
        state,message=recognize("семь")
        assert state=="success",(state,message)
        state,message=recognize("7")
        assert state=="success",(state,message)
        state,message=recognize("семью")
        assert state=="warning" and "不代表你读错" in message,(state,message)
        assert not errors,errors
        assert page.evaluate("document.documentElement.scrollWidth <= window.innerWidth + 6"),"Horizontal overflow"
        page.locator("#vocabulary").screenshot(path=f"test-screenshots/first5-{label}.png",animations="disabled")
        print("PASS:",label,"one card per row; 90 new numerals; 3 pronunciation controls, phrase/digits/ASR ambiguity, no JS errors",flush=True)
        page.close()
    browser.close()
server.shutdown()
