Independent review of the affected Canvas2D control
===================================================

The control strongly supports the reported smoother text animation in this captured session.
It does not yet justify promotion as an accepted production fix.
The old default is a historical comparison, not a contemporaneous matched baseline.
Keep the existing one-option preview as the candidate for one repeatability check.
Main HEAD d82230a remains rejected.

The user reports “Clearly smoother.” Preserve that visual assessment separately from recorded timing.
Neither capture includes a synchronized display recording or presentation trace.

Decisive observations
---------------------

1. Control first boot and full replay have almost identical text cadence.
   In the source window 0.35 <= boot < 3.5, engine means are 16.6846 and 16.6857 ms.
   Both rAF means are approximately 16.69 ms and both medians are 16.7 ms.
   The 188 first-boot intervals and 189 replay intervals contain no >=42 ms or >50 ms gap on either clock.
   The previous first-versus-replay text penalty is absent in this session.
2. The historical default is much slower at identical source phases.
   Its text engine means are 38.6659 and 35.0344 ms, with 32/82 and 13/90 intervals >=42 ms.
   Corresponding rAF means are 38.6585 and 35.0367 ms.
   Control text engine means are 56.85% and 52.37% lower, respectively.
   These are descriptive cross-session differences, not estimates of the option's causal effect.
3. Powered solid-fill returns also improve.
   Engine means change from historical 28.45/28.31 to control 16.65/16.62 ms.
   rAF means change from 28.36/28.24 to 16.68/16.69 ms.
   The control contains 68 measured intervals per powered return and no >=42 ms interval.
   Default contains 40/39 intervals, with 2/40 and 2/39 >=42 ms.
   These returns contain no boot text.
4. The control does not remove every outlier.
   Its first boot contains a 118.9 ms engine gap and a 116.7 ms rAF interval at boot=4.
   This is worse than the old default first-boot maximum of 54.4 ms.
   It occurs after the text animation, during the final handoff classified as “fade.”
   The control replay's worst gap is 37.6 ms, also at boot=4.
5. Startup contains a possible cost that the faster document response masks.
   Navigation-to-START-DOM improves by 63.2 ms, but create-room-to-room-ready increases by 176.1 ms.
   Pre-START long-task duration increases from 196 to 354 ms across separate tasks.
   This is a signal to measure again, not an established option-induced startup regression.

Core comparison
---------------

Milliseconds. Both clocks use the source window 0.35 <= boot < 3.5.

| Capture/run | n | Engine mean / p50 / p95 / max | Engine >=42 / >50 | rAF mean / p50 / p95 / max | rAF >=42 / >50 |
|---|---:|---|---|---|---|
| Control first | 188 | 16.68 / 16.75 / 18.97 / 20.20 | 0 (0%) / 0 (0%) | 16.69 / 16.70 / 16.80 / 16.80 | 0 (0%) / 0 (0%) |
| Control replay | 189 | 16.69 / 16.70 / 17.00 / 17.50 | 0 (0%) / 0 (0%) | 16.69 / 16.70 / 16.80 / 16.80 | 0 (0%) / 0 (0%) |
| Old default first | 82 | 38.67 / 34.20 / 52.19 / 54.40 | 32 (39.02%) / 16 (19.51%) | 38.66 / 33.40 / 50.10 / 50.20 | 32 (39.02%) / 10 (12.20%) |
| Old default replay | 90 | 35.03 / 33.40 / 51.06 / 52.50 | 13 (14.44%) / 6 (6.67%) | 35.04 / 33.40 / 50.10 / 50.10 | 13 (14.44%) / 9 (10.00%) |

Control phase engine means, first/replay:
camera 16.81/16.67, activation 16.68/16.68, arrival 16.72/16.68,
drop 16.69/16.69, colour/glint 16.66/16.69, fade 18.49/17.06 ms.

The complete phase distributions, sample counts, rates, and rAF equivalents are in tables.md and cadence.csv.
metrics.json includes current and previous callback distributions for every source phase.
The two derived frame CSV files retain all intervals.

The text result survives removal of the interval entering the window.
Internal-only engine means are 16.69/16.68 ms for control and 38.75/35.05 ms for default.
Extending the window through boot<4 gives control means 16.6862/16.6840 ms, with no >=42 ms interval.
The result therefore does not depend on omitting the text fade.

Do not describe this as a shorter animation.
First/replay mode-to-completion durations are control 7311.3/7314.9 ms and default 7331.2/7304.3 ms.

Measured callback work and alignment
------------------------------------

An incoming gap belongs to the destination phase.
Its predecessor is the measured callback that occupies part of the gap.
The destination callback occurs after the gap.

Previous callbacks for the common text window:

| Capture/run | n | Paint mean / p50 / p95 / max | Submit mean / p50 / p95 / max | Total mean / p50 / p95 / max |
|---|---:|---|---|---|
| Control first | 188 | 0.51 / 0.50 / 0.80 / 3.00 | 8.00 / 8.20 / 10.67 / 13.20 | 8.94 / 9.15 / 11.97 / 14.50 |
| Control replay | 189 | 0.38 / 0.40 / 0.60 / 0.70 | 8.16 / 8.20 / 9.82 / 11.00 | 8.94 / 8.90 / 10.80 / 11.80 |
| Old default first | 82 | 0.66 / 0.60 / 1.30 / 1.90 | 3.06 / 2.90 / 5.20 / 6.10 | 4.35 / 4.10 / 6.89 / 7.50 |
| Old default replay | 90 | 0.55 / 0.50 / 0.80 / 1.10 | 3.23 / 2.95 / 5.42 / 6.30 | 4.39 / 4.15 / 6.75 / 7.60 |

The control spends more elapsed time in renderer.render, while its incoming intervals become much shorter.
The mean interval outside the predecessor's measured total changes from 34.32/30.65 to 7.74/7.75 ms.
This remainder includes unmeasured application work, browser work, and waiting. It is not proven idle time.
The timing shift is consistent with changed canvas-to-texture work or synchronization.
It does not identify the executing processor or native subsystem.

Paint and submit are included in total. Do not add them to total.
Return paintMs is zero because the timer excludes the solid-fill branch.
Those fill calls still occur inside totalMs.
Powered-return previous total means are control 7.18/8.07 and default 2.41/2.49 ms.
The separate long-task totals do not include an additional sum of callback durations.

Worst incoming alignment:

| Capture/run | Incoming index / boot | Engine / rAF interval | Previous paint / submit / total | Outside previous total |
|---|---|---|---|---:|
| Control first | 420 / 4 | 118.9 / 116.7 | 0.3 / 4.7 / 5.3 | 113.6 |
| Control replay | 1042 / 4 | 37.6 / 33.4 | 0.1 / 4.9 / 5.3 | 32.3 |
| Old default first | 220 / 1.515 | 54.4 / 50.0 | 0.5 / 4.7 / 5.7 | 48.7 |
| Old default replay | 748 / 4 | 65.2 / 66.7 | 0.3 / 1.7 / 2.4 | 62.8 |

The control first gap spans t=11287.2 to 11406.1 ms.
Its destination callback takes 5.1 ms and cannot explain the preceding 118.9 ms.
No recorded event or long task overlaps this gap.
The source permits boot=4 while the final camera/layer transition continues.
No screenshot identifies whether this interval was visibly disruptive.
Retain it as unresolved handoff evidence.

No long task overlaps either boot or either return in either capture.
No measured boot callback exceeds 14.5 ms in control.
Recorder frame-start overhead has p95 <=0.1 ms and maximum 0.2 ms.
That timer does not include all instrumentation overhead.

First callback cost remains a separate observation:

| Capture/run | First callback paint / submit / total | First powered callback paint / submit / total | Following powered gap |
|---|---|---|---:|
| Control first | 4.6 / 2.2 / 8.8 | 1.6 / 11.8 / 14.1 | 16.8 |
| Control replay | 0.1 / 1.1 / 2.3 | 0.3 / 10.5 / 11.5 | 16.8 |
| Old default first | 1.7 / 1.5 / 11.1 | 1.4 / 3.2 / 5.1 | 17.2 |
| Old default replay | 0.1 / 2.1 / 4.3 | 0.2 / 2.7 / 3.6 | 16.6 |

Control first paint increases, but first total decreases in this cross-session comparison.
First powered total increases without a subsequent interval stall.
No measured activation stall warrants a new warm draw.

Startup: possible cost, attribution unresolved
----------------------------------------------

Times are milliseconds from navigation timeOrigin.

| Marker | Old default | Control | Control minus default |
|---|---:|---:|---:|
| Document responseEnd | 911.8 | 547.1 | -364.7 |
| DOMContentLoaded | 1106.5 | 783.4 | -323.1 |
| Load | 1327.2 | 1193.8 | -133.4 |
| Diagnostic initialized | 1231.6 | 930.1 | -301.5 |
| create-room | 1560.9 | 1321.5 | -239.4 |
| Screen texture created | 1616.4 | 1443.7 | -172.7 |
| Model parsed | 1899.9 | 1750.7 | -149.2 |
| Assets prepared | 2403.8 | 2297.3 | -106.5 |
| Fonts ready | 2495.9 | 2401.2 | -94.7 |
| Room ready | 2689.1 | 2625.8 | -63.3 |
| START DOM, initial run 0 | 2691.1 | 2627.9 | -63.2 |
| START entry complete | 3706.5 | 3648.2 | -58.3 |

| Elapsed segment | Old default | Control | Difference |
|---|---:|---:|---:|
| responseEnd to diagnostic | 319.8 | 383.0 | +63.2 |
| Diagnostic to create-room | 329.3 | 391.4 | +62.1 |
| create-room to screen texture | 55.5 | 122.2 | +66.7 |
| Screen texture to model parsed | 283.5 | 307.0 | +23.5 |
| Model parsed to assets prepared | 503.9 | 546.6 | +42.7 |
| Assets prepared to compile wait | 89.6 | 98.2 | +8.6 |
| Compile promise wait | 0.5 | 0.5 | 0 |
| Compile end to font wait | 0 | 0.1 | +0.1 |
| Font readiness wait | 2.0 | 5.1 | +3.1 |
| Fonts ready to room ready | 193.2 | 224.6 | +31.4 |
| Room ready to START DOM | 2.0 | 2.1 | +0.1 |
| START DOM to entry start | 467.4 | 466.4 | -1.0 |
| START entry animation | 548.0 | 553.9 | +5.9 |

create-room-to-ready: 1128.2 -> 1304.3 ms (+176.1).
responseEnd-to-START-DOM: 1779.3 -> 2080.8 ms (+301.5).
Diagnostic-to-START-DOM: 1459.5 -> 1697.8 ms (+238.3).
START-DOM-to-entry-complete: 1015.4 -> 1020.3 ms (+4.9).

The source delays START entry by 450 ms and gives its transition a nominal 520 ms duration.
The approximately 1.02-second measured entry envelope exists in both captures.
Do not attribute that existing envelope to this control.
The compile wait covers already-submitted work, not all shader compilation.
Font readiness does not measure first glyph rasterization or native font-cache preparation.
The fonts-to-ready interval contains existing warm room draws and scheduler yields.
It contains no new boot-text preparation.

Control long tasks: 150 ms at 1288.1, 50 ms at 1440.3, 59 ms at 2297.4, and 95 ms at 2502.2.
Default long tasks: 86 ms at 1528.5, 53 ms at 2403.9, and 57 ms at 2626.6.
All finish before initial START DOM.
Pre-model totals are 200 versus 86 ms. Pre-START totals are 354 versus 196 ms.
These are separate task durations, not total startup CPU time.

The control's 150 ms task starts before create-room and ends before boot-canvas-context-created at 1442.2 ms.
The entire task therefore cannot be the new boot Canvas2D getContext call.
The context-created marker falls 1.9 ms into the next 50 ms task.
That task includes later work. Neither marker isolates getContext or getContextAttributes duration.
The extra once-only attribute read and marker remain an instrumentation confound.

Trusted gesture-to-boot-mode delays are control 166.6/160.9 and default 165.0/161.4 ms.
They are separate from startup and human waiting.
The user waits 451.0 ms after initial entry completion in control versus 1220.2 ms in default.
That difference can affect warm-up, scheduling, and device state.

Network and cache limits
------------------------

Control has 37 resource entries and 2,051,768 recorded transfer bytes.
Default has 38 entries and 2,051,383 bytes.
Both contain 35 nonzero-transfer entries.
Neither has a zero-transfer, nonzero-body entry that supports a local response-cache hit.
Control has two both-zero preview feedback entries. Default has three.
Those entries have ambiguous timing exposure and do not prove cache hits.
Headers, response status, server cache state, and native caches are absent.

The same model asset reports 247.5 versus 258.9 ms duration in control/default.
Draco WASM reports 303.6 versus 53.9 ms.
The engine chunk reports 315.3 versus 237.7 ms.
Inter reports 135.3 versus 57.2 ms.
These differences prevent treating startup segments as pure local execution measurements.
Document responseEnd is not an isolated TTFB measurement.

All valid recorded resource intervals finish before first START.
No recorded resource starts after it.
Both captures contain a negative worker duration: control -56.3 ms, default -32.1 ms.
The schema allows these values, but they cannot represent valid elapsed network duration.
Retain them unchanged and exclude them from chronological network conclusions.
Their cause is unknown. The resource list does not prove complete network or worker coverage.

Validation and source semantics
-------------------------------

Both hashes match. Original files remain untouched.

Control:
C:/Users/Neil Skaria/.t3/userdata/attachments/fab6e615-3ee1-4b06-99e4-bbf3bda6d6af-33bef0bb-21fa-48d2-bcf7-97c586a35a17-json.json
403871 bytes, SHA256 9dcea10df91c2e53cad44b0723be40a2e7a9bcd7d20bbc666a6236b8d336e9d1.

Default:
../affected-capture-analysis-20261012/capture.json
303648 bytes, SHA256 5282fb0224e1e3dbf13fafc0bd386c053e3f2c25fa1e4bb4e22dd43dac81b179.

Control passes every rule in the updated and original schemas.
Default passes the original schema.
The validator covers every keyword used by these schemas and rejects unhandled keywords.
Schema success does not establish physical truth, including the negative resource durations.

Control has 1246 frames, 71 events, four long tasks, and zero errors.
Default has 919 frames, 70 events, three long tasks, and zero errors.
counts.events/frames/longtasks/errors are dropped counters, not array lengths. All are zero.
Both captures have two runs, complete first/return/replay, all expected markers, and a complete second return.
Every phase has samples.
Every phase label independently reconstructs from power markers and source thresholds.
Every gap equals the difference between consecutive engine starts in the same mode/run.
Every paint/upload marker aligns inside a measured callback.
No negative callback duration or inconsistent nested timer was found.

Both report Chrome154, Adreno740/ANGLE GLES3.2, viewport411x784, DPR2.625, and buffer822x1568.
The source caps renderer pixel ratio at 2. Both boot textures remain 960x640.
The reduced Android10 UA does not identify actual OS or device model.
Both report visible at export, no visibility-change event, and reducedMotion=false.
No dedicated context-loss listener exists. Empty errors do not certify native context continuity.

Fonts report loaded. Declared stacks and captured glyph font strings match, including the 146.325px word font.
Resolved glyph fonts, refresh rate, font-cache state, and presentation remain unmeasured.
The Inter resource does not establish which font the canvas uses.

Both label reference a796e9aea60def6e0849cb75a151fd6570942339 plus cameraFix 042dc805.
I independently compared the retained source stages.
Of 93 control files, 90 are byte-identical to the original stage.
engine.ts and diagnostic.ts change. context-control.ts is new. No original file is removed.
The diff confirms unchanged drawing, timing, phase boundaries, camera, texture dimensions, and return logic.
Rejected glyph caches and panel preparation are absent from these changes.

The source's screen-texture-created event still says “default Canvas2D” in control.
That hard-coded label is stale. experiment.mode and contextAttributes correctly identify the control.
Requested and reported willReadFrequently are true, with supported attribute access.
Old default does not record attributes. Its retained source omits the options argument.
The standard defines willReadFrequently as a readback-optimization setting, not proof of processor backing.
Sources:
https://html.spec.whatwg.org/multipage/canvas.html#2dcontext
https://html.spec.whatwg.org/multipage/canvas.html#dom-canvasrenderingcontext2d-getcontextattributes

frameStart occurs inside render after the idle gate.
rAF deltas therefore describe recorded renderer callbacks, not all page callbacks or display presents.
Paint markers follow fillText. Texture onUpdate records upload submission, not GPU completion.
frameEnd excludes other callbacks, external GSAP work, native execution after submission, and presentation.

Narrowed hypotheses and remaining confounds
------------------------------------------

The result increases confidence that the active boot-canvas/texture path contributes to the cadence problem.
Unchanged direct text code alone is a weaker exclusive explanation.
Improved solid-fill returns weaken an explanation limited to first-use glyphs.
Stable pre-power cadence and changed post-power cadence fit this narrower hypothesis.

Deferred Canvas2D work, texture transfer/flush, native synchronization, GPU queues, browser scheduling,
and compositor interaction remain possible.
Longer measured submission with shorter intervals is compatible with redistributed work.
It does not prove CPU backing or disabled GPU acceleration.
Exclusive raster/GPU/compositor attribution requires a synchronized native trace.

There is one control session and one default session, approximately 34 minutes 49 seconds apart.
They use different deployments and changed bundle hashes.
Network conditions, renderer/driver/font/OS caches, page order, thermal state, power mode, and background load are uncontrolled.
First and replay also occur in fixed order.
The newer recorder adds a once-only context attribute read and marker.
The captures omit a full URL or deployed source hash. Source alignment relies on retained stages and supplied provenance.
Frame samples are serial observations, not independent trials.
They cannot establish reliability or a session-level success probability.

ONE smallest next step
---------------------

Run one counterbalanced four-capture check on the existing preview and affected browser:
default -> control, then control -> default.
Use a fresh page/renderer for each capture.
Retain first START -> BACK -> full replay in each page.
Close the previous page before opening the next.
Use similar device conditions and the same short wait after START entry completes.
Record order and visual judgment. Preserve resource/cache evidence.
Do not clear caches in only one condition.
This supplies two contemporaneous pairs with opposite order and reuses the existing startup markers.

Default:
https://portfolio-lk5iol120-neil-skarias-projects.vercel.app/lab/boot
Control:
https://portfolio-lk5iol120-neil-skarias-projects.vercel.app/lab/boot?bootCanvas=will-read-frequently

Before promotion, the control must repeat its visual and cadence benefit in both orders.
The default must reproduce enough slowdown to make the pairs informative.
Compare identical phases, the common text window, powered returns, and the boot=4 handoff.
Also compare navigation-to-START, post-response/startup segments, long tasks, and first callback costs.
A reproducible startup penalty or handoff regression blocks acceptance.
If both modes are smooth, the check does not establish an option-specific benefit.
If network differences dominate startup, startup cost remains unresolved.

No further Windows matrix is needed.
No warm draw, glyph cache, panel preparation, source change, build, or deployment is justified by this review.
A native trace is required for exclusive attribution, not as a substitute for this small repeatability check.

Reproduction and independence
------------------------------

I read captures and source before consulting the prior baseline analysis.
I computed decisive metrics independently in analyze.py.
After computation, I read the older baseline script and report.
Window definitions, quantiles, baseline means, thresholds, and worst-gap alignment agree.
I did not consult any new primary control analysis.

Run analyze.py, then supplement.py and render_report.py with Python from the repository root.
Outputs belong only to this directory.
The attachments and prior evidence were not edited, overwritten, or removed.
No application source, build, Git, or deployment action occurred.
The protected artifact directory required narrow command approval through Auto-review.
No credential bypass or alternate permission path was used.

