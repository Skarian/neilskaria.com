import fs from 'node:fs';
const d='.agents/artifacts/perf/interaction-attribution',b='.agents/artifacts/perf/boot-text-diagnosis';
const r=JSON.parse(fs.readFileSync(d+'/cause-breakdown.json'));
const num=x=>x==null?'—':x.toFixed(1);
const change=m=>`${num(m.baseline.median)} → ${num(m.control.median)}; Δ ${num(m.delta)}ms (${m.percent==null?'n/a':num(m.percent)+'%'})`;
const range=v=>`${num(v.min)}–${num(v.max)}`;
const tables=r.comparisons.map(c=>`### ${c.label}\n\nBaselines: ${c.baseFiles.join(', ')}. Controls: ${c.controlFiles.join(', ')}. Median across runs (even samples averaged); per-frame p95 is nearest rank.\n\n| Metric | Baseline range | Control range | Median change |\n| --- | ---: | ---: | --- |\n${Object.entries(c.metrics).map(([k,v])=>`| ${k} | ${range(v.baseline)} | ${range(v.control)} | ${k==='over34'?`${num(v.baseline.median)} → ${num(v.control.median)}; Δ ${num(v.delta)} (${v.percent==null?'n/a':num(v.percent)+'%'})`:change(v)} |`).join('\n')}`).join('\n\n');
fs.writeFileSync(d+'/comparisons.md',tables);
if(fs.existsSync(b+'/README.md')&&!fs.existsSync(b+'/README-initial-six.md'))fs.copyFileSync(b+'/README.md',b+'/README-initial-six.md');
fs.writeFileSync(b+'/README.md',`# Boot text attribution — final findings

Execution thread, confirmed by live T3 thread list: ${r.executionThread}.
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

Source: engine.ts:${r.sources.find(x=>x.needle.includes('s.boot >=')).line}, boot-screen.ts:${r.sources.find(x=>x.needle==='function drawWordmark').line}. Raw JSON, trace JSON.gz, scripts, summary.json (initial six), extended-summary.json and trace-summary.json are preserved. Full absolute/percentage contrasts and variation are in ../interaction-attribution/comparisons.md and cause-breakdown.json.

## Limits and cleanup

The causal claim is animated-text raster/flush work on this host, not exclusive GPU glyph execution, pure upload bandwidth, or universal macOS/Android behavior. Native raster execution, serialization and queue waits remain grouped in the browser trace span. Exact missing measurements for device-visible claims: display-present timestamps, physical-device GPU/backend timing, and finer native raster/transfer breakdown without introducing synchronous readback. Next targeted experiment, if needed, is per-glyph/scale raster workload or native graphics-service breakdown with the same camera/clears/uploads; no optimization is shipped.
All diagnostic edits are restored, clean client/server output regenerated and checked for hook markers. Full Node24 build still fails Vercel packaging on Windows symlink EPERM; no full build/precompression pass is claimed. Owned server/browser/profile cleanup and checks: ../interaction-attribution/cleanup.json. No push/deploy, dependencies/global settings, text/font/cadence/appearance optimization, Safari or missed-click investigation.
`);
fs.writeFileSync(d+'/README.md',`# First selection attribution — final findings

Execution thread: ${r.executionThread}. Source baseline 1aafb11; focused camera commit 042dc805f9135f3b4efbcd0d2a9e90eafcdd80c0 remains separate from every diagnostic. Current HEAD a796e9a adds only an unrelated archive ignore entry; preserved. Branch redesign.

## Main cause and verification

First panel mounting/style/layout produces the largest initial selection stall. Alternating light captures at 4x CPU (A/P/A/P/A, fresh profile each run) reproduce and restore it:
- Lantern max-gap median 295.5 → 133.1ms (−162.4ms, −55.0%); click→first nonzero-blend callback 284.7 → 94.1ms (−190.6ms, −66.9%). Baseline max 276.5–328.6ms, control118.6–147.5. p95 21.8 → 24.4ms (+12.2%), >34ms counts2→2. Largest initial stall improves; whole-window p95 need not.
- Radio max-gap median284.2 →178.7ms (−105.5ms, −37.1%); camera delay283.1 →161.0ms (−122.2ms, −43.1%). Baseline max281.9–405.6ms, control178.7. p95 22.7→41.4ms (+82.2%), >34 count median3→4. Later radio/scene/browser work persists; panel mounting is not the sole cause.
- Normal CPU: lantern max36.6→18.0ms (−50.8%), radio36.4→20.2ms (−44.6%). Normal camera-delay proxy does not uniformly improve: lantern39.5→42.6ms, radio42.8→27.4ms. This proxy depends on rAF/GSAP order, slow easing and numeric rounding; it is not pixel-visible latency.
- Diagnostic radio trace: main-thread Layout115.008→15.552ms (−86.5%), max individual Layout104.753→5.877ms. UpdateLayoutTree99.006→69.155ms; report these separately, not summed into a CPU budget.

P defers only panel mounting until1400ms, outside the delivered-click1300ms window, preserving UI focus, START's normal exit, radio activation and camera tween source. It replays recorded free-space fractions; work removal can retime when callbacks/retuning happen. Panel appearance is deliberately changed in this diagnostic and restored afterward.

## Secondary causal controls

- Framing: viewOf traverses geometry and runs six fitting rounds, once on focus and twice from the panel report/initial ResizeObserver. With panel mounting held out, replayed camera-view caches remove all three fits. Lantern camera-delay median154.1→87.4ms (−66.7ms, −43.3%), radio234.3→157.8ms (−76.5ms, −32.7%); delays return when fitting is restored. Fitting stage drops about49.2→0.4ms lantern and67.7→0.7ms radio. Full-pipeline F-only results are obscured by panel variation and are not claimed as a reliable whole-stall fix. PF replays recorded eye/target vectors to keep matched waypoints; original full F precomputes before hover and may have small hover-position differences.
- Radio local preparation: noise filling and context creation are synchronous inside the click. Noise is nested inside synth creation, and both inside focus; do not add them. N/PNF moves the same two-second random data before input, leaving context/resume and the graph in the gesture. Context creation ranges from a few ms to a28.7ms observed outlier; R/PFR creates a suspended context beforehand and returns it to the real click, where native resume remains. Recorded preparedContextUsed has user activation; no mute/autoplay bypass or pre-click sound. Stage removal is reproducible; whole-window tail gains are smaller and variable. Exact values, negative results and percentages are all in comparisons.md.
- Outline: fresh mouse movement precedes the delivered click and links five extra WebGL programs. Shader reflection/initialization takes roughly24–36ms at4x in sampled pre-click calls, within a larger first-outline render. O omits only outline passes; picking, hover physics and focus remain. It eliminates those program calls and reduces pre-click dispatch lead, but does not consistently remove post-click panel stalls. This is first-hover/input-lead work, not evidence of missed clicks.
- Cached bounds L: bounds API time falls to nearzero, but the full gap remains because style/layout work is paid elsewhere. Avoid treating getBoundingClientRect's wall time as a removable exclusive cost.
- Empty native panel-animation keyframes I (same delay/duration, full DOM mounting, cached bounds/framing) do not reproducibly remove stalls. Thus merely dropping the pop's transform/opacity animation is not supported as the main remedy. I deliberately changes visible panel appearance; no such change ships.

## Windows, origins and confidence

96 valid targeted interaction captures. Desktop1280x800 DPR1, Windows headless Chrome154, hardware ANGLE RX590 Vulkan1.3.260. Two controls per chosen perturbation, alternating with restored behavior; initial wider baselines document variation. Fresh profiles/storage, same camera source, resolution, radio state/ordinary policy and network setup. All regular center selections reach the intended engine focus; no runtime/console errors. Source inspection chose controls sequentially: cached bounds failed, mount isolation succeeded, then fitting/noise/context were isolated against that reduced condition. No factorial campaign or behavior optimization.
Primary windows are delivered canvas click to+1300ms. Gaps include the predecessor frame; first intervals can straddle intentional30Hz idle. first nonzero blend is an engine callback proxy, not displayed camera pixels. Pre-click mouse/outline work is separately timed from script dispatch origin; CDP command lead is included there. Real mouse dispatch is used throughout. No per-frame layout/style probes beyond original app work.
Light primary captures remove GL/measure leaf timers and GPU queries/disjoint polling. Stage timing/GPU/trace diagnostics are separate, not pooled. GPU query elapsed brackets are valid at completed-query reads but are not GPU utilization/presentation. Shared-host load and persistent driver/OS caches cause real baseline variation; percentages are descriptive medians, not population estimates.

High confidence: panel-mount/style/layout initial stall, fitting's isolated delay, animated boot text raster work (related boot report). High confidence in local preparation and outline stage costs; medium/lower confidence in their whole-window tail shares. Residual radio tails include scene/render/browser scheduling and async media work; current controls do not allocate an exclusive budget among them. Next bounded follow-up would trace the residual prepared-radio condition with media/style/scene timing held constant. Physical display-present/device measurements are required for macOS/Android claims; CPU throttle does not emulate their GPU. Safari and missed clicks remain deferred.

Source locations: ${r.sources.filter(x=>!x.needle.includes('s.boot')&&!x.needle.includes('drawWordmark')).map(x=>x.file+':'+x.line).join(', ')}.
Evidence: raw capture JSON, capture logs, two compressed selection traces, summary.json, cause-breakdown.json, comparisons.md, trace-summary.json, capture/analysis scripts. Related report: ../boot-text-diagnosis/README.md. Original evidence unchanged; interim boot interpretation preserved separately.

## Source and checks

Camera commit adds only gsap.killTweensOf(focusBlend) before each replacement tween in focus/unfocus, preserving current value,1.1s/1.0s durations and power3.inOut. Camera README ../camera-conflict-fix/README.md verifies8 rapid radio/lantern reselections with zero falling samples, normal focus/BACK, and BACK during forward focus; reverse blend corrected in tested UI.

All four diagnostic source files restored byte-for-byte; final client/server output contains no hooks. Type check, source Prettier/ESLint and git diff --check pass. Earlier repository-wide formatting passes; repository ESLint fails multiple tsconfig-root discovery from existing worktrees (563 errors in retained initial lint log). No config fix.
Node24.21.0 generates clean production client/server but Vercel packaging fails Windows function symlink EPERM despite approved escalation. Full build/precompression did not pass. No push/deploy, dependency or global setting change. Owned preview4292/browser/profile cleanup is in cleanup.json. Coordination append is intentionally uncommitted.
`);
console.log('Written reports; comparison rows',r.comparisons.length,'capture counts',r.counts);
