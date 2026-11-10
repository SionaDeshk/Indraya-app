"""Import a finite, manually reviewed Nominatim lookup snapshot, offline.
Usage: python scripts/import-place-geometries.py SNAPSHOT.json
No runtime/public-service dependency. See docs/geographic-expansion.md for policy,
request parameters, independent reference checks and honest area/point meanings.
"""
import json, math, pathlib, sys
APPROVED = {
    ('way',1343608838),('relation',12188016),('relation',18433834),
    ('way',913965341),('relation',12545836),('relation',21378422),
    ('way',71432763),('relation',2375186),('relation',17075573),
    ('relation',16928071),('relation',18432255),('relation',2896634),
    ('relation',1527882),('relation',1555333),('way',111498564),
    ('way',111498561),('way',232970776),('way',233086494),('way',74719477)}

def validate_geometry(geometry):
    kind=geometry.get('type')
    if kind not in ('Polygon','MultiPolygon'):raise ValueError('Area geometry required')
    polygons=geometry['coordinates'] if kind=='MultiPolygon' else [geometry['coordinates']]
    count=0
    if not polygons:raise ValueError('Empty geometry')
    for polygon in polygons:
        if not polygon:raise ValueError('Empty polygon')
        for ring in polygon:
            if len(ring)<4 or ring[0]!=ring[-1] or len({tuple(p) for p in ring})<3:
                raise ValueError('Invalid ring; do not guess a closing segment')
            for point in ring:
                if len(point)!=2 or not all(isinstance(n,(int,float)) and not isinstance(n,bool) and math.isfinite(n) for n in point):raise ValueError('Invalid coordinate')
                if not -180<=point[0]<=-129.9 or not 51<=point[1]<=72:raise ValueError('Outside reviewed Alaska region')
                count+=1
    if count>20000:raise ValueError('Review geometry size before bundling')
    return count

def main():
    path=pathlib.Path('data/place-outlines.json');collection=json.loads(path.read_text())
    index={f['properties']['placeId']:f for f in collection['features']}
    raw=json.loads(pathlib.Path(sys.argv[1]).read_text());seen=set()
    for record in raw:
        if (record['osm_type'],record['osm_id']) not in APPROVED:raise ValueError('Unreviewed feature')
        kind=record['osm_type'];ident=record['osm_id']
        if kind not in ('way','relation'):raise ValueError('Unreviewed identity type')
        source_id=f"osm:{'W' if kind=='way' else 'R'}:{ident}"
        if source_id in seen:raise ValueError('Duplicate identity')
        seen.add(source_id)
        geometry=record['geojson'];validate_geometry(geometry)
        index[source_id]={'type':'Feature','properties':{
            'placeId':source_id,'name':record['name'],'featureType':record['type'],
            'sourceUrl':f'https://www.openstreetmap.org/{kind}/{ident}',
            'checkedAt':'2026-11-10','attribution':'© OpenStreetMap contributors · ODbL 1.0',
            'geometryProvider':'Nominatim finite lookup','simplificationDegrees':0.00005},
            'geometry':geometry}
    features=sorted(index.values(),key=lambda f:f['properties']['placeId'])
    if sum(validate_geometry(f['geometry']) for f in features)>50000:raise ValueError('Review total geometry budget')
    path.write_text(json.dumps({'type':'FeatureCollection','features':features},separators=(',',':'))+'\n')
    print('Validated',len(features),'mapped area outlines, including all returned holes and components')
if __name__=='__main__':main()
