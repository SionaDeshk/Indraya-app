"""Diagnostic characterizations, NOT release acceptance. No real Supabase requests.
Start web with URL https://indraya-audit.supabase.co and key synthetic-public-key.
Results intentionally record known defects; a zero exit means the reproduction
completed, not that the app is ready to release. See docs/release-readiness-audit.md.
"""
import base64, datetime, json, os, shutil, time
from urllib.parse import urlparse
from playwright.sync_api import sync_playwright, expect

BASE = os.environ.get('INDRAYA_AUDIT_URL', 'http://127.0.0.1:8096')
API = 'indraya-audit.supabase.co'
OUT = os.environ.get('INDRAYA_AUDIT_OUTPUT', '/workspace/outputs/indraya-release-audit')
os.makedirs(OUT, exist_ok=True)
A = '00000000-0000-0000-0000-000000000001'
B = '00000000-0000-0000-0000-000000000002'
KEY = 'sb-indraya-audit-auth-token'

def user(actor):
    return {'id':actor,'aud':'authenticated','role':'authenticated','email':('a' if actor==A else 'b')+'@example.test','email_confirmed_at':'2026-01-01T00:00:00Z','app_metadata':{'provider':'email'},'user_metadata':{},'identities':[],'created_at':'2026-01-01T00:00:00Z'}

def session(actor):
    enc=lambda v:base64.urlsafe_b64encode(json.dumps(v).encode()).decode().rstrip('=')
    token=enc({'alg':'HS256','typ':'JWT'})+'.'+enc({'sub':actor,'aud':'authenticated','role':'authenticated','exp':int(time.time())+3600})+'.c3ludGhldGlj'
    return {'access_token':token,'refresh_token':'synthetic-refresh-'+actor,'expires_in':3600,'expires_at':int(time.time())+3600,'token_type':'bearer','user':user(actor)}

def actor_for(request):
    token=request.headers.get('authorization','').removeprefix('Bearer ')
    try:
        part=token.split('.')[1]
        return json.loads(base64.urlsafe_b64decode(part+'='*((-len(part))%4)))['sub']
    except Exception:
        return A

class Backend:
    def __init__(self):
        self.records=[]; self.inserts=0; self.drop_first=False; self.password_updates=[]; self.blocked=[]; self.requests=[]
    def route(self,route):
        request=route.request; parsed=urlparse(request.url); path=parsed.path; self.requests.append((request.method,parsed.hostname,path))
        if parsed.hostname in ('127.0.0.1','localhost'):
            return route.continue_()
        if parsed.hostname=='photon.komoot.io':
            return route.fulfill(json={'features':[{'type':'Feature','geometry':{'type':'Point','coordinates':[-149.9,61.2181]},'properties':{'name':'SYNTHETIC audit trail','city':'Anchorage','state':'Alaska','country':'United States','osm_type':'N','osm_id':1}}]})
        if parsed.hostname!=API:
            self.blocked.append(request.url); return route.abort()
        if path=='/auth/v1/token':
            return route.fulfill(json=session(B if 'password' in parsed.query else A))
        if path=='/auth/v1/user':
            actor=actor_for(request)
            if request.method=='PUT': self.password_updates.append(actor)
            return route.fulfill(json=user(actor))
        if path=='/auth/v1/logout': return route.fulfill(json={})
        if path=='/rest/v1/profiles': return route.fulfill(json=[])
        if path=='/rest/v1/observation_catalog_versions': return route.fulfill(json=[{'version':2}])
        if path=='/rest/v1/observations' and request.method=='POST':
            self.inserts+=1
            record=dict(request.post_data_json,id='11111111-1111-1111-1111-'+str(self.inserts).zfill(12),status='published',privacy_class='approximate',verification='unverified',created_at=datetime.datetime.now(datetime.timezone.utc).isoformat())
            self.records.append(record)
            if self.drop_first and self.inserts==1:
                # Simulate committed insert followed by failure to deliver its response.
                return route.abort('connectionreset')
            return route.fulfill(status=201,json=record)
        if path=='/rest/v1/observation_feed': return route.fulfill(json=self.records)
        if path=='/rest/v1/rpc/my_observations': return route.fulfill(json=[r for r in self.records if r['author_id']==actor_for(request)])
        if path=='/rest/v1/observation_media': return route.fulfill(json=[])
        if path=='/rest/v1/rpc/observation_response_summary': return route.fulfill(json={'observed':0,'changed':0,'not_observed':0,'latest':None})
        if path=='/rest/v1/followed_places': return route.fulfill(json=[])
        raise AssertionError('Unhandled synthetic request: '+request.method+' '+path)

with sync_playwright() as p:
    browser=p.chromium.launch(executable_path=shutil.which('chromium'),headless=True,args=['--no-sandbox'])
    results=[]
    def context(backend):
        ctx=browser.new_context(viewport={'width':390,'height':844})
        ctx.route('**/*',backend.route)
        ctx.add_init_script("""if (!sessionStorage.getItem('audit-seeded')) {
            localStorage.setItem(%s, %s);
            localStorage.setItem(%s, JSON.stringify('synthetic-verifier/PASSWORD_RECOVERY'));
            sessionStorage.setItem('audit-seeded','yes');
        }"""%(json.dumps(KEY),json.dumps(json.dumps(session(A))),json.dumps(KEY+'-code-verifier')))
        return ctx
    def button(page,name):
        return page.get_by_role('button',name=name,exact=True).or_(page.get_by_role('radio',name=name,exact=True))

    backend=Backend();backend.drop_first=True;ctx=context(backend);page=ctx.new_page()
    page.goto(BASE+'/report',wait_until='networkidle',timeout=90000)
    expect(page.get_by_text('DEMO · Nothing is shared publicly',exact=True)).to_have_count(0)
    button(page,'Travel & Transportation').click()
    page.get_by_label('Find an observation type',exact=True).fill('black ice')
    button(page,'Black ice · Travel & Transportation').click();button(page,'Continue').click()
    page.get_by_label('Search observation location',exact=True).fill('audit fixture');button(page,'Search').click();button(page,'SYNTHETIC audit trail').click();button(page,'Review observation').click()
    button(page,'Share observation').click()
    expect(page.get_by_text('Unable to share your observation. Check your connection and account, then try again.',exact=True)).to_be_visible()
    assert backend.inserts==1
    button(page,'Share observation').click();expect(button(page,'View on map')).to_be_visible()
    assert backend.inserts==2 and backend.records[0]['id']!=backend.records[1]['id']
    assert backend.records[0]['title']==backend.records[1]['title']
    assert not backend.blocked, backend.blocked
    page.screenshot(path=OUT+'/lost-response-retry.png',full_page=True)
    results.append({'id':'R1','status':'REPRODUCED','case':'Insert commits; response lost; user retries','observations_created':len(backend.records),'real_supabase_requests':0})
    print('REPRODUCED R1: retry after a lost insert response creates a second observation',flush=True)
    ctx.close()

    backend=Backend();ctx=context(backend);page=ctx.new_page()
    page.goto(BASE+'/reset-password?code=synthetic-recovery-a',wait_until='networkidle',timeout=90000)
    try: expect(page.get_by_text('Choose a new password.',exact=True)).to_be_visible()
    except Exception:
        print('Synthetic recovery requests:',backend.requests,flush=True)
        print('Blocked requests:',backend.blocked,flush=True)
        raise
    other=ctx.new_page();other.goto(BASE+'/account',wait_until='networkidle')
    # A second tab changes the shared Auth session while the first reset form stays open.
    button(other,'Sign out').click();expect(button(other,'Sign in')).to_be_visible()
    other.get_by_label('Email',exact=True).fill('b@example.test');other.get_by_label('Password',exact=True).fill('synthetic-password-b');button(other,'Sign in').click()
    expect(button(other,'Sign out')).to_be_visible()
    page.wait_for_function("JSON.parse(localStorage.getItem('sb-indraya-audit-auth-token')).user.id === '"+B+"'")
    page.get_by_label('New password',exact=True).fill('synthetic-new-password')
    page.get_by_label('Confirm password',exact=True).fill('synthetic-new-password')
    button(page,'Update password').click()
    expect(page.get_by_text('Password updated. You can return to Account.',exact=True)).to_be_visible()
    assert backend.password_updates==[B],backend.password_updates
    assert not backend.blocked,backend.blocked
    page.screenshot(path=OUT+'/recovery-session-switch.png',full_page=True)
    results.append({'id':'R2','status':'REPRODUCED','case':'Recovery opened for A, session changes to B','updated_actor':'synthetic B','real_supabase_requests':0})
    print('REPRODUCED R2: recovery form for A changes B after a shared-session account switch',flush=True)
    ctx.close()

    backend=Backend();ctx=context(backend);page=ctx.new_page()
    page.goto(BASE+'/report',wait_until='networkidle',timeout=90000)
    button(page,'Travel & Transportation').click()
    page.get_by_label('Find an observation type',exact=True).fill('black ice')
    button(page,'Black ice · Travel & Transportation').click()
    button(page,'Add a note · Optional').click()
    page.get_by_label('Description',exact=True).fill('SYNTHETIC private draft written by account A')
    button(page,'Continue').click()
    page.get_by_label('Search observation location',exact=True).fill('audit fixture');button(page,'Search').click();button(page,'SYNTHETIC audit trail').click();button(page,'Review observation').click()
    other=ctx.new_page();other.goto(BASE+'/account',wait_until='networkidle')
    button(other,'Sign out').click();expect(button(other,'Sign in')).to_be_visible()
    other.get_by_label('Email',exact=True).fill('b@example.test');other.get_by_label('Password',exact=True).fill('synthetic-password-b');button(other,'Sign in').click()
    expect(button(other,'Sign out')).to_be_visible()
    expect(page.get_by_text("Account changed. Draft autosave is paused; reopen sharing to recover this account's draft.",exact=True)).to_be_visible()
    button(page,'Share observation').click();expect(button(page,'View on map')).to_be_visible()
    assert len(backend.records)==1 and backend.records[0]['author_id']==B
    assert backend.records[0]['description']=='SYNTHETIC private draft written by account A'
    assert not backend.blocked,backend.blocked
    page.screenshot(path=OUT+'/draft-session-switch.png',full_page=True)
    results.append({'id':'R3','status':'REPRODUCED','case':'Account A draft stays shareable after session switches to B','saved_actor':'synthetic B','real_supabase_requests':0})
    print('REPRODUCED R3: A draft can be published under B after an account change',flush=True)
    ctx.close();browser.close()
    with open(OUT+'/characterizations.json','w') as f:json.dump(results,f,indent=2)
    print('Diagnostic completed: known defects reproduced, NOT release acceptance.')
