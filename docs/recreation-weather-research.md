# Recreation-place search and weather-station research

Status: preparation, **not a verified gazetteer or enabled weather feed**. Review branch: research/recreation-weather. No application, migration, catalog, Supabase variable or production changes. The seven deployed migrations and current media function remain untouched.

## Recommended sequence

1. Verify official NWS station discovery and observations; verify USDA NRCS SNOTEL metadata/data services next. Prefer public documented interfaces over scraped pages. Treat avalanche-center station pages as authoritative links until their feed ownership/permissions are established. Synoptic is a separate option only after current access/token, redistribution and commercial-use terms are checked; publicly viewable readings do not establish API reuse permission.
2. Curate a small Southcentral recreation-place index using verified geography and source rights. Keep it separate from observation types and never generate coordinates from names. Names/aliases can be proposed before verification; nothing gets a production search pin until its source and position/extent are checked.
3. Combine curated places with the existing provider search, collapsing true duplicates by identity/feature meaning. Exact place names should rank first. Town/peak/route/trailhead/motorized area remain distinct even when names overlap. A station is not an observation or a trailhead.
4. Show source/station information in a collapsed details section; do not add required steps to sharing. Start with links; enable in-app data only after endpoint/coverage/terms validation.

## Current access evidence

Fresh HTTPS requests through the supplied cloud proxy were rejected with tunnel HTTP 403 for api.weather.gov, www.weather.gov, wcc.sc.egov.usda.gov, www.cnfaic.org, hpavalanche.org and alaskaiceclimbing.com. This is the applied cloud network policy, **not evidence the providers are private, paid or down**. No proxy bypass or rehosting was attempted.

The saved environment draft includes the relevant research domains, the existing Supabase domains, earlier source/geocoder requests and package-manager presets. Its persistence was confirmed by reading the saved draft. Scripts, repository declaration, secret requirements and injected runtime variables were not changed by this research. Applied runtime status still allows only the two Supabase custom hosts. Saving the draft does not activate it; environment settings must apply/save and publish it. No publish capability is exposed in this chat's tools. Publishing the cloud environment is separate from deploying the app or Supabase resources.

Live geography, station availability/IDs, observations, forecasts, license/terms and coverage remain **unverified** until those requests succeed and their contents are reviewed. An HTTP 200 alone is not sufficient evidence.

## Provisional place-curation queue

These are candidate names for verification, **not a popularity ranking, legal-access list, route recommendation or coordinate dataset**. The regional grouping is a research starting point, not a verified coverage polygon. Confirm each entry against authoritative maps/land managers and a second suitable local source. Do not turn this table into app results automatically.

| Research area | Candidate names to verify | Important distinctions |
| --- | --- | --- |
| Turnagain Pass ski terrain | Tincan, Sunburst, Magnum, Cornbiscuit, Seattle Ridge, Eddies | Separate named terrain from a specific route, summit or parking area. Verify colloquial aliases and forecast coverage. |
| Girdwood / Crow Pass | Max's Mountain, Mount Alyeska, Crow Pass, Jewel Glacier | Resort-managed terrain, backcountry areas, passes and glaciers are different feature types; a shared name does not grant access. |
| Hatcher Pass | Hatch Peak, Skyscraper Mountain, Marmot Mountain, Microdot, Peak 4068, April Bowl, Government Peak | Verify informal names and aliases against local maps. Government Peak recreation trails and the peak should not become one indistinguishable result. |
| Anchorage / Eagle River | Flattop Mountain, Peak Three, Ptarmigan Peak, O'Malley Peak, Wolverine Peak, Rendezvous Peak, Mount Baldy | Repeated mountain names need regional context; Mount Baldy must not be merged across different locations. |
| Motorized-area research | Petersville/Peters Hills, Turnagain Pass designated motorized terrain, Hatcher Pass designated motorized terrain | Use verified management boundaries, current opening/closure sources and separate trailheads. Never label an entire pass/mountain open to snowmachines. |
| Ice-climb research expansion | Keystone Canyon: Bridal Veil Falls and Horsetail Falls | Valdez is a separate expansion from the initial Girdwood/Hatcher/Anchorage focus. Distinguish falls, ice routes, viewpoints and trailheads; do not reuse a same-named falls elsewhere. |
| Local ice routes still to inventory | Girdwood/Portage/Turnagain, Hunter Creek/Mat-Su, Hatcher Pass | Read local climbing references and verify names, coordinates, access and publication rights before proposing specific route pins. No local ice-route coordinates or guidebook descriptions have been verified in this task. |

For every candidate, collect: canonical ID/name, feature type, activity tags, aliases, verified point/bounds, coordinate precision/meaning, geographic source URL/date, reuse terms, independent cross-check, land manager, access-source link, seasonal restrictions, related forecast/provider coverage and verification status. Keep an approach/trailhead separate from an actual climb. Route names alone do not establish current ice formation or a climb grade. Do not copy proprietary guidebook maps, approach text or GPS tracks without permission.

## Source plan and verification questions

| Candidate source | Purpose | What must be checked before enabling |
| --- | --- | --- |
| https://www.weather.gov/documentation/services-web-api | NWS API documentation | Identification header, allowed usage, caching/rate handling, station/point endpoint semantics, Alaska availability, attribution/third-party exceptions. |
| https://api.weather.gov/ | Public NWS discovery and observations | Point discovery → returned station collection → actual station metadata/latest observation; timestamps, null values, units, quality control and stale readings. No API key is assumed by the research probe. |
| https://www.nrcs.usda.gov/ and https://wcc.sc.egov.usda.gov/ | NRCS/SNOTEL | Current documented station/data interface, Alaska station triplets, elevation, sensor availability, units and time zone. SNOTEL is not a guarantee of wind measurements. |
| https://www.cnfaic.org/ | Chugach avalanche-center coverage and station links | Exact forecast-area boundaries, station ownership, observation timestamps and permission for any embedded data. “Chugach” is too broad to infer forecast coverage. |
| https://hpavalanche.org/ | Hatcher Pass forecasts/station links | Current forecast domain, seasonal operation, actual station locations and reuse terms. |
| https://alaskaiceclimbing.com/ | Candidate local route reference | Names and local context, coordinate accuracy, copyright/permissions and land-manager cross-checks. No scraped descriptions or route pins are included. |
| https://www.fs.usda.gov/ and https://dnr.alaska.gov/ | Managed recreation/access geography | Current maps, legal designations, openings/closures and permitted reuse. Weather and access information are distinct. |
| https://docs.synopticdata.com/ and https://synopticdata.com/ | Potential additional mesonet access | Current token/plan, publisher rights, redistribution, attribution, caching and commercial-app conditions. No token or paid service has been requested. |

Station names such as Sunburst/Seattle Ridge or Marmot are research leads, **not validated station records**. Do not assign IDs, GPS positions or current measurements to them from memory. Use provider metadata after access is available.

## Read-only verification helper

`scripts/verify_weather_stations.py` is a small research tool, not an app feed. It takes a verified **public place** coordinate, rounds it to two decimals, follows NWS discovery links and fetches at most five nearby station observations (default three). It reads no Supabase settings or credentials, sends no GPS stream, stores no app data and enables nothing. It rejects non-NWS links/redirects, limits response size/time, keeps null measurements null, preserves observation time, elevation/raw units/quality flags, and labels older readings. Distance ordering is not a recommendation that a station represents the route or summit.

After network activation, run from a terminal using independently verified public-place coordinates:

```text
python scripts/verify_weather_stations.py --lat VERIFIED_LATITUDE --lon VERIFIED_LONGITUDE
```

The placeholders are intentionally not guessed coordinates. It can also run on the user's Mac without Docker or an API key if its network permits the source. Do not paste personal coordinates. Save research output privately as needed; results still need independent coverage/terms review before integration. Handle any 429/Retry-After by pausing, not adding aggressive retries.

Four synthetic Python tests validate URL restrictions, missing readings/unit conversion, coarse-point discovery/observation age and out-of-region rejection. They do not prove the live API schema, freshness, endpoint access, station coverage, legal terms or native behavior.

## Clean in-app design after verification

A collapsed “Nearby weather stations” row in observation details can open one or two relevant station cards. Each card needs source/name, elevation, distance, observed time, stale/unavailable state, available wind/gust/temperature/snow readings with explicit units, and an original-source link. Allow station comparison instead of automatically treating the nearest as the best. Never interpret missing wind as calm or absent snow data as zero snow. Do not imply a valley station describes a summit, a forecast is an observation, or station readings determine avalanche safety. Keep activity/community updates visibly separate from provider observations.

No live station layer, provider polling, paid subscription, route dataset or production resource was enabled by this preparation. The next dependent step is applying the saved network draft, then verifying real source responses and licensing before adding pins or readings.
