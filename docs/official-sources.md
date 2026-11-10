# Official source validation and release gate

**November 10 follow-up:** Source access now works for the checked endpoints.
The optional NWS station panel and finite OSM reference data are implemented on
`feat/place-discovery`; avalanche/guide content remains link-only. See
[source-validation-20261110.md](source-validation-20261110.md) for current evidence
and [place-discovery-handoff.md](place-discovery-handoff.md) for remaining gates.
The older blocked-access/preparation notes below describe the earlier revision.


No live feed is enabled in this revision. The managed environment's current HTTP allowlist does not include the official sites, and read-only NWS/USGS probes returned HTTP 403. Required hosts were added to the configuration draft, but draft persistence does not apply runtime networking. There are no API keys to request for these candidate public feeds. Do not treat network denial as an upstream service outage.

## Candidate adapters

| Source | Candidate endpoint | Scope | Current state |
| --- | --- | --- | --- |
| NWS | https://api.weather.gov/alerts/active?area=AK | Active Alaska weather alerts; some features have no geometry | Parser implemented; live endpoint, policy and terms validation blocked |
| USGS | https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_day.geojson | M2.5+ past-day earthquakes filtered to Alaska and nearby waters; includes antimeridian | Parser implemented; live endpoint, policy and terms validation blocked |
| NIFC | Not selected | Wildfire incidents and Alaska coverage | No adapter or ingestion; evaluate official data catalog and licensing first |
| Alaska 511 | Not selected | Road/travel conditions | No adapter or ingestion; confirm endpoint, registration and reuse terms |
| Anchorage 311 | Not selected | Municipal service requests | Not equivalent to 511; no validated open data endpoint or ingestion |

Required network additions in the saved draft: api.weather.gov, www.weather.gov, earthquake.usgs.gov, www.usgs.gov, services3.arcgis.com, www.nifc.gov. Existing custom domains and package-manager presets are preserved. NIFC's ArcGIS domain is for evaluating candidate data services, not a declaration that a particular dataset is licensed or connected.

## Verification before enabling

1. Apply/save the draft network changes in environment settings. Verify the runtime reports current enforced policy and permits fresh requests.
2. Read NWS API documentation at https://www.weather.gov/documentation/services-web-api and terms/disclaimer at https://www.weather.gov/disclaimer. Validate whether the app's identification header, caching cadence, direct mobile access and browser CORS satisfy current requirements. The adapter uses Indraya's real repository URL as application contact; it does not invent an email address.
3. Read USGS feed documentation at https://earthquake.usgs.gov/earthquakes/feed/v1.0/geojson.php and rights guidance at https://www.usgs.gov/information-policies-and-instructions/copyrights-and-credits. Confirm attribution, third-party exceptions and the scope of permitted reuse.
4. Request real data from each candidate endpoint, check HTTP/Content-Type/schema and freshness on two meaningful checks, compare selected reports to the official site, confirm browser CORS and native device requests, and save the evidence/date/terms version here. Do not save private headers or credential values.
5. Only then set that source's `validatedAt` to the verified timestamp in src/official/catalog.ts. This is a reviewed code change, not an end-user switch for bypassing validation. No production request happens while it is null. The diagnostic helper checkOfficialEndpoint is only for explicit endpoint verification.

## Behavior already implemented and tested

Separate query caches and source toggles; five-minute polling only for enabled, validated layers; fifteen-second request timeout and cancellation; errors remain errors rather than empty success. Missing geometry is retained as a regional list item, never converted to a made-up Anchorage pin. Polygon boundaries and earthquake markers are rendered separately from community observations. Official detail sheets show attribution, time, expiry and an official link. HTTPS source links are restricted to the expected source host. Expired cached reports are removed; failed refreshes and stale checks are labeled. A zero-count feed never means safe conditions.

The NWS parser drops tests/exercises, expired/cancelled alerts, future timestamps and malformed dates. USGS drops out-of-region, older-than-day, future, sub-M2.5 and invalid-coordinate records. USGS regional bounding boxes include nearby waters and land and do not claim political boundary precision. Reports remain official-source records with their provider's preliminary/reviewed wording; they are not emergency dispatch confirmations or tsunami warnings.

Unit fixtures in tests/official.test.ts are synthetic and never bundled as app observations. No official incidents or fire reports are seeded. Parser tests are not endpoint/terms validation. Production ingestion/push delivery, durable server caches and fire/road/311 integrations remain outstanding. Frequent direct polling on many clients should be replaced with a bounded shared cache before public launch.
