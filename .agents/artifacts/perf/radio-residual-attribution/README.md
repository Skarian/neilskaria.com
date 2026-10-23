# Residual first-radio attribution

Task: radio-residual-attribution, implementation worker. Branch redesign. HEAD a796e9aea60def6e0849cb75a151fd6570942339.
Baseline camera revision 042dc805f9135f3b4efbcd0d2a9e90eafcdd80c0 remains. The unrelated archive-ignore revision remains.

## Result

Outline rendering causes a repeatable part of the residual first-radio gap on this Windows host.
The experiment omits only outline passes. It keeps picking, hover state, ordinary scene rendering, radio state, and camera timing.
Five primary captures alternate PFR / PFRO / PFR / PFRO / PFR. Each capture has a fresh Chrome profile.
PFR holds panel mounting outside the 1300 ms window, replays saved fitting vectors, and uses a prepared suspended AudioContext.
PFRO adds outline omission. These are diagnostics. They are not shipping fixes.

## First selection

- max: median 132.5 -> 89.5. Change -43.0 (-32.4%). Baseline range 126.1-135.3. Control range 70.7-108.4.
- p95: median 49.4 -> 29.3. Change -20.1 (-40.8%). Baseline range 45.2-51.0. Control range 22.3-36.2.
- over34: median 6.0 -> 3.0. Change -3.0 (-50.0%). Baseline range 6.0-7.0. Control range 2.0-4.0.
- cameraDelay: median 114.5 -> 109.8. Change -4.7 (-4.1%). Baseline range 104.3-117.6. Control range 86.3-133.4.
- dispatchLead: median 118.7 -> 76.9. Change -41.8 (-35.2%). Baseline range 116.2-119.3. Control range 63.2-90.6.

## Repeated selection

- max: median 34.8 -> 21.2. Change -13.6 (-39.1%). Baseline range 24.6-42.2. Control range 19.2-23.2.
- p95: median 28.3 -> 18.3. Change -10.0 (-35.3%). Baseline range 21.1-28.9. Control range 18.2-18.4.
- over34: median 1.0 -> 0.0. Change -1.0 (-100.0%). Baseline range 0.0-2.0. Control range 0.0-0.0.
- cameraDelay: median 38.1 -> 26.1. Change -12.0 (-31.5%). Baseline range 32.2-52.5. Control range 20.5-31.7.
- dispatchLead: median 36.1 -> 30.2. Change -5.9 (-16.3%). Baseline range 32.8-39.9. Control range 20.7-39.7.

The first-selection maximum gap falls 132.5 -> 89.5 ms, a 43.0 ms reduction (32.4%).
Restored baseline runs return to 135.3 and 126.1 ms. Their ranges do not overlap the controls.
The control range spans 37.7 ms. This limits the precision of the estimated effect.
Camera-delay medians improve only 4.7 ms. One control is slower than every baseline.
Do not claim a reliable camera-start latency fix from this experiment.

## Task source and stage alignment

Existing reduced captures and the saved P trace were inspected before capture.
That trace has a 75.4 ms pre-click scene callback and a 75.1 ms click dispatch.
The new prepared baseline trace locates the remaining long pre-click task in scene rendering.
Its RunTask lasts 90.140 ms at click -92.797 ms. Its scene callback lasts 85.867 ms.
Shader-status/reflection work occurs inside that callback. GetProgramiv spans total 28.220 ms, with an 11.432 ms maximum.
CPU samples also locate getProgramInfoLog, getProgramParameter, and getShaderInfoLog.
These samples are statistical wall-time evidence. They are not exclusive native CPU budgets.

In light baselines, the callback before click lasts 70.2-73.4 ms.
It falls to 7.3-14.5 ms in outline controls. The first maximum gaps straddle that callback and the delivered click.
The first post-click callback falls from 37.7-41.7 ms to 13.9-25.5 ms.
Its outline timer falls from 9.5-12.3 ms to zero. Scene main rendering remains.
The post-click maximum RunTask in the baseline trace lasts 74.861 ms at +58.054 ms.
It contains a 54.790 ms scene callback. The control's early scene callbacks have an 18.087 ms maximum.
Removing outline changes which work fits into subsequent callbacks. Do not subtract trace totals as an exclusive outline budget.

Local audio preparation remains in every measured gesture.
Prepared-context use records suspended state and active user gesture. No pre-click sound or autoplay bypass occurs.
Light baseline synth creation lasts 12.3-13.5 ms. Controls take 16.1-17.1 ms.
Noise filling is inside synth creation. Synth creation is inside focus. Do not add those durations.
The control improves gaps despite slower measured local preparation. This rules out local preparation removal as the intervention.
Context resume and the native audio graph remain. Their asynchronous work is not assigned an exclusive budget.

External media startup remains enabled. A separate late task occurs in the control trace.
At +1043.795 ms, YouTube www-widgetapi.js evaluation lasts 44.396 ms.
The containing RunTask lasts 44.986 ms. A 63.4 ms gap ends at +1093.8 ms.
The prior scene callback takes only 8.2 ms. This gap aligns with external script evaluation.
The baseline trace has smaller late script work. Network timing is variable.
This establishes a separate late media task, not the share of all media costs or a causal effect of deferring media.
Controls also retain late 56.7 and 61.7 ms light gaps. Those light captures have no task trace, so their sources remain unassigned.

Remaining layout is smaller than the original panel stall.
In +0-300 ms, the baseline trace has maximum Layout 6.807 ms and UpdateLayoutTree 5.933 ms.
The control has maximum Layout 4.823 ms and UpdateLayoutTree 4.850 ms.
Report these separately. They nest inside browser tasks and do not form an additive stall budget.
Scheduling intervals remain unassigned where the trace does not show a containing task.
No host scheduling interval is labeled app CPU cost. No driver or GPU execution cause is claimed.

## Smallest supported implementation direction

Reduce outline work on the first activation path. That is the new supported intervention.
A shipping variant must preserve required hover feedback and verify the result.
Suppressing outline during camera movement or preparing its programs before input are candidate variants, not verified fixes.
This control omits all outline passes, including first hover. It does not prove the effect of either narrower variant.
Existing evidence separately supports reducing panel mount/layout work and redundant fitting.
Prepared noise reduces its local stage, but prior whole-gap effects are smaller and variable.
This round does not support making audio-context preparation or media deferral the primary fix.
No implementation or preview deployment occurs in this task. The later task owns those authorized actions.

## Method, confounds, and limits

Seven new valid captures: five primary captures and two targeted traces.
A sandboxed browser launch failed before page capture. Its log is retained and excluded.
Chrome 154, Windows, RX590 Vulkan. Desktop 1280x800 DPR1 and unchanged 1280x800 drawing buffer.
CPU throttle 4x reproduces the residual. No normal-CPU campaign or boot experiment occurs.
Primary capture hooks have no GL wrappers, style probes, GPU queries, or GPU polling.
Stage timers and ordinary app layout remain. Gaps are submission-callback starts, not display-present frames.
The camera keeps its committed tween schedule. Both variants replay the same saved PF-8 fitting vectors and free-space fractions.
Replayed geometry derives from an earlier room state. This is a shared control confound.
The panel is delayed 1400 ms in both variants. START exit and stream activation remain enabled.
Repeated selection occurs after real BACK and 1500 ms settling. The radio, shaders, and browser caches are warm then.
Do not pool repeated and first selection or traced and untraced results.

CPU-profiler startup adds 554.024 ms before input in the baseline trace.
The control trace also uses the same profiler categories. Its startup pause is outside the measured input window.
No profiler startup duration is attributed to the app. Traces are diagnostic only.
Trace sampling and broad categories add overhead. Light captures supply the causal comparison.
Fresh profiles do not reset driver/OS caches. Host load and live network timing can vary.
Two controls bound the result but do not provide a population estimate.
These data do not verify macOS, Android, physical presentation, or Safari behavior.
The exact missing measurement for the surviving tail is a task-aligned media-startup control with scene and gesture policy unchanged.
For a narrower outline fix, the missing measurement is the same matched sequence with that exact variant.

## Evidence and restoration

Raw captures are in interaction-attribution/. Two compressed traces accompany them.
summary.json, comparisons.json, trace-detail.json, and existing-inspection.json retain stage alignment and full run variation.
The replay reference remains ../interaction-attribution/clock-4x-PF-8.json. Previous evidence is preserved.
Scripts retain the temporary staging paths used for execution. Copy them to a new owned staging directory before rerunning.
Four source originals and restoration hashes are retained. Every source file is restored byte-for-byte.
The tracked diff is empty. HEAD and branch are unchanged. See source-status.json.
Node 24.21.0 generated clean client/server output. The generated client chunks contain no diagnostic hooks.
Vercel packaging still fails on Windows function symlink EPERM. No full build pass is claimed.
The owned server stopped. Owned browser processes are absent. Cleanup details are in cleanup.json.
No commit, push, deployment, dependency change, or global setting change occurs.

Follow-up implementation completed in ../lean-stutter-fix/. Its task-owned temporary staging directory was removed after verification. No diagnostic source edits remain.
