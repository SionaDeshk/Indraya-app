"""Build finite reviewed OSM reference outlines from an archived Overpass JSON file.
Usage: python scripts/build-place-outlines.py INPUT.json
No network requests. Public Overpass is not an application backend.
"""
import json,sys,pathlib
raw=json.load(open(sys.argv[1]))
# Preserve later independently reviewed geometry when regenerating this historical subset.
existing=pathlib.Path('data/place-outlines.json')
features=json.loads(existing.read_text())['features'] if existing.exists() else []
for e in raw['elements']:
    if (e['type'],e['id']) not in [('way',49200373),('relation',8921978)]:continue
    def points(g):return [[p['lon'],p['lat']] for p in g]
    if e['type']=='way':rings=[points(e['geometry'])]
    else:
        assert all(m['type']=='way' and m['role']=='outer' for m in e['members']), 'Review inner rings before rebuilding'
        segments=[points(m['geometry']) for m in e['members']];rings=[]
        while segments:
            ring=segments.pop(0)
            while ring[0]!=ring[-1]:
                matches=[(i,g) for i,g in enumerate(segments) if ring[-1] in (g[0],g[-1])]
                assert len(matches)==1, 'Incomplete or ambiguous geometry'
                i,g=matches[0];segments.pop(i)
                if g[-1]==ring[-1]:g=g[::-1]
                ring+=g[1:]
            rings.append(ring)
    assert all(len(r)>=4 and r[0]==r[-1] for r in rings)
    source_id=f"osm:{'W' if e['type']=='way' else 'R'}:{e['id']}"
    features=[f for f in features if f['properties']['placeId']!=source_id]
    features.append({'type':'Feature','properties':{'placeId':f"osm:{'W' if e['type']=='way' else 'R'}:{e['id']}",'name':e['tags']['name'],'featureType':e['tags'].get('water',e['tags'].get('natural')),'sourceUrl':f"https://www.openstreetmap.org/{e['type']}/{e['id']}",'checkedAt':'2026-11-10','attribution':'© OpenStreetMap contributors · ODbL 1.0'},'geometry':{'type':'MultiPolygon','coordinates':[[r] for r in rings]}})
pathlib.Path('data/place-outlines.json').write_text(json.dumps({'type':'FeatureCollection','features':features},separators=(',',':'))+'\n')
print('Built',len(features),'reviewed mapped features')
