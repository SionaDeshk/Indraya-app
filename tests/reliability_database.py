"""Disposable local Docker/PostGIS integration and concurrent replay checks.
Never reads Supabase credentials, URLs or connects to a hosted database.
Creates a dedicated database and fails if it already exists.
"""
import pathlib,subprocess,os,time,json,datetime,argparse
parser=argparse.ArgumentParser()
parser.add_argument('--container',required=True,help='Disposable local PostGIS container only')
args=parser.parse_args()
root=pathlib.Path(__file__).resolve().parents[1];env=os.environ.copy()
for k in ['DOCKER_HOST','DOCKER_CONTEXT','DOCKER_TLS','DOCKER_TLS_VERIFY','DOCKER_CERT_PATH']:env.pop(k,None)
base=['docker','--host=unix:///var/run/docker.sock','exec','-i',args.container]
for i in range(25):
 if subprocess.run(base+['pg_isready','-U','postgres'],env=env,stdout=subprocess.DEVNULL).returncode==0:break
 time.sleep(1)
subprocess.run(base+['createdb','-U','postgres','-T','template0','indraya_reliability'],env=env,check=True)
def run(s,check=True):
 r=subprocess.run(base+['psql','-U','postgres','-d','indraya_reliability','-v','ON_ERROR_STOP=1','-At'],input=s,text=True,capture_output=True,env=env)
 if check and r.returncode:raise RuntimeError(r.stderr)
 return r
with open('/tmp/indraya-reliability-sql.log','w') as log:
 def sql(s):
  r=run(s);log.write(r.stdout+r.stderr);log.flush();return r.stdout
 existing=run("select count(*) from pg_roles where rolname in ('anon','authenticated')").stdout.strip()
 bootstrap=(root/'supabase/tests/bootstrap.sql').read_text()
 if existing=='2':bootstrap='\n'.join(l for l in bootstrap.splitlines() if not l.startswith('create role'))
 sql(bootstrap)
 for p in sorted((root/'supabase/migrations').glob('*.sql')):sql('begin;\n'+p.read_text()+'\ncommit;')
 for name in ['rls','report_details','guided_observations','private_video','lifecycle','idempotent_submissions']:sql((root/f'supabase/tests/{name}.sql').read_text())
 print('PASS: fresh seven-migration install and all six SQL suites',flush=True)
# Two simultaneous connections simulate a replay arriving before the first commit.
run("insert into auth.users values('00000000-0000-0000-0000-000000000099');")
payload={'category':'Travel','kind':'road','title':'Concurrent synthetic ice','description':'','latitude':61.22,'longitude':-149.9,'place_name':'Synthetic place','observed_at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'details':{},'extent':None,'taxonomy_version':2,'domain_id':'travel','topic_id':'travel.surface','event_type_id':'black_ice','related_type_ids':[],'answers':{}}
body="begin; set local role authenticated; select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000099',true); select id from submit_observation('99999999-9999-4999-8999-999999999999',"+"'"+json.dumps(payload).replace("'","''")+"'::jsonb);"
cmd=base+['psql','-U','postgres','-d','indraya_reliability','-v','ON_ERROR_STOP=1','-At']
p=subprocess.Popen(cmd,stdin=subprocess.PIPE,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True,env=env)
p.stdin.write(body+'select pg_sleep(1);commit;');p.stdin.close()
time.sleep(.15)
r=run(body+'commit;');p.wait();first=p.stdout.read();err=p.stderr.read();assert p.returncode==0,err
ids=lambda s:[l for l in s.splitlines() if len(l)==36 and l.count('-')==4 and l!='00000000-0000-0000-0000-000000000099']
assert ids(first)==ids(r.stdout),(first,r.stdout)
assert run("select count(*) from observations where author_id='00000000-0000-0000-0000-000000000099'").stdout.strip()=='1'
print('PASS: concurrent same-actor replay returns one ID and creates one observation',flush=True)
