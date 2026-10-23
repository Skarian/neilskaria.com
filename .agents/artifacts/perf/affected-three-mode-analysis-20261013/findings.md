# Affected-device three-mode analysis

The minimal `willReadFrequently:true` control is the proportionate lean candidate for the next preview decision. This set supports that bounded choice. It does not establish production readiness or absence of startup cost. The atlas adds measured callback headroom but no perceived smoothness improvement over control. Its memory, code, and observed startup tradeoffs do not earn inclusion in the lean candidate.

All three supplied attachments belong to the same corrected experimental preview. Independent raw-file analysis confirms text callback means of GPU **16.688/16.686 ms**, control **16.683/16.685 ms**, and default **33.905/32.682 ms**, first/replay. Default replay remains slow. The user separately reports that default is visually slower, GPU/control are “About the same,” and GPU text “Looks consistent.” These observations do not accept startup or production.

## Evidence and reproduction

Run `python analyze.py`, then `python report.py` from this directory with installed Python. Both use only the standard library. They copy only the supplied attachments and write only this new directory. `summary.json` retains all windows, distributions, raw startup events/resources, and the three worst gaps per window with previous callbacks and marker/task/resource alignment. `metrics.md` contains complete engine/rAF and previous-callback tables. `verification.json` records source-manifest checks and semantic validation. `comparison.html` is the compact root-publishable visual.

| Copy | Bytes | SHA256 |
|---|---:|---|
| gpu-atlas.json | 432078 | c4f3302d9fcad2b76c29fbc28eb74eecc81c8961d965c83b6ac82cd83f6a085c |
| will-read-frequently.json | 438791 | ad6ae6a7a72147f8607fb838b6e1a25b04f620e93ed3527443f86121a5e2f2af |
| default.json | 336233 | b7b2c2a049ee271e628a3645bd7818c3622175364867ff504e9db80b22f2cb4b |

Copies match originals byte-for-byte. Attachments remain unchanged. SchemaRevision is `gpu-boot-atlas-1`. SourceId is `canvas-control-93+gpu-atlas-failure-correction-20261012`. Reference is a796e9a with camera 042dc805. All four inspected staged source files match the corrected preview manifest. No application source, build, Git, dependencies, system changes, or deployment action occurred. Main HEAD d82230a remains rejected per supplied context.

Validation: 1252 GPU, 1250 control, 942 default frames. All have two trusted STARTs, two complete full boots, and both recorded returns. Errors, dropped records, session missing markers, and per-run missing markers are zero. Frame phases reconstruct from actual power events and boot values. Engine gaps reconstruct from callback starts. Timestamps increase within each recorded mode/run. Boot remains within 0..4 and does not reverse during full boots. Array bounds pass. All snapshots are visible, with no visibility-change events, loaded fonts, and reduced motion false. Android Chrome154 / Adreno740 GLES3.2, 411x784 DPR2.625, buffer822x1568 match. Reduced Android10 UA does not identify actual OS/model.

GPU has no boot canvas paint, canvas creation, or canvas request/submission markers. Session texture counts are canvas0/0 and atlas1/1. Control is canvas1079/741 and atlas0/0. Default is canvas756/419 and atlas0/0. These counters include unrecorded room and run-0 activity. They are not boot-frame upload counts. GPU glyph markers mean draw submission, while canvas glyph markers mean direct paint calls. Atlas upload is required once per session. Glyph/domain observations are required separately for each full boot.

## Exact comparisons

Intervals belong to their destination frame. First gaps after a recording reset are null and excluded. No idle/site interval is bridged. Quantiles use linear interpolation at `(n-1)*p`. Descriptive >=42/>50 counts and rates use valid intervals as denominator. These are not acceptance limits. See `summary.json.method.windows` for exact predicates. Text is 0.35<=boot<3.5. Active fade is 3.5<=boot<4. Tail is boot=4. Return splits at the actual returning power-off timestamp. Camera-before-power uses the actual power marker, not boot=0 alone.

| Text window | n first/replay | p50 | p95 first/replay | max first/replay | >=42 count (%) first/replay | >50 count (%) first/replay |
|---|---:|---:|---:|---:|---|---|
| GPU | 189/188 | 16.70/16.70 | 17.10/17.30 | 17.60/17.70 | 0 (0%)/0 (0%) | 0 (0%)/0 (0%) |
| Control | 189/189 | 16.60/16.70 | 17.86/17.00 | 18.70/17.50 | 0 (0%)/0 (0%) | 0 (0%)/0 (0%) |
| Default | 93/97 | 33.40/33.40 | 51.24/48.86 | 51.60/51.80 | 10 (10.75%)/7 (7.22%) | 8 (8.60%)/2 (2.06%) |

rAF means independently agree: GPU16.69/16.69, control16.68/16.68, default33.91/32.68 ms. Default text rAF maxima are50.2/50.1 ms. Default activation means24.34/24.11 versus GPU16.70/16.67 and control16.68/16.69. No immediate first-only activation stall is established. First control domain callback totals16.9 ms, followed by18.8 engine/16.7 rAF interval. Default activation slowdown also remains on replay.

Camera-before-power means remain about16.7 ms in all modes. Control first has one45.5 ms engine gap (rAF33.4), not a universal clean boot. Default arrival/drop/colour means34.88/30.75/35.25 first and32.67/29.70/34.40 replay. GPU and control remain about16.7 in each. Active fade default34.47/37.23 versus about16.7 for both alternatives. Full-boot means GPU16.69/16.77, control16.81/16.73, default23.56/23.22. Full-boot averages dilute the text symptom with the unchanged camera prefix.

Powered-return means GPU16.66/16.59, control16.61/16.60, default27.97/28.34. Default powered-return >50 counts1/3. Post-power-off means GPU16.69/16.69, control16.69/16.69, default17.25/16.97. No post-off >=42 gap appears in any mode. Canvas return solid fills are outside paintMs instrumentation. Zero return paintMs does not mean zero fill work.

## Callback headroom and handoff negatives

Text previous scene-submit means are GPU2.51/2.42, control8.85/8.39, default3.06/2.79 ms. Previous total means are3.18/2.97,9.92/9.21,4.40/3.79. GPU uniform preparation means0.07/0.04 ms, with zero paint. Control paint means0.58/0.38 and default0.70/0.42. Atlas saves about6.34/5.97 ms measured submission and6.74/6.24 ms total versus control. This is callback headroom, not GPU execution or presentation headroom. The shader can sample ten glyph masks plus domain. Native shader cost and completion remain unmeasured.

Default has shorter callbacks than control while its intervals are slower. Mean elapsed remainder outside previous total is GPU13.51/13.72, control6.76/7.48, default29.51/28.89 ms. It contains scheduler/other application/browser/native/GPU waits and ordinary idle time. It is not a measured GPU category. Nested paint/prepare/submit/recorder timings must not be added to total. Recorder-start overhead means are roughly0.01..0.03 ms. Marker probes and uninstrumented recorder work can differ by mode.

The historical118.9 ms hint handoff does not recur. Tail maxima: GPU17.2/54.2 (rAF16.8/50.1), control53.2/37.6 (rAF50.1/33.4), default66.8/66.2 (rAF66.8/66.8). The GPU replay54.2 follows1.6 ms total, leaving52.6 outside. Control first53.2 follows7.3 total, leaving45.9. Default66.8/66.2 follow2.3/2.7 total, leaving64.5/63.5. No marker, long task, or resource overlaps those worst tail intervals. Smaller tail gaps remain unresolved. No boot/recorded-return long task overlaps any mode. Worst default text51.6/51.8 follows4.2/3.4 total, with no marker/task/resource overlap. GPU/control worst text17.6/17.7 and18.7/17.5 likewise have no overlapping task/resource. Nearby glyph markers are retained separately in JSON and do not establish causality.

## Startup is a real tradeoff, with unequal initial states

| Observed ms | GPU | Control | Default |
|---|---:|---:|---:|
| Navigation responseEnd | 330.2 | 349.3 | 301.6 |
| Room ready, navigation-relative | 2628.9 | 2256.9 | 1933.0 |
| Response-end to room ready | 2298.7 | 1907.6 | 1631.4 |
| Create-room to room-ready | 1842.6 | 1257.5 | 1107.7 |
| Assets-prepared to compile-wait-start | 404.6 | 90.6 | 90.3 |
| Fonts-ready to room-ready | 362.8 | 262.6 | 149.3 |

GPU create-to-ready is585.1 ms longer than control and734.9 longer than default. Control is149.8 longer than default. Retain all three negatives. Response-end-to-ready is not pure CPU time. Initial state, idle scheduling, caches, thermal/background work and one trial per mode prevent assigning these differences solely to implementation. Shorter navigation startup does not prove no moved cost.

Source and event order resolve START semantics. BootIntro persists boot-seen/room-place and can background-load startIn:'site'. GPU run0 is loading->room at2629.0, START-DOM2631.1, entry start3093.9, completion3627.5, trusted START9229.0. Human wait after completion is5601.5 ms.

Control run0 is loading->site2257.2, human BACK3784.6, return start3786.7, power-off4931.8, return complete6934.5, START-DOM6936.8, entry completion7953.6, START8311.9. Default is loading->site1933.2, BACK3320.4, return start3323.6, power-off4464.5, return complete6463.5, START-DOM6466.0, entry completion7484.3, START7757.5. Room-ready to BACK human delay is1527.7/1387.4. Run0 returns take3147.8/3139.9. Human wait after entry completion is358.3/273.2. These are page-first sessions with an actual pre-first-boot return, not missing initial START instrumentation. Run0 frames are intentionally not recorded. There is no equivalent initial-room START readiness observation for control/default. Raw navigation-to-START completion cannot establish GPU-fast startup. No rerun is required solely to resolve this event-order issue.

Engine import completion has no dedicated marker. The engine chunk resource is a network proxy only: GPU615.0..705.2, control931.9..947.9, default732.0..762.2. Diagnostic-to-create197.2/412.5/356.7 includes idle/load/import work and cannot isolate import CPU. Create-to-model462.7/324.3/323.4 includes parse/decode/work waits. Model-to-assets607.2/576.6/540.9 includes application preparation and parallel assets. Compile promise wait0.8/0/0 ms does not measure total earlier shader work. Font wait4.5/3.3/3.8 ms does not measure resolved glyph equality. Fonts-ready-to-room includes existing warm mesh draws, full scene draw, yields and final setup, without dedicated warm-start/end markers.

GPU atlas fetch markers843.5..1014.5 span171.0 ms. Resource timing843.8..921.6 spans77.8 ms. Decode1014.5..1154.5 spans140.0 ms. Ready1154.6 to upload-submission2298.3 spans1143.7 ms. This is elapsed readiness-to-submission, not upload execution. Atlas ready precedes assets-prepared1856.2, so its promise adds no visible wait at that later boundary in this trial. It still adds fetch/decode/texture/shader work. Startup long tasks: GPU83,362,112,125 ms; control59,73,126; default77,55. GPU362 ms occurs during assets-to-compile interval. GPU112/125 occur in the warm/final setup interval. Timing overlap is not proof of a shader cause.

Resource evidence: GPU34 positive-transfer positive-body entries and no zero-transfer positive-body entries. Control/default each have30 zero-transfer positive-body entries, consistent with browser cache reuse, and2 positive transfers. Their Draco entries have300-byte transfer with positive body, consistent with validation overhead, but headers/status are absent. Zero-transfer zero-body feedback entries do not establish cache hits. Common model resource duration159.0/39.6/65.7 ms; font56.2/9.8/7.4. GPU model resource ends before create-room, but parse is later. Image/audio fetch entries end965.8/1069.9/902.9 at latest, earlier than assets-prepared. Decode, processing, yields and native work are not isolated. Each worker resource reports a negative duration (-77.5/-48.1/-45.3 ms). Preserve this timing anomaly and exclude it from network duration/overlap attribution. No response cache headers or shader/native allocation metrics exist in these captures.

## Bounded conclusion and one next step

This source-matched set strengthens evidence that the default Canvas2D/texture path contributes to the post-power symptom. Changing only its context option improves matching phases, including replay and powered solid returns. It does not identify exact raster, driver, native texture, GPU, compositor or scheduler cause. Default being last and slow weakens only a simple universal warm-up explanation. It does not remove other confounds. Control/default had an extra run0 return and shared-resource cache reuse. Historical data remains separate and is not pooled.

Atlas estimates are10.67 MiB mips plus8 MiB retained bitmap nominal, versus3.125 MiB original mips. Actual allocation is unmeasured. Target typography and physical presentation are unmeasured. The user's consistent-text report supports acceptability on this device but not font equality. Prior root preview inspection is accepted as supplied context, not repeated or expanded here. Camera, lantern and radio remain separate.

**One next step:** advance the existing minimal canvas context hint as the lean preview candidate, with the startup negatives disclosed. Keep atlas as a retained experiment. This evidence is sufficient for that bounded choice without another capture matrix. It is not sufficient for production or a guarantee of unchanged startup. No production action is authorized here.

The first artifact write failed under the protected .agents permissions. Narrow per-command Auto-review approvals succeeded for this folder. No refusal or bypass occurred. The initial analysis execution exposed a schema UTF-8 BOM. BOM-aware reading corrected that routine error. Final validation passes.
