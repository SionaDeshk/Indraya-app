# Reproduce database tests
Use a disposable PostGIS 17 database created from template0. Never run the bootstrap on an existing Supabase project: it emulates auth/storage schemas and roles.

1. Start `docker run -d --name indraya-db-test -e POSTGRES_HOST_AUTH_METHOD=trust postgis/postgis:17-3.5` without publishing any port.
2. `docker exec indraya-db-test createdb -U postgres -T template0 indraya`
3. Pipe supabase/tests/bootstrap.sql, then supabase/migrations/202611050001_initial.sql, then supabase/tests/rls.sql to `docker exec -i indraya-db-test psql -U postgres -d indraya -v ON_ERROR_STOP=1` in that order.
4. Tests run in a transaction and roll back. Remove only the test container you created using `docker rm -f indraya-db-test`.

The harness tests SQL policies and grants, not the hosted Auth email flow, REST API schema cache or Storage service. Test those against a project before launch. No private credentials are needed for local SQL tests.

## Report picker browser regression
With Python Playwright and Chromium available, start `EXPO_OFFLINE=1 npx expo start --web --port 8092`, then run `python3 tests/report_browser.py`. Set INDRAYA_WEB_URL if using another port, and PLAYWRIGHT_CHROMIUM_EXECUTABLE for a custom browser path. These checks use demo mode with no Supabase configuration and isolated browser storage. They cover missing-location submission prevention, search and empty states, invalid report validation, successful persisted report creation with privacy rounding, current-location selection and denied-permission fallback. Native map taps and confirmation/cancel need the device smoke checks in README.md.

Run `python3 tests/sources_browser.py` against the same Expo web server to check editable category suggestions, preservation of custom titles when switching categories, the removal of the blank basemap toggle, source status labels and the absence of requests to unvalidated feeds. It requires the same optional Playwright/Chromium setup as report_browser.py.

## Rich reports and photo policies

Apply *both* SQL migrations, in filename order, in the disposable PostGIS harness, then run both supabase/tests/rls.sql and supabase/tests/report_details.sql with ON_ERROR_STOP=1. The second suite covers report kind/category consistency, observed time, bounded spatial results, private pending photos, audited approval and hiding, blocked direct uploads, and a restrictive Storage policy that wins even with an intentionally broad test policy. The harness now includes a minimal storage.objects table; it does not simulate actual Storage HTTP signing or Auth email delivery.

`npm test` additionally tests the JPEG metadata scrubber against a synthetic JPEG fixture containing private test metadata (not a user photo). The scrubber is also shared by the real server handler. `DENO_DIR=/tmp/indraya-deno-cache DENO_TLS_CA_STORE=system npx deno check supabase/functions/observation-photo/index.ts` type-checks the server entrypoint. It does not deploy or authenticate requests.

With Expo web on 8092 and Python Playwright/Chromium available, `python3 tests/expanded_browser.py` tests local town/feature search, mocked restaurant search, the color legend, animal/count/time selection, photo consent and EXIF removal, persisted rich demo reports and nearby cards. Existing report_browser.py and sources_browser.py also remain useful. Native device checks must cover zoom buttons (including the pin picker), pan/zoom nearby updates, card-to-map centering, the native time picker and photo-library permissions. See shared-backend.md for real cross-user hosted checks.
