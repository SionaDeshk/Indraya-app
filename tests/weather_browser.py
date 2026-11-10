"""Synthetic NWS read-only panel acceptance; blocks every real external request."""
import datetime,json,shutil,os
from urllib.parse import urlparse
from playwright.sync_api import sync_playwright,expect
from release_audit_browser import Backend,session,KEY,A,API
BASE='http://127.0.0.1:8096';OUT='/workspace/outputs/indraya-discovery';os.makedirs(OUT,exist_ok=True)
class WeatherBackend(Backend):
 def __init__(self):
  super().__init__();self.weather=[]
  now=datetime.datetime.now(datetime.timezone.utc).isoformat()
  self.records=[dict(id='11111111-1111-4111-8111-111111111111',author_id=A,category='Outdoors',kind='trail',title='SYNTHETIC lake surface',description='',longitude=-149.03,latitude=61.37,place_name='Eklutna Lake',created_at=now,observed_at=now,verification='unverified',source='Community',status='published',privacy_class='approximate',taxonomy_version=2,domain_id='outdoors',topic_id='outdoors.ice',event_type_id='ice_skating',answers={'ice_measurement':'not_measured'})]
 def route(self,r):
  p=urlparse(r.request.url)
  if p.hostname=='api.weather.gov':
   self.weather.append(p.path)
   if p.path.startswith('/points/'):return r.fulfill(json={'properties':{'relativeLocation':{'properties':{'state':'AK'}},'observationStations':'https://api.weather.gov/gridpoints/AFC/1,1/stations'}})
   if p.path.endswith('/stations'):return r.fulfill(json={'type':'FeatureCollection','features':[{'type':'Feature','geometry':{'type':'Point','coordinates':[-149.03,61.37]},'properties':{'@id':'https://api.weather.gov/stations/TEST','name':'SYNTHETIC valley station','elevation':{'value':100,'unitCode':'wmoUnit:m'}}}]})
   if p.path.endswith('/latest'):return r.fulfill(json={'properties':{'timestamp':(datetime.datetime.now(datetime.timezone.utc)-datetime.timedelta(hours=2)).isoformat(),'windSpeed':{'value':None,'unitCode':'wmoUnit:km_h-1'},'windGust':{'value':None,'unitCode':'wmoUnit:km_h-1'},'temperature':{'value':-5,'unitCode':'wmoUnit:degC'}}})
   raise AssertionError(p.path)
  if p.hostname==API and p.path=='/rest/v1/observation_feed':return r.fulfill(json=self.records)
  return super().route(r)
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path=shutil.which('chromium'),headless=True,args=['--no-sandbox']);ctx=browser.new_context(viewport={'width':390,'height':844});backend=WeatherBackend();ctx.route('**/*',backend.route)
 ctx.add_init_script('localStorage.setItem('+json.dumps(KEY)+','+json.dumps(json.dumps(session(A)))+');')
 page=ctx.new_page();page.goto(BASE+'/my-reports',wait_until='networkidle',timeout=90000)
 page.get_by_role('button',name='SYNTHETIC lake surface',exact=True).click()
 assert backend.weather==[]
 page.get_by_role('button',name='Local forecasts & updates',exact=True).click();assert backend.weather==[]
 page.get_by_role('button',name='Nearby weather station · NWS',exact=True).click()
 expect(page.get_by_text('SYNTHETIC valley station',exact=False)).to_be_visible()
 expect(page.get_by_text('Wind unavailable',exact=False)).to_be_visible()
 expect(page.get_by_text('Older reading ·',exact=False)).to_be_visible()
 assert len(backend.weather)==3,backend.weather
 assert backend.weather[0]=='/points/61.37,-149.03'
 page.screenshot(path=OUT+'/station-provenance.png',full_page=True)
 assert not backend.blocked,backend.blocked
 browser.close()
 print('PASS: no weather calls before explicit expansion, approximate location, named station/elevation, missing wind and older-reading labels; synthetic endpoints only')
