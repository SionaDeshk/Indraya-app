The OpenStreetMap-derived data in recreation-places.json and place-outlines.json derives
from OpenStreetMap, © OpenStreetMap contributors, under the Open Database
License 1.0: https://opendatacommons.org/licenses/odbl/1-0/
Attribution and source: https://www.openstreetmap.org/copyright

Checked 2026-11-10 UTC. Photon provided the seven public feature points;
a finite manual Overpass research request provided Eklutna Lake way 49200373
and Turnagain Arm relation 8921978 geometry. No runtime Overpass dependency.
Canonical OSM IDs in each record identify their geographic sources. These
finite geographic collections remain ODbL data, separate from application code
and original observation icon artwork. Offer these JSON files with any released
derivative collection, and retain attribution/license information.

A mapped waterbody is not a safe-ice boundary. A point is not a route, trailhead,
access permission, avalanche forecast zone or motorized-use authorization.
Alyeska Resort way 153320080 was researched but excluded: it describes a
building footprint, not the ski mountain or resort's full terrain boundary.

November 9 Alaska / November 10 UTC expansion:
Nineteen additional OSM polygon/multipolygon features were retrieved in one
finite Nominatim lookup and cached. See docs/geographic-expansion.md for source
IDs, boundary meaning and query parameters. The same ODbL attribution applies.
No runtime Nominatim or Overpass dependency was added.

Records with provider "gnis" derive from the USGS National Map Gazetteer/GNIS,
public-domain geographic names data. Credit: USGS The National Map, GNIS,
service data refreshed October 2026. These source records remain public domain;
ODbL applies to the OSM-derived geographic collection and its applicable database
rights. GNIS summit points do not describe ski lines or access permissions.
Source: https://carto.nationalmap.gov/arcgis/rest/services/geonames/MapServer
