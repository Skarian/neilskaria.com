# FIRST-BOOT DIAGNOSTIC

Preview: https://portfolio-apnwnpco1-neil-skarias-projects.vercel.app/lab/boot
Deployment ID: dpl_F5xPwCPhg8SnaSnWkAGQdGnWDJ9A

This preview is a measurement tool. It does not propose or apply a stutter fix.
The user reports a similar first-only symptom across devices. No exact device model is required.
The candidate d82230a remains rejected. The diagnostic uses original a796e9a with approved camera fix 042dc805.
Main checkout source and HEAD remain untouched. No production, push, or source commit occurred.

## User procedure

1. Open the preview in a browser that shows the stutter. Keep the tab visible.
2. Wait for START. Press the actual START button. Wait for the site.
3. Press BACK TO THE ROOM. Wait for START.
4. Press START again. Wait for the site.
5. Open FIRST-BOOT DIAGNOSTIC at the top left. Device name is optional.
6. Press Download JSON. Keep the downloaded file for diagnosis.

Do not reload between the two boots. Both boots use the same renderer.
Restart by reload explicitly starts a new measurement session. It preserves the original browser cache behavior.
If reduced motion skips the intro, the missing markers remain explicit. Do not treat that capture as a full boot pair.
No automatic telemetry, uploads, collector, database, account integration, or external diagnostic script exists.
Android can download the initial file without desktop remote debugging.

## Capture contract

The file uses schemaVersion 1. The saved schema is capture.schema.json.
Times use milliseconds relative to performance.timeOrigin. Browser timing duration fields also use milliseconds.
Run 1 starts only when the actual mode changes from room to booting. Run 2 is the full second START.
Returning remains part of run 1 before replay. It never counts as the second boot.
Completion checks require boot-animation-complete, return-animation-complete, and the second boot-animation-complete.
Frames contain engine submission starts, rAF callback timestamps, source s.boot, phase, gap, paint time, main renderer submission time, and total callback time.
Phases include camera-before-power, activation, arrival, drop, colour-glint, fade, and return.
Power activation gates the activation phase. A pre-power s.boot value of zero does not count as activation.
Source-local markers record room readiness, progress, font readiness, START DOM, START transition events, power, texture creation/upload submission, domain paint, and each glyph paint.
Permanent paint markers preserve both boots. No canvas or WebGL prototype is patched.
Navigation and resource records use existing browser timing buffers. Resource names contain paths without query strings.
Optional longtask records use PerformanceObserver. Unsupported APIs and missing markers remain explicit.
Arrays stop at 3000 frames, 1000 events, 500 long tasks, 100 errors, and 200 resources. Dropped counts remain explicit.
Detailed frames cover the first two boot/return windows. The guide hides during animation and object focus.

## Validation

Two complete local diagnostic sessions use desktop and mobile emulation. Both use trusted START, BACK TO THE ROOM, and full second START.
Both run IDs, every phase, material and all glyph/domain/upload markers, original controls, and actual downloads are checked.
Local object-panel checks verify that hidden diagnostic controls do not intercept panel BACK.
The local Vite harness allows only staged source and existing node_modules. This fixes an initial font 403 in the dev harness.
Download tests use native Windows absolute paths and wait for completion. Earlier mixed-path and filename-selection failures remain in failed validation logs.
An initial panel harness selector omitted the arrow in the original BACK label. The corrected selector preserves the source control.
The production preview receives separate full first/replay and download checks on desktop and mobile emulation.
A diagnostic viewport is not physical-device validation. The affected-browser capture remains the next step.
Svelte type check reports zero errors and zero warnings. Staged source formatting passes.

## Overhead and limits

Recorder start timing and schema results are in evidence-summary.json.
Local recorder-start p95 was 0 ms at the browser clock resolution. The maximum was about 0.1 ms.
Original/instrumented desktop sequence task time was 2089.9/2061.5 ms.
This single unordered comparison does not establish a causal overhead bound.
One original desktop pair supplies a limited task-duration comparison. It is not a causal cost bound.
Frame recorder timing excludes marker checks, observers, later clock calls, UI, and download serialization.
No expensive per-frame style/layout reads, synchronous GPU readback, GPU queries, or profiler startup exists in primary mode.
Default Canvas2D and direct fillText remain. Appearance, resolution, cadence, camera timing, audio policy, and source flow remain original.
Submission and rAF timestamps do not establish displayed frames.
Texture onUpdate records upload submission. It does not measure GPU completion or native initialization.
Paint markers follow fillText submission. They do not establish raster-cache or display readiness.
Resolved glyph font, physical refresh rate, GPU execution, and presentation timing remain unmeasured.

## Optional Chrome recording

Open DevTools. Select Performance. Start recording. Perform the same first START, BACK TO THE ROOM, and full second START.
Stop recording. Save the trace. Preserve the JSON from the same sequence.
A webpage cannot collect a full GPU or native browser trace.
Chrome guide: https://developer.chrome.com/docs/devtools/performance

## Delivery safety

source-manifest.json contains the allowlisted file hashes. The stage includes only committed source, runtime assets, build config, and the diagnostic additions.
The exact 92-file isolated stage excludes policy, research, user authoring assets, secrets, Git data, dependencies, and generated output.
The first deployment failed because incorrect ignore negations omitted source directories.
Its ERROR status was inspected before retry. The failure URL, ID, logs, and first manifest remain in the evidence.
The successful deployment used the exact source-only stage without those ignore rules.
The CLI uses installed Node24.21.0 and installed Vercel CLI. Hosted Linux performs the source build.
Only project portfolio in neil-skarias-projects receives a preview deployment.
Deployment status, hosted packaging/precompression, HTTP200, assets, runtime errors, and actual downloads are retained in logs.
The stage and evidence remain for reproduction. Task-owned browsers and servers stop before handoff.

## Reproduction

Run validation from the repository root with installed Node24 and the retained validate.mjs.
The source-stage remains the exact deployed source. Existing root dependencies supply local checks.
Use the saved deployment ID for inspect. Never retry an uncertain dispatch without checking its status.
The prepare/check/finalize scripts preserve the initial construction history. upload-preflight.mjs records the corrected upload method.
No full profiling campaign was performed. The next step is one capture from any affected browser.
