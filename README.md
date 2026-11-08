# INDRAYA
Every person is a point of awareness. Together, we see the world.

An Alaska-first Expo mobile MVP. Original text-led identity, teal/ice/amber controls, map filters, observation cards, foreground location, provider-backed place search, approximate-location report submission, account screens and Supabase foundation.

## Run
Requires Node 24 and npm. `npm ci`, then `npx expo start --dev-client`. MapLibre is native and **does not run in Expo Go**. Configure your own bundle IDs in app.json and authenticate with EAS, then `npx eas-cli build --profile development --platform android` (or ios). Install the resulting build on a device. iOS provisioning requires an Apple developer account; local iOS builds require macOS/Xcode. Android local builds require Java/Android SDK. EAS account, signing and build quota/costs are external prerequisites. No device build was executed in the cloud setup.

Without environment values the app uses explicitly labeled fictional DEMO observations. Reports persist only on the current device; no account is simulated. Optional Supabase setup: copy .env.example to .env.local, set your project URL and public anon key, apply all three migrations in filename order (see docs/shared-backend.md), enable email/password auth and confirmation, configure email redirects and production CAPTCHA. Restart Metro after environment changes. Never use a service-role key in EXPO_PUBLIC variables. Accounts support registration, email confirmation, password sign-in, sign-out and display-name updates. Live reports are always unverified initially.

## Maps and licensing
MapLibre React Native 11 uses a native Expo config plugin; see https://maplibre.org/maplibre-react-native/docs/setup/expo and package version requirements. MIT React Native wrapper with MapLibre Native BSD-2-Clause components; no MapLibre API key. The app now has one topographic basemap; the empty Standard option is removed. Both the home map and report picker use the same local raster style, with no dependency on a blank vector demo basemap or remote font service. OpenTopoMap attribution (OpenStreetMap/SRTM, CC-BY-SA) remains visible. Review https://opentopomap.org/about before deployment; no SLA, bounded zoom and usage limits apply. Replace the development tile service with a licensed production provider before public launch. Styles stay dark around the map; topographic tiles use the provider's colors. No terrain elevation/extrusion is claimed.

Layers & sources separates the basemap, community reports and official-source layers. NWS and USGS parsers, source toggles, expiry handling and geometry overlays are prepared but **not connected** until endpoint and terms validation is complete. Weather, wildfire, road and 311 availability is explicit in the source screen. No live official reports are invented. See docs/official-sources.md for the exact network blocker and enablement checklist.

## Guided reporting and search
Eight broad categories reveal topics and observation types through searchable dropdowns. The 101 canonical types include road/weather conditions, animal sightings and encounters, trails, fire/environment, infrastructure, assistance and discoveries. Relevant follow-up questions depend on the selection; users describe observed facts, while staff assign caution/danger separately. Titles remain editable. Time, location and optional sanitized photo precede a full review screen. See [guided-observations](docs/guided-observations.md).

Search Alaska uses Photon to find Alaska places and coordinates, with context and provider bounds where available. It never substitutes Anchorage for a failed query. Selecting a place moves the native map and marks a reference; it does not publish a report. Reporting supports current location and native pin adjustment without coordinate entry. See [search and live validation limits](docs/search.md).

Sensitive reports enter private review and use regional information. My reports shows the owner's held submissions. Type colors and staff risk rings are separate; expired grades lose their active ring. Public photos need separate approval. Demo reports/photos stay local and are never sent to staff.

## Map-first home
The home screen starts with search and a small account icon, a compact demo badge, right-side map controls, Layers and a compact + Report button. Nearby observations start collapsed; tap or swipe the handle up to browse, and collapse it to return map space. Category filters and the legend live inside Layers, alongside a link to official sources. Branding is in Account. Alaska-only provider queries and a second result filter prevent out-of-state search matches. No native rebuild is needed for this layout/search update.

## Run the update on the Mac
Preserve local app.json/package.json changes before pulling the follow-up branch feat/guided-observations. No dependency or app.json changes were added by this branch; if the prior photo/time development build is already installed, restart Metro or reload without rebuilding native code. Keep this checkout outside iCloud Documents. Start `npx expo start --dev-client --localhost --port 8081` in a dedicated Terminal tab and keep it running. Native dependency changes in the earlier update require `npm ci`, `npx expo prebuild --platform ios`, then `npx expo run:ios`; do not use --clean or discard local settings to resolve conflicts.

## Verification and limits
Typecheck, lint, unit tests, real disposable PostGIS role tests, browser workflow checks, Deno handler checking and all-platform JavaScript exports are documented in [testing](docs/testing.md). Browser screenshots do not prove native map, pin, photo permission or time-picker behavior. Local SQL tests do not prove hosted Auth/email/Storage. Live geocoder accuracy and official feeds remain blocked pending network/endpoint validation; [official sources](docs/official-sources.md) stay gated.

Shared accounts/reports require a configured Supabase project, all three migrations and the photo Edge Function. Nothing was deployed to a hosted project. Follow [shared backend](docs/shared-backend.md); never put service-role keys in the app. Push delivery, background tracking and offline map downloads are not implemented. This MVP does not dispatch emergency responders.
