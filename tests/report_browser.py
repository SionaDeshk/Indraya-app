"""Browser report regression checks. Start Expo web on 8092; requires Python Playwright."""
from playwright.sync_api import sync_playwright, expect
import json
import os
import shutil

BASE_URL = os.environ.get("INDRAYA_WEB_URL", "http://127.0.0.1:8092")
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path=os.environ.get('PLAYWRIGHT_CHROMIUM_EXECUTABLE') or shutil.which('chromium'),headless=True,args=['--no-sandbox'])
    context=browser.new_context(permissions=['geolocation'],geolocation={'latitude':60.977,'longitude':-149.644})
    page=context.new_page()
    errors=[]
    page.on('console',lambda m:errors.append(m.text) if m.type=='error' else None)
    page.goto(BASE_URL,wait_until='networkidle',timeout=90000)
    page.get_by_role('button',name='＋ Share an observation').click()
    expect(page.get_by_role('button',name='Submit unverified observation')).to_be_disabled()
    assert page.get_by_label('Latitude',exact=True).count()==0
    assert page.get_by_label('Longitude',exact=True).count()==0
    page.get_by_label('Search observation location').fill('unknown place')
    expect(page.get_by_text('No match in the offline Alaska place list.',exact=False)).to_be_visible()
    page.get_by_label('Search observation location').fill('  beluga  ')
    page.get_by_role('button',name='Beluga Point',exact=True).click()
    expect(page.get_by_text('Selected: Beluga Point')).to_be_visible()
    expect(page.get_by_role('button',name='Submit unverified observation')).to_be_enabled()
    page.get_by_role('button',name='Submit unverified observation').click()
    expect(page.get_by_role('alert')).to_contain_text('title between 5 and 100')
    page.get_by_label('Title',exact=True).fill('Whales near Beluga Point')
    page.get_by_label('Description',exact=True).fill('Demo report testing place selection and approximate location.')
    page.get_by_role('button',name='Submit unverified observation').click()
    page.get_by_text('DEMO EXPLORER',exact=False).wait_for()
    reports=json.loads(page.evaluate("localStorage.getItem('indraya.demo.observations.v1')"))
    assert len(reports)==1
    assert reports[0]['latitude']==60.98 and reports[0]['longitude']==-149.64
    assert reports[0]['verification']=='unverified' and reports[0]['demo'] is True
    page.reload(wait_until='networkidle')
    page.get_by_role('button',name='Whales near Beluga Point',exact=True).wait_for()
    page.get_by_role('button',name='＋ Share an observation').click()
    page.get_by_role('button',name='Use my current location').click()
    expect(page.get_by_text('Selected: Current location')).to_be_visible(timeout=15000)
    assert not errors,errors
    print('PASS: no coordinate fields, required location, search/empty state, validation, persisted rounded demo report, foreground location success, no browser console errors')
    denied=browser.new_context()
    denied.grant_permissions([],origin=BASE_URL)
    page2=denied.new_page()
    page2.add_init_script("navigator.geolocation.getCurrentPosition = (_ok, fail) => fail({code:1,message:'Permission denied'});")
    page2.goto(BASE_URL,wait_until='networkidle',timeout=90000)
    page2.get_by_role('button',name='＋ Share an observation').click()
    page2.get_by_role('button',name='Use my current location').click()
    expect(page2.get_by_role('alert')).to_contain_text('Location access is off',timeout=15000)
    expect(page2.get_by_role('button',name='Submit unverified observation')).to_be_disabled()
    page2.get_by_label('Search observation location').fill('Beluga')
    page2.get_by_role('button',name='Beluga Point',exact=True).click()
    expect(page2.get_by_text('Selected: Beluga Point')).to_be_visible()
    print('PASS: denied location preserves manual place-search alternative')
    browser.close()
