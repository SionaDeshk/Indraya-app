"""Regression checks for suggested titles and honest source availability. Uses demo mode."""
from playwright.sync_api import sync_playwright,expect
import os
import shutil
BASE_URL=os.environ.get("INDRAYA_WEB_URL", "http://127.0.0.1:8092")
with sync_playwright() as p:
 b=p.chromium.launch(executable_path=os.environ.get('PLAYWRIGHT_CHROMIUM_EXECUTABLE') or shutil.which('chromium'),headless=True,args=['--no-sandbox'])
 page=b.new_page(viewport={'width':390,'height':844});errors=[];official_requests=[]
 page.on('console',lambda m:errors.append(m.text) if m.type=='error' else None)
 page.on('request',lambda r:official_requests.append(r.url) if 'api.weather.gov' in r.url or 'earthquake.usgs.gov' in r.url else None)
 page.goto(BASE_URL,wait_until='networkidle',timeout=90000)
 expect(page.get_by_role('button',name='Standard map',exact=True)).to_have_count(0)
 page.get_by_role('button',name='Layers & sources').click()
 expect(page.get_by_text('Layers & sources',exact=True).last).to_be_visible()
 expect(page.get_by_text('Not connected yet',exact=False)).to_have_count(2)
 expect(page.get_by_role('button',name='Show Weather alerts')).to_have_count(0)
 page.get_by_role('button',name='← Back to map').click()
 page.get_by_role('button',name='＋ Share an observation').click()
 page.get_by_role('button',name='Outdoors',exact=True).click()
 page.get_by_role('button',name='Whale sighting',exact=True).click()
 expect(page.get_by_label('Title',exact=True)).to_have_value('Whale sighting')
 page.get_by_label('Title',exact=True).fill('Belugas near the viewpoint')
 page.get_by_role('button',name='Travel',exact=True).click()
 expect(page.get_by_label('Title',exact=True)).to_have_value('Belugas near the viewpoint')
 page.get_by_role('button',name='Icy road',exact=True).click()
 expect(page.get_by_label('Title',exact=True)).to_have_value('Icy road')
 assert not official_requests,official_requests
 assert not errors,errors
 print('PASS: source availability, no unvalidated requests, suggested editable titles, preserved custom titles, no blank map toggle, no console errors')
 b.close()
