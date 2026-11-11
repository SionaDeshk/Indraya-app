"""Browser layout/interaction acceptance; the actual MapLibre map remains native-only."""
from playwright.sync_api import sync_playwright,expect
import os,shutil,re
BASE=os.environ.get('INDRAYA_WEB_URL','http://127.0.0.1:8092')
OUT=os.environ.get('INDRAYA_SCREENSHOTS','/workspace/outputs/indraya-home')
os.makedirs(OUT,exist_ok=True)
with sync_playwright() as p:
 b=p.chromium.launch(executable_path=shutil.which('chromium'),headless=True,args=['--no-sandbox'])
 for width,height in [(390,844),(320,568),(768,1024)]:
  page=b.new_page(viewport={'width':width,'height':height});errors=[]
  page.on('pageerror',lambda e:errors.append(str(e)))
  page.goto(BASE,wait_until='networkidle',timeout=90000)
  def button(name):return page.get_by_role('button',name=name,exact=True)
  def click(name):button(name).click()
  handle=button('Expand nearby activity');expect(handle).to_be_visible()
  expect(button('Observation category: All categories')).to_have_count(0)
  expect(button('＋ Share an observation')).to_have_count(0)
  expect(page.get_by_text('Together, we see the world.',exact=True)).to_have_count(0)
  expect(page.get_by_role('button',name=re.compile('^Thin ice|^Visibility on'))).to_have_count(0)
  search=page.get_by_role('textbox',name='Search places',exact=True).bounding_box()
  report=button('Report an observation').bounding_box();activity=handle.bounding_box()
  assert search['y']+search['height']<height*.22
  assert report['height']<=52 and report['width']<150
  assert report['y']+report['height']<=activity['y']
  assert activity['height']<=80 and activity['x']>=0 and activity['x']+activity['width']<=width
  assert page.evaluate('document.documentElement.scrollWidth')<=width
  page.screenshot(path=f'{OUT}/browser-home-{width}.png')
  click('About demo mode');expect(page.get_by_text('Map observations are fictional examples.',exact=False)).to_be_visible();click('Back to map');expect(page.get_by_text('Demo mode',exact=True)).not_to_be_visible()
  click('Expand nearby activity');expect(button('Collapse nearby activity')).to_be_visible()
  expect(page.get_by_text('In this map area',exact=False)).to_be_visible()
  assert button('Collapse nearby activity').bounding_box()['y']>=height*.45
  page.wait_for_timeout(350)  # Finish the native-style modal/handle transition before artifact capture.
  page.screenshot(path=f'{OUT}/browser-activity-{width}.png')
  click('Ice along the shoreline')
  expect(button('View full observation')).to_be_visible()
  expect(button('Expand nearby activity')).to_have_count(0)
  expect(button('Flag misleading')).to_have_count(0)
  preview=button('View full observation').evaluate('''e=>{while(e&&getComputedStyle(e).position!=='absolute')e=e.parentElement;return e.getBoundingClientRect().toJSON()}''')
  assert preview['height']<=height*.39 and preview['y']>=height*.59
  action=button('View full observation').bounding_box()
  assert action['y']+action['height']<=height-10 and action['y']>=preview['y']
  page.screenshot(path=f'{OUT}/browser-preview-{width}.png')
  click('View full observation');expect(button('Flag misleading')).to_be_visible()
  click('Back to preview');expect(button('View full observation')).to_be_visible()
  click('Close observation preview');expect(button('Report an observation')).to_be_visible()
  click('Layers');click('Observation category: All categories');click('Wildlife & Animals')
  expect(button('Observation category: Wildlife & Animals')).to_be_visible()
  expect(page.get_by_text('Map legend',exact=True)).to_be_visible()
  click('Back to map');expect(button('Observation category: Wildlife & Animals')).to_have_count(0)
  click('Expand nearby activity');expect(page.get_by_text('Nearby observations',exact=False)).to_contain_text('filtered')
  click('Collapse nearby activity')
  click('Report an observation');expect(page.get_by_text('Share what you see.',exact=True)).to_be_visible();click('← Back to map')
  expect(button('Expand nearby activity')).to_be_visible()
  assert not errors,errors
  if width==390:
   captured=[]
   def outside(route):
    captured.append(route.request.url)
    route.fulfill(json={'features':[{'geometry':{'type':'Point','coordinates':[-122.67,45.52]},'properties':{'name':'Portland','state':'Oregon','countrycode':'US'}}]})
   page.route('https://photon.komoot.io/**',outside)
   page.get_by_role('textbox',name='Search places',exact=True).fill('Portland');click('Search')
   expect(page.get_by_text('No places found in Alaska.',exact=False)).to_be_visible()
   expect(button('Portland')).to_have_count(0)
   assert captured and 'countrycode=US' in captured[0] and 'bbox=-180%2C51%2C180%2C72' in captured[0]
  page.close()
 print('PASS: 320/390/768px layouts, collapsed default, compact report, map space, activity toggle, demo disclosure, Layers-only filters/legend, filter retention and reporting navigation. Browser evidence only.')
 b.close()
