# Master task delivery

Branch: feat/guided-observations, based on feat/indraya-mvp at d0e2b45. Foundation checkpoint c260ac7; implementation checkpoint 996564d. Existing checkout was clean before branching; the user's Mac settings are separate and were not changed.

Completed:
- Eight domains, 37 topics, 101 canonical observation types and 18 shared dependent-question definitions. Progressive five-step reporting, searchable topic/type sheets, related observations, custom-title preservation, hidden-answer pruning, observed time, location, optional photo and final review.
- Unified provider-backed Search places without online/offline labels or fixed gazetteer fallback. Validated geometry/context/bounds, selected-place reference marker, appropriate native zoom/fit, adjustable report pin. Selecting a place never creates a report.
- Separate server-authorized staff publication/verification/photo/risk decisions, protected sensitive publication, private owner reports, regional/no-incident-pin privacy, immutable staff assessment history and effective expiry. Type colors remain separate from risk rings. Native tile failure/retry UI preserves viewport and coalesces only repeated known transport failures.
- Third versioned migration and populated-v1 preflight; older applied migrations untouched. Legacy compatibility and preservation checked against actual PostGIS.

Passed verification:
- TypeScript and ESLint; 26 unit tests.
- 74 SQL assertions (37 existing + 37 guided) across real anonymous/owner/other/staff database roles in an unexposed disposable PostGIS 17 container; fresh three-migration installation.
- Populated v1 → preflight → v2 → v3 upgrade preserving hidden/review/published rows, text, author, timestamps, coordinates and photo association. The v2 → v3 stage ran on these populated records.
- Chromium at 390×844: synthetic provider search, no incident on selection, custom title/cross-type answers, hidden field pruning, photo consent/time/review, persistence, held/My reports/public exclusion, permission denial/manual alternative, empty/throttled search and disabled feeds. No console errors in the main workflow. Browser screenshots are in /workspace/outputs/indraya-guided; not native proof.
- Deno photo function type check and JavaScript exports for iOS, Android and web. No native compilation or device operation was possible in Linux.

External blockers, not silently completed:
- Live Photon and official-service hosts are missing from the applied network policy. Required hosts remain in the saved environment draft; saving does not apply it. Search documentation includes a broad live-validation matrix; browser/provider mocks do not establish place accuracy.
- No Supabase project URL/public key or hosted management access. No hosted migrations, Auth, Storage, Edge deployment, email or two-device integration was executed. See shared-backend.md.
- Official weather/quake/fire/511/311 feeds remain disabled pending real endpoint, terms, coverage and freshness validation. No fake feeds, mass push, background tracking, billing or production release was enabled.
- Mac/device acceptance remains for native map bounds/pin/zoom/transport recovery, photo permissions, native time and hosted staff flows.

No native dependency or app.json changes were added in this branch. An existing development build from the prior photo/time update can receive these JavaScript changes through Metro. Preserve app.json/package.json local changes before pulling; do not discard settings or use prebuild --clean. See README.md and testing.md.

## Follow-up: map-first home and Alaska-only search

Home now removes the category shortcut, large wordmark/tagline and always-open report cards. A compact search/account row, small demo disclosure, right-side zoom/location controls, Layers and + Report surround a collapsed nearby sheet. Tap/swipe its handle to expand/collapse; the list scrolls independently. Category filters/legend are inside Layers, with official sources one level deeper. Attribution sits above collapsed controls. Loading/error summaries avoid presenting failed loads as zero activity.

Search now sends US/capped-latitude provider filters, validates Alaska coordinates/admin metadata, supports the Aleutians across 180°, discards unsafe extents and bypasses prior worldwide cache entries. An out-of-state-only response yields no Alaska matches. No live-provider access or native test claim was added. No dependencies, app.json or backend schema changed.

Validation for this follow-up: TypeScript/lint, 27 unit tests, responsive home/browser controls and complete guided-report regression. All-platform JS exports also run. Phone/tablet screenshots are browser evidence only; native sheet swipe/map placement still needs the user's simulator.

## Follow-up: report symbols and compact preview

Added eight original local PNG pictograms, a canonical/legacy symbol selector, native MapLibre image registration and symbol layer. Type color, separate staff risk ring, neutral clusters and restricted-marker exclusion are preserved; selection has a white halo. Community marker/card selection now opens a non-modal preview. Full details and flagging require View full report; Back to preview retains selection. Small-screen text scrolls with fixed close and full-report controls. Search selection clears a report preview. No new dependencies, native config or backend changes.

Validation: TypeScript/lint, 28 unit tests, responsive preview and full-detail navigation at 320/390/768px, guided reporting regression and all-platform JS exports. Local native marker rendering, hit testing, ring/halo distinction and image reload after map recovery still need the Mac simulator/device; browser screenshots are explicitly not native-map proof.
