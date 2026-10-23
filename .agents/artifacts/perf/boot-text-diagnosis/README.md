# Boot text attribution — final findings

Execution thread, confirmed by live T3 thread list: thread:delegated-task:command%3Amcp%3A80542bac-c478-4132-82ff-eeb498252c1f%3Adelegate-task%3Acamera-conflict-fix-20261012-r1.
Request key: camera-conflict-fix-20261012-r1. App source includes only camera commit 042dc805f9135f3b4efbcd0d2a9e90eafcdd80c0 above baseline 1aafb1102b0ceecbd179f21afeb9b270e0c246b9, redesign. A later unrelated .gitignore-only commit a796e9a is preserved; all four instrumented source files match the saved fixed source byte-for-byte.

## Quantitative conclusion

Animated text painting drives the main reproduced text-phase cadence loss on this Windows host. In the exact 0.35–3.5 s.boot interval at 4x CPU, omitting only fillText on the 960x640 boot canvas reduces light-capture median p95 gap 27.4 → 17.8ms (−9.6ms, −35.0%), maximum gap median 29.6 → 21.0ms (−8.5ms, −28.9%). Baseline p95 spans 27.2–28.8ms, control 17.7–17.9ms; restored A runs bring the slower cadence back. Text measurement, letter layout, color/transform math, full-canvas clears, glint rectangles, one full boot upload per frame, resolution, camera source/GSAP schedule and ordinary audio policy remain. 1,886/1,882 text calls are suppressed. All 189/188 control text-interval frames still upload the boot canvas.

The matched trace confirms the mechanism: main-thread RasterImplementation::RasterCHROMIUM wall duration falls 593.564 → 19.472ms (−574.092ms, −96.7%) in the text interval, despite 179 → 195 raster calls (clock-canvas calls are also present). A second A trace records 620.383ms. Large raster stalls align with boot ~1.1–1.6s, during assembly/drop of the letters. This is browser raster/serialization/flush pipeline wall time, not a GPU execution-time budget. Text's changing pixels can also affect native image/driver paths and compression; the control does not prove an exclusive per-glyph GPU cost.

## Why the upload-only conclusion changed

The initial six A/B/C captures showed large apparent gains for B and C. README-initial-six.md preserves that interim interpretation; it is superseded here.
A draws/uploads normally. B freezes drawing after the initial image but keeps upload calls. C draws normally but stops boot uploads after the initial image. B's cached canvas makes the retained upload API far cheaper, so it cannot isolate drawing CPU alone.

Later alternating light A/C/restoration captures show only 27.4 → 26.5ms p95 (−0.9ms, −3.3%), and max 30.9 → 31.9ms (+0.9ms, +3.1%). Counts >34ms are zero in both matched groups. Upload suppression alone is not a reliable fix attribution.
Trace A/C raster wall totals are 620.383/621.579ms. In A, 620.184ms is inside animation callbacks; in C, only 1.602ms is inside, with the remaining work after the callbacks. C moves canvas raster/flush work rather than eliminating it. Thus the prior 259 full-START texture API calls / ~682–693ms should not be called byte-transfer or GPU execution cost: much of that call site pays deferred canvas work.

## Stage separation and normal CPU

- Original six diagnostic captures: drawing totals 174–220ms in the text interval (p95 1.7–2.3ms/frame); repeated measureText takes 38–48ms (p95 0.5–0.7ms/frame), 3,808–4,046 calls. Measurement timers have overhead. Measurement is a subset of drawing, not additive. Keeping that work while suppressing text painting still restores near-normal cadence; repeated text metrics are not supported as the primary stall cause.
- A's measured boot upload API wall totals 648–683ms within the interval; uploads are inside submission and often contain deferred raster work. Do not add these to drawing/raster/submission totals.
- D keeps normal drawing and boot uploads via renderer.initTexture but omits scene rendering only during the text interval. Median p95 25.9 → 22.4ms (−3.6ms, −13.7%), max 30.3 → 31.6ms (+4.5%). Scene rendering consumes budget but does not reproducibly explain the worst text-specific tails by itself. D also omits other scene texture consumers/world-matrix/render work; camera position/boot state continue unchanged.
- Asynchronous EXT_disjoint_timer_query_webgl2 works: A median per-frame query elapsed 7.7–9.8ms, D about 0.4ms, zero completed-query disjoint rejections, all results polled without finish/readback. D2 has a 68.4ms elapsed-query outlier while its callback max gap is 30.1ms. Queries bracket submitted work and can include idle/synchronization; they are not utilization or display-present measurements.
- Normal CPU light A/C: baseline p95 17.9–18.0ms/max18.3–18.6ms, control p9517.8–17.9/max18.2–18.5, no >34ms gaps. This host does not reproduce a severe normal-CPU boot-text stall. Prior full cold START 4x p9524.7/max75.7 is a broader window and must not substitute for these text-only measurements.

## Method and evidence

29 valid short boot captures: six initial A/B/C, five A/D GPU diagnostics, ten A/C light normal/4x, four E/restoration light, and four targeted traces (two A, C, E). Two invalid initial instrumentation captures are retained in failed-instrumentation and excluded. A script-construction failure generated no instrumented source. Prior boot-interactions-20261011 evidence is unchanged.
Fresh isolated Windows Chrome154 profiles; ANGLE Radeon RX590 Vulkan1.3.260 / AMD proprietary driver. Phone-sized 412x915 DPR2.625, app cap2, 824x1830 buffer. Real touch START, 2.5s settled room, 8.5s collection, before radio interaction. Normal audio/autoplay, no mute/bypass, no bandwidth throttling or storage seeding.
Gaps are engine render-callback submission starts, not display-present frames. Source s.boot selects the exact interval. One upload per frame is verified by low-overhead counters in light A/E; C has zero in the text interval. Light probes disable measurement/shader wrappers, GPU queries and disjoint polling; source-stage boundaries still have timers. No per-frame style/layout sampling.
Normal and slower conditions use the same camera code, animation durations/easing, canvas/render resolution and source state. Driver/OS caches persist across fresh profiles; later baseline tails are smaller than early ones. Shared-host scheduling and only two control repetitions limit precision. No pooled traced/untraced numbers.

Source: engine.ts:1366, boot-screen.ts:48. Raw JSON, trace JSON.gz, scripts, summary.json (initial six), extended-summary.json and trace-summary.json are preserved. Full absolute/percentage contrasts and variation are in ../interaction-attribution/comparisons.md and cause-breakdown.json.

## Limits and cleanup

The causal claim is animated-text raster/flush work on this host, not exclusive GPU glyph execution, pure upload bandwidth, or universal macOS/Android behavior. Native raster execution, serialization and queue waits remain grouped in the browser trace span. Exact missing measurements for device-visible claims: display-present timestamps, physical-device GPU/backend timing, and finer native raster/transfer breakdown without introducing synchronous readback. Next targeted experiment, if needed, is per-glyph/scale raster workload or native graphics-service breakdown with the same camera/clears/uploads; no optimization is shipped.
All diagnostic edits are restored, clean client/server output regenerated and checked for hook markers. Full Node24 build still fails Vercel packaging on Windows symlink EPERM; no full build/precompression pass is claimed. Owned server/browser/profile cleanup and checks: ../interaction-attribution/cleanup.json. No push/deploy, dependencies/global settings, text/font/cadence/appearance optimization, Safari or missed-click investigation.
