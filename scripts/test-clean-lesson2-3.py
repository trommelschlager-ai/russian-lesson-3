from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
from threading import Thread
from playwright.sync_api import sync_playwright

Path("screenshots").mkdir(exist_ok=True)
server=ThreadingHTTPServer(("127.0.0.1",8891),SimpleHTTPRequestHandler)
Thread(target=server.serve_forever,daemon=True).start()
with sync_playwright() as playwright:
    browser=playwright.chromium.launch(headless=True,args=["--no-sandbox"])
    for label,w,h in (("android",390,844),("desktop",1360,900)):
        page=browser.new_page(viewport={"width":w,"height":h},is_mobile=label=="android",has_touch=label=="android")
        errors=[]
        page.on("pageerror",lambda err:errors.append(str(err)))
        page.goto("http://127.0.0.1:8891/russian_lesson_2_reading.html",wait_until="domcontentloaded",timeout=35000)
        page.locator("#word-list .word-card.l2-current").first.wait_for(timeout=35000)
        assert page.locator("#word-list .word-card").count()==100
        assert page.locator("#word-list .word-card.l2-current").count()==1
        assert page.locator(".l2-index-list button").count()==100
        assert page.locator("#word-list .word-card.l2-current [data-role=play]").count()==1
        assert page.locator("#word-list .word-card.l2-current [data-role=record]").count()==1
        assert page.locator("#word-list .word-card.l2-current [data-role=slow]").count()==1
        assert page.evaluate('document.documentElement.scrollWidth <= window.innerWidth + 7')
        if label=="android":
            assert page.locator(".l2-hero-copy").is_hidden()
            assert page.locator(".l2-mobile-title").is_visible()
            r=page.locator(".l2-mobile-title").bounding_box()
            hbox=page.locator("header.banner").bounding_box()
            assert r["y"]>=hbox["y"] and r["y"]+r["height"]<=hbox["y"]+hbox["height"]+3,(r,hbox)
            assert hbox["height"]<=260,hbox
            assert page.locator(".l2-mobile-title h1").inner_text()=="100个简单俄语单词"
        else:
            assert page.locator(".l2-hero-copy").is_hidden()
            assert page.locator("header.banner").evaluate("el => getComputedStyle(el).backgroundImage.includes('lesson2-approved-hero.avif')")
        page.screenshot(path=f"screenshots/l2-{label}.png",animations="disabled")
        page.locator("#l2-next").click()
        assert page.locator("#l2-page").inner_text()=="2 / 100"
        assert not errors,errors
        print("PASS",label,"L2 100 words golden cards, no repeated hero title, functional navigation",flush=True)
        errors.clear()
        page.goto("http://127.0.0.1:8891/lesson-3-pronouns-basic.html",wait_until="domcontentloaded",timeout=35000)
        cards=page.locator("#pronoun-cards > .card")
        cards.first.wait_for(timeout=35000)
        page.locator("#l3-approved-tabs > button").first.wait_for(timeout=35000)
        assert cards.count()==8
        assert page.locator("#l3-approved-tabs > button").count()==8
        assert page.locator("#quiz-section").count()==1
        assert page.locator(".hero-art img").get_attribute("src")=="assets/approved-art/lesson3-approved-hero.avif"
        assert all(cards.nth(i).is_visible() for i in range(8)),"Some pronouns hidden"
        assert all(cards.nth(i).locator(".card-audio").count()==1 for i in range(8))
        cardpositions=cards.evaluate_all("els => els.map(e => { const r=e.getBoundingClientRect();return [r.y,r.height]; })")
        assert all(cardpositions[i][0]>=cardpositions[i-1][0]+cardpositions[i-1][1]-5 for i in range(1,8)),cardpositions
        assert page.evaluate('document.documentElement.scrollWidth <= window.innerWidth + 7')
        assert page.locator(".hero .subtitle").inner_text()=="Личные местоимения"
        assert "Приветствия" not in page.locator(".hero").inner_text()
        page.screenshot(path=f"screenshots/l3-{label}.png",animations="disabled")
        page.locator("#l3-approved-tabs > button").nth(7).click()
        assert page.locator("#l3-approved-tabs > button").nth(7).get_attribute("aria-current")=="true"
        assert cards.nth(7).is_visible()
        assert not errors,errors
        print("PASS",label,"L3 all 8 pronouns visible, hero correct, tabs navigate, quiz & sound intact",flush=True)
        page.close()
    browser.close()
server.shutdown()
