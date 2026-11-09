# Codex mission: Indraya Phases 1–4

Base: feat/observation-flow. Work in the existing isolated checkout on a new review branch. Preserve user settings, existing migrations and configured secrets. Do not deploy, publish, merge, change production data, or operate the user's Mac/iPhone. No privileged credentials in app operations or logs.

## Phase 1 — fast sharing and clear outcomes

Make written notes optional, with generated editable titles and neutral empty notes (never fabricated descriptions). Preserve the three-step flow, inline choices and map symbols. Explain sensitive private review before sharing; owner lists distinguish Shared / Awaiting review / Hidden / Outdated. Restore account-scoped local drafts explicitly, with Continue/Discard and no automatic submission. Preserve selected media while navigating; document any restart attachment limits. Retry must not create duplicate observations.

## Phase 2 — close the loop and freshness

Public success offers View on map; private success offers View status. Show truthful observation/attachment upload stages and actual upload progress where available, without fake percentages. Add type-specific active-map expiry based on observed time, separate from retention, with a Recent history view and no safe/all-clear inference. Editing, likes or confirmations must not silently reset original age. Add signed-in firsthand responses (Observed too / Changed / Didn't observe), with observation time, one current response per account, independent author distinction and rate limits. Keep these distinct from staff verification. Follow places privately in-app; do not introduce emergency monitoring or guaranteed notifications.

## Phase 3 — accounts/access

Keep signup/email confirmation/sign-in/sign-out/persistence and add password recovery with supported PKCE/deep-link handling. Preserve private account data and purge private query caches when identities change. No test accounts or email actions on production. Verify owner/other-user/anonymous/staff role boundaries in a disposable database. Clearly list hosted email delivery, redirect allowlist, actual users and native callback acceptance as external checks if unavailable.

## Phase 4 — backcountry readiness, media and release gates

Version the catalog instead of rewriting applied seeds. Include winter snow/visibility, Nordic grooming/classic/skate, skating/river crossings, ice/mixed climbing, rock/scree/talus, motorized access, wildlife signs/carcasses/encounters, fish sightings/species/run activity and water/access observations. Keep choices contextual, optional and plain-language; search slang/common names resolves to canonical terms. Separate subjective difficulty, surface quality, official forecasts, legal closures and firsthand measurements. No automatic danger/ice-safety verdict. Sensitive carcass/species/precise locations need privacy floors.

Show relevant regional source links for Hatcher Pass, Anchorage and Girdwood; never claim live integration, provider validity or terms compliance without evidence. Research access currently blocks source sites; record blocked validation honestly and keep data ingestion disabled. Sources must carry provenance/time/coverage and distinguish actual grooming/observed times from fetch times.

Extent choices are scenario-specific: point by default, optional stretch for road/trail surfaces and collision queues, area only for eligible broad conditions. Distinguish collision point from traffic backup. No authoritative closure/avalanche-boundary inference or precise geometry for sensitive reports. Preserve approximate-location guarantees; native drawing/device acceptance may be an explicit remaining gate.

Retain the prepared private video work; validate bounded media, ownership, pending/approved access, metadata removal, replay/removal and schema compatibility locally. Its new migration, function and native rebuild remain unapproved for production. Complete typecheck, lint, tests, browser flows, JS exports, Deno check and real disposable PostGIS role/upgrade tests. No unsupported native/hosted claims.

## Explicit exclusions and handoff

No Phase 5/TestFlight distribution, personal safety/overdue check-ins, continuous tracking, mass push, scraping unapproved providers, offline map download system or popularity-based safety score. Stop before production and report external blockers. Deliver reviewed commits, exact pending migration list, test evidence and Mac/device/provider acceptance steps. A chat turn is not a separately scheduled overnight service; do not claim unattended work will continue after it ends.
