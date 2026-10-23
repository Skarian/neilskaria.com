# Clean canvas: automated native trace findings

Keep the one-option hint as a review candidate. These Windows traces do not support a universal performance claim. The original is already smooth here. The hint increases main-thread CPU cost at the texture-upload boundary. Do not add caches or prepared panels from this evidence.

## Source and execution

Original: `a796e9aea60def6e0849cb75a151fd6570942339`. Hint: `bcc409e43708ee7b543b53ca8f3700a8ef82ff14`. The hint has the original as its sole parent. Each exact-source stage contains 91 Git blobs from the reviewed allowlist. The only change is the screen context option `willReadFrequently: true`. Source bytes match Git before and after builds and profiling. Main tracked files, index, HEAD, and proposal ref match the initial state. See `verification.json`, the two manifests, and `exact-option.diff`.

Both builds use Node 24.21.0 and the existing root dependencies. The artifact-only Vite config replaces the Vercel adapter with a local no-op adapter. The copied app config and all shipped source remain exact. Production compilation uses the clean `/lab/boot` route. The local preview is uncompressed Vite delivery, not a Vercel deployment. No diagnostics, atlas, glyph cache, prepared panel, app recorder, screenshot capture, or video capture runs during measurement.

Chrome 154.0.8037.57 runs in an owned headless profile. WebGL reports Radeon RX 590, AMD proprietary driver, ANGLE Vulkan 1.3.260. SystemInfo records driver 31.0.21925.1001. CSS viewport is 1280�800. DPR is 1. The WebGL buffer is 1280�800. All valid runs use this same backend and shape. The tab reports visible. Headless visibility does not imply a physical display. This is not an Adreno 740, Android, Mac, or Safari test.

The T3 status and open checks report no automation host. The task uses isolated Chrome/CDP instead. The live `/json/protocol` is saved per run. `Tracing.getCategories` returns an empty list. Tracing still supplies the requested timeline, CPU, loading, renderer, raster, GPU-service, compositor, and presentation-feedback events. Per-run trace summaries list the observed names and threads.

The automation hook seeds only the owned profile with `boot-seen=1` and `room-place=room`. It records trusted click timestamps, DOM phase changes, one rAF timestamp per callback, and one selected N-glyph timestamp per screen draw. The fillText wrapper checks all calls but records only the selected glyph. It does not read pixels or change draw arguments. The hook also writes User Timing marks. There is no page overlay or source edit. Hook, trace, and polling overhead are not calibrated away. Both variants use the same hook. These costs are not production predictions.

## Run validity

Eight measured sessions contain a first START and an actual BACK/START replay. Each session has a fresh browser and renderer. Native order is original?hint, then hint?original. The CPU pair warms resources, closes Chrome, and starts a new Chrome process with the same owned disk profile. It requests 4� CPU slowdown. That is CPU stress, not mobile emulation. The network pair requests native CPU, 80 ms latency, 1,500,000 bytes/s download, and 750,000 bytes/s upload. CDP accepts the throttle commands. Native runs use latency 0 and unlimited throughput. Browser disk cache is enabled. Cold runs use new profiles. OS file cache, driver cache, network services, and thermal state are not controlled.

| Run | Mode | Status | Reason |
| --- | --- | --- | --- |
| cpu-hint | setup | excluded | Error: trace completion missing |
| cpu-original | setup | excluded | Error: trace completion missing |
| native1-original | setup | excluded | Error: wait timeout !!document.querySelector("[data-start]") |
| native1-original-corrected | setup | excluded | Error: error when starting preview server: |
| native1-original-valid | setup | excluded | Error: wait timeout !!document.querySelector("[data-start]") |
| network-hint | network | valid | both START sequences complete |
| network-original | setup | excluded | Error: trace completion missing |
| pair1-hint | native | valid | both START sequences complete |
| pair1-original | native | valid | both START sequences complete |
| pair2-hint | native | valid | both START sequences complete |
| pair2-original | native | valid | both START sequences complete |

The first setup run used the home route, which has no room. A corrected launch overlapped its server and failed on the occupied port. The next setup attempt used the correct route but the default D3D11 path failed to load the room. The default launch log records a GPU-process exit. These attempts have no successful START and do not count as measured sessions. The harness then uses Vulkan for every measured run.

Both CPU recordings and the network baseline exceeded the original 10-second trace-completion wait. Their failure traces and logs remain separate. They never enter comparisons or aggregates. The corrected script now allows 45 seconds for trace completion. It was not used to add sessions. The eight-session cap prevents a replacement matrix. Therefore, there is no valid matched CPU result and no valid matched network result. The network hint is descriptive evidence only.

## Startup

All values are milliseconds. START DOM means that the control exists. Intro complete comes from native Web Animation end events for the initial delay and pop transition. It excludes the later exit animation from the trusted click. These are browser events, not proof that the physical display showed the final button. The first START click occurs only after the intro. The full GBA transition then reaches the actual site.

| Run | Document responseEnd | START DOM | START intro complete | Renderer CPU to DOM | Longest main task | Link service spans |
| --- | --- | --- | --- | --- | --- | --- |
| network-hint | 209.6 | 2855.4 | 3883.0 | 573.6 | 123.8 | 34.6 |
| pair1-hint | 47.2 | 1375.4 | 2391.9 | 514.6 | 149.8 | 35.5 |
| pair1-original | 40.4 | 1277.6 | 2283.8 | 495.1 | 153.5 | 34.8 |
| pair2-hint | 47.8 | 1383.4 | 2411.6 | 504.8 | 134.1 | 34.6 |
| pair2-original | 341.3 | 1766.9 | 2784.8 | 556.1 | 188.0 | 44.9 |

Native pair 1: hint minus original is +97.8 ms to START DOM and +108.1 ms to intro completion. Native pair 2: hint minus original is -383.5 ms to DOM and -373.2 ms to intro completion. The second original has a much later document response: 341.3 ms versus 47.8 ms. The result does not show a consistent +100 ms penalty. It also does not establish startup neutrality or isolate context cost. Only two native pairs exist.

Each valid startup contains 20 native program-link service spans. These spans measure CPU/service execution around linking. They do not measure all shader compilation or native GPU completion. `nativeDetail` also separates HTML parsing, script evaluation, compiler events, raster commands, main-task wall duration, and trace thread-CPU duration. `startup.resource` retains each resource interval and transfer size. Resource intervals overlap each other and CPU work. Do not add them to nested native event totals. Exact createRoom/model/assets/font subphase timers are absent in clean shipped code. No wall-time remainder is assigned exclusively to the GPU.

## GBA text cadence and native cost

The text window starts with the first drawn N. It ends 3150 ms later, approximating boot time 0.35 through 3.50 seconds from the clean source. This is an externally defined window, not a direct read of GSAP state. Both complete boots are verified by distinct trusted START marks, N draws, native events, and actual site transitions. Native mark residuals are in `clockAlignment`.

All gaps use milliseconds. Quantiles use nearest rank. Counts =25 ms identify missed 60 Hz scheduling intervals. Counts =42 ms identify larger stalls. Counts =100 ms identify severe stalls. These are this task�s thresholds, not Web Vitals scores. rAF and glyph-draw gaps measure scheduling and drawing. They are not display FPS. Native callbacks are grouped within 5 ms to avoid counting several callbacks in one frame as separate frames.

| Run / boot | rAF n | mean | p50 | p95 | max | =25 / =42 / =100 | Native CPU | Main wall | Raster submissions |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| network-hint / first | 188 | 16.7 | 16.7 | 16.7 | 16.8 | 0 / 0 / 0 | 1061.1 | 1147.3 | 6 |
| network-hint / replay | 188 | 16.7 | 16.7 | 16.7 | 16.8 | 0 / 0 / 0 | 994.4 | 1056.9 | 6 |
| pair1-hint / first | 188 | 16.7 | 16.7 | 16.7 | 16.8 | 0 / 0 / 0 | 1270.2 | 1341.3 | 6 |
| pair1-hint / replay | 188 | 16.7 | 16.7 | 16.7 | 16.8 | 0 / 0 / 0 | 943.8 | 1003.7 | 6 |
| pair1-original / first | 188 | 16.7 | 16.7 | 16.7 | 16.8 | 0 / 0 / 0 | 507.8 | 550.2 | 196 |
| pair1-original / replay | 188 | 16.7 | 16.7 | 16.7 | 16.8 | 0 / 0 / 0 | 472.5 | 509.0 | 197 |
| pair2-hint / first | 188 | 16.7 | 16.7 | 16.7 | 16.8 | 0 / 0 / 0 | 1069.5 | 1156.0 | 6 |
| pair2-hint / replay | 188 | 16.7 | 16.7 | 16.7 | 16.8 | 0 / 0 / 0 | 1037.7 | 1110.4 | 7 |
| pair2-original / first | 188 | 16.7 | 16.7 | 16.7 | 16.8 | 0 / 0 / 0 | 505.7 | 556.2 | 197 |
| pair2-original / replay | 188 | 16.7 | 16.7 | 16.8 | 16.8 | 0 / 0 / 0 | 440.0 | 475.3 | 196 |

The four native runs do not reproduce the sustained ~33 ms Android pattern. Their first and replay rAF windows all have mean �16.7 ms and zero gaps =25 ms. The N-glyph draw and native callback distributions are separate fields in `measurements.json`.

The hint increases main-thread CPU in both native pairs and both boots. Original CPU spans range from 440.0 to 507.8 ms per 3150 ms text window. Hint spans range from 943.8 to 1270.2 ms. Raster submissions fall from 196�197 to 6�7 per window. The largest non-idle JS leaf sample is Three.js `texSubImage2D` wrapper `xe` in the exact built engine chunk. Hint samples concentrate much more time at that upload boundary. This supports a changed raster/upload path with higher host CPU cost on this backend. It does not isolate native conversion, transfer, queue wait, or GPU execution within that call. CPU samples are statistical. The raw trace retains their call trees.

Main task thread-CPU uses native `tdur`. Main wall uses `dur`. Nested FunctionCall, raster, scheduler, flush, and link totals are listed independently. Do not add them together. GPU-service raster duration is native service execution, not GPU hardware completion. A completed JS callback, texture submission, or program-status query does not establish completed GPU rendering.

## Browser presentation feedback

The traces include renderer `AnimationFrame::Presentation`, `FramePresented`, compositor pipeline, swap, and frame-displayed events. The following table uses the renderer�s presentation feedback for this page. It does not use other tabs� browser events. Headless Chrome produces this feedback for its virtual compositor. No optical measurement or physical swap-chain display timestamp exists here.

| Run / boot | n | mean | p50 | p95 | max | =25 / =42 / =100 |
| --- | --- | --- | --- | --- | --- | --- |
| network-hint / 1 | 188 | 16.7 | 16.7 | 16.7 | 16.7 | 0 / 0 / 0 |
| network-hint / 2 | 187 | 16.8 | 16.7 | 16.7 | 33.3 | 1 / 0 / 0 |
| pair1-hint / 1 | 188 | 16.7 | 16.7 | 16.7 | 16.7 | 0 / 0 / 0 |
| pair1-hint / 2 | 188 | 16.7 | 16.7 | 16.7 | 16.7 | 0 / 0 / 0 |
| pair1-original / 1 | 188 | 16.7 | 16.7 | 16.7 | 16.7 | 0 / 0 / 0 |
| pair1-original / 2 | 188 | 16.7 | 16.7 | 16.7 | 16.7 | 0 / 0 / 0 |
| pair2-hint / 1 | 188 | 16.7 | 16.7 | 16.7 | 16.7 | 0 / 0 / 0 |
| pair2-hint / 2 | 188 | 16.7 | 16.7 | 16.7 | 16.7 | 0 / 0 / 0 |
| pair2-original / 1 | 183 | 17.0 | 16.7 | 16.7 | 50.0 | 3 / 1 / 0 |
| pair2-original / 2 | 188 | 16.7 | 16.7 | 16.7 | 16.7 | 0 / 0 / 0 |

The second native original first boot has one ~50 ms virtual presentation gap, plus two smaller missed intervals. Its rAF cadence remains regular. That shows why rAF alone cannot prove presentation. One outlier in two native pairs does not establish a reliable hint benefit. All other native presentation windows have ~16.7 ms maximum gaps. The unpaired network hint replay has one ~33.3 ms virtual presentation gap.

## Lantern and radio

The first native baseline has no interaction trace because the fixed click coordinates came from its completed proof image. The other three native sessions contain trusted lantern selection, Candle selection, panel close, radio selection/open, and close. This provides one matched native interaction pair and one extra hint sample. Radio audio policy, the player, and YouTube requests remain active. No iframe pause or hidden audio fix occurs.

| Run / action | Panel DOM after input | rAF p95 / max | Largest main task | Main tasks =50 ms |
| --- | --- | --- | --- | --- |
| pair1-hint / lantern | 27.9 | 16.8 / 33.3 | 37.1 | 0 |
| pair1-hint / close-lantern | 276.6 | 16.8 / 16.8 | 4.2 | 0 |
| pair1-hint / clock | 40.6 | 16.8 / 83.3 | 54.6 | 1 |
| pair1-hint / close-clock | 277.9 | 16.7 / 16.8 | 4.2 | 0 |
| pair2-hint / lantern | 24.8 | 16.7 / 33.4 | 40.5 | 0 |
| pair2-hint / close-lantern | 280.6 | 16.7 / 16.8 | 3.6 | 0 |
| pair2-hint / clock | 43.2 | 16.7 / 83.3 | 53.4 | 1 |
| pair2-hint / close-clock | 280.6 | 16.8 / 16.8 | 5.1 | 0 |
| pair2-original / lantern | 26.9 | 16.8 / 16.8 | 28.1 | 0 |
| pair2-original / close-lantern | 272.5 | 16.7 / 16.8 | 3.5 | 0 |
| pair2-original / clock | 45.2 | 16.8 / 66.6 | 45.5 | 0 |
| pair2-original / close-clock | 276.3 | 16.7 / 16.8 | 3.4 | 0 |

Lantern panel DOM appears about 25�28 ms after automation input. Radio panel DOM appears about 41�45 ms after input. Panel DOM insertion is not panel-transition completion. Closing removes the panel after about 260�281 ms. Each input-aligned native window lasts 1200 ms. The clean camera tween requests 1.1 seconds on focus and 1.0 second on return. These source durations define the camera analysis interval. No external camera matrix or completed physical camera pose is measured.

Radio opening has 66.6 ms maximum rAF gaps in the original and 83.3 ms gaps in both hint runs. Main tasks reach 45.5 ms in the original and 53.4�54.6 ms in the hints. The longest task contains render callbacks and synchronous GetProgramiv / WaitForCmd / WaitForGetOffset spans. Individual query/wait spans reach 9.3�11.6 ms. That task consumes only about 16.7�17.2 ms of trace thread CPU despite its 45�55 ms wall duration. Do not call the rest GPU execution. It includes native wait and scheduling. Later tasks evaluate player scripts.

The radio requests `/api/stations`, YouTube iframe API, widget script, and a youtube-nocookie embed in each interaction recording. Raw Network events retain responses, failures, cancellations, and third-party behavior. `radio-native-detail.json` aligns these requests with input and task children. The screen-canvas option changes neither the clock-canvas context nor panel construction. These few samples do not establish that the hint causes the interaction difference. They do establish that residual radio stalls remain. No missed-click conclusion follows from these runs.

## Limits and recommendation

Retain only the clean one-option hint as a limited review candidate. The previous affected-device evidence favors it, but that evidence is not pooled into these samples. The owned Chrome evidence shows smooth text on both variants and a repeatable main-thread cost increase with the hint. It does not justify caches, new rendering architecture, a general speedup claim, or production acceptance.

The missing measurement for the actual Android cause is a native trace from the affected Adreno renderer that links text drawing and upload, GPU queue execution, compositor scheduling, and actual display presentation. These Windows traces cannot supply it. No new user-file matrix is requested. The valid CPU comparison remains missing because trace completion failed. The valid network comparison remains missing for the same reason. The unpaired network hint loads later (START DOM 2855.4 ms), then draws text at regular ~16.7 ms intervals. That distinguishes its loading delay from sustained loaded-text stutter, but proves no comparative network effect.

All owned browsers report exit code 0. The harness stops its owned Vite process after each run. Proof screenshots occur only after measured traces. No deployment, account, dependency, system, source, checkout, or Git change occurs. No approval refusal occurs. Artifact writes and authorized local execution use narrow Auto-review escalation after the sandbox denies `.agents` writes.
