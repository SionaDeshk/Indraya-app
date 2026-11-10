# Traverses, summer hikes, overnight sites and highways

Review branch: `feat/place-discovery`. Checked November 9 Alaska / November 10
UTC, 2026. No deployment, production data changes, schema edits, environment
variable changes or new native dependencies.

## Delivered scope

119 additional saved place references, joining the earlier 33: **152 named
geographic/site/route references** plus **459 published highway milepost
references**. New references include **43 cabins, 9 huts, 3 yurts and 25
campgrounds**. There are **31 route/segment geometries**, separate from the 21
previously verified area outlines. This is a curated source-based discovery
index; coverage is not every campsite or a turn-by-turn route planner.

Search accepts specific names, activity/context terms and common spellings:
`ski traverses`, `summer hikes`, `multi-day hikes`, `Eagle River yurt`,
`Resurrection Pass cabins`, `Dalton campgrounds`, `Bombers Pass`,
`ressurection pass`, `Denali Hwy Cantwell to Paxson`, `Dalton MP 115`,
`Denali Highway mile 104` and `MP 115 Dalton Highway`.

Saved trip matches are capped at twelve per query; use a name/area to narrow.
Specific known trip/site searches work without provider requests. General place
search retains Photon fallback, Alaska guards and genuine place ambiguity.
Reviewed matches keep their operator links and coordinate meaning when a live
geocoder repeats the same identity. Guide/operator references are collapsed
when mapped results exist and contained within the bounded search list.
Source buttons have 44-point touch targets. Source credits/terms are available
on Layers & sources without adding disclosures to observation-sharing steps.

## Traverses, hikes and loop systems

| Search area | Included references | Meaning / limits |
| --- | --- | --- |
| Bomber Traverse | Mint, Bomber and Snowbird huts; Reed Lakes and Gold Mint approaches/trailheads; Bomber Pass and Backdoor Gap; Seth Holden Hut for extended-area discovery | Hut/pass/approach references and MCA/AAC source links. No invented connecting line across glaciers. Bomber Pass is a pass, not the whole traverse. |
| Eklutna Traverse | Pichler's Perch, Hans Hut, Rosie's Roost; Eklutna Lakeside approach; operator notices | Alpine/glacier travel. No fictional fixed line between huts or claim a historic glacier approach remains viable. |
| Resurrection Pass | Separate USFS summer trail 317 and winter alignment 617; north trailhead and south trailhead parking; eight nearby cabin references | Preserve distinct source trail identities. Do not treat a winter alignment as permission/opening or a cabin's proximity as a navigable connector. |
| Lost Lake / Primrose | Separate summer/winter alignments; Lost Lake and Primrose trailheads; Dale Clemens Cabin | Published paths, not a generated shortcut or guaranteed complete itinerary. |
| Johnson Pass | Distinct USFS summer and winter alignments and their published parts | Do not merge seasonal differences or infer legal activity from map presence. |
| Russian Lakes / Resurrection River | Separate mapped trails; Upper Russian Lake and Aspen Flats cabins; Resurrection River Cabin under its own corridor | Distinct corridors. Paradise Lake cabins are **not** attached to these trails merely because they are cabins in the same forest. |
| Crescent / Carter / Ptarmigan | Published Crescent Creek, Crescent Lake, Carter Lake and Ptarmigan Lake trails; separate winter routes where present | User must check current use/access and choose actual observation location. |
| K'esugi Ridge | Verified mapped OSM trail segment and nearby Denali State Park camping references | Partial segment, not a reconstructed entire ridge route. |
| Eagle River / Chugach summer hikes | Crow Pass and Williwaw trail segments; Rodak Nature Loop, Dew Mound and Albert Loop Bypass | Exact mapped segments. Albert Loop Bypass is **not** relabeled as the complete Albert Loop. |
| Additional local loops | Byers Lake Loop segments; Reflections Lake segment | Keep original partial paths and gaps. Two Byers ways are grouped as a reference without fabricating connecting geometry. |

Route pins are representative points on published geometry. Search rows and the
map distinguish mapped routes, partial mapped segments and site references.
The observation-location picker asks users to choose the actual observed spot
when selecting a broad route reference. Adjusting a pin clears its reference
identity/geometry. Source reference lines remain solid blue and separate from
dashed user-observed extents. No route geometry is written into observations.

## Overnight site inventory

- Hatcher Pass / Talkeetna: Mint (Rainery), Bomber, Snowbird, Seth Holden and
  Dnigi huts; Bomber Pass, Backdoor Gap and approach trailheads. Operator links
  are MCA or AAC, not an inferred public reservation entitlement.
- Chugach/Eklutna glaciers: Pichler's Perch, Hans Hut and Rosie's Roost.
- Eklutna Valley/Lake: Serenity Falls Hut and Dolly Varden, Kokanee, Rainbow
  Trout and Yuditna cabins, with Alaska State Parks references.
- Eagle River Nature Center: Yukla, River Trail and Rapids yurts. The cabin and
  rental information remain linked to ERNC; no Nature Center building is
  substituted for an unverified cabin pin.
- Eagle River campground: Boreal Owl, Delgga and Ptarmigan cabin **operator
  references**, with exact links from the Alaska State Parks directory. Their
  individual coordinates were not verified, so no guessed pins were added.
- Bird Creek: Beluga, Black Bear and Bore Tide cabin **operator references**;
  Bird Creek campground has a mapped reference. No similarly named private
  residence or bore-tide viewpoint is substituted for a cabin.
- Chugach National Forest: 39 published cabin and 13 campground references,
  including Resurrection Pass cabin-area matches, Russian Lakes sites, Seward,
  Portage and Prince William Sound/Cordova facilities. Some require boat/air
  access; search inclusion does not imply a hiking connection.
- Dalton: Five Mile, Arctic Circle, Marion Creek and Galbraith Lake campgrounds.
- Denali Highway / approaches: Brushkana Creek, Tangle Lakes and Paxson Lake
  campgrounds. Paxson Lake is on the Richardson Highway, not mislabeled as a
  Denali Highway milepost. Denali State Park: Byers Lake and K'esugi Ken.

Scandinavian Peaks Hut remains a source reference: MCA and OSM positions differ
by about 285 m. No private or unauthorized hut/landowner access is implied.
Opening dates, permit rules, reservation availability and cabin occupancy are
not ingested. Site points are public mapping references, not campsite numbers
or verified front-door navigation coordinates.

## Dalton and Denali mileposts

Official State of Alaska DOT&PF datasets, not inferred distance along a line:

- Dalton Highway: exact source route ID `1260000X000`.
- Denali Highway: exact source route ID `1120000X000`, Richardson Highway/Paxson
  to Parks Highway/Cantwell. Driving Cantwell → Paxson follows the opposite
  direction to increasing source route measure.
- Dataset `Milepost_Number` is the posted label; internal `MPT` can differ.
- 535 raw records contained 76 inactive signs, which were excluded. Remaining
  459 positions include unknown sign status, labeled explicitly. Collection
  years can be old. Dataset active status is not road-open status.
- No invented mile zero, absent/fractional milepost, range endpoint or geodesic
  interpolation. A missing requested number produces a helpful error. Denali
  Park Road is not matched to Denali Highway. Dalton Trail and Nondalton roads
  were excluded by exact identity, despite fuzzy name matches in the service.
- Source/road-condition action opens Alaska 511. No road closure feed, current
  traffic assessment, emergency dispatch location or navigation guarantee added.

## Source verification and reproducibility

All requests were public, read-only HTTP; no Supabase credentials used.
Named map research used cached Photon queries on one machine at about one
request per 1.2 seconds. Two finite Nominatim lookups retrieved exact OSM trail
way geometries; cached results, application identity, attribution and no runtime
Nominatim/Overpass backend comply with the previously reviewed policy:
https://operations.osmfoundation.org/policies/nominatim/

Government data sources:

1. **Mileposts AKDOT**, official `AKDOT_GIS` item
   `ffa29b2c5b3147a4bc6dcdcfabd9eabc`, FeatureServer layer 0. Fields, status domains,
   WGS84 coordinates, exact route IDs, transfer limits and current-record filter
   were checked. Active=1, inactive=2, unknown=3. No flagged location errors used.
2. **AKDOTPF_Route_Data**, official `AKDOT_GIS` item
   `01584dde2adb444196c9e483d623f310`, layer 34. Filter exact highway names/IDs and
   `To_Date IS NULL`; provider generalized at 0.0001 degrees / five decimals.
3. **Recreation Opportunities**, official `USFSEnterpriseContent` item
   `3e16a3fae435443d9899b10d4ff26124`, MapServer layer 0. Query Chugach National
   Forest; site lat/lon checked against returned geometry. Only factual site
   attributes retained, not open status, fees or vacancies.
4. **National Forest System Trails**, official `USFSEnterpriseContent` item
   `0969eb1cbb2f4a1d861ee58fff587cc2`, MapServer layer 0. Query named Chugach-area
   trails, group actual source `trail_cn` identities, verify `trail_type` TERRA
   versus SNOW, preserve all returned component paths and gaps. Provider
   generalized at 0.00005 degrees / five decimals. No transfer-limit truncation.

DOT item terms explicitly permit lawful redistribution and commercial use,
with attribution, retained limitations, disclosed modifications and no State
endorsement. Both Forest Service item terms explicitly provide government
public-domain/CC0 rights. Exact source links, credits, modifications and limits:
[data/TRIP-DATA-NOTICE.md](../data/TRIP-DATA-NOTICE.md).

Operator checks: MCA inventory plus eight individual hut pages; AAC Snowbird
Hut; Alaska State Parks cabin and campground directories; ERNC homepage rental
and trail links; BLM Dalton, Dalton campground factsheet, Denali and Paxson Lake
pages. The operator links corroborate public identities. Some USFS/ERNC detail
pages return 403 to automated requests; their public source links are retained,
not treated as verified live opening/booking feeds. No further Mountain/Powder
Project scraping or route imports were performed.

The offline builder is `scripts/build-trip-index.py SNAPSHOT_DIRECTORY`.
It validates exact identities, finite Alaska coordinates, complete source
responses, source limits and geometry budgets before writing three files:
`trip-places.json`, `route-geometries.json`, `highway-mileposts.json`.
Reviewed source snapshots used in this task live under `/tmp/indraya-longtrip`;
these are task artifacts, not a durable provider mirror or automatic ingestion
service. Trip operator references are in `trip-references.json`.

## Validation and remaining gates

Typecheck/lint and 67 unit tests passed. Existing home, phases, guided sharing,
area search and nine synthetic release-reliability scenarios passed. New trip
search acceptance passed at 390×844 and 320×568, including source-only cabins,
missing milepost errors, separate winter paths and no overlap with map controls.
iOS, Android and web JavaScript exports passed. Browser tests block real external
requests and production writes. Native MapLibre rendering, small-screen scrolling, road/segment styling,
source links in Safari and cleared/adjusted pins still need device acceptance.

No complete Bomber/Eklutna glacier route, route planning engine, reservation
system, current opening feed or automatic warning algorithm is claimed. More
specific mapped cabin positions and route variants can be added after source
verification; source-only references remain useful without invented coordinates.
