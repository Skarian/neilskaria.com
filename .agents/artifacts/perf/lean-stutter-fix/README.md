# Lean stutter fixes

Implementation worker. Checkout C:/projects/neilskaria.com. Branch redesign.
Base HEAD a796e9aea60def6e0849cb75a151fd6570942339 includes camera fix 042dc805f9135f3b4efbcd0d2a9e90eafcdd80c0.
The archive ignore entry and emoji fixes remain. No radio policy, persistence, dependency, hosting, or production release change occurs.

## Implemented changes

1. Boot glyph preparation. Eight white glyph masks use the largest arrival scale. A tightly bounded magenta domain image is prepared once.
   One scratch surface supplies the original changing colours. Existing metrics, slots, transforms, alpha, glint, and fade remain.
   Preparation follows document.fonts.ready and yields between glyphs. Disposal releases every prepared canvas.
2. Lantern and radio panel preparation. Each panel mounts in a separate yielded task after room asset loading starts.
   Inactive panels are hidden and inert. They do not invoke player setters or persistence. An early selection retains a first-mount fallback.
   The original pop formula supplies identical entry keyframes. Entry delay is 350 ms, entry duration is 520 ms, and exit duration is 220 ms.
   Child entries restart on selection, including interrupted reselection. Stale animation completions and tick continuations cannot hide or report the new selection.
3. Duplicate fitting guard. Fractions are clamped before comparison. Matching fractions skip only when projection and viewport dimensions match.
   Each new focus computes a fresh view. Resize still forces fitting. Six fitting rounds, cube lift, and neat bonsai geometry remain.

No radio preparation or outline warm-up is included. Residual evidence points mainly to scene/outline work and a separate late media task.
See ../radio-residual-attribution/README.md.

## Final shipping measurements

These are engine submission-callback gaps. They are not display-present frames.
Chrome154, Windows, RX590 Vulkan. Glyph captures use 412x915 DPR2.625, with application cap2 and 824x1830 buffer.
Panel captures use desktop1280x800 DPR1. Camera, resolution, ordinary audio policy, and network setup match within each comparison.
Fresh isolated profiles are used. Driver/OS caches remain shared.

Final padded glyph sequence is A6 / B4 / A7 at4x. Normal CPU has a representative B2 / A3 restoration pair.
Both glyph conditions include the same panel/fitting code. The baseline performs the original direct text drawing and skips mask preparation.
- glyph 1x p95: 18.0 -> 17.6. Change -0.4 (-2.2%). Baseline 18.0-18.0. Candidate 17.6-17.6.
- glyph 1x max: 18.4 -> 18.1. Change -0.3 (-1.6%). Baseline 18.4-18.4. Candidate 18.1-18.1.
- glyph 4x p95: 20.9 -> 17.8. Change -3.1 (-14.6%). Baseline 20.5-21.2. Candidate 17.8-17.8.
- glyph 4x max: 29.0 -> 18.2. Change -10.8 (-37.3%). Baseline 24.0-34.1. Candidate 18.2-18.2.

The final 4x glyph maximum is 24.0 ms before, 18.2 ms with masks, and 34.1 ms after restoration.
Final p95 is20.5 /17.8 /21.2 ms. Earlier baselines were slower. Do not pool those source conditions.

Final panels use original-source A6 / corrected B4 / original-source A7.
Only this sequence includes the corrected child-animation reset CSS. Earlier prototypes are excluded from final contrasts.
- panel 1x lantern first p95: 17.9 -> 18.0. Change 0.1 (0.6%). Baseline 17.8-18.0. Candidate 18.0-18.0.
- panel 1x lantern first max: 37.1 -> 18.3. Change -18.8 (-50.7%). Baseline 36.1-38.1. Candidate 18.3-18.3.
- panel 1x lantern first over34: 1.0 -> 0.0. Change -1.0 (-100.0%). Baseline 1.0-1.0. Candidate 0.0-0.0.
- panel 1x lantern first cameraDelay: 40.1 -> 42.3. Change 2.2 (5.5%). Baseline 39.7-40.5. Candidate 42.3-42.3.
- panel 1x lantern first fitCount: 3.0 -> 2.0. Change -1.0 (-33.3%). Baseline 3.0-3.0. Candidate 2.0-2.0.
- panel 1x lantern first fitWall: 7.1 -> 5.2. Change -1.9 (-27.3%). Baseline 6.8-7.5. Candidate 5.2-5.2.
- panel 1x lantern first boundsWall: 23.2 -> 2.0. Change -21.2 (-91.4%). Baseline 23.1-23.3. Candidate 2.0-2.0.
- panel 1x lantern repeat p95: 17.9 -> 18.0. Change 0.1 (0.6%). Baseline 17.6-18.2. Candidate 18.0-18.0.
- panel 1x lantern repeat max: 40.8 -> 44.5. Change 3.7 (8.9%). Baseline 38.3-43.4. Candidate 44.5-44.5.
- panel 1x lantern repeat over34: 1.0 -> 1.0. Change 0.0 (0.0%). Baseline 1.0-1.0. Candidate 1.0-1.0.
- panel 1x lantern repeat cameraDelay: 55.0 -> 57.2. Change 2.2 (4.0%). Baseline 52.5-57.5. Candidate 57.2-57.2.
- panel 1x lantern repeat fitCount: 3.0 -> 1.0. Change -2.0 (-66.7%). Baseline 3.0-3.0. Candidate 1.0-1.0.
- panel 1x lantern repeat fitWall: 1.7 -> 1.2. Change -0.5 (-27.3%). Baseline 1.5-1.8. Candidate 1.2-1.2.
- panel 1x lantern repeat boundsWall: 1.8 -> 2.1. Change 0.3 (16.7%). Baseline 1.7-1.9. Candidate 2.1-2.1.
- panel 1x clock first p95: 18.2 -> 17.9. Change -0.3 (-1.6%). Baseline 18.1-18.3. Candidate 17.9-17.9.
- panel 1x clock first max: 34.7 -> 22.2. Change -12.5 (-36.0%). Baseline 33.4-36.0. Candidate 22.2-22.2.
- panel 1x clock first over34: 0.5 -> 0.0. Change -0.5 (-100.0%). Baseline 0.0-1.0. Candidate 0.0-0.0.
- panel 1x clock first cameraDelay: 42.2 -> 26.6. Change -15.6 (-36.9%). Baseline 39.5-44.8. Candidate 26.6-26.6.
- panel 1x clock first fitCount: 3.0 -> 2.0. Change -1.0 (-33.3%). Baseline 3.0-3.0. Candidate 2.0-2.0.
- panel 1x clock first fitWall: 7.6 -> 5.3. Change -2.3 (-29.8%). Baseline 7.4-7.7. Candidate 5.3-5.3.
- panel 1x clock first boundsWall: 16.0 -> 4.7. Change -11.3 (-70.5%). Baseline 15.8-16.1. Candidate 4.7-4.7.
- panel 1x clock repeat p95: 17.7 -> 17.7. Change 0.0 (0.3%). Baseline 17.6-17.7. Candidate 17.7-17.7.
- panel 1x clock repeat max: 41.2 -> 42.0. Change 0.8 (1.9%). Baseline 38.7-43.7. Candidate 42.0-42.0.
- panel 1x clock repeat over34: 1.0 -> 1.0. Change 0.0 (0.0%). Baseline 1.0-1.0. Candidate 1.0-1.0.
- panel 1x clock repeat cameraDelay: 54.8 -> 54.3. Change -0.5 (-0.9%). Baseline 52.5-57.1. Candidate 54.3-54.3.
- panel 1x clock repeat fitCount: 3.0 -> 1.0. Change -2.0 (-66.7%). Baseline 3.0-3.0. Candidate 1.0-1.0.
- panel 1x clock repeat fitWall: 1.8 -> 1.6. Change -0.2 (-11.1%). Baseline 1.6-2.0. Candidate 1.6-1.6.
- panel 1x clock repeat boundsWall: 4.0 -> 1.8. Change -2.2 (-55.0%). Baseline 3.9-4.1. Candidate 1.8-1.8.
- panel 4x lantern first p95: 18.3 -> 23.0. Change 4.7 (25.7%). Baseline 18.3-18.3. Candidate 23.0-23.0.
- panel 4x lantern first max: 203.8 -> 115.3. Change -88.4 (-43.4%). Baseline 200.9-206.6. Candidate 115.3-115.3.
- panel 4x lantern first over34: 2.0 -> 2.0. Change 0.0 (0.0%). Baseline 2.0-2.0. Candidate 2.0-2.0.
- panel 4x lantern first cameraDelay: 190.9 -> 91.6. Change -99.3 (-52.0%). Baseline 184.0-197.8. Candidate 91.6-91.6.
- panel 4x lantern first fitCount: 3.0 -> 2.0. Change -1.0 (-33.3%). Baseline 3.0-3.0. Candidate 2.0-2.0.
- panel 4x lantern first fitWall: 27.2 -> 22.6. Change -4.6 (-16.9%). Baseline 26.5-27.9. Candidate 22.6-22.6.
- panel 4x lantern first boundsWall: 107.1 -> 11.3. Change -95.9 (-89.5%). Baseline 103.6-110.7. Candidate 11.3-11.3.
- panel 4x lantern repeat p95: 20.7 -> 20.5. Change -0.2 (-1.0%). Baseline 18.1-23.3. Candidate 20.5-20.5.
- panel 4x lantern repeat max: 40.5 -> 38.2. Change -2.3 (-5.7%). Baseline 31.8-49.2. Candidate 38.2-38.2.
- panel 4x lantern repeat over34: 0.5 -> 1.0. Change 0.5 (100.0%). Baseline 0.0-1.0. Candidate 1.0-1.0.
- panel 4x lantern repeat cameraDelay: 53.3 -> 52.5. Change -0.8 (-1.4%). Baseline 39.4-67.1. Candidate 52.5-52.5.
- panel 4x lantern repeat fitCount: 3.0 -> 1.0. Change -2.0 (-66.7%). Baseline 3.0-3.0. Candidate 1.0-1.0.
- panel 4x lantern repeat fitWall: 8.5 -> 4.9. Change -3.6 (-42.7%). Baseline 7.4-9.7. Candidate 4.9-4.9.
- panel 4x lantern repeat boundsWall: 10.8 -> 10.7. Change -0.1 (-0.9%). Baseline 8.4-13.2. Candidate 10.7-10.7.
- panel 4x clock first p95: 28.0 -> 43.5. Change 15.5 (55.1%). Baseline 24.1-32.0. Candidate 43.5-43.5.
- panel 4x clock first max: 222.4 -> 159.3. Change -63.1 (-28.4%). Baseline 216.8-227.9. Candidate 159.3-159.3.
- panel 4x clock first over34: 3.0 -> 4.0. Change 1.0 (33.3%). Baseline 3.0-3.0. Candidate 4.0-4.0.
- panel 4x clock first cameraDelay: 226.7 -> 145.0. Change -81.7 (-36.0%). Baseline 221.2-232.2. Candidate 145.0-145.0.
- panel 4x clock first fitCount: 3.0 -> 2.0. Change -1.0 (-33.3%). Baseline 3.0-3.0. Candidate 2.0-2.0.
- panel 4x clock first fitWall: 36.8 -> 19.4. Change -17.4 (-47.3%). Baseline 34.2-39.4. Candidate 19.4-19.4.
- panel 4x clock first boundsWall: 85.2 -> 33.4. Change -51.8 (-60.8%). Baseline 83.9-86.5. Candidate 33.4-33.4.
- panel 4x clock repeat p95: 19.5 -> 21.0. Change 1.5 (7.7%). Baseline 18.1-20.9. Candidate 21.0-21.0.
- panel 4x clock repeat max: 45.9 -> 36.2. Change -9.7 (-21.1%). Baseline 43.7-48.1. Candidate 36.2-36.2.
- panel 4x clock repeat over34: 1.0 -> 1.0. Change 0.0 (0.0%). Baseline 1.0-1.0. Candidate 1.0-1.0.
- panel 4x clock repeat cameraDelay: 56.0 -> 43.3. Change -12.7 (-22.6%). Baseline 55.8-56.1. Candidate 43.3-43.3.
- panel 4x clock repeat fitCount: 3.0 -> 1.0. Change -2.0 (-66.7%). Baseline 3.0-3.0. Candidate 1.0-1.0.
- panel 4x clock repeat fitWall: 9.1 -> 6.5. Change -2.6 (-29.0%). Baseline 9.0-9.3. Candidate 6.5-6.5.
- panel 4x clock repeat boundsWall: 18.5 -> 9.9. Change -8.6 (-46.3%). Baseline 18.1-18.8. Candidate 9.9-9.9.

The final control has one capture per CPU/object condition. Each has two matched baseline endpoints.
The first maxima improve outside baseline variation. This is a bounded result, not a population estimate.
Whole-window p95 can worsen while the largest initial stall improves. Scene/outline and external media work remains.
Repeated lantern tails do not show a reliable improvement. Repeated radio maxima improve modestly.
Do not add fit, bounds, audio, render, and task durations. These spans overlap.

## Startup and memory cost

App glyph preparation takes10.2 ms normal and51.9 ms at4x in the final captures. These are wall durations, including yields.
The ten retained canvas surfaces hold7,438,536 declared RGBA bytes (7.44 MB).
That includes eight masks, the domain image, and one scratch surface. Browser snapshots and GPU storage are not measured.
All mask edges are clear. Surface dimensions and zero-size disposal checks are in appearance/direct-comparison.json.
A direct test in about:blank takes138.2 ms. It starts with a different font/cache state and is not an app-startup budget.

Panel prep retains63 element nodes, including21 controls, in the tested initial state. DOM bytes are not measured.
Preparation spans include pending tick work. They are not exclusive CPU costs.
- 1x clock preparation: lantern 25.6 ms, clock 7.2 ms.
- 1x lantern preparation: lantern 25.0 ms, clock 7.8 ms.
- 4x clock preparation: lantern 119.1 ms, clock 40.3 ms.
- 4x lantern preparation: lantern 135.6 ms, clock 47.9 ms.

- glyph 1x ready: 2559.1 -> 1734.6. Change -824.5 (-32.2%). Baseline 2559.1-2559.1. Candidate 1734.6-1734.6.
- glyph 1x loadingLongMax: 1045.0 -> 148.0. Change -897.0 (-85.8%). Baseline 1045.0-1045.0. Candidate 148.0-148.0.
- panel 1x lantern ready: 1602.3 -> 1760.2. Change 157.9 (9.9%). Baseline 1529.9-1674.8. Candidate 1760.2-1760.2.
- panel 1x lantern loadingLongMax: 140.0 -> 160.0. Change 20.0 (14.3%). Baseline 137.0-143.0. Candidate 160.0-160.0.
- panel 1x clock ready: 1723.3 -> 1576.1. Change -147.2 (-8.5%). Baseline 1622.3-1824.3. Candidate 1576.1-1576.1.
- panel 1x clock loadingLongMax: 136.5 -> 153.0. Change 16.5 (12.1%). Baseline 133.0-140.0. Candidate 153.0-153.0.
- glyph 4x ready: 2740.7 -> 2551.5. Change -189.2 (-6.9%). Baseline 2582.6-2898.8. Candidate 2551.5-2551.5.
- glyph 4x loadingLongMax: 163.5 -> 171.0. Change 7.5 (4.6%). Baseline 158.0-169.0. Candidate 171.0-171.0.
- panel 4x lantern ready: 3529.4 -> 3330.5. Change -198.9 (-5.6%). Baseline 2896.0-4162.7. Candidate 3330.5-3330.5.
- panel 4x lantern loadingLongMax: 822.0 -> 207.0. Change -615.0 (-74.8%). Baseline 169.0-1475.0. Candidate 207.0-207.0.
- panel 4x clock ready: 2682.3 -> 3152.0. Change 469.8 (17.5%). Baseline 2668.0-2696.5. Candidate 3152.0-3152.0.
- panel 4x clock loadingLongMax: 162.5 -> 164.0. Change 1.5 (0.9%). Baseline 154.0-171.0. Candidate 164.0-164.0.

Startup variation remains material. Final4x radio readiness is469.8 ms slower than the baseline median.
Its loading-task maximum changes162.5 ->164.0 ms. This does not assign the readiness difference to exclusive app CPU work.
The refined earlier sequence placed readiness inside baseline variation, but its child CSS was not yet correct.
Normal radio readiness improves, while normal lantern readiness is157.9 ms slower.
There is no consistent zero-cost startup claim. The next measurement for a startup regression claim is a task/network-aligned final-source trace or more matched startup samples.
No further matrix was run.

Panels mounted behind a page-hidden room have zero layout rectangles. That background path receives layout when the room appears.
The real background page-to-room path is tested in extra-checks.json. It is a functional check, not a causal performance comparison.
The room does not await panel preparation. Early selection still works.

## Appearance and behavior

Direct2D and actual3D images cover0.5,1.1,1.3,1.6,2.4,2.78,3.5 seconds.
All masks now have zero border ink. Advance widths and original slots are retained. Font status is loaded before preparation.
The domain line preserves its final pixel origin. Italic overhang, changing colours, glint, and fade were inspected.
Resampling changes edge antialiasing. Images are not pixel-identical.
- 0.5s: mean maximum-channel ink error 0.480/255. 754 pixels differ by more than16 of614400 pixels.
- 1.1s: mean maximum-channel ink error 3.977/255. 4730 pixels differ by more than16 of614400 pixels.
- 1.3s: mean maximum-channel ink error 4.322/255. 4161 pixels differ by more than16 of614400 pixels.
- 1.6s: mean maximum-channel ink error 5.003/255. 3820 pixels differ by more than16 of614400 pixels.
- 2.4s: mean maximum-channel ink error 4.833/255. 3742 pixels differ by more than16 of614400 pixels.
- 2.78s: mean maximum-channel ink error 4.989/255. 3820 pixels differ by more than16 of614400 pixels.
- 3.5s: mean maximum-channel ink error 5.003/255. 3820 pixels differ by more than16 of614400 pixels.

Actual3D images contain procedural dust and time-dependent pose differences. Do not treat full-image differences as text errors.
Representative contacts are appearance/direct-contact.png and appearance/room-contact.png.
The first earlier0.5s screenshot was taken before START's delayed handler began. It was replaced by a capture that waits for booting mode.

Panel entry keyframe values match the original exactly. Steady card dimensions match: lantern395x413, radio395x462.
The original uses a350ms delay animation followed by520ms entry. The candidate uses one animation with350ms delay and520ms duration.
Both regular exits are220ms. Interrupted transitions retain those configured durations.
- lantern: mean card maximum-channel error 1.317/255. 731 pixels exceed16.
- clock: mean card maximum-channel error 2.836/255. 2684 pixels exceed16.

The card differences include animation phase, live radio status, and scene pixels outside rounded corners.
Source colours, labels, and layout rules remain. Screenshots and keyframe data are in panel-appearance/.

behavior-1x.json and behavior-4x.json each pass51 checks.
They test hidden controls, accessibility names, active keyboard input, gesture-based audio, eight rapid reselections, cube/bonsai resize, persistence, and boot-return.
final-rapid.json checks the last fixed-duration and interrupted child-replay refinement at both CPU rates.
extra-checks.json tests reduced motion, diagnostic late-preparation fallback, and a returning visitor's page-to-room path.
The fallback control deliberately skips background preparation. It is not a shipping setting or performance claim.
No physical audible-output or macOS/Android/Safari validation is claimed.

## Rejected prototypes and tooling limits

- Initial low-quality image resampling showed rough edges. High-quality resampling replaced it.
- Initial two-pixel mask padding clipped56 border pixels onS. Scaled hinting padding replaced it.
- Early panel preparation began before room module setup. It showed slower radio readiness. Preparation now begins after asset loading starts.
- Svelte removed the first hidden-animation CSS because the attribute existed only in an action. Static markup now declares it.
  Those prototype performance captures are retained but excluded from final comparisons.
- Partial transition duration scaling was removed. Interrupted entry/exit keeps520/220 ms. Child CSS entries restart if the panel reopens before exit finishes.
- A stale preview manifest caused one empty capture attempt after rebuilding. The server is restarted between builds.
- A wrong svelte-kit CLI path was corrected. It did not change source or configuration.
- The initial sandboxed residual Chrome launch failed before capture. Narrow Auto-review approval allowed the isolated harness. No refusal was bypassed.

There are16 implementation glyph captures and32 implementation panel captures, including rejected prototypes and their restorations.
The final causal comparisons use three4x glyph captures and twelve panel captures. Normal glyph validation uses one representative B/A pair.
Functional and visual checks are separate. No broader device, resolution, or audio matrix was run.
All earlier29 boot and96 interaction captures are preserved and were not repeated.
Diagnostic source copies and scripts lived in owned temporary root directories while measuring.
Tailwind auto-source discovery can see utility tokens there. Matched builds share that condition. Final output is generated after cleanup.

## Source, checks, and handoff

All measurement hooks are removed from source. Four residual diagnostic files were restored byte-for-byte before implementation began.
Intentional shipping edits are limited to boot-screen.ts, engine.ts, and BootIntro.svelte.
Radio source files remain byte-identical to the initial snapshot. Camera042dc805 and the later archive-ignore revision remain in history.
Source Prettier, source ESLint, type check, and git diff --check pass. Final statuses and revisions are in source-status.json.
Node24.21.0 generates production client/server output. Vercel packaging fails Windows function symlink EPERM.
No full build or precompression pass is claimed. No configuration change hides that failure.
The final generated output is checked for measurement hooks. Owned browser/server/profile cleanup is in cleanup.json.
No push or deployment occurs. Root owns independent review and the later authorized Vercel preview delivery. Production/main remains unauthorized.
