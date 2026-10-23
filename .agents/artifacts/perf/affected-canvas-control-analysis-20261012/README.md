# Affected Canvas2D control analysis

The control records near-16.7 ms text cadence on first boot and replay. The older default records 35–39 ms mean text gaps.
The user reports “Clearly smoother”. This visual report agrees with the measured direction but remains separate evidence.
This is one positive cross-session comparison. It does not establish reliability or a CPU/GPU backing.

No application source, build, Git, or deployment changed. Main HEAD d82230a remains rejected.
This worker owns only this new artifact directory. Root will publish the HTML after review.

## Validation and source alignment

The exact 403871-byte attachment copy is capture.json. SHA256:
9dcea10df91c2e53cad44b0723be40a2e7a9bcd7d20bbc666a6236b8d336e9d1.
The original attachment and prior artifacts remain intact.
The old default hash is 5282fb0224e1e3dbf13fafc0bd386c053e3f2c25fa1e4bb4e22dd43dac81b179.

The full supplied control schema and original schema pass. Frame/event timing and source-phase checks pass.
Both captures have complete first boots, full replays, and two complete returns. All expected markers appear exactly once per run.
The control has 1246 frames, 71 events, four long tasks, zero errors, and 37 resource entries.
Counts record drops, not array lengths. All drop counts are zero. All arrays remain below recorder bounds.
Two trusted STARTs and two trusted BACKs pass. Visibility remains visible with no recorded visibility changes.
Fonts report loaded. Reduced motion is false. Both files report identical browser, fonts, viewport, and renderer metadata.

All 93 control source-manifest hashes pass. Reference is a796e9a plus approved camera042dc805.
The retained diff changes only engine.ts, diagnostic.ts, and the new context-control.ts.
The runtime control changes the actual 960x640 boot-screen context options to willReadFrequently:true.
Default omits the options argument. Scratch contexts, drawing, camera, uploads, font declarations, and source phases remain unchanged.
Rejected caches and panel preparation are absent. Existing assets-prepared is normal room startup.

Control options and reported context attributes both contain willReadFrequently:true. Attribute status is supported.
The screen-texture-created context label still says “default Canvas2D”. That legacy label is stale in the control.
Use experiment plus contextAttributes to identify this mode. These records do not prove native backing or presentation.
The extra context-created marker follows the once-only attribute read. Its native creation/read cost has no separate timer.

Reported device: Chrome154, Adreno740/ANGLE GLES3.2, viewport411x784, DPR2.625, drawing buffer822x1568.
The WebGL buffer reflects the source DPR cap of 2. The boot Canvas2D texture remains 960x640.
Reduced Android10 UA does not establish actual OS/model. Resolved glyph fonts and physical refresh rate remain unmeasured.
The recorder has no dedicated context-loss listener. No error or context event does not certify native context continuity.

## Cadence

Values use milliseconds. F/R means first boot/full replay in the same session. Returns never count as replay.
Engine gaps measure callback starts. rAF intervals use recorded render timestamps, not displayed frames.
Incoming intervals belong to the current recorded source phase. Their predecessors remain across phase boundaries.
Each mode's first callback has no predecessor interval. Cost distributions can therefore have one extra sample.
Quantiles interpolate at (n-1)*p. Thresholds >=42 and >50 are descriptive.
Text window: booting with 0.35 <= boot < 3.5, identical in both files.

Control engine gaps:

| Phase/window | n F/R | Mean F/R | p50 F/R | p95 F/R | Max F/R | >=42 count (%) F/R | >50 count (%) F/R |
|---|---:|---:|---:|---:|---:|---:|---:|
| camera-before-power | 166/168 | 16.81/16.67 | 16.65/16.70 | 19.65/17.10 | 34.90/17.90 | 0 (0.0)/0 (0.0) | 0 (0.0)/0 (0.0) |
| activation | 21/20 | 16.68/16.68 | 16.70/16.70 | 18.50/16.90 | 20.00/16.90 | 0 (0.0)/0 (0.0) | 0 (0.0)/0 (0.0) |
| arrival | 44/45 | 16.72/16.68 | 16.70/16.70 | 19.85/16.98 | 20.20/17.50 | 0 (0.0)/0 (0.0) | 0 (0.0)/0 (0.0) |
| drop | 48/48 | 16.69/16.69 | 16.85/16.70 | 17.86/16.96 | 18.30/17.00 | 0 (0.0)/0 (0.0) | 0 (0.0)/0 (0.0) |
| colour-glint | 96/96 | 16.66/16.69 | 16.70/16.70 | 19.00/17.00 | 20.20/17.10 | 0 (0.0)/0 (0.0) | 0 (0.0)/0 (0.0) |
| fade | 55/59 | 18.49/17.06 | 16.70/16.70 | 18.86/17.24 | 118.90/37.60 | 1 (1.8)/0 (0.0) | 1 (1.8)/0 (0.0) |
| text | 188/189 | 16.68/16.69 | 16.75/16.70 | 18.96/17.00 | 20.20/17.50 | 0 (0.0)/0 (0.0) | 0 (0.0)/0 (0.0) |
| poweredReturn | 68/68 | 16.65/16.62 | 16.70/16.70 | 17.57/17.50 | 18.00/18.50 | 0 (0.0)/0 (0.0) | 0 (0.0)/0 (0.0) |

Control rAF intervals:

| Phase/window | n F/R | Mean F/R | p50 F/R | p95 F/R | Max F/R | >=42 count (%) F/R | >50 count (%) F/R |
|---|---:|---:|---:|---:|---:|---:|---:|
| camera-before-power | 166/168 | 16.79/16.68 | 16.70/16.70 | 16.80/16.80 | 33.40/16.80 | 0 (0.0)/0 (0.0) | 0 (0.0)/0 (0.0) |
| activation | 21/20 | 16.68/16.68 | 16.70/16.70 | 16.80/16.80 | 16.80/16.80 | 0 (0.0)/0 (0.0) | 0 (0.0)/0 (0.0) |
| arrival | 44/45 | 16.69/16.68 | 16.70/16.70 | 16.80/16.80 | 16.80/16.80 | 0 (0.0)/0 (0.0) | 0 (0.0)/0 (0.0) |
| drop | 48/48 | 16.69/16.69 | 16.70/16.70 | 16.80/16.80 | 16.80/16.80 | 0 (0.0)/0 (0.0) | 0 (0.0)/0 (0.0) |
| colour-glint | 96/96 | 16.69/16.68 | 16.70/16.70 | 16.80/16.80 | 16.80/16.80 | 0 (0.0)/0 (0.0) | 0 (0.0)/0 (0.0) |
| fade | 55/59 | 18.51/16.97 | 16.70/16.70 | 16.80/16.80 | 116.70/33.40 | 1 (1.8)/0 (0.0) | 1 (1.8)/0 (0.0) |
| text | 188/189 | 16.69/16.68 | 16.70/16.70 | 16.80/16.80 | 16.80/16.80 | 0 (0.0)/0 (0.0) | 0 (0.0)/0 (0.0) |
| poweredReturn | 68/68 | 16.68/16.69 | 16.70/16.70 | 16.80/16.80 | 16.80/16.80 | 0 (0.0)/0 (0.0) | 0 (0.0)/0 (0.0) |

Full older-default engine/rAF phase distributions remain in summary.json.

Control text means differ by -0.00061 ms between first and replay. Both rAF p95 values are 16.8 ms.
Engine p95 is 18.97/17.00 ms. Engine maxima are 20.20/17.50 ms.
There are no >=42 or >50 intervals in either clock during text or powered returns.
Old text engine >=42 rates are 39.0%/14.4%. Old engine >50 rates are 19.5%/6.7%.
Old text rAF p95 remains 50.1/50.1 ms. The captured improvement covers replay as well as first boot.
Colour/glint median rAF changes from old 49.8/33.4 to control 16.7/16.7 ms.

Powered solid-fill return means change from old 28.45/28.31 to control 16.65/16.62 ms.
This contrast extends beyond glyph drawing. It narrows attention to shared canvas/texture/render interaction.
Scene, camera, browser scheduling, and compositor behavior remain possible contributors.
Return paintMs is zero because its timer excludes solid fills. TotalMs includes those calls.
Control powered-return total mean/p95/max is 7.21/9.80/11.10 and 8.03/10.80/11.90 ms.
Old powered-return total mean is 2.42/2.53 ms. Faster cadence occurs with longer measured callbacks.

## Measured callback costs and worst alignment

The following costs belong to the callback immediately before each incoming text gap.

| Capture/run | Metric before text gap | n | Mean | p50 | p95 | Max |
|---|---|---:|---:|---:|---:|---:|
| control/1 | previousPaintMs | 188 | 0.51 | 0.50 | 0.80 | 3.00 |
| control/1 | previousSubmitMs | 188 | 8.00 | 8.20 | 10.66 | 13.20 |
| control/1 | previousTotalMs | 188 | 8.94 | 9.15 | 11.96 | 14.50 |
| control/2 | previousPaintMs | 189 | 0.38 | 0.40 | 0.60 | 0.70 |
| control/2 | previousSubmitMs | 189 | 8.16 | 8.20 | 9.82 | 11.00 |
| control/2 | previousTotalMs | 189 | 8.94 | 8.90 | 10.80 | 11.80 |
| oldDefault/1 | previousPaintMs | 82 | 0.66 | 0.60 | 1.30 | 1.90 |
| oldDefault/1 | previousSubmitMs | 82 | 3.06 | 2.90 | 5.20 | 6.10 |
| oldDefault/1 | previousTotalMs | 82 | 4.35 | 4.10 | 6.89 | 7.50 |
| oldDefault/2 | previousPaintMs | 90 | 0.55 | 0.50 | 0.80 | 1.10 |
| oldDefault/2 | previousSubmitMs | 90 | 3.23 | 2.95 | 5.42 | 6.30 |
| oldDefault/2 | previousTotalMs | 90 | 4.39 | 4.15 | 6.75 | 7.60 |

Current text total mean also increases: old 4.35/4.39 to control 8.94/8.95 ms.
Current text submission p95 increases: old 5.20/5.42 to control 10.67/9.82 ms.
Paint p95 decreases: old 1.30/0.80 to control 0.80/0.60 ms.
The improvement is not a reduction in all synchronous work. Timing distribution and unmeasured work can change.
Total contains paint, submit, recorder, and other callback work. Do not add nested durations.

Negative result: first control still has one 118.90 ms engine gap, with a 116.70 ms rAF interval.
It occurs at index420, boot=4, t11406.10, in the final camera tail.
Predecessor419 starts11287.20 and has paint/submit/total0.30/4.70/5.30 ms.
The unmeasured remainder is113.60 ms. The current callback costs5.10 ms after the incoming gap.
No recorded event or long task overlaps that gap. It is not explained by text-phase timing.
Replay worst is37.60/33.40 ms at index1042, boot=4, after a5.30 ms callback. Remainder32.30 ms.
The first control maximum exceeds old first54.40 ms. Do not describe the entire boot as stall-free.

Split the source fade label: active fade at3.5<=boot<4 has control p95/max18.41/18.80 and17.11/17.20 ms.
The118.90 ms event belongs to the boot=4 camera tail. All control gaps>=42 are this single event.
Old first worst54.40 ms follows5.70 ms measured work. Old replay worst65.20 ms follows2.40 ms.
Unmeasured remainder includes other application work, browser work, and waiting. It is not proven idle time.
No long task overlaps any recorded boot or return in either capture.

All domain, upload, and ten glyph markers align inside measured callbacks.
Control first powered domain/upload callback costs14.10 ms and its next incoming gap is16.80 ms.
Replay powered callback costs11.50 ms. No immediate activation stall appears.
Glyph markers follow direct fillText submission. Upload markers indicate submission, not GPU completion.
Upload marking is once per run. Replay marking does not establish new texture allocation.
The recorder starts after render's cadence guard. Source treats booting/returning as busy, so the room idle guard does not throttle these windows.
Work before frameStart, other callbacks, deferred native work, GPU execution, and display presentation remain outside totalMs.

## Startup is not yet cleared

All startup timestamps use performance.timeOrigin. These are observed cross-session differences, not causal effect estimates.

| Marker/interval | Old default | Control | Control minus old |
|---|---:|---:|---:|
| diagnostic-initialized, from navigation | 1231.60 | 930.10 | -301.50 |
| create-room, from navigation | 1560.90 | 1321.50 | -239.40 |
| screen-texture-created, from navigation | 1616.40 | 1443.70 | -172.70 |
| model-parsed, from navigation | 1899.90 | 1750.70 | -149.20 |
| assets-prepared, from navigation | 2403.80 | 2297.30 | -106.50 |
| fonts-ready, from navigation | 2495.90 | 2401.20 | -94.70 |
| room-ready, from navigation | 2689.10 | 2625.80 | -63.30 |
| START-DOM, from navigation | 2691.10 | 2627.90 | -63.20 |
| START-animation-complete, from navigation | 3706.50 | 3648.20 | -58.30 |
| create-room to screen-texture-created | 55.50 | 122.20 | 66.70 |
| screen-texture-created to model-parsed | 283.50 | 307.00 | 23.50 |
| model-parsed to assets-prepared | 503.90 | 546.60 | 42.70 |
| assets-prepared to compile-wait-start | 89.60 | 98.20 | 8.60 |
| compile-wait-start to compile-wait-end | 0.50 | 0.50 | 0.00 |
| font-wait-start to fonts-ready | 2.00 | 5.10 | 3.10 |
| fonts-ready to room-ready | 193.20 | 224.60 | 31.40 |
| START-DOM to START-animation-complete | 1015.40 | 1020.30 | 4.90 |
| create-room to room-ready | 1128.20 | 1304.30 | 176.10 |
| diagnostic-initialized to room-ready | 1457.50 | 1695.70 | 238.20 |

Navigation responseEnd is old911.80/control547.10 ms. DOMContentLoaded is1106.50/783.40 ms.
Load is1327.20/1193.80 ms. Earlier document delivery can mask later local work.
START entry completion is old3706.50/control3648.20 ms,58.30 ms earlier.
Yet responseEnd-to-entry grows2794.70 to3101.10 ms,306.40 ms longer.
Diagnostic-init-to-room grows1457.50 to1695.70 ms,238.20 ms longer.
Create-room-to-room grows1128.20 to1304.30 ms,176.10 ms longer.
Create-room-to-texture grows55.50 to122.20 ms. This interval includes WebGL setup and context creation.
It does not isolate the willReadFrequently call or the attribute read.

Old pre-model task: t1528.50,86 ms.
Control pre-model tasks: t1288.10,150 ms, and t1440.30,50 ms.
The150 ms task begins before create-room and ends before the context-created marker.
The50 ms task overlaps context/texture creation. Neither task has function or native attribution.
Old later tasks: t2403.90,53 ms, and t2626.60,57 ms.
Control later tasks: t2297.40,59 ms, and t2502.20,95 ms.
All occur before START DOM and first gesture. Total observed task duration is old196/control354 ms.
These task totals are separate from elapsed segments. Do not add task time to overlapping startup durations.
The95 ms task overlaps fonts-ready-to-room work. The source performs room warm draws in this interval.
Compile-wait is0.50 ms in both captures. Font-wait is old2.00/control5.10 ms.
Neither measured wait accounts for the larger startup segments.
START DOM to entry completion differs by only4.90 ms,1015.40 to1020.30 ms.
No START-css-animation-complete marker exists in either file. START-animation-complete is the available application entry marker.

| Capture/run | First callback paint/submit/total | First powered paint/submit/total | Gesture to boot mode |
|---|---:|---:|---:|
| oldDefault/1 | 1.70/1.50/11.10 | 1.40/3.20/5.10 | 165.00 |
| oldDefault/2 | 0.10/2.10/4.30 | 0.20/2.70/3.60 | 161.40 |
| control/1 | 4.60/2.20/8.80 | 1.60/11.80/14.10 | 166.60 |
| control/2 | 0.10/1.10/2.30 | 0.30/10.50/11.50 | 160.90 |

The first pre-power callback's paint cost is control4.60 ms versus old1.70 ms.
The control's first powered total14.10 ms exceeds old5.10 ms.
Neither creates a measured immediate long interval. These costs remain separate from pre-START startup.

## Network/cache limits

Both files report35 positive-transfer resources and approximately2.052 MB transfer.
Model transfer is966068 bytes in both. Duration is old258.90/control247.50 ms.
Inter font transfer is48556 bytes in both. Duration is old57.20/control135.30 ms.
No zero-transfer entry has a positive encoded body. Zero/zero feedback entries do not establish a cache hit.
The data lacks response headers, delivery type, worker attribution, and complete cache information.
Browser, font, OS, shader, and driver cache state remain unknown. Resource paths omit queries.
All valid resource completions precede first START. No recorded resource starts during boots or returns.

Both captures contain an impossible negative worker-resource duration.
Old bonsai worker duration is-32.10 ms. Control is-56.30 ms.
Preserve the raw records. Exclude these values from elapsed resource calculations.
The anomaly affects resource chronology, not validated frame intervals. Its origin remains unknown.
The available recorder snapshot is not a native trace and can omit resource entries.

## Supported conclusion and ONE next step

Supported: this control session removes the older text cadence penalty in recorded first and replay windows.
Powered return improves too. The user's visual report supports the same direction.
The repeated16.7 ms rAF intervals describe render callbacks, not guaranteed physical display presentation.

Narrowed hypothesis: boot Canvas2D-to-texture interaction contributes to the cadence problem.
Text-specific cache preparation is less compelling because solid-fill return improves as well.
The longer submission callbacks are consistent with work redistribution but do not prove that mechanism.
The isolated camera-tail event and larger startup task budget remain unresolved negative results.
No exclusive raster, GPU, compositor, scheduler, or CPU backing cause is established. Native trace is required for that attribution.

Confounds: different deployment/time, caches, order, thermal state, and the extra once-only context-attribute read/marker.
The old file predates this control preview. No new default capture exists.
One comparison does not establish reliability. There is no accepted implementation change.

ONE smallest next step: run one same-preview counterbalanced capture experiment on the affected device.
Collect default/control, then control/default, using fresh pages at similar device temperature.
Each page must retain first boot, powered return, full replay, startup markers, and the visual report.
Use the existing preview and recorder. Add no source change, cache, warm draw, or Windows matrix.
Assess text cadence, boot=4 outliers, callback cost, and startup segments together.
This experiment tests repeatability and possible startup cost without claiming native attribution.

## Reproduce and handoff

Run python analyze.py, then python report.py, from this directory or use their full paths.
Both use only the Python standard library. Writes remain beside the scripts.
summary.json retains all phase/window distributions, threshold rates, predecessor alignment, startup segments, resources, and source hashes.
comparison.html is self-contained. preview-verification.json retains width checks. Inspected screenshots remain in the thread tool results.
Root should inspect and publish the HTML. This worker did not publish it.
