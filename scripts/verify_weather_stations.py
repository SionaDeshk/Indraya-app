"""Read-only NWS station discovery. No credentials, scraping or app integration.
Live endpoint/coverage/terms validation is still required. Uses public place
coordinates rounded to 2 decimals; never reads device GPS or Supabase settings.
"""
import argparse
import datetime as dt
import json
import math
import urllib.parse
import urllib.request

AGENT = 'Indraya source validation (https://github.com/SionaDeshk/Indraya-app)'
HOST = 'api.weather.gov'

def trusted_url(url):
    p = urllib.parse.urlparse(url)
    if p.scheme != 'https' or p.hostname != HOST or p.username or p.password or p.port not in (None,443):
        raise ValueError('Provider returned an untrusted URL')
    if not p.path.startswith(('/points/','/stations/','/gridpoints/')):
        raise ValueError('Unexpected NWS discovery path')
    return url

class TrustedRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        trusted_url(newurl)
        return super().redirect_request(req, fp, code, msg, headers, newurl)

def get_json(url):
    trusted_url(url)
    request = urllib.request.Request(url,headers={'User-Agent':AGENT,'Accept':'application/geo+json,application/json'})
    with urllib.request.build_opener(TrustedRedirect()).open(request,timeout=20) as response:
        raw=response.read(2_000_001)
        if len(raw)>2_000_000:raise ValueError('Provider response exceeds research limit')
        return json.loads(raw)

def finite(value):
    return isinstance(value,(int,float)) and not isinstance(value,bool) and math.isfinite(value)

def measurement(raw):
    if not isinstance(raw,dict):return {'value':None,'unit':None}
    value=raw.get('value')
    return {'value':value if finite(value) else None,'unit':raw.get('unitCode') if isinstance(raw.get('unitCode'),str) else None,'quality_control':raw.get('qualityControl')}

def wind_mph(raw):
    m=measurement(raw)
    factors={'wmoUnit:km_h-1':0.6213711922,'wmoUnit:m_s-1':2.2369362921,'wmoUnit:kn':1.150779448}
    return round(m['value']*factors[m['unit']],1) if m['value'] is not None and m['value']>=0 and m['unit'] in factors else None

def distance(a,b):
    lat1,lon1,lat2,lon2=map(math.radians,(*a,*b))
    v=math.sin((lat2-lat1)/2)**2+math.cos(lat1)*math.cos(lat2)*math.sin((lon2-lon1)/2)**2
    return round(6371*2*math.asin(math.sqrt(min(1,max(0,v)))),1)

def discover(lat,lon,limit=3,fetch=get_json,now=None):
    if not finite(lat) or not finite(lon) or not 51<=lat<=72 or not (-180<=lon<=-129 or 172<=lon<=180):
        raise ValueError('Provide a public Alaska place coordinate')
    if not isinstance(limit,int) or not 1<=limit<=5:raise ValueError('Limit must be 1–5')
    lat,lon=round(lat,2),round(lon,2)
    now=now or dt.datetime.now(dt.timezone.utc)
    point_url=f'https://{HOST}/points/{lat:.2f},{lon:.2f}'
    point=fetch(point_url);props=point.get('properties',{})
    state=props.get('relativeLocation',{}).get('properties',{}).get('state')
    if state!='AK':raise ValueError('NWS point did not confirm Alaska coverage')
    stations_url=trusted_url(props['observationStations'])
    body=fetch(stations_url)
    if body.get('type')!='FeatureCollection' or not isinstance(body.get('features'),list):
        raise ValueError('Unexpected NWS station collection')
    candidates=[]
    for feature in body['features']:
        p=feature.get('properties',{});g=feature.get('geometry',{})
        coords=g.get('coordinates',[])
        if g.get('type')!='Point' or len(coords)<2 or not all(finite(v) for v in coords[:2]):continue
        x,y=coords[:2]
        if not (-180<=x<=180 and -90<=y<=90):continue
        station_url=trusted_url(p.get('@id') or feature.get('id',''))
        if not station_url.startswith(f'https://{HOST}/stations/'):continue
        candidates.append((distance((lat,lon),(y,x)),p,station_url,[x,y]))
    candidates.sort(key=lambda c:c[0])
    readings=[]
    for km,p,station_url,coords in candidates[:limit]:
        latest=station_url.rstrip('/')+'/observations/latest'
        try:
            observation=fetch(latest).get('properties',{})
            timestamp=dt.datetime.fromisoformat(observation['timestamp'].replace('Z','+00:00'))
            if timestamp.tzinfo is None or timestamp>now+dt.timedelta(minutes=5):raise ValueError('Invalid observation time')
            age=max(0,round((now-timestamp).total_seconds()/60,1))
            readings.append({'name':p.get('name'),'identifier':p.get('stationIdentifier'),'station_url':station_url,'observation_url':latest,'coordinates':coords,'elevation':measurement(p.get('elevation')),'distance_km':km,'observed_at':timestamp.isoformat(),'age_minutes':age,'older_than_one_hour':age>60,'temperature':measurement(observation.get('temperature')),'wind_speed':measurement(observation.get('windSpeed')),'wind_speed_mph':wind_mph(observation.get('windSpeed')),'wind_gust':measurement(observation.get('windGust')),'wind_gust_mph':wind_mph(observation.get('windGust')),'snow_depth':measurement(observation.get('snowDepth'))})
        except Exception as error:
            readings.append({'name':p.get('name'),'station_url':station_url,'distance_km':km,'reading_unavailable':type(error).__name__})
    return {'state':'research_only_not_enabled_in_app','source':'NOAA/NWS','point_url':point_url,'requested_place':[lon,lat],'fetched_at':now.isoformat(),'coverage_warning':'Nearby station readings do not represent a summit, route or slope. Missing measurements are not zero.','stations':readings}

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--lat',required=True,type=float,help='Verified public place latitude, not personal GPS')
    parser.add_argument('--lon',required=True,type=float,help='Verified public place longitude')
    parser.add_argument('--limit',type=int,default=3)
    args=parser.parse_args()
    try:print(json.dumps(discover(args.lat,args.lon,args.limit),indent=2))
    except Exception as error:
        parser.exit(1,'Station verification blocked or failed: '+type(error).__name__+'. No station was enabled.\n')

if __name__=='__main__':main()
