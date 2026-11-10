"""Device-only UI acceptance. No Supabase configuration or production writes."""
import os,shutil,datetime,json
from playwright.sync_api import sync_playwright,expect
BASE=os.environ.get('INDRAYA_WEB_URL','http://127.0.0.1:8095')
OUT='/workspace/outputs/indraya-discovery';os.makedirs(OUT,exist_ok=True)
with sync_playwright() as p:
 b=p.chromium.launch(executable_path=shutil.which('chromium'),headless=True,args=['--no-sandbox'])
 for width,height in [(390,844),(320,568)]:
  ctx=b.new_context(viewport={'width':width,'height':height});page=ctx.new_page();blocked=[];errors=[]
  ctx.route('https://*.supabase.co/**',lambda r:(blocked.append(r.request.url),r.abort()))
  page.on('pageerror',lambda e:errors.append(str(e)))
  now=datetime.datetime.now(datetime.timezone.utc)
  def observation(id,title,minutes,seen):
   return dict(id=id,title=title,category='Outdoors',kind='trail',description='',longitude=-149.03,latitude=61.37,place_name='Eklutna Lake',created_at=(now-datetime.timedelta(minutes=minutes)).isoformat(),observed_at=(now-datetime.timedelta(minutes=seen)).isoformat(),verification='unverified',source='DEMO · this device',demo=True,status='published',taxonomy_version=2,domain_id='outdoors',topic_id='outdoors.ice',event_type_id='ice_skating',related_type_ids=[],answers={'water_context':'lake','ice_measurement':'not_measured'})
  records=[observation('old','Older shared ice',11,11),observation('new','Newly shared ice',1,240)]
  ctx.add_init_script('if(!localStorage.getItem("indraya.demo.observations.v1")) localStorage.setItem("indraya.demo.observations.v1",'+json.dumps(json.dumps(records))+');')
  page.goto(BASE+'/my-reports',wait_until='networkidle',timeout=90000)
  expect(page.get_by_role('button',name='Newly shared ice',exact=True)).to_be_visible()
  buttons=page.get_by_role('button').evaluate_all('(els)=>els.map(e=>e.getAttribute("aria-label"))')
  assert buttons.index('Newly shared ice')<buttons.index('Older shared ice'),buttons
  page.get_by_role('button',name='Newly shared ice',exact=True).click()
  expect(page.get_by_text('Staff risk: not assessed',exact=True)).to_have_count(0)
  expect(page.get_by_text('Thickness not measured',exact=True)).to_be_visible()
  expect(page.get_by_text('History remains; expiry does not mean resolved.',exact=False)).to_have_count(0)
  expect(page.get_by_role('button',name='More observation details',exact=True)).to_be_visible()
  page.wait_for_timeout(400) # Capture the completed native-style modal animation.
  page.screenshot(path=f'{OUT}/compact-details-{width}.png',full_page=True)
  page.get_by_role('button',name='Edit observation',exact=True).click()
  page.get_by_role('textbox',name='Correct observation note',exact=True).fill('Synthetic corrected note')
  page.get_by_role('radio',name='Was thickness measured?: I measured at one drilled spot',exact=True).click()
  page.get_by_label('Thickness at that spot · cm, not a crossing assessment',exact=True).fill('0')
  page.get_by_role('button',name='Save correction',exact=True).click()
  expect(page.get_by_text('Enter a whole number between 1 and 200',exact=False)).to_be_visible()
  page.get_by_role('radio',name='Was thickness measured?: Not measured',exact=True).click()
  expect(page.get_by_label('Thickness at that spot · cm, not a crossing assessment',exact=True)).to_have_count(0)
  page.get_by_role('button',name='Save correction',exact=True).click()
  expect(page.get_by_role('button',name='Close my report',exact=True)).to_have_count(0)
  saved=page.evaluate('JSON.parse(localStorage.getItem("indraya.demo.observations.v1"))')
  assert next(r for r in saved if r['id']=='new')['description']=='Synthetic corrected note'
  assert next(r for r in saved if r['id']=='new')['created_at']==records[1]['created_at']
  page.get_by_role('button',name='Older shared ice',exact=True).click()
  expect(page.get_by_role('button',name='Edit observation',exact=True)).to_have_count(0)
  expect(page.get_by_text('Correction window closed.',exact=False)).to_be_visible()
  assert not blocked,blocked
  assert not errors,errors
  ctx.close()
 b.close()
 print('PASS: newest-first sharing order, compact details, optional information, ten-minute correction, unchanged original timestamp and closed old window at 390/320px; zero Supabase requests')
