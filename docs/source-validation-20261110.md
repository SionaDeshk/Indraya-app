# Source checks — November 10, 2026 UTC

All requests were public, read-only HTTP; no Supabase/API credentials used.
New cloud network policy was enforced/unrestricted. Actual HTTP responses, not
settings alone, established source access. Earlier network-denial notes in
research documents are historical and are superseded for the sources below.

## NOAA / National Weather Service

Reviewed https://www.weather.gov/documentation/services-web-api and
https://www.weather.gov/disclaimer. API documentation describes free use for any
purpose, cache-friendly responses, User-Agent identification/contact and rate
limits. Indraya identifies its repository URL; no invented email or API key.
This validation enables only the optional station path, not the existing gated
Alaska weather-alert layer or USGS layer.

Live chain checked at 2026-11-10 01:31 UTC:
`/points/60.96,-149.13` (Girdwood public map point rounded to two decimals) →
returned `observationStations` collection → `/stations/PATO/observations/latest`.
HTTP/JSON chain succeeded. Alaska state confirmed. Returned station: Portage,
Portage Glacier (PATO), approximately 25.4 km away, elevation 28.956 m. At that
check it reported 00:45 UTC, −2°C, wind 0 km/h and missing gust/snow-depth values.
These are verification evidence, not values bundled into the app or a claim of
current conditions. Missing gust/depth remain missing, not zero.

A subsequent fresh request for PATO latest with browser Origin returned HTTP 200,
`Access-Control-Allow-Origin: *` and `Cache-Control: public, max-age=300,
s-maxage=300`. Optional panel queries no more often than five minutes while open,
does not poll in background, uses bounded responses and cancellation/timeouts,
rejects untrusted discovery links, unsupported units and future timestamps, and
labels observations older than an hour. Nearest station is limited to 100 km;
valley/summit representativeness is explicitly disclaimed. Real native-device
request behavior remains an acceptance gate. Never send restricted/coarse/private
locations or actual device GPS through this panel.

NRCS attempted candidate `awdbRestApi/services/v1.3/stations?stateCds=AK` returned
404. No NRCS adapter was enabled; find its current documented endpoint first.

## Avalanche sources — links, not imported forecasts

- https://www.cnfaic.org/ — confirmed Chugach Avalanche Center name and area
  selection including Turnagain Pass, Summit Lake, Seward/Lost Lake, Chugach
  State Park and Hatcher Pass references. Exact issuance, season and coverage
  must be checked on the provider page. Site copyright reserves rights.
- https://hpavalanche.org/ — Hatcher Pass Avalanche Center; reviewed its forecast
  disclaimer. Public viewing is not blanket permission to copy/aggregate forecasts.

No official danger levels or full forecast text are scraped, embedded or inferred.
A five-level avalanche danger bar would require an authorized official forecast
with provider, area/elevation, issue/expiry timestamps and unavailable/stale states.
Indraya moderator notes are manual and are not that scale. Weather readings and
anecdotal observations are not combined into a computed avalanche risk score.
Grooming, road, fish/wildlife and park sources remain explicit outbound links.

## Recreation names and geographic rights

- User's exact Mountain Project reference:
  https://www.mountainproject.com/area/111518793/beer-climbs — HTTP 200; Beer Climbs
  is in the Pioneer Peak/Old Glenn–Knik River area. Page warns about copying
  copyrighted material. Link-only in Indraya; no copied guide text, ratings,
  images or proprietary coordinate collection.
- https://alaskaiceclimbing.com/ and https://alaskaiceclimbing.com/kids-corner/ —
  HTTP 200; Kid's Corner listed in Caribou Creek under the Matanuska River region.
  Link-only until suitable independently verified route coordinates/rights.
- https://www.stockalpine.com/the-alaska-factor — HTTP 200; Joe Stock's reference
  covers the relevant Southcentral ski regions. No book maps/tracks/text copied.
- Photon live Alaska searches: exact OSM IDs/points for Tincan Peak, Tincan
  Mountain Ski Trail, Hatch Peak, Skyscraper Peak in Hatcher Pass, Microdot peak,
  Eklutna Lake and Turnagain Arm recorded in `data/recreation-places.json`.
  OSM map features, not independently verified current ski routes/access areas.
  Seattle Ridge query returned unrelated Mount Seattle results; these were
  rejected. Kid's Corner and Beer Climbs had no exact OSM matches; no guessed pins.

Reviewed https://www.openstreetmap.org/copyright (ODbL),
https://operations.osmfoundation.org/policies/api/ (editing API is not a read-only
app service), and https://dev.overpass-api.de/overpass-doc/en/preface/commons.html
(public instances are not an app-scale backend).
A finite manual Overpass query fetched Eklutna Lake way 49200373, Turnagain Arm
relation 8921978 and Alyeska Resort way 153320080. The last is a building, so it
was excluded from area outlining. Turnagain's 23 outer way segments joined into
closed rings without guessed connections. No holes existed in these two inputs.
The current finite outline file does not claim arbitrary multipolygon-hole or
linear-feature coverage. Future provider adapters must preserve holes and exact
identity before being enabled. See `data/GEOGRAPHIC-DATA-NOTICE.md` for license.
