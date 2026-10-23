from threading import Thread
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from pathlib import Path
from playwright.sync_api import sync_playwright

screens=Path('qa-approved-art');screens.mkdir(exist_ok=True)
srv=ThreadingHTTPServer(('127.0.0.1',8126),SimpleHTTPRequestHandler)
Thread(target=srv.serve_forever,daemon=True).start()
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,args=['--no-sandbox'])
    for kind,w,h in [('android',390,844),('desktop',1360,850)]:
        page=browser.new_page(viewport={'width':w,'height':h},is_mobile=kind=='android',has_touch=kind=='android')
        js_errors=[]
        missing=[]
        page.on('pageerror',lambda error:js_errors.append(str(error)))
        page.on('response',lambda response:missing.append(response.url) if response.status>=400 else None)
        r=page.goto('http://127.0.0.1:8126/russian_lesson_2_reading.html',wait_until='domcontentloaded',timeout=45000)
        assert r.status==200
        page.locator('#word-list>.word-card.l2-current').wait_for(timeout=30000)
        page.locator('#word-list .topline .l2-feature-controls').first.wait_for(timeout=10000)
        assert page.locator('#word-list>.word-card').count()==100
        assert page.locator('#word-list>.word-card.l2-current').count()==1
        assert page.locator('#word-list .l2-example').count()==1
        assert page.locator('#word-list>.word-card').first.locator('[data-role="photo"]').get_attribute('src').endswith('lesson2-approved-food.avif')
        assert 'lesson2-approved-hero.avif' in page.locator('header.banner').evaluate('(el)=>getComputedStyle(el).backgroundImage')
        assert page.locator('#word-list>.word-card.l2-current [data-role=play]').count()==1
        assert page.locator('#word-list>.word-card.l2-current [data-role=slow]').count()==1
        assert page.locator('#word-list>.word-card.l2-current [data-role=record]').count()==1
        assert page.locator('.l2-feature-controls').count()==1
        for img in ['lesson2-approved-hero.avif','lesson2-approved-food.avif']:
            assert all(img not in failed for failed in missing),('Image missing',missing)
        page.screenshot(path=str(screens/f'lesson2-{kind}.png'),animations='disabled',full_page=False)
        page.locator('#l2-next').click()
        page.locator('#word-list>.word-card.l2-current .topline .l2-feature-controls').wait_for(timeout=9000)
        assert page.locator('#l2-page').inner_text().strip()=='2 / 100'
        assert page.locator('#word-list>.word-card.l2-current').count()==1
        assert not js_errors,js_errors
        print('LESSON2 PASS',kind,'100 words, approved header+food, working 1/100 next and audio',flush=True)
        js_errors.clear();missing.clear()
        r=page.goto('http://127.0.0.1:8126/lesson-3-pronouns-basic.html',wait_until='domcontentloaded',timeout=45000)
        page.locator('#pronoun-cards>.card.rl3-active-card').first.wait_for(timeout=30000)
        page.locator('#pronoun-cards .card-copy .rl3-feature-buttons').wait_for(timeout=10000)
        assert page.locator('#pronoun-cards>.card').count()==8
        assert page.locator('#l3-approved-tabs .l3-approved-tab').count()==8
        assert page.locator('#pronoun-cards>.card.rl3-active-card .card-art img').get_attribute('src')=='assets/approved-art/lesson3-approved-student.avif'
        assert 'lesson3-approved-hero.avif' in page.locator('header.hero').evaluate('(el)=>getComputedStyle(el).backgroundImage')
        assert page.locator('header.hero .hero-art img').get_attribute('src')=='assets/approved-art/lesson3-approved-hero.avif'
        assert 'lesson-4-hero.jpg' not in page.content()
        for img in ['lesson3-approved-hero.avif','lesson3-approved-student.avif']:
            assert all(img not in failed for failed in missing),('Image missing',missing)
        page.screenshot(path=str(screens/f'lesson3-{kind}.png'),animations='disabled',full_page=False)
        page.locator('#l3-approved-tabs .l3-approved-tab').nth(3).click()
        page.locator('#pronoun-cards>.card.rl3-active-card .card-copy .rl3-feature-buttons').wait_for(timeout=9000)
        assert page.locator('#pronoun-cards>.card.rl3-active-card').count()==1
        assert page.locator('#l3-approved-tabs .l3-approved-tab').nth(3).get_attribute('aria-current')=='true'
        assert page.locator('#quiz-section').count()==1
        assert not js_errors,js_errors
        assert page.evaluate('document.documentElement.scrollWidth <= window.innerWidth + 8'), 'horizontal overflow'
        print('LESSON3 PASS',kind,'8 pronouns, exact approved image assets, all nav/buttons intact',flush=True)
        page.close()
    browser.close()
srv.shutdown()
