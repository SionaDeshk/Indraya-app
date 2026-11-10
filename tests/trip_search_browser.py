"""Phone-size trip/milepost discovery; every external request is intercepted."""
import os,re,shutil
from playwright.sync_api import sync_playwright,expect
BASE=os.environ.get('INDRAYA_WEB_URL','http://127.0.0.1:8095')
OUT='/workspace/outputs/indraya-trips';os.makedirs(OUT,exist_ok=True)
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path=shutil.which('chromium'),headless=True,args=['--no-sandbox'])
 for width,height in [(390,844),(320,568)]:
  ctx=browser.new_context(viewport={'width':width,'height':height});external=[];errors=[]
  def route(r):
   from urllib.parse import urlparse
   host=urlparse(r.request.url).hostname
   if host in ('127.0.0.1','localhost'):return r.continue_()
   external.append(host)
   if host=='photon.komoot.io':return r.fulfill(json={'type':'FeatureCollection','features':[]})
   return r.abort()
  ctx.route('**/*',route);page=ctx.new_page();page.on('pageerror',lambda e:errors.append(str(e)))
  def button(name):return page.get_by_role('button',name=name,exact=True)
  def search(q):
   page.get_by_role('textbox',name='Search places',exact=True).fill(q);button('Search').click()
  page.goto(BASE,wait_until='networkidle',timeout=90000)
  expect(button('About demo mode')).to_be_visible()
  cases=[('Bomber Traverse','Bomber Hut','Mapped site'),('Eklutna Traverse','Hans Hut','Mapped site'),('Resurrection Pass Trail','Resurrection Pass Trail · winter alignment','Mapped route · USDA Forest Service'),('Kesugi Ridge Trail','Kesugi Ridge Trail','Mapped trail segment'),('Rodak Nature Loop','Rodak Nature Loop','Mapped trail segment'),('Dalton MP 115','Dalton Highway MP 115','Mapped milepost'),('Denali hwy MP 104','Denali Highway MP 104','Sign status unknown')]
  for q,name,caption in cases:
   search(q)
   more=page.get_by_role('button',name=re.compile('^More places'))
   if more.count():more.click()
   expect(button(name)).to_be_visible()
   if q=='Bomber Traverse':
    expect(button('Guides & operator information')).to_have_attribute('aria-expanded','false')
    credits=page.get_by_text('© OpenStreetMap contributors',exact=False).bounding_box()
    controls=button('Layers').bounding_box()
    assert credits['y']+credits['height']<controls['y'],(credits,controls)
    page.screenshot(path=f'{OUT}/bomber-search-{width}.png')
   if name in ('Bomber Hut','Dalton Highway MP 115'):expect(button('Source for '+name)).to_be_visible()
   button(name).click()
   expect(page.get_by_text(caption,exact=False)).to_be_visible()
   button('Clear selected place').click()
  search('Dalton MP 999');expect(page.get_by_text('No published reference was found',exact=False)).to_be_visible();expect(button('Dalton Highway MP 999')).to_have_count(0)
  assert not external,external
  search('Boreal Owl Cabin');expect(button('Boreal Owl Cabin · Alaska State Parks reference')).to_be_visible();expect(page.get_by_text('External source · select a mapped place separately',exact=True)).to_be_visible()
  assert page.evaluate('document.documentElement.scrollWidth')<=width
  assert all(host=='photon.komoot.io' for host in external),external
  assert not errors,errors
  ctx.close()
 browser.close()
 print('PASS: traverses/huts, distinct winter alignment, partial hiking/loop segments, operator sources, published mileposts, absent-milepost rejection and reference-only cabins at 390/320px; zero real external requests. Native rendering remains a device gate.')
