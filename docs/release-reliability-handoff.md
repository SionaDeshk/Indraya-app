# Reliability update — review handoff

Branch: `fix/release-reliability`, based on audit commit `d5a5731` and PR #3 application commit `e1ba30f`. This work is local/review only: **no production calls, Auth emails, uploads, migrations, function deployment, environment publication or merge**. The previously approved six migrations and media function stay deployed; PR #3 remains unchanged.

## Completed work

| Objective | Result |
| --- | --- |
| Bind recovery to an account | Recovery captures the user who redeemed the code, invalidates on identity change/sign-out, clears password inputs and rechecks verified identity before save. The update uses that actor's pinned token, so a later session change cannot reassign the request to another user. Callback changes invalidate old readiness/results. |
| Keep drafts within their account | Sharing has a mounted actor boundary. Identity changes lock the form, clear visible note/place/media/result state, and require reopening the appropriate account's draft. Same-user token refresh stays usable. Writes and upload retries verify and pin the original actor's token. |
| Protect uncertain saves | A stable UUID and frozen observed time/rounded location/extent are persisted before a shared save. A lost response locks editing and preserves the same request across restart. Retry reuses the receipt rather than creating a second observation. Requires the **new proposed migration below**. |
| Recover media after a restart | Uncertain drafts can reselect an optional attachment with consent while observation fields stay locked. A server-saved attachment is not silently replaced. Demo sharing remains editable after a local-storage/media-budget error. No automatic background upload queue is introduced. |
| Clean up private presentation | Owner details, followed places, staff review and attachment queries are scoped/guarded by actor; identity changes cancel/remove private query caches. Open private details and forms are hidden rather than waiting for a network refresh. |
| Use saved observations offline | Failed spatial queries can use a labeled public snapshot, with saved time/limited coverage. Successful empty live results stay empty. Expiry/category filters apply to fallback rows; local line/polygon intersection handles an off-screen anchor. No fictional fallback, offline map package or all-clear inference. |
| Improve backcountry search | Exact aliases rank first; snowmachining/offroading/off-roading normalize to existing terms. Pow now finds snow surface first. Deployed catalog definitions/version/fingerprint are unchanged. |
| Bound connection stalls | Supabase and pinned-account requests use a 25-second fetch/connection timeout and preserve caller cancellation. This is not resumable chunked upload or a promise that OS background networking will finish. Uncertain saves retain their receipt key. |
| Accessibility pass | Shared buttons now declare disabled state and have at least a 44-point minimum height. Existing labels, checked chip state, wrapping choices and small-screen layouts were reviewed/tested. VoiceOver/Dynamic Type/native permission acceptance remains on the device checklist. |
| Dependency/build hygiene | No dependency, app.json, lockfile or native-plugin changes. Expo's offline compatibility table reported packages up to date, with its offline reliability caveat. Production dependency audit found 6 moderate affected package entries, 0 high/critical. No automatic upgrades/downgrades. |
| Release hygiene/recovery | Source credential scan passed; demo/live and source provenance labels retained. Older setup instructions now link to this current status. Exact migration/recovery steps below; no background job installed. |

## Evidence

- `npm run typecheck` and `npm run lint`: PASS.
- `npm test`: **50 tests passed** (existing handler/media/search/privacy cases plus reliable source selection, local geometry, pending-draft identity, exact search matches and stalled-request cancellation).
- Disposable PostGIS 17: **154 assertions passed** across six suites: 18 initial RLS, 19 report/photo, 37 guided, 12 video, 48 lifecycle/access, 20 idempotent submissions. Fresh install accepts all seven migrations. Two concurrent connections using the same actor/request return one ID and create one observation.
- Populated upgrade tests from **six → seven** and **three → seven** preserve every original observation/media column: ownership, text, timestamps, status, expiry and photo association. These checks run only in disposable databases.
- Synthetic Auth/REST browser acceptance: **9 scenarios passed** — lost response plus full restart/retry, ordinary recovery, A→B recovery blocking, expired callback, A→B draft blocking, same-actor refresh, clearing an open private owner modal, labeled public cache fallback, and preserving a subsequent moderation hide on retry. All non-loopback requests are intercepted or aborted; no real Supabase requests. Native viewport fallback is additionally unit-tested; this is not a physical iPhone airplane-mode result.
- Existing three demo browser suites passed, including photo/video flow and 320/390/768px home layouts.
- iOS/Android/web JavaScript exports: PASS. No native compile, physical device, hosted email, real-account or provider acceptance claimed. Edge Function source is unchanged, so it does not need redeployment for this update.

Logs are session-local under `/tmp/indraya-reliability-*`; synthetic screenshots are under `/tmp/indraya-reliability`. They contain fictional fixtures only. Historical audit reproductions are archived in `tests/release_audit_browser.py`; the new `tests/reliability_browser.py` asserts prevention instead of expecting the old bugs.

Reproduce client acceptance using the dedicated synthetic server from the audit docs on port 8096, then `python tests/reliability_browser.py`. Never point it at a production-connected server. For SQL, start an unexposed disposable PostGIS container and run:

```bash
python tests/reliability_database.py --container YOUR_DISPOSABLE_CONTAINER
python tests/phases_upgrade.py --container YOUR_DISPOSABLE_CONTAINER --applied-count 6
```

The scripts create dedicated databases and refuse existing destinations. They do not read Supabase credentials. Do not run bootstrap/fixtures against any hosted project.

## One proposed migration — not deployed

`supabase/migrations/202611100001_idempotent_observation_submissions.sql`

SHA-256: `31edba9c429298534683a6b32539d3c75acd6f5b0ab444fd5889f5b236a7c429`

This is migration **seven**. All six already-applied files remain byte-for-byte unchanged.

Changes:

- Adds `public.observation_submissions`: owner/request UUID primary key, SHA-256 payload digest, observation reference and creation time. Raw note/location payloads are not retained in the receipt table. Deleting an observation leaves a null-reference receipt/tombstone so replay cannot resurrect it; deleting its Auth user cascades receipt removal.
- Enables RLS with **no direct client policies/grants**. Revokes PUBLIC/anon/authenticated table access. No public receipt enumeration, owner identity endpoint or client table writes.
- Adds `public.submit_observation(uuid,jsonb)`. Only authenticated callers may execute it. It requires auth.uid(), checks payload size/allowed columns, serializes concurrent replay, and returns only the caller's observation ID/current moderation status. Explicit insert columns prevent injecting author, status, verification, expiry or timestamps. Existing catalog/privacy/expiry/rate-limit triggers still run for new saves; replay neither republishes nor renews an existing observation.
- No UPDATE/DELETE/TRUNCATE of existing production rows, no DROP, no storage/bucket or Edge Function changes. The new table has foreign keys and requires ordinary DDL locks. This is additive, not zero-impact. There is no automatic receipt cleanup job; retention must account for safe replay.

The old app continues to use its existing insert path. The new shared flow requires this RPC and deliberately has **no unsafe direct-insert fallback** if the backend is not upgraded. An unavailable backend keeps the local request for later recovery. Do not distribute this client as production-ready before the approved migration and staging checks.

An uncertain draft retains its request beyond the normal seven-day draft timeout until resolved. Media bytes are not saved in that draft; reselect on restart. It cannot be discarded through the normal prompt while confirmation is outstanding. Removing app storage, manually deleting the key or resubmitting through an older client loses this protection; this is not a global exactly-once guarantee across deleted client state. Pending snapshots are private app-local AsyncStorage, not encrypted storage.

## Deployment plan — approval still required

Target: `vghbaypcaykpkzkhjfmm`. Do not reuse the approval for the earlier three migrations or function; it does not cover this new migration.

1. Confirm the reviewed commit, clean migration files/hash and exactly the six current remote versions. Verify the new receipt table/RPC do not unexpectedly already exist. Check backup/recovery availability; retain the earlier Mac exports securely and make a fresh snapshot if data has changed. Do not restore anything as a preflight step.
2. From the reviewed checkout, run only:

```bash
npx --yes supabase@3.0.0 migration list --remote=vghbaypcaykpkzkhjfmm
npx --yes supabase@3.0.0 db push --remote=vghbaypcaykpkzkhjfmm --dry-run --skip-vault
```

The dry run must list **only 202611100001_idempotent_observation_submissions.sql**. Stop on additional migrations, modified historical files, unexpected schema, history mismatch or errors. Cloud direct database connectivity was previously blocked; use the user's Mac if needed. Never print credentials or replace configured environment variables.

3. After explicit approval of this plan, the production apply command would be:

```bash
npx --yes supabase@3.0.0 db push --remote=vghbaypcaykpkzkhjfmm --skip-vault
```

This command has **not** been run by this work. No function deploy, include-all, seed, reset, migration repair or merge is part of this step.

4. Verify history has exactly seven versions, the new table has RLS/no client direct access, only authenticated RPC execution is granted, and the original tables/functions/bucket remain intact. Real duplicate/replay tests should first use isolated staging; production fixture writes need explicit approval.
5. Update/reload the client only after backend compatibility is established. This branch adds no native modules/configuration changes: reuse the development build already prepared for video, preserve Mac local app.json/package.json settings and both stashes. Do not prebuild --clean or discard settings. Physical iPhone testing and PR review remain gates to beta distribution.

## Failure and recovery instructions

- **Dry run or apply error:** stop. Save redacted output, inspect remote history and object definitions read-only. Do not rerun blindly, repair history, drop the receipt ledger, replay the original six files or restore production to “try again.” Distinguish a failed operation from an uncertain response.
- **App save response lost:** reopen/continue the same account-scoped draft and retry the same request. Do not start a duplicate or switch to an older app to resubmit it. My observations can help establish what was saved. A missing media upload is separate from an observation save.
- **Client regression after a future rollout:** pause submissions and assess unresolved requests before rolling back the client. Retain the additive receipt table/function. Earlier clients do not understand pending receipt keys; reconcile those saves first. No destructive down migration is supplied.
- **Restore as last resort:** requires separate approval, a verified recovery point and a plan for newer accounts/data. Database backups do not contain uploaded Storage objects; neither a SQL export nor a successful test guarantees a hosted restore. Keep backup files out of Git/chat. Never press Restore as part of normal migration verification.

## Remaining blockers and polish

**Before wider beta:** real hosted recovery/confirmation redirects and mail delivery; staged owner/other-user/staff/media access; physical iPhone MOV/HEVC, permissions, signing, Dynamic Type/VoiceOver, native extent drawing and true airplane-mode/uncached viewport acceptance. This work cannot perform those device/real-account actions without the required environment and approval.

**Dependency follow-up:** affected entries are expo, @expo/cli, @expo/fingerprint, @maplibre/maplibre-react-native, glob and minimatch. The two underlying advisory groups concern glob cancellation and minimatch resource amplification (GHSA-3g3m-2fjr-6pw4 and GHSA-g3hv-75wg-m249). Audit suggestions include an incompatible Expo downgrade and a MapLibre version change; do not run npm audit fix --force. Assess actual tooling/runtime exposure and supported SDK-compatible fixes in a separate dependency review. No high/critical advisory was reported, but that does not establish general security.

**Catalog polish prepared, not deployed:** keep current v2 immutable. A later catalog version can clarify Passable as an activity/time-specific observation and consolidate Wolf/coyote and Seal/sea-lion overlap with old-value compatibility mapping. “Shell” remains ambiguous rather than being silently mapped to shale. No schema/catalog v3 is bundled merely for search inflections. Provider URLs, coverage, licenses and publication times still need local verification; ingestion remains disabled. Account deletion/retention/orphan cleanup and operational abuse/upload/signing limits remain distribution/operations gates documented in the baseline.

The next session should review this branch and migration, then use the updated [iPhone checklist](iphone-acceptance-checklist.md). No features or automatic deployments are scheduled after this session.
