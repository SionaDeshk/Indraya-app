# Trip, overnight-site and highway reference data

Checked November 9, 2026 Alaska time (November 10 UTC). These are mapping
references, not navigation directions, current opening/booking status or safety
assessments. Snapshot dates are stored in the records. Some field collections
predate the access date considerably.

## OpenStreetMap

OSM-derived portions of trip-places.json and route-geometries.json:
© OpenStreetMap contributors, ODbL 1.0.
https://www.openstreetmap.org/copyright
https://opendatacommons.org/licenses/odbl/1-0/

Points came from identified, rate-limited Photon research; finite selected ways
came from cached Nominatim lookup requests. No runtime Nominatim/Overpass service
was added. Preserve attribution and provide these derivative geographic files
under the applicable ODbL database terms. App code is separate from geographic
database rights. Other source facts retain their source permissions below.

## USDA Forest Service

Recreation Opportunities (Feature Layer):
https://www.arcgis.com/home/item.html?id=3e16a3fae435443d9899b10d4ff26124
National Forest System Trails (Feature Layer):
https://www.arcgis.com/home/item.html?id=0969eb1cbb2f4a1d861ee58fff587cc2

Both official USFSEnterpriseContent item notices state these U.S. Government
geographic data are public domain and waive worldwide rights under CC0 1.0:
https://creativecommons.org/publicdomain/zero/1.0/
Retain USDA Forest Service source credit. These data are dynamic, not legal
boundary/access documents; natural hazards may be absent. Check the operator
for actual access, reservations, restrictions and current conditions.

Modifications: selected Chugach public recreation sites and named trails;
retained only factual identity/location/reference attributes; normalized WGS84
geometry to GeoJSON; grouped paths by published trail identity while preserving
separate summer/winter alignments and discontinuities. Provider simplification
0.00005 degrees / five decimal places for reference rendering. No missing paths
were interpolated. Cabin/trail area search tags do not establish a connecting
path, itinerary or permitted activity. No live opening, fee or vacancy data
are copied into the app.

## State of Alaska, Department of Transportation & Public Facilities

Mileposts AKDOT:
https://www.arcgis.com/home/item.html?id=ffa29b2c5b3147a4bc6dcdcfabd9eabc
AKDOTPF_Route_Data:
https://www.arcgis.com/home/item.html?id=01584dde2adb444196c9e483d623f310

The item terms expressly permit access, copying, analysis, modification and
redistribution for lawful purposes, including commercial use, subject to source
attribution, retained limitations, identification of modifications and no implied
State/DOT&PF endorsement. Third-party material and State insignia are excluded
from that permission. No seals/logos were copied. Data are not warranted and
must be verified for uses requiring greater accuracy or currency.

Modifications: retained only Dalton Highway route 1260000X000 and Denali Highway
route 1120000X000; projected to WGS84; converted road paths to GeoJSON with
provider generalization 0.0001 degrees / five decimal places; excluded 76
inactive milepost records and any flagged location errors. Used published
Milepost_Number, not internal MPT, and selected one published position per road
and posted number, prioritizing active records. Unknown sign status is retained
and labeled. No missing mileposts, fractional-mile locations or road segments
were calculated/interpolated. A mapped sign record is not proof the sign is
still present, the road is open or the reference is suitable for navigation.

These source permissions cover the DOT/USFS portions separately; they are not
claimed to be newly copyrighted OSM facts or government-endorsed routes.

## Operator references

MCA, American Alpine Club, Eagle River Nature Center, Alaska State Parks and BLM
pages are linked for operator guidance. No private accommodation coordinates,
booking data, approach prose, photos, copyrighted guide maps or GPX tracks were
copied. Public OSM positions are used independently from operator text.
Scandinavian Peaks Hut remains a reference link rather than a verified saved pin
because the operator and OSM coordinates differ by roughly 285 m.
