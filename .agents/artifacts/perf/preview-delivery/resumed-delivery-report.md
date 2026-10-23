# Resumed preview delivery — 2026-10-12

Preview: https://portfolio-k0w0vbifj-neil-skarias-projects.vercel.app/lab/boot
Deployment ID: dpl_7QwaEX49La39Gts67jG3KF5SY8UP
Revision: d82230acab7f4e2be780afd0847330a6926573d1, branch redesign.
Root accepted independent review; no blocking source defect. Preview evaluation authorized.

## Delivered

Existing signed-in Chrome session showed skarian. Standard Vercel CLI device authorization succeeded. The first login could not save the normal auth file because of sandbox permissions. Narrow Auto-review login retry succeeded; whoami and project inspect confirmed skarian and portfolio in neil-skarias-projects, project QmTWQ3SUZhG8FUnLimk8779iei8nabQuJet46c36dPowRw. No credential file was manually read, copied or edited; no browser cookies were extracted. No new identity, unrelated integration or permission request was accepted. Auth success screenshot retained; dedicated auth tab closed.

Rechecked reviewed HEAD, empty tracked diff, README existence, all 91 source/staged hashes and byte sizes, path containment, no extra stage files or file links. Explicit allowlist preserved. Stage has 2,546,865 source bytes.

Initial deploy pipeline could not open its artifact log. Deployment list inspection confirmed no new dispatch. Narrow Auto-review retry uploaded only source-stage. This created one new preview. Full hosted logs are deploy-restored.log. Hosted Linux SvelteKit client/server build, adapter function packaging and precompression completed. GLB precompress: 1,183,392 -> 965,768 bytes. Terminal JSON says READY; subsequent inspect confirms Ready and target preview. The PowerShell pipeline returned exit1 because native stderr became a PowerShell error record; this does not override the verified remote READY result. Build warnings include existing optional peer mismatch and bundle size warning.

No project settings/domain/ownership changes, production release, push, merge, commit or application source changes occurred. Application HEAD remains reviewed d82230a. The original delivery-report.md and deploy.log are preserved as historical blocked-attempt records.

## Deployed checks

- /lab/boot HTTP200; title Boot intro prototype · Neil Skaria. /api/stations HTTP200 with six station IDs and timestamp; response saved in http.json.
- Fresh-profile Windows headless Chrome154, real GPU via ANGLE Vulkan; desktop 1280x800, mobile emulation412x915 at DPR2. T3 preview_status/open both explicitly unavailable; authorized shell headless fallback used.
- Desktop lantern/radio focus and BACK passed. Rapid radio reselection passed in first attempt. Rapid lantern reselection passed after targeting its moved position. Mobile lantern/radio focus and BACK passed.
- START boot completes to placeholder site. Return-to-room passes in final condition-based run; inactive panels remain inert. final-smoke.json contains five passing checks and zero errors.
- Loaded production chunk CujqT245.js contains glyphs, scratch and drawImage preparation path. All inspected emitted JavaScript has no __lean/__panelPerf/__boot/__camera hooks; final browser globals check also passed.
- Captured runtime/console errors0, loading failures0, HTTP failures0. Room GLB.br, Draco WASM, WOFF2, MP3, portrait/environment/room textures all return200. Network records retained in smoke.json.
- Visually inspected desktop room, lantern, radio, boot glyph and mobile room/lantern/radio screenshots. No physical-device or Safari claim. Radio UI reached On air; audible output unverified.

Harness limitations preserved: first smoke attempt used room coordinates for rapid lantern reselection and missed its moving position; smoke-first-attempt.json retains that failed assertion. Second attempt initially selected the nested footer POWER button instead of the room-return button, then checked the actual return before its animation ended. Both false fixed-wait assertions remain in smoke.json. The final run uses the exact BACK TO THE ROOM button text and a condition-based wait; return passes. These are harness targeting/timing corrections, not source edits. Boot screenshot desktop-boot.png precedes glyph painting; desktop-boot-glyph-2.png shows the painted glyphs.

## Evidence and limits

deployment.json, manifest.json, deploy-restored.log, inspect-ready.log, http.json, emitted-code.json, smoke-first-attempt.json, smoke.json, final-smoke.json and PNG screenshots are retained here. Smoke harnesses are saved here for reproduction. Source-stage is preserved for review.

Prior review measurements are unchanged: boot4x p95 20.85 ->17.8ms; first lantern/radio maxima115.3/159.3ms. Panel p95 worsens, final4x radio readiness increases469.75ms. Prepared RGBA canvas storage7,438,536 bytes; extra GPU/browser storage unmeasured. Antialiasing differs. Uniform smoothness and physical display presentation are not established. Full performance campaign was not rerun.

Only task-owned temporary browser profiles and root temporary handoff files are cleaned after saving harnesses/logs. Browsers closed by harness finally blocks; no temporary server started. Artifacts and coordination remain uncommitted.
