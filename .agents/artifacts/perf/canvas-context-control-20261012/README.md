# Canvas2D context control

Status: Diagnostic preview. This control is not an accepted fix. The affected-device result is pending.

- Baseline: https://portfolio-lk5iol120-neil-skarias-projects.vercel.app/lab/boot
- Control: https://portfolio-lk5iol120-neil-skarias-projects.vercel.app/lab/boot?bootCanvas=will-read-frequently
- Deployment: dpl_H31nmKorFV4GeRmQRtPA3FRJukpW
- Project: portfolio. Scope: neil-skarias-projects. Target: preview.

## User procedure

Use the same affected browser for both links. Keep the page visible. Close the previous page before the next link.
Each fresh page creates a new renderer. Do not reload between the first START and replay.

1. Open the baseline link.
2. Wait for START.
3. Press START.
4. Wait for the site.
5. Press BACK TO THE ROOM.
6. Wait for START.
7. Press START again.
8. Wait for the site.
9. Open FIRST-BOOT DIAGNOSTIC at the top left.
10. Press Download JSON.
11. Close the page.
12. Open the control link.
13. Repeat steps 2 through 10.

The panel shows the selected mode. Download names include default or will-read-frequently.
Data remains in the browser until download. The recorder has no automatic upload.
Do not use automatic START actions. Reduced motion can skip the full animation. Such a capture is incomplete.

Browser, font, operating system, and driver caches can affect the comparison. A fresh page does not clear these caches.
Test order and device temperature can also affect results. Record the order and visible symptom with the two files.
If you repeat the comparison, use the opposite order. Let the device return to a similar temperature.
One pair does not establish reliability. A normal emulated result does not establish a physical-device result.

## Exact change

The source stage copies the previous deployed diagnostic stage. All 92 copied files pass their saved manifest hashes.
The original committed reference hashes also pass. Reference: a796e9aea60def6e0849cb75a151fd6570942339. Approved camera fix: 042dc805.
Rejected main HEAD d82230a is not the base.

The only runtime control changes the actual boot-screen canvas context creation:

- Default: screenCanvas.getContext('2d'). The options argument is omitted.
- Control: screenCanvas.getContext('2d', {willReadFrequently: true}).

context-control.diff contains the exact diff. Only engine.ts, diagnostic.ts, and new context-control.ts differ from the previous stage.
The control does not change scratch contexts, drawing, alpha, resolution, fonts, textures, uploads, cadence, camera, audio, timing, or object panels.
The recorder reads context attributes once at context creation. It adds no per-frame capability or style checks.
The original first boot, return, full replay, bounds, and markers remain.

## Canvas2D semantics

Checked against the current official HTML standard on 2026-10-12:
https://html.spec.whatwg.org/multipage/canvas.html#2dcontext
https://html.spec.whatwg.org/multipage/canvas.html#dom-canvasrenderingcontext2d-getcontextattributes

willReadFrequently marks the context for readback optimization. It is a hint. It guarantees neither a particular backing nor improved performance.
getContextAttributes reports the context settings when the browser supports it. These settings do not prove native raster, GPU, or compositor behavior.
The native cause and display presentation remain unmeasured.

## Capture schema and startup contract

capture.schema.json explicitly adds schemaRevision and experiment. schemaVersion remains 1 for existing analysis compatibility.
schemaRevision is canvas-context-control-1. All original keys, labels, frame meanings, array bounds, and markers remain.
experiment records mode, requestedContextOptions, requestedContextOptionsOmitted, contextAttributes, and contextAttributesStatus.
Default options use null plus requestedContextOptionsOmitted:true. This means no options argument was supplied.
The control records {willReadFrequently:true} plus requestedContextOptionsOmitted:false.
Attributes use null before creation or when unavailable. Status distinguishes not-created, supported, unsupported, and failed.
No setting implies a CPU backing.

Times use milliseconds relative to performance.timeOrigin. Navigation, fonts-ready, room-ready, START-DOM, and START entry completion retain original measurements.
Preserve startup long tasks, gesture-to-boot delay, first callback cost, first powered callback cost, and all phase intervals.
schema-mode-startup-validation.json retains these observations for both modes. They are functional observations, not causal speed estimates.
Callback starts and rAF timestamps do not prove displayed frames. Paint markers follow fillText submission.
Texture markers indicate upload submission. They do not measure GPU completion.
Reject visible regression, worse cadence, or reproducible startup delay. A cost moved into startup is not an accepted improvement.

## Checks and evidence

T3 preview_status and preview_open explicitly reported no desktop automation host. The retained shell/CDP harness used task-owned headless Chrome.
Phone viewport emulation is functional screening only. It does not represent the affected Android GPU or physical display.
Local checks preserve trusted START -> site -> BACK -> room -> START -> site. Both modes pass all phase, glyph, domain, material, and upload markers.
Local object checks preserve panel BACK behavior. Hosted checks repeat the complete first/return/replay sequence and actual downloads.
Samples, actual downloaded JSON, screenshots, network results, and check logs remain in this folder.
verify-json.py checks the updated schema and original analysis schema without external dependencies.
Initial type inference errors remain in initial-types-failed.log. The final type check reports zero errors and zero warnings.
Formatting passes. The type correction has no runtime effect.

## Deployment and source safety

source-manifest.json lists exactly 93 stage files with hashes. base-verification.json retains original hash checks.
The upload includes source, runtime assets, build configuration, and recorder/control source only.
It excludes policy, research, artifacts, secrets, root authoring assets, dependencies, Git data, and generated output.
The hosted log confirms 93 deployment files. Linux builds the source. No --prebuilt upload occurred.
One dispatch produced this preview. deployment.json and deployment-dispatch.json retain its URL and ID.
initial-inspect.log records BUILDING. inspect.log records Ready and target preview. deploy.log retains build and precompression output.
Main source, HEAD, branch, and prior artifact source hashes remain unchanged. No push or production release occurred.
Task-owned browsers and local servers stop before handoff. Root must inspect the result before user delivery.

## Reproduction

Use installed Node24 at C:/Users/Neil Skaria/AppData/Local/node24/node-v24.21.0-win-x64/node.exe.
Run check.mjs and validate.mjs from the repository root. Existing root dependencies supply local checks.
Pass the baseline preview URL to validate.mjs for hosted checks. The script tests both query modes.
Run verify-json.py after downloads. Run upload-preflight.mjs only after local checks finish.
The deploy script refuses a second dispatch when a dispatch file exists. Inspect the retained deployment before any retry.
Do not rerun prepare.mjs over the retained stage.

Final checks: 106 local and 86 hosted checks passed. All eight sample/download files passed both schemas.
Main HEAD, branch, status, and tracked file hashes match their initial values. All prior deployed source hashes still match.
The retained stage still contains exactly 93 allowlisted files. Only willReadFrequently differs in the reported context attributes.
