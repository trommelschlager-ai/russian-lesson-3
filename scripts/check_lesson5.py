from threading import Thread
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from playwright.sync_api import sync_playwright
from pathlib import Path

s=ThreadingHTTPServer(("127.0.0.1",8181),SimpleHTTPRequestHandler)
Thread(target=s.serve_forever,daemon=True).start()
Path('test-screenshots').mkdir(exist_ok=True)
with sync_playwright() as p:
    b=p.chromium.launch(headless=True,args=['--no-sandbox'])
    for name,w,h in [('android',390,844),('desktop',1360,900)]:
        page=b.new_page(viewport={'width':w,'height':h})
        errors=[]
        page.on('pageerror',lambda e:errors.append(str(e)))
        response=page.goto('http://127.0.0.1:8181/lesson-5.html',wait_until='domcontentloaded',timeout=45000)
        page.locator('.l5-counting-grid .l5-number-card').first.wait_for(timeout=15000)
        assert response.status==200
        assert page.locator('#vocabulary .vocab-card').count()==5
        assert page.locator('#extra-vocab-5 .l5-number-card').count()==5
        assert page.locator('.l5-counting-group').count()==9
        assert page.locator('.l5-counting-grid .l5-number-card').count()==90
        assert page.locator('.l5-beautiful-clock').count()==5
        assert page.locator('.l5-counting-grid .l5-number-card .rl5-panel').count()==90
        assert page.locator('#quiz-section').count()==1
        assert page.locator('.l5-counting-group').nth(3).get_attribute('open') is not None
        last=page.locator('.l5-counting-grid .l5-number-card').last
        assert '100' in last.text_content()  # number 100 group is folded by default
        page.locator('#l5-counting-to-100').screenshot(path=f'test-screenshots/l5-counting-{name}.png',animations='disabled')
        page.locator('#extra-times-5').screenshot(path=f'test-screenshots/l5-clocks-{name}.png',animations='disabled')
        assert not errors,errors
        assert page.evaluate('document.documentElement.scrollWidth <= window.innerWidth + 10'), 'Overflow: '+str(page.evaluate('document.documentElement.scrollWidth'))
        print('PASS',name,'5 original beautiful numbers, 5 redesigned 6-10, 90 new 11-100, five upgraded clocks, 90 practice panels',flush=True)
        page.close()
    b.close()
s.shutdown()
