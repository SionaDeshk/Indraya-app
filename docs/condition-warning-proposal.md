# Explainable condition warnings — proposal, not a risk model

Recommend a warning system before any calculated risk score. No production
resources or algorithm are enabled by this document.

An observation/nearby station cannot establish the safety of a slope, lake,
climb or river crossing. No warnings or missing readings must never produce a
green “safe” status. Community votes measure independent reports, not safety.

## First release

Show a compact, expandable “Conditions to check” section for the selected area
and relevant activity. Each warning states WHAT triggered it, WHERE it applies,
WHO supplied it, WHEN observed/issued and when it expires. Do not put a wall of
warnings into the observation-sharing form.

1. **Official alert:** a current, authorized provider alert intersecting the
   selected place/route. Preserve the provider's own severity and coverage.
   Avalanche danger uses only the official center's forecast, applicable
   elevation/region and valid time. No official forecast loaded = unavailable,
   never “low”. A general “Chugach” label does not select a forecast zone.
2. **Recent community hazard:** an active, relevant public observation such as
   an avalanche sighting, cracking/collapse, falling ice, an open lead or road
   closure. Label it “Community observation · unverified”, include age and
   location, and open the original observation. Never expose restricted reports
   or count the author's own responses as independent confirmations.
3. **Measurement/context notice:** e.g. “Ice thickness not measured” or “One
   drilled measurement does not describe the lake”. Station wind/temperature
   must include station identity, distance, elevation and observation time.
   A nearby airport reading is not a ridge wind or snow-stability measurement.
4. **Coverage/freshness notice:** clearly label expired forecasts, old station
   readings and missing data. Staleness affects whether a reading is displayed
   as current; it does not create an inferred danger level.

Community warnings expire with the observation's existing server-owned lifetime;
expiry is not evidence the hazard resolved. Official warnings expire according
to their provider. Never extend age when someone opens/confirms an observation.
Keep duplicate warnings grouped while retaining each source and conflicting
reports. Use neutral wording for disagreement; “not observed” does not clear a
hazard or prove it is gone.

## Exclusions and release checks

No community-derived avalanche five-level danger scale, ice load-bearing score,
automatic route approval, inferred safe crossing or emergency monitoring claim.
No arbitrary universal wind/snowfall thresholds. Activity-specific numerical
warnings would require published criteria, qualified domain review, validation
against local conditions and clear limits before implementation.

Before implementation: obtain authorized official feeds, verify coverage geometry
and issue/expiry semantics, define proximity for each activity (terrain/runout,
waterbody and road corridors differ), and test stale/missing/conflicting inputs,
private-report exclusion and foreground-only refresh. Pilot against historical
records and have local avalanche/ice/outdoor professionals review wording.

A future calibrated predictive model would be a separate research and validation
project with documented outcomes, uncertainty, false-negative/false-positive
measurement, terrain/elevation coverage and ongoing monitoring. It is not a
prerequisite for useful, source-attributed warnings.
