# Codex brief: a simpler observation flow

Implement on top of feat/guided-observations, preserving local configuration and existing privacy protections. Do not deploy resources or modify production data.

Use three steps: What did you notice? → When and where? → Review and share. Keep the existing category tiles. Replace topic/observation dropdown sheets with inline selectable choices and a compact editable breadcrumb. Avoid category/topic/reporting jargon and redundant headings. Relevant questions and description belong with the observation; titles start automatically and remain editable. Optional related observations use highlighted removable chips (maximum three), not tall rows. Preserve custom text and relevant answers when classification changes, and explain pruned answers.

Keep time and location together, Now as the time default, and require explicit location selection. Place optional photo/video selection below them. Add bounded private video upload, playback, owner/staff authorization, moderation and retry/removal; protect against metadata leaks. Add a new versioned migration and preserve existing migrations. Changes need separate production rollout approval. Never pretend the deployed JPEG-only backend already supports video.

Use one compact selection summary on later steps. Review offers section Edit links, privacy-aware public location and clear share/private-review outcomes. Keep Back/Continue in a consistent reachable footer with keyboard avoidance, accessible states and no horizontal overflow on small phones. Preserve state between steps and prevent duplicate submissions/retries. Use sharing/observation wording in this flow.

Validate typecheck/lint/unit tests, browser workflows at small-phone sizes in isolated demo mode, all-platform JavaScript exports, Deno handler types, media sanitization, and disposable database RLS tests. Cover cross-user denial, pending/approved media, mixed photo/video compatibility, selection edits, hidden-answer pruning, time/location/consent validation and failures. Native picker/playback/signing and real device behavior remain explicit acceptance checks. No Apple Developer work is part of this task.
