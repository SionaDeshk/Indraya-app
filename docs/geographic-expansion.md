# Geographic and recreation verification expansion

Checked November 9, 2026 Alaska time (November 10 UTC). Review branch
`feat/place-discovery`; no production deployment, schema change or data mutation.

## What is in this update

21 mapped area outlines, increased from two, and 33 saved geographic references,
increased from seven. Reference features are places, parks, waterbodies, glaciers,
summits and passes, not a database of verified ski descents or climbing routes.
Common spellings map “Alyeska Mountain” to Mount Alyeska, “Hatchers Pass” to
Hatcher Pass, “Hatcher(s) Pass area” to Hatcher Pass Public Use Area and “Ekluta
Lake” to Eklutna Lake. Resort buildings, peaks, passes and public-use areas remain
distinct geographic identities.

### Mapped outlines

| Feature | Canonical OSM identity | Meaning / important distinction |
| --- | --- | --- |
| Eklutna Lake | way 49200373 | Mapped waterbody, not an ice-safety boundary |
| Turnagain Arm | relation 8921978 | Bay, distinct from Turnagain Pass |
| Hatcher Pass Public Use Area | way 1343608838 | Mapped public-use area; not the pass point or an avalanche zone |
| Chugach State Park | relation 12188016 | Ten polygon components; nine interior holes preserved |
| Kincaid Park | relation 18433834 | Park footprint, not grooming status |
| Far North Bicentennial Park | way 913965341 | Mapped park feature; separate protected-area identity remains distinct |
| Independence Mine State Historical Park | relation 12545836 | Park boundary with interior exclusion preserved |
| Portage Lake | relation 21378422 | Lake, not access across its ice |
| Goose Lake, Anchorage | way 71432763 | Lake, distinct from adjacent park/property |
| Westchester Lagoon | relation 2375186 | Lake feature with two holes; separate park/lagoon features remain distinct |
| Campbell Lake | relation 17075573 | Mapped lake, not shoreline access permission |
| Nancy Lake | relation 16928071 | Waterbody, distinct from the recreation area |
| Nancy Lake State Recreation Area | relation 18432255 | Recreation-area boundary |
| Finger Lake | relation 2896634 | Lake with three holes preserved |
| Kenai Lake | relation 1527882 | Lake with island exclusion preserved |
| Skilak Lake | relation 1555333 | Lake with thirteen island exclusions preserved |
| Summit Lake, Kenai Peninsula | way 111498564 | Distinct from similarly named lakes elsewhere |
| Lower Summit Lake | way 111498561 | Separate waterbody |
| Byron Glacier, northern mapped section | way 232970776 | Separate mapped glacier component, not a safe approach |
| Byron Glacier, southern mapped section | way 233086494 | Separate mapped glacier component, not a complete route |
| Matanuska Glacier | way 74719477 | Mapped ice footprint, not access/guide authorization |

All geometry is matched by canonical identity. No outline is attached merely
because names sound similar. Native fill rendering must be checked on a device,
including holes, separate polygon parts and clearing/adjusting a selection.

### Mount Alyeska and Hatcher Pass

Mount Alyeska's summit point is independently corroborated by USGS GNIS feature
1420078 and OSM node 241887948 (representative points agree within roughly 30 m).
A summit is not a polygon. The returned resort-building footprint is excluded.
A suitable entire-mountain or licensed ski-terrain boundary has **not** been
verified. Searching “Alyeska Mountain” now finds the correct summit, with an honest
unavailable-outline caption rather than a fabricated mountain boundary.

Hatcher Pass summit/gap node 4758947334 and its Public Use Area are separate.
Search “Hatchers Pass area” to select the actual public-use-area outline. That
shape does not establish today's motorized opening, avalanche danger or legal
access to every parcel inside it.

## Geographic sources and rights

Reviewed OSM copyright/ODbL and the public Nominatim policy:
https://www.openstreetmap.org/copyright
https://operations.osmfoundation.org/policies/nominatim/

Nominatim policy permits smaller one-time tasks subject to its conditions:
one machine/thread, max one request/second, valid application identity, cached
results and attribution. One finite lookup requested the 19 additional exact
OSM IDs; no recurring/app-backend Nominatim integration was added. Overpass had
returned HTTP 406 and a capacity-related 502; it is not an application backend.

Lookup parameters: `format=jsonv2`, `polygon_geojson=1`,
`polygon_threshold=0.00005`, explicit `osm_ids` for the nineteen new features.
https://nominatim.org/release-docs/latest/api/Search/ documents that this tolerance
is in degrees and preserves topology. All returned holes and polygon components
are retained. Offline importer `scripts/import-place-geometries.py` validates
identity, closure, finite coordinates, Alaska envelope and size before writing.
It rejects unsupported geometry, incomplete rings and unreviewed identities.
Geographic data and attribution are in `data/GEOGRAPHIC-DATA-NOTICE.md`.

Photon live queries independently identify these public map objects. Saved point
records retain the provider's actual check time. Nominatim geometry has its own
provenance; no request uses device GPS or private observation coordinates.

USGS National Map Gazetteer/GNIS service documentation explicitly describes its
geographic names download as public domain:
https://carto.nationalmap.gov/arcgis/rest/services/geonames/MapServer
Landform layer 5 documents gaz_id, gaz_name, feature class, state and county.
A finite name query with `state_alpha='AK'` and `outSR=4326` verified locations.
New saved single-point summit records: Government Peak (1402812), Flattop Mountain
(1402210), Wolverine Peak (1412235), Ptarmigan Peak in Anchorage (1415999).
GNIS points do not describe ski lines; multi-point records were not arbitrarily
reduced to one “exact” route pin. The unrelated Skyscraper Peak in Copper River
was rejected as a match for Hatcher Pass. Seattle Ridge, Sunburst and Cornbiscuit
were not verified by this GNIS/Photon check and have not received guessed pins.

## User-provided guide sources

| Source checked | Verified result | App treatment |
| --- | --- | --- |
| [Powder Project Alaska search](https://www.powderproject.com/search?q=alaska) | Accessible; filtered ski listing reports 31 route matches, with location/bounds fields. Examples in the first returned page include Devils Thumb Ridge, Isabel Knoll and Canwell Peak. | Link to the provider, not an imported route database. A location/bounds pair is not a full ski-line geometry. |
| [Canwell Peak](https://www.powderproject.com/trail/7001416/canwell-peak) | Individual page identifies **Canwell Peak Ski Ascent**, Black Rapids, Alaska. | Do not relabel an ascent as a descent or imply current conditions. |
| [South Central Alaska Ice and Alpine](https://www.mountainproject.com/area/105909315/south-central-alaska-ice-and-alpine) | Accessible area index; links to Beer Climbs, Caribou Creek, Eklutna Canyon, Hunter Creek, Portage and other areas. | Regional reference link. Its regional GPS is not a climb pin. |
| [Caribou Creek](https://www.mountainproject.com/area/109775188/caribou-creek) and [Kid's Corner](https://www.mountainproject.com/route/109775258/kids-corner) | Correct parent/route relationship verified. Route page repeats its parent's coordinate. | Exact climb pin remains unverified; preserve source links. |
| [Beer Climbs](https://www.mountainproject.com/area/111518793/beer-climbs) | Correct group in the Pioneer Peak / Old Glenn–Knik River area. | Group reference, not a claim to individual route coordinates. |
| [Alaska Ice Climbing Kid's Corner](https://alaskaiceclimbing.com/kids-corner/) | Independent local reference agrees with Caribou Creek context. | Existing outbound reference retained. |
| [Joe Stock — The Alaska Factor](https://www.stockalpine.com/the-alaska-factor) | Local ski-region reference retained; no book text/tracks/maps copied. | Guide reference, not imported route data. |

After the initial checks, current Adventure Projects terms were reviewed at
https://www.adventureprojects.net/ap-terms. They restrict automated collection
and commercial reuse without a separate agreement. No further automated route
collection is proposed, no route dataset is bundled and no source prose, photos,
GPX files or proprietary map geometry are copied into the app. Direct source
links remain available. Permission/licensed data or independently reusable route
geography is needed before a broader route import.

## Warnings recommendation

Use explainable source-attributed warnings first. See
[condition-warning-proposal.md](condition-warning-proposal.md). No calculated risk
score or warning algorithm was deployed or enabled by this change.
