from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Thread
from playwright.sync_api import sync_playwright

server=ThreadingHTTPServer(("127.0.0.1",8897),SimpleHTTPRequestHandler)
Thread(target=server.serve_forever,daemon=True).start()
Path("qa-lesson3").mkdir(exist_ok=True)
with sync_playwright() as pw:
  browser=pw.chromium.launch(headless=True,args=["--no-sandbox"])
  for label,width,height in (("android",390,844),("desktop",1360,900)):
    page=browser.new_page(viewport={"width":width,"height":height})
    errors=[]
    page.on("pageerror",lambda error:errors.append(str(error)))
    response=page.goto("http://127.0.0.1:8897/lesson-3-pronouns-basic.html",wait_until="domcontentloaded",timeout=30000)
    assert response.status==200,response.status
    page.locator("#pronoun-cards>.card").first.wait_for(timeout=30000)
    page.locator("#pronoun-cards>.card .rl3-panel").first.wait_for(timeout=30000)
    cards=page.locator("#pronoun-cards>.card")
    assert cards.count()==8, cards.count()
    assert page.locator("#l3-approved-tabs").count()==0,"Unwanted extra selector tiles"
    assert page.locator(".l3-approved-full-banner").count()==1,"Missing banner"
    img=page.locator(".l3-approved-full-banner img")
    assert img.evaluate("img => img.complete && img.naturalWidth>=1200"),"Missing full-res banner"
    assert page.locator(".hero").count()==0,"Old duplicate headline/hero is still present"
    assert page.locator("#quiz-section").count()==1
    assert [cards.nth(i).get_attribute("data-say") for i in range(8)]==["Я","Ты","Он","Она","Оно","Мы","Вы","Они"]
    assert all(cards.nth(i).is_visible() for i in range(8))
    for i in range(8):
      assert cards.nth(i).locator(".card-audio").count()==1
      assert cards.nth(i).locator(".rl3-panel").count()>=1
    boxes=cards.evaluate_all("""els=>els.map(el=>{const r=el.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height}})""")
    assert all(abs(z["x"]-boxes[0]["x"])<4 for z in boxes),boxes
    assert all(z["y"]>=boxes[i-1]["y"]+boxes[i-1]["h"]-5 for i,z in enumerate(boxes) if i>0),boxes
    assert all(z["w"]>=min(width-60,1200) for z in boxes),boxes
    assert page.evaluate("document.documentElement.scrollWidth<=window.innerWidth+8"),"Horizontal overflow"
    assert not errors,errors
    page.screenshot(path=f"qa-lesson3/lesson3-{label}-header.png",animations="disabled")
    cards.nth(7).scroll_into_view_if_needed()
    page.screenshot(path=f"qa-lesson3/lesson3-{label}-last-card.png",animations="disabled")
    print("PASS",label,"high-res approved header, original 8 full-width rows, correct order, audio + exercise controls, quiz; no errors",flush=True)
    page.close()
  browser.close()
server.shutdown()
