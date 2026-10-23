# First boot and full replay diagnosis

Previous candidate d82230a remains REJECTED by the user. No production implementation is proposed.

The affected-device symptom is not reproduced here. Windows shows a smaller first-use penalty at 4x CPU. Replay retains drop-phase raster cost. Normal CPU shows no p95 penalty. This distinction prevents a steady text-cost result from explaining the reported first-only stall.

## Scope and sequence

Eleven browser sessions. Each contains actual START, completed site, actual BACK TO THE ROOM, completed return, and actual START again. Each second START replays the full GBA boot. There is no navigation or engine replacement inside a pair. All 22 full boots and 11 returns complete without captured runtime errors. Click events are trusted and retain ordinary user activation. Audio policy remains unchanged.

The original is a796e9aea60def6e0849cb75a151fd6570942339. Camera fix 042dc805 is an ancestor. The rejected candidate is d82230acab7f4e2be780afd0847330a6926573d1. Original committed sources are staged independently. Main source is never overlaid. The three original 4x pairs also supply the original startup samples. Startup order is O/C, C/O, O/C. One normal-CPU orientation and one separate targeted trace precede the final three control sessions.

Chrome 154 headless on Windows, RX590 hardware ANGLE Vulkan 1.3.260. Viewport 412×915, DPR 2.625, application cap 2, drawing buffer 824×1830. This is a phone-shaped viewport, not an Android GPU. CPU throttle does not validate macOS or Android.

Each session uses a fresh isolated profile and renderer. HTTP cache is disabled in every session. No storage seed or bandwidth throttle is used. OS font, file, compiler, and driver caches remain persistent and uncontrolled. Fresh profile does not mean cold GPU or font caches.

## Original paired text data

Gaps measure engine submission callback starts. They do not measure physical display timing. All values below are milliseconds. Each text window selects booting mode and exact s.boot 0.35–3.5. The predecessor submission is included in its gap.

| Session | First p95 | Replay p95 | First maximum | Replay maximum |
|---|---:|---:|---:|---:|
| pair1-original | 20.3 | 18.8 | 22.4 | 24.5 |
| pair2-original | 20.9 | 19.3 | 23.6 | 22.5 |
| pair3-original | 21.0 | 19.2 | 30.2 | 22.5 |

First minus replay p95 is 1.5 / 1.6 / 1.8 ms. Median first/replay is 20.9 / 19.2 ms. First p95 range is 20.3–21.0. Replay range is 18.8–19.3. No initial-pair text gap exceeds 34 ms. Maximum deltas change sign: -2.1 / +1.1 / +7.7 ms. This is a consistent modest p95 penalty, not the reported first-stutters/replay-smooth contrast.

Normal orientation: p95 17.8 / 17.9, maximum 28.6 / 18.4. Its isolated first maximum occurs at s.boot 2.449. The engine callback there takes only 1.5 ms. Its cause is unassigned.

| Phase | Median p95 first / replay | Median maximum first / replay |
|---|---:|---:|
| activation | 18.1 / 17.7 | 25.3 / 17.8 |
| arrival | 19.2 / 17.7 | 20.8 / 18.7 |
| drop | 23.0 / 21.6 | 23.6 / 22.5 |
| colour-glint | 18.0 / 18.0 | 18.3 / 18.3 |
| fade | 17.8 / 17.8 | 18.6 / 18.2 |

Activation starts at the recorded power(true) material switch and ends before s.boot 0.35. Arrival is 0.35–1.1. Drop is 1.1–1.9. Colour/glint is 1.9–3.5. Fade is 3.5–4.0. GSAP sets boot to zero before power activation. Therefore, zero-valued pre-activation frames are excluded from the activation phase.

The first screen upload occurs after power(true), at s.boot 0 / 0 / 0.012 in the three originals. Fonts are ready before room readiness. The first domain fillText occurs during the later boot. Font readiness does not establish glyph/raster-cache readiness. The word font stack starts with Arial Black. The domain stack starts with Arial Rounded MT Bold. Local fallbacks differ across platforms. The actual resolved glyph font is unmeasured.

## Separate targeted trace

The original targeted session is diagnostic only. It is excluded from all light-pair statistics. A capture-sync user-timing event aligns trace timestamps to page performance.now. Activation markers and the first domain-text marker remain in the raw data. The first-text wrapper restores itself after that call. It also removes the later targeted glyph-marker wrapper. Per-glyph first-use markers and a replay text-use marker were therefore not collected. Per-frame paint timing and full graphics tracing remain intact. The affected-device capture must correct this marker limitation.

No linkProgram occurs in either activation or text window. No shader/program status or reflection call exceeds the 1 ms recording threshold there. This does not prove zero material setup cost. Startup compiles a cloned lit material. Warm draws still use the actual unlit screen. The actual switch and first upload occur during the first boot.

Renderer-thread RasterImplementation::RasterCHROMIUM totals 548.175 ms first and 499.956 ms replay in the text interval. Maximum spans are 16.000 / 13.986 ms. Both remain concentrated around the drop. GPU-process DoEndRasterCHROMIUM::Flush totals 85.611 / 44.162 ms, with maxima 23.537 / 9.933 ms. These spans can overlap across threads. They cannot be added or called GPU execution time.

The longest text upload API wall call is 16.3 ms first and 14.3 ms replay. It aligns with raster work at the upload boundary. API wall time includes browser raster/flush and waits. It is not a byte-transfer or GPU execution budget. First activation also contains an extra GPU-process flush maximum of 9.812 ms versus 1.488 ms on replay. These observations support a first-use path question. They do not isolate glyph cache, canvas backing, material setup, driver work, or scheduling.

## One first-use control and restoration

The only control calls renderer.initTexture(screenTexture) before room readiness. It does not paint text or activate the lit material. Appearance, animation, fonts, resolution, and cadence source remain unchanged. Prediction: if first texture setup alone causes the activation penalty, moving that setup should reduce it.

| Session | Activation maximum first / replay | Text p95 first / replay | Text maximum first / replay | Room ready |
|---|---:|---:|---:|---:|
| control-baseline | 25.1 / 18.1 | 22.0 / 18.6 | 27.4 / 21.1 | 2402.4 |
| control-texture-init | 44.8 / 18.0 | 20.3 / 18.9 | 38.8 / 23.0 | 3488.8 |
| control-restoration | 28.5 / 18.2 | 21.8 / 19.4 | 24.6 / 20.9 | 3125.8 |

The control moves the recorded first upload to startup, s.boot -1, run 0. Its initialization span takes 13.6 ms. Activation worsens to 44.8 ms. The first activation paint takes 24.3 ms. Text p95 retains a 1.4 ms first/replay difference. Restoration returns the original path and its first penalty. This control does not support texture initialization alone as a remedy. One control sample cannot identify the new long paint cause. No second canvas-setting control is justified in this round.

## Startup comparison

Room-ready time starts at navigation time origin. Loading maximum includes long tasks that start before room readiness. START DOM availability is recorded separately. Actual accepted START occurs after 2.5 seconds of settling. The 450 ms delay and 520 ms entry remain. Earliest visually usable START and transition completion are not independently timestamped. DOM availability must not be called visual readiness.

| Pair | Order | Original ready | Candidate ready | Candidate − original | Loading maximum O / C | START DOM O / C |
|---|---|---:|---:|---:|---:|---:|
| 1 | original → candidate | 2452.8 | 4054.1 | 1601.3 | 191.0 / 1138.0 | 2462.4 / 4060.6 |
| 2 | candidate → original | 3533.7 | 2544.0 | -989.7 | 997.0 / 156.0 | 3542.6 / 2550.6 |
| 3 | original → candidate | 2253.3 | 2552.7 | 299.4 | 156.0 / 172.0 | 2260.2 / 2559.4 |

Paired ready deltas: +1601.3 / -989.7 / +299.4 ms. Median paired delta is +299.4 ms. Range is -989.7 to +1601.3 ms. Original median is 2452.8 ms, range 2253.3–3533.7. Candidate median is 2552.7 ms, range 2544.0–4054.1. The difference between marginal medians is +99.9 ms. It differs from the paired median.

This does not establish a repeated half-second code-caused regression. It also does not bound startup regression below an acceptable margin. No nonzero deliberate startup delay is accepted here. A reliably reproduced half-second increase fails the user requirement. The candidate remains rejected. Prior 469.75 ms remains a separate observation, not a pooled baseline or a proven code effect.

Candidate glyph spans are 92.0 / 45.4 / 44.1 ms. Lantern spans are 114.9 / 98.7 / 104.5 ms. Radio spans are 37.4 / 34.4 / 37.0 ms. Panel spans include tick/layout scheduling. Glyph spans include yields. They are not exclusive CPU budgets and cannot explain the full startup delta by addition.

Variation exists before model parsing finishes in both conditions. Pair 1 candidate createRoom-to-model-parsed is 1516.2 ms versus original 400.5 ms. Pair 2 original is 1197.0 ms versus candidate 512.8 ms. Those sessions have loading maxima 1138 and 997 ms. Model fetch durations remain only 6.0–7.1 ms across matched sessions. Asset response times, stage endpoints, task records, and navigation records are retained. They locate variation outside preparation-only spans. They do not assign it exclusively to app code or host scheduling.

All matched sessions have 52 recorded responses. Each tries the absent .glb.br file, receives 404, and uses the identical uncompressed GLB fallback. Runtime assets then succeed. This follows unchanged application logic. Full packaging/precompression fails the known Windows Vercel symlink EPERM. Client/server compilation succeeds. No packaging escalation or deployment occurs.

Candidate text screening remains separate from startup:

| Candidate session | Text p95 first / replay | Text maximum first / replay |
|---|---:|---:|
| pair1-candidate | 18.0 / 18.1 | 20.0 / 18.5 |
| pair2-candidate | 17.7 / 17.7 | 25.3 / 20.8 |
| pair3-candidate | 17.9 / 17.9 | 18.4 / 18.3 |

These local text gains do not rehabilitate the candidate. This round does not retest panel selection tails or appearance acceptance. Earlier panel p95 regressions, startup uncertainty, changed text edges, and the user rejection remain. A smaller first maximum cannot compensate for those failures.

## Conclusion and next minimum experiment

Windows reproduces a modest first-use penalty and a separate screen-activation penalty. It does not reproduce the affected-device first-only stutter. Sustained drop-phase raster cost survives full replay. Texture initialization alone fails its prediction. No relevant device cause is established. No production implementation begins.

Obtain the affected device model, OS version, Chrome version, and display refresh rate. Capture one original-reference session with synchronized recording and trace: first START, full site, actual BACK, completed return, second full START. Keep the same renderer and ordinary audio policy. Align the exact boot phases and first material activation. Include task, canvas/raster/flush, program initialization, texture upload, and presentation timestamps where available. No account access is needed.

If that trace identifies first-only raster/flush work, test one narrowly chosen canvas path. Compare default against willReadFrequently:true. Test alpha:false separately later. Preserve the fully painted screen and verify pixels, timing, startup, and replay. Neither setting is a presumed solution. If startup attribution remains necessary, use one preparation-only omission after controlling the pre-model long-task variation. Do not repeat a broad matrix.

Evidence: raw session JSON, summary.json, trace-detail.json, original-targeted-trace.json.gz, build/server logs, committed source snapshots, and saved scripts. Main source bytes and history remain preserved. Cleanup and source hashes are in source-status.json and cleanup.json.
