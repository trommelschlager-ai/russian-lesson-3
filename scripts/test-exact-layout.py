from threading import Thread
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from playwright.sync_api import sync_playwright
srv=ThreadingHTTPServer(('127.0.0.1',8123),SimpleHTTPRequestHandler);Thread(target=srv.serve_forever,daemon=True).start()
with sync_playwright() as p:
 b=p.chromium.launch(headless=True,args=['--no-sandbox'])
 for size in [(390,844),(1360,900)]:
  page=b.new_page(viewport=dict(width=size[0],height=size[1]))
  errs=[];page.on('pageerror',lambda e:errs.append(str(e)))
  page.goto('http://127.0.0.1:8123/russian_lesson_2_reading.html',wait_until='domcontentloaded')
  page.locator('.word-card.l2-current').wait_for(timeout=30000)
  assert page.locator('#word-list>.word-card').count()==100
  assert page.locator('#word-list>.word-card.l2-current').count()==1
  assert page.locator('.l2-index-list button').count()==100
  page.locator('#l2-next').click()
  assert page.locator('#l2-page').inner_text()=='2 / 100'
  assert page.locator('.l2-current [data-role=play]').count()==1
  print('L2 OK',size,'scrollwidth',page.evaluate('document.documentElement.scrollWidth'),flush=True)
  errs.clear()
  page.goto('http://127.0.0.1:8123/lesson-3-pronouns-basic.html',wait_until='domcontentloaded')
  page.locator('.rl3-active-card').wait_for(timeout=30000)
  assert page.locator('#pronoun-cards>.card').count()==8
  assert page.locator('#pronoun-cards>.card.rl3-active-card').count()==1
  assert page.locator('.rl3-feature-buttons a').count()==3
  page.locator('#l3-approved-tabs .l3-approved-tab').nth(3).click()
  assert page.locator('.rl3-active-card [data-say="Она"]').count()>0
  assert not errs,errs
  print('L3 OK',size,'scrollwidth',page.evaluate('document.documentElement.scrollWidth'),flush=True)
  page.close()
 b.close()
srv.shutdown()
