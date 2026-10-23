from pathlib import Path
from threading import Thread
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from playwright.sync_api import sync_playwright

server=ThreadingHTTPServer(("127.0.0.1",8873),SimpleHTTPRequestHandler)
Thread(target=server.serve_forever,daemon=True).start()
Path("screenshots").mkdir(exist_ok=True)
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,args=["--no-sandbox"])
    for label,w,h in (("android",390,844),("desktop",1360,900)):
        page=browser.new_page(viewport={"width":w,"height":h})
        errors=[]
        page.on("pageerror",lambda err:errors.append(str(err)))
        resp=page.goto("http://127.0.0.1:8873/lesson-3-pronouns-basic.html",wait_until="domcontentloaded",timeout=30000)
        assert resp.status==200
        banner=page.locator(".l3-approved-full-banner img")
        banner.wait_for(timeout=12000)
        assert banner.evaluate("e => e.complete && e.naturalWidth===1400 && e.naturalHeight===788"),"banner mismatch / image broken"
        assert "lesson3-bubbles-approved.avif" in banner.get_attribute("src")
        cards=page.locator("#pronoun-cards > .card")
        cards.first.wait_for(timeout=12000)
        assert cards.count()==8
        assert [cards.nth(i).get_attribute("data-say") for i in range(8)]==["Я","Ты","Он","Она","Оно","Мы","Вы","Они"]
        assert all(cards.nth(i).is_visible() for i in range(8))
        assert all(cards.nth(i).locator(".card-audio").count()==1 for i in range(8))
        assert page.locator("#quiz-section").count()==1
        assert not errors,errors
        assert page.evaluate("document.documentElement.scrollWidth<=innerWidth+8"),"horizontal overflow"
        page.screenshot(path=f"screenshots/lesson3-approved-bubbles-{label}.png",animations="disabled")
        print("PASS",label,"approved full-size graphic, eight sequential pronouns, audio, quiz, no JS errors",flush=True)
        page.close()
    browser.close()
server.shutdown()
