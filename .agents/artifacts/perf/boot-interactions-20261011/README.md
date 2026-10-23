# Boot / lantern / radio runtime profile

Measured 2026-10-11 (America/Chicago; UTC capture date 2026-10-12). Revision 1aafb1102b0ceecbd179f21afeb9b270e0c246b9, branch redesign. 17 successful captures (15 full interaction sequences and 2 short cold-START sequences), plus two failed cold-START harness attempts retained as error logs, serially on Windows Chrome 154 headless, ANGLE Radeon RX 590 Vulkan 1.3.260 / AMD proprietary driver (accelerated hardware). Desktop 1280×800 DPR1; phone viewport 412×915 DPR2.625 capped by application to 2 (824×1830 buffer); comparison DPR1 (412×915 buffer). This is not a real phone, Android or macOS capture. Safari deferred by user.

No behavioral fix, commit, push, deploy, dependency or global configuration change. Measurement-only local source instrumentation was reverted byte-for-byte.

## Measured findings

- First focus stutters reproduced, especially at 4× CPU: first desktop radio max frame gap 201–398 ms; first phone radio 179–289 ms. Repeated phone radio falls to 53–96 ms at 4× and 18–33 ms normally. First lantern at 4× has a 160–291 ms gap across baseline desktop/phone runs. These are engine frame-submission start gaps, not screen-present timings.
- First panels become visibly nonzero after 431–538 ms normally and 560–747 ms at 4× across baselines. Source intentionally adds 350 ms delay and 520 ms pop; repeated panels remain 377–395 ms normally. Late appearance is partly designed, with extra first-use work.
- START has a deliberate 160 ms press lead; measured first booting engine callback is 163–195 ms after delivered click in baseline runs. Boot animation frame p95 is about 18 ms normally and 30–32 ms at 4×; return p95 about 18 ms at both rates.
- Main-thread work overlaps first focus: 4× desktop trace has 128 ms first-radio Layout and 82 ms first-lantern Layout; first-radio click handler 60 ms and renderer callback 104 ms. Those wall durations overlap enclosing tasks and cannot be added. Untraced repetitions also stutter. Camera fitting, panel layout, radio synth/context setup and graphics first use are investigated separately below.
- All 32 baseline object selections (16 mouse, 16 emulated touch) reached the intended focus. Stream status reached playing 1.995–2.575 seconds after first radio click, separately from camera/panel response; no blocked/offair status or console errors in successful captures. No unexplained lost selection in the regular clean taps/clicks. These do not test physical touch drift, click edges or all devices. Rapid re-selection control is separate; see data.

## Baseline comparisons

All values ms. Each row reports range across two runs; >34 and long-task total columns show each repeat separately. Focus windows first 1.3 s, START first 8 s, return first 3.2 s. First engine change means first engine callback observing blend >0 / booting / returning; it is not a pixel visibility metric.

| View | CPU | Action | Frame p95 | Max gap | >34 ms gaps | Long-task total | Click→engine change | Click→panel visible |
|---|---:|---|---:|---:|---:|---:|---:|---:|
| desktop | 1× | lantern-1 | 17.7–17.9 | 40.7–47.9 | 1/1 | 0/0 | 44.2–50.1 | 442.1–444.9 |
| desktop | 1× | lantern-2 | 18.0–18.1 | 18.5–18.5 | 0/0 | 0/0 | 28.4–29.7 | 377.9–395.9 |
| desktop | 1× | clock-1 | 21.5–21.7 | 66.0–73.7 | 2/2 | 124/117 | 118.3–125.7 | 495.3–537.8 |
| desktop | 1× | clock-2 | 17.8–17.9 | 18.1–18.3 | 0/0 | 0/0 | 28.9–43.4 | 376.9–378.6 |
| desktop | 1× | START | 17.9–17.9 | 22.2–34.3 | 2/0 | 0/0 | 175.4–177.4 | — |
| desktop | 1× | return | 17.7–18.0 | 20.3–20.4 | 0/0 | 0/0 | 13.4–14.4 | — |
| desktop | 4× | lantern-1 | 28.4–32.2 | 169.5–291.1 | 2/2 | 197/251 | 203.5–257.0 | 603.9–651.3 |
| desktop | 4× | lantern-2 | 28.3–38.5 | 53.1–57.4 | 5/2 | 0/0 | 69.5–84.6 | 445.7–482.7 |
| desktop | 4× | clock-1 | 74.0–89.4 | 201.3–397.6 | 8/3 | 359/302 | 255.3–376.4 | 643.2–746.7 |
| desktop | 4× | clock-2 | 26.6–50.4 | 68.2–125.4 | 5/2 | 175/51 | 100.4–182.8 | 491.2–602.4 |
| desktop | 4× | START | 31.0–32.3 | 50.8–69.0 | 13/15 | 52/116 | 188.9–195.1 | — |
| desktop | 4× | return | 18.2–18.5 | 34.5–35.6 | 1/1 | 0/0 | 22.6–29.5 | — |
| phone | 1× | lantern-1 | 17.5–18.1 | 27.2–43.2 | 0/1 | 0/0 | 29.1–46.1 | 430.7–445.1 |
| phone | 1× | lantern-2 | 18.1–18.1 | 18.3–18.6 | 0/0 | 0/0 | 28.3–30.3 | 380.4–394.4 |
| phone | 1× | clock-1 | 18.1–22.1 | 50.3–56.8 | 1/1 | 0/51 | 58.1–62.7 | 462.0–478.6 |
| phone | 1× | clock-2 | 17.9–18.0 | 18.2–33.1 | 0/0 | 0/0 | 46.2–46.4 | 394.7–395.3 |
| phone | 1× | START | 17.8–18.0 | 34.1–35.7 | 1/1 | 0/0 | 163.1–179.7 | — |
| phone | 1× | return | 17.6–17.7 | 18.2–21.9 | 0/0 | 0/0 | 14.7–15.7 | — |
| phone | 4× | lantern-1 | 20.8–24.8 | 160.0–219.0 | 2/1 | 174/200 | 176.2–237.7 | 560.1–636.8 |
| phone | 4× | lantern-2 | 20.6–26.4 | 55.0–63.7 | 1/1 | 0/0 | 64.1–71.7 | 451.2–465.5 |
| phone | 4× | clock-1 | 39.0–73.9 | 179.3–289.3 | 7/3 | 312/228 | 205.8–324.0 | 604.5–723.4 |
| phone | 4× | clock-2 | 20.2–33.4 | 52.6–95.5 | 2/1 | 117/0 | 67.0–118.4 | 452.7–521.8 |
| phone | 4× | START | 30.5–31.7 | 54.8–58.4 | 11/11 | 106/50 | 187.0–193.3 | — |
| phone | 4× | return | 18.1–18.2 | 33.1–36.2 | 0/1 | 0/0 | 16.5–21.9 | — |

## Targeted controls and attribution

- Panel-sampling control (phone 4×, no per-frame computed-style reads): first lantern max gap 190 ms vs baseline settled run 219 ms; first radio 142 ms vs 179 ms; repeated 37–39 ms vs 53–55 ms. The probe adds overhead, but first-use stutter remains without it. Treat baseline absolute delays as instrumented observations, not exact user latency.
- Controlled phone DPR1 (one quarter of app DPR2 pixel area) did not reliably improve gaps: first radio 194/703 ms vs baseline DPR2 179/289 ms; repeated radio 55/83 vs 53/96 ms; boot p95 about 31–33 ms at both DPRs. The 703 ms outlier overlaps 750 ms of long tasks. No measured basis here for a blanket resolution cut; no real-phone GPU conclusion.
- Diagnostic CPU samples put getBoundingClientRect at about 210/218 ms in first-focus 1.3 s windows; trace independently records long Layout events. Read is reached from panel-report callback, separately from instrumentation sample(). Bounds/framing work is a contributor, not the sole cause. Profiler sample totals include idle/program/native waits and throttled time, so they are not exact exclusive CPU budgets.
- First mouse hover links 5 additional GL programs in both diagnostic orders. getProgramInfoLog accounts for about 29–35 ms sampled first-use time; wrapped other GL reflection/upload calls in first focus total only ~4 ms above the 0.2 ms recording threshold. Lazy outline compilation/reflection is verified, but does not explain all of the 200–400 ms first-focus gap.
- Boot uploads: 259 texSubImage2D calls above 0.2 ms threshold per diagnostic START, totaling 682/693 ms across the full boot action, max individual 23/30 ms. Return uploads only 26/29 ms total. This makes repeated canvas-texture upload a stronger candidate than text-metric caching alone; do not interpret JS API wall time as GPU execution time.
- Cold START before object/radio interaction: normal phone p95 17.9 ms / max 48.2 ms; 4× p95 24.7 ms / max 75.7 ms, callback begins 177/199 ms after click. With radio already playing baseline 4× phone boot p95 30.5–31.7 ms. This difference suggests overlap worth isolating, but order and instrumentation prevent a clean causal radio estimate. Cold return p95 18 ms. Two earlier cold control attempts invoked the engine return hook without the UI phase update and then could not find a panel; these were harness failures, not application missed clicks. Corrected short captures use the actual return UI and succeed.
- Rapid BACK → same radio after 100 ms: all 4 selections reached focus, but blend continued falling for 3–4 sampled frames on re-selection before rising again (e.g. second selection falls from ~0.99 to 0.946). Source starts focus/unfocus tweens on the same blend without cancelling the previous one. Smallest proposed patch: killTweensOf(focusBlend) immediately before each new focus/unfocus tween (or explicit tested overwrite), preserving durations/eases. This is a reproducible synthetic overlap issue, not proof of the uncertain lost clicks. No patch applied.

## Source and proposed smallest fixes

1. **Panel creation / stable framing, high confidence as a contributor.** BootIntro.svelte:89–107 reads transformed panel bounds then calls setFree; engine.ts:1116 viewOf traverses meshes and projects samples in six fitting rounds, again on setFree at 1230. Avoid duplicate fitting when free-space fraction is unchanged; measure stable layout dimensions independent of entry scale, and reuse transformed static sample sets (the existing spread() geometry cache is already present). Preserve layout and pop style. Do not simply remove animation. Trace establishes layout cost; profiler/control files refine attribution.
2. **Cold local radio activation, high confidence, bounded scope.** BootIntro.svelte:209–224 starts player inside focus callback; player.svelte.ts:140–150 creates AudioContext and createRadio synchronously; radio.ts:148 builds two seconds of random noise. First focus callback normal 11–33 ms vs repeat roughly 1 ms; at 4× roughly 47–61 ms vs repeat 3–13 ms in baseline. Propose preparing immutable noise data separately before first tap, while keeping context resume inside user gesture and not changing audio policy. Do not apply old delayed-prefetch experiment.
3. **Runtime render CPU / boot texture, high confidence as a contributor.** engine.ts:1348–1359 redraws boot canvas and marks texture for upload every frame; boot-screen.ts:49–108 remeasures static text slots each time. First validate avoiding redundant canvas texture uploads or a controlled texture refresh cadence while retaining full-rate camera motion; then cache font/letter metrics after fonts are ready. Repeated boot costs materially more CPU than return at 4×.
4. **Hover-only graphics path, verified first-use work; medium confidence on impact.** engine.ts:530–600 creates mask/outline programs; :1362–1407 renders them only during hover. Startup compile/warm path :800–885 prepares normal scene/extras, not outline scene and override variants. Diagnostic GL logs record first-use compile/reflection calls. Diagnostic captures link five new programs and sample first-use reflection. Warm those variants in short existing startup batches. No broad preload change.

## Environment, methods, limits and reproduction

- Product-native preview_status then preview_open both returned explicit unavailable (no attached desktop host); authorized shell fallback. Never inspected private tabs. Reused prior cdp.mjs after removing mute-audio and autoplay bypass; real click/touch dispatch, normal browser policy and fresh storage/profile every run. Radio uses actual external YouTube iframe and local /api/stations endpoint, so CDN/cache behavior differs from deployed preview. No bandwidth throttle. Network request logs and panel statuses retained; station playback startup can vary independently of camera.
- Normal and actual 4× CPU emulation; CPU emulation does not emulate a slow GPU. Controlled DPR comparison and accelerated renderer identification are provided; no direct GPU timer measurements were made. [CDP Emulation](https://chromedevtools.github.io/devtools-protocol/tot/Emulation/) and [Tracing](https://chromedevtools.github.io/devtools-protocol/tot/Tracing/) official protocol references.
- Engine records only frames passing idle gate, including all outline passes, with callback start and CPU submission wall time. A separate rAF loop records callbacks; idle 30 Hz is intentional and full-rate transitions are measured separately. Display-presented frame drops are not directly measured. >20 ms, >34 ms and >50 ms counts are in summary.json; >34 ms avoids mistaking 16.7 ms timing noise for a missed interval.
- The panel visibility probe reads computed opacity/transform each rAF; that can trigger style calculation. Control omits those reads; diagnostic GL wrappers / CPU sampling / traces also have overhead. Traced and untraced results are retained, not pooled as identical conditions. Two repetitions per main scenario are evidence of reproducibility, not population statistics.
- Immediate first use versus settled room is confounded with order: repeat 1 starts as soon as START exists, radio first; repeat 2 waits 2.5 s, lantern first. First-vs-repeated comparisons within each run are stronger than claiming a precise settling effect. Cold START controls boot before any object focus. Rapid re-selection returns after only 100 ms, separately from standard 1.5 s settled returns.
- npm.cmd run build generated production client/server successfully, but Vercel packaging failed because installed Node 26.8.2 is unsupported (project expects 24.x). Vite production preview served generated output on task-owned port 4291 and has been stopped; no deployment artifact is claimed. User dev server left alone.
- Scripts: prepare.mjs injects measurement-only hooks, cdp.mjs launches isolated browser, run.mjs collects, analyze.mjs summarizes, report.mjs builds this report. Build after prepare then immediately restore engine-original.txt before captures; the saved run.mjs uses adjacent ./cdp.mjs; execute all scripts from repository root. Run with --lowdpr / --diagnostic / --bootfirst / --control / --rapid for specific controls. Capture JSON, compressed trace JSON and cpuprofile files open in Chrome Performance.
- Retained evidence currently 30.5 MiB, comfortably below 250 MB. No historical findings are represented as this capture's evidence.

## Completion checks

Own preview port 4291 no longer listens. All browser launches were closed through harness-owned process handles. Clean original source was rebuilt afterward (production client/server generated; same Node 26 Vercel packaging limitation), so generated client no longer contains profiling hooks. Tracked git diff is empty. Temporary browser profiles are removed separately after absolute-path checks. No Safari work resumed.

CPU-profile source positions refer to the instrumented build; cpu-summary.json retains names, positions and representative source snippets. The instrumented bundle was replaced by the clean rebuild, so use those retained snippets or reproduce prepare/build to inspect full source.
