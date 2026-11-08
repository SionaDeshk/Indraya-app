# Place search

Both map search and reporting use one provider-backed Search Alaska flow. Type at least three characters and press Search (or keyboard Search). There are no online/offline modes or fixed town-list substitutions. Successful identical queries may use a 24-hour response cache; failure never substitutes Anchorage or a guessed location. Check the result's town/region before selecting it.

Photon API: https://photon.komoot.io/api/ . Documentation: https://github.com/komoot/photon/blob/master/docs/api-v1.md and the upstream README Demo server section. Software is Apache-2.0; OSM data has separate attribution/ODbL obligations. Reasonable development use is permitted with no uptime guarantee and possible throttling/bans. Use a licensed production service or a self-hosted instance before broad deployment. No general web scraping or AI coordinate generation occurs.

Explicit searches are limited to one request per 1.1 seconds per app process, eight results, 12-second timeout. Provider receives words and coarse map focus (0.1 degree), not continuous GPS. Edits cancel in-flight requests. Cache writes may fail without discarding valid provider results. Empty results, throttling and transport failures are distinct from a success; no offline gazetteer is silently used.

Responses validate finite real coordinates, labels, context and point geometry. Search sends countrycode=US and bbox=-180,51,180,72, covering Alaska on both sides of the date line while excluding the lower 48 and Hawaii. Returned coordinates must also fall within the Alaska mainland/Southeast/Aleutian envelope; any supplied state must be Alaska and country code must be US. Results need Alaska state metadata or a US country code with that geographic envelope. Unknown or conflicting administration is excluded rather than guessed. Old worldwide cache entries are ignored. Very broad/out-of-region provider bounds are discarded so they cannot zoom the map across the country. Photon extent order W,N,E,S is normalized for the map. Search selection centers/fits the native map and shows a selected reference marker/label without creating a report. Rivers, glaciers, parks and highways may use representative points/bounds, not exact incident positions. Reporting lets the user adjust the native pin before confirming. Pin adjustment uses a generic observation label rather than claiming the entire feature is the incident location. Public report precision follows its privacy class.

Live Photon responses remain BLOCKED by the applied cloud network policy (HTTP403). The saved configuration draft includes the host but is not the running policy. Provider documentation was read; browser responses are synthetic fixtures. No real place in the following matrix has been live-verified in this task. An HTTP200 alone would not establish location accuracy.

| Group | Live validation still required |
| --- | --- |
| Towns | Anchorage, Girdwood, Wasilla, Palmer, Homer, Seward, Fairbanks, Juneau |
| Features | Knik River, Knik Glacier, Matanuska Glacier, Kenai Lake |
| Trails/parks | Flattop Mountain, Chugach State Park, Glen Alps Trailhead |
| Roads | Seward Highway, Glenn Highway, Tudor Road / Lake Otis Parkway |
| Public places | Providence Alaska Medical Center, Ted Stevens Anchorage International Airport, Girdwood School, Ship Creek boat launch |
| Businesses | Moose's Tooth Anchorage, Jack Sprat Girdwood, Fred Meyer Wasilla, a named gas station with town |
| Variations | Mixed case, extra spaces, partial names, reasonable misspellings, ambiguous names with multiple region-labeled candidates |
| Failures | Nonexistent place, lost connection, timeout, throttling, malformed-only response |

For each live case record timestamp, query, provider ID/label/context/coordinates/bounds, selected zoom and independent map comparison where practical. Record no-result honestly. Verify larger-feature interpretation and adjusted pin separately. Mocked tests validate behavior only.
