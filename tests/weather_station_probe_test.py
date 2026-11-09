"""Synthetic collector checks, not live provider/coverage validation."""
import unittest,importlib.util,pathlib,datetime
spec=importlib.util.spec_from_file_location('probe',pathlib.Path(__file__).resolve().parents[1]/'scripts/verify_weather_stations.py')
probe=importlib.util.module_from_spec(spec);spec.loader.exec_module(probe)
class ProbeTests(unittest.TestCase):
 def test_untrusted_urls_and_redirects_are_rejected(self):
  for url in ['http://api.weather.gov/stations/X','https://evil.example/stations/X','https://api.weather.gov@evil.example/stations/X','https://api.weather.gov:444/stations/X','https://api.weather.gov/admin']:
   with self.assertRaises(ValueError):probe.trusted_url(url)
 def test_missing_or_unsupported_readings_are_not_zero(self):
  self.assertIsNone(probe.wind_mph({'value':None,'unitCode':'wmoUnit:km_h-1'}))
  self.assertIsNone(probe.wind_mph({'value':20,'unitCode':'unknown'}))
  self.assertIsNone(probe.wind_mph({'value':-1,'unitCode':'wmoUnit:km_h-1'}))
  self.assertIsNone(probe.measurement({'value':True})['value'])
  self.assertEqual(probe.wind_mph({'value':10,'unitCode':'wmoUnit:m_s-1'}),22.4)
 def test_discovery_uses_provider_metadata_and_original_time(self):
  now=datetime.datetime(2026,11,9,12,tzinfo=datetime.timezone.utc);requests=[]
  def fetch(url):
   requests.append(url)
   if '/points/' in url:return {'properties':{'relativeLocation':{'properties':{'state':'AK'}},'observationStations':'https://api.weather.gov/gridpoints/TEST/1,1/stations'}}
   if '/gridpoints/' in url:return {'type':'FeatureCollection','features':[{'id':'https://api.weather.gov/stations/TEST','geometry':{'type':'Point','coordinates':[-149.1,61.1]},'properties':{'name':'SYNTHETIC station','stationIdentifier':'TEST','elevation':{'value':100,'unitCode':'wmoUnit:m'}}}]}
   return {'properties':{'timestamp':'2026-11-09T10:00:00Z','windSpeed':{'value':None,'unitCode':'wmoUnit:km_h-1'}}}
  result=probe.discover(61.1234,-149.1234,fetch=fetch,now=now)
  self.assertTrue(requests[0].endswith('61.12,-149.12'))
  self.assertEqual(result['stations'][0]['age_minutes'],120)
  self.assertTrue(result['stations'][0]['older_than_one_hour'])
  self.assertIsNone(result['stations'][0]['wind_speed_mph'])
  self.assertEqual(result['state'],'research_only_not_enabled_in_app')
 def test_out_of_region_input_and_unconfirmed_coverage_rejected(self):
  with self.assertRaises(ValueError):probe.discover(45,-122)
  with self.assertRaises(ValueError):probe.discover(61,-149,fetch=lambda _: {'properties':{'relativeLocation':{'properties':{'state':'WA'}}}})
if __name__=='__main__':unittest.main()
