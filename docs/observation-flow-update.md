# Observation flow update and video rollout

Work branch: `feat/observation-flow`, based on `feat/guided-observations` at `7f870e3`. No production changes or deployments are part of this update. The executable brief is in observation-flow-brief.md.

## Experience

Three steps replace five: **What did you notice? → When and where? → Review and share**. The original category tiles remain. A selected group collapses to a compact change-group control; narrower choices appear inline, not in dropdown sheets. Observation-specific questions use accessible choice chips behind an optional-details control. Description remains required; the generated title is editable. Related observations use highlighted removable chips, with a searchable inline chooser and a three-item limit. Hidden/unrelated answers are pruned without losing custom text, time, location or attachments.

Time defaults to Now; location always needs an explicit selection. Optional media follows time/location on the same page. Back/Continue stays in a keyboard-aware footer. Later steps use one compact editable observation summary instead of the large repeated change-category block. Review has section Edit actions and distinguishes a public observation from a private hold. The home Share button and My observations wording match the flow.

The draft stays in component state across step edits and failed submissions; it is not a durable saved draft across app termination. Attachment retry uses the already-saved observation ID. This avoids duplicate observations after an attachment failure.

## Video behavior

One photo **or** video per observation. Photos retain existing 2 MiB JPEG sanitization. Video accepts standard, unencrypted, non-fragmented MP4/MOV up to 20 MiB, 60 seconds and 1920 pixels on the longest edge, with H.264/HEVC video and optional AAC audio. The native picker requests 720p H.264 on iOS; users may need to export shorter/smaller clips on platforms that do not transcode. Unsupported codec/track/container layouts are rejected rather than uploaded unchanged.

Client and server run the same bounded ISO-BMFF sanitizer. It zeros container metadata boxes (including location/vendor/user data), track names, creation/modification times and compressor labels, retaining box sizes and sample offsets. It does not re-encode the visual/audio content or remove identities within frames, spoken information or data embedded in the encoded bitstream. Consent explicitly covers voices. Full human moderation is required before public playback.

Uploads require a verified user owning a published or review-held observation. Media is stored pending in the private bucket. Owner/staff can read pending media; anonymous callers only receive approved media for published observations. Signed URLs last 60 seconds; source refresh preserves playback position for the same clip. Removal remains owner-only. New metadata fields record media kind, content type and duration. Legacy clients/rows continue to behave as photos. No direct client object or metadata writes are enabled.

Native preview uses a sanitized local file rather than a data URI. Native demo videos are copied into the app's document directory; web demo videos use local storage. Demo attachments have a bounded combined budget (4 MiB of encoded data on web, 32 MiB on native), so a demo video may need to be much smaller than the shared-upload maximum. Large demo saves fail visibly while preserving the form. Public cloud upload limits are separate.

## Rollout — separate approval required

The three earlier migrations remain unchanged. For a project already at guided observations:

1. Back up and review `supabase/migrations/202611090001_private_video.sql`. It adds three media columns plus a format/duration constraint, preserving old JPEG rows with defaults. It raises the private bucket limit to 20 MiB and allows JPEG/MP4/QuickTime. It does not change RLS or make the bucket public. Apply only after approval.
2. Deploy the updated `observation-photo` handler **and both** shared modules (`media.ts`, `video.ts`) from this branch. Retain `verify_jwt=false` and the existing handler-level Auth/ownership checks. The old photo-only deployment cannot accept video. Do not deploy the new handler before the migration, since it writes the new fields for photos too.
3. Update the app from this branch and rebuild its native development client for expo-video. Dependencies, the plugin and photo-library permission wording changed. Preserve Mac local configuration, use `npm ci`, then the project's documented prebuild/build workflow. Do not use prebuild --clean or discard user settings. Apple signing/device setup is a separate task.
4. Run staged owner/other-user/staff upload, pending/approved playback, hiding, removal, failure/retry and near-expiry playback tests. Any production test writes need explicit approval. Verify public/server configuration securely without exposing keys.

No migration, function or native update has been applied to production by this work. Current photo-only production continues to run. General release still needs upload/signed-URL throttling, monitoring, retention/orphan cleanup and provider/device acceptance described in shared-backend.md.

## Reproducible local checks

- `npm run typecheck`, `npm run lint`, `npm test`.
- `EXPO_OFFLINE=1 CI=1 npx expo export --platform all --max-workers 2`.
- `DENO_DIR=/tmp/indraya-deno-cache DENO_TLS_CA_STORE=system npx deno check --no-config supabase/functions/observation-photo/index.ts`.
- In a disposable PostGIS 17 database only: bootstrap, all four migrations in filename order, then rls.sql, report_details.sql, guided_observations.sql and private_video.sql. Never apply the bootstrap or test fixtures to an existing Supabase project.
- Start web in DEMO mode with the two EXPO_PUBLIC_SUPABASE variables unset only for the child server process, then run tests/guided_browser.py and tests/home_browser.py with INDRAYA_WEB_URL pointing to it. These use synthetic place replies and local browser data, not production writes.
- tests/fixtures/video-with-metadata.mp4 and .mov are synthetic 2-second teal/sine clips generated with FFmpeg, carrying fictional test location/title metadata. Tests assert sanitization, untouched sample payload/offsets, format limits, authorization, pending metadata, cleanup and private/public reads. Sanitized MP4 and MOV were also decoded locally with FFmpeg.

Browser screenshots under /workspace/outputs/indraya-flow are layout evidence, not native-device proof. Native picker permissions, iPhone MOV/HEVC variations, keyboard/safe-area behavior, large uploads, signed-URL refresh during playback and real hosted multi-user behavior still need acceptance on the rebuilt client and approved backend.

## Completed validation for this change

TypeScript, ESLint and all 35 unit/handler tests passed. Fresh-install disposable PostGIS checks passed all 86 assertions (18 initial RLS, 19 report/photo, 37 guided, 12 video). Both browser suites passed, including actual MP4 playback, selected choice accessibility, photo/video consent and save, sensitive holds and 320/390/768px layouts. Deno typechecking and iOS/Android/web JavaScript exports passed. Sanitized H.264/AAC MP4 and MOV both decoded with FFmpeg; test location/title tags were absent. No hosted mutation or native build/device acceptance was performed.
