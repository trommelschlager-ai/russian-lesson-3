"""Final independent QA for all 100 vocabulary cards + the accepted 'Еда' design."""
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from threading import Thread
from pathlib import Path
import json
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[1]
data=json.loads((ROOT/'assets/lesson2-words.json').read_text('utf8'))
assert len(data)==100
for i,w in enumerate(data):
    assert (ROOT/w['imageData']).is_file(),f"missing image {i+1}: {w['imageData']}"
    assert (ROOT/w['url']).is_file(),f"missing MP3 {i+1}: {w['url']}"
print("PASS: all 100 entries have matching local images and MP3 files",flush=True)
server=ThreadingHTTPServer(("127.0.0.1",8089),SimpleHTTPRequestHandler)
Thread(target=server.serve_forever,daemon=True).start()
Path("test-screenshots").mkdir(exist_ok=True)
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,args=['--no-sandbox'])
    for label,w,h in [('android',390,844),('tablet',768,1024),('desktop',1440,900)]:
        page=browser.new_page(viewport={'width':w,'height':h},is_mobile=(label=='android'),has_touch=(label=='android'))
        page.add_init_script('HTMLMediaElement.prototype.play = function(){return Promise.resolve();}')
        errors=[]
        page.on("pageerror",lambda e:errors.append(str(e)))
        response=page.goto("http://127.0.0.1:8089/russian_lesson_2_reading.html",wait_until="domcontentloaded",timeout=40000)
        assert response.status==200
        cards=page.locator("#word-list>.word-card")
        page.locator("#l2-next").wait_for(timeout=25000)
        assert cards.count()==100,cards.count()
        assert page.locator("#word-list>.word-card.l2-current").count()==1
        assert page.locator(".l2-index-list button").count()==100
        assert page.locator("#l2-page").inner_text().strip()=="1 / 100"
        assert cards.first.locator("[data-role=word]").inner_text().replace("\u0301","").upper().startswith('ЕДА')
        first=cards.first
        assert first.locator('[data-role=photo]').evaluate('e => e.complete && e.naturalWidth>250'),"Food hero is not sharp"
        assert first.locator(".l2-example").count()==1
        assert first.locator(".actions .action").count()==3
        assert page.locator("header.banner").count()==1
        if w<=750:
            assert page.locator(".l2-hero-copy").is_hidden()
            assert page.locator(".l2-mobile-title").is_visible()
            hbox=page.locator("header.banner").bounding_box()
            title=page.locator(".l2-mobile-title").bounding_box()
            assert title["y"]+title["height"] <= hbox["y"]+hbox["height"]+5,("mobile overlap",title,hbox)
            assert page.locator(".l2-mobile-title h1").inner_text()=="100个简单俄语单词"
        else:
            assert "lesson2-approved-hero" in page.locator("header.banner").evaluate("e=>getComputedStyle(e).backgroundImage")
        assert page.evaluate("document.documentElement.scrollWidth <= innerWidth + 10"),("overflow",label)
        page.screenshot(path=f"test-screenshots/l2-initial-{label}.png",animations="disabled")
        for index in [1,49,99,50,0]:
            page.locator(".l2-index summary").click() if not page.locator(".l2-index").get_attribute('open') else None
            page.locator(".l2-index-list button").nth(index).click()
            assert page.locator("#l2-page").inner_text()==f"{index+1} / 100"
            active=page.locator("#word-list>.word-card.l2-current")
            assert active.count()==1
            assert active.get_attribute('data-index')==str(index)
            assert active.locator('[data-role=photo]').evaluate('e => e.complete && e.naturalWidth>0'),('image did not load',index)
            assert active.locator(".actions .action").count()==3
            assert active.locator(".learning .portrait").count()==1
        page.locator(".word-card.l2-current [data-role=play]").click()
        assert page.locator("#audio").get_attribute("src")==data[0]['url']
        page.locator(".word-card.l2-current [data-role=slow]").click()
        assert page.locator("#audio").evaluate("a=>a.playbackRate")==.7
        assert not errors,errors
        print("PASS",label,"100 entries; mobile/desktop hero; gold cards; nav; photos; all audio buttons; no browser errors",flush=True)
        page.close()
    browser.close()
server.shutdown()
