"""Expanded local place search acceptance; no real provider or Supabase requests."""
import os,shutil
from playwright.sync_api import sync_playwright,expect
BASE=os.environ.get('INDRAYA_WEB_URL','http://127.0.0.1:8095')
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path=shutil.which('chromium'),headless=True,args=['--no-sandbox'])
 for width,height in [(390,844),(320,568)]:
  ctx=browser.new_context(viewport={'width':width,'height':height});blocked=[];errors=[]
  def route(r):
   from urllib.parse import urlparse
   host=urlparse(r.request.url).hostname
   if host in ('localhost','127.0.0.1'):return r.continue_()
   if host=='photon.komoot.io':return r.fulfill(json={'type':'FeatureCollection','features':[]})
   blocked.append(host);return r.abort()
  ctx.route('**/*',route);page=ctx.new_page();page.on('pageerror',lambda e:errors.append(str(e)))
  page.goto(BASE,wait_until='networkidle',timeout=90000)
  expect(page.get_by_role('button',name='About demo mode',exact=True)).to_be_visible()
  for query,label,outlined in [('Hatchers Pass area','Hatcher Pass Public Use Area',True),('Kincaid Park','Kincaid Park',True),('Alyeska Mountain','Mount Alyeska',False),('Government Peak','Government Peak',False)]:
   page.get_by_role('textbox',name='Search places',exact=True).fill(query)
   page.get_by_role('button',name='Search',exact=True).click()
   page.get_by_role('button',name=label,exact=True).click()
   caption='Mapped outline · © OpenStreetMap contributors' if outlined else 'Place pin · mapped outline unavailable'
   expect(page.get_by_text(caption,exact=True)).to_be_visible()
   page.get_by_role('button',name='Clear selected place',exact=True).click()
   expect(page.get_by_text(caption,exact=True)).to_have_count(0)
   page.wait_for_timeout(1150) # Respect the application's existing Photon throttle.
  assert not blocked,blocked
  assert not errors,errors
  ctx.close()
 browser.close()
 print('PASS: expanded cached OSM/GNIS results, local spellings, honest outline/point distinction, cleared selections at 390/320px; no real external calls. Native rendering remains a device gate.')
