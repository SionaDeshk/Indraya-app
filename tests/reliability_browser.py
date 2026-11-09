"""Release regression acceptance using intercepted synthetic Auth/REST only.
Use the fictional API server documented in release-reliability-handoff.md.
"""
import os,json,time
from playwright.sync_api import sync_playwright,expect
from release_audit_browser import Backend,session,BASE,KEY,A,B,API
import shutil
OUT=os.environ.get('INDRAYA_RELIABILITY_OUTPUT','/tmp/indraya-reliability')
os.makedirs(OUT,exist_ok=True)

class ReliableBackend(Backend):
    def __init__(self):
        super().__init__();self.receipts={};self.calls=[];self.token_requests=0;self.offline=False
    def route(self,route):
        request=route.request
        from urllib.parse import urlparse
        parsed=urlparse(request.url)
        if parsed.hostname==API and parsed.path=='/rest/v1/observation_feed':
            if self.offline:return route.abort('internetdisconnected')
            return route.fulfill(json=[r for r in self.records if r.get('status')=='published'])
        if parsed.hostname==API and parsed.path=='/auth/v1/token':
            self.token_requests+=1
            if request.post_data_json.get('auth_code')=='expired':return route.fulfill(status=400,json={'error':'invalid_grant','error_description':'Synthetic expired code'})
        if parsed.hostname==API and parsed.path=='/rest/v1/rpc/submit_observation':
            data=request.post_data_json;key=data['request_id'];payload=data['payload'];self.calls.append(key)
            if key not in self.receipts:
                self.inserts+=1
                from release_audit_browser import actor_for
                import datetime
                record=dict(payload,id='11111111-1111-4111-8111-'+str(self.inserts).zfill(12),author_id=actor_for(request),status='published',privacy_class='approximate',verification='unverified',created_at=datetime.datetime.now(datetime.timezone.utc).isoformat())
                self.records.append(record);self.receipts[key]=(payload,record)
                if self.drop_first:return route.abort('connectionreset')
            old,record=self.receipts[key]
            assert old==payload, (old,payload)
            return route.fulfill(json=[{'id':record['id'],'status':record['status']}])
        return super().route(route)

def button(page,name):return page.get_by_role('button',name=name,exact=True).or_(page.get_by_role('radio',name=name,exact=True))
def ctx_for(browser,backend):
    ctx=browser.new_context(viewport={'width':390,'height':844});ctx.route('**/*',backend.route)
    ctx.add_init_script("""if (!sessionStorage.getItem('audit-seeded')) {
        if (!localStorage.getItem(%s)) localStorage.setItem(%s,%s);
        localStorage.setItem(%s,JSON.stringify('synthetic-verifier/PASSWORD_RECOVERY'));
        sessionStorage.setItem('audit-seeded','yes');
    }"""%(json.dumps(KEY),json.dumps(KEY),json.dumps(json.dumps(session(A))),json.dumps(KEY+'-code-verifier')))
    return ctx

def switch_to_b(ctx):
    other=ctx.new_page();other.goto(BASE+'/account',wait_until='networkidle')
    button(other,'Sign out').click();expect(button(other,'Sign in')).to_be_visible()
    other.get_by_label('Email',exact=True).fill('b@example.test');other.get_by_label('Password',exact=True).fill('synthetic-password-b');button(other,'Sign in').click();expect(button(other,'Sign out')).to_be_visible()
    return other

def form_to_review(page,note=''):
    page.goto(BASE+'/report',wait_until='networkidle',timeout=90000)
    button(page,'Travel & Transportation').click();page.get_by_label('Find an observation type',exact=True).fill('black ice');button(page,'Black ice · Travel & Transportation').click()
    if note:button(page,'Add a note · Optional').click();page.get_by_label('Description',exact=True).fill(note)
    button(page,'Continue').click();page.get_by_label('Search observation location',exact=True).fill('audit fixture');button(page,'Search').click();button(page,'SYNTHETIC audit trail').click();button(page,'Review observation').click()

with sync_playwright() as p:
    browser=p.chromium.launch(executable_path=shutil.which('chromium'),headless=True,args=['--no-sandbox'])
    # A committed save whose response is lost survives a complete page restart.
    backend=ReliableBackend();backend.drop_first=True;ctx=ctx_for(browser,backend);page=ctx.new_page()
    form_to_review(page,'Synthetic retry note');button(page,'Share observation').click()
    expect(page.get_by_text('Save not confirmed. Your draft is kept. Retry to check the same observation; do not start a duplicate.',exact=True)).to_be_visible()
    assert len(backend.records)==1
    expect(button(page,'Edit observation')).to_be_disabled()
    page.reload(wait_until='networkidle');expect(button(page,'Discard draft')).to_have_count(0);button(page,'Continue draft').click();expect(button(page,'Edit observation')).to_be_disabled();button(page,'Share observation').click();expect(button(page,'View on map')).to_be_visible()
    assert len(backend.records)==1 and len(backend.calls)==2 and len(set(backend.calls))==1
    page.screenshot(path=OUT+'/idempotent-retry.png',full_page=True)
    assert not backend.blocked;ctx.close();print('PASS: lost response + restart + retry preserves one observation and one request ID',flush=True)
    # Normal same-account recovery still succeeds.
    backend=ReliableBackend();ctx=ctx_for(browser,backend);page=ctx.new_page();page.goto(BASE+'/reset-password?code=synthetic-a',wait_until='networkidle')
    expect(page.get_by_text('Choose a new password.',exact=True)).to_be_visible();page.get_by_label('New password',exact=True).fill('new-synthetic-password');page.get_by_label('Confirm password',exact=True).fill('new-synthetic-password');button(page,'Update password').click();expect(page.get_by_text('Password updated. You can return to Account.',exact=True)).to_be_visible();assert backend.password_updates==[A];assert not backend.blocked;ctx.close();print('PASS: same-actor recovery succeeds',flush=True)
    # Switching account invalidates recovery and clears both password inputs.
    backend=ReliableBackend();ctx=ctx_for(browser,backend);page=ctx.new_page();page.goto(BASE+'/reset-password?code=synthetic-a',wait_until='networkidle');expect(page.get_by_text('Choose a new password.',exact=True)).to_be_visible()
    page.get_by_label('New password',exact=True).fill('must-be-cleared');switch_to_b(ctx)
    expect(page.get_by_text('Account changed. Request a new recovery link for the account you want to update.',exact=True)).to_be_visible();expect(page.get_by_label('New password',exact=True)).to_have_count(0);expect(button(page,'Update password')).to_have_count(0);assert backend.password_updates==[]
    page.screenshot(path=OUT+'/recovery-boundary.png',full_page=True);assert not backend.blocked;ctx.close();print('PASS: A→B cannot use the old recovery form',flush=True)
    # Expired callback gives no password form and no write.
    backend=ReliableBackend();ctx=ctx_for(browser,backend);page=ctx.new_page();page.goto(BASE+'/reset-password?code=expired',wait_until='networkidle');expect(page.get_by_text('This recovery link is invalid or expired.',exact=False)).to_be_visible();expect(button(page,'Update password')).to_have_count(0);assert backend.password_updates==[];assert not backend.blocked;ctx.close();print('PASS: expired recovery callback is read-only',flush=True)
    # A's private content is cleared/blocked when the session changes, not sent as B.
    backend=ReliableBackend();ctx=ctx_for(browser,backend);page=ctx.new_page();form_to_review(page,'SYNTHETIC account A private note');switch_to_b(ctx)
    expect(page.get_by_text('Account changed. This form is locked',exact=False)).to_be_visible();expect(button(page,'Share observation')).to_have_count(0);expect(page.get_by_text('SYNTHETIC account A private note',exact=False)).to_have_count(0);assert backend.records==[]
    raw=page.evaluate("localStorage.getItem('indraya.draft.v1.'+"+json.dumps(A)+")");assert raw and json.loads(raw)['value']['description']=='SYNTHETIC account A private note'
    page.screenshot(path=OUT+'/draft-boundary.png',full_page=True);assert not backend.blocked;ctx.close();print('PASS: A→B clears and locks sharing; A draft remains account-scoped',flush=True)
    # A same-actor token refresh must not invalidate an open form.
    backend=ReliableBackend();ctx=ctx_for(browser,backend);page=ctx.new_page();form_to_review(page,'Synthetic unchanged actor')
    page.evaluate("s => { localStorage.setItem('sb-indraya-audit-auth-token',JSON.stringify(s)); const c=new BroadcastChannel('sb-indraya-audit-auth-token'); c.postMessage({event:'TOKEN_REFRESHED',session:s}); setTimeout(()=>c.close(),100); }",session(A))
    button(page,'Share observation').click();expect(button(page,'View on map')).to_be_visible();assert len(backend.records)==1;assert not backend.blocked;ctx.close();print('PASS: same-actor token refresh preserves a valid sharing form',flush=True)
    # Private owner details disappear on sign-out, including an open modal.
    backend=ReliableBackend()
    import datetime
    backend.records=[{'id':'11111111-1111-4111-8111-000000000099','author_id':A,'title':'SYNTHETIC private owner content','description':'SYNTHETIC private note must disappear','category':'Safety','kind':'hazard','domain_id':'safety','topic_id':'safety.public','event_type_id':'gunfire_heard','taxonomy_version':2,'answers':{},'related_type_ids':[],'latitude':61,'longitude':-150,'status':'review','privacy_class':'restricted','verification':'unverified','created_at':datetime.datetime.now(datetime.timezone.utc).isoformat()}]
    ctx=ctx_for(browser,backend);page=ctx.new_page();page.goto(BASE+'/my-reports?observation=11111111-1111-4111-8111-000000000099',wait_until='networkidle')
    expect(page.get_by_text('SYNTHETIC private note must disappear',exact=True)).to_be_visible()
    switch_to_b(ctx);expect(page.get_by_text('Account changed. Reopen My observations for the current account.',exact=True)).to_be_visible();expect(page.get_by_text('SYNTHETIC private note must disappear',exact=True)).to_have_count(0);assert not backend.blocked;ctx.close();print('PASS: account change removes open private owner details',flush=True)
    backend=ReliableBackend()
    import datetime
    backend.records=[{'id':'11111111-1111-4111-8111-000000000099','author_id':A,'title':'SYNTHETIC saved public ice','description':'','category':'Travel','kind':'road','latitude':61.22,'longitude':-149.9,'status':'published','privacy_class':'approximate','verification':'unverified','created_at':datetime.datetime.now(datetime.timezone.utc).isoformat()}]
    ctx=ctx_for(browser,backend);page=ctx.new_page();page.goto(BASE,wait_until='networkidle')
    page.wait_for_function("localStorage.getItem('indraya.public-snapshot.v1.https://indraya-audit.supabase.co')!==null")
    backend.offline=True;page.reload(wait_until='networkidle')
    expect(page.get_by_text('Saved snapshot · limited coverage · saved',exact=False)).to_be_visible(timeout=15000)
    button(page,'Expand nearby activity').click();expect(button(page,'SYNTHETIC saved public ice')).to_be_visible()
    expect(page.get_by_text('Showing saved observations only.',exact=False)).to_be_visible()
    page.screenshot(path=OUT+'/offline-snapshot.png',full_page=True);assert not backend.blocked;ctx.close();print('PASS: network failure uses labeled public snapshot without fictional fallback',flush=True)
    backend=ReliableBackend();backend.drop_first=True;ctx=ctx_for(browser,backend);page=ctx.new_page();form_to_review(page);button(page,'Share observation').click()
    expect(page.get_by_text('Save not confirmed. Your draft is kept.',exact=False)).to_be_visible();backend.records[0]['status']='hidden'
    button(page,'Share observation').click();expect(page.get_by_role('heading',name='Observation is hidden',exact=True)).to_be_visible();expect(button(page,'View status')).to_be_visible();assert len(backend.records)==1;assert not backend.blocked;ctx.close();print('PASS: uncertain retry respects a subsequent moderation hide',flush=True)
    browser.close()
    print('PASS: synthetic release reliability scenarios; zero real Supabase requests')
