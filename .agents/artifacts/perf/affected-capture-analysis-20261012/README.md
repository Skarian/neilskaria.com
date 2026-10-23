# Affected-browser capture analysis

This file represents a later first-boot cadence penalty. It does not show an immediate first-activation stall.
Recorded replay callbacks still contain many 33-50 ms intervals. The full first-stutters/replay-smooth display contrast remains unmeasured.
Astra's independent calculations agree after rounding. No statistical disagreement remains.
No application source, build, Git state, or deployment changed. Candidate d82230a remains rejected.

## Validation

The supplied attachment remains intact. `capture.json` is its exact 303648-byte copy.
Original path: `C:/Users/Neil Skaria/.t3/userdata/attachments/fab6e615-3ee1-4b06-99e4-bbf3bda6d6af-d37dd528-0728-4c65-bf05-09d6e29f0f59-json.json`.
Supplied name: `first-boot-diagnostic-2026-10-12T12-37-09-586Z.json`.
SHA256: `5282fb0224e1e3dbf13fafc0bd386c053e3f2c25fa1e4bb4e22dd43dac81b179`.

Schema 1 passes every saved schema rule. Timing and semantic checks pass.
There are 919 frames, 70 events, 3 startup long tasks, 0 errors, and 38 resources. Arrays stay below their bounds.
`counts` contains dropped counts, not array lengths. All dropped counts are zero. All required markers are present.
Two trusted STARTs produce two complete boots. Two trusted BACKs produce two complete returns.
Compare run 1 booting with run 2 booting. Returns never count as replay. All phases have samples.

The browser reports Android Chrome154, Adreno740/ANGLE GLES3.2, viewport411x784/DPR2.625, and buffer822x1568.
This is affected-browser data. Reduced Android10 UA does not identify actual OS/model.
Visibility is visible, with no visibility-change event. There are no error records.
There is no dedicated context-loss listener, so absent context events do not certify native context continuity.
Fonts are loaded and reduced motion is false. Resolved fonts and refresh rate remain unmeasured.
Reference a796e9a includes approved camera042dc805. The prepared-glyph/panel candidate is absent.

## Paired cadence

Values are milliseconds. Quantiles interpolate at `(n-1)*p`. Counts use strict descriptive thresholds, not universal display standards.
Gaps measure engine callback starts. rAF deltas use recorded renderer callbacks, not all browser callbacks or displayed frames.
Incoming gaps retain predecessors across phase boundaries. The first callback in each mode has no measured predecessor gap.

Engine gaps:

| Phase | First n / replay n | First p50 / p95 / max | Replay p50 / p95 / max | First counts >25 / >34 / >50 | Replay counts >25 / >34 / >50 |
|---|---:|---:|---:|---:|---:|
| camera-before-power | 168 / 168 | 16.70 / 18.40 / 24.10 | 16.70 / 17.20 / 17.80 | 0 / 0 / 0 | 0 / 0 / 0 |
| activation | 17 / 12 | 16.60 / 35.20 / 36.80 | 32.75 / 33.99 / 34.10 | 4 / 3 / 0 | 8 / 1 / 0 |
| arrival | 24 / 23 | 33.50 / 50.39 / 50.90 | 33.60 / 49.39 / 51.00 | 18 / 9 / 2 | 20 / 8 / 1 |
| drop | 19 / 22 | 34.00 / 53.05 / 54.40 | 33.70 / 48.39 / 52.00 | 19 / 9 / 5 | 22 / 9 / 1 |
| colour-glint | 39 / 45 | 48.10 / 51.83 / 53.90 | 33.10 / 51.42 / 52.50 | 39 / 24 / 9 | 44 / 17 / 4 |
| fade | 26 / 38 | 33.75 / 52.45 / 52.70 | 25.35 / 39.95 / 65.20 | 24 / 11 / 6 | 19 / 8 / 2 |
| return | 155 / 159 | 17.10 / 35.56 / 57.20 | 16.80 / 35.22 / 50.20 | 31 / 12 / 3 | 26 / 15 / 1 |

rAF timestamp deltas:

| Phase | First n / replay n | First p50 / p95 / max | Replay p50 / p95 / max | First counts >25 / >34 / >50 | Replay counts >25 / >34 / >50 |
|---|---:|---:|---:|---:|---:|
| camera-before-power | 168 / 168 | 16.70 / 16.80 / 16.80 | 16.70 / 16.80 / 16.90 | 0 / 0 / 0 | 0 / 0 / 0 |
| activation | 17 / 12 | 16.70 / 33.32 / 33.40 | 33.30 / 33.45 / 33.50 | 4 / 0 / 0 | 8 / 0 / 0 |
| arrival | 24 / 23 | 33.40 / 50.00 / 50.10 | 33.40 / 50.10 / 50.10 | 18 / 4 / 1 | 20 / 4 / 3 |
| drop | 19 / 22 | 33.40 / 50.11 / 50.20 | 33.40 / 49.18 / 50.10 | 19 / 8 / 4 | 22 / 2 / 1 |
| colour-glint | 39 / 45 | 49.80 / 50.10 / 50.20 | 33.40 / 50.10 / 50.10 | 39 / 20 / 5 | 44 / 7 / 5 |
| fade | 26 / 38 | 33.40 / 50.10 / 50.30 | 25.05 / 35.91 / 66.70 | 24 / 10 / 7 | 19 / 2 / 2 |
| return | 155 / 159 | 16.70 / 33.40 / 50.10 | 16.70 / 33.40 / 50.10 | 30 / 3 / 2 | 27 / 2 / 2 |

Incoming engine means first/replay: camera16.66/16.68, activation20.88/28.31, arrival32.08/34.05,
drop40.43/34.90, colour-glint41.86/35.60, fade38.56/26.34.
Counts at least42ms: drop8/2, colour-glint20/7, fade10/2. Activation is slower on replay.
Colour/glint median rAF is49.8/33.4ms. Its partial first penalty is clear in this case.
Text-only engine p95 is52.19/51.055ms, delta+1.135ms. Text rAF p95 is50.1/50.1ms.
Text gaps above25ms are76/82 and86/90. Replay remains slow in the recorded callbacks.

The source fade phase includes the final camera transition at boot=4.
- Run 1: fade before boot 4 gap p95 52.35 ms. Camera tail at boot 4 gap p95 50.99 ms.
- Run 2: fade before boot 4 gap p95 39.62 ms. Camera tail at boot 4 gap p95 37.88 ms.

While powered, solid-fill returns have mean engine gaps28.4525/28.3051ms and p9538.78/39.64ms.
Selection uses returning frames before power(false). These returns contain no boot text.
Return paintMs is zero because the timer excludes the solid-fill branch. Those calls remain inside totalMs.
Shared canvas/texture/render work warrants investigation. Scene, camera, compositor, and scheduling remain confounds.

## Stage alignment

First/replay text paint p95/max:1.30/1.90 and0.80/1.10ms.
Submission p95/max:5.195/6.10 and5.42/6.30ms. Total callback p95/max:6.89/7.50 and6.755/7.60ms.
No measured paint, submit, or total callback exceeds25ms.
All boot gaps at least42ms follow measured callbacks at most7.50ms first and6.30ms replay.
Total contains paint and submission. Long tasks can contain callback work. Do not add these nested durations.

- First worst: index220, drop, boot1.515, t9454.600, rAF9442.300. Engine/rAF gap54.400/50.000ms.
- Predecessor219: boot1.482, t9400.200, rAF9392.300, paint/submit/total0.500/4.700/5.700ms. Unmeasured remainder48.700ms.
- Current callback220 takes6.900ms after the gap. It cannot directly explain its incoming gap.
- First colour/glint worst:235, boot2.144, t10084.000. Gap53.900/50.000ms follows predecessor t10030.100, total4.300ms. Remainder49.600ms.
- Replay text worst:693, boot2.486, t24717.700. Gap52.500/50.100ms follows predecessor t24665.200, total3.800ms. Remainder48.700ms.
- Replay global worst:748, boot4 camera tail, t26515.600. Gap65.200/66.700ms follows predecessor t26450.400, total2.400ms. Remainder62.800ms.

No captured event or long task intervenes in these worst gaps. Global maxima alone hide the phase-specific first penalty.
All three long tasks occur before START. None overlaps a boot or return.
Unmeasured remainder includes other app work, browser work, and waiting. It is not proven idle time.

First domain/upload callback starts7908.300ms at boot.003. It takes5.100ms and precedes gap17.200ms.
Replay callback starts22207.300ms at boot.011. It takes3.600ms and precedes gap16.600ms.
Power markers occur7893.600/22193.600ms. No immediate first-domain/upload stall appears.
All ten glyph positions record first paint during arrival. Large gaps persist after all glyph markers.
Paint markers follow fillText calls and do not establish raster readiness. Upload markers do not measure native GPU completion.
The upload marker is once per run, so the replay marker does not indicate new texture allocation.
Source power(true) changes the material map and flags an update. Its native cost remains unknown.

Startup: fonts-ready2495.900, room-ready2689.100, START DOM2691.100, START entry complete3706.500ms.
START gestures4926.700/19221.900 precede boot modes5091.700/19383.300 by165.000/161.400ms.
Pre-power camera spans2801.900/2810.300ms. Full boots7331.200/7304.300ms, delta26.900ms.

## Conclusion and ONE next control

Supported: later partial first penalty and shared post-power cadence loss. Measured render work and recorded long tasks do not account for large gaps.
Unknown: deferred raster/flush, native texture work, GPU queues/execution, compositor, scheduling, and presentation.
Short callbacks do not prove a GPU/driver cause. Windows raster findings remain context, not attribution for this case.
One ordered pair has uncontrolled caches, overhead, and thermal state. Confidence is high for case metrics and low for causal/general reliability.

Next control: change only boot-screen context creation from default Canvas2D to `willReadFrequently:true` in a future isolated diagnostic.
Preserve direct drawing, pixels, resolution, uploads, phase timing, camera, and gesture audio. Add no caches, preparation waits, or panels.
Prediction: post-power rAF intervals decrease at identical source phases if canvas-path interaction contributes.
Unchanged or worse cadence rejects that prediction. The setting guarantees neither CPU backing nor improvement.
A response can separate canvas-path interaction from unchanged font measurement/JS, but cannot identify an exclusive native cause.
Measure navigation-to-room-ready, START DOM/entry completion, startup tasks, and first callback cost in the comparison.
Reject appearance/cadence regression or reproducible startup delay. The hint can move cost into startup. One positive pair does not establish reliability.

A mapped-screen blank warm draw could test mapped-material first use, then restore the unpowered screen before START.
Defer it here: no immediate first-activation stall appears, the penalty occurs later, and the warm draw adds pre-START work.
A moved delay is not an accepted improvement. No control was executed in this task.

Native attribution needs this JSON plus a synchronized affected-browser trace of the same sequence.
Required tracks: other main tasks, Canvas2D raster/flush, native texture work, GPU queue/execution, compositor scheduling, and frame presentation.
A synchronized screen recording can show visual contrast but cannot isolate GPU execution. Missing native tracks remain an explicit limit.
The device model is not required. No further Windows matrix or local application capture is justified.

## Evidence and reproduction

`summary.json` retains all phase/work quantiles, counts, means, deltas, exact markers, and glyph/domain event alignments.
`worst-frame-neighborhoods.json` retains every gap above25ms on either clock, predecessors, nearby events, and overlapping long tasks.
Run `python analyze.py`, then `python report.py`. Both scripts use the standard library and write only beside themselves.
The report generator imports the analyzer and recomputes metrics. Source/schema hashes remain in summaryJSON.
`comparison.html` is self-contained. T3 HTML previews pass at728/360px without console messages. Root will inspect and publish.
No dependencies, upload, telemetry, paid service, source change, or deployment occurred.
