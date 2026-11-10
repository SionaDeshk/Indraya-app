"""Phases 1–4 acceptance in DEMO mode. Blocks Supabase; never writes production."""
from playwright.sync_api import sync_playwright,expect
import json,os,shutil,datetime
BASE=os.environ.get('INDRAYA_WEB_URL','http://127.0.0.1:8095')
OUT='/workspace/outputs/indraya-phases';os.makedirs(OUT,exist_ok=True)
with sync_playwright() as p:
 b=p.chromium.launch(executable_path=shutil.which('chromium'),headless=True,args=['--no-sandbox'])
 page=b.new_page(viewport={'width':390,'height':844});errors=[];production=[]
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.on('console',lambda m:errors.append(m.text) if m.type=='error' else None)
 page.route('https://*.supabase.co/**',lambda r:(production.append(r.request.url),r.abort()))
 page.route('https://photon.komoot.io/**',lambda r:r.fulfill(json={'features':[{'type':'Feature','geometry':{'type':'Point','coordinates':[-149.9,61.2181]},'properties':{'name':'TEST winter trail','city':'Anchorage','state':'Alaska','country':'United States','osm_type':'N','osm_id':1}}]}))
 def btn(n):return page.get_by_role('button',name=n,exact=True).or_(page.get_by_role('radio',name=n,exact=True))
 def click(n):print('ACTION',n,flush=True);btn(n).click()
 def choose_ice():
  click('Travel & Transportation');page.get_by_label('Find an observation type',exact=True).fill('black ice');click('Black ice · Travel & Transportation')
 def place():page.get_by_label('Search observation location',exact=True).fill('Trail fixture');click('Search');click('TEST winter trail')
 page.goto(BASE,wait_until='networkidle',timeout=90000);click('Share an observation')
 expect(page.get_by_text('DEMO · Nothing is shared publicly',exact=True)).to_be_visible()
 choose_ice();expect(page.get_by_label('Description',exact=True)).to_have_count(0);click('Continue');place()
 page.wait_for_function("JSON.parse(localStorage.getItem('indraya.draft.v1.demo')||'null')?.value?.location?.latitude===61.22")
 click('Back to map');click('Share an observation');expect(page.get_by_text('Continue your draft?',exact=True)).to_be_visible()
 expect(btn('Continue')).to_be_disabled();click('Continue draft')
 expect(page.get_by_label('Description',exact=True)).to_have_count(0);click('Continue');click('Review observation')
 page.screenshot(path=OUT+'/optional-note-review.png',full_page=True)
 click('Share observation');expect(btn('View on map')).to_be_visible();click('View on map')
 expect(btn('View full observation')).to_be_visible()
 records=page.evaluate("JSON.parse(localStorage.getItem('indraya.demo.observations.v1'))")
 assert len(records)==1 and records[0]['description']==''
 assert page.evaluate("localStorage.getItem('indraya.draft.v1.demo')") is None
 # Returning from the successful share must highlight the created observation, not a different card.
 expect(page.get_by_text('Black ice observed',exact=True)).to_be_visible()
 # Inject a synthetic outdated condition in device-only storage; active map excludes it.
 old=dict(records[0]);old.update(id='old-fixture',title='Outdated fixture',created_at=(datetime.datetime.now(datetime.timezone.utc)-datetime.timedelta(days=2)).isoformat(),observed_at=(datetime.datetime.now(datetime.timezone.utc)-datetime.timedelta(days=2)).isoformat())
 page.evaluate("r=>localStorage.setItem('indraya.demo.observations.v1',JSON.stringify(r))",records+[old])
 page.goto(BASE,wait_until='networkidle');click('Expand nearby activity');expect(btn('Outdated fixture')).to_have_count(0);click('Collapse nearby activity')
 click('Layers');click('Show recent history');click('Back to map');click('Expand nearby activity');expect(btn('Outdated fixture')).to_be_visible();click('Outdated fixture');click('View full observation')
 expect(page.get_by_text('Outdated ·',exact=False)).to_be_visible()
 # Account and source navigation does not imply a live integration or emergency monitoring.
 page.goto(BASE+'/account',wait_until='networkidle');click('My observations');expect(page.get_by_text('Outdated ·',exact=False)).to_be_visible()
 page.goto(BASE,wait_until='networkidle');page.get_by_role('textbox',name='Search places',exact=True).fill('Trail fixture');click('Search');click('TEST winter trail');click('Follow this place')
 page.goto(BASE+'/places',wait_until='networkidle');expect(page.get_by_role('heading',name='Following places',exact=True)).to_be_visible();expect(btn('Open TEST winter trail')).to_be_visible();click('Open TEST winter trail')
 expect(page.get_by_text('Place pin · mapped outline unavailable')).to_be_visible()
 page.goto(BASE+'/sources',wait_until='networkidle');click('Local forecasts & updates');click('Area: Hatcher Pass');expect(btn('Hatcher Pass Avalanche Center · forecast')).to_be_visible();expect(page.get_by_text('No external forecast is loaded here.',exact=False)).to_be_visible()
 page.goto(BASE+'/reset-password',wait_until='networkidle');expect(page.get_by_text('Open the recovery link from your email',exact=False)).to_be_visible()
 # A sensitive observation needs no typed note, explains its hold and opens owner status.
 page.goto(BASE+'/report',wait_until='networkidle');click('Safety & Assistance');page.get_by_label('Find an observation type',exact=True).fill('gunfire');click('Possible gunfire heard · Safety & Assistance')
 expect(page.get_by_text('This observation will go to private review.',exact=False)).to_be_visible();click('Continue');place();click('Review observation');click('Send for private review');click('View status')
 expect(page.get_by_text('Awaiting review ·',exact=False).last).to_be_visible()
 # Discard is explicit and never submits an observation.
 page.goto(BASE+'/report',wait_until='networkidle');choose_ice();click('Add a note · Optional');page.get_by_label('Description',exact=True).fill('Synthetic draft to discard')
 page.wait_for_function("JSON.parse(localStorage.getItem('indraya.draft.v1.demo')||'null')?.value?.description==='Synthetic draft to discard'")
 page.reload(wait_until='networkidle');click('Discard draft');expect(page.get_by_text('Continue your draft?',exact=True)).to_have_count(0)
 assert len(page.evaluate("JSON.parse(localStorage.getItem('indraya.demo.observations.v1'))"))==3
 assert not errors,errors
 assert not production,production
 print('PASS: no typing, scoped draft recovery/discard, View on map, expiry/history, owner statuses, followed places, regional source labels and recovery-page fallback; zero Supabase requests')
 b.close()
