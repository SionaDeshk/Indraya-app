"""Build reviewed trip/site/milepost references from cached public-source snapshots.
Usage: python scripts/build-trip-index.py SNAPSHOT_DIRECTORY
Offline only; never calls Supabase or a public provider. See docs/trips-and-mileposts.md.
"""
from pathlib import Path
from collections import defaultdict
import datetime,json,math,sys
ROOT=Path(__file__).resolve().parents[1]
DOT_MILES='https://www.arcgis.com/home/item.html?id=ffa29b2c5b3147a4bc6dcdcfabd9eabc'
DOT_ROADS='https://www.arcgis.com/home/item.html?id=01584dde2adb444196c9e483d623f310'
FS_TRAILS='https://www.arcgis.com/home/item.html?id=0969eb1cbb2f4a1d861ee58fff587cc2'
FS_SITES='https://www.arcgis.com/home/item.html?id=3e16a3fae435443d9899b10d4ff26124'

def point(x,y):
    if not all(isinstance(n,(int,float)) and not isinstance(n,bool) and math.isfinite(n) for n in (x,y)) or not 51<=y<=72 or not (-180<=x<=-129.9 or 170<=x<=180):raise ValueError('Invalid Alaska coordinate')
    return [x,y]
def load(base,name):
    p=base/(name+'.json');data=json.loads(p.read_text())
    if data.get('error') or data.get('exceededTransferLimit'):raise ValueError('Incomplete source snapshot: '+name)
    return data,datetime.datetime.fromtimestamp(p.stat().st_mtime,datetime.timezone.utc).isoformat()
def paths(geometry):
    lines=[[point(p[0],p[1]) for p in line] for line in geometry['paths']]
    if not lines or any(len(line)<2 for line in lines):raise ValueError('Invalid line geometry')
    return lines
def bounds(lines):
    coords=[p for line in lines for p in line]
    return [min(p[0] for p in coords),min(p[1] for p in coords),max(p[0] for p in coords),max(p[1] for p in coords)]
def representative(lines):
    line=max(lines,key=len);return line[len(line)//2]

def main(base):
    places=[];shapes=[]
    def add(name,x,y,provider,ident,kind,context,terms,source,stamp,**extra):
        point(x,y)
        places.append(dict(name=name,longitude=x,latitude=y,provider=provider,placeId=ident,featureType=kind,context=context,state='Alaska',countryCode='US',focusZoom=12,retrievedAt=stamp,searchTerms=terms,sourceUrl=source,**extra))
    def line_place(name,ident,provider,lines,kind,context,terms,source,stamp,**extra):
        x,y=representative(lines)
        add(name,x,y,provider,ident,kind,context,terms,source,stamp,bounds=bounds(lines),coordinateMeaning='route_reference',**extra)
        shapes.append(dict(type='Feature',properties=dict(placeId=ident,name=name,sourceUrl=source,attribution='Alaska DOT&PF' if provider=='akdot' else 'USDA Forest Service',checkedAt=stamp,referenceKind='route'),geometry=dict(type='MultiLineString',coordinates=lines)))
    # Exact highway identities; reject similarly named Dalton Trail/Nondalton roads.
    roads,stamp=load(base,'dot_highways_generalized')
    approved={'1120000X000':'Denali Highway','1260000X000':'Dalton Highway'}
    for f in roads['features']:
        a=f['attributes'];name=approved.get(a['Route_ID'])
        if not name or a['Route_Name']!=name:raise ValueError('Unreviewed highway')
        roadterms=['driving','road','highway','milepost']+(['Cantwell','Paxson','Cantwell to Paxson','Denali Hwy'] if name=='Denali Highway' else ['Dalton Hwy','Haul Road','Coldfoot','Deadhorse'])
        line_place(name,'akdot:route:'+a['Route_ID'],'akdot',paths(f['geometry']),'highway','Cantwell–Paxson · DOT&PF mapped road' if name=='Denali Highway' else 'Elliott Highway–Deadhorse · DOT&PF mapped road',roadterms,'https://511.alaska.gov/',stamp)
    assert len(shapes)==2
    # Posted Milepost_Number is distinct from internal linear-referencing MPT.
    miles,stamp=load(base,'dot_mileposts_raw');selected={};excluded=defaultdict(int)
    for f in miles['features']:
        a=f['attributes'];road=approved.get(a['Route_ID'])
        if not road or a['Route_Name']!=road:raise ValueError('Wrong milepost highway')
        if a['Status']==2:excluded['inactive']+=1;continue
        if a['Status'] not in (1,3):raise ValueError('Unknown status code')
        if a['LocError'] not in (None,'','NO ERROR'):excluded['location_error']+=1;continue
        number=a['Milepost_Number']
        if not isinstance(number,(int,float)) or not math.isfinite(number) or number<0:raise ValueError('Invalid posted mile number')
        x,y=point(f['geometry']['x'],f['geometry']['y'])
        entry=dict(highway=road,milepost=number,longitude=x,latitude=y,id=a['Event_ID'].strip('{}').lower(),status='active' if a['Status']==1 else 'unknown',collectionYear=a['Collection_Year'])
        key=(road,number)
        previous=selected.get(key)
        # One source position per posted number; active records take precedence.
        if previous is None or (previous['status']=='unknown' and entry['status']=='active'):selected[key]=entry
    miledata=dict(source='State of Alaska, Department of Transportation & Public Facilities',dataset='Mileposts AKDOT',sourceUrl=DOT_MILES,checkedAt=stamp,records=sorted(selected.values(),key=lambda r:(r['highway'],r['milepost'])))
    # Forest Service government/CC0 site facts. Do not import stale open status or fees.
    sites,stamp=load(base,'usfs_chugach_raw')
    passcabins={'Caribou Creek Cabin','Fox Creek Cabin','East Creek Cabin',"Devil's Pass Cabin",'Swan Lake Cabin','Trout Lake Cabin','Juneau Lake Cabin','Romig Cabin'}
    for f in sites['features']:
        a=f['attributes'];name=a['recareaname']
        if 'Cabin' in name:kind='cabin';terms=['cabin','overnight','public use cabin','Chugach National Forest']
        elif 'Campground' in name:kind='campground';terms=['campground','campsite','camping','Chugach National Forest']
        else:continue
        x,y=point(float(a['longitude']),float(a['latitude']))
        if abs(f['geometry']['x']-x)>.001 or abs(f['geometry']['y']-y)>.001:raise ValueError('Site coordinate disagreement')
        if name in passcabins:terms+=['Resurrection Pass','multiday','backpacking']
        if name in ('Aspen Flats Cabin','Upper Russian Lake Cabin'):terms+=['Russian Lakes','multiday','backpacking']
        if name=='Resurrection River Cabin':terms+=['Resurrection River','multiday','backpacking']
        if name=='Dale Clemens Cabin':terms+=['Lost Lake','Seward']
        if name=='Crow Pass Cabin':terms+=['Crow Pass','Girdwood']
        add(name,x,y,'usfs','usfs:site:'+str(a['recareaid']),kind,'Chugach National Forest · check access/reservations',terms,a['recareaurl'],stamp,coordinateMeaning='site_reference')
    # Published maintained trail geometries. Keep summer/winter alignments separate.
    trails,stamp=load(base,'usfs_trails_raw');type_data,_=load(base,'usfs_trails_types')
    types={f['attributes']['trail_cn']:f['attributes']['trail_type'] for f in type_data['features']}
    groups=defaultdict(list)
    approved_trails={'5075.008121':'Resurrection Pass Trail','291010270':'Resurrection Pass Trail','5135.008121':'Johnson Pass Trail','286010270':'Johnson Pass Trail','5052.008121':'Lost Lake Trail','5054.008121':'Lost Lake Winter Trail','5069.008121':'Primrose Trail','288010270':'Primrose Trail','5081.008121':'Russian Lakes Trail','5078.008121':'Resurrection River Trail','5026.008121':"Devil's Creek Trail",'5101.008121':"Devil's Creek Winter Route",'5013.008121':'Carter Lake Trail','297010270':'Carter Lake Trail','5021.008121':'Crescent Creek Trail','5023.008121':'Crescent Lake Trail','5072.008121':'Ptarmigan Lake Trail'}
    for f in trails['features']:
        if f['attributes']['trail_cn'] in approved_trails:groups[f['attributes']['trail_cn']].append(f)
    for cn,parts in groups.items():
        winter=types[cn]=='SNOW';lines=[line for f in parts for line in paths(f['geometry'])]
        name=approved_trails[cn]+(' · winter alignment' if winter and 'Winter' not in approved_trails[cn] else '')
        terms=['trail','winter' if winter else 'summer','hiking' if not winter else 'ski','multiday','trail segment','Chugach National Forest']
        if any(word in name for word in ['Lost Lake','Primrose']):terms+=['Lost Lake–Primrose traverse','Lost Lake Primrose']
        if name.startswith('Resurrection Pass'):terms+=['Resurrection Pass','backpacking','cabins']
        line_place(name,'usfs:trail:'+cn,'usfs',lines,'winter_trail' if winter else 'hiking_trail','USFS winter alignment · check allowed use' if winter else 'USFS mapped trail · check seasonal access',terms,FS_TRAILS,stamp)
    # Reviewed map identities, independently linked to public operators.
    hut_rows=[
      (0,1217694677,'Mint Hut','Hatcher Pass / Talkeetna','https://www.mtnclubak.org/huts/mint-hut',['Gold Mint Hut','Rainery Hut','Bomber Traverse','ski traverse','alpine hut']),
      (1,1217694682,'Bomber Hut','Hatcher Pass / Talkeetna','https://www.mtnclubak.org/huts/bomber-hut',['Bomber Traverse','ski traverse','alpine hut']),
      (2,8600089330,'Snowbird Hut','Hatcher Pass / Talkeetna','https://americanalpineclub.org/snowbird-hut',['Bomber Traverse','ski traverse','alpine hut']),
      (3,1051140450,"Pichler's Perch",'Eklutna Traverse / Chugach','https://www.mtnclubak.org/huts/pichlers-perch',['Eklutna Traverse','glacier','ski traverse','Eklutna hut']),
      (4,1051138807,'Hans Hut','Eklutna Traverse / Chugach','https://www.mtnclubak.org/huts/hans-hut',["Hans' Hut",'Eklutna Traverse','Whiteout Glacier','ski traverse']),
      (5,1051140768,"Rosie's Roost",'Eklutna Traverse / Chugach','https://www.mtnclubak.org/huts/rosies-roost',['Eklutna Traverse','Eagle River','Eagle Glacier','ski traverse']),
      (6,1051141340,'Seth Holden Hut','Talkeetna Mountains','https://www.mtnclubak.org/huts/seth-holden-hut',['extended Bomber Traverse','alpine hut','ski traverse']),
      (8,1217694680,'Dnigi Hut','Moose Creek / Talkeetna','https://www.mtnclubak.org/huts/dnigi-hut',["D'nigi Hut",'alpine hut','ski traverse']),
      (9,12472766518,'Dolly Varden Cabin','Eklutna Lake','https://dnr.alaska.gov/parks/aspcabins/dollyvardencabin.htm',['Eklutna Lakeside Trail']),
      (10,8208509492,'Kokanee Cabin','Eklutna Lake','https://dnr.alaska.gov/parks/aspcabins/kokaneecabin.htm',['Eklutna Lakeside Trail']),
      (11,1348395172,'Rainbow Trout Cabin','Eklutna Lake','https://dnr.alaska.gov/parks/aspcabins/rainbowtroutcabin.htm',['Eklutna Lakeside Trail']),
      (12,8208509491,'Yuditna Cabin','Eklutna Lake','https://dnr.alaska.gov/parks/aspcabins/yuditnacabin.htm',['Eklutna Lakeside Trail']),
      (13,931539384,'Serenity Falls Hut','Eklutna Valley','https://dnr.alaska.gov/parks/aspcabins/serenityfallscabin.htm',['Eklutna','Eagle River','public use hut']),
      (18,6206938523,'Yukla Yurt','Eagle River Nature Center','https://www.ernc.org/facility-rentals#CabinandYurtRentals',['Eagle River','yurt','overnight']),
      (19,9135978829,'River Trail Yurt','Eagle River Nature Center','https://www.ernc.org/facility-rentals#CabinandYurtRentals',['Eagle River','yurt','overnight']),
      (20,6206938521,'Rapids Yurt','Eagle River Nature Center','https://www.ernc.org/facility-rentals#CabinandYurtRentals',['Rapids Camp Yurt','Eagle River','yurt','overnight']),
    ]
    def osm_add(file,osm_id,name,kind,context,source,terms,meaning='site_reference'):
        raw=json.loads((base/'geocode'/file).read_text())
        f=next(f for f in raw['response']['features'] if f['properties']['osm_id']==osm_id)
        p=f['properties'];x,y=f['geometry']['coordinates'];ident=f"osm:{p['osm_type']}:{osm_id}"
        add(name,x,y,'photon',ident,kind,context+' · check operator access',terms+[kind,context],source,raw['checkedAt'],coordinateMeaning=meaning)
    for i,ident,name,context,source,terms in hut_rows:
        osm_add(f'{i}.json',ident,name,'cabin' if name.endswith('Cabin') else 'yurt' if name.endswith('Yurt') else 'hut',context,source,terms+['overnight'])
    # Local summer trails outside the Forest Service route set: actual partial OSM ways.
    osm_segments,_=load_list(base,'osm_trail_segments')
    raw_index={}
    for p in (base/'geocode').glob('*.json'):
        raw=json.loads(p.read_text())
        for f in raw['response']['features']:raw_index[(f['properties']['osm_type'],f['properties']['osm_id'])]=(f,raw['checkedAt'])
    for record in osm_segments:
        ident=f"osm:W:{record['osm_id']}";f,stamp=raw_index[('W',record['osm_id'])];g=record['geojson']
        if g['type']!='LineString' or len(g['coordinates'])<2:raise ValueError('Unreviewed trail geometry')
        lines=[[point(*p[:2]) for p in g['coordinates']]]
        name=record['name'];winter='Ski' in name
        terms=['trail segment','winter' if winter else 'summer','ski' if winter else 'hiking','multiday']
        if 'Reed' in name or 'Gold Mint' in name:terms+=['Hatcher Pass','Bomber Traverse approach']
        if 'Eklutna' in name:terms+=['Eklutna Lake','Eklutna Traverse approach']
        if 'Kesugi' in name:terms+=['Kesugi Ridge','Denali State Park','backpacking']
        if 'Crow Pass' in name:terms+=['Eagle River','Girdwood','backpacking']
        line_place(name,ident,'photon',lines,'trail_segment','Partial mapped trail segment · not a complete traverse',terms,f"https://www.openstreetmap.org/way/{record['osm_id']}",stamp)
        shapes[-1]['properties']['attribution']='© OpenStreetMap contributors · ODbL 1.0'
        shapes[-1]['properties']['referenceKind']='segment'
    # Local loop systems are only the exact returned segments, not reconstructed loops.
    loop_records,stamp=load_list(base,'osm_loop_segments')
    loop_index={r['osm_id']:r for r in loop_records}
    for name,ident,object_ids,region,source in [
      ('Albert Loop Bypass Trail','osm:W:988929787',[988929787],'Eagle River Nature Center','https://www.ernc.org/'),
      ('Rodak Nature Loop','osm:W:988372784',[988372784],'Eagle River Nature Center','https://www.ernc.org/'),
      ('Dew Mound Trail','osm:W:1082373451',[1082373451],'Eagle River Nature Center','https://www.ernc.org/'),
      ('Byers Lake Loop Trail','osm:group:byers-lake-loop',[482115448,663648133],'Denali State Park','https://dnr.alaska.gov/parks/'),
      ('Reflections Lake Trail','osm:W:639557928',[639557928],'Palmer Hay Flats','https://www.adfg.alaska.gov/'),
    ]:
        lines=[]
        for oid in object_ids:
            g=loop_index[oid]['geojson']
            if g['type']!='LineString':raise ValueError('Unexpected loop segment geometry')
            lines.append([point(*p[:2]) for p in g['coordinates']])
        line_place(name,ident,'photon',lines,'trail_segment',region+' · partial mapped segment',['summer','hiking','loop','trail',region],source,stamp)
        shapes[-1]['properties'].update(attribution='© OpenStreetMap contributors · ODbL 1.0',referenceKind='segment',sourceObjects=object_ids)
    # Source-published pass and trailhead identities do not acquire imagined route lines.
    for i,ident,name,context,terms in [
      (34,8600086400,'Bomber Pass','Hatcher Pass / Talkeetna',['Bombers Pass','Bomber Traverse','ski traverse']),
      (35,8600089333,'Backdoor Gap','Hatcher Pass / Talkeetna',['Bomber Traverse','ski traverse']),
      (22,5504575306,'Resurrection Pass North Trailhead','Hope',['Resurrection Pass','trailhead','backpacking','multiday']),
      (23,264908612,'Resurrection Pass South Trailhead Parking','Cooper Landing',['Resurrection Pass','trailhead','backpacking','multiday']),
      (24,9926262862,'Lost Lake Trailhead','Seward',['Lost Lake','Primrose traverse','trailhead','hiking']),
      (25,4359139147,'Primrose Trailhead','Kenai Peninsula',['Lost Lake','Primrose traverse','trailhead','hiking']),
      (29,7815570692,'Reed Lakes Trailhead','Hatcher Pass',['Bomber Traverse','trailhead','hiking']),
      (30,7815560445,'Gold Mint Trailhead','Hatcher Pass',['Bomber Traverse','trailhead','hiking']),
    ]:osm_add(f'{i}.json',ident,name,'mountain_pass' if i in (34,35) else 'trailhead',context,'https://www.mtnclubak.org/huts/inventory' if i in (34,35,29,30) else FS_TRAILS,terms)
    # Reviewed public campgrounds; no individual campsite assignments/availability.
    for i,ident,name,context,source in [
      (0,1233897963,'Five Mile Campground','Dalton Highway','https://www.blm.gov/visit/dalton-highway'),
      (1,617702890,'Arctic Circle Campground','Dalton Highway','https://www.blm.gov/visit/dalton-highway'),
      (2,617957681,'Marion Creek Campground','Dalton Highway / Coldfoot','https://www.blm.gov/visit/dalton-highway'),
      (3,673516353,'Galbraith Lake Campground','Dalton Highway / Brooks Range','https://www.blm.gov/visit/dalton-highway'),
      (5,295329768,'Brushkana Creek Campground','Denali Highway','https://www.blm.gov/visit/denali-highway'),
      (6,258956205,'Paxson Lake Campground','Richardson Highway / Paxson','https://www.blm.gov/visit/paxson-lake-campground'),
      (6,230766198,'Tangle Lakes Campground','Denali Highway','https://www.blm.gov/visit/denali-highway'),
      (7,523991079,'Eagle River Campground','Eagle River','https://dnr.alaska.gov/parks/units/campsitelist.htm'),
      (8,573129755,'Eklutna Lake Campground','Eklutna Lake','https://dnr.alaska.gov/parks/units/campsitelist.htm'),
      (9,361230316,'Bird Creek Campground','Turnagain Arm','https://dnr.alaska.gov/parks/units/campsitelist.htm'),
      (10,509141314,"K'esugi Ken Campground",'Denali State Park','https://dnr.alaska.gov/parks/units/campsitelist.htm'),
      (11,296103298,'Byers Lake Campground','Denali State Park','https://dnr.alaska.gov/parks/units/campsitelist.htm'),
    ]:osm_add(f'camp-{i}.json',ident,name,'campground',context,source,['camping','campsite','summer','driving','overnight'])
    ids=[r['placeId'] for r in places]
    # A loop search finds published stops/approaches, not an invented loop line.
    for place in places:
        if any('Bomber Traverse' in term for term in place['searchTerms']):
            place['searchTerms'].append('Bomber loop')
    if len(ids)!=len(set(ids)):raise ValueError('Duplicate place identities')
    if len(shapes)>40 or sum(len(p) for s in shapes for p in s['geometry']['coordinates'])>20000:raise ValueError('Review geometry budget')
    (ROOT/'data/trip-places.json').write_text(json.dumps(sorted(places,key=lambda r:(r['name'],r['placeId'])),indent=2)+'\n')
    (ROOT/'data/highway-mileposts.json').write_text(json.dumps(miledata,separators=(',',':'))+'\n')
    (ROOT/'data/route-geometries.json').write_text(json.dumps(dict(type='FeatureCollection',features=shapes),separators=(',',':'))+'\n')
    print('Built',len(places),'trip/site references,',len(shapes),'route/segment geometries and',len(selected),'source milepost positions. Excluded:',dict(excluded))
def load_list(base,name):
    p=base/(name+'.json');return json.loads(p.read_text()),datetime.datetime.fromtimestamp(p.stat().st_mtime,datetime.timezone.utc).isoformat()
if __name__=='__main__':main(Path(sys.argv[1]))
