# Release-readiness audit

> Historical audit of e1ba30f. R1–R5 now have review-branch fixes and prevention tests; see [release-reliability-handoff.md](release-reliability-handoff.md). Nothing from that follow-up is deployed. The reproduction script below intentionally describes the earlier failures; use tests/reliability_browser.py for current acceptance.

Audit base: `e1ba30f05c62453fc52a3bf81e05a7921fba5968` (PR #3). Review branch: `review/release-readiness`. Scope: account recovery, retry behavior, privacy, freshness and backcountry terminology. This branch adds diagnostics and documentation only; it does not fix application behavior or authorize a rollout.

## Decision

Hold broader beta distribution until the two account-switch findings are fixed and verified. Complete the duplicate-save fix before relying on sharing in unreliable reception. A green existing test suite is not a release approval: its normal paths do not cover these cases.

The six database migrations and updated observation-photo function were deployed earlier in the conversation with separate user approval. Live database/grant checks and basic unauthenticated function checks passed then. This audit performed **zero production requests or writes**, sent no Auth email, created no accounts and changed no backend resources. The new synthetic browser diagnostics intercept every non-loopback request: only the fictional API hostname and synthetic geocoder are fulfilled; other destinations are aborted. The fictional hostname must never be used in a real app build.

## Findings, prioritized

| Priority | ID | Finding | Evidence |
| --- | --- | --- | --- |
| P1, before wider beta | R2 | A recovery form is not bound to the account that redeemed its link. Switching to B while A's form stays open lets that form update B's password. | Reproduced with the actual web app and SDK against a synthetic backend, two tabs sharing a session. |
| P1, before wider beta | R3 | An account change pauses draft autosave but leaves A's form shareable under B. | Reproduced: warning appeared, yet B could submit A's synthetic note. |
| P2, before unreliable-network sharing | R1 | Retrying after a committed insert's response is lost creates another observation. | Reproduced: two different IDs for one unchanged form. |
| P2, offline acceptance | R4 | The native nearby list cannot fall back to a saved public snapshot when the spatial query has no data and fails. | Static source trace; native viewport/airplane-mode reproduction remains open. It shows update unavailable, not an all-clear. |
| P2, before exposing backcountry search broadly | R5 | Common activity wording misses the matching category, and some short slang ranks poorly. | Actual searchTypes calls: snowmachining/offroading produce no results; pow ranks power_outage ahead of snow_surface globally. |
| P3, catalog cleanup | R6 | Animal choices mix combined and specific categories (Wolf / coyote plus Wolf and Coyote; Seal / sea lion plus Seal). | Catalog review. Not a privacy bypass, but people can classify the same sighting inconsistently. |

### R2 — bind password recovery to its verified actor

References: `src/app/reset-password.tsx:31` and `:61`. Recovery calls exchangeCodeForSession and checks only that some user exists. The page retains ready state and later calls updateUser using whichever session is current. It has no actor ID comparison or auth-change invalidation.

Reproduction: open a valid synthetic recovery callback for A; keep its form open; sign out and sign in as B in another tab; submit the original form. The synthetic Auth PUT receives B's token and the page reports success. This is a wrong-account action within an already authenticated B session, **not** evidence that an unauthenticated caller can reset arbitrary accounts.

Proposed fix: capture the verified recovery user ID, clear readiness and password inputs on sign-out or identity change, and compare a fresh verified user ID before saving. Also reset readiness immediately when the callback changes. Reject stale/invalid callbacks rather than reusing an earlier ready form. Test A→B, A→signed out, expired callback, new callback and same-actor refresh. Hosted email/deep-link tests remain necessary; a browser reproduction does not establish native callback behavior.

### R3 — account changes must invalidate sharing, not just autosave

References: `src/useObservationDraft.ts:43`, `src/app/report.tsx:189`, `src/app/report.tsx:707`, `src/api.ts:291`. The hook pauses storage and shows a warning, but the share button is not disabled by that state. Submission reads the newly signed-in user and inserts the still-visible form as that user.

Reproduction: A writes a synthetic note and reaches review; another tab changes the session to B; the expected account-change warning appears; Share observation remains enabled; the note is saved with B as author. This does not bypass row ownership policies; the client has transferred content across account boundaries.

Proposed fix: bind the entire sharing attempt (including prepared media and saved-attachment retry) to the actor at start; make identity change a blocking state, clear sensitive in-memory presentation, and require explicit reopening of the correct actor's draft. Reverify actor immediately before insert and upload retry. Preserve A's scoped local draft without copying it to B. Tests must cover sign-out, A→B, token refresh without identity change and successful same-actor draft recovery.

### R1 — idempotency is missing for the observation insert

References: `src/api.ts:305`, `src/app/report.tsx:189`. The in-flight lock prevents double taps and attachment retry reuses a known observation ID. Neither covers a server commit whose response never arrives. On an insert error, the caller has no saved ID; the next share performs a new insert.

Proposed fix: persist a stable request identifier for the logical submission and enforce owner-scoped uniqueness on the server, with a checked operation returning the existing ID on replay. Keep the identifier through uncertain responses and attachment retry; intentionally starting a new observation gets a new identifier. Add rollback/response-loss/app-restart/concurrent-request tests. **Any schema change must be a new migration**: the existing six migrations have already been applied and must not be edited. Do not represent the existing attachment-only retry guarantee as end-to-end exactly-once sharing.

### R4 — public snapshot and nearby fallback diverge

References: `src/api.ts:55`, `src/app/index.tsx:104`. observations() can return cached public rows after a network error. When a native viewport exists and history is off, nearbyReports nevertheless selects spatial.data or an empty array. With no cached spatial result, the saved public rows cannot populate that list. Existing error labels avoid an all-clear claim, but the offline experience is incomplete.

Proposed fix: explicitly select a labeled snapshot fallback when the current spatial request is unavailable; use local spatial filtering suitable for the cached rows, preserve expiry/category filtering and disclose limited coverage. Distinguish loading, empty live response, failed refresh and saved snapshot. Verify with a real native viewport after launch offline and after panning to uncached bounds. Do not silently substitute fictional demo data.

### R5/R6 — terminology and source review

The catalog has 114 v2 types, and long lists use search/More choices rather than forcing all options onscreen. Checked working terms include corn, slush, corduroy/coudoury, flat light, glass, picked out, chandeller, granite, scree, kill site, bull moose charge, caribou herd, doll sheep, bear scat and salomon. Search snowmachining and offroading currently misses snowmachine/offroad aliases. Shell has no result; its intended rock meaning needs clarification rather than silently mapping it to shale. Pow is ambiguous with power outage; category context helps, but global ranking should favor exact aliases.

Preserve useful distinctions: ice surface vs thickness; one drilled measurement vs route-wide conditions; user-cited climbing grade vs a verified guidebook/source; observed groomed surface vs seeing a groomer vs a provider update; community access impression vs legal opening/closure; staff review vs independent firsthand responses. No ice thickness, snow texture or positive response can establish safety.

Proposed small improvements: add the missing inflected activity aliases; rank exact aliases before substring matches; clarify “Passable” as the observer's experience and activity/time; consolidate overlapping animal choices with compatibility mapping. **Changes to server-validated catalog definitions require a new catalog version and migration**, preserving old observations' meanings. Do not rewrite deployed v2 seeds merely for wording cleanup. A search-ranking-only client improvement can be scoped separately.

Regional links remain explicitly unverified website candidates. This audit did not establish that provider URLs, current coverage, terms or licenses are valid. Keep ingestion disabled. Before announcing forecast/grooming integration, verify coverage/season/publication time, licensing and actual operator reports for Hatcher, Anchorage and Girdwood. A provider directory link is not a live grooming feed. No new provider was enabled.

## What was checked

- TypeScript, ESLint and the existing 45 unit/handler tests: PASS.
- iOS/Android/web JavaScript exports: PASS. No native compile/device acceptance claimed.
- New synthetic browser diagnostic: R1/R2/R3 reproduced; all requests outside loopback or explicitly intercepted synthetic hosts were blocked. The diagnostic exits zero when it reproduces the known defects; **that is not an acceptance pass**.
- Existing 134 SQL assertions and prior live post-deployment checks are historical evidence from earlier work, not rerun/production activity in this audit. No SQL access policy changes are included here.
- Metadata stripping, bounded video and pending-media authorization are covered by the existing handler/unit suite. Real iPhone MOV/HEVC, user A/B/staff flows, Storage HTTP signing/expiry and native drawing still need isolated staging/device acceptance.

Reproduce the diagnostic in a dedicated terminal/server, with installed Python Playwright and Chromium:

```bash
EXPO_PUBLIC_SUPABASE_URL=https://indraya-audit.supabase.co \
EXPO_PUBLIC_SUPABASE_ANON_KEY=synthetic-public-key \
EXPO_NO_DOTENV=1 EXPO_OFFLINE=1 \
npx expo start --web --localhost --port 8096
```

In another terminal:

```bash
python tests/release_audit_browser.py
```

This server must remain synthetic; do not run the diagnostic against the production-connected Metro server. It uses mocked Auth/REST responses rather than an actual staging project. Browser artifacts: `/workspace/outputs/indraya-release-audit/characterizations.json` and three screenshots. The diagnostic fails if the expected reproduction stops working, so it is deliberately separate from `npm test`. Convert its scenarios to “must prevent” acceptance assertions when implementing fixes.

## Next implementation slices

1. Client account boundaries: R2/R3, targeted regression tests and native callback/account-switch acceptance. No new feature expansion.
2. Reliable sharing: R1 stable identity and server uniqueness, new migration reviewed separately, then lost-response/restart tests in a disposable database and staging. No automatic retry of uncertain production requests during investigation.
3. Offline fallback R4 plus iPhone checklist. Keep cache limitations visible.
4. Small search/catalog clarification R5/R6 and provider verification. Any schema/catalog deployment needs its own reviewed plan.

Use [the short iPhone checklist](iphone-acceptance-checklist.md). Leave PR #3 unmerged and this audit branch separate. No overnight scheduler/background deploy was created; the completed findings and diagnostic are saved for the next session.
