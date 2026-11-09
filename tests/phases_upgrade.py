"""Disposable Docker/PostGIS upgrade test. Never connects to Supabase or reads credentials.
Run after bootstrap roles exist: python tests/phases_upgrade.py --container YOUR_TEST_CONTAINER
Fails safely if its dedicated test database already exists.
"""
import subprocess,pathlib,json,argparse
root=pathlib.Path(__file__).resolve().parents[1]
parser=argparse.ArgumentParser()
parser.add_argument('--container',required=True,help='Disposable local PostGIS test container only')
parser.add_argument('--applied-count',type=int,default=3,choices=[3,6],help='Already-applied baseline to rehearse')
args=parser.parse_args()
container=args.container
baseline=args.applied_count
database=f"indraya_phase_upgrade_{baseline}"
subprocess.run(['docker','exec',container,'createdb','-U','postgres','-T','template0',database],check=True)
def sql(body):
 result = subprocess.run(['docker','exec','-i',container,'psql','-U','postgres','-d',database,'-v','ON_ERROR_STOP=1','-At'],input=body,text=True,capture_output=True)
 if result.returncode: raise RuntimeError(result.stderr)
 return result.stdout.strip()
bootstrap='\n'.join(l for l in (root/'supabase/tests/bootstrap.sql').read_text().splitlines() if not l.startswith('create role'))
sql(bootstrap)
files=sorted((root/'supabase/migrations').glob('*.sql'))
for f in files[:baseline]: sql('begin;\n'+f.read_text()+'\ncommit;')
sql("insert into auth.users values('00000000-0000-0000-0000-000000000001');")
for i in [1,2,3]:
 sql(f"insert into observations(id,author_id,category,kind,title,description,latitude,longitude,observed_at,taxonomy_version,domain_id,topic_id,event_type_id,answers) values('{str(i)*8}-{str(i)*4}-{str(i)*4}-{str(i)*4}-{str(i)*12}','00000000-0000-0000-0000-000000000001','Travel','road','Legacy fixture {i}','FICTIONAL upgrade fixture.',61.22,-149.90,now(),1,'travel','travel.surface','road_condition','{{}}');")
sql("alter table observations disable trigger user;")
sql("update observations set created_at='2025-01-01',updated_at='2025-02-01',status=case id::text when '22222222-2222-2222-2222-222222222222' then 'hidden' when '33333333-3333-3333-3333-333333333333' then 'review' else 'published' end;")
sql("alter table observations enable trigger user;")
sql("insert into observation_media(observation_id,storage_path) values('11111111-1111-1111-1111-111111111111','upgrade-photo.jpg');")
def rows(table):return json.loads(sql(f'select coalesce(jsonb_agg(to_jsonb(t) order by id),\'[]\'::jsonb) from {table} t;'))
before={t:rows(t) for t in ['observations','observation_media']}
for f in files[baseline:]:
 sql('begin;\n'+f.read_text()+'\ncommit;')
 print('Applied to disposable upgrade DB:',f.name)
for t,old in before.items():
 new=rows(t)
 assert len(old)==len(new)
 for a,b in zip(old,new):assert all(b[k]==v for k,v in a.items()),(t,a,b)
assert all(x['expires_at'] is not None for x in rows('observations'))
print(f'PASS: populated baseline {baseline} upgrade preserves every original observation/media column, status, owner, timestamps, text and attachment association; expiry remains populated.')
