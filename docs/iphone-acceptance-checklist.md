# iPhone acceptance: short checklist

Use the rebuilt development app. A Simulator pass is useful, but mark physical iPhone results separately. Record device/iOS/build/commit and PASS/FAIL/NOT TESTED, not “looks good.” Start with demo or an isolated staging project. **Production test accounts, observations, uploads and moderation writes require explicit approval**; this checklist does not grant it. Use clearly synthetic fixtures, never fictional gunfire/avalanche incidents on the public map.

The audit found account-boundary and lost-response issues. Fix R2/R3 before wider beta; a normal same-account smoke pass does not clear those findings.

| Check | Expected result |
| --- | --- |
| 1. Launch and layout | App opens without error; small screen, keyboard, safe areas, Back and media permission denial leave controls usable. Confirm environment is demo/staging. |
| 2. Quick observation | Choose a category/type, skip the note and optional answers, choose time/place, review and share. One observation; public success selects its marker/card. |
| 3. Draft and account boundary | Back out/restart; explicitly Continue or Discard. Restored time/place are accurate; reattach/redraw reminder appears. Sign-out/A→B must block A's form and media from being submitted as B (currently a known failure). |
| 4. Account recovery | Signup/confirmation, sign-in/out, restart persistence and recovery link on requesting device. Wrong/expired links fail cleanly. Switch A→B while reset is open: never update B from A's old form (currently a known failure). |
| 5. Photo/video | Own small JPEG and MP4/MOV upload, local preview/playback, pending privacy, explicit staff approval, approved playback, remove. Cancel/denied permission/oversize/unsupported codec fail without losing the observation. Test signed URL refresh after a minute. |
| 6. Failure and retry | Drop connection around save/upload. Attachment retry uses the existing observation. Lost insert response must not create duplicates on retry (currently a known failure). Do not test destructive/network races against production. |
| 7. Private states | Staging owner sees Awaiting review/Hidden; unrelated user and signed-out reader cannot see private content or pending media. Changing accounts clears private lists, details, forms and media. Staff review and independent responses remain distinct. |
| 8. Time and map extent | Expired condition disappears from active markers/list and remains labeled in history. Wording edits/responses don't renew it. Only eligible scenarios offer line/area; collision backup differs from incident point; sensitive cases retain coarse/restricted privacy. Pan so only an extent intersects the screen. |
| 9. Backcountry discovery | Try pow/corn/corduroy/glass/picked-out/chandelier/kill site/fish species. Optional choices stay short/searchable. Grade and measurement do not imply safety. Note the current snowmachining/offroading search gaps. |
| 10. Offline and external links | With prior public data saved, airplane mode clearly labels saved time and incomplete coverage; no fictional fallback/all-clear. Test an uncached viewport (known fallback gap). Provider opens externally; coverage/time must be checked there; no live feed is claimed. |

For any failure, capture **step, expected/actual result, device/build, environment and a redacted screenshot**. No passwords, tokens, private coordinates, recovery links or SQL exports in screenshots/chat. A completed backend deployment is not an App Store/TestFlight release, and does not replace these device checks.
