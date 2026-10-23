# Lean canvas hint experimental preview

Status: Deployed and verified for experimental delivery only. Root accepted the candidate source for this scope. Production acceptance and Android reliability remain unresolved.

- Original context: https://portfolio-l3mjwpd3y-neil-skarias-projects.vercel.app/lab/boot?bootCanvas=default
- Hint context: https://portfolio-l3mjwpd3y-neil-skarias-projects.vercel.app/lab/boot?bootCanvas=will-read-frequently
- Candidate default: https://portfolio-l3mjwpd3y-neil-skarias-projects.vercel.app/lab/boot
- Inspector: https://vercel.com/neil-skarias-projects/portfolio/BdRi826ZYAwiEyaDYXuqXKLL7iSn
- Deployment: dpl_BdRi826ZYAwiEyaDYXuqXKLL7iSn

The existing CLI identified account skarian and the specified portfolio project. inspect.log confirms preview target and Ready status. deploy.log records one source dispatch and 93 downloaded deployment files. No production deployment occurred. No account, project settings, domains, integrations, dependency files, or tracked source changed.

## Source integrity

The source baseline remains a796e9aea60def6e0849cb75a151fd6570942339 with approved camera fix 042dc805. The rejected checkout HEAD d82230acab7f4e2be780afd0847330a6926573d1 remains untouched on redesign.

copy-verification.json records the exact 93-file set and every hash before and after copying. Only diagnostic.ts differs from the accepted stage. accepted-stage-correction.diff contains only the authorized source/schema labels and panel sentence. No application behavior changed in this copy. source-manifest.json records every uploaded source file. upload-preflight.json records its hash before dispatch. final-verification.json checks the same source and parent hashes after delivery.

Manifest SHA256: 6225522a2a42ab710db8d6b607db10a75bcddf84d171f8457c0cec01b0bf287a
Source digest: 97fe7bbc5300e564cfca25fdf1dae631c615b76933274a21ec7ff7f0c05a1691
Digest convention: SHA256 of ordered path + NUL + file SHA256 + LF.
Comparable source digest: 9759c861521bcf6b771a8355e36fd3fb6712dff95108d3cd854cc386a9607c63
Comparable convention: SHA256 of ordered path + space + file SHA256 + LF, as used in candidate preparation.

The stage contains no atlas paths, imports, assets, credentials, private artifacts, .git, dependencies, or local build output. Vercel received only the allowlisted source stage. No second upload occurred.

production-eligible-proposal.patch remains separate and unapplied. It proposes only the screenCanvas 2D willReadFrequently option against the approved baseline. It has no production approval.

## Hosted checks

The hosted Linux build passed client/SSR compilation, adapter packaging, serverless generation, and precompression. It resolved the Windows adapter symlink packaging failure without configuration changes. The existing large-chunk warning remains in deploy.log.

hosted-verification.json records 107 passing checks. Root and both explicit mode URLs returned HTTP 200. Each mode requested a 960x640 2D context. Original omitted options and returned willReadFrequently=false. Hint requested and returned willReadFrequently=true. The candidate URL also selected hint.

Actual START-animation-start and START-animation-complete events passed. BootIntro.svelte emits these through Svelte intro events. The harness did not require the unrelated inherited START-css-animation-complete marker. No source transition event changed.

The paired startup captures used fresh owned Chrome profiles, identical room-entry storage, disabled browser cache, and bypassed service workers. They downloaded actual JSON after START-animation-complete without pressing START. Missing full-boot markers are expected in these captures.

Original create-to-ready: 1496.8 ms. Hint create-to-ready: 919.9 ms.
Original fonts-to-ready: 168.9 ms. Hint fonts-to-ready: 160.5 ms.
These ordered desktop observations do not establish a causal improvement. OS, font, driver, and run-order variation remain. This browser emulates phone layout. It is not the affected Android device.

One candidate functional check completed trusted START, site, BACK, room, START, and site. Both boots included every required marker and phase. The return markers passed. The panel produced a completed JSON download with the new source/schema identity. Browser errors, unexpected asset failures, and dropped records were absent. No atlas resource appeared.

compression.json records correct Brotli and GLB headers. The decoded compressed response exactly matches the source GLB hash. The hosted compressed model returned 200. No local compressed-model fallback exception was used for hosted checks.

Screenshots followed timing and download capture. Room and site text was legible. General appearance remained consistent. The engine, camera blend, fonts, resolution, timing, audio, panels, and storage source remain byte-identical to the accepted candidate. Camera approval is preserved by source hashes and successful return/replay. No native GPU, compositor, driver, physical display, or glyph-cache readiness measurement occurred.

## Failures and corrections

The first download used a mixed-separator Windows path. Chrome received bytes but canceled saving. hosted-failed-1791856092051.json and verify-attempt1.mjs retain this failure. The corrected native absolute path produced real completed downloads.

The first same-tab harness read a stale navigation/download event. same-tab-restart-failed-* and restart-procedure-attempt1.mjs retain the failure. The corrected harness waits for the new navigation origin, requested mode, and new download event. A PowerShell replacement command also failed to parse before mutation. correct-restart-harness.mjs records the successful correction. No source change addressed these harness failures.

T3 preview_status and preview_open explicitly reported no automation host. The fallback used fresh task-owned headless Chrome profiles. No private browser profile or credential file was read. Sandbox writes under .agents failed. Narrow per-command Auto-review escalations authorized the artifact writes and deployment.

## Next affected-device startup check

1. Use the same affected browser and tab.
2. Open the original context URL above.
3. Open FIRST-BOOT DIAGNOSTIC.
4. Press Restart by reload.
5. Accept the app confirmation.
6. Wait until START finishes appearing.
7. Do not press START.
8. Press Download JSON.
9. Open the hint context URL in the same tab.
10. Repeat steps 3 through 8.
11. Return only the two startup JSON files.

Both restarts set session room-place=room. Both runs enter room from loading and use warmed network caches. Do not clear caches or browser storage. Browser, driver, and order variation remain. No full animation or GPU repeat is requested.

verified-same-tab-restart-verification.json records 16 passing checks for this procedure in one owned tab. Both modes used trusted Restart clicks and actual app confirmations. Both actual downloads contain zero boots and real START completion markers. This validates the procedure on desktop only.

All task-owned browser and CLI processes stopped. cleanup files record process closure. final-verification.json confirms the accepted parent, exact stage, branch, HEAD, and tracked hashes remain unchanged.
