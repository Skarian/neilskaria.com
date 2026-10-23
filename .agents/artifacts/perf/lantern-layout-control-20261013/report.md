# Lantern layout control: rejected locally

The single-call removal removes the initial forced panel measurement. It does not establish a repeatable stutter improvement. Keep the patch only as rejected experiment evidence. Do not promote it to root source or the clean preview.

Pair1 favors CONTROL: first-open layout21.789→16.348 ms, native actual rAF maximum39.745→30.898 ms, and headless presentation maximum49.998→33.332 ms. Pair2 reverses layout and rAF direction: BEFORE→CONTROL is16.311→18.999 ms and36.082→37.641 ms. Presentation stays49.998 ms. The first1200 ms worst task improves35.742→27.111 ms in pair1 and worsens31.376→32.986 ms in pair2. The acceptance rule fails. These are two paired app sessions, not hundreds of independent frame replicates.

## Source and checks

BEFORE contains91 source/assets files from bcc409e43708ee7b543b53ca8f3700a8ef82ff14, checked against Git and the clean repaired stage. It uses an exact copied prior output. CONTROL changes only src/lib/boot/BootIntro.svelte: remove report() after tick(), before new ResizeObserver(report). The calculation, RO resize behavior, cleanup, window resize handler, camera durations, CSS/zoom, audio/network and canvas willReadFrequently option are unchanged. source.patch is complete; source-proof.json stores both hashes and all91 source hashes. Rejected CONTROL remains in this owned folder only for audit.

Node24.21.0 used existing dependencies without installation. Format passed. Typecheck reported0 errors and0 warnings. Client/SSR build passed with an artifact-only no-op adapter config outside source. Build warnings and logs are retained. No deployment, Git commit, index/ref/policy/dependency/account/system/production change occurred. verification.json proves tracked source, index, HEAD, main, baseline, proposal ref and all prior profiling stages unchanged.

## Conditions and method

Exactly four measured sessions: BEFORE→CONTROL, then CONTROL→BEFORE. Each used a fresh owned profile/renderer. Chrome154.0.8037.57; RX590; ANGLE Vulkan1.3.260;1280×800 DPR1; CPU rate1;0 added network latency and unlimited throughput. Cache enabled. Only boot-seen=1 and room-place=room were seeded. Lantern started Paper white, level1 in all four. The same two START/site/BACK/return flows warmed site fonts before first Lantern. Final START intro completion preceded input, with source camera return settling allowed. proof.json retains readiness margins.

All panel input was trusted touch at the desktop viewport. Recorded pointerType is touch. First Lantern, Candle, close and second Lantern have separate traces. Radio was not opened. Natural player audio/network policy remained active. No GL wrappers, extra GL queries, app recorder/UI/debug source or helper bundle were used. The bounded external observer records native call/animation events without extra measured-window geometry reads.

Full window:250 ms before first trusted pointer through2000 ms after actual trusted click. Secondary: click through1200 ms. CDP dispatch start is not the input timestamp. Native durations are clipped at both boundaries. Layout/UpdateLayoutTree are separate from task totals. CPU bounds use native renderer-main RunTask tdur for fully contained spans, plus missing-duration wall and clipped boundary wall for the upper bound. Nested task/layout/function/wait durations are not added.


## First-open totals in ms

| Run | Full Layout | Full UpdateLayoutTree | Full worst task | Actual rAF max | Headless presentation max | 1200 ms worst task |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| p1-before | 21.789 | 31.128 | 36.322 | 39.745 | 49.998 | 35.742 |
| p1-control | 16.348 | 31.218 | 31.815 | 30.898 | 33.332 | 27.111 |
| p2-control | 18.999 | 31.472 | 33.390 | 37.641 | 49.998 | 32.986 |
| p2-before | 16.311 | 32.788 | 31.798 | 36.082 | 49.998 | 31.376 |

Full windows are flagged. The first traced observer callback lasts 81.985–86.853 ms before input; its containing task lasts 82.698–90.089 ms. This is a trace-start instrumentation anomaly. Profiler startup is a plausible cause, not a separately proven cause. The containing task overlaps the pre-input boundary by15.4–31.8 ms. This remains in raw totals. It is not app work or optimization savings. Callback starts outside the window are excluded from gap distributions; overlapping CPU/wall remains clipped. Two BEFORE pre-input callbacks also exceed1 ms by about0.2–0.3 ms. No replacement ran. Do not use full-window CPU as positive fix proof.

| Run | Full CPU lower–upper | Full task wall | 1200 ms CPU lower–upper | 1200 ms task wall |
| --- | ---: | ---: | ---: | ---: |
| p1-before | 258.091–274.258 | 297.867 | 150.230–186.005 | 196.961 |
| p1-control | 245.980–277.881 | 297.710 | 146.700–173.877 | 185.539 |
| p2-control | 261.063–281.790 | 304.007 | 152.489–185.511 | 197.954 |
| p2-before | 280.699–296.152 | 316.173 | 169.694–201.107 | 211.499 |

The first1200 ms observer callback overhead maxima are0.110/0.280/0.465/0.122 ms in recorded order. Native observer callback starts identify FunctionCall with empty url, functionName frame, line11 on renderer main. The scheduled rAF timestamp argument hides the crossing input task. measurements.json retains both distributions. Native presentation uses renderer-main AnimationFrame::Presentation, coalesced within1 ms. It is headless feedback, not physical FPS. all-window-metrics.csv records n/mean/p50/p95/max and counts≥25/≥42/≥100 for all32 action/window combinations. Later tail tasks remain in measurements.json. Native GetProgramiv is absent in all action windows.

## Measurement and completion in ms

| Run | Calls | First measure start after click | First measure end after click | Measurement wall | Click→DOM | Click→completed opening |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| p1-before | 2 | 9.100 | 33.000 | 23.900 | 9.000 | 947.000 |
| p1-control | 1 | 30.200 | 30.200 | 0.000 | 8.300 | 947.300 |
| p2-control | 1 | 36.600 | 36.700 | 0.100 | 11.000 | 929.800 |
| p2-before | 2 | 9.800 | 28.300 | 18.500 | 9.700 | 946.800 |

BEFORE makes two report calls per open: tick continuation and initial ResizeObserver. First-open immediate measurement costs23.900/18.500 ms; RO costs0 ms. CONTROL makes only the RO call, costing0/0.100 ms. Native Layout still costs16.348/18.999 ms before that callback. Work moved into natural rendering; first-use layout was not eliminated. Warm second opens have0.434–0.569 ms Layout,5.410–5.892 ms worst tasks, and33.332 ms maximum presentation gaps. Candle and close work, and their full tails remain in raw evidence.

BEFORE stacks map to nodes/3.BWbtdeoM.js, one-based line2 column16199 (report), column16401 (tick continuation). CONTROL maps to nodes/3.CTySGjiQ.js at the same report column through ResizeObserver. Exact source is BootIntro.svelte:94–107. Run analyses retain Layout/UpdateLayoutTree native arguments, clipped largest tasks with nested FunctionCall source locations, measurement stacks, and Animation begin/end events. Raw native traces retain V8 ProfileChunk samples.

The observer attaches finish listeners to existing Element.animate calls. It does not add animations or read layout for timing. The final opening pop finishes929.8–947.3 ms after click; DOM appears8.3–11.0 ms after click. Close finishes and removes the panel. Candle is selected and persisted. Native animation records and external finish marks remain in analysis and raw traces.

First engine camera adjustment is not directly accessible without additional instrumentation. Existing measurement-end timestamps bound the next synchronous setFree call, but are only a proxy: pair1 CONTROL reaches that point earlier and pair2 later. Do not claim no camera timing shift. Source focus1.1 s and setFree0.5 s durations are unchanged. Settled screenshots verify final framing, not precise camera completion.

## Startup and functional checks

| Run | Document responseEnd | START DOM | Final START intro finish | Response→intro finish |
| --- | ---: | ---: | ---: | ---: |
| p1-before | 76.900 | 1526.800 | 2558.300 | 2481.400 |
| p1-control | 36.000 | 1352.300 | 2392.300 | 2356.300 |
| p2-control | 34.800 | 1185.400 | 2204.000 | 2169.200 |
| p2-before | 41.900 | 1229.300 | 2253.000 | 2211.100 |

Startup is externally observed without a native startup trace. It is not a controlled speed comparison. The removed call runs only for focused panels. No startup warmup or delay was added. Each result.json retains natural network events and resource timings.

Both conditions passed unmeasured390×844 phone,844×390 landscape,800×1000 portrait,1366×768 desktop and1280×800 checks. Panel min-height changed to580 CSSpx and was restored. Rapid close/reopen succeeded. Lantern and Candle remain selected; matching rectangles are identical. Screenshots show the lantern above portrait/phone panels and left of landscape/desktop panels. Window resize retains its handler. Panel content-size changes still trigger RO. No runtime error or observed lifecycle race appeared. This is desktop touch emulation at phone dimensions, not physical mobile or Safari. The existing landscape header overlap matches BEFORE.

## Transport, faults, and next bottleneck

All 16 traces reached EOF with dataLossOccurred=false. Maximum page/native mark residual is0.144 ms, below0.5 ms. All four flows succeeded. Full-window profiler flags remain in proof.json. Four measured sessions; no replacement. Browser and server cleanup used only owned PIDs and all exited. No screenshot ran during any trace. No extra GL query occurred.

Read-only .agents sandbox writes initially failed. Narrow automatic review approved owned-folder writes and commands; no approval rejection occurred. A PowerShell summary pipeline and two tool-call strings had syntax errors before running. They caused no app session. Native RAF analysis was corrected to exclude out-of-window callback starts. An incorrect commentary assumption about rapid reopen was corrected from the saved successful state. These faults are retained here.

The remaining concrete bottleneck is first-use panel style/layout, still16–19 ms before RO in CONTROL. A future attribution pass can identify its costly layout/style nodes. This task proposes no other correction.

Proof: source.patch, source-proof.json, proof.json, run-manifest.json, measurements.json, all-window-metrics.csv, verification.json; runs/*/result.json and analysis.json; runs/*/{open-first,Candle,close,open-second}/trace.json.gz and trace-completion.json. Source stages, build logs, command journals and screenshots are retained. setup/build/run/analyze/report scripts reproduce the artifact work. The clean preview stays unchanged.
