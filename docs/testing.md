# Verification

Run `npm run typecheck`, `npm run lint`, `npm test` and `EXPO_OFFLINE=1 npx expo export --platform all`. Exports validate JavaScript bundles, not native compilation. The latest run passed all three platform exports and Deno checking; final unit count is recorded in overnight-progress.md.

## Disposable SQL harness

Use PostGIS 17 in an unexposed test container, never an existing Supabase project. The bootstrap emulates auth/storage schemas and roles and must never be applied to production.

```
docker run -d --name indraya-db-test -e POSTGRES_HOST_AUTH_METHOD=trust postgis/postgis:17-3.5
docker exec indraya-db-test createdb -U postgres -T template0 indraya
docker exec -i indraya-db-test psql -U postgres -d indraya -v ON_ERROR_STOP=1 < supabase/tests/bootstrap.sql
```

Pipe all three `supabase/migrations/*.sql` in filename order into the same psql command. Then run `supabase/tests/rls.sql`, `supabase/tests/report_details.sql`, and `supabase/tests/guided_observations.sql` through it. Each suite rolls back its fixtures. The tests cover anonymous/owner/other/staff grants, direct upload restrictions even with a broad Storage policy, approval/hiding, spatial privacy, catalog tampering, irrelevant/hidden answers, sensitive holds, protected publication, private audits, staff risk grades, downgrade/resolution/dispute and expiry. The new guided suite has 37 assertions; the existing suites have 37 combined.

For a populated-v1 upgrade, create another database, bootstrap it (skip `create role` lines if reusing the same test cluster), apply only the initial migration, then `supabase/tests/upgrade_seed.sql`. Apply `supabase/upgrade-from-v1.sql`, then the existing report-details migration. Insert an observation_media row for ID 11111111-1111-1111-1111-111111111111 with storage_path `upgrade-photo.jpg`. Apply the third migration, then `supabase/tests/upgrade_assertions.sql`. This verifies old hidden/review/published records, ownership, original timestamps and photo association survive both backfills. A project already on v2 applies only migration three; no preflight. Remove only your test container with `docker rm -f indraya-db-test`.

The harness does not simulate hosted Auth email, REST schema caching, Storage HTTP signing or Edge deployment. Follow shared-backend.md for authenticated multi-user project checks.

## Browser workflow

With Python Playwright and Chromium installed, start `EXPO_OFFLINE=1 npx expo start --web --port 8092`, then `python3 tests/guided_browser.py`. INDRAYA_WEB_URL changes the port and INDRAYA_SCREENSHOTS sets the artifact directory. This replaces the three older scripts whose assumptions depended on offline gazetteer/category buttons.

The script uses **synthetic Photon replies**, not verified real-world locations. It exercises search without creating a report, custom title preservation, shared cross-type answers, hidden-answer pruning, observed time, photo/consent, final review, persisted demo records, private holds/My reports/public exclusion, no fallback on empty/error responses, and disabled official-source controls. Screenshots are browser evidence only. It checks browser console errors. Unit tests separately validate malformed responses, documented extent order, ambiguity, address-label privacy and geometry.

JPEG tests use a synthetic metadata-bearing fixture, not a user photo. `DENO_DIR=/tmp/indraya-deno-cache DENO_TLS_CA_STORE=system npx deno check supabase/functions/observation-photo/index.ts` checks the server function; it does not deploy it.

## Home layout and Alaska search regression

`python3 tests/home_browser.py` checks 320×568, 390×844 and 768×1024 layouts: collapsed activity by default, compact Report, no category shortcut/large branding, demo explanation, Layers filters/legend, retained filter selection and report navigation. A declared Oregon provider fixture must be rejected and display no Alaska matches; query parameters must include the geographic/country restrictions. Screenshots under /workspace/outputs/indraya-home show the browser fallback, not a rendered native basemap. Unit cases include Southeast and Aleutians, lower-48 names, foreign-border matches, unknown/conflicting administration and unsafe feature bounds.

## Native and live acceptance still required

On the Mac/device test native map bounds/zoom, separate selected-place marker, pin adjustment/cancel, card centering, clustering, category filters, risk rings and idle expiry, transport-error banner/retry preserving viewport, foreground location denial/allow, photo-library permissions, native date/time and restart persistence. Linux cannot compile or operate the user's iOS simulator. Verify the live query matrix in search.md against actual provider responses and an independent map. Official feeds stay disabled until documented validation. Test hosted ordinary/other/staff accounts and signed-photo access separately; no hosted project was configured here.

## Marker symbols and compact preview

The responsive home script also selects an observation from nearby activity, verifies the initial preview excludes flagging/full details, opens the full report, returns to preview and closes it. At 320/390/768px it checks the preview leaves most map space visible and the full-report action stays within the viewport. Browser screenshots browser-preview-*.png are layout evidence only. Unit checks cover legacy/canonical marker family selection, cross-linked whiteout and independence from staff risk. PNG symbols are original, regenerated with `python3 scripts/create-map-symbols.py` (Pillow needed only for regeneration).

On the simulator/device, verify local icon loading on fresh start and after Retry map, tap the circle and symbol to open the same preview, select another marker, zoom out and confirm colors persist, check selected halo versus danger ring, and ensure restricted reports remain absent from incident markers. No glyph server was added.
