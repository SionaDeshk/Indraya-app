"""Browser-only workflow validation. Photon replies are SYNTHETIC fixtures, not live place verification."""
from playwright.sync_api import sync_playwright, expect
import json, os, shutil
BASE=os.environ.get('INDRAYA_WEB_URL','http://127.0.0.1:8092')
OUT=os.environ.get('INDRAYA_SCREENSHOTS','/workspace/outputs/indraya-guided')
os.makedirs(OUT,exist_ok=True)
with sync_playwright() as p:
 b=p.chromium.launch(executable_path=shutil.which('chromium'),headless=True,args=['--no-sandbox'])
 ctx=b.new_context(viewport={'width':390,'height':844})
 page=ctx.new_page();errors=[];requests=[]
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.on('console',lambda m:errors.append(m.text) if m.type=='error' else None)
 def photon(route):
  requests.append(route.request.url)
  if 'nonexistent' in route.request.url:route.fulfill(json={'features':[]});return
  if 'failure' in route.request.url:route.fulfill(status=429,json={});return
  route.fulfill(json={'features':[{'type':'Feature','geometry':{'type':'Point','coordinates':[-149.106,61.584]},'properties':{'name':'TEST Palmer place','city':'Palmer','state':'Alaska','country':'United States','osm_type':'N','osm_id':123,'osm_key':'amenity','osm_value':'restaurant'}}]})
 page.route('https://photon.komoot.io/**',photon)
 def button(name):return page.get_by_role('button',name=name,exact=True)
 def click(name):
  print("ACTION",name,flush=True)
  try:button(name).click()
  except Exception:
   page.screenshot(path=OUT+"/browser-failure.png",full_page=True)
   print(page.locator("body").inner_text()[-4000:],flush=True)
   raise
 def choose(label,option):page.get_by_role('button',name=label+':',exact=False).click();click(option)
 def next():click('Continue')
 def place():
  page.get_by_label('Search observation location',exact=True).fill('Palmer fixture');click('Search');click('TEST Palmer place')
 def start(domain,query,leaf):

  if page.get_by_role('button',name='Collapse nearby activity',exact=True).count():click('Collapse nearby activity')
  click('Report an observation');click(domain)
  page.get_by_label('Find an observation type',exact=True).fill(query)
  click(leaf+' · '+domain);next()
 page.goto(BASE,wait_until='networkidle',timeout=90000)
 expect(page.get_by_text('Online search',exact=False)).to_have_count(0)
 page.get_by_role('textbox',name='Search places',exact=True).fill('Palmer fixture');click('Search');click('TEST Palmer place')
 expect(page.get_by_text('Place reference only · no observation created')).to_be_visible()
 assert page.evaluate("localStorage.getItem('indraya.demo.observations.v1')")==None
 click('Clear selected place')
 start('Travel & Transportation','black ice','Black ice')
 page.get_by_label('Title',exact=True).fill('TEST custom black ice title')
 page.get_by_label('Description',exact=True).fill('Synthetic report to validate guided observations.')
 choose('Visibility','Reduced')
 click('Change category or observation')
 page.get_by_label('Find an observation type',exact=True).fill('whiteout')
 click('Whiteout · Travel & Transportation');next()
 expect(page.get_by_label('Title',exact=True)).to_have_value('TEST custom black ice title')
 expect(page.get_by_role('button',name='Visibility: Reduced',exact=True)).to_be_visible()
 next();place()
 click('Earlier today');click('Use observation time');next()
 with page.expect_file_chooser() as fc:click('Choose photo')
 fc.value.set_files('tests/fixtures/photo-with-metadata.jpg')
 expect(page.get_by_label('Selected photo preview')).to_be_visible(timeout=15000)
 expect(button('Review observation')).to_be_disabled()
 page.get_by_role('button',name='I checked this photo',exact=False).click();click('Review observation')
 expect(page.get_by_text('Review your observation',exact=True)).to_be_visible()
 page.screenshot(path=OUT+'/browser-review.png',full_page=True)
 click('Submit unverified observation');expect(page.get_by_text('Observation saved',exact=True)).to_be_visible()
 reports=json.loads(page.evaluate("localStorage.getItem('indraya.demo.observations.v1')"))
 assert len(reports)==1 and reports[0]['event_type_id']=='whiteout' and reports[0]['answers']['visibility']=='reduced'
 assert reports[0]['verification']=='unverified' and reports[0]['demo'] and reports[0]['photo_uri'].startswith('data:image/jpeg')
 assert reports[0]['latitude']==61.58 and reports[0]['longitude']==-149.11
 click('Return to map');click('Expand nearby activity');button('TEST custom black ice title').wait_for()
 start('Wildlife & Animals','encounter','Wildlife encounter')
 choose('What animal?','Other animal');page.get_by_role('textbox',name='Other animal',exact=True).fill('Synthetic animal name')
 choose('What animal?','Moose');expect(page.get_by_role('textbox',name='Other animal',exact=True)).to_have_count(0)
 choose('What did you observe?','Attack reported')
 page.get_by_label('Description',exact=True).fill('Synthetic sensitive encounter fixture for private review.')
 next();place();next();click('Skip photo and review')
 page.screenshot(path=OUT+'/browser-private-review.png',full_page=True)
 click('Submit for private review');expect(page.get_by_text('This report is held for private review.',exact=False)).to_be_visible()
 reports=json.loads(page.evaluate("localStorage.getItem('indraya.demo.observations.v1')"))
 assert len(reports)==2 and reports[1]['status']=='review' and reports[1]['privacy_class']=='restricted'
 assert 'other_animal' not in reports[1]['answers'] and reports[1]['place_name']=='Regional information'
 click('View my reports');expect(page.get_by_text('Moose encounter · attack reported',exact=False)).to_be_visible()
 page.screenshot(path=OUT+'/browser-my-reports.png',full_page=True)
 click('← Back to map')
 expect(button('Moose encounter · attack reported')).to_have_count(0)
 page.get_by_role('textbox',name='Search places',exact=True).fill('nonexistent fixture');click('Search')
 expect(page.get_by_text('No places found',exact=False)).to_be_visible()
 page.get_by_role('textbox',name='Search places',exact=True).fill('failure fixture');click('Search')
 expect(page.get_by_role('alert')).to_be_visible()
 expect(button('TEST Palmer place')).to_have_count(0)
 click('Layers');click('Official sources & map information');expect(page.get_by_text('Not connected yet',exact=False)).to_have_count(2)
 assert requests and all('countrycode=US' in url and 'bbox=-180%2C51%2C180%2C72' in url for url in requests) and not errors,errors
 # Permission denial leaves manual selection available and blocks review without a chosen location.
 denied=b.new_context(viewport={'width':390,'height':844})
 page=denied.new_page()
 page.add_init_script("navigator.geolocation.getCurrentPosition = (_ok, fail) => fail({code:1,message:'Permission denied'});")
 page.route('https://photon.komoot.io/**',photon)
 page.goto(BASE,wait_until='networkidle')
 start('Travel & Transportation','black ice','Black ice')
 page.get_by_label('Description',exact=True).fill('Synthetic permission-denial validation report.')
 next();click('Use my current location')
 expect(page.get_by_role('alert')).to_contain_text('Location access is off',timeout=15000)
 next();expect(page.get_by_role('alert').last).to_contain_text('Choose where you observed this')
 expect(page.get_by_role('button',name='Submit unverified observation',exact=True)).to_have_count(0)
 place();expect(page.get_by_text('Selected: TEST Palmer place',exact=True)).to_be_visible()

 print('PASS browser: provider fixtures, no incident on search, dependent pruning, custom title preservation, cross-type answers, photo/time/review/persistence, private holds/My reports/public exclusion, no fallback on empty/error, disabled official feeds, no console errors')
 b.close()
