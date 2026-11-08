"""Full demo workflow test. Restaurant responses are mocked, not live endpoint validation."""
from playwright.sync_api import sync_playwright,expect
import json,base64,os,shutil
BASE_URL=os.environ.get("INDRAYA_WEB_URL","http://127.0.0.1:8092")
with sync_playwright() as p:
 b=p.chromium.launch(executable_path=os.environ.get('PLAYWRIGHT_CHROMIUM_EXECUTABLE') or shutil.which('chromium'),headless=True,args=['--no-sandbox'])
 ctx=b.new_context(permissions=['geolocation'],geolocation={'latitude':60.977,'longitude':-149.644},viewport={'width':430,'height':932})
 page=ctx.new_page();errors=[];requests=[]
 page.on('console',lambda m:errors.append(m.text) if m.type=='error' else None)
 def photon(route):
  requests.append(route.request.url)
  route.fulfill(status=200,content_type='application/json',body=json.dumps({'type':'FeatureCollection','features':[{'geometry':{'type':'Point','coordinates':[-149.16,60.94]},'properties':{'name':'TEST RESTAURANT','city':'Girdwood','state':'Alaska'}}]}))
 page.route('**/photon.komoot.io/api/**',photon)
 page.goto(BASE_URL,wait_until='networkidle',timeout=90000)
 for name in ['Girdwood','Wasilla','Knik River','Knik Glacier']:
  page.get_by_label('Search Alaska places').fill(name);expect(page.get_by_role('button',name=name,exact=True)).to_be_visible()
 page.get_by_label('Search Alaska places').fill('restaurant Girdwood')
 page.get_by_role('button',name='Search online',exact=True).click()
 page.get_by_role('button',name='TEST RESTAURANT',exact=True).click()
 assert requests and 'q=restaurant+Girdwood' in requests[0]
 page.get_by_role('button',name='Map legend').click();expect(page.get_by_text('Color indicates report type',exact=False)).to_be_visible();page.get_by_role('button',name='Close legend').click()
 page.get_by_role('button',name='＋ Share an observation').click()
 page.get_by_role('button',name='Outdoors',exact=True).click();page.get_by_role('button',name='Whale sighting',exact=True).click()
 expect(page.get_by_label('Animal',exact=True)).to_have_value('Whale')
 page.get_by_label('Animal',exact=True).fill('Beluga');page.get_by_label('Approximate animal count',exact=True).fill('4')
 page.get_by_label('Title',exact=True).fill('TEST belugas near Beluga Point');page.get_by_label('Description',exact=True).fill('Synthetic test report for the richer report workflow.')
 page.get_by_role('button',name='Earlier today',exact=True).click();page.get_by_role('button',name='Use observation time').click()
 page.get_by_label('Search observation location').fill('Beluga');page.get_by_role('button',name='Beluga Point',exact=True).click()
 with page.expect_file_chooser() as chooser:page.get_by_role('button',name='Choose photo',exact=True).click()
 chooser.value.set_files('tests/fixtures/photo-with-metadata.jpg')
 page.get_by_label('Selected photo preview').wait_for(timeout=15000)
 expect(page.get_by_role('button',name='Submit unverified observation')).to_be_disabled()
 page.get_by_role('button',name='I checked this photo for sensitive details',exact=False).click()
 page.get_by_role('button',name='Submit unverified observation').click()
 page.get_by_role('button',name='TEST belugas near Beluga Point',exact=True).wait_for(timeout=15000)
 reports=json.loads(page.evaluate("localStorage.getItem('indraya.demo.observations.v1')"));report=reports[0]
 assert report['kind']=='wildlife' and report['details']=={'animal':'Beluga','count':4}
 assert report['place_name']=='Beluga Point' and report['observed_at']<report['created_at']
 assert report['latitude']==60.98 and report['longitude']==-149.64
 photo=base64.b64decode(report['photo_uri'].split(',',1)[1]);assert b'PRIVATE TEST GPS' not in photo
 page.get_by_role('button',name='TEST belugas near Beluga Point',exact=True).click()
 expect(page.get_by_text('Animal: Beluga',exact=False)).to_be_visible()
 expect(page.get_by_label('Observation photo',exact=True)).to_be_visible()
 page.get_by_role('button',name='Close',exact=True).click()
 page.get_by_role('button',name='Nearby activity',exact=True).click();expect(page.get_by_role('button',name='TEST belugas near Beluga Point',exact=True)).to_be_visible()
 page.reload(wait_until='networkidle');page.get_by_role('button',name='TEST belugas near Beluga Point',exact=True).wait_for()
 assert not errors,errors
 print('PASS: town/feature search, mocked restaurant search, legend, animal/count/time, photo consent, metadata removal, persistence, richer cards and nearby activity, no console errors')
 b.close()
