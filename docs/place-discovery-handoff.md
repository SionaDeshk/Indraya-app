# Observation clarity and place discovery

Review branch: `feat/place-discovery`. No production database writes, migrations,
function deployments or app publication performed for this update.

## Traverses, huts, campsites and highway follow-up

Added 119 trip/site references, 31 route/segment geometries and 459 source
milepost positions. Includes summer/winter trail variants, hut/cabin operator
links and source-only cabin references where exact positions remain unverified.
See [trips-and-mileposts.md](trips-and-mileposts.md) and its source/license notice.
No new migrations, native dependencies or production deployment.

## Expanded geography follow-up

Now 21 verified mapped outlines and 33 saved OSM/GNIS geographic references.
Details, exact identities, source checks and remaining Mount Alyeska/route gaps:
[geographic-expansion.md](geographic-expansion.md). Earlier two-outline/seven-place
counts below describe the initial implementation. Warning system recommendation:
[condition-warning-proposal.md](condition-warning-proposal.md); no algorithm enabled.

## Implemented

- 96 original bundled glyphs with explicit mappings for all 114 existing types;
  separate skate, ice tools, avalanche/debris, police, possible gunfire, collision,
  snowmachine, ATV and 4×4 symbols. Existing category colors and manual moderator
  rings remain separate. Generator: `python scripts/create-observation-symbols.py`.
  Review `docs/assets/observation-symbol-contact-sheet.png` at actual marker size.
- Short observation details; unassessed staff-risk row removed. Active manual
  notes have a colored accent and explicit provenance, without a low-to-extreme
  forecast scale or an algorithm implying safety. Complete answers/history remain
  available under More observation details. Ice measurement context stays visible.
- My observations sorts newest shared first. Ten-minute note/condition corrections
  keep original sharing/observed timestamps, type, location, media and expiry.
  Backend locks reviewed/held/hidden records and records with responses/assessments;
  clients cannot bypass the deadline through existing REST column UPDATE grants.
- Foreground community feeds/owner list/response summaries refresh every two
  minutes. Background polling disabled; native AppState controls query focus.
- Short ranked place results: exact geographic names precede transit stops, with
  More places. Exact provider IDs deduplicate; distinct business branches survive.
- Initial seven finite OSM recreation/place references: Tincan Peak, Tincan Mountain Ski
  Trail, Hatch Peak, Skyscraper Peak (Hatcher Pass), Microdot peak, Eklutna Lake,
  Turnagain Arm. No guessed Seattle Ridge / Kid's Corner / Beer Climbs pins.
- Verified Eklutna Lake and Turnagain Arm outlines use identity-matched OSM
  geometry, solid blue reference styling distinct from dashed observations.
  Clearing/adjusting a pin removes the reference identity. Other features use pins
  with an honest unavailable-outline caption. No rectangular fake boundaries.
- Contextual source links include Chugach Avalanche Center and Hatcher Pass,
  weather, road conditions, grooming and fish/wildlife sources. Region remains
  user-selectable; a broad place name does not establish forecast coverage.
- Optional NOAA/NWS nearby station panel on public approximate weather/ice/snow
  observations. No device GPS, demo or sensitive-location queries. Five-minute
  foreground refresh; observed time, distance, elevation, missing values and
  older-than-one-hour readings displayed. A nearest valley station is not a
  slope-level condition assessment. Detailed evidence in `source-validation-20261110.md`.
- Exact Mountain Project Beer Climbs link, Alaska Ice Climbing Kid's Corner link,
  and Joe Stock The Alaska Factor reference are searchable external guide links.
  No guide prose, pictures, maps, ratings or route coordinate datasets copied.

## Validation

Typecheck, lint, 67 unit tests; iOS/Android/web JavaScript exports. Existing demo
home, phases and guided browser workflows; new compact-details/newest-first/edit
workflow at 390×844 and 320×568; synthetic NWS panel; nine synthetic release
reliability scenarios. Screenshots: `/workspace/outputs/indraya-discovery`.

Disposable local PostGIS: all seven deployed migrations and six original SQL
suites, followed by proposed migration and correction-window tests; idempotent
submission suite rerun afterward. This is local RLS/function validation, not a
production preflight. Unpublished proposal is the eighth migration.

## Proposed deployment — NOT executed

Only new migration: `202611100002_observation_edit_window.sql`.
Creates guard_author_correction(), an early UPDATE trigger and authenticated-only
correct_observation(uuid,text,jsonb). No data backfill, DROP, table deletion,
storage change or Edge Function deployment. Behavioral restriction: direct author
updates can only correct notes/answers inside the same ten-minute window.
Moderation RPCs retain their existing authorization. No change to the seven
previous migrations. Read the SQL and tests before approval.

After explicit approval and a current backup/preflight, intended commands from
this branch (not instructions to run now):

```bash
npx --yes supabase@3.0.0 migration list --remote=vghbaypcaykpkzkhjfmm
npx --yes supabase@3.0.0 db push --remote=vghbaypcaykpkzkhjfmm --dry-run --skip-vault
# Stop unless ONLY 202611100002_observation_edit_window.sql is pending.
# Requires explicit production approval:
npx --yes supabase@3.0.0 db push --remote=vghbaypcaykpkzkhjfmm --skip-vault
```

Without that migration, live corrections return an explicit not-released message;
the original observation remains unchanged. Demo corrections work locally.

## Remaining gates

1. Review/approve the eighth migration separately; no automatic deployment.
2. Native iPhone/Android acceptance for icon legibility, map selection geometry,
   cleared/adjusted pins, pan/zoom, small-screen sheet scrolling and AppState
   polling. Web screenshots/exports do not prove MapLibre native rendering.
3. Recreation gazetteer expansion: independently verified coordinates/meaning,
   land-manager access sources and appropriate rights for Kid's Corner, Beer
   Climbs, Seattle Ridge and remaining guidebook candidates. The supplied Beer
   Climbs page identifies the Pioneer Peak/Old Glenn–Knik River area; no copied
   proprietary route pin is shipped. Do not map the unrelated Mount Seattle.
4. Broad geometry coverage requires a licensed/self-hosted provider. Public
   Overpass is not an app backend. Girdwood is currently a settlement point;
   Alyeska's returned resort polygon is a building, so neither gets an invented
   mountain/community boundary. Eklutna/Turnagain outlines are the verified pilot.
5. Avalanche/grooming/511 automatic imports require an authorized feed and terms,
   coverage, freshness and attribution checks. No server scheduler or forecast
   aggregation/risk algorithm exists. Links are working integration, not ingestion.
6. NWS is not comprehensive alpine station coverage. NRCS endpoint/terms and
   third-party weather networks still need validation; no unauthorized fallback.
