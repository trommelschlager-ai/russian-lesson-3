"""Desktop+mobile browser smoke tests of the approved lesson 2/3 visual refresh."""
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from threading import Thread
from playwright.sync_api import sync_playwright
from pathlib import Path

server=ThreadingHTTPServer(("127.0.0.1", 8765),SimpleHTTPRequestHandler)
Thread(target=server.serve_forever,daemon=True).start()
root=Path("screenshots")
root.mkdir(exist_ok=True)
with sync_playwright() as playwright:
    browser=playwright.chromium.launch(headless=True,args=["--no-sandbox"])
    for label,width,height in [("desktop",1360,900),("mobile",390,844)]:
        page=browser.new_page(viewport={"width":width,"height":height},is_mobile=label=="mobile",has_touch=label=="mobile")
        errors=[]
        page.on("pageerror",lambda e: errors.append(str(e)))
        a=page.goto("http://127.0.0.1:8765/russian_lesson_2_reading.html",wait_until="domcontentloaded",timeout=30000)
        page.locator("#word-list>.word-card").first.wait_for(timeout=30000)
        assert page.locator("#word-list>.word-card").count()==100,"Lesson 2 lost its 100 words"
        assert page.locator("#word-list>.word-card [data-role='play']").count()==100
        assert page.locator("#word-list>.word-card [data-role='slow']").count()==100
        assert page.locator("#word-list>.word-card [data-role='record']").count()==100
        assert "lesson2-approved-20261023.css" in page.content()
        assert page.locator(".banner .l2-hero-copy").count()==1
        page.screenshot(path=str(root/("lesson2-"+label+".png")),full_page=False,animations="disabled")
        if errors: raise RuntimeError("Lesson2 errors: "+repr(errors))
        errors.clear()
        b=page.goto("http://127.0.0.1:8765/lesson-3-pronouns-basic.html",wait_until="domcontentloaded",timeout=30000)
        page.locator("#l3-approved-tabs>.l3-approved-tab").first.wait_for(timeout=30000)
        assert page.locator("#pronoun-cards>.card").count()==8
        assert page.locator("#l3-approved-tabs>.l3-approved-tab").count()==8
        assert page.locator("#pronoun-cards .card-audio").count()>=8
        assert page.locator("#quiz-section").count()==1
        assert page.locator(".hero-art>img").get_attribute("src")=="assets/illustrated/lesson-4-hero.jpg"
        page.screenshot(path=str(root/("lesson3-"+label+".png")),full_page=False,animations="disabled")
        page.locator("#l3-approved-tabs>.l3-approved-tab").nth(3).click()
        assert page.locator("#l3-approved-tabs>.l3-approved-tab").nth(3).get_attribute("aria-current")=="true"
        if errors: raise RuntimeError("Lesson3 errors: "+repr(errors))
        print("OK",label,"L2 100 cards, 3x100 controls; L3 8 pronouns and working navigation",flush=True)
        page.close()
    browser.close()
server.shutdown()
