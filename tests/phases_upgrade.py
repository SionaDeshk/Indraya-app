"""Disposable Docker/PostGIS upgrade test. Never connects to Supabase or reads credentials.
Run after bootstrap roles exist: python tests/phases_upgrade.py --container YOUR_TEST_CONTAINER
Fails safely if its dedicated test database already exists.
"""
import subprocess,pathlib,json,argparse
root=pathlib.Path(__file__).resolve().parents[1]
parser=argparse.ArgumentParser()
parser.add_argument('--container',required=True,help='Disposable local PostGIS test container only')
container=parser.parse_args().container
subprocess.run(['docker','exec',container,'createdb','-U','postgres','-T','template0','indraya_phase_upgrade'],check=True)
def sql(body):
 result = subprocess.run(['docker','exec','-i',container,'psql','-U','postgres','-d','indraya_phase_upgrade','-v','ON_ERROR_STOP=1','-At'],input=body,text=True,capture_output=True)
 if result.returncode: raise RuntimeError(result.stderr)
 return result.stdout.strip()
bootstrap='\n'.join(l for l in (root/'supabase/tests/bootstrap.sql').read_text().splitlines() if not l.startswith('create role'))
sql(bootstrap)
files=sorted((root/'supabase/migrations').glob('*.sql'))
for f in files[:3]: sql('begin;\n'+f.read_text()+'\ncommit;')
sql('''insert into auth.users values('00000000-0000-0000-0000-000000000001');
alter table observations disable trigger user;
insert into observations(id,author_id,category,title,description,latitude,longitude,status,verification,created_at,updated_at,observed_at,kind,taxonomy_version,domain_id,topic_id,event_type_id) values
('11111111-1111-1111-1111-111111111111','00000000-0000-0000-0000-000000000001','Travel','Legacy published fixture','FICTIONAL upgrade fixture.',61.22,-149.90,'published','reviewed','2025-01-01','2025-02-01','2025-01-01','road',1,'travel','travel.surface','road_condition'),
('22222222-2222-2222-2222-222222222222','00000000-0000-0000-0000-000000000001','Travel','Legacy hidden fixture','FICTIONAL upgrade fixture.',61.22,-149.90,'hidden','unverified','2025-01-01','2025-02-01','2025-01-01','road',1,'travel','travel.surface','road_condition'),
('33333333-3333-3333-3333-333333333333','00000000-0000-0000-0000-000000000001','Travel','Legacy held fixture','FICTIONAL upgrade fixture.',61.22,-149.90,'review','unverified','2025-01-01','2025-02-01','2025-01-01','road',1,'travel','travel.surface','road_condition');
alter table observations enable trigger user;
insert into observation_media(observation_id,storage_path) values('11111111-1111-1111-1111-111111111111','upgrade-photo.jpg');''')
def rows(table):return json.loads(sql(f'select coalesce(jsonb_agg(to_jsonb(t) order by id),\'[]\'::jsonb) from {table} t;'))
before={t:rows(t) for t in ['observations','observation_media']}
for f in files[3:]:
 sql('begin;\n'+f.read_text()+'\ncommit;')
 print('Applied to disposable upgrade DB:',f.name)
for t,old in before.items():
 new=rows(t)
 assert len(old)==len(new)
 for a,b in zip(old,new):assert all(b[k]==v for k,v in a.items()),(t,a,b)
assert all(x['expires_at'] is not None for x in rows('observations'))
print('PASS: populated three-to-six migration upgrade preserves every original observation/media column, status, owner, timestamps, text and attachment association; expiry backfilled.')
