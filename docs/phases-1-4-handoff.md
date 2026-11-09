# Phases 1–4 review handoff

Branch: `feat/phases-1-4`, based on `feat/observation-flow` at `42c6eea97f52bcdb4a24031064bf2232befef43a`. The executable Codex brief is [phases-1-4-codex.md](phases-1-4-codex.md). This is review code, not a production rollout. No production SQL, Auth email, storage writes, Edge deployment, merge, environment publication or device build was performed.

## Implemented

- Three-step sharing stays intact. Notes are optional and collapsed; titles remain editable. Sensitive observations explain private review before submission. Success opens the selected public observation or the owner's private status. Attachment retry keeps the already-created observation ID; saving and uploading stages are distinct, without invented percentages.
- Local drafts are scoped by signed-in account (or explicitly separate demo/signed-out scope), expire after seven days, and require Continue/Discard. They save text, choices, time and rounded place only. Attachments and drawn extents must be reattached/redrawn after a restart. A draft restores its original observed time rather than making it fresh. Account changes pause drafting and require reopening the form. This uses app-local AsyncStorage, not encrypted storage or cloud synchronization.
- Server-owned type-specific expiry removes observations from the active map without deleting history or implying conditions improved. Current catalog defaults range from 6 hours for rapidly changing sightings/weather through 24/72/168 hours for other conditions. Legacy v1 records use 24 hours. These are provisional display lifetimes, not safe travel windows or a permanent data-retention policy. Ordinary wording edits and independent responses do not renew the original observation.
- Firsthand responses are Observed too / Changed / Didn't observe, with observed time. Authors cannot independently confirm themselves. One current response per account and observation; server-enforced 30-second account rate limit. Individual responses are private to their author; public summaries contain counts/time only. This is not staff verification, emergency response or proof of safety.
- Followed places are account-private, rounded to two decimals, capped at 50 and manually opened in-app. No notifications, background tracking, overdue check-ins or emergency monitoring.
- Account signup/confirmation, password sign-in/sign-out, profile and persisted sessions remain. PKCE callbacks and password recovery screens were added. Private query caches reset on account changes. Hosted email and native redirect acceptance remain external gates.
- Catalog v2 preserves all 101 v1 types and adds 13 contextual types (114 total): winter snow/visibility, classic/skate/grooming, skating and river crossings, ice/mixed climbing, rock/approach, motorized access, wildlife signs/carcasses, fishing activity and glacier conditions. Long choice lists reveal more/search; answers remain optional. Grade scale, user-cited source/reference and reported condition are separate; citations do not verify a grade. Coarse/restricted privacy floors remain.
- Optional line/area drawing is offered only for eligible approximate observations. Collision location stays a point; a line describes the observed traffic backup. Geometry is rounded, constrained near the anchor, limited in size and checked on the server. Sensitive observations discard it. Outlines represent a person's observation, not an official closure or avalanche boundary. Drawing and map rendering require native acceptance.
- Regional provider links are available for Hatcher Pass, Anchorage, Girdwood/Turnagain and other Alaska. Provider/coverage selection stays visible. Network policy blocked research sites (CONNECT 403), so these are explicitly unverified candidate website links. No grooming/forecast scraping, ingestion or live-update claim was enabled.
- Public-only network fallback stores at most 100 loaded observations for up to seven days, labels the snapshot time and does not cache private lists or signed media URLs. It cannot reflect subsequent moderation removals while offline. Cached text itself is not encrypted. There is no offline map download or offline submission queue.
- Staff flag review adds privacy/impersonation/spam reasons and audited resolution. Resolution does not publish, confirm or change a risk grade. Prepared private video support is inherited from the base branch; see [media rollout limits](observation-flow-update.md).

## Local evidence

TypeScript, ESLint and 40 unit/handler tests passed. A fresh disposable PostGIS 17 database accepted all six migrations in filename order; all 129 assertions passed across RLS (18), report/photo (19), guided (37), video (12), lifecycle/access (43). Supabase auth/storage schemas and API roles are emulated locally; this is not hosted Supabase HTTP acceptance.

A separate populated upgrade from the first three migrations through the pending three preserved every original observation/media column, including private moderation states, ownership, timestamps, text and photo association. Reproduce with `python tests/phases_upgrade.py --container YOUR_DISPOSABLE_TEST_CONTAINER` after bootstrap roles exist; it creates a dedicated database and refuses an existing destination.

All three browser suites passed: `phases_browser.py`, `guided_browser.py`, `home_browser.py` (320/390/768px). New acceptance covers optional notes, draft recovery/discard, selected-map success, private status, expiry/history, places, source disclosure and recovery fallback. It aborts all Supabase requests and asserts zero. Browser artifacts are in `/workspace/outputs/indraya-phases`, `/workspace/outputs/indraya-flow`, `/workspace/outputs/indraya-home`. They do not prove native map drawing or real email/auth flows.

Deno checking of `observation-photo` passed. iOS/Android/web Expo JavaScript exports passed. No Xcode/Android native compile or iPhone test is claimed.

## Exact pending deployment, approval required

Target previously verified in the conversation: **vghbaypcaykpkzkhjfmm**. That identity and production migration history must be reverified immediately before any approved deployment; this implementation intentionally used no production credentials or calls. The expected already-applied migrations are `202611050001_initial.sql`, `202611080001_report_details_and_private_photos.sql`, `202611080002_guided_observations.sql`. Never reapply them or run the disposable bootstrap against production.

Only these three are proposed, in order:

| Migration | Changes needing review |
| --- | --- |
| `202611090001_private_video.sql` | Adds media kind/content type/duration and format constraint. Updates the existing **private** observation-media bucket to a 20 MiB limit and JPEG/MP4/QuickTime MIME list. Preserves old JPEG defaults; no public bucket or client upload policy added. |
| `202611090002_backcountry_catalog.sql` | Inserts immutable catalog version 2 and its routes/definitions; leaves version 1 intact. |
| `202611090003_lifecycle_and_access.sql` | Replaces the note-length constraint, backfills expiry while temporarily disabling USER triggers inside the migration transaction, adds validated extent/geometric indexes, private responses/places with RLS, freshness/aggregate functions, hardened grants and audited flag resolution. Replaces spatial lookup/view and catalog validation functions. |

SHA-256:

```text
d3b44d484426a4fdc3ec979fd3e700c6abc8465793e845f912ab594b140e5b98  202611090001_private_video.sql
9ceef877b13a83242120b5c6578187e73057cae56152df714e92820cff7262da  202611090002_backcountry_catalog.sql
0c2f69565ba2de7653356a85bd3b2356f3391112bd7058c5c38017cd79b4468e  202611090003_lifecycle_and_access.sql
```

No migration deletes/truncates existing data or drops a table. They do change constraints/functions/grants, bucket configuration and existing-row expiry. Expiry may immediately remove old observations from the active map while retaining history. The backfill/table/index locks need a backup, duration check on representative data and a maintenance decision. Do not treat these as having no production impact.

New RLS: `response_owner_read` allows only response-owner SELECT; all writes go through the checked response RPC. `followed_place_self` enforces owner SELECT/INSERT/DELETE; UPDATE is not granted. Anonymous execution of owner/staff RPCs is explicitly revoked. Public response summary returns no actor identifiers. Existing observation/media/storage policies remain in place; new flag metadata SELECT excludes resolver identity.

Required new functions: `observation_lifetime`, `prepare_observation_lifecycle`, `respond_to_observation`, `observation_response_summary`, `guard_followed_places`, `staff_flag_queue`, `resolve_report_flags`. Replaced functions: `observations_in_bounds`, `catalog_policy`; extended invoker view: `observation_feed`. Existing `my_observations` returns the enlarged observation row shape. Deployment must retain existing Auth and private storage infrastructure.

Illustrative CLI sequence **for a later approved rollout**, from this repository on the reviewed commit, using credentials configured securely outside command history:

```bash
npx --yes supabase@3.0.0 link --project-ref vghbaypcaykpkzkhjfmm
npx --yes supabase@3.0.0 migration list --linked
npx --yes supabase@3.0.0 db push --linked --dry-run
# STOP: history/checksums must match and the dry run must list exactly the three above.
# Only after explicit approval of this updated plan:
npx --yes supabase@3.0.0 db push --linked
npx --yes supabase@3.0.0 migration list --linked
npx --yes supabase@3.0.0 functions deploy observation-photo --remote=vghbaypcaykpkzkhjfmm --no-verify-jwt --use-api
```

The CLI sequence has not been run against production in this work. If cloud DNS/TCP remains blocked, use the user's Mac with the verified session pooler/credentials; do not change firewalls. Stop on extra migrations, history mismatch, unexpected schema or errors. Do not use migration repair, include-all, reset or a guessed connection string. Keep `verify_jwt=false` in the existing function config: the handler validates end-user tokens through Supabase Auth and checks ownership/status itself. Deploy it only after the media migration, including `_shared/media.ts` **and** `_shared/video.ts`. No secret values belong in commands, PRs or screenshots.

## Remaining release gates, in order

1. Review/approve this branch and its **new** three-migration plan; earlier approval of the first three migrations does not authorize these. Run fresh target/history/dry-run checks and backup first. Deploy database then updated media function, then client. The new client checks for catalog v2 before submitting, so sharing is deliberately unavailable against the old backend.
2. In an approved staging project, verify two real users plus staff: signup/confirmation/recovery, persistence/sign-out/cache separation; own/other/anonymous private states; duplicate-free upload retry; pending/approved/hidden photos and video; signed-URL expiry/refresh/removal; geometry and firsthand-response privacy. Production fixture writes require separate approval.
3. Configure and verify hosted Auth redirect allowlists for the app's actual scheme and reset-password/account paths, email delivery and recovery PKCE on the requesting device. The current app uses `indraya` scheme; preserve the user's actual EAS/local settings. Verify confirmation-required behavior and CAPTCHA/rate limits before broad access.
4. On Mac, preserve local app.json/package.json changes and stashes. Review the branch before switching. Run `npm ci`, and rebuild the development client for the inherited expo-video dependency/plugin using the established prebuild/build workflow, without `--clean`. Test small iPhone layouts, keyboard, attachment permissions, real MOV/HEVC limitations, near-expiry playback, time picker, extent drawing/rounding and map styling. Browser/JS exports cannot replace this.
5. Verify each provider's real URL, geographic coverage, publication/observed times, licensing and endpoint/terms before live integration. Prefer links until authorized endpoints are confirmed. No forecast interpolation or community safety verdicts.
6. Approve provisional expiry windows and retention/deletion/orphan-media rules; assess local-cache/draft privacy, moderation capacity, abuse/upload/signing throttles and operational monitoring. Phase 5 distribution and personal safety check-ins remain excluded.

This chat produced a reviewable implementation and tests; it is not a scheduled overnight worker. No background deployment job is installed.
