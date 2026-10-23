# Boot text diagnostic follow-up

Task: node:delegated-task:command%3Amcp%3A80542bac-c478-4132-82ff-eeb498252c1f%3Adelegate-task%3Acamera-conflict-fix-20261012-r1.
Source: redesign 042dc805f9135f3b4efbcd0d2a9e90eafcdd80c0, after the focused camera correction. Captured 2026-10-12 UTC / 2026-10-11 America/Chicago.
Six valid captures, two per temporary variant, order A1 B1 C1 C2 B2 A2. Two earlier captures A1/B1 with a misplaced instrumentation timer are invalid, excluded, and retained in failed-instrumentation. One script-construction failure generated no instrumented source; clean-build-before-controls.log records its clean build. No additional successful captures or full profiling campaign.

## Conclusion

The text phase reproduces delayed engine callbacks under 4x CPU. Unchanged A has p95 gaps 31.2?39.4ms, max 47.5?48.8ms, and 8?12 gaps above 34ms. The long gaps concentrate around boot 0.925?1.572s, especially 1.18?1.50s, while letters assemble and drop toward the center. These are measured engine submission starts, not proof of visible display-frame drops.

B freezes canvas drawing after its first boot image, retaining one boot-canvas upload per engine frame. It has p95 17.7?18.0ms, max 18.1?18.4ms, zero gaps above 34ms.
C retains normal drawing, suppressing boot-canvas uploads after the initial boot image. It has p95 25.2?29.9ms, max 29.2?40.3ms, and 0?1 gaps above 34ms.

Inference: updating and uploading the freshly drawn boot canvas contributes materially to the text-phase stutter in this Windows configuration. C retains drawing yet removes almost all >34ms gaps and reduces submission p95 from 27.0?32.9ms to 7.1?8.4ms. B also improves gaps, but its retained upload API wall time falls from A's 648?683ms total to 27?31ms in the text interval, so B is not a pure isolation of drawing CPU cost. An unchanged canvas has a substantially cheaper upload path here. This comparison cannot separate canvas rasterization, browser conversion/synchronization and GPU execution.

Repeated text measurement is verified: A performs 3,808?4,046 calls within the interval, taking 37.9?48.0ms total (p95 0.5?0.7ms per frame). Entire drawing costs 174?220ms (p95 1.7?2.3ms). MeasureText is a measured subset of drawing, and uploads are a measured subset of submission; do not add nested totals. Measurements make repeated text metrics a contributor, but do not support naming font measurement as the primary cause of the ~40?49ms gaps. No font/cadence/appearance optimization is authorized or shipped.

## Text interval, 0.35 <= s.boot <= 3.5

All timings ms. Upload column is boot-canvas WebGL API wall-time total, not GPU execution time.

| Run | Frames | Gap p95 | Gap max | Gaps >34 | Draw p95 | Submission p95 | Upload total |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| A1 | 159 | 39.4 | 48.8 | 12 | 2.3 | 32.9 | 683.1 |
| A2 | 169 | 31.2 | 47.5 | 8 | 1.7 | 27.0 | 647.6 |
| B1 | 189 | 18.0 | 18.4 | 0 | 0.0 | 8.9 | 26.9 |
| B2 | 190 | 17.7 | 18.1 | 0 | 0.1 | 10.0 | 31.1 |
| C1 | 180 | 25.2 | 29.2 | 0 | 1.4 | 7.1 | 0.0 |
| C2 | 173 | 29.9 | 40.3 | 1 | 1.8 | 8.4 | 0.0 |

Full boot A has 239/249 boot-canvas uploads, 731/704ms API wall time. This is consistent with the prior full-START diagnostic's 259 calls / ~682?693ms being a real upload-path cost, but conditions/instrumentation and exact upload classification differ; the prior aggregate cannot locate a text-phase gap by itself. Prior cold boot at 4x had whole-START p95 24.7ms/max75.7ms; it is not directly interchangeable with this narrower interval.

## Method and limits

- Windows headless Chrome 154.0.0.0, ANGLE Radeon RX 590 Vulkan 1.3.260 / AMD proprietary driver, hardware GPU. CPU throttling 4x does not emulate a slower GPU.
- Phone-sized viewport 412x915, browser DPR2.625, app DPR cap2, 824x1830 drawing buffer. Not a physical phone, Android, macOS or Safari. No GPU timer or display-present timing.
- Fresh isolated Chrome profile per run; normal audio/autoplay policy. Real touch START, 2.5s settled room, no prior radio/object interaction, 8.5s collection. No panel opened; no console/runtime errors in all six valid captures. No mute/autoplay bypass.
- Same production instrumented bundle for A/B/C, selected by a temporary query parameter. Original boot GSAP timeline, camera math and sound remain unchanged. Each engine frame records boot, dive and camera position. Controls deliberately freeze the screen image and are diagnostic only.
- Per-frame start t and rAF timestamp recorded after idle gate. Gaps use start-to-start differences, including the immediately preceding frame at the interval boundary. s.boot picks the interval rather than the entire START sequence.
- Canvas drawing wall time wraps drawBootScreen. measureText is locally wrapped for count/wall time. Render-submission wall time includes all renderer passes. texImage2D/texSubImage2D are wrapped on this renderer; source-canvas identity distinguishes boot texture from clock/other uploads. Wrapper timers, records and PerformanceObserver add overhead; timer quantization affects tiny calls. API return time can include synchronization/raster work but is not GPU completion.
- summary.json includes preceding frame drawing/submission/upload times for each >34ms gap and full boot/camera progress. Raw A1/A2/B1/B2/C1/C2 JSON and scripts are preserved. Exactly six valid matched captures; only two repetitions, not population statistics. Fresh-process warm/cache/scheduling variation remains.
- T3 preview_status and preview_open explicitly unavailable; authorized isolated shell/CDP fallback. No unrelated/private browser tabs inspected.
- All temporary diagnostic source edits restored byte-for-byte to committed source before captures. Node24 client/server generation succeeds but adapter-vercel packaging fails Windows symlink EPERM even with approved command. A full build/precompression pass is not claimed. Final clean-output rebuild and cleanup status are recorded in cleanup.json.
- Camera fix evidence is in ../camera-conflict-fix/README.md. Source remains that two-line focused commit; no text optimization, dependencies, global settings, push or deploy. Safari and missed-click investigation remain deferred.
