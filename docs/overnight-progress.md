# Master task progress

Branch: feat/guided-observations, based on feat/indraya-mvp at d0e2b45.

## Milestones
1. Foundation implemented (24 unit tests and initial real SQL insert/privacy smoke passed; full migration/upgrade/RLS suites still pending): canonical eight-domain catalog, typed relationships and legacy compatibility; versioned database migration and privacy/staff-risk model.
2. Pending: provider-backed unified search, progressive reporting, dependent details and review, map selection and failure UI.
3. Pending: staff review/risk UI, effective expiry, protected publication and private My reports.
4. Pending: unit/browser/SQL/Deno checks, screenshots, platform exports and migration notes.
5. Blocked externally: live geocoder/official feeds are not in the applied network policy; no Supabase project variables or hosted management access are available. Preserve disabled official feeds and label live versus fixture evidence.

No user files were modified before branching. The user's Mac has separate local Expo settings; this checkout cannot control that Mac or validate native runtime behavior.

Checkpoint: eight domains, 37 topics, 101 canonical types, 18 shared dependent-question definitions. Third migration adds server catalog/path validation, privacy holds, separate audited staff assessments and effective public expiry. A populated-v1 preflight is documented because the older backfill guard rejects hidden rows; do not rewrite applied migrations.
